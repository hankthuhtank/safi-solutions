import { useState } from "react";
import { getState, setSettings, setState, useStore } from "../../state/store";
import { useScreenStatus } from "../../state/screen";
import { Panel, Section, Toggle } from "../controls";
import { Expand } from "../icons";

export function MonitorPanel() {
  const st = useStore((s) => s.settings);
  const screen = useScreenStatus();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    const s = getState();
    const url = new URL(location.pathname, location.origin);
    url.search = new URLSearchParams({ scene: s.scene, variation: s.variation, tv: "1" }).toString();
    setLink(url.href);
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Panel title="TV & projection">
      <p className="fine">
        The picture fills the screen and the controls and cursor go away. Anything you leave on — sleep, focus, place cycling — keeps
        running.
      </p>
      <button className="btn lit wide-btn" onClick={() => setState({ tv: true, panel: null })}>
        <Expand size={16} /> Go full screen
      </button>
      <Section title="Keep the display on">
        <Toggle label="Keep screen awake" hint="While Vibey is on, prevent automatic dimming and locking where your browser allows it." checked={st.keepAwake} onChange={(keepAwake) => setSettings({ keepAwake })} />
        <p className="fine" role="status">
          {!st.keepAwake ? "Keep awake is off." : screen === "active" ? "Screen is being kept awake." : screen === "unsupported" ? "This browser cannot keep the screen awake automatically." : screen === "unavailable" ? "Keep awake was declined. Check battery saver or your browser's settings." : screen === "paused" ? "Keep awake is paused. Return to Vibey or tap the screen to resume." : "Keep awake starts when you switch Vibey on."}
        </p>
        <p className="fine">Manually locking your phone can stop a live screen mirror. For a display that runs with your phone off, open Vibey in the TV's own browser.</p>
        <button className="btn wide-btn" onClick={() => void copyLink()}>{copied ? "TV link copied" : "Copy this scene's TV link"}</button>
        {link ? <input type="text" className="tv-link" aria-label="TV scene link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} /> : null}
      </Section>
      <Section title="On screen">
        <Toggle label="Clock" checked={st.tvClock} onChange={(v) => setSettings({ tvClock: v })} />
        <Toggle label="24-hour time" checked={st.clock24} onChange={(v) => setSettings({ clock24: v })} />
        <Toggle label="What's playing" checked={st.tvNowPlaying} onChange={(v) => setSettings({ tvNowPlaying: v })} />
      </Section>
      <Section title="Remote & keyboard">
        <dl className="keys-list">
          <dt>← →</dt>
          <dd>Tune to the previous or next place</dd>
          <dt>↑ ↓</dt>
          <dd>Volume</dd>
          <dt>OK / Enter</dt>
          <dd>Show the controls for a moment</dd>
          <dt>Back / Esc</dt>
          <dd>Leave TV mode</dd>
          <dt>Play/Pause</dt>
          <dd>Music (media keys work too)</dd>
        </dl>
      </Section>
      <Section title="Getting it onto a TV">
        <ul className="plain">
          <li>
            <strong>Chromecast or Google TV:</strong> in Chrome, open the ⋮ menu, choose <em>Cast…</em>, then <em>Cast tab</em>. Sound and picture go together.
          </li>
          <li>
            <strong>Apple TV:</strong> on a Mac use Screen Mirroring in Control Centre; on iPhone or iPad, Screen Mirroring from Control Centre.
          </li>
          <li>
            <strong>Smart TV browser:</strong> open this page on the TV itself. It runs best on recent sets; older ones fall back to a still picture.
          </li>
          <li>
            <strong>Projector or HDMI:</strong> connect, extend or mirror the display, open Vibey there and go full screen.
          </li>
        </ul>
        <p className="fine">
          Vibey draws its effects live. Tab casting and mirroring carry the complete scene; their behavior while a phone is locked depends on the phone and TV.
        </p>
      </Section>
    </Panel>
  );
}
