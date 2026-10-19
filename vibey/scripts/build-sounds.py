#!/usr/bin/env python3
"""Downloads, trims, levels and encodes Vibey's ambient sounds.

    python3 scripts/build-sounds.py <work-dir> [id ...]

Every source is a Freesound recording under CC0 or CC BY (scripts/sound-sources.json). Long field
recordings become one seamless stereo loop, cut from their steadiest stretch so a cough or a
bumped microphone never repeats every two minutes; short sounds (thunder, owls, page turns) are
split into separate one-shots. Loops are levelled to the same loudness so mixer levels mean the
same thing for every sound, then everything is encoded as MP3, which every browser plays.
Writes media/sounds/*.mp3 and media/sounds/manifest.json (files, durations and credits).
"""
import json, os, re, subprocess, sys, time, urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "media", "sounds")
SR = 44100
UA = "VibeyAssetBot/1.0 (+https://www.safisolutions.org/vibey/)"
LOOP_LUFS = -21.0


def fetch(url, binary=True):
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=90) as r:
                data = r.read()
            time.sleep(3.0)  # be gentle: Freesound throttles bulk downloads
            return data if binary else data.decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001 - retry anything transient
            if attempt == 5:
                raise
            print(f"  retry {url}: {e}")
            time.sleep(6 * (attempt + 1))


def candidates(work):
    """Search results saved earlier: id -> record with user, title, licence, preview url."""
    found = {}
    dl = os.path.join(os.path.dirname(work), "dl")
    for d in sorted(os.listdir(dl)) if os.path.isdir(dl) else []:
        p = os.path.join(dl, d, "candidates.json")
        if d.startswith("s-") and os.path.exists(p):
            for c in json.load(open(p)):
                if "id" in c:
                    found.setdefault(c["id"], c)
    return found


def licence(work, fs_id, rec):
    cache = os.path.join(work, "sounds", "pages", f"{fs_id}.html")
    if not os.path.exists(cache):
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        open(cache, "w").write(fetch(rec["page"], binary=False))
    page = open(cache).read()
    m = re.search(r"creativecommons\.org/(publicdomain/zero/1\.0|licenses/by/(\d\.\d))", page)
    if not m:
        raise SystemExit(f"no licence link found for {fs_id}")
    if m.group(1).startswith("publicdomain"):
        return "CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/"
    return f"CC BY {m.group(2)}", f"https://creativecommons.org/licenses/by/{m.group(2)}/"


def decode(path, channels=2):
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", str(channels), "-ar", str(SR), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, channels).copy()


def envelope_db(x, block, hop):
    mono = x.mean(axis=1)
    n = max(1, (len(mono) - block) // hop + 1)
    idx = np.arange(n)[:, None] * hop + np.arange(block)[None, :]
    rms = np.sqrt((mono[idx] ** 2).mean(axis=1) + 1e-12)
    return 20 * np.log10(rms)


def loudness(x):
    """Integrated loudness (EBU R128) via ffmpeg, in LUFS."""
    p = subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-f", "f32le", "-ac", str(x.shape[1]), "-ar", str(SR), "-i", "-",
         "-af", "ebur128=framelog=quiet", "-f", "null", "-"],
        input=x.astype(np.float32).tobytes(), capture_output=True,
    )
    m = re.findall(r"I:\s+(-?[0-9.]+) LUFS", p.stderr.decode())
    return float(m[-1]) if m else -70.0


def steadiest(x, length, steady=True):
    """Start sample of the stretch with the fewest sudden jumps (bumps, coughs, door slams)."""
    hop = SR // 5
    env = envelope_db(x, int(SR * 0.4), hop)
    win = int(length * 5)
    if len(env) <= win:
        return 0
    edge = 5  # skip the first and last second, where handling noise lives
    best, best_score = edge, 1e9
    gmed = np.median(env)
    for s in range(edge, len(env) - win - edge, 5):
        w = env[s : s + win]
        med = np.median(w)
        spikes = (w > med + (12 if not steady else 9)).sum()
        score = (w.std() if steady else 0.4 * w.std()) + 1.5 * spikes + abs(med - gmed) / 4
        if score < best_score:
            best, best_score = s, score
    return best * hop


def make_loop(x, length, xfade):
    """Cut length+xfade seconds and fold the tail over the head: the end runs straight into the start."""
    n, f = int(length * SR), int(xfade * SR)
    seg = x[: n + f].copy()
    if f > 0 and len(seg) == n + f:
        t = np.linspace(0, np.pi / 2, f, dtype=np.float32)[:, None]
        head = seg[:f] * np.sin(t)
        tail = seg[n : n + f] * np.cos(t)
        seg = seg[: n].copy()
        seg[:f] = head + tail
    else:
        seg = seg[:n]
    return seg


def fade(x, fin, fout):
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a, dtype=np.float32)[:, None]
    if b:
        x[-b:] *= np.linspace(1, 0, b, dtype=np.float32)[:, None] ** 2
    return x


