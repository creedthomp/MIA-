import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function rollToDeclaration(roll: [number, number]): number {
  return roll[0] * 10 + roll[1];
}

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

    const body = await req.json();
    const { roomId, declared, previousUserId } = body as {
      roomId: string;
      declared: number;
      previousUserId: string;
    };

    if (!roomId || declared == null || !previousUserId) {
      throw new Error("Missing required fields: roomId, declared, previousUserId");
    }

    // Validate room is active
    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("status")
      .eq("id", roomId)
      .single();

    if (roomError || !room) throw new Error("Room not found");
    if (room.status !== "active") throw new Error("Game is not active");

    // Fetch the current roll — must belong to previousUserId
    const { data: rollRow, error: rollError } = await supabaseAdmin
      .from("current_rolls")
      .select("roll, user_id")
      .eq("room_id", roomId)
      .single();

    if (rollError || !rollRow) throw new Error("No roll found for this room");
    if (rollRow.user_id !== previousUserId) {
      throw new Error("Roll does not belong to the previous player");
    }

    const actualRoll = rollRow.roll as [number, number];
    const actualDeclaration = rollToDeclaration(actualRoll);
    const wasHonest = actualDeclaration === declared;

    const loserUserId = wasHonest ? user.id : previousUserId;
    const livesLost = wasHonest ? 2 : 1;

    // Fetch current lives for the loser
    const { data: loserRow, error: loserError } = await supabaseAdmin
      .from("room_players")
      .select("lives")
      .eq("room_id", roomId)
      .eq("user_id", loserUserId)
      .single();

    if (loserError || !loserRow) throw new Error("Player not found");

    const newLives = Math.max(0, loserRow.lives - livesLost);
    const isEliminated = newLives === 0;

    // Apply life loss via service role (bypasses client RLS)
    const { error: updateError } = await supabaseAdmin
      .from("room_players")
      .update({ lives: newLives, is_active: !isEliminated })
      .eq("room_id", roomId)
      .eq("user_id", loserUserId);

    if (updateError) throw new Error("Failed to update lives: " + updateError.message);

    // Write life_lost game event for persistence
    await supabaseAdmin.from("game_events").insert({
      room_id: roomId,
      user_id: loserUserId,
      type: "life_lost",
      payload: { userId: loserUserId, newLives, isEliminated, livesLost },
    });

    // Check if game is over
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
      JSON.stringify({
        wasHonest,
        loserUserId,
        livesLost,
        newLives,
        isEliminated,
        revealedRoll: actualRoll,
        declared,
        winnerUserId,
      }),
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
