import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cloudEnabled, readJSON, removeKey, supabase, writeJSON } from "@/lib/backend";

export type AppUser = { id: string; email?: string };
export type OAuthProvider = "google" | "apple";

type AuthState = {
  user: AppUser | null;
  ready: boolean;
  signIn: (provider: OAuthProvider) => Promise<{ error: string | null }>;
  /** Local mode only: start using the app on this device without an account. */
  startLocal: () => void;
  signOut: () => Promise<void>;
};

const LOCAL_SESSION_KEY = "sprout-local-session";
const LOCAL_USER: AppUser = { id: "local" };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setUser(readJSON<boolean>(LOCAL_SESSION_KEY) ? LOCAL_USER : null);
      setReady(true);
      return;
    }
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ? { id: s.user.id, email: s.user.email } : null);
    });
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email } : null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (provider: OAuthProvider) => {
    if (!supabase) return { error: "Login na nuvem não configurado." };
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    return { error: error ? error.message : null };
  }, []);

  const startLocal = useCallback(() => {
    writeJSON(LOCAL_SESSION_KEY, true);
    setUser(LOCAL_USER);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      removeKey(LOCAL_SESSION_KEY);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, startLocal, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export { cloudEnabled };
