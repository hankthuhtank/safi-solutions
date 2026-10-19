import { useMemo } from "react";
import { getState, currentFx, resetScene, sceneOf, setFx, tune, useStore } from "../../state/store";
import type { ControlId, Fx } from "../../types";
import { Fader, Panel, Seg } from "../controls";
import { thumbOf, useReducedMotion } from "../Stage";

const LABELS: Record<Exclude<ControlId, "light" | "glassFocus">, { label: string; key: keyof Fx }> = {
  rain: { label: "Rain", key: "rain" },
  rainGlass: { label: "Rain on the glass", key: "rainGlass" },
  snow: { label: "Snow", key: "snow" },
  fog: { label: "Fog", key: "fog" },
  wind: { label: "Wind", key: "wind" },
  clouds: { label: "Moving clouds", key: "clouds" },
  water: { label: "Water", key: "water" },
  lightning: { label: "Lightning", key: "lightning" },
  stars: { label: "Starlight", key: "stars" },
  meteors: { label: "Meteors", key: "meteors" },
  aurora: { label: "Aurora", key: "aurora" },
  caustics: { label: "Sunlight ripples", key: "caustics" },
  fire: { label: "Fire", key: "fire" },
  embers: { label: "Embers", key: "embers" },
  dust: { label: "Dust in the light", key: "dust" },
  petals: { label: "Falling leaves", key: "petals" },
  fireflies: { label: "Fireflies", key: "fireflies" },
  headlights: { label: "Passing cars", key: "headlights" },
  drift: { label: "Camera drift", key: "drift" },
};

export function ScenePanel() {
  const sceneId = useStore((s) => s.scene);
  const variationId = useStore((s) => s.variation);
  const overrides = useStore((s) => s.fx);
  const reduced = useReducedMotion();
  const { scene, variation } = useMemo(() => sceneOf(getState()), [sceneId, variationId]);
  const fx = useMemo(() => currentFx(getState()), [sceneId, variationId, overrides]);
  const pct = (v: number) => `${Math.round(v * 100)}`;
  const signed = (v: number) => (Math.abs(v) < 0.005 ? "0" : `${v > 0 ? "+" : "−"}${Math.round(Math.abs(v) * 100)}`);

  return (
    <Panel title="Scene" note={scene.name}>
      {scene.variations.length > 1 ? (
        <div className="variations wide" role="group" aria-label="Variations">
          {scene.variations.map((v) => (
            <button key={v.id} className={`variation${v.id === variation.id ? " on" : ""}`} onClick={() => tune(scene.id, v.id)} aria-pressed={v.id === variation.id}>
              <img src={thumbOf(v)} alt="" width={96} height={54} />
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="scene-controls">
        {scene.controls.map((c) => {
          if (c === "glassFocus") {
            return (
              <Seg
                key={c}
                label="Focus"
                value={fx.glassFocus}
                options={[
                  { value: "scene", label: "On the street" },
                  { value: "glass", label: "On the glass" },
                ]}
                onChange={(v) => setFx("glassFocus", v)}
              />
            );
          }
          if (c === "light") {
            return (
              <div key={c} className="pair">
                <Fader label="Light" value={fx.exposure} min={-1} max={1} onChange={(v) => setFx("exposure", v)} format={signed} />
                <Fader label="Warmth" value={fx.warmth} min={-1} max={1} onChange={(v) => setFx("warmth", v)} format={signed} />
              </div>
            );
          }
          const d = LABELS[c];
          const value = fx[d.key] as number;
          const off = reduced && (c === "lightning" || c === "drift");
          return (
            <Fader
              key={c}
              label={off ? `${d.label} (reduced motion)` : d.label}
              value={value}
              onChange={(v) => setFx(d.key, v as never)}
              format={pct}
              disabled={off}
            />
          );
        })}
      </div>
      <div className="panel-actions">
        <button className="btn" onClick={resetScene}>
          Reset this place
        </button>
      </div>
      <p className="fine">{scene.blurb}</p>
    </Panel>
  );
}
