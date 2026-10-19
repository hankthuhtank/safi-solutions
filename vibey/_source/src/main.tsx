import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initControllers } from "./state/controllers";
import "./styles.css";

initControllers();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
