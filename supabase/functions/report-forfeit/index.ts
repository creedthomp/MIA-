import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Called when a player declares below the floor — they lose 1 life immediately,
// no challenge needed. Server-authoritative to prevent clients from faking forfeits
// on other players.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { roomId } = await req.json() as { roomId: string };
    if (!roomId) throw new Error("Missing roomId");

    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("status")
      .eq("id", roomId)
      .single();

    if (roomError || !room) throw new Error("Room not found");
    if (room.status !== "active") throw new Error("Game is not active");

    const { data: playerRow, error: playerError } = await supabaseAdmin
      .from("room_players")
      .select("lives")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single();

    if (playerError || !playerRow) throw new Error("Player not found in room");

    const newLives = Math.max(0, playerRow.lives - 1);
    const isEliminated = newLives === 0;

    await supabaseAdmin
      .from("room_players")
      .update({ lives: newLives, is_active: !isEliminated })
      .eq("room_id", roomId)
      .eq("user_id", user.id);

    await supabaseAdmin.from("game_events").insert({
      room_id: roomId,
      user_id: user.id,
      type: "forfeit",
      payload: { userId: user.id, newLives, isEliminated },
    });

    const { data: activePlayers } = await supabaseAdmin
      .from("room_players")
      .select("user_id")
      .eq("room_id", roomId)
      .eq("is_active", true);

    let winnerUserId: string | null = null;
    if (activePlayers && activePlayers.length === 1) {
      winnerUserId = activePlayers[0].user_id;

      await supabaseAdmin
        .from("rooms")
        .update({ status: "finished" })
        .eq("id", roomId);

      await supabaseAdmin.from("game_events").insert({
        room_id: roomId,
        user_id: winnerUserId,
        type: "game_over",
        payload: { winnerUserId },
      });
    }

    return new Response(
      JSON.stringify({ newLives, isEliminated, winnerUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
