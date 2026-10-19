// Picks the right file for the screen and decodes it off the main thread where the browser allows.

export interface VariationMedia {
  kind: "photo" | "video";
  dir: string; // absolute url path of the variation folder
  widths: number[];
  maps: boolean;
  glass?: boolean; // the maps include a window region
  motion?: boolean; // maps-d.png: tree bend, grass and per-light flicker phase
  aspect: number;
  lqip?: string;
  video?: { av1?: string; hevc?: string; h264?: string; width: number; height: number };
}

let avifSupport: Promise<boolean> | null = null;

export function supportsAvif(): Promise<boolean> {
  if (!avifSupport) {
    avifSupport = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0);
      img.onerror = () => resolve(false);
      // 2x2 grey AVIF
      img.src =
        "data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAImlsb2MAAAAAREAAAQABAAAAAAD6AAEAAAAAAAAAFgAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAebWRhdBIACgc4ADYQENBpMgkYAAooooQABUg=";
    });
  }
  return avifSupport;
}

export function pickWidth(widths: number[], needed: number) {
  const sorted = [...widths].sort((a, b) => a - b);
  for (const w of sorted) if (w >= needed * 0.92) return w;
  return sorted[sorted.length - 1];
}

export async function imageUrl(m: VariationMedia, needed: number) {
  const w = pickWidth(m.widths, needed);
  const avif = await supportsAvif();
  // WebP copies stop at 2560; AVIF is required for the 3840 frame
  if (avif) return `${m.dir}/${w}.avif`;
  return `${m.dir}/${Math.min(w, 2560)}.webp`;
}

export type Decoded = ImageBitmap | HTMLImageElement;

export async function decodeImage(url: string, signal?: AbortSignal): Promise<Decoded> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${res.status} loading ${url}`);
  const blob = await res.blob();
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
    } catch {
      // fall through to an <img> decode (older Safari)
    }
  }
  const img = new Image();
  const objectUrl = URL.createObjectURL(blob);
  try {
    img.src = objectUrl;
    await img.decode();
    return img;
  } finally {
    // the decoded image keeps its pixels; the blob url is no longer needed
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  }
}

export function sizeOf(d: Decoded) {
  return "naturalWidth" in d ? { w: d.naturalWidth, h: d.naturalHeight } : { w: d.width, h: d.height };
}

export function release(d: Decoded | null | undefined) {
  if (d && "close" in d) d.close();
}

/** A muted, looping, inline video element that the renderer samples as a texture. */
export function makeVideo(sources: { src: string; type: string }[]) {
  const v = document.createElement("video");
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = "auto";
  v.crossOrigin = "anonymous";
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  for (const s of sources) {
    if (s.type && !v.canPlayType(s.type)) continue;
    const el = document.createElement("source");
    el.src = s.src;
    el.type = s.type;
    v.appendChild(el);
  }
  return v;
}

export function waitForVideo(v: HTMLVideoElement, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (v.readyState >= 2) return resolve();
    const done = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error("The video could not be loaded"));
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("aborted", "AbortError"));
    };
    const cleanup = () => {
      v.removeEventListener("loadeddata", done);
      v.removeEventListener("error", fail);
      signal?.removeEventListener("abort", abort);
    };
    v.addEventListener("loadeddata", done);
    v.addEventListener("error", fail);
    signal?.addEventListener("abort", abort);
    v.load();
  });
}

export function disposeVideo(v: HTMLVideoElement | null | undefined) {
  if (!v) return;
  v.pause();
  v.removeAttribute("src");
  while (v.firstChild) v.removeChild(v.firstChild);
  v.load();
}
