import { useState } from "react";
import { SCENE_BY_ID } from "../../data/scenes";
import { playlistName } from "../../state/controllers";
import { deletePreset, recallPreset, renamePreset, setState, storePreset, useStore } from "../../state/store";
import { Panel, Section, Seg, Toggle } from "../controls";
import { Plus, Trash } from "../icons";
import { thumbOf, thumbClass } from "../Stage";

export function MemoryPanel() {
  const presets = useStore((s) => s.presets);
  const last = useStore((s) => s.lastPreset);
  const cycle = useStore((s) => s.presetCycle);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Panel title="Memory" note="Saved on this device">
      <p className="fine">A memory keeps the place, its weather, your sound mix and the music band. Number keys 1–9 recall them.</p>
      <ol className="memories">
        {presets.map((p, i) => {
          const scene = SCENE_BY_ID.get(p.scene);
          const v = scene?.variations.find((x) => x.id === p.variation) ?? scene?.variations[0];
          return (
            <li key={p.id} className={`memory${last === p.id ? " on" : ""}`}>
              <button className="memory-main" onClick={() => recallPreset(p.id)} disabled={!scene}>
                <span className="memory-num tnum">M{i + 1}</span>
                {v ? <img src={thumbOf(v)} className={thumbClass(v)} alt="" width={96} height={54} loading="lazy" /> : null}
                <span className="memory-text">
                  {editing === p.id ? null : <span className="memory-name">{p.name}</span>}
                  <span className="memory-meta">
                    {scene?.name ?? "Unavailable"} · {playlistName(p.playlist)}
                  </span>
                </span>
              </button>
              {editing === p.id ? (
                <form
                  className="memory-edit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    renamePreset(p.id, String(f.get("name") ?? p.name));
                    setEditing(null);
                  }}
                >
                  <input name="name" defaultValue={p.name} aria-label="Memory name" autoFocus maxLength={40} />
                  <button className="btn small">Save</button>
                </form>
              ) : null}
              {!p.builtIn && editing !== p.id ? (
                <span className="memory-tools">
                  <button className="text-btn" onClick={() => setEditing(p.id)}>
                    Rename
                  </button>
                  <button className="icon-btn small" onClick={() => deletePreset(p.id)} aria-label={`Delete ${p.name}`}>
                    <Trash size={15} />
                  </button>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      <form
        className="store-form"
        onSubmit={(e) => {
          e.preventDefault();
          storePreset(name);
          setName("");
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this atmosphere" aria-label="Name for the new memory" maxLength={40} />
        <button className="btn lit">
          <Plus size={15} /> Store
        </button>
      </form>
      <Section title="Rotate memories">
        <Toggle label="Move through memories on a timer" checked={cycle.on} onChange={(on) => setState((s) => ({ presetCycle: { ...s.presetCycle, on } }))} />
        <Seg
          label="Every"
          value={cycle.minutes}
          options={[10, 20, 30, 60, 120].map((m) => ({ value: m, label: m < 60 ? `${m} min` : `${m / 60} h` }))}
          onChange={(minutes) => setState((s) => ({ presetCycle: { ...s.presetCycle, minutes } }))}
        />
        <div className="checks">
          {presets.map((p) => (
            <label key={p.id} className="check">
              <input
                type="checkbox"
                checked={cycle.ids.includes(p.id)}
                onChange={(e) =>
                  setState((s) => ({
                    presetCycle: {
                      ...s.presetCycle,
                      ids: e.target.checked ? [...s.presetCycle.ids, p.id] : s.presetCycle.ids.filter((x) => x !== p.id),
                    },
                  }))
                }
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      </Section>
    </Panel>
  );
}
