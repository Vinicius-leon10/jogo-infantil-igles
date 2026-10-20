import { Component, type ReactNode } from "react";
import { Sprout } from "./Sprout";

/** Catches a crash anywhere in the app and shows a friendly screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen bg-aurora flex flex-col items-center justify-center px-8 text-center">
        <Sprout size={120} mood="happy" className="animate-float mb-6" />
        <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">Vamos tentar de novo? Seu progresso continua guardado.</p>
        <button
          onClick={() => location.reload()}
          className="w-full max-w-xs rounded-2xl py-4 font-bold text-lg btn-3d"
          style={{ background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))", color: "var(--primary-foreground)" }}
        >
          Tentar de novo
        </button>
      </div>
    );
  }
}
