#!/usr/bin/env python3
"""Hand corrections for scene masks the segmentation model cannot see.

Night windows that only show reflections, or panes full of white overcast, are not labelled as
windows. Here they are drawn as polygons (normalised image coordinates) or derived from depth.

usage: python mask-overrides.py <maps-dir>
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw

W, H = 1024, 576

RULES = {
    # Icelandic lodge: everything seen through the panes is far away, so depth finds the glass
    "mountain-cabin__lodge": {"glass_from_depth": (0.17, 0.07)},
    # night cabin: dark panes on the left, the glass door and the clerestory window
    "fireplace-rain__cabin-night": {
        "glass_polys": [
            [(0.0, 0.15), (0.216, 0.215), (0.216, 0.535), (0.0, 0.665)],
            [(0.316, 0.27), (0.372, 0.272), (0.372, 0.52), (0.316, 0.52)],
            [(0.318, 0.0), (0.376, 0.0), (0.376, 0.165), (0.318, 0.165)],
            [(0.862, 0.30), (0.905, 0.29), (0.905, 0.50), (0.862, 0.50)],
        ],
        "exclude_near": 0.58,
    },
}


def poly_mask(polys):
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)
    for p in polys:
        d.polygon([(x * W, y * H) for x, y in p], fill=255)
    return np.asarray(im, dtype=np.float32) / 255


def main(maps_dir):
    for key, rule in RULES.items():
        folder = os.path.join(maps_dir, key)
        if not os.path.exists(os.path.join(folder, "maps-b.png")):
            continue
        b = np.asarray(Image.open(os.path.join(folder, "maps-b.png")).convert("RGB"), dtype=np.float32) / 255
        c = np.asarray(Image.open(os.path.join(folder, "maps-c.png")).convert("RGB"), dtype=np.float32) / 255
        depth = c[..., 2]
        glass = b[..., 0]
        if "glass_from_depth" in rule:
            hi, lo = rule["glass_from_depth"]
            glass = np.maximum(glass, np.clip((hi - depth) / (hi - lo), 0, 1))
        if "glass_polys" in rule:
            m = poly_mask(rule["glass_polys"])
            if "exclude_near" in rule:
                m *= 1 - np.clip((depth - rule["exclude_near"]) / 0.08, 0, 1)
            glass = np.maximum(glass, m)
        b[..., 0] = glass
        Image.fromarray((b * 255 + 0.5).astype(np.uint8)).save(os.path.join(folder, "maps-b.png"), optimize=True)
        print(key, "glass coverage", round(float(glass.mean()), 3))
        # keep stats in step so the app knows this place has a window
        import json
        sp = os.path.join(folder, "stats.json")
        st = json.load(open(sp))
        st["coverage"]["glass"] = round(float(glass.mean()), 4)
        json.dump(st, open(sp, "w"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1])
