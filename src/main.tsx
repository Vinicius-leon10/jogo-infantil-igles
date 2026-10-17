import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProgressProvider } from "@/hooks/useProgress";
import { App } from "./App";
import { watchForUpdates } from "@/lib/update";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
);

watchForUpdates();
