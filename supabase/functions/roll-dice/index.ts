import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    // User-scoped client — identifies the caller
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Admin client — bypasses RLS for writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { roomId } = await req.json();
    if (!roomId) throw new Error("Missing roomId");

    // Validate the room is active
    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("status")
      .eq("id", roomId)
      .single();

    if (roomError || !room) throw new Error("Room not found");
    if (room.status !== "active") throw new Error("Game is not active");

    // Generate roll server-side — crypto-quality randomness
    const buf = new Uint8Array(2);
    crypto.getRandomValues(buf);
    const a = (buf[0] % 6) + 1;
    const b = (buf[1] % 6) + 1;
    const roll: [number, number] = [Math.max(a, b), Math.min(a, b)];
    const declaration = roll[0] * 10 + roll[1];

    // Upsert current_rolls — one authoritative row per room
    const { error: upsertError } = await supabaseAdmin
      .from("current_rolls")
      .upsert(
        { room_id: roomId, user_id: user.id, roll },
        { onConflict: "room_id" }
      );

    if (upsertError) throw new Error("Failed to save roll: " + upsertError.message);

    // Return roll only to the caller — never broadcast
    return new Response(JSON.stringify({ roll, declaration }), {
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
