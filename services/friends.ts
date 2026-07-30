import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { generateRoomCode } from "@/utils/roomCode";

// friendships / profiles.friend_code land in types/supabase.ts after the
// migration is pushed + `bun run types`. Until then use an untyped view.
const db = supabase as unknown as SupabaseClient;

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromName: string;
}

type ProfileRow = { id: string; display_name: string; friend_code: string | null };

// Your own shareable code, generated on first use.
export async function getOrCreateFriendCode(userId: string): Promise<string | null> {
  const { data } = await db.from("profiles").select("friend_code").eq("id", userId).maybeSingle();
  const existing = (data as { friend_code: string | null } | null)?.friend_code;
  if (existing) return existing;

  for (let i = 0; i < 5; i++) {
    const code = generateRoomCode();
    const { error } = await db.from("profiles").update({ friend_code: code }).eq("id", userId);
    if (!error) return code;
  }
  return null;
}

export async function addFriendByCode(code: string, myId: string): Promise<{ error: string | null }> {
  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("friend_code", code.toUpperCase().trim())
    .maybeSingle();
  const target = data as { id: string } | null;
  if (!target) return { error: "No player with that code" };
  if (target.id === myId) return { error: "That's your own code" };
  return sendRequest(target.id, myId);
}

// Sends a request — or auto-accepts if they already requested you (mutual add).
export async function sendRequest(targetId: string, myId: string): Promise<{ error: string | null }> {
  const { data: incoming } = await db
    .from("friendships")
    .select("id")
    .eq("requester_id", targetId)
    .eq("addressee_id", myId)
    .maybeSingle();

  if (incoming) {
    await db.from("friendships").update({ status: "accepted" }).eq("id", (incoming as { id: string }).id);
    return { error: null };
  }

  const { error } = await db
    .from("friendships")
    .upsert(
      { requester_id: myId, addressee_id: targetId, status: "pending" },
      { onConflict: "requester_id,addressee_id", ignoreDuplicates: true },
    );
  return { error: error ? "Could not send request" : null };
}

export async function acceptRequest(id: string): Promise<void> {
  await db.from("friendships").update({ status: "accepted" }).eq("id", id);
}

export async function removeFriendship(id: string): Promise<void> {
  await db.from("friendships").delete().eq("id", id);
}

export async function fetchIncomingRequests(myId: string): Promise<FriendRequest[]> {
  const { data } = await db
    .from("friendships")
    .select("id, requester_id")
    .eq("addressee_id", myId)
    .eq("status", "pending");
  const rows = (data ?? []) as { id: string; requester_id: string }[];
  if (!rows.length) return [];

  const { data: profs } = await db
    .from("profiles")
    .select("id, display_name")
    .in("id", rows.map((r) => r.requester_id));
  const nameById: Record<string, string> = {};
  for (const p of (profs ?? []) as ProfileRow[]) nameById[p.id] = p.display_name;

  return rows.map((r) => ({ id: r.id, fromUserId: r.requester_id, fromName: nameById[r.requester_id] ?? "player" }));
}

// User ids of your accepted friends (either direction).
export async function fetchFriendIds(myId: string): Promise<string[]> {
  const { data } = await db
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);
  const rows = (data ?? []) as { requester_id: string; addressee_id: string }[];
  return rows.map((r) => (r.requester_id === myId ? r.addressee_id : r.requester_id));
}
