import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProgressProvider } from "@/hooks/useProgress";
import { App } from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { watchForUpdates } from "@/lib/update";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </ErrorBoundary>
  </StrictMode>,
);

watchForUpdates();

// Offline cache (sw.js, written by the build). Not on the dev server, nor on the Claude test
// page, which is a single file with no sw.js next to it.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  try {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  } catch {
    // some embedded pages forbid workers
  }
}
