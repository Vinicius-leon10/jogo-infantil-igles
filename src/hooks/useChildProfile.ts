import { useCallback, useEffect, useState } from "react";
import { readJSON, supabase, writeJSON } from "@/lib/backend";

export type ChildProfile = {
  id: string;
  user_id: string;
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

const profileKey = (userId: string) => `sprout-profile:${userId}`;

export function useChildProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (!supabase) {
      setProfile(readJSON<ChildProfile>(profileKey(userId)));
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("child_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile((data as ChildProfile) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const save = useCallback(
    async (input: ChildProfileInput) => {
      if (!userId) throw new Error("Not authenticated");
      const clean: ChildProfileInput = {
        ...input,
        name: input.name.trim().slice(0, 30),
        age: Math.min(12, Math.max(1, Math.round(input.age))),
      };
      if (!clean.name) throw new Error("Nome obrigatório");
      if (!supabase) {
        const saved: ChildProfile = { id: userId, user_id: userId, ...clean };
        writeJSON(profileKey(userId), saved);
        setProfile(saved);
        return saved;
      }
      const { data, error } = await supabase
        .from("child_profiles")
        .upsert({ ...clean, user_id: userId }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      setProfile(data as ChildProfile);
      return data as ChildProfile;
    },
    [userId],
  );

  return { profile, loading, save, refresh: fetchProfile };
}
