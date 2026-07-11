import { supabase } from "./supabase";
import type { Profile } from "@/types/auth";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}
