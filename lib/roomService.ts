import { supabase } from "@/lib/supabase";
import { generateRoomCode } from "@/utils/roomCode";

export type RoomType = "private" | "quickmatch";

export async function createRoom(
  userId: string,
  type: RoomType = "private"
): Promise<{ roomId: string | null; code: string | null; error: string | null }> {
  let roomId: string | null = null;
  let code: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateRoomCode();
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({ code, host_id: userId, type })
      .select("id")
      .single();

    if (roomError) {
      if (roomError.code === "23505") continue; // unique violation — retry
      return { roomId: null, code: null, error: roomError.message };
    }

    roomId = room.id;
    break;
  }

  if (!roomId || !code) {
    return { roomId: null, code: null, error: "Failed to generate unique room code" };
  }

  const { error: joinError } = await supabase
    .from("room_players")
    .insert({ room_id: roomId, user_id: userId });

  if (joinError) return { roomId: null, code: null, error: joinError.message };

  return { roomId, code, error: null };
}

export async function joinByCode(
  code: string,
  userId: string
): Promise<{ roomId: string | null; error: string | null }> {
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, status, max_players")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (roomError || !room) return { roomId: null, error: "Room not found" };
  if (room.status !== "lobby") return { roomId: null, error: "Game has already started" };

  const { count } = await supabase
    .from("room_players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);

  if (count !== null && count >= (room.max_players ?? 8)) {
    return { roomId: null, error: "Room is full" };
  }

  // Already in room — return success
  const { data: existing } = await supabase
    .from("room_players")
    .select("id")
    .eq("room_id", room.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return { roomId: room.id, error: null };

  const { error: joinError } = await supabase
    .from("room_players")
    .insert({ room_id: room.id, user_id: userId });

  if (joinError) return { roomId: null, error: joinError.message };
  return { roomId: room.id, error: null };
}

export async function findOrJoinQuickMatch(
  userId: string
): Promise<{ roomId: string | null; error: string | null }> {
  const { data: openRooms } = await supabase
    .from("rooms")
    .select("id, max_players")
    .eq("type", "quickmatch")
    .eq("status", "lobby")
    .order("created_at", { ascending: true })
    .limit(5);

  if (openRooms) {
    for (const candidate of openRooms) {
      const { count } = await supabase
        .from("room_players")
        .select("*", { count: "exact", head: true })
        .eq("room_id", candidate.id);

      if (count !== null && count < (candidate.max_players ?? 8)) {
        const { data: existing } = await supabase
          .from("room_players")
          .select("id")
          .eq("room_id", candidate.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) return { roomId: candidate.id, error: null };

        const { error } = await supabase
          .from("room_players")
          .insert({ room_id: candidate.id, user_id: userId });

        if (!error) return { roomId: candidate.id, error: null };
        // Race condition (room just filled) — try next candidate
      }
    }
  }

  // No open room found — create one
  const { roomId, error } = await createRoom(userId, "quickmatch");
  return { roomId, error };
}

export async function startGame(
  roomId: string
): Promise<{ error: string | null }> {
  // .eq('status', 'lobby') makes this idempotent — only fires if still in lobby
  const { error } = await supabase
    .from("rooms")
    .update({ status: "active" })
    .eq("id", roomId)
    .eq("status", "lobby");

  return { error: error?.message ?? null };
}
