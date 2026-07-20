import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View, SafeAreaView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useStore } from "@/services/store";
import { startGame } from "@/services/roomService";

import { COLORS, FONT } from "@/theme";

const C = COLORS;
const MONO = FONT.brand;

type Room = {
  id: string;
  code: string;
  host_id: string;
  status: string;
  type: string;
  max_players: number;
  created_at: string;
};

type LobbyPlayer = {
  id: string;
  user_id: string;
  display_name: string;
};

const QUICKMATCH_SECONDS = 120;
const MIN_PLAYERS = 2;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function LobbyScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { user } = useStore();

  const [room,    setRoom]    = useState<Room | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);

  const loadPlayers = useCallback(async () => {
    if (!roomId) return;
    const { data: rp } = await supabase
      .from("room_players").select("id, user_id").eq("room_id", roomId);
    if (!rp?.length) { setPlayers([]); return; }
    const { data: profiles } = await supabase
      .from("profiles").select("id, display_name").in("id", rp.map((p) => p.user_id));
    setPlayers(rp.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      display_name: profiles?.find((pr) => pr.id === p.user_id)?.display_name ?? "Unknown",
    })));
  }, [roomId]);

  const handleStart = useCallback(async () => {
    if (startingRef.current || !roomId) return;
    startingRef.current = true;
    setStarting(true);
    await startGame(roomId);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    async function init() {
      const { data: roomData } = await supabase.from("rooms").select("*").eq("id", roomId).single();
      if (!roomData) { router.back(); return; }
      if (roomData.status === "active") { router.replace(`/game/${roomId}` as never); return; }
      setRoom(roomData as Room);
      await loadPlayers();
    }
    init();
  }, [roomId, loadPlayers]);

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`lobby:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` }, () => loadPlayers())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (payload) => {
        const updated = payload.new as Room;
        setRoom(updated);
        if (updated.status === "active") router.replace(`/game/${roomId}` as never);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, loadPlayers]);

  useEffect(() => {
    if (!room || room.type !== "quickmatch") return;
    if (players.length >= room.max_players) handleStart();
  }, [players.length, room, handleStart]);

  useEffect(() => {
    if (!room || room.type !== "quickmatch") return;
    const deadline = new Date(room.created_at).getTime() + QUICKMATCH_SECONDS * 1000;
    function tick() {
      const remaining = Math.max(0, deadline - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0 && players.length >= MIN_PLAYERS) handleStart();
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room, players.length, handleStart]);

  const isHost  = user?.id === room?.host_id;
  const canStart = players.length >= MIN_PLAYERS;

  if (!room) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Color-block strip ── */}
        <View style={{ flexDirection: "row", height: 4 }}>
          <View style={{ flex: 1, backgroundColor: C.accent }} />
          <View style={{ flex: 1, backgroundColor: C.secondary }} />
          <View style={{ flex: 1, backgroundColor: C.warn }} />
        </View>

        {/* ── Header ── */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 6, marginRight: 10 }}>
            <Ionicons name="arrow-back" size={22} color={C.fgMuted} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: C.fg, letterSpacing: -0.5 }}>
            {room.type === "quickmatch" ? "Quick Match" : "Lobby"}
          </Text>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
            borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.success }} />
            <Text style={{ fontFamily: MONO, fontSize: 11, color: C.fgMuted }}>
              {players.length}/{room.max_players}
            </Text>
          </View>
        </View>

        {/* ── Room code card (private) ── */}
        {room.type === "private" && (
          <View style={{
            marginHorizontal: 20, marginBottom: 16,
            backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
            borderRadius: 16, padding: 24, alignItems: "center",
          }}>
            <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.fgFaint, textTransform: "uppercase", marginBottom: 12 }}>
              Table Code
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 38, fontWeight: "700", color: C.warn, letterSpacing: 10 }}>
              {room.code}
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: C.fgFaint, marginTop: 12 }}>
              Share to invite players
            </Text>
          </View>
        )}

        {/* ── Quickmatch countdown card ── */}
        {room.type === "quickmatch" && timeLeft !== null && (
          <View style={{
            marginHorizontal: 20, marginBottom: 16,
            backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
            borderRadius: 16, padding: 24, alignItems: "center",
          }}>
            <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.fgFaint, textTransform: "uppercase", marginBottom: 12 }}>
              {starting ? "Starting…" : "Game starts in"}
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 52, fontWeight: "700", color: C.accent, letterSpacing: -1 }}>
              {starting ? "—" : formatTime(timeLeft)}
            </Text>
            {!canStart && (
              <Text style={{ fontFamily: MONO, fontSize: 11, color: C.fgFaint, marginTop: 12 }}>
                Waiting for at least {MIN_PLAYERS} players
              </Text>
            )}
          </View>
        )}

        {/* ── Player list ── */}
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.fgFaint, textTransform: "uppercase", marginBottom: 12 }}>
            Players
          </Text>

          {players.map((p) => {
            const isPlayerHost = p.user_id === room.host_id;
            const isMe = p.user_id === user?.id;
            return (
              <View
                key={p.id}
                style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: C.surface, borderWidth: 1,
                  borderColor: isMe ? C.accent : C.border,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                  marginBottom: 8,
                }}
              >
                {/* Avatar */}
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: isPlayerHost && room.type === "private" ? C.accent : C.surface2,
                  alignItems: "center", justifyContent: "center", marginRight: 12,
                }}>
                  <Text style={{ color: isPlayerHost && room.type === "private" ? C.onAccent : C.fgMuted, fontWeight: "700", fontSize: 14 }}>
                    {p.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text style={{ flex: 1, color: C.fg, fontSize: 15, fontWeight: isMe ? "600" : "400" }}>
                  {p.display_name}
                </Text>

                {/* Badges */}
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {isPlayerHost && room.type === "private" && (
                    <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: C.accent, textTransform: "uppercase" }}>
                      host
                    </Text>
                  )}
                  {isMe && (
                    <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: C.fgFaint, textTransform: "uppercase" }}>
                      you
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Bottom action ── */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}>
          {room.type === "private" && isHost && (
            <TouchableOpacity
              onPress={handleStart}
              disabled={!canStart || starting}
              style={{
                backgroundColor: canStart ? C.accent : C.surface2,
                borderWidth: canStart ? 0 : 1,
                borderColor: C.border,
                borderRadius: 12,
                paddingVertical: 15,
                alignItems: "center",
                opacity: starting ? 0.7 : 1,
              }}
            >
              {starting ? (
                <ActivityIndicator color={C.onAccent} />
              ) : (
                <Text style={{ color: canStart ? C.onAccent : C.fgFaint, fontWeight: "600", fontSize: 15 }}>
                  {canStart ? "Start Game" : `Need at least ${MIN_PLAYERS} players`}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {room.type === "private" && !isHost && (
            <View style={{ alignItems: "center", gap: 8 }}>
              <ActivityIndicator color={C.fgFaint} size="small" />
              <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgFaint }}>
                Waiting for host to start…
              </Text>
            </View>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}
