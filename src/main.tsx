import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PlayerApp } from "@/components/player/player-app";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlayerApp />
  </StrictMode>,
);