def events(x, gap, maxlen, n):
    """Split a recording into its loudest separate calls/hits."""
    hop = SR // 100
    env = envelope_db(x, int(SR * 0.03), hop)
    floor = np.percentile(env, 20)
    top = np.percentile(env, 99)
    thr = floor + max(8.0, (top - floor) * 0.42)
    on = env > thr
    segs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and (on[j] or (j + int(gap * 100) < len(on) and on[j : j + int(gap * 100)].any())):
                j += 1
            segs.append([i, j])
            i = j
        else:
            i += 1
    out = []
    for s, e in segs:
        # let each event ring out until it sinks back toward the floor
        while e < len(env) - 1 and env[e] > floor + 5 and (e - s) < maxlen * 100:
            e += 1
        s = max(0, s - 12)
        e = min(len(env) - 1, max(e, s + 30), s + int(maxlen * 100))
        peak = env[s:e].max()
        out.append((peak, s * hop, e * hop + int(SR * 0.03)))
    out.sort(key=lambda t: -t[0])
    picked = []
    for peak, s, e in out:
        if all(e <= ps or s >= pe for _, ps, pe in picked):
            picked.append((peak, s, e))
        if len(picked) >= n:
            break
    return [(s, e) for _, s, e in sorted(picked, key=lambda t: t[1])]


def trim_quiet(x, maxlen):
    hop = SR // 100
    env = envelope_db(x, int(SR * 0.03), hop)
    floor = np.percentile(env, 10)
    loud = np.where(env > floor + 6)[0]
    if not len(loud):
        return x[: int(maxlen * SR)]
    s = max(0, loud[0] - 10) * hop
    e = min(len(x), (loud[-1] + 40) * hop, s + int(maxlen * SR))
    return x[s:e]


def encode(x, path, mono, quality=4, hp=28):
    ch = 1 if mono else 2
    if mono and x.shape[1] == 2:
        x = x.mean(axis=1, keepdims=True)
    subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-i", "-",
         "-af", f"highpass=f={hp}:poles=2,alimiter=limit=0.94:level=disabled:attack=3:release=60",
         "-c:a", "libmp3lame", "-q:a", str(quality), path],
        input=x.astype(np.float32).tobytes(), check=True,
    )


def main():
    work = sys.argv[1]
    only = set(sys.argv[2:])
    spec = json.load(open(os.path.join(ROOT, "scripts", "sound-sources.json")))
    spec.pop("_doc", None)
    recs = candidates(work)
    raw_dir = os.path.join(work, "sounds", "raw")
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    man_path = os.path.join(OUT, "manifest.json")
    manifest = json.load(open(man_path)) if os.path.exists(man_path) else {}

    failed = []
    for sid, s in spec.items():
        if only and sid not in only:
            continue
        try:
            build_one(sid, s, recs, raw_dir, work, manifest, man_path)
        except Exception as e:  # noqa: BLE001 - one unreachable source should not stop the rest
            print(f"{sid:12} FAILED: {e}")
            failed.append(sid)
    if failed:
        print("failed:", " ".join(failed))
        sys.exit(1)


def build_one(sid, s, recs, raw_dir, work, manifest, man_path):
    """Download (if needed), cut, level and encode one sound, then record it in the manifest."""
    credits, srcs = [], []
    for fs_id in s["fs"]:
        rec = recs.get(fs_id)
        if not rec:
            raise SystemExit(f"{sid}: no search record for freesound {fs_id}")
        path = os.path.join(raw_dir, f"{fs_id}.ogg")
        if not os.path.exists(path):
            open(path + ".part", "wb").write(fetch(rec["mp3"].replace("-lq.mp3", "-hq.ogg")))
            os.replace(path + ".part", path)
        name, url = licence(work, fs_id, rec)
        credits.append(dict(title=rec["title"], author=rec["user"], license=name, licenseUrl=url, page=rec["page"]))
        srcs.append(path)

    files, durs = [], []
    if s["mode"] == "loop":
        x = decode(srcs[0])
        length = min(s["len"], len(x) / SR - 3.5)
        xf = s.get("xfade", 3.0)
        st = steadiest(x, length + xf, s.get("steady", True))
        loop = make_loop(x[st:], length, xf)
        if s.get("xfade", 3.0) == 0:
            loop = fade(loop, 0.02, 0.02)
        gain = 10 ** ((LOOP_LUFS - loudness(loop)) / 20)
        loop = loop * gain
        fn = f"{sid}.mp3"
        encode(loop, os.path.join(OUT, fn), s.get("mono", False), hp=s.get("hp", 28))
        files.append(fn)
        durs.append(round(len(loop) / SR, 2))
        print(f"{sid:12} loop {length:5.1f}s from {st / SR:6.1f}s  gain {20 * np.log10(gain):+5.1f} dB")
    else:
        k = 0
        for path in srcs:
            x = decode(path)
            if s["mode"] == "whole":
                pieces = [trim_quiet(x, s["max"])]
            else:
                pieces = [x[a:b] for a, b in events(x, s["gap"], s["max"], s["n"])]
            for p in pieces:
                if len(p) < SR * s.get("minlen", 0.15):
                    continue
                p = fade(p, 0.008, min(0.6, len(p) / SR * 0.2))
                peak = np.abs(p).max() + 1e-9
                p = p * (10 ** (-3 / 20) / peak)
                k += 1
                fn = f"{sid}-{k}.mp3"
                encode(p, os.path.join(OUT, fn), not s.get("stereo", False), quality=3, hp=s.get("hp", 28))
                files.append(fn)
                durs.append(round(len(p) / SR, 2))
        print(f"{sid:12} {s['mode']:6} {len(files)} one-shots  {', '.join(f'{d:.1f}s' for d in durs)}")
    manifest[sid] = dict(files=files, durations=durs, credits=credits)
    json.dump(dict(sorted(manifest.items())), open(man_path, "w"), indent=1)


if __name__ == "__main__":
    main()
