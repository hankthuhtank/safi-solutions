import { BANDS, BAND_BY_ID, SOURCE_NAMES } from "../../data/music";
import { music } from "../../engine/audio/Music";
import { choosePlaylist, playlistName, start } from "../../state/controllers";
import { setLevels, setState, toggleFavoriteTrack, useStore } from "../../state/store";
import type { Track } from "../../types";
import { ExtLink, Fader, Panel, Section, Seg } from "../controls";
import { fmtTime, useMusic, useTrackTime } from "../hooks";
import { Next, Pause, Play, Prev, Repeat, Shuffle, Star } from "../icons";

export function MusicPanel() {
  const m = useMusic();
  const started = useStore((s) => s.started);
  const playlist = useStore((s) => s.playlist);
  const favorites = useStore((s) => s.favorites);
  const recent = useStore((s) => s.recent);
  const shuffle = useStore((s) => s.shuffle);
  const repeat = useStore((s) => s.repeat);
  const crossfade = useStore((s) => s.crossfade);
  const volume = useStore((s) => s.levels.music);
  useStore((s) => s.scene);
  const t = useTrackTime(true);
  const track = m.track;
  const fav = !!track && favorites.some((x) => x.id === track.id);
  const band = playlist.startsWith("band:") ? BAND_BY_ID.get(playlist.slice(5)) : null;

  const play = (tr?: Track) => {
    if (!started) void start();
    if (tr) music.playTrack(tr);
  };

  return (
    <Panel title="Music" wide note={playlistName(playlist)}>
      <div className="np-card">
        <div className="np-card-text">
          <p className="np-card-title">{track ? track.t : "Nothing playing yet"}</p>
          <p className="np-card-artist">{track ? track.a : started ? "Choose a band below." : "Press play to switch the receiver on."}</p>
          {track ? (
            <p className="np-card-meta">
              {track.al ? <span>{track.al}</span> : null}
              {track.y ? <span>Recorded {track.y}</span> : null}
              <span>
                <ExtLink href={track.lu}>{track.l}</ExtLink>
              </span>
              <span>
                <ExtLink href={track.p}>{SOURCE_NAMES[track.s] ?? "Source"}</ExtLink>
              </span>
            </p>
          ) : null}
        </div>
        {track ? (
          <button className={`icon-btn star${fav ? " on" : ""}`} onClick={() => toggleFavoriteTrack(track)} aria-pressed={fav} aria-label={fav ? "Remove from starred tracks" : "Star this track"}>
            <Star size={18} filled={fav} />
          </button>
        ) : null}
      </div>

      <div className="seek">
        <span className="tnum">{fmtTime(t.position)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(1, t.duration)}
          step={1}
          value={Math.min(t.position, t.duration || 0)}
          onChange={(e) => music.seek(Number(e.target.value))}
          aria-label="Track position"
          aria-valuetext={`${fmtTime(t.position)} of ${fmtTime(t.duration)}`}
          style={{ "--p": `${t.duration ? (t.position / t.duration) * 100 : 0}%` } as React.CSSProperties}
          disabled={!track}
        />
        <span className="tnum">{fmtTime(t.duration)}</span>
      </div>

      <div className="transport">
        <button className={`icon-btn${shuffle ? " lit" : ""}`} onClick={() => setState({ shuffle: !shuffle })} aria-pressed={shuffle} aria-label="Shuffle">
          <Shuffle />
        </button>
        <button className="icon-btn" onClick={() => music.prev()} aria-label="Previous track" disabled={!started}>
          <Prev />
        </button>
        <button className="icon-btn big" onClick={() => (started ? music.toggle() : start())} aria-label={m.playing ? "Pause" : "Play"}>
          {m.playing ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button className="icon-btn" onClick={() => music.next()} aria-label="Next track" disabled={!started}>
          <Next />
        </button>
        <button
          className={`icon-btn${repeat !== "off" ? " lit" : ""}`}
          onClick={() => setState({ repeat: repeat === "all" ? "one" : repeat === "one" ? "off" : "all" })}
          aria-label={`Repeat: ${repeat}`}
          title={`Repeat: ${repeat}`}
        >
          <Repeat one={repeat === "one"} />
        </button>
      </div>
      {m.notice ? (
        <p className="notice" role="status">
          {m.notice}
        </p>
      ) : null}

      <div className="row2">
        <Fader label="Music volume" value={volume} onChange={(v) => setLevels({ music: v })} />
        <Seg
          label="Crossfade"
          value={crossfade}
          options={[
            { value: 0, label: "Off" },
            { value: 3, label: "3s" },
            { value: 6, label: "6s" },
            { value: 10, label: "10s" },
          ]}
          onChange={(v) => setState({ crossfade: v })}
        />
      </div>

      <Section title="Bands">
        <div className="bands">
          <button className={`band${playlist === "scene" ? " on" : ""}`} onClick={() => choosePlaylist("scene")}>
            <span className="band-name">This place</span>
            <span className="band-note">Chosen for where you are</span>
          </button>
          <button className={`band${playlist === "favorites" ? " on" : ""}`} onClick={() => choosePlaylist("favorites")} disabled={!favorites.length}>
            <span className="band-name">Starred</span>
            <span className="band-note tnum">{favorites.length === 1 ? "1 track" : `${favorites.length} tracks`}</span>
          </button>
          <button className={`band${playlist === "recent" ? " on" : ""}`} onClick={() => choosePlaylist("recent")} disabled={!recent.length}>
            <span className="band-name">Recently played</span>
            <span className="band-note tnum">{recent.length === 1 ? "1 track" : `${recent.length} tracks`}</span>
          </button>
          {BANDS.map((b) => (
            <button key={b.id} className={`band${playlist === `band:${b.id}` ? " on" : ""}`} onClick={() => choosePlaylist(`band:${b.id}`)} title={b.note}>
              <span className="band-name">{b.name}</span>
              <span className="band-note">{b.note}</span>
            </button>
          ))}
        </div>
        {band ? <p className="fine">{band.note}</p> : null}
      </Section>

      {m.upNext.length ? (
        <Section title="Up next">
          <TrackList tracks={m.upNext} onPlay={play} favorites={favorites} />
        </Section>
      ) : null}
      {recent.length ? (
        <Section title="Recently played">
          <TrackList tracks={recent.slice(0, 12)} onPlay={(tr) => choosePlaylist("recent", tr)} favorites={favorites} />
        </Section>
      ) : null}
      <p className="fine">
        Every track is free to stream: Creative Commons or public domain, from the Free Music Archive, the Internet Archive and, when live finds are on,
        Jamendo, ccMixter and Wikimedia through Openverse. Licence and source are linked above for whatever is playing.
      </p>
    </Panel>
  );
}

function TrackList({ tracks, onPlay, favorites }: { tracks: Track[]; onPlay: (t: Track) => void; favorites: Track[] }) {
  return (
    <ol className="tracks">
      {tracks.map((t) => {
        const fav = favorites.some((x) => x.id === t.id);
        return (
          <li key={t.id}>
            <button className="track" onClick={() => onPlay(t)}>
              <span className="track-title">{t.t}</span>
              <span className="track-artist">{t.a}</span>
              <span className="track-dur tnum">{fmtTime(t.d)}</span>
            </button>
            <button className={`icon-btn star small${fav ? " on" : ""}`} onClick={() => toggleFavoriteTrack(t)} aria-pressed={fav} aria-label={fav ? `Unstar ${t.t}` : `Star ${t.t}`}>
              <Star size={14} filled={fav} />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
