import { setSettings, setState, useStore } from "../../state/store";
import { Panel, Section, Toggle } from "../controls";
import { Expand } from "../icons";

export function MonitorPanel() {
  const st = useStore((s) => s.settings);
  return (
    <Panel title="TV & projection">
      <p className="fine">
        The picture fills the screen, the controls and cursor go away, and the screen stays awake. Anything you leave on — sleep, focus, place cycling — keeps
        running.
      </p>
      <button className="btn lit wide-btn" onClick={() => setState({ tv: true, panel: null })}>
        <Expand size={16} /> Go full screen
      </button>
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
          There is no one-tap casting button: browsers only allow that for plain video files, and Vibey draws its picture live. Tab casting and mirroring
          carry everything as you see it.
        </p>
      </Section>
    </Panel>
  );
}
