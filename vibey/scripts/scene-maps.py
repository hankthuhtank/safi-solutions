#!/usr/bin/env python3
"""Vibey scene maps: 16:9 master crop, depth map and semantic masks for one photo.

Models (downloaded from Hugging Face on first run):
  depth  depth-anything/Depth-Anything-V2-Small-hf   Apache-2.0
  masks  shi-labs/oneformer_ade20k_swin_large        MIT

usage: python scene-maps.py <source.jpg> <out_dir> [--focus-y 0.5] [--focus-x 0.5] [--zoom 1.0]
writes  out_dir/master.jpg   3840x2160 (16:9 crop, Lanczos)
        out_dir/maps-a.png   1024x576 RGB = sky, water, foliage
        out_dir/maps-b.png   1024x576 RGB = glass, lights, fire
        out_dir/maps-c.png   1024x576 RGB = ground, people, depth (255 = nearest)
        (RGB only: browsers may premultiply decoded PNG alpha, which would destroy data under alpha 0)
        out_dir/stats.json   colour and coverage statistics used to tune effects
"""
import argparse, json, os
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # ESO and Webb originals are far larger than the default decompression-bomb limit

W, H = 3840, 2160
MW, MH = 1024, 576

GROUPS = {
    "sky": ["sky"],
    "water": ["water", "sea", "river", "lake", "waterfall", "pool", "fountain"],
    "foliage": ["tree", "grass", "plant", "flower", "palm"],
    "glass": ["windowpane", "screen door"],
    "lights": ["lamp", "light", "chandelier", "sconce", "streetlight", "signboard", "traffic light", "candlestick"],
    "fire": ["fireplace", "stove"],
    "ground": ["floor", "road", "sidewalk", "earth", "sand", "path", "field", "dirt track", "runway"],
    "people": ["person"],
}


def crop_master(src, focus_x, focus_y, zoom):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    target = W / H
    cw, ch = (w, w / target) if w / h < target else (h * target, h)
    cw, ch = cw / zoom, ch / zoom
    x0 = min(max(0, focus_x * w - cw / 2), w - cw)
    y0 = min(max(0, focus_y * h - ch / 2), h - ch)
    box = tuple(int(round(v)) for v in (x0, y0, x0 + cw, y0 + ch))
    return im.crop(box).resize((W, H), Image.LANCZOS), dict(source=[w, h], crop=list(box))


def box_filter(a, r):
    # mean over a (2r+1)^2 window via integral image, edges handled by clamping
    pad = np.pad(a, ((r + 1, r), (r + 1, r)), mode="edge")
    c = pad.cumsum(0).cumsum(1)
    s = c[2 * r + 1:, 2 * r + 1:] - c[:-2 * r - 1, 2 * r + 1:] - c[2 * r + 1:, :-2 * r - 1] + c[:-2 * r - 1, :-2 * r - 1]
    return s / float((2 * r + 1) ** 2)


def guided(guide, src, r=6, eps=1e-3):
    """He et al. guided filter: snaps a soft mask to the photo's edges."""
    mI, mp = box_filter(guide, r), box_filter(src, r)
    cov = box_filter(guide * src, r) - mI * mp
    var = box_filter(guide * guide, r) - mI * mI
    a = cov / (var + eps)
    b = mp - a * mI
    return box_filter(a, r) * guide + box_filter(b, r)


_MODELS = {}


def load(kind):
    if kind not in _MODELS:
        if kind == "depth":
            from transformers import AutoImageProcessor, AutoModelForDepthEstimation
            name = "depth-anything/Depth-Anything-V2-Small-hf"
            _MODELS[kind] = (AutoImageProcessor.from_pretrained(name), AutoModelForDepthEstimation.from_pretrained(name).eval())
        else:
            from transformers import OneFormerProcessor, OneFormerForUniversalSegmentation
            name = "shi-labs/oneformer_ade20k_swin_large"
            _MODELS[kind] = (OneFormerProcessor.from_pretrained(name), OneFormerForUniversalSegmentation.from_pretrained(name).eval())
    return _MODELS[kind]


def depth_map(master):
    import torch
    proc, model = load("depth")
    img = master.resize((1036, 588), Image.BICUBIC)
    inputs = proc(images=img, return_tensors="pt", do_resize=False)
    with torch.no_grad():
        d = model(**inputs).predicted_depth[0].numpy()
    d = np.array(Image.fromarray(d.astype(np.float32)).resize((MW, MH), Image.BICUBIC))
    lo, hi = np.percentile(d, 1), np.percentile(d, 99.5)
    d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
    g = np.asarray(master.resize((MW, MH), Image.BILINEAR).convert("L"), dtype=np.float32) / 255
    return np.clip(guided(g, d, r=4, eps=2e-3), 0, 1)


