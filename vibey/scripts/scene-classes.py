#!/usr/bin/env python3
"""Second look at each photograph: the classes wind and rain need, and the maps made from them.

scene-maps.py groups the segmentation into broad masks (sky, water, foliage, ...). Two effects need
finer distinctions:

- wind: trees bend from the roots up, so the top of a crown swings and the trunk does not; grass
  does not bend as a sheet, it ripples. Foliage as one mask can only wobble.
- rain on glass: drops belong on the windowpanes, not on the sofa in front of them.

usage: python scene-classes.py <maps-dir> [key ...] [--reuse]
  --reuse   skip the segmentation model when classes.npz already exists (to iterate on the maps)

per folder (scene__variation) it writes
  classes.npz   per-class probabilities (uint8, 1024x576) for the classes below
  maps-d.png    R  bend: how far a pixel swings when its tree bends, 0 at the roots and 1 at the top
                   of a tall crown; carried a short way past the crown into whatever lies behind it
                   (sky, far hills) so the silhouette itself can move
                G  grass, for waves of wind running across a meadow
                B  a random phase for each separate light (lamp, candle, sign), so each one
                   flickers on its own and a single flame never flickers in patches
and replaces the glass channel (R) of maps-b.png with the detected windows. Run mask-overrides.py
afterwards for the panes the model misses.
"""
import importlib.util
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("scene_maps", os.path.join(HERE, "scene-maps.py"))
sm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sm)

MW, MH = sm.MW, sm.MH

# ADE20K classes kept, by name as the model labels them (first synonym)
KEEP = {
    "tree": ["tree", "palm"],
    "plant": ["plant", "flower"],
    "grass": ["grass"],
    "window": ["window", "screen door"],
    "door": ["door", "double door"],
    "seat": ["sofa", "armchair", "chair", "swivel chair", "cushion", "stool", "bench", "ottoman"],
    "table": ["table", "coffee table", "desk", "counter", "kitchen island"],
    "person": ["person"],
    "curtain": ["curtain"],
    "bed": ["bed"],
    "lamp": ["lamp", "chandelier", "sconce"],
}


def soft(p, guide):
    m = np.clip((p - 0.15) / 0.55, 0, 1).astype(np.float32)
    return np.clip(sm.guided(guide, m, r=5, eps=1e-3), 0, 1)


def segment(folder):
    master = Image.open(os.path.join(folder, "master.jpg")).convert("RGB")
    seg, labels = sm.semantic(master)
    out = {}
    for k, names in KEEP.items():
        idx = [i for i, l in labels.items() if l in names]
        p = seg[idx].sum(0) if idx else np.zeros(seg.shape[1:], np.float32)
        out[k] = (np.clip(p, 0, 1) * 255 + 0.5).astype(np.uint8)
    np.savez_compressed(os.path.join(folder, "classes.npz"), **out)
    return {k: v.astype(np.float32) / 255 for k, v in out.items()}


def runs(b, cut=None):
    """For a boolean mask, the length of the vertical run each pixel belongs to and its height above
    the run's lowest pixel. `cut[y]` true ends a run between rows y and y + 1."""
    h, w = b.shape
    cut = np.zeros((h - 1, w), bool) if cut is None else cut
    below = np.zeros((h, w), np.int32)
    above = np.zeros((h, w), np.int32)
    for y in range(h - 1, -1, -1):
        below[y] = np.where(b[y], (below[y + 1] if y + 1 < h else 0) * (1 - cut[y] if y + 1 < h else 1) + 1, 0)
    for y in range(h):
        above[y] = np.where(b[y], (above[y - 1] * (1 - cut[y - 1]) if y > 0 else 0) + 1, 0)
    length = below + above - 1
    height = below - 1
    return length, height


def norm_blur(v, m, sx, sy):
    """Blur v inside mask m without bleeding the outside in (normalised convolution)."""
    num = ndimage.gaussian_filter(v * m, (sy, sx))
    den = ndimage.gaussian_filter(m, (sy, sx))
    return num / np.maximum(den, 1e-4), den


