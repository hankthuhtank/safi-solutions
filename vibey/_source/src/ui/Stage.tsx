import { useEffect, useMemo, useRef, useState } from "react";
import { Renderer, type RendererStats } from "../engine/visual/Renderer";
import { imageUrl, type VariationMedia } from "../engine/visual/media";
import { ambience } from "../engine/audio/Ambience";
import { touchSound } from "../engine/audio/touchSounds";
import type { TouchKind } from "../engine/visual/touch";
import { MANIFEST, SCENES, resolveFx } from "../data/scenes";
import type { Fx, Quality, Variation } from "../types";
import { getState, sceneOf, useStore } from "../state/store";
import { useMedia } from "./hooks";

const MEDIA = "/vibey/media/scenes/";

export function mediaFor(v: Variation): VariationMedia {
  const m = MANIFEST[v.dir];
  const dir = MEDIA + v.dir;
  return {
    kind: m.kind,
    dir,
    widths: m.widths,
    maps: m.maps,
    glass: m.glass,
    motion: m.motion,
    aspect: m.aspect,
    lqip: m.lqip,
    video: m.video
      ? {
          av1: m.video.av1 && `${dir}/${m.video.av1}`,
          hevc: m.video.hevc && `${dir}/${m.video.hevc}`,
          h264: m.video.h264 && `${dir}/${m.video.h264}`,
          width: m.video.width,
          height: m.video.height,
        }
      : undefined,
  };
}

export const thumbOf = (v: Variation) => `${MEDIA}${v.dir}/thumb.webp`;
/** Night versions share their photograph with the day: grade the thumbnail to match. */
export const thumbClass = (v: Variation) => ((v.fx.night ?? 0) >= 0.5 ? "thumb-night" : undefined);

/** Renderer stats for the settings readout, outside React state so frames do not re-render. */
export const rendererStats = {
  current: null as RendererStats | null,
  listeners: new Set<() => void>(),
};

/** Warm the cache with the stations either side of this one, so turning the dial feels instant. */
function prefetchNeighbours(key: string) {
  const i = SCENES.findIndex((s) => key.startsWith(`${s.id}/`));
  if (i < 0) return;
  const run = () => {
    for (const d of [1, -1]) {
      const v = SCENES[(i + d + SCENES.length) % SCENES.length].variations[0];
      const m = mediaFor(v);
      if (m.kind === "video") continue;
      const need = Math.min(window.innerWidth * (window.devicePixelRatio || 1), 3840);
      void imageUrl(m, need).then((url) => fetch(url, { priority: "low" } as RequestInit).catch(() => {}));
    }
  };
  if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}

export function autoQuality(): Quality {
  const dpr = window.devicePixelRatio || 1;
  const px = screen.width * screen.height * dpr * dpr;
  const cores = navigator.hardwareConcurrency || 4;
  const coarse = matchMedia("(pointer: coarse)").matches;
  if (coarse && cores <= 4) return "performance";
  if (!coarse && cores >= 8 && px >= 5.5e6) return "ultra";
  return "balanced";
}

/** Reduced motion keeps the weather but stops the camera and the lightning flashes. */
export function motionSafe(fx: Fx, reduced: boolean): Fx {
  if (!reduced) return fx;
  return { ...fx, drift: 0, zoom: 0, lightning: 0, meteors: Math.min(fx.meteors, 0.2) };
}

export function useReducedMotion() {
  const pref = useStore((s) => s.settings.motion);
  const system = useMedia("(prefers-reduced-motion: reduce)");
  return pref === "reduced" || (pref === "auto" && system);
}

/** The word that appears by the pointer, naming what the picture will answer with. */
const TOUCH_LABEL: Record<TouchKind, string | null> = {
  water: "Water",
  deep: "Water",
  sky: "Sky",
  foliage: "Branches",
  light: "Light",
  fire: "Fire",
  glass: "Wet glass",
  space: "Stars",
  ground: null,
};

/** What can be touched in a picture, for the slate: read off the same maps the engine uses. */
export function touchables(variation: Variation, fx: Fx): string[] {
  const m = MANIFEST[variation.dir];
  if (!m) return [];
  if (!m.maps) return m.kind === "video" ? ["the water"] : fx.starfield > 0 ? ["the stars"] : [];
  const c = (m.stats?.coverage ?? {}) as Record<string, number>;
  const out: string[] = [];
  if (fx.rainGlass > 0.01 && (fx.glassFull || m.glass)) out.push("the wet glass");
  if (variation.hearth && fx.fire > 0) out.push("the fire");
  if (fx.caustics > 0 || fx.marine > 0) out.push("the water");
  else if ((c.water ?? 0) > 0.04 || ((c.ground ?? 0) > 0.1 && (fx.wet > 0 || fx.rain > 0.15))) out.push("the water");
  if ((c.foliage ?? 0) > 0.08) out.push("the trees");
  if ((c.lights ?? 0) > 0.004) out.push("the lamps");
  if ((c.sky ?? 0) > 0.08) out.push("the sky");
  return out.slice(0, 4);
}

