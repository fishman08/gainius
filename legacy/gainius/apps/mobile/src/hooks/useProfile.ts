import { useCallback, useEffect, useState } from "react";
import type { PartialProfile } from "@workout/core";
import { supabase } from "@/lib/supabase";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<PartialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (dbError) setError(dbError.message);
    setProfile((data ?? { units_preference: "metric" }) as PartialProfile);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { profile, loading, error, refetch, setProfile };
}
