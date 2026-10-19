import { useEffect, useRef, useState } from "react";
import { music } from "./engine/audio/Music";
import { SCENES } from "./data/scenes";
import { start, wake } from "./state/controllers";
import {
  getState,
  openPanel,
  randomAtmosphere,
  recallPreset,
  sceneOf,
  setLevels,
  setState,
  stepStation,
  stepVariation,
  useStore,
  type PanelId,
} from "./state/store";
import { Console } from "./ui/Console";
import { Slate, localDate, localTime } from "./ui/Slate";
import { Stage, thumbOf } from "./ui/Stage";
import { TrackCaption } from "./ui/TrackCaption";
import { useIdle, useMusic, useNow } from "./ui/hooks";
import { PlacesPanel } from "./ui/panels/PlacesPanel";
import { MusicPanel } from "./ui/panels/MusicPanel";
import { MixPanel } from "./ui/panels/MixPanel";
import { ScenePanel } from "./ui/panels/ScenePanel";
import { MemoryPanel } from "./ui/panels/MemoryPanel";
import { TimersPanel } from "./ui/panels/TimersPanel";
import { MonitorPanel } from "./ui/panels/MonitorPanel";
import { CreditsPanel, HelpPanel, SettingsPanel } from "./ui/panels/SettingsPanel";