def semantic(master):
    import torch
    proc, model = load("seg")
    img = master.resize((1280, 720), Image.BICUBIC)
    inputs = proc(images=img, task_inputs=["semantic"], return_tensors="pt")
    with torch.no_grad():
        out = model(**inputs)
    cls = out.class_queries_logits[0].softmax(-1)[:, :-1]          # queries x classes
    masks = out.masks_queries_logits[0].sigmoid()                   # queries x h x w
    seg = torch.einsum("qc,qhw->chw", cls, masks)                   # classes x h x w
    seg = torch.nn.functional.interpolate(seg[None], size=(MH, MW), mode="bilinear", align_corners=False)[0]
    seg = seg / seg.sum(0, keepdim=True).clamp(min=1e-6)
    labels = {i: l.split(",")[0].strip().lower() for i, l in model.config.id2label.items()}
    return seg.numpy(), labels


def group_masks(seg, labels, guide):
    out = {}
    for g, names in GROUPS.items():
        idx = [i for i, l in labels.items() if l in names]
        m = seg[idx].sum(0) if idx else np.zeros(seg.shape[1:], np.float32)
        m = np.clip((m - 0.15) / 0.55, 0, 1)                        # probabilities -> confident soft mask
        out[g] = np.clip(guided(guide, m.astype(np.float32), r=5, eps=1e-3), 0, 1)
    return out


def to_png(arrs, path):
    chans = [Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)) for a in arrs]
    (Image.merge("RGB", chans) if len(chans) == 3 else chans[0]).save(path, optimize=True)


def stats(master, masks, depth):
    small = np.asarray(master.resize((MW, MH), Image.BILINEAR), dtype=np.float32) / 255
    s = {"coverage": {k: round(float(v.mean()), 4) for k, v in masks.items()}}
    def mean_col(w):
        tot = w.sum()
        return [round(float((small[..., c] * w).sum() / tot), 4) for c in range(3)] if tot > 50 else None
    sky = masks["sky"]
    s["skyColor"] = mean_col(sky)
    s["horizonColor"] = None
    if (sky > 0.5).sum() > 200:
        ys = np.where(sky > 0.5)[0]
        cut = np.percentile(ys, 70)
        rows = (np.arange(MH)[:, None] >= cut).astype(np.float32)
        s["horizonColor"] = mean_col(sky * rows)
    s["farColor"] = mean_col((depth < 0.25).astype(np.float32))
    s["meanColor"] = [round(float(small[..., c].mean()), 4) for c in range(3)]
    s["luma"] = round(float((small @ [0.2126, 0.7152, 0.0722]).mean()), 4)
    return s


def process(src, out, focus_x=0.5, focus_y=0.5, zoom=1.0, masks_on=True):
    os.makedirs(out, exist_ok=True)
    master, crop = crop_master(src, focus_x, focus_y, zoom)
    master.save(os.path.join(out, "master.jpg"), quality=95, subsampling=0)
    depth = depth_map(master)
    guide = np.asarray(master.resize((MW, MH), Image.BILINEAR).convert("L"), dtype=np.float32) / 255
    if masks_on:
        seg, labels = semantic(master)
        masks = group_masks(seg, labels, guide)
    else:
        masks = {g: np.zeros((MH, MW), np.float32) for g in GROUPS}
    to_png([masks["sky"], masks["water"], masks["foliage"]], os.path.join(out, "maps-a.png"))
    to_png([masks["glass"], masks["lights"], masks["fire"]], os.path.join(out, "maps-b.png"))
    to_png([masks["ground"], masks["people"], depth], os.path.join(out, "maps-c.png"))
    st = stats(master, masks, depth)
    st["crop"] = crop
    json.dump(st, open(os.path.join(out, "stats.json"), "w"), indent=1)
    return st


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", help="source image, or a JSON list of jobs {src,out,focusX,focusY,zoom,masks}")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--focus-x", type=float, default=0.5)
    ap.add_argument("--focus-y", type=float, default=0.5)
    ap.add_argument("--zoom", type=float, default=1.0)
    ap.add_argument("--no-masks", action="store_true")
    a = ap.parse_args()
    if a.src.endswith(".json"):
        for job in json.load(open(a.src)):
            if os.path.exists(os.path.join(job["out"], "stats.json")) and not job.get("force"):
                continue
            st = process(job["src"], job["out"], job.get("focusX", 0.5), job.get("focusY", 0.5), job.get("zoom", 1.0), job.get("masks", True))
            print(job["out"], json.dumps(st["coverage"]), flush=True)
    else:
        print(json.dumps(process(a.src, a.out, a.focus_x, a.focus_y, a.zoom, not a.no_masks)))


if __name__ == "__main__":
    main()
