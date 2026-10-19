import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { music, type MusicState } from "../engine/audio/Music";

/** Re-renders every `ms` with the current time. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function useMusic(): MusicState {
  return useSyncExternalStore(
    (fn) => music.subscribe(fn),
    () => music.state,
    () => music.state,
  );
}

/** Track position, polled (timeupdate is too coarse for a smooth hairline). */
export function useTrackTime(active: boolean) {
  const [t, setT] = useState(() => music.time());
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last > 250) {
        last = ts;
        setT(music.time());
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return t;
}

export function useMedia(query: string) {
  const [m, setM] = useState(() => typeof matchMedia !== "undefined" && matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

/** True once the pointer and keyboard have been still for `secs`. */
export function useIdle(secs: number, hold: boolean) {
  const [idle, setIdle] = useState(false);
  const timer = useRef(0);
  useEffect(() => {
    const arm = () => {
      setIdle(false);
      clearTimeout(timer.current);
      if (!hold) timer.current = window.setTimeout(() => setIdle(true), secs * 1000);
    };
    arm();
    const evs = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    for (const e of evs) window.addEventListener(e, arm, { passive: true });
    return () => {
      clearTimeout(timer.current);
      for (const e of evs) window.removeEventListener(e, arm);
    };
  }, [secs, hold]);
  return idle;
}

export function fmtTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtLeft(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
