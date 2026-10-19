import { useState } from "react";
import { CATEGORIES, SCENES } from "../../data/scenes";
import { randomAtmosphere, toggleFavoritePlace, tune, useStore } from "../../state/store";
import type { Category } from "../../types";
import { Panel } from "../controls";
import { Dice, Star } from "../icons";
import { thumbOf, thumbClass } from "../Stage";

type Filter = "all" | "favorites" | Category;

export function PlacesPanel() {
  const sceneId = useStore((s) => s.scene);
  const variationId = useStore((s) => s.variation);
  const favs = useStore((s) => s.favoritePlaces);
  const [filter, setFilter] = useState<Filter>("all");
  const list = SCENES.filter((s) => (filter === "all" ? true : filter === "favorites" ? favs.includes(s.id) : s.categories.includes(filter)));

  return (
    <Panel title="Places" wide note={`${SCENES.length} stations`}>
      <div className="chips" role="tablist" aria-label="Filter places">
        {(["all", "favorites", ...CATEGORIES.map((c) => c.id)] as Filter[]).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} className={`chip${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "favorites" ? "Starred" : CATEGORIES.find((c) => c.id === f)!.label}
          </button>
        ))}
        <button className="chip chip-action" onClick={randomAtmosphere} title="A random place with its own sounds and music">
          <Dice size={15} /> Surprise me
        </button>
      </div>
      {list.length === 0 ? <p className="empty">Star a place and it will wait for you here.</p> : null}
      <ol className="stations">
        {list.map((s) => {
          const on = s.id === sceneId;
          return (
            <li key={s.id} className={`station-row${on ? " on" : ""}`}>
              <button className="station-main" onClick={() => tune(s.id)} aria-current={on ? "true" : undefined}>
                <img src={thumbOf(s.variations[0])} alt="" loading="lazy" decoding="async" width={160} height={90} />
                <span className="station-freq tnum">{s.freq.toFixed(1)}</span>
                <span className="station-text">
                  <span className="station-name">{s.name}</span>
                  <span className="station-blurb">{s.blurb}</span>
                </span>
              </button>
              <button
                className={`icon-btn star${favs.includes(s.id) ? " on" : ""}`}
                onClick={() => toggleFavoritePlace(s.id)}
                aria-label={favs.includes(s.id) ? `Unstar ${s.name}` : `Star ${s.name}`}
                aria-pressed={favs.includes(s.id)}
              >
                <Star size={16} filled={favs.includes(s.id)} />
              </button>
              {on && s.variations.length > 1 ? (
                <div className="variations" role="group" aria-label={`${s.name} variations`}>
                  {s.variations.map((v) => (
                    <button key={v.id} className={`variation${v.id === variationId ? " on" : ""}`} onClick={() => tune(s.id, v.id)} aria-pressed={v.id === variationId}>
                      <img src={thumbOf(v)} className={thumbClass(v)} alt="" loading="lazy" decoding="async" width={96} height={54} />
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
