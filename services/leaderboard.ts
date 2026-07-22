import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// player_stats / match_results land in types/supabase.ts after the migration
// is pushed and `bun run types` is run. Until then use an untyped view.
const db = supabase as unknown as SupabaseClient;

export interface LeaderRow {
  userId: string;
  displayName: string;
  trophies: number;
  wins: number;
  gamesRanked: number;
}

export interface MyStats {
  trophies: number;
  wins: number;
  gamesRanked: number;
  streak: number;
  bestStreak: number;
}

type StatRow = { user_id: string; trophies: number; wins: number; games_ranked: number };
type ProfileRow = { id: string; display_name: string };

export async function fetchGlobalLeaderboard(limit = 100): Promise<LeaderRow[]> {
  const { data: stats } = await db
    .from("player_stats")
    .select("user_id, trophies, wins, games_ranked")
    .order("trophies", { ascending: false })
    .limit(limit);

  const rows = (stats ?? []) as StatRow[];
  if (!rows.length) return [];

  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name")
    .in("id", rows.map((s) => s.user_id));

  const nameById: Record<string, string> = {};
  for (const p of (profiles ?? []) as ProfileRow[]) nameById[p.id] = p.display_name;

  return rows.map((s) => ({
    userId: s.user_id,
    displayName: nameById[s.user_id] ?? "player",
    trophies: s.trophies,
    wins: s.wins,
    gamesRanked: s.games_ranked,
  }));
}

export async function fetchMyStats(userId: string): Promise<MyStats | null> {
  const { data } = await db
    .from("player_stats")
    .select("trophies, wins, games_ranked, streak, best_streak")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const s = data as StatRow & { streak: number; best_streak: number };
  return {
    trophies: s.trophies,
    wins: s.wins,
    gamesRanked: s.games_ranked,
    streak: s.streak,
    bestStreak: s.best_streak,
  };
}
