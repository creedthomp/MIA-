import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { startGame } from "@/lib/roomService";

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);

  const loadPlayers = useCallback(async () => {
    if (!roomId) return;

    const { data: rp } = await supabase
      .from("room_players")
      .select("id, user_id")
      .eq("room_id", roomId);

    if (!rp?.length) { setPlayers([]); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", rp.map((p) => p.user_id));

    setPlayers(
      rp.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        display_name: profiles?.find((pr) => pr.id === p.user_id)?.display_name ?? "Unknown",
      }))
    );
  }, [roomId]);

  const handleStart = useCallback(async () => {
    if (startingRef.current || !roomId) return;
    startingRef.current = true;
    setStarting(true);
    await startGame(roomId);
    // navigation is triggered by the Postgres Changes subscription below
  }, [roomId]);

  // Initial load
  useEffect(() => {
    if (!roomId) return;

    async function init() {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (!roomData) { router.back(); return; }

      if (roomData.status === "active") {
        router.replace(`/game/${roomId}` as never);
        return;
      }

      setRoom(roomData as Room);
      await loadPlayers();
    }

    init();
  }, [roomId, loadPlayers]);

  // Realtime: player joins/leaves + room status changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`lobby:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => { loadPlayers(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.status === "active") {
            router.replace(`/game/${roomId}` as never);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, loadPlayers]);

  // Quickmatch: auto-start when room is full
  useEffect(() => {
    if (!room || room.type !== "quickmatch") return;
    if (players.length >= room.max_players) {
      handleStart();
    }
  }, [players.length, room, handleStart]);

  // Quickmatch: countdown timer
  useEffect(() => {
    if (!room || room.type !== "quickmatch") return;

    const deadline = new Date(room.created_at).getTime() + QUICKMATCH_SECONDS * 1000;

    function tick() {
      const remaining = Math.max(0, deadline - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0 && players.length >= MIN_PLAYERS) {
        handleStart();
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room, players.length, handleStart]);

  const isHost = user?.id === room?.host_id;
  const canStart = players.length >= MIN_PLAYERS;

  if (!room) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas dark:bg-surface">
        <ActivityIndicator color="#e94560" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas dark:bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Ionicons name="arrow-back" size={24} color={isDark ? "#ffffff" : "#1a1a2e"} />
        </TouchableOpacity>
        <Text className="text-gray-900 dark:text-white text-xl font-bold flex-1">
          {room.type === "quickmatch" ? "Quick Match" : "Lobby"}
        </Text>
        <Text className="text-gray-500 dark:text-muted text-sm">
          {players.length}/{room.max_players}
        </Text>
      </View>

      {/* Room code card (private only) */}
      {room.type === "private" && (
        <View className="mx-4 mb-5 bg-card dark:bg-panel rounded-2xl p-5 items-center">
          <Text className="text-gray-400 dark:text-muted text-xs uppercase tracking-widest mb-2">
            Room Code
          </Text>
          <Text className="text-gray-900 dark:text-white text-4xl font-bold tracking-widest">
            {room.code}
          </Text>
          <Text className="text-gray-400 dark:text-muted text-xs mt-2">
            Share this code to invite players
          </Text>
        </View>
      )}

      {/* Quickmatch countdown card */}
      {room.type === "quickmatch" && timeLeft !== null && (
        <View className="mx-4 mb-5 bg-card dark:bg-panel rounded-2xl p-5 items-center">
          <Text className="text-gray-400 dark:text-muted text-xs uppercase tracking-widest mb-2">
            {starting ? "Starting..." : "Game starts in"}
          </Text>
          <Text className="text-accent text-5xl font-bold tabular-nums">
            {starting ? "—" : formatTime(timeLeft)}
          </Text>
          {!canStart && (
            <Text className="text-gray-400 dark:text-muted text-xs mt-2">
              Waiting for at least {MIN_PLAYERS} players
            </Text>
          )}
        </View>
      )}

      {/* Player list */}
      <View className="mx-4 flex-1">
        <Text className="text-gray-400 dark:text-muted text-xs uppercase tracking-widest mb-3">
          Players
        </Text>
        {players.map((p) => (
          <View
            key={p.id}
            className="flex-row items-center bg-card dark:bg-panel rounded-xl px-4 py-3 mb-2"
          >
            <View className="w-8 h-8 rounded-full bg-accent items-center justify-center mr-3">
              <Text className="text-white text-sm font-bold">
                {p.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-gray-900 dark:text-white text-base flex-1">
              {p.display_name}
            </Text>
            {p.user_id === room.host_id && room.type === "private" && (
              <Text className="text-accent text-xs mr-2">host</Text>
            )}
            {p.user_id === user?.id && (
              <Text className="text-gray-400 dark:text-muted text-xs">you</Text>
            )}
          </View>
        ))}
      </View>

      {/* Bottom action */}
      <View className="px-4 pb-10 pt-4">
        {room.type === "private" && isHost && (
          <TouchableOpacity
            className={`w-full rounded-xl py-3 items-center ${canStart ? "bg-accent" : "bg-gray-200 dark:bg-panel"}`}
            onPress={handleStart}
            disabled={!canStart || starting}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`font-semibold text-base ${canStart ? "text-white" : "text-gray-400 dark:text-muted"}`}>
                {canStart ? "Start Game" : "Need at least 2 players"}
              </Text>
            )}
          </TouchableOpacity>
        )}
        {room.type === "private" && !isHost && (
          <Text className="text-center text-gray-500 dark:text-muted text-sm">
            Waiting for host to start...
          </Text>
        )}
      </View>
    </View>
  );
}
