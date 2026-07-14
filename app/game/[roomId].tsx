import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useStore } from "@/services/store";
import { subscribeToGame, unsubscribeFromGame, broadcastGameEvent } from "@/services/gameChannel";
import { initGameTurn } from "@/services/gameService";
import { playEmotePop, unloadSounds } from "@/services/sounds";
import { formatDeclaration } from "@/utils/declarations";
import { getRank } from "@/utils/rollHierarchy";
import { nextActivePlayer } from "@/utils/turnOrder";
import { DiceFace } from "@/components/game/DiceFace";
import { DeclarationInput } from "@/components/game/DeclarationInput";
import { GameTable } from "@/components/game/GameTable";
import { EmotePicker } from "@/components/game/EmotePicker";
import type { Player, Declaration, DieValue, Roll } from "@/types/game";
import type { ChallengeResolvedPayload, EmoteId } from "@/types/realtimeEvents";

const C = {
  bg:        "#0a0a0a",
  surface:   "#0f0f0f",
  card:      "#101010",
  border:    "#262626",
  fg:        "#fafafa",
  fgMuted:   "#a3a3a3",
  fgFaint:   "#6f6f6f",
  accent:    "#4d7cff",
  onAccent:  "#ffffff",
  danger:    "#f0553b",
  warn:      "#f5a623",
  ok:        "#4ade80",
};
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// How long the table reveal plays before the verdict card appears
const VERDICT_DELAY_MS = 2600;

// How long an emote bubble stays on screen (bubble self-fades just before this)
const EMOTE_VISIBLE_MS = 2450;

// Edge function response shape (superset of the broadcast payload)
interface ChallengeResult {
  wasHonest: boolean;
  loserUserId: string;
  livesLost: number;
  newLives: number;
  isEliminated: boolean;
  revealedRoll: Roll;
  declared: Declaration;
  winnerUserId: string | null;
}

// ---------- Verdict modal ----------

function VerdictModal({
  data,
  players,
  onDismiss,
}: {
  data: ChallengeResolvedPayload;
  players: Player[];
  onDismiss: () => void;
}) {
  const loser = players.find((p) => p.userId === data.loserUserId);
  const challenger = players.find((p) => p.userId === data.challengerUserId);
  const actual = data.revealedRoll[0] * 10 + data.revealedRoll[1];
  const honest = data.wasHonest;

  return (
    <View
      style={{
        position: "absolute",
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          backgroundColor: C.card,
          borderRadius: 20,
          padding: 28,
          width: "100%",
          maxWidth: 380,
          alignItems: "center",
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.fgFaint, textTransform: "uppercase", marginBottom: 10 }}>
          The verdict
        </Text>

        <Text style={{ fontSize: 34, fontWeight: "800", letterSpacing: -1, color: honest ? C.ok : C.danger, marginBottom: 12 }}>
          {honest ? "TRUTH." : "LIE."}
        </Text>

        <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted, marginBottom: 18, textAlign: "center" }}>
          {challenger?.displayName ?? "Someone"} pulled it.{"\n"}
          Called {formatDeclaration(data.declared)} — rolled {formatDeclaration(actual)}.
        </Text>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <DiceFace value={data.revealedRoll[0] as DieValue} size={68} />
          <DiceFace value={data.revealedRoll[1] as DieValue} size={68} />
        </View>

        <View
          style={{
            backgroundColor: honest ? "rgba(74,222,128,0.09)" : "rgba(240,85,59,0.09)",
            borderWidth: 1,
            borderColor: honest ? "rgba(74,222,128,0.35)" : "rgba(240,85,59,0.35)",
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 9,
            marginBottom: 22,
          }}
        >
          <Text style={{ fontFamily: MONO, color: honest ? C.ok : C.danger, fontWeight: "700", fontSize: 13, textAlign: "center" }}>
            {loser?.displayName ?? "Someone"} loses {data.livesLost}{" "}
            {data.livesLost === 1 ? "life" : "lives"}
            {data.isEliminated ? " — eliminated" : ""}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onDismiss}
          style={{
            backgroundColor: C.accent,
            borderRadius: 10,
            paddingVertical: 12,
            paddingHorizontal: 44,
          }}
        >
          <Text style={{ color: C.onAccent, fontWeight: "600", fontSize: 15 }}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------- Main screen ----------

