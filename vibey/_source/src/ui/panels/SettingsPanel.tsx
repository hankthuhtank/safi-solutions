import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { BAND_BY_ID, loadCatalog } from "../../data/music";
import { SCENES } from "../../data/scenes";
import { SOUNDS } from "../../data/sounds";
import { openPanel, resetAll, setSettings, useStore } from "../../state/store";
import type { Track } from "../../types";
import { ExtLink, Panel, Section, Seg, Toggle } from "../controls";
import { autoQuality, rendererStats } from "../Stage";

function useStats() {
  return useSyncExternalStore(
    (fn) => {
      rendererStats.listeners.add(fn);
      return () => rendererStats.listeners.delete(fn);
    },
    () => rendererStats.current,
  );
}

const QUALITY_NOTE = {
  performance: "Up to 1080p, lighter effects. Kindest to batteries and older machines.",
  balanced: "Up to 1440p with full effects. Sharp on most screens.",
  ultra: "Full 4K frames and every effect at full density. For big screens and capable graphics.",
};

export function SettingsPanel() {
  const st = useStore((s) => s.settings);
  const stats = useStats();
  const [confirm, setConfirm] = useState(false);
  const resolved = st.quality === "auto" ? autoQuality() : st.quality;
  return (
    <Panel title="Setup">
      <Section title="Picture">
        <Seg
          label="Quality"
          value={st.quality}
          options={[
            { value: "auto", label: "Auto" },
            { value: "performance", label: "Performance" },
            { value: "balanced", label: "Balanced" },
            { value: "ultra", label: "Ultra" },
          ]}
          onChange={(quality) => setSettings({ quality })}
        />
        <p className="fine">
          {st.quality === "auto" ? `Auto picked ${resolved}. ` : ""}
          {QUALITY_NOTE[resolved]}
        </p>
        {stats ? (
          <p className="readout tnum" aria-live="off">
            {stats.width}×{stats.height} · {Math.round(stats.fps)} fps · {Math.round(stats.scale * 100)}% resolution
          </p>
        ) : null}
        <Seg
          label="Motion"
          value={st.motion}
          options={[
            { value: "auto", label: "Follow system" },
            { value: "full", label: "Full" },
            { value: "reduced", label: "Reduced" },
          ]}
          onChange={(motion) => setSettings({ motion })}
        />
        <p className="fine">Reduced motion stops the camera drift and the lightning flashes, and makes changes gentler. Rain and snow still fall.</p>
      </Section>
      <Section title="Controls">
        <Seg
          label="Hide after"
          value={st.hideAfter}
          options={[
            { value: 3, label: "3 s" },
            { value: 5, label: "5 s" },
            { value: 10, label: "10 s" },
            { value: 0, label: "Never" },
          ]}
          onChange={(hideAfter) => setSettings({ hideAfter })}
        />
        <Toggle
          label="Live music finds"
          hint="Adds more free tracks from Openverse (Jamendo, ccMixter, Wikimedia) to each band."
          checked={st.openverse}
          onChange={(v) => setSettings({ openverse: v })}
        />
      </Section>
      <Section title="Clock">
        <Seg
          label="Local time"
          value={st.clockShow}
          options={[
            { value: "time", label: "Time" },
            { value: "date", label: "Date & time" },
            { value: "off", label: "Hidden" },
          ]}
          onChange={(clockShow) => setSettings({ clockShow })}
        />
        <p className="fine">The time where the place is, under its name. Date & time adds the day there too, and shows the date under the TV clock.</p>
        <Toggle label="24-hour clock" checked={st.clock24} onChange={(v) => setSettings({ clock24: v })} />
      </Section>
      <div className="row-buttons">
        <button className="btn" onClick={() => openPanel("credits")}>
          Credits & licences
        </button>
        <button className="btn" onClick={() => openPanel("help")}>
          Keyboard shortcuts
        </button>
      </div>
      <Section title="Your data">
        <p className="fine">Everything you change is kept in this browser only. Nothing is sent anywhere, and there are no accounts.</p>
        {confirm ? (
          <div className="row-buttons">
            <button
              className="btn danger"
              onClick={() => {
                resetAll();
                setConfirm(false);
              }}
            >
              Yes, forget everything
            </button>
            <button className="btn" onClick={() => setConfirm(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => setConfirm(true)}>
            Reset everything…
          </button>
        )}
      </Section>
    </Panel>
  );
}

export function CreditsPanel() {
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => {
    loadCatalog().then(setTracks, () => {});
  }, []);
  const artists = useMemo(() => {
    const m = new Map<string, { licences: Set<string>; tracks: Track[] }>();
    for (const t of tracks) {
      const a = m.get(t.a) ?? { licences: new Set(), tracks: [] };
      a.licences.add(t.l);
      a.tracks.push(t);
      m.set(t.a, a);
    }
    return [...m.entries()].sort((a, b) => b[1].tracks.length - a[1].tracks.length);
  }, [tracks]);

  return (
    <Panel title="Credits & licences" wide>
      <p className="fine">
        Vibey is a free, non-commercial project. Every photograph, film, recording and song here is used under its licence, and each one is credited below.
      </p>
      <Section title="Places">
        <p className="fine">
          Photographs under CC BY or CC BY-SA were cropped and resized for Vibey, and depth and mask maps were derived from them; those derived
          files carry the same licence as their source.
        </p>
        <ul className="credits">
          {SCENES.flatMap((s) =>
            s.variations.filter((v, i, all) => all.findIndex((o) => o.dir === v.dir) === i).map((v) => (
              <li key={v.dir}>
                <span className="credit-what">
                  {s.name} — {v.label}
                </span>
                <span className="credit-who">
                  {v.credit.page ? <ExtLink href={v.credit.page}>{v.credit.title || "Source"}</ExtLink> : v.credit.title} by {v.credit.author} ·{" "}
                  {v.credit.licenseUrl ? <ExtLink href={v.credit.licenseUrl}>{v.credit.license}</ExtLink> : v.credit.license}
                </span>
              </li>
            )),
          )}
        </ul>
      </Section>
      <Section title="Sounds">
        <ul className="credits">
          {SOUNDS.filter((s) => s.credits.length).map((s) => (
            <li key={s.id}>
              <span className="credit-what">{s.name}</span>
              <span className="credit-who">
                {s.credits.map((c, i) => (
                  <span key={c.page}>
                    {i ? "; " : ""}
                    <ExtLink href={c.page}>{c.title}</ExtLink> by {c.author} · <ExtLink href={c.licenseUrl}>{c.license}</ExtLink>
                  </span>
                ))}
              </span>
            </li>
          ))}
          <li>
            <span className="credit-what">Deep-space drone, brown noise, vinyl crackle, dial hiss, focus bell</span>
            <span className="credit-who">Made live in your browser with the Web Audio API.</span>
          </li>
        </ul>
      </Section>
      <Section title="Music">
        <p className="fine">
          The bundled library ({tracks.length} tracks) comes from the Free Music Archive and the Internet Archive. Tracks found live through Openverse carry
          their own credit in the player. The Vintage 78s are genuine 1920–1925 recordings, in the public domain in the United States.
        </p>
        <ul className="credits">
          {artists.map(([name, a]) => (
            <li key={name}>
              <details>
                <summary>
                  <span className="credit-what">{name}</span>
                  <span className="credit-who">
                    {a.tracks.length} track{a.tracks.length === 1 ? "" : "s"} · {[...a.licences].join(", ")}
                  </span>
                </summary>
                <ul className="credit-tracks">
                  {a.tracks.map((t) => (
                    <li key={t.id}>
                      <ExtLink href={t.p}>{t.t}</ExtLink>
                      {t.y ? ` (${t.y})` : ""} · <ExtLink href={t.lu}>{t.l}</ExtLink> · {t.b.map((b) => BAND_BY_ID.get(b)?.name ?? b).join(", ")}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Made with">
        <ul className="credits">
          <li>
            <span className="credit-what">Falling leaves</span>
            <span className="credit-who">
              Leaf scans <ExtLink href="https://ambientcg.com/list?q=LeafSet">Leaf Set 007, 012, 021, 027, 028 and 030</ExtLink> from ambientCG ·{" "}
              <ExtLink href="https://docs.ambientcg.com/license/">CC0</ExtLink> (the Japanese maples are recoloured)
            </span>
          </li>
          <li>
            <span className="credit-what">Depth maps</span>
            <span className="credit-who">
              <ExtLink href="https://huggingface.co/depth-anything/Depth-Anything-V2-Small">Depth Anything V2 Small</ExtLink> · Apache 2.0
            </span>
          </li>
          <li>
            <span className="credit-what">Sky, water, glass and foliage masks</span>
            <span className="credit-who">
              <ExtLink href="https://huggingface.co/shi-labs/oneformer_ade20k_swin_large">OneFormer (ADE20K, Swin-L)</ExtLink> · MIT
            </span>
          </li>
          <li>
            <span className="credit-what">Type</span>
            <span className="credit-who">
              <ExtLink href="https://fonts.google.com/specimen/Archivo">Archivo</ExtLink> by Omnibus-Type and{" "}
              <ExtLink href="https://fonts.google.com/specimen/Newsreader">Newsreader</ExtLink> by Production Type · SIL Open Font License
            </span>
          </li>
          <li>
            <span className="credit-what">Code</span>
            <span className="credit-who">React and Vite (MIT). The scene engine, shaders and audio engine were written for Vibey.</span>
          </li>
        </ul>
      </Section>
    </Panel>
  );
}

export function HelpPanel() {
  const rows: [string, string][] = [
    ["← →", "Tune to the previous or next place"],
    ["V", "Next variation of this place"],
    ["Space", "Play or pause the music"],
    ["N / B", "Next track / previous track"],
    ["↑ ↓", "Master volume"],
    ["M", "Mute everything"],
    ["1 – 9", "Recall a memory"],
    ["R", "A random atmosphere"],
    ["T", "TV mode"],
    ["F", "Full screen"],
    ["P  U  X  S", "Places, music, mix, scene"],
    ["Esc", "Close a panel or leave TV mode"],
  ];
  return (
    <Panel title="Keyboard">
      <dl className="keys-list">
        {rows.map(([k, d]) => (
          <div key={k} className="keys-row">
            <dt>{k}</dt>
            <dd>{d}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
