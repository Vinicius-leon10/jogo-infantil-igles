import { useState } from "react";
import { cloudEnabled, useAuth } from "@/hooks/useAuth";
import { Sprout } from "./Sprout";

export function LoginScreen() {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signIn, startLocal } = useAuth();

  const handleSignIn = async (provider: "google" | "apple") => {
    setError(null);
    setLoading(provider);
    try {
      const result = await signIn(provider);
      if (result.error) {
        setError("Não foi possível entrar. Tente novamente.");
        setLoading(null);
        return;
      }
      // If redirected, page will navigate away. If session was set, useAuth listener handles it.
    } catch {
      setError("Algo deu errado. Tente novamente.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-aurora flex flex-col items-center justify-between px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="animate-float">
          <Sprout size={140} />
        </div>
        <div>
          <h1 className="text-5xl font-bold mb-2" style={{ fontFamily: "Fredoka, sans-serif", color: "var(--sprout)" }}>
            Sprout
          </h1>
          <p className="text-lg text-muted-foreground max-w-xs">
            Aprenda inglês, broto a broto 🌱
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {error && (
          <p className="text-sm text-center text-destructive font-semibold">{error}</p>
        )}

        {cloudEnabled ? (
          <>
        <button
          onClick={() => handleSignIn("google")}
          disabled={loading !== null}
          className="w-full rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
          style={{ background: "white", color: "#1f1f1f" }}
        >
          <GoogleIcon />
          {loading === "google" ? "Entrando..." : "Continuar com Google"}
        </button>

        <button
          onClick={() => handleSignIn("apple")}
          disabled={loading !== null}
          className="w-full rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
          style={{ background: "#000", color: "#fff" }}
        >
          <AppleIcon />
          {loading === "apple" ? "Entrando..." : "Continuar com Apple"}
        </button>

          </>
        ) : (
          <button
            onClick={startLocal}
            className="w-full rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-3 active:scale-95 transition-transform glow-sprout"
            style={{ background: "var(--sprout)", color: "var(--primary-foreground)" }}
          >
            🌱 Começar neste aparelho
          </button>
        )}

        <p className="text-xs text-center text-muted-foreground pt-4">
          {cloudEnabled
            ? "Um adulto deve fazer o login para criar a conta da criança."
            : "Um adulto deve criar o perfil da criança. O progresso fica salvo neste aparelho."}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.3 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.46 2.23-1.214 3.02-.82.86-2.16 1.52-3.27 1.43-.14-1.11.42-2.27 1.15-3.01.83-.84 2.27-1.46 3.33-1.44zM20.5 17.27c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.4 3.53-4.13 3.55-1.54.02-1.94-1-4.04-.99-2.1.01-2.54 1-4.08.98-1.74-.02-3.07-1.79-4.07-3.36C-.13 16.49-.43 11.6 1.45 9c1.33-1.84 3.43-2.91 5.41-2.91 2.01 0 3.28 1.1 4.94 1.1 1.61 0 2.59-1.1 4.92-1.1 1.76 0 3.62.96 4.95 2.61-4.35 2.38-3.64 8.6-1.17 8.57z" />
    </svg>
  );
}
