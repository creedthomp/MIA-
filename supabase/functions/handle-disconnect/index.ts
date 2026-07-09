import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    const { roomId, disconnectedUserId } = await req.json() as {
      roomId: string;
      disconnectedUserId: string;
    };

    if (!roomId || !disconnectedUserId) {
      throw new Error("Missing required fields: roomId, disconnectedUserId");
    }

    // Validate caller is the room host
    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("host_id, status")
      .eq("id", roomId)
      .single();

    if (roomError || !room) throw new Error("Room not found");
    if (room.host_id !== user.id) throw new Error("Only the host can report disconnections");
    if (room.status !== "active") throw new Error("Game is not active");

    // Idempotent: check if player is already inactive
    const { data: playerRow } = await supabaseAdmin
      .from("room_players")
      .select("is_active, lives")
      .eq("room_id", roomId)
      .eq("user_id", disconnectedUserId)
      .single();

    if (!playerRow?.is_active) {
      return new Response(JSON.stringify({ alreadyInactive: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Eliminate the disconnected player
    await supabaseAdmin
      .from("room_players")
      .update({ lives: 0, is_active: false })
      .eq("room_id", roomId)
      .eq("user_id", disconnectedUserId);

    await supabaseAdmin.from("game_events").insert({
      room_id: roomId,
      user_id: disconnectedUserId,
      type: "disconnected",
      payload: { userId: disconnectedUserId },
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
      JSON.stringify({ success: true, winnerUserId }),
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
