import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useStore } from "@/services/store";
import { subscribeToGame, unsubscribeFromGame, broadcastGameEvent } from "@/services/gameChannel";
import { initGameTurn } from "@/services/gameService";
import { formatDeclaration } from "@/utils/declarations";
import { getRank } from "@/utils/rollHierarchy";
import { nextActivePlayer } from "@/utils/turnOrder";
import { DiceFace } from "@/components/game/DiceFace";
import { DeclarationInput } from "@/components/game/DeclarationInput";
import { GameTable } from "@/components/game/GameTable";
import type { Player, Declaration, DieValue, Roll } from "@/types/game";

// ---------- Sub-components ----------

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

function ChallengeOverlay({
  result,
  players,
  onDismiss,
}: {
  result: ChallengeResult;
  players: Player[];
  onDismiss: () => void;
}) {
  const loser = players.find((p) => p.userId === result.loserUserId);
  const actual = result.revealedRoll[0] * 10 + result.revealedRoll[1];
  const honest = result.wasHonest;

  return (
    <View
      style={{
        position: "absolute",
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: "rgba(0,0,0,0.88)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      <View
        style={{
          backgroundColor: "#111827",
          borderRadius: 24,
          padding: 28,
          width: "85%",
          alignItems: "center",
          borderWidth: 1,
          borderColor: honest ? "#16a34a" : "#e94560",
        }}
      >
        {/* X dismiss button */}
        <TouchableOpacity
          onPress={onDismiss}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#1e2a40",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#9ca3af", fontSize: 14, fontWeight: "700" }}>✕</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 44, marginBottom: 6 }}>
          {honest ? "✅" : "🤥"}
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 }}>
          {honest ? "Honest!" : "Caught lying!"}
        </Text>
        <Text style={{ color: "#9ca3af", fontSize: 12, marginBottom: 20, textAlign: "center" }}>
          Declared: {formatDeclaration(result.declared)} · Actual: {formatDeclaration(actual)}
        </Text>
        <View style={{ flexDirection: "row", gap: 14, marginBottom: 20 }}>
          <DiceFace value={result.revealedRoll[0] as DieValue} size={76} dark />
          <DiceFace value={result.revealedRoll[1] as DieValue} size={76} dark />
        </View>
        <View
          style={{
            backgroundColor: honest ? "rgba(22,163,74,0.15)" : "rgba(233,69,96,0.15)",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: honest ? "#4ade80" : "#e94560",
              fontWeight: "700",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {loser?.displayName ?? "Someone"} loses {result.livesLost}{" "}
            {result.livesLost === 1 ? "life" : "lives"}
            {result.isEliminated ? " — eliminated!" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={{
            backgroundColor: honest ? "#16a34a" : "#e94560",
            borderRadius: 14,
            paddingVertical: 11,
            paddingHorizontal: 36,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            Continue
          </Text>
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
  const [showChallengeResult, setShowChallengeResult] = useState(false);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [flashUserId, setFlashUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [roundKey, setRoundKey] = useState(0); // bumped each round to reset DeclarationInput

  const isChallengerRef = useRef(false);
  const startingRef = useRef(false);
  const nextRoundStarterRef = useRef<string | null>(null);

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
      unsubscribeFromGame();
      resetGame();
    };
  }, [roomId, user?.id]);

  // Reset per-round state on new round
  useEffect(() => {
    if (lastEvent?.type === "ROUND_STARTED") {
      setPeeking(false);
      setActionError(null);
      setRoundKey((k) => k + 1);
    }
  }, [lastEvent]);

  // Show challenge result overlay for non-challenger clients
  useEffect(() => {
    if (lastEvent?.type === "CHALLENGE_RESOLVED" && !isChallengerRef.current) {
      const p = lastEvent.payload;
      setChallengeResult({
        wasHonest: p.wasHonest,
        loserUserId: p.loserUserId,
        livesLost: p.livesLost,
        newLives: 0, // we don't have this here; updated via LIFE_LOST
        isEliminated: false,
        revealedRoll: p.revealedRoll as unknown as Roll,
        declared: p.declared,
        winnerUserId: null,
      });
      setShowChallengeResult(true);
    }
  }, [lastEvent]);

  // Flash the seat of whoever just lost a life
  useEffect(() => {
    if (lastEvent?.type === "LIFE_LOST") {
      const userId = lastEvent.payload?.userId as string | undefined;
      if (userId) {
        setFlashUserId(userId);
        setTimeout(() => setFlashUserId(null), 800);
      }
    }
  }, [lastEvent]);

  // ---------- Actions ----------

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

    isChallengerRef.current = true;
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
      isChallengerRef.current = false;
      // Unblock everyone from challenge_pending
      await broadcastGameEvent({ type: "CHALLENGE_CANCELLED", payload: {} });
      return;
    }

    const result = data as ChallengeResult;

    // Show overlay immediately for the challenger
    setChallengeResult(result);
    setShowChallengeResult(true);

    // Broadcast resolution to all peers
    await broadcastGameEvent({
      type: "CHALLENGE_RESOLVED",
      payload: {
        wasHonest: result.wasHonest,
        loserUserId: result.loserUserId,
        livesLost: result.livesLost,
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
      setShowChallengeResult(false);
      isChallengerRef.current = false;
    } else {
      // Winner of the challenge goes first next round
      const prevTurnId = previousTurnUserId;
      const challengerId = user.id;
      nextRoundStarterRef.current = result.wasHonest ? prevTurnId : challengerId;
      // Overlay stays up until the challenger taps X (dismissChallengeOverlay)
    }
  }

  async function dismissChallengeOverlay() {
    setShowChallengeResult(false);
    if (isChallengerRef.current && nextRoundStarterRef.current) {
      isChallengerRef.current = false;
      const starter = nextRoundStarterRef.current;
      nextRoundStarterRef.current = null;
      await startNextRound(starter);
    }
  }

  async function startNextRound(starterUserId: string) {
    // Read latest state — store may have updated after LIFE_LOST was applied
    const { gamePlayers: latest } = useStore.getState();
    const active = latest
      .filter((p) => p.isActive)
      .sort((a, b) => a.turnOrder - b.turnOrder);

    if (active.length < 2) return; // game over — already handled

    // Winner of the challenge starts next round; fall back to first active if eliminated
    const winnerActive = active.find((p) => p.userId === starterUserId);
    const starter = winnerActive ?? active[0];
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
      <View style={{ flex: 1, backgroundColor: "#0a1628", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0a1628" }}>
      {/* ── Overlays ── */}
      {showChallengeResult && challengeResult && (
        <ChallengeOverlay
          result={challengeResult}
          players={gamePlayers}
          onDismiss={dismissChallengeOverlay}
        />
      )}

      {phase === "game_over" && (
        <View
          style={{
            position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: "rgba(0,0,0,0.92)",
            alignItems: "center", justifyContent: "center", zIndex: 300,
          }}
        >
          <View
            style={{
              backgroundColor: "#16213e", borderRadius: 24, padding: 32,
              width: "85%", alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 52, marginBottom: 8 }}>🏆</Text>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 6 }}>
              {winner?.userId === user?.id ? "You win!" : `${winner?.displayName ?? "Someone"} wins!`}
            </Text>
            <Text style={{ color: "#a0a0b0", fontSize: 13, marginBottom: 24, textAlign: "center" }}>
              Well played!
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: "#e94560", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 40 }}
              onPress={() => router.back()}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Back to Lobby</Text>
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
            style={{ padding: 6, marginRight: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color="#e8e8f0" />
          </TouchableOpacity>
          <Text style={{ color: "#e8e8f0", fontSize: 17, fontWeight: "700", flex: 1 }}>
            Mia
          </Text>
          {!amIActive && phase !== "game_over" && (
            <View
              style={{
                backgroundColor: "#1e2a40", borderRadius: 20,
                paddingHorizontal: 10, paddingVertical: 4,
              }}
            >
              <Text style={{ color: "#a0a0b0", fontSize: 11 }}>👻 Spectating</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── Reconnecting banner ── */}
      {!connected && (
        <View
          style={{
            backgroundColor: "#7c3aed",
            paddingVertical: 6,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator size="small" color="#fff" />
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
            Reconnecting…
          </Text>
        </View>
      )}

      {/* ── Table ── */}
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
      />

      {/* ── Declaration input — compact, right below the table ── */}
      {phase === "my_turn_declare" && isMyTurn && amIActive && (
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
          <Text style={{ color: "#e94560", fontSize: 12, textAlign: "center", marginBottom: 8 }}>
            {actionError}
          </Text>
        )}

        {/* Spectator */}
        {!amIActive && phase !== "game_over" && (
          <View
            style={{
              backgroundColor: "#111827", borderRadius: 14, padding: 16,
              alignItems: "center", borderWidth: 1, borderColor: "#1e2a40",
            }}
          >
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              You've been eliminated — watching the game
            </Text>
          </View>
        )}

        {/* Waiting / starting */}
        {amIActive && phase === "waiting" && (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, padding: 14 }}>
            <ActivityIndicator color="#e94560" size="small" />
            <Text style={{ color: "#6b7280", fontSize: 13 }}>Starting round…</Text>
          </View>
        )}

        {/* Other player's turn */}
        {amIActive && phase === "others_turn" && currentPlayer && (
          <View
            style={{
              backgroundColor: "#111827", borderRadius: 14, padding: 14,
              alignItems: "center", borderWidth: 1, borderColor: "#1e2a40",
            }}
          >
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              Waiting for{" "}
              <Text style={{ color: "#e8e8f0", fontWeight: "700" }}>
                {currentPlayer.displayName}
              </Text>
              …
            </Text>
          </View>
        )}

        {/* Challenge pending */}
        {amIActive && phase === "challenge_pending" && (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, padding: 14 }}>
            <ActivityIndicator color="#e94560" size="small" />
            <Text style={{ color: "#6b7280", fontSize: 13 }}>Resolving challenge…</Text>
          </View>
        )}

        {/* My turn — roll */}
        {amIActive && phase === "my_turn_pre_roll" && (
          <View>
            <Text style={{ color: "#e94560", textAlign: "center", fontWeight: "700", fontSize: 14, marginBottom: 10 }}>
              Your turn
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {canPullIt && (
                <TouchableOpacity
                  style={{
                    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center",
                    borderWidth: 2, borderColor: "#e94560", backgroundColor: "transparent",
                  }}
                  onPress={handlePullIt}
                >
                  <Text style={{ color: "#e94560", fontWeight: "700", fontSize: 15 }}>Pull It 👀</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  flex: 1, borderRadius: 14, paddingVertical: 14,
                  alignItems: "center", backgroundColor: "#e94560",
                }}
                onPress={handleRoll}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Roll 🎲</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My turn — declare (input handled above the action panel) */}
        {amIActive && phase === "my_turn_declare" && canPullIt && (
          <TouchableOpacity
            style={{
              borderRadius: 14, paddingVertical: 14, alignItems: "center",
              borderWidth: 2, borderColor: "#e94560", backgroundColor: "transparent",
              marginTop: 8,
            }}
            onPress={handlePullIt}
          >
            <Text style={{ color: "#e94560", fontWeight: "700", fontSize: 15 }}>Pull It 👀</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
