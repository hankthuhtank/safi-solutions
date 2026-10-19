import { useMemo } from "react";
import { CATEGORIES } from "../data/scenes";
import { getState, sceneOf, useStore } from "../state/store";
import { useNow } from "./hooks";

const CAT = new Map(CATEGORIES.map((c) => [c.id, c.label]));

export function fmtCoords([lat, lon]: [number, number]) {
  const f = (v: number, p: string, n: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? p : n}`;
  return `${f(lat, "N", "S")}  ${f(lon, "E", "W")}`;
}

export function localTime(now: number, tz: string, h24: boolean) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hourCycle: h24 ? "h23" : "h12", timeZone: tz }).format(now);
  } catch {
    return null;
  }
}

/** The field-recordist's slate: what you are hearing, where, and what time it is there. */
export function Slate() {
  const sceneId = useStore((s) => s.scene);
  const variationId = useStore((s) => s.variation);
  const h24 = useStore((s) => s.settings.clock24);
  const now = useNow(5000);
  const { scene, variation } = useMemo(() => sceneOf(getState()), [sceneId, variationId]);
  const tz = variation.timeZone ?? scene.timeZone;
  const coords = variation.coords ?? scene.coords;
  const time = tz ? localTime(now, tz, h24) : null;

  return (
    <header className="slate">
      <p className="slate-row caps">
        <span className="slate-freq">{scene.freq.toFixed(1)}</span>
        <span>MHz</span>
        <span className="slate-rule" />
        <span>{scene.categories.map((c) => CAT.get(c)).join(" · ")}</span>
      </p>
      <h1 className="slate-name" key={scene.id}>
        {scene.name}
      </h1>
      <p className="slate-meta" key={`${scene.id}/${variation.id}`}>
        <span>{variation.place || variation.label}</span>
        {time ? (
          <span>
            <span className="tnum">{time}</span> there
          </span>
        ) : null}
        {coords ? <span className="tnum">{fmtCoords(coords)}</span> : null}
      </p>
    </header>
  );
}
