// Like RDS text on a car radio: when a new track starts, its name drifts up for a few seconds,
// even while the rest of the receiver is hidden.

import { useEffect, useRef, useState } from "react";
import type { Track } from "../types";
import { useMusic } from "./hooks";

export function TrackCaption() {
  const m = useMusic();
  const [shown, setShown] = useState<Track | null>(null);
  const first = useRef(true);
  const timer = useRef(0);
  useEffect(() => {
    if (!m.track) return;
    if (first.current) {
      // the switch-on moment has enough going on; start captioning from the next track
      first.current = false;
      return;
    }
    setShown(m.track);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShown(null), 6500);
  }, [m.track?.id]);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!shown) return null;
  return (
    <div className="caption" key={shown.id} aria-hidden="true">
      <span className="caption-tag caps">Now</span>
      <span className="caption-title">{shown.t}</span>
      <span className="caption-artist caps">{shown.a}</span>
    </div>
  );
}
