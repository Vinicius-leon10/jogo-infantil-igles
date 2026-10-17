import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "@/lib/storage";

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  sex: "boy" | "girl";
  can_read: boolean;
};

export type ChildProfileInput = {
  name: string;
  age: number;
  sex: "boy" | "girl";
  can_read: boolean;
};

const KEY = "sprout-profile";

export function useChildProfile() {
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Read after mount to avoid touching localStorage during the first render.
  useEffect(() => {
    setProfile(readJSON<ChildProfile>(KEY));
    setLoading(false);
  }, []);

  const save = useCallback(async (input: ChildProfileInput) => {
    const clean: ChildProfileInput = {
      ...input,
      name: input.name.trim().slice(0, 30),
      age: Math.min(12, Math.max(1, Math.round(input.age))),
    };
    if (!clean.name) throw new Error("Nome obrigatório");
    const saved: ChildProfile = { id: "local", ...clean };
    writeJSON(KEY, saved);
    setProfile(saved);
    return saved;
  }, []);

  return { profile, loading, save };
}