const PANELS: Record<PanelId, () => React.JSX.Element> = {
  places: PlacesPanel,
  music: MusicPanel,
  mix: MixPanel,
  scene: ScenePanel,
  memory: MemoryPanel,
  timers: TimersPanel,
  monitor: MonitorPanel,
  settings: SettingsPanel,
  credits: CreditsPanel,
  help: HelpPanel,
};

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function App() {
  const panel = useStore((s) => s.panel);
  const started = useStore((s) => s.started);
  const tv = useStore((s) => s.tv);
  const asleep = useStore((s) => s.asleep);
  const hideAfter = useStore((s) => s.settings.hideAfter);
  const sceneId = useStore((s) => s.scene);
  const variationId = useStore((s) => s.variation);
  const visitedBefore = useStore((s) => s.visitedBefore);
  const [hover, setHover] = useState(false);
  const [peek, setPeek] = useState(0);
  const [powering, setPowering] = useState(false);
  const hold = (!tv && (!!panel || hover || hideAfter === 0)) || !started;
  const idle = useIdle(tv ? 2.5 : hideAfter || 5, hold) && !(peek > Date.now());
  const Active = panel ? PANELS[panel] : null;
  // "gone" follows idle once the fade has finished, so a tap during the fade still lands
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!idle) return setGone(false);
    const t = window.setTimeout(() => setGone(true), 1400);
    return () => clearTimeout(t);
  }, [idle]);
  // panels sit above the console, whatever height it wraps to
  const dock = useRef<HTMLDivElement>(null);
  const [consoleH, setConsoleH] = useState(0);
  useEffect(() => {
    const el = dock.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setConsoleH(Math.round(el.getBoundingClientRect().height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // title and lock-screen artwork follow the place
  useEffect(() => {
    const { scene, variation } = sceneOf(getState());
    document.title = `${scene.name} · Vibey`;
    music.artwork = new URL(thumbOf(variation), location.href).href;
    music.updateSession();
  }, [sceneId, variationId]);

  const powerOn = () => {
    if (getState().started) return;
    setPowering(true);
    window.setTimeout(() => setPowering(false), 2600);
    void start();
  };

  // first touch anywhere switches the receiver on; any touch wakes it from sleep
  useEffect(() => {
    const down = (e: PointerEvent | KeyboardEvent) => {
      if (getState().asleep || getState().dim > 0) wake();
      if (!getState().started && !(e.target instanceof HTMLElement && e.target.closest(".panel"))) powerOn();
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", down);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", down);
    };
  }, []);

  // keyboard: the whole receiver is playable without a mouse
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      const s = getState();
      const k = e.key;
      const inDial = e.target instanceof HTMLElement && e.target.closest(".dial-glass");
      const panelFocused = e.target instanceof HTMLElement && e.target.closest(".panel");
      if (k === "Escape") {
        if (s.panel) openPanel(null);
        else if (s.tv) setState({ tv: false });
        return;
      }
      if (k === "Enter" && s.tv) {
        setPeek(Date.now() + 4000);
        return;
      }
      if (panelFocused && (k.startsWith("Arrow") || k === " ")) return;
      if (!inDial && (k === "ArrowRight" || k === "ArrowLeft")) {
        stepStation(k === "ArrowRight" ? 1 : -1, SCENES);
        e.preventDefault();
      } else if (k === "ArrowUp" || k === "ArrowDown") {
        if (inDial) return;
        setLevels({ master: Math.max(0, Math.min(1, s.levels.master + (k === "ArrowUp" ? 0.05 : -0.05))) });
        e.preventDefault();
      } else if (k === " " || k === "MediaPlayPause") {
        if (!s.started) return;
        music.toggle();
        e.preventDefault();
      } else if (k === "n" || k === "N") music.next();
      else if (k === "b" || k === "B") music.prev();
      else if (k === "v" || k === "V") stepVariation(1);
      else if (k === "m" || k === "M") setState({ allMuted: !s.allMuted });
      else if (k === "r" || k === "R") randomAtmosphere();
      else if (k === "t" || k === "T") setState({ tv: !s.tv, panel: null });
      else if (k === "f" || k === "F") toggleFullscreen();
      else if (k === "p" || k === "P") openPanel("places");
      else if (k === "u" || k === "U") openPanel("music");
      else if (k === "x" || k === "X") openPanel("mix");
      else if (k === "s" || k === "S") openPanel("scene");
      else if (k === "?" || k === "h" || k === "H") openPanel("help");
      else if (/^[1-9]$/.test(k)) {
        const p = s.presets[Number(k) - 1];
        if (p) recallPreset(p.id);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  // TV mode: full screen, screen kept awake, leave when full screen ends
  useEffect(() => {
    if (!tv) return;
    let lock: WakeLockSentinel | null = null;
    const req = () =>
      (navigator as Navigator & { wakeLock?: WakeLock }).wakeLock
        ?.request("screen")
        .then((l) => (lock = l))
        .catch(() => {});
    void req();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    const fs = () => {
      if (!document.fullscreenElement) setState({ tv: false });
    };
    const vis = () => document.visibilityState === "visible" && req();
    document.addEventListener("fullscreenchange", fs);
    document.addEventListener("visibilitychange", vis);
    return () => {
      document.removeEventListener("fullscreenchange", fs);
      document.removeEventListener("visibilitychange", vis);
      void lock?.release().catch(() => {});
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [tv]);

  return (
    <div
      className={`app${idle ? " idle" : ""}${gone || asleep ? " gone" : ""}${tv ? " tv" : ""}${started ? " on" : " off"}${powering ? " powering" : ""}${asleep ? " asleep" : ""}`}
      style={consoleH ? ({ "--dock-h": `${consoleH}px` } as React.CSSProperties) : undefined}
    >
      <Stage />
      <div className="ui">
        {!started || powering ? <img className="title-logo" src="/vibey/media/logo.webp" alt="Vibey" width={1200} height={352} decoding="async" /> : null}
        <Slate />
        {Active ? (
          <div className="panel-dock">
            <Active />
          </div>
        ) : null}
        <div className="console-dock" ref={dock} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          {!started ? <Gate returning={visitedBefore} onStart={powerOn} /> : null}
          <Console />
        </div>
      </div>
      {tv ? <TvOverlay /> : idle ? <TrackCaption /> : null}
      <Announcer />
    </div>
  );
}

function Gate({ returning, onStart }: { returning: boolean; onStart: () => void }) {
  return (
    <button className="gate" onClick={onStart} autoFocus>
      <span className="gate-lamp" aria-hidden="true" />
      <span className="gate-text">
        <span className="gate-main">{returning ? "Switch back on" : "Switch on"}</span>
        <span className="gate-sub">Sound and music start with you</span>
      </span>
    </button>
  );
}

function TvOverlay() {
  const now = useNow(1000);
  const st = useStore((s) => s.settings);
  const m = useMusic();
  const h = localTime(now, undefined, st.clock24);
  const d = st.clockShow === "date" ? localDate(now, undefined) : null;
  return (
    <div className="tv-overlay" aria-hidden="true">
      {st.tvClock ? (
        <div className="tv-clock tnum">
          {h}
          {d ? <span className="tv-date">{d}</span> : null}
        </div>
      ) : null}
      {st.tvNowPlaying && m.track ? (
        <div className="tv-np">
          <span className="tv-np-title">{m.track.t}</span>
          <span className="tv-np-artist">{m.track.a}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Polite announcements for screen readers: the place you tuned to and the track that started. */
function Announcer() {
  const sceneId = useStore((s) => s.scene);
  const m = useMusic();
  const h24 = useStore((s) => s.settings.clock24);
  const [text, setText] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const { scene, variation } = sceneOf(getState());
    const tz = variation.timeZone ?? scene.timeZone;
    const t = tz ? localTime(Date.now(), tz, h24) : null;
    setText(`${scene.freq.toFixed(1)}, ${scene.name}${variation.place ? `, ${variation.place}` : ""}${t ? `, ${t} there` : ""}`);
  }, [sceneId]);
  useEffect(() => {
    if (m.track) setText(`Now playing ${m.track.t} by ${m.track.a}`);
  }, [m.track?.id]);
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {text}
    </div>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}