export function Stage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stageEl = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const touchOn = useStore((s) => s.settings.touch);
  const renderer = useRef<Renderer | null>(null);
  const [fallback, setFallback] = useState(() => !Renderer.supported());
  const [shown, setShown] = useState<string | null>(null);
  const [lqipOn, setLqipOn] = useState(true); // the blurred placeholder, dropped once faded
  const sceneId = useStore((s) => s.scene);
  const variationId = useStore((s) => s.variation);
  const overrides = useStore((s) => s.fx);
  const quality = useStore((s) => s.settings.quality);
  const dim = useStore((s) => s.dim);
  const asleep = useStore((s) => s.asleep);
  const reduced = useReducedMotion();

  const { scene, variation } = useMemo(() => sceneOf(getState()), [sceneId, variationId]);
  const key = `${scene.id}/${variation.id}`;
  const keyRef = useRef(key);
  keyRef.current = key;
  const fx = useMemo(() => motionSafe(resolveFx(scene, variation, overrides[scene.id] ?? {}), reduced), [scene, variation, overrides, reduced]);
  const fxRef = useRef(fx);
  fxRef.current = fx;

  useEffect(() => {
    if (fallback || !canvas.current) return;
    let r: Renderer;
    try {
      r = new Renderer(canvas.current, {
        onLightning: (strength, distance) => ambience.lightning(strength, distance),
        onShown: (k) => {
          setShown(k);
          if (k === keyRef.current) r.update(k, fxRef.current);
          delete document.documentElement.dataset.acquiring;
          prefetchNeighbours(k);
        },
        onError: () => {
          delete document.documentElement.dataset.acquiring;
          setFallback(true);
        },
        onStats: (st) => {
          rendererStats.current = st;
          for (const fn of rendererStats.listeners) fn();
        },
      });
    } catch {
      setFallback(true);
      return;
    }
    renderer.current = r;
    if (import.meta.env.DEV || new URLSearchParams(location.search).has("debug")) (window as unknown as { __vibey: unknown }).__vibey = r;
    if (r.software) {
      document.documentElement.classList.add("soft");
      r.setQuality("performance");
    }
    const ro = new ResizeObserver(() => r.resize());
    ro.observe(canvas.current);
    const vis = () => r.setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", vis);
      r.dispose();
      renderer.current = null;
    };
  }, [fallback]);

  useEffect(() => {
    const r = renderer.current;
    if (r) r.setQuality(quality === "auto" ? (r.software ? "performance" : autoQuality()) : quality);
  }, [quality, fallback]);

  useEffect(() => {
    renderer.current?.setMotion(!asleep, reduced);
  }, [reduced, asleep, fallback]);

  useEffect(() => {
    const r = renderer.current;
    if (!r) return;
    document.documentElement.dataset.acquiring = "1";
    r.show({ key, variation, media: mediaFor(variation), fx: fxRef.current }).catch(() => {
      /* reported through onError */
    });
  }, [key, fallback]);

  useEffect(() => {
    renderer.current?.update(key, fx);
  }, [key, fx]);

  // a little parallax from the pointer, never on touch and never with reduced motion
  useEffect(() => {
    if (reduced || fallback) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      renderer.current?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduced, fallback]);

  useEffect(() => {
    renderer.current?.setTouch(touchOn);
  }, [touchOn, fallback]);

  // touching the picture: a tap, a drag, or just a hand passing over it
  useEffect(() => {
    const el = stageEl.current;
    if (!el || fallback || !touchOn) return;
    let down: { x: number; y: number; at: number; moved: boolean } | null = null;
    let shownKind: TouchKind | null = null;
    let hideTimer = 0;
    const at = (e: PointerEvent): [number, number] => {
      const r = el.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    };
    const label = (kind: TouchKind | null, e: PointerEvent) => {
      const t = tag.current;
      if (!t) return;
      t.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (kind === shownKind) return;
      shownKind = kind;
      clearTimeout(hideTimer);
      const text = kind ? TOUCH_LABEL[kind] : null;
      if (!text) {
        t.classList.remove("on");
        return;
      }
      t.lastElementChild!.textContent = text;
      t.classList.add("on");
      hideTimer = window.setTimeout(() => t.classList.remove("on"), 1600);
    };
    const live = () => {
      const st = getState();
      return st.started && !st.asleep && st.dim <= 0;
    };
    const onDown = (e: PointerEvent) => {
      // the first touch switches the receiver on, and a touch wakes it: neither is for the picture
      if (!live() || e.button !== 0) return;
      const [x, y] = at(e);
      down = { x: e.clientX, y: e.clientY, at: performance.now(), moved: false };
      renderer.current?.stroke();
      renderer.current?.hover(x, y);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* the pointer is already gone */
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = renderer.current;
      if (!r || !live()) return;
      const [x, y] = at(e);
      if (e.pointerType === "mouse" || down) r.hover(x, y);
      if (down) {
        if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
        if (down.moved) {
          const hit = r.touch(x, y, true);
          if (hit) touchSound(hit);
        }
      } else if (e.pointerType === "mouse") label(r.kindAt(x, y), e);
    };
    const onUp = (e: PointerEvent) => {
      const r = renderer.current;
      if (!down || !r) return;
      const [x, y] = at(e);
      if (!down.moved && performance.now() - down.at < 700) {
        const hit = r.touch(x, y, false);
        if (hit) touchSound(hit);
        tag.current?.classList.remove("on");
      }
      down = null;
      r.stroke();
      if (e.pointerType !== "mouse") r.hover(x, y, false);
    };
    const onLeave = (e: PointerEvent) => {
      if (down) return;
      renderer.current?.hover(0, 0, false);
      label(null, e);
    };
    const onCancel = () => {
      down = null;
      renderer.current?.stroke();
      renderer.current?.hover(0, 0, false);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onCancel);
    return () => {
      clearTimeout(hideTimer);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onCancel);
      renderer.current?.hover(0, 0, false);
    };
  }, [fallback, touchOn]);

  const m = MANIFEST[variation.dir];
  const first = shown === null;

  return (
    <div className={`stage${touchOn && !fallback ? " touchable" : ""}`} aria-hidden="true" ref={stageEl}>
      {lqipOn || fallback ? (
        <div
          className="stage-lqip"
          style={{ backgroundImage: `url(${m.lqip})`, opacity: first || fallback ? 1 : 0 }}
          onTransitionEnd={() => !first && setLqipOn(false)}
        />
      ) : null}
      {fallback ? (
        <Still variation={variation} reduced={reduced} />
      ) : (
        <canvas ref={canvas} className="stage-canvas" style={{ opacity: first ? 0 : 1 }} />
      )}
      <div className="stage-static" />
      <div className="stage-shade" style={{ opacity: asleep ? 0.92 : dim * 0.85 }} />
      <div className="touch-tag" ref={tag}>
        <i />
        <span />
      </div>
    </div>
  );
}