def bend_map(tree, sky, near):
    T = tree > 0.5
    T = ndimage.binary_opening(T, iterations=1)
    Tf = T.astype(np.float32)
    # a maple in front of a wooded hill is its own tree: runs end where the depth of the foliage
    # jumps (sky showing through a crown is not a jump: only tree pixels are compared)
    Tc = ndimage.binary_closing(T, iterations=2) | T
    ns, _ = norm_blur(near, Tc.astype(np.float32), 3, 2)
    g = np.abs(np.diff(np.log(ns + 0.02), axis=0))
    peak = (g >= np.vstack([g[:1], g[:-1]])) & (g >= np.vstack([g[1:], g[-1:]]))
    cut = (g > 0.12) & peak
    length, height = runs(Tc, cut)
    length, height = np.where(T, length, 0), np.where(T, height, 0)
    frac = np.where(T, height / np.maximum(length - 1, 1), 0).astype(np.float32)
    # a tall crown swings further than a shrub; a crown cut by the top of the frame is tall. A long
    # run far away is a hillside of small trees, not one giant, so far runs count as short ones.
    tree_near, _ = norm_blur(near, Tf, 9, 6)
    size = np.clip(np.minimum(length, 4.0 * tree_near * MH) / (0.45 * MH), 0.12, 1.0)
    w = np.where(T, frac ** 1.4 * size, 0).astype(np.float32)
    # one tree moves as one: smooth inside the crowns, more across than down
    w_in, _ = norm_blur(w, Tf, 7, 3)
    # carry the motion a short way past the silhouette, but only into what lies behind the tree
    w_out, cover = norm_blur(w, Tf, 9, 6)
    behind = np.maximum(sky, 0.6 * (near < tree_near - 0.015).astype(np.float32))
    dist = ndimage.distance_transform_edt(~T)
    fall = np.clip(1 - dist / 16.0, 0, 1) ** 1.5
    R = np.where(T, w_in, w_out * behind * fall * (cover > 0.02))
    return np.clip(ndimage.gaussian_filter(R, 1.2), 0, 1).astype(np.float32)


def light_phase(lights):
    """One random phase per separate light, constant across it."""
    lab, n = ndimage.label(ndimage.binary_dilation(lights > 0.35, iterations=2))
    rng = np.random.default_rng(7)
    ph = np.concatenate([[0.0], rng.uniform(0.08, 1.0, n)])[lab]
    return ph.astype(np.float32)


def build(folder, reuse):
    if reuse and os.path.exists(os.path.join(folder, "classes.npz")):
        z = np.load(os.path.join(folder, "classes.npz"))
        P = {k: z[k].astype(np.float32) / 255 for k in z.files}
    else:
        P = segment(folder)
    master = Image.open(os.path.join(folder, "master.jpg")).convert("RGB")
    guide = np.asarray(master.resize((MW, MH), Image.BILINEAR).convert("L"), dtype=np.float32) / 255
    a = np.asarray(Image.open(os.path.join(folder, "maps-a.png")).convert("RGB"), dtype=np.float32) / 255
    c = np.asarray(Image.open(os.path.join(folder, "maps-c.png")).convert("RGB"), dtype=np.float32) / 255
    sky, near = a[..., 0], c[..., 2]

    tree = soft(P["tree"] + 0.6 * P["plant"], guide)
    grass = soft(P["grass"], guide)
    R = bend_map(tree, sky, near)

    b_path = os.path.join(folder, "maps-b.png")
    if not os.path.exists(os.path.join(folder, "maps-b.first.png")):
        Image.open(b_path).save(os.path.join(folder, "maps-b.first.png"))
    b = np.asarray(Image.open(b_path).convert("RGB"), dtype=np.float32) / 255
    sm.to_png([R, grass, light_phase(b[..., 1])], os.path.join(folder, "maps-d.png"))
    glass = soft(P["window"], guide)
    sm.to_png([glass, b[..., 1], b[..., 2]], b_path)

    st_path = os.path.join(folder, "stats.json")
    st = json.load(open(st_path))
    st["coverage"]["glass"] = round(float(glass.mean()), 4)
    st["motion"] = {"trees": round(float(tree.mean()), 4), "grass": round(float(grass.mean()), 4), "bend": round(float(R.mean()), 4)}
    json.dump(st, open(st_path, "w"), indent=1)
    return st["motion"], st["coverage"]["glass"]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    reuse = "--reuse" in sys.argv
    maps_dir, only = args[0], set(args[1:])
    for folder in sorted(os.listdir(maps_dir)):
        path = os.path.join(maps_dir, folder)
        key = folder.replace("__", "/")
        if "__" not in folder or not os.path.exists(os.path.join(path, "maps-a.png")):
            continue
        if only and key not in only:
            continue
        if key.startswith("observatory/") or key == "tokyo-cafe/reflection":
            continue
        motion, glass = build(path, reuse)
        print(f"{key:34} trees {motion['trees']:.3f}  grass {motion['grass']:.3f}  bend {motion['bend']:.3f}  glass {glass:.3f}", flush=True)


if __name__ == "__main__":
    main()
