import { music } from "../engine/audio/Music";
import { playlistName, start } from "../state/controllers";
import { openPanel, useStore, type PanelId } from "../state/store";
import { Dial } from "./Dial";
import { useMusic, useTrackTime } from "./hooks";
import { Next, Pause, Play, Prev } from "./icons";

const KEYS: { id: PanelId; label: string; title: string }[] = [
  { id: "places", label: "Places", title: "Browse places" },
  { id: "music", label: "Music", title: "Music player" },
  { id: "mix", label: "Mix", title: "Sound mixer" },
  { id: "scene", label: "Scene", title: "Weather, light and movement" },
  { id: "memory", label: "Memory", title: "Saved atmospheres" },
  { id: "timers", label: "Sleep", title: "Sleep, focus and cycling timers" },
  { id: "monitor", label: "TV", title: "TV and projection mode" },
  { id: "settings", label: "Setup", title: "Settings and credits" },
];

export function NowPlaying() {
  const m = useMusic();
  const started = useStore((s) => s.started);
  const playlist = useStore((s) => s.playlist);
  // subscribing to these keeps the band name fresh when the place changes
  useStore((s) => s.scene);
  const t = useTrackTime(m.playing);
  const progress = t.duration ? Math.min(1, t.position / t.duration) : 0;
  return (
    <div className="np">
      <div className="np-transport">
        <button className="icon-btn" onClick={() => music.prev()} aria-label="Previous track" disabled={!started}>
          <Prev size={18} />
        </button>
        <button
          className="icon-btn np-play"
          onClick={() => (started ? music.toggle() : start())}
          aria-label={m.playing ? "Pause music" : "Play music"}
        >
          {m.playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button className="icon-btn" onClick={() => music.next()} aria-label="Next track" disabled={!started}>
          <Next size={18} />
        </button>
      </div>
      <button className="np-text" onClick={() => openPanel("music")} aria-label="Open the music player">
        <span className="np-band caps">{playlistName(playlist)}</span>
        <span className="np-title">{m.track ? m.track.t : started ? "Tuning…" : "Music"}</span>
        <span className="np-artist">{m.loading ? "Loading…" : m.track ? m.track.a : " "}</span>
        <span className="np-progress" aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </span>
      </button>
    </div>
  );
}

export function Console() {
  const panel = useStore((s) => s.panel);
  const sleeping = useStore((s) => !!s.sleep);
  const focus = useStore((s) => !!s.focus);
  const cycling = useStore((s) => s.sceneCycle.on || s.musicCycle.on || s.presetCycle.on);
  const lit = (id: PanelId) => panel === id || (id === "timers" && (sleeping || focus || cycling));
  return (
    <div className="console" role="toolbar" aria-label="Receiver controls">
      <NowPlaying />
      <Dial />
      <nav className="keys" aria-label="Panels">
        {KEYS.map((k) => (
          <button
            key={k.id}
            className={`key${panel === k.id ? " pressed" : ""}`}
            onClick={() => openPanel(k.id)}
            aria-pressed={panel === k.id}
            aria-label={k.title}
            title={k.title}
          >
            <span className={`key-lamp${lit(k.id) ? " on" : ""}`} aria-hidden="true" />
            <span className="key-label caps">{k.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