/** Without WebGL: the photograph (or the loop itself) as a plain, still-beautiful backdrop. */
function Still({ variation, reduced }: { variation: Variation; reduced: boolean }) {
  const m = MANIFEST[variation.dir];
  const dir = MEDIA + variation.dir;
  if (m.kind === "video" && m.video) {
    return (
      <video key={dir} className="stage-still" autoPlay={!reduced} muted loop playsInline poster={`${dir}/poster.webp`}>
        {m.video.av1 ? <source src={`${dir}/${m.video.av1}`} type='video/mp4; codecs="av01.0.08M.08"' /> : null}
        {m.video.hevc ? <source src={`${dir}/${m.video.hevc}`} type='video/mp4; codecs="hvc1.1.6.L123.90"' /> : null}
        {m.video.h264 ? <source src={`${dir}/${m.video.h264}`} type='video/mp4; codecs="avc1.4d4028"' /> : null}
      </video>
    );
  }
  return (
    <picture key={dir}>
      <source type="image/avif" srcSet={m.widths.map((w) => `${dir}/${w}.avif ${w}w`).join(", ")} sizes="100vw" />
      <img
        className={`stage-still${reduced ? "" : " drifting"}`}
        src={`${dir}/2560.webp`}
        srcSet={`${dir}/1600.webp 1600w, ${dir}/2560.webp 2560w`}
        sizes="100vw"
        alt=""
        style={{ objectPosition: `${variation.focus[0] * 100}% ${variation.focus[1] * 100}%` }}
      />
    </picture>
  );
}
