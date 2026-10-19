import { useEffect, useMemo, useRef, useState } from "react";
import { Renderer, type RendererStats } from "../engine/visual/Renderer";
import { imageUrl, type VariationMedia } from "../engine/visual/media";
import { ambience } from "../engine/audio/Ambience";
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

export function Stage() {
  const canvas = useRef<HTMLCanvasElement>(null);
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
          r.update(fxRef.current);
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
    if (import.meta.env.DEV) (window as unknown as { __vibey: unknown }).__vibey = r;
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
    renderer.current?.update(fx);
  }, [fx]);

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

  const m = MANIFEST[variation.dir];
  const first = shown === null;

  return (
    <div className="stage" aria-hidden="true">
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
