import { SOUNDS, SOUND_GROUPS, type SoundDef } from "../../data/sounds";
import { resetScene, setLevel, setLevels, setSettings, setShape, setState, toggleMute, useStore } from "../../state/store";
import { Fader, Panel, Section, Toggle } from "../controls";
import { Speaker } from "../icons";

export function MixPanel() {
  const levels = useStore((s) => s.levels);
  const allMuted = useStore((s) => s.allMuted);
  const follow = useStore((s) => s.settings.soundFollowsScene);
  const mixFollows = useStore((s) => s.settings.mixFollowsScene);
  const mix = useStore((s) => s.mix);
  const active = Object.entries(mix).filter(([, v]) => v > 0.001).length;

  return (
    <Panel title="Mix" wide note={`${active} sound${active === 1 ? "" : "s"} on`}>
      <div className="mains">
        <Fader label="Master" value={levels.master} onChange={(v) => setLevels({ master: v })} />
        <Fader label="Music" value={levels.music} onChange={(v) => setLevels({ music: v })} />
        <Fader label="Ambience" value={levels.ambient} onChange={(v) => setLevels({ ambient: v })} />
        <div className="mains-actions">
          <button className={`btn${allMuted ? " lit" : ""}`} onClick={() => setState({ allMuted: !allMuted })} aria-pressed={allMuted}>
            <Speaker size={16} muted={allMuted} /> {allMuted ? "Unmute all" : "Mute all"}
          </button>
          <button className="btn" onClick={resetScene}>
            Reset to this place
          </button>
        </div>
      </div>
      <Toggle label="Sound follows the picture" hint="Turn up the rain on screen and the rain gets louder." checked={follow} onChange={(v) => setSettings({ soundFollowsScene: v })} />
      <Toggle label="New place, new mix" hint="Each place brings its own sounds. Off keeps your mix as you tune." checked={mixFollows} onChange={(v) => setSettings({ mixFollowsScene: v })} />
      {SOUND_GROUPS.map((g) => (
        <Section key={g.id} title={g.label}>
          <div className="channels">
            {SOUNDS.filter((s) => s.group === g.id).map((s) => (
              <Channel key={s.id} def={s} />
            ))}
          </div>
        </Section>
      ))}
      <p className="fine">
        Field recordings from Freesound and the Internet Archive's Radio Aporee archive, under CC0, CC BY, CC BY-SA and the Public Domain Mark. Every
        recordist is credited under Setup → Credits.
      </p>
    </Panel>
  );
}

function Channel({ def }: { def: SoundDef }) {
  const level = useStore((s) => s.mix[def.id] ?? 0);
  const muted = useStore((s) => !!s.muted[def.id]);
  const shape = useStore((s) => s.shape[def.id]);
  const on = level > 0.001 && !muted;
  const events = def.kind === "events";
  return (
    <div className={`channel${on ? " on" : ""}`}>
      <span className="channel-lamp" aria-hidden="true" />
      <Fader label={def.name} value={level} onChange={(v) => setLevel(def.id, v)} />
      <button className={`icon-btn small${muted ? " lit" : ""}`} onClick={() => toggleMute(def.id)} aria-pressed={muted} aria-label={muted ? `Unmute ${def.name}` : `Mute ${def.name}`}>
        <Speaker size={15} muted={muted} />
      </button>
      {on && def.kind !== "synth" ? (
        <div className="channel-shape">
          <Fader
            label={events ? "How often" : "Distance"}
            value={shape ?? (events ? 0.5 : 1)}
            onChange={(v) => setShape(def.id, v)}
            ends={events ? ["rare", "often"] : ["far", "near"]}
            format={(v) => (events ? `${Math.pow(4, (v - 0.5) * 2).toFixed(1)}×` : v >= 0.99 ? "near" : `${Math.round((1 - v) * 100)}%`)}
          />
        </div>
      ) : null}
    </div>
  );
}
