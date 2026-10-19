import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initControllers } from "./state/controllers";
import { getState, setState } from "./state/store";
import { music } from "./engine/audio/Music";
import { ambience } from "./engine/audio/Ambience";
import { audio } from "./engine/audio/AudioEngine";
import "./styles.css";

initControllers();
// development only: handles for poking at the app from the console and from tests
if (import.meta.env.DEV) Object.assign(window, { __store: { getState, setState }, __music: music, __ambience: ambience, __audio: audio });
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
