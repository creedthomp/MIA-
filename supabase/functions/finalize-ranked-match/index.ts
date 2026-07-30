import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// ── Scoring (mirrors utils/ranking.ts — keep in sync) ──
const SCORE_K = 8;
const LOSS_SOFTEN = 0.5;
const TIER_FLOORS = [0, 300, 700, 1200, 1800, 2500];

function tierFloor(trophies: number): number {
  let f = 0;
  for (const x of TIER_FLOORS) if (trophies >= x) f = x;
  return f;
}
function placementDelta(rank: number, n: number): number {
  const raw = ((n - rank) - (rank - 1)) * SCORE_K;
  return raw >= 0 ? raw : Math.round(raw * LOSS_SOFTEN);
}
function streakBonus(newStreak: number): number {
  if (newStreak < 3) return 0;
  return Math.min(25, (newStreak - 2) * 5);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { roomId } = await req.json();
    if (!roomId) throw new Error("Missing roomId");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Atomic claim: only ranked (quickmatch), finished, not-yet-scored rooms.
    // If no row comes back, another caller already handled it (or it's unranked).
    const { data: claimed } = await admin
      .from("rooms")
      .update({ ranked_finalized: true })
      .eq("id", roomId)
      .eq("status", "finished")
      .eq("type", "quickmatch")
      .eq("ranked_finalized", false)
      .select("id")
      .maybeSingle();

    if (!claimed) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Participants + winner (the one never eliminated)
    const { data: players } = await admin
      .from("room_players")
      .select("user_id, is_active")
      .eq("room_id", roomId);
    if (!players || players.length < 2) throw new Error("Not enough players");

    const n = players.length;
    const winnerId = players.find((p) => p.is_active)?.user_id ?? null;

    // Elimination order (first eliminated first) → placement.
    // Eliminations arrive as different event types across the three code paths:
    //   challenge  → type "life_lost" with payload.isEliminated
    //   forfeit    → type "forfeit"   with payload.isEliminated
    //   disconnect → type "disconnected" (always an elimination)
    // So fetch all events in order and classify in JS.
    const { data: allEvents } = await admin
      .from("game_events")
      .select("user_id, type, payload, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    const eliminated: string[] = [];
    for (const e of allEvents ?? []) {
      const payload = (e.payload ?? {}) as { isEliminated?: boolean };
      const isElim = e.type === "disconnected" || payload.isEliminated === true;
      if (isElim && e.user_id && !eliminated.includes(e.user_id)) eliminated.push(e.user_id);
    }

    // rank map: winner = 1, first eliminated = n, last eliminated = 2
    const rankOf: Record<string, number> = {};
    if (winnerId) rankOf[winnerId] = 1;
    eliminated.forEach((uid, i) => { rankOf[uid] = n - i; });
    // Any participant somehow missing a rank → drop into the next open slot
    let fill = 2;
    for (const p of players) {
      if (rankOf[p.user_id] == null) {
        while (Object.values(rankOf).includes(fill)) fill++;
        rankOf[p.user_id] = fill++;
      }
    }

    // Current stats for everyone in one shot
    const ids = players.map((p) => p.user_id);
    const { data: statsRows } = await admin
      .from("player_stats")
      .select("user_id, trophies, games_ranked, wins, streak, best_streak")
      .in("user_id", ids);
    const statsMap: Record<string, { trophies: number; games_ranked: number; wins: number; streak: number; best_streak: number }> = {};
    for (const s of statsRows ?? []) statsMap[s.user_id] = s;

    const results: { userId: string; placement: number; delta: number; trophies: number }[] = [];

    for (const p of players) {
      const uid = p.user_id;
      const rank = rankOf[uid];
      const isWinner = rank === 1;
      const prev = statsMap[uid] ?? { trophies: 0, games_ranked: 0, wins: 0, streak: 0, best_streak: 0 };

      const newStreak = isWinner ? prev.streak + 1 : 0;
      const delta = placementDelta(rank, n) + (isWinner ? streakBonus(newStreak) : 0);
      const newTrophies = Math.max(tierFloor(prev.trophies), prev.trophies + delta);
      const appliedDelta = newTrophies - prev.trophies;

      await admin.from("player_stats").upsert({
        user_id: uid,
        trophies: newTrophies,
        games_ranked: prev.games_ranked + 1,
        wins: prev.wins + (isWinner ? 1 : 0),
        streak: newStreak,
        best_streak: Math.max(prev.best_streak, newStreak),
        updated_at: new Date().toISOString(),
      });

      await admin.from("match_results").upsert(
        { room_id: roomId, user_id: uid, placement: rank, players_count: n, trophies_delta: appliedDelta },
        { onConflict: "room_id,user_id", ignoreDuplicates: true },
      );

      results.push({ userId: uid, placement: rank, delta: appliedDelta, trophies: newTrophies });
    }

    return new Response(JSON.stringify({ finalized: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