export default function GameScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const {
    user,
    gamePlayers,
    currentTurnUserId,
    previousTurnUserId,
    currentDeclaration,
    myActualRoll,
    phase,
    winnerId,
    lastEvent,
    initGame,
    applyBroadcastEvent,
    setMyRoll,
    resetGame,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [revealData, setRevealData] = useState<ChallengeResolvedPayload | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [flashUserId, setFlashUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [challengerName, setChallengerName] = useState<string | null>(null);
  const [roundKey, setRoundKey] = useState(0); // bumped each round to reset DeclarationInput
  const [activeEmotes, setActiveEmotes] = useState<Record<string, { emote: EmoteId; key: number }>>({});

  const startingRef = useRef(false);
  const verdictTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emoteTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const emoteKeyRef = useRef(0);

  const myPlayer = gamePlayers.find((p) => p.userId === user?.id);
  const currentPlayer = gamePlayers.find((p) => p.userId === currentTurnUserId);
  const winner = gamePlayers.find((p) => p.userId === winnerId);
  const isMyTurn = currentTurnUserId === user?.id;
  const amIActive = myPlayer?.isActive ?? false;
  const canPullIt = isMyTurn && currentDeclaration != null && previousTurnUserId != null;

  // Initial setup
  useEffect(() => {
    if (!roomId || !user) return;
    const userId = user.id;

    async function handlePlayerLeft(disconnectedUserId: string) {
      if (!roomId) return;

      const { data, error } = await supabase.functions.invoke("handle-disconnect", {
        body: { roomId, disconnectedUserId },
      });

      if (error || !data || data.error || data.alreadyInactive) return;

      await broadcastGameEvent({
        type: "LIFE_LOST",
        payload: { userId: disconnectedUserId, newLives: 0, isEliminated: true },
      });

      if (data.winnerUserId) {
        await broadcastGameEvent({
          type: "GAME_OVER",
          payload: { winnerUserId: data.winnerUserId },
        });
      } else {
        // Give the store a tick to apply the LIFE_LOST event before starting next round
        setTimeout(() => startNextRound(disconnectedUserId), 200);
      }
    }

    async function setup() {
      const { data: room } = await supabase
        .from("rooms")
        .select("host_id")
        .eq("id", roomId)
        .single();

      if (!room) { router.back(); return; }
      const isHost = room.host_id === userId;

      const { data: rp } = await supabase
        .from("room_players")
        .select("user_id, lives, turn_order, is_active")
        .eq("room_id", roomId);

      if (!rp?.length) { router.back(); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", rp.map((p) => p.user_id));

      const players: Player[] = rp.map((p) => ({
        userId: p.user_id,
        displayName: profiles?.find((pr) => pr.id === p.user_id)?.display_name ?? "Unknown",
        lives: p.lives,
        turnOrder: p.turn_order,
        isActive: p.is_active,
      }));

      initGame(players, userId);
      setLoading(false);

      await subscribeToGame(
        roomId,
        (event) => { applyBroadcastEvent(event, userId); },
        (isConnected) => { setConnected(isConnected); },
        { myUserId: userId, isHost, onPlayerLeft: handlePlayerLeft },
      );

      if (isHost && !startingRef.current) {
        startingRef.current = true;
        await new Promise((r) => setTimeout(r, 1500));
        await initGameTurn(roomId, players);
      }
    }

    setup();

    return () => {
      if (verdictTimerRef.current) clearTimeout(verdictTimerRef.current);
      for (const t of Object.values(emoteTimersRef.current)) clearTimeout(t);
      unloadSounds();
      unsubscribeFromGame();
      resetGame();
    };
  }, [roomId, user?.id]);

  // React to broadcast events that drive per-round presentation
  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case "ROUND_STARTED": {
        if (verdictTimerRef.current) clearTimeout(verdictTimerRef.current);
        setPeeking(false);
        setActionError(null);
        setRevealData(null);
        setShowVerdict(false);
        setChallengerName(null);
        setRoundKey((k) => k + 1);
        break;
      }

      case "CHALLENGE": {
        const c = gamePlayers.find((p) => p.userId === lastEvent.payload.challengerUserId);
        setChallengerName(c?.displayName ?? null);
        break;
      }

      case "CHALLENGE_CANCELLED": {
        setChallengerName(null);
        break;
      }

      // Everyone (challenger included — broadcasts echo to self) watches the same
      // reveal: cup lifts aside, dice sit on the felt, then the verdict card drops.
      case "CHALLENGE_RESOLVED": {
        setRevealData(lastEvent.payload);
        setChallengerName(null);
        if (verdictTimerRef.current) clearTimeout(verdictTimerRef.current);
        verdictTimerRef.current = setTimeout(() => setShowVerdict(true), VERDICT_DELAY_MS);
        break;
      }

      case "LIFE_LOST": {
        const userId = lastEvent.payload?.userId as string | undefined;
        if (userId) {
          setFlashUserId(userId);
          setTimeout(() => setFlashUserId(null), 800);
        }
        break;
      }

      case "EMOTE": {
        const { userId, emote } = lastEvent.payload;
        // Muting hides other players' emotes; your own always show
        if (useStore.getState().emotesMuted && userId !== user?.id) break;
        playEmotePop();
        emoteKeyRef.current += 1;
        const key = emoteKeyRef.current;
        setActiveEmotes((prev) => ({ ...prev, [userId]: { emote, key } }));
        if (emoteTimersRef.current[userId]) clearTimeout(emoteTimersRef.current[userId]);
        emoteTimersRef.current[userId] = setTimeout(() => {
          delete emoteTimersRef.current[userId];
          setActiveEmotes((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }, EMOTE_VISIBLE_MS);
        break;
      }
    }
  }, [lastEvent]);

  // ---------- Actions ----------

  async function sendEmote(emote: EmoteId) {
    if (!user) return;
    await broadcastGameEvent({ type: "EMOTE", payload: { userId: user.id, emote } });
  }

  async function handleRoll() {
    if (!roomId) return;
    setIsRolling(true);
    setPeeking(false);
    setActionError(null);

    const [invokeResult] = await Promise.all([
      supabase.functions.invoke("roll-dice", { body: { roomId } }),
      new Promise<void>((r) => setTimeout(r, 2000)),
    ]);
    const { data, error } = invokeResult;

    setIsRolling(false);

    if (error || !data || data.error) {
      setActionError(data?.error ?? "Roll failed. Try again.");
      return;
    }

    // Brief settle pause before showing the declare input
    await new Promise<void>((r) => setTimeout(r, 200));
    setMyRoll(data.roll as Roll);
  }

  async function handleDeclare(declaration: Declaration) {
    if (!user || !roomId) return;
    setActionError(null);

    const isBelowFloor =
      currentDeclaration != null &&
      getRank(declaration) < getRank(currentDeclaration);

    if (isBelowFloor) {
      // Below floor → immediate life loss, no challenge
      const { gamePlayers: current } = useStore.getState();
      const nextPlayer = nextActivePlayer(current, user.id);

      const { data, error } = await supabase.functions.invoke("report-forfeit", {
        body: { roomId },
      });

      if (error || !data || data.error) {
        setActionError(data?.error ?? "Action failed. Try again.");
        return;
      }

      await broadcastGameEvent({
        type: "LIFE_LOST",
        payload: { userId: user.id, newLives: data.newLives, isEliminated: data.isEliminated },
      });

      if (data.winnerUserId) {
        await broadcastGameEvent({ type: "GAME_OVER", payload: { winnerUserId: data.winnerUserId } });
      } else {
        await startNextRound(nextPlayer.userId);
      }

      setPeeking(false);
      return;
    }

    // Normal declaration
    await broadcastGameEvent({
      type: "ROLL_DECLARED",
      payload: { userId: user.id, declaration },
    });

    setPeeking(false);
  }

  async function handlePullIt() {
    if (!roomId || !currentDeclaration || !previousTurnUserId || !user) return;

    setActionError(null);

    await broadcastGameEvent({
      type: "CHALLENGE",
      payload: { challengerUserId: user.id },
    });

    const { data, error } = await supabase.functions.invoke("resolve-challenge", {
      body: {
        roomId,
        declared: currentDeclaration,
        previousUserId: previousTurnUserId,
      },
    });

    if (error || !data || data.error) {
      setActionError(data?.error ?? "Challenge failed. Try again.");
      // Unblock everyone from challenge_pending
      await broadcastGameEvent({ type: "CHALLENGE_CANCELLED", payload: {} });
      return;
    }

    const result = data as ChallengeResult;

    // Broadcast the resolution — echoes back to this client too, which is what
    // kicks off the shared reveal choreography for everyone at once.
    await broadcastGameEvent({
      type: "CHALLENGE_RESOLVED",
      payload: {
        wasHonest: result.wasHonest,
        challengerUserId: user.id,
        loserUserId: result.loserUserId,
        livesLost: result.livesLost,
        newLives: result.newLives,
        isEliminated: result.isEliminated,
        revealedRoll: result.revealedRoll,
        declared: result.declared,
      },
    });

    await broadcastGameEvent({
      type: "LIFE_LOST",
      payload: {
        userId: result.loserUserId,
        newLives: result.newLives,
        isEliminated: result.isEliminated,
      },
    });

    if (result.winnerUserId) {
      await broadcastGameEvent({
        type: "GAME_OVER",
        payload: { winnerUserId: result.winnerUserId },
      });
    }
  }

  async function dismissVerdict() {
    setShowVerdict(false);
    if (!revealData || !user) return;

    // Only the challenger drives the next round; everyone else just closes the card
    const iAmChallenger = revealData.challengerUserId === user.id;
    if (!iAmChallenger || winnerId) return;

    // The player after the one who lost a life opens the next round
    const { gamePlayers: latest } = useStore.getState();
    const starter = nextActivePlayer(latest, revealData.loserUserId).userId;
    await startNextRound(starter);
  }

  async function startNextRound(starterUserId: string) {
    // Read latest state — store may have updated after LIFE_LOST was applied
    const { gamePlayers: latest } = useStore.getState();
    const active = latest
      .filter((p) => p.isActive)
      .sort((a, b) => a.turnOrder - b.turnOrder);

    if (active.length < 2) return; // game over — already handled

    // Starter goes first; fall back to first active if they were eliminated
    const starterActive = active.find((p) => p.userId === starterUserId);
    const starter = starterActive ?? active[0];
    const starterIdx = active.findIndex((p) => p.userId === starter.userId);

    // Rotate so starter goes first
    const rotated = [...active.slice(starterIdx), ...active.slice(0, starterIdx)];
    const playerOrder = rotated.map((p) => p.userId);

    await broadcastGameEvent({
      type: "ROUND_STARTED",
      payload: { currentTurnUserId: starter.userId, playerOrder },
    });
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Verdict overlay ── */}
      {showVerdict && revealData && (
        <VerdictModal
          data={revealData}
          players={gamePlayers}
          onDismiss={dismissVerdict}
        />
      )}

      {/* ── Game over overlay (waits for the verdict card to be dismissed) ── */}
      {phase === "game_over" && !showVerdict && (
        <View
          style={{
            position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: "rgba(0,0,0,0.92)",
            alignItems: "center", justifyContent: "center", zIndex: 300,
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: C.card, borderRadius: 20, padding: 32,
              width: "100%", maxWidth: 380, alignItems: "center",
              borderWidth: 1, borderColor: C.border,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 10 }}>🏆</Text>
            <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.fgFaint, textTransform: "uppercase", marginBottom: 8 }}>
              Game over
            </Text>
            <Text style={{ color: C.fg, fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6, textAlign: "center" }}>
              {winner?.userId === user?.id ? "You win." : `${winner?.displayName ?? "Someone"} wins.`}
            </Text>
            <Text style={{ fontFamily: MONO, color: C.fgMuted, fontSize: 12, marginBottom: 26 }}>
              Last one standing.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: C.accent, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 40 }}
              onPress={() => router.back()}
            >
              <Text style={{ color: C.onAccent, fontWeight: "600", fontSize: 15 }}>Back to Lobby</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Header ── */}
      <SafeAreaView>
        <View
          style={{
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 6, marginRight: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={C.fg} />
          </TouchableOpacity>
          <View style={{ backgroundColor: "#ffffff", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginRight: 10 }}>
            <Image
              source={require("../../assets/mia-logo.png")}
              style={{ width: 38, height: 21, resizeMode: "contain" }}
            />
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", flex: 1 }}>
            Live table
          </Text>
          {!amIActive && phase !== "game_over" && (
            <View
              style={{
                backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
                borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
              }}
            >
              <Text style={{ fontFamily: MONO, color: C.fgMuted, fontSize: 10, letterSpacing: 1 }}>SPECTATING</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── Reconnecting banner ── */}
      {!connected && (
        <View
          style={{
            backgroundColor: C.accent,
            paddingVertical: 6,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator size="small" color="#fff" />
          <Text style={{ color: "#fff", fontFamily: MONO, fontSize: 12, fontWeight: "600" }}>
            Reconnecting…
          </Text>
        </View>
      )}

      {/* ── Table ── */}
      <View>
        <GameTable
          players={gamePlayers}
          myUserId={user?.id ?? ""}
          currentTurnUserId={currentTurnUserId}
          previousTurnUserId={previousTurnUserId}
          currentDeclaration={currentDeclaration}
          flashUserId={flashUserId}
          myActualRoll={myActualRoll}
          peeking={peeking}
          isRolling={isRolling}
          onTogglePeek={() => setPeeking((p) => !p)}
          isMyTurn={isMyTurn}
          phase={phase}
          revealRoll={revealData ? (revealData.revealedRoll as Roll) : null}
          emotes={activeEmotes}
        />
        <EmotePicker onSend={sendEmote} />
      </View>

      {/* ── Declaration input — right below the table ── */}
      {phase === "my_turn_declare" && isMyTurn && amIActive && !revealData && (
        <View style={{ marginTop: 4 }}>
          <DeclarationInput
            key={roundKey}
            currentDeclaration={currentDeclaration}
            onDeclare={handleDeclare}
          />
        </View>
      )}

      {/* ── Action panel ── */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 32, marginTop: "auto" }}>
        {actionError && (
          <Text style={{ fontFamily: MONO, color: C.danger, fontSize: 12, textAlign: "center", marginBottom: 8 }}>
            {actionError}
          </Text>
        )}

        {/* Spectator */}
        {!amIActive && phase !== "game_over" && (
          <View
            style={{
              backgroundColor: C.surface, borderRadius: 12, padding: 16,
              alignItems: "center", borderWidth: 1, borderColor: C.border,
            }}
          >
            <Text style={{ fontFamily: MONO, color: C.fgFaint, fontSize: 12 }}>
              Eliminated — watching the table
            </Text>
          </View>
        )}

        {/* Waiting / starting */}
        {amIActive && phase === "waiting" && !revealData && (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, padding: 14 }}>
            <ActivityIndicator color={C.accent} size="small" />
            <Text style={{ fontFamily: MONO, color: C.fgFaint, fontSize: 12 }}>Starting round…</Text>
          </View>
        )}

        {/* Reveal in progress */}
        {amIActive && (phase === "waiting" || phase === "challenge_pending") && revealData && (
          <View style={{ alignItems: "center", padding: 14 }}>
            <Text style={{ fontFamily: MONO, color: C.fgMuted, fontSize: 12, letterSpacing: 1 }}>
              The cup comes up…
            </Text>
          </View>
        )}

        {/* Other player's turn */}
        {amIActive && phase === "others_turn" && currentPlayer && (
          <View
            style={{
              backgroundColor: C.surface, borderRadius: 12, padding: 14,
              alignItems: "center", borderWidth: 1, borderColor: C.border,
            }}
          >
            <Text style={{ fontFamily: MONO, color: C.fgFaint, fontSize: 12 }}>
              Cup is with{" "}
              <Text style={{ color: C.fg, fontWeight: "700" }}>
                {currentPlayer.displayName}
              </Text>
              …
            </Text>
          </View>
        )}

        {/* Challenge pending — before the resolution arrives */}
        {amIActive && phase === "challenge_pending" && !revealData && (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, padding: 14 }}>
            <ActivityIndicator color={C.danger} size="small" />
            <Text style={{ fontFamily: MONO, color: C.danger, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
              {challengerName ? `${challengerName} pulled it!` : "Pulling it…"}
            </Text>
          </View>
        )}

        {/* My turn — roll or pull it */}
        {amIActive && phase === "my_turn_pre_roll" && (
          <View>
            <Text style={{ fontFamily: MONO, color: C.accent, textAlign: "center", fontWeight: "700", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
              Your turn
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {canPullIt && (
                <TouchableOpacity
                  style={{
                    flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: "center",
                    borderWidth: 1.5, borderColor: C.danger, backgroundColor: "transparent",
                  }}
                  onPress={handlePullIt}
                >
                  <Text style={{ color: C.danger, fontWeight: "700", fontSize: 14 }}>Pull It</Text>
                  <Text style={{ fontFamily: MONO, color: C.fgFaint, fontSize: 9, marginTop: 2 }}>call the bluff</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  flex: 1, borderRadius: 10, paddingVertical: 14,
                  alignItems: "center", backgroundColor: C.accent,
                }}
                onPress={handleRoll}
              >
                <Text style={{ color: C.onAccent, fontWeight: "700", fontSize: 14 }}>Roll</Text>
                <Text style={{ fontFamily: MONO, color: "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 2 }}>
                  {currentDeclaration != null ? `then beat ${formatDeclaration(currentDeclaration)}` : "open the round"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My turn — declaring; peek hint lives on the cup itself */}
        {amIActive && phase === "my_turn_declare" && (
          <Text style={{ fontFamily: MONO, color: C.fgFaint, fontSize: 10, textAlign: "center", letterSpacing: 1 }}>
            Peek under the cup, then declare — truth optional.
          </Text>
        )}
      </View>
    </View>
  );
}
