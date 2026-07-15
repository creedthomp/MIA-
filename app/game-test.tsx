import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GameTable2 } from "@/components/game2/GameTable2";
import { VerdictSheet } from "@/components/game2/VerdictSheet";
import type { TablePlayer } from "@/components/game2/PlayerPlaque";
import { DeclarationInput } from "@/components/game/DeclarationInput";
import { EmotePicker } from "@/components/game/EmotePicker";
import { playEmotePop } from "@/services/sounds";
import { rollDice, rollToDeclaration } from "@/utils/dice";
import { getRank } from "@/utils/rollHierarchy";
import { resolveChallenge } from "@/utils/challenge";
import { ALL_DECLARATIONS, formatDeclaration } from "@/utils/declarations";
import type { Declaration, Roll } from "@/types/game";
import type { EmoteId } from "@/types/realtimeEvents";

const C = {
  bg:       "#0a0a0a",
  surface:  "#0f0f0f",
  card:     "#111318",
  border:   "#262626",
  fg:       "#fafafa",
  fgMuted:  "#a3a3a3",
  fgFaint:  "#6f6f6f",
  accent:   "#4d7cff",
  onAccent: "#ffffff",
  danger:   "#f0553b",
  ok:       "#4ade80",
};
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const REVEAL_MS = 2400;

type MockPhase =
  | "bot_turn"
  | "my_pre"
  | "my_declare"
  | "reveal"
  | "verdict"
  | "game_over";

interface Verdict {
  wasHonest: boolean;
  challengerId: string;
  loserId: string;
  livesLost: number;
  isEliminated: boolean;
  revealedRoll: Roll;
  declared: Declaration;
}

interface GState {
  players: TablePlayer[];
  currentId: string | null;
  prevId: string | null;
  call: Declaration | null;
  prevActual: Roll | null;
  myRoll: Roll | null;
  peeking: boolean;
  isRolling: boolean;
  phase: MockPhase;
  flashId: string | null;
  revealRoll: Roll | null;
  verdict: Verdict | null;
  winnerId: string | null;
  roundKey: number;
  cupTint: string;
}

// Random saturated mid-tone — for trying out cup colorways
function randomCupColor(): string {
  const h = Math.random() * 360;
  const s = 0.5 + Math.random() * 0.25;
  const l = 0.4 + Math.random() * 0.15;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function initG(): GState {
  return {
    players: [
      { id: "me",   name: "You",  lives: 5, isActive: true },
      { id: "nova", name: "Nova", lives: 5, isActive: true },
      { id: "rex",  name: "Rex",  lives: 5, isActive: true },
      { id: "juno", name: "Juno", lives: 5, isActive: true },
    ],
    currentId: null,
    prevId: null,
    call: null,
    prevActual: null,
    myRoll: null,
    peeking: false,
    isRolling: false,
    phase: "bot_turn",
    flashId: null,
    revealRoll: null,
    verdict: null,
    winnerId: null,
    roundKey: 0,
    cupTint: randomCupColor(),
  };
}

const RANKED = [...ALL_DECLARATIONS].sort((a, b) => getRank(a) - getRank(b));
function minAbove(call: Declaration): Declaration | null {
  return RANKED.find((d) => getRank(d) > getRank(call)) ?? null;
}

// ---------- Screen ----------

export default function GameTestScreen() {
  const router = useRouter();
  const gRef = useRef<GState>(initG());
  const g = gRef.current;
  const [, forceRender] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [activeEmotes, setActiveEmotes] = useState<Record<string, { emote: EmoteId; key: number }>>({});
  const emoteKeyRef = useRef(0);
  const emoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync = () => forceRender((x) => x + 1);

  function after(ms: number, fn: () => void) {
    timersRef.current.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }

  useEffect(() => {
    after(900, () => startTurn("nova"));
    return () => {
      clearTimers();
      if (emoteTimerRef.current) clearTimeout(emoteTimerRef.current);
    };
  }, []);

  // ---------- Engine ----------

  function nextActive(fromId: string): TablePlayer {
    const idx = g.players.findIndex((p) => p.id === fromId);
    for (let i = 1; i <= g.players.length; i++) {
      const cand = g.players[(idx + i) % g.players.length];
      if (cand.isActive) return cand;
    }
    return g.players[idx];
  }

  function activeCount(): number {
    return g.players.filter((p) => p.isActive).length;
  }

  function startTurn(playerId: string) {
    g.currentId = playerId;
    if (playerId === "me") {
      g.phase = "my_pre";
      sync();
      return;
    }
    g.phase = "bot_turn";
    sync();
    after(1700 + Math.random() * 900, () => botAct(playerId));
  }

  function botChallengeChance(): number {
    if (g.call == null || g.prevActual == null || g.prevId == null) return 0;
    if (g.call === 21) return 1; // nothing beats Mia — forced challenge
    if (g.call % 11 === 0) return 0.3; // doubles are suspicious
    if (getRank(g.call) >= getRank(63)) return 0.18;
    return 0.08;
  }

  function botAct(botId: string) {
    if (Math.random() < botChallengeChance()) {
      startReveal(botId);
      return;
    }

    // Visibly shake the cup before declaring — everyone sees the roll happen
    g.isRolling = true;
    sync();

    after(1200 + Math.random() * 500, () => {
      g.isRolling = false;

      // Roll and declare — truth when it beats the call, minimal lie otherwise
      const roll = rollDice();
      const actualD = rollToDeclaration(roll);
      let declared: Declaration = actualD;
      if (g.call != null && getRank(actualD) <= getRank(g.call)) {
        declared = minAbove(g.call) ?? actualD;
      } else if (Math.random() < 0.12) {
        declared = minAbove(actualD) ?? actualD; // occasional overbid for spice
      }

      g.call = declared;
      g.prevActual = roll;
      g.prevId = botId;
      startTurn(nextActive(botId).id);
    });
  }

  function startReveal(challengerId: string) {
    if (g.call == null || g.prevActual == null || g.prevId == null) return;
    g.phase = "reveal";
    g.currentId = challengerId;
    g.revealRoll = g.prevActual;
    sync();

    const declared = g.call;
    const actualRoll = g.prevActual;
    const prevId = g.prevId;

    after(REVEAL_MS, () => {
      const outcome = resolveChallenge(challengerId, prevId, declared, actualRoll);
      const loser = g.players.find((p) => p.id === outcome.loserUserId)!;
      loser.lives = Math.max(0, loser.lives - outcome.livesLost);
      loser.isActive = loser.lives > 0;

      g.flashId = loser.id;
      after(800, () => { g.flashId = null; sync(); });

      g.verdict = {
        wasHonest: outcome.wasHonest,
        challengerId,
        loserId: loser.id,
        livesLost: outcome.livesLost,
        isEliminated: !loser.isActive,
        revealedRoll: actualRoll,
        declared,
      };
      g.phase = "verdict";
      sync();

      // Auto-dismiss after 3s (Continue still skips it early)
      const shown = g.verdict;
      after(3000, () => {
        if (g.verdict === shown) dismissVerdict();
      });
    });
  }

  function dismissVerdict() {
    const v = g.verdict;
    g.verdict = null;
    g.revealRoll = null;
    if (!v) return;

    if (activeCount() < 2 || !g.players.find((p) => p.id === "me")?.isActive) {
      endGame();
      return;
    }

    // House rule: the player AFTER the one who lost a life opens the next round.
    // (Failed challenge → the player after the challenger; caught lie → the
    // challenger, who sits right after the liar.)
    nextRound(nextActive(v.loserId).id);
  }

  function nextRound(starterId: string) {
    g.call = null;
    g.prevActual = null;
    g.prevId = null;
    g.myRoll = null;
    g.peeking = false;
    g.roundKey += 1;
    const starter = g.players.find((p) => p.id === starterId);
    startTurn(starter?.isActive ? starterId : nextActive(starterId).id);
  }

  function endGame() {
    const alive = g.players.filter((p) => p.isActive);
    g.winnerId = alive.length === 1
      ? alive[0].id
      : [...g.players].sort((a, b) => b.lives - a.lives)[0].id;
    g.phase = "game_over";
    g.currentId = null;
    sync();
  }

  // ---------- My actions ----------

  function sendEmote(emote: EmoteId) {
    playEmotePop();
    emoteKeyRef.current += 1;
    setActiveEmotes({ me: { emote, key: emoteKeyRef.current } });
    if (emoteTimerRef.current) clearTimeout(emoteTimerRef.current);
    emoteTimerRef.current = setTimeout(() => setActiveEmotes({}), 2450);
  }

  function handleRoll() {
    g.isRolling = true;
    g.peeking = false;
    sync();
    after(1400, () => {
      g.myRoll = rollDice();
      g.isRolling = false;
      g.phase = "my_declare";
      sync();
    });
  }

  function handleDeclare(d: Declaration) {
    if (g.call != null && getRank(d) < getRank(g.call)) {
      // Below the call — forfeit a life, next player opens fresh
      const me = g.players.find((p) => p.id === "me")!;
      me.lives = Math.max(0, me.lives - 1);
      me.isActive = me.lives > 0;
      g.flashId = "me";
      g.peeking = false;
      sync();
      after(800, () => {
        g.flashId = null;
        if (!me.isActive || activeCount() < 2) { endGame(); return; }
        nextRound(nextActive("me").id);
      });
      return;
    }

    g.call = d;
    g.prevActual = g.myRoll;
    g.prevId = "me";
    g.peeking = false;
    startTurn(nextActive("me").id);
  }

  function handlePullIt() {
    startReveal("me");
  }

  function handleReset() {
    clearTimers();
    gRef.current = initG();
    sync();
    after(900, () => startTurn("nova"));
  }

  // ---------- Render ----------

  const currentPlayer = g.players.find((p) => p.id === g.currentId);
  const challengerName = g.phase === "reveal" ? currentPlayer?.name : null;
  const winner = g.players.find((p) => p.id === g.winnerId);
  const canPullIt = g.call != null && g.prevId != null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Verdict sheet */}
      {g.phase === "verdict" && g.verdict && (
        <VerdictSheet
          wasHonest={g.verdict.wasHonest}
          challengerName={g.players.find((p) => p.id === g.verdict!.challengerId)?.name ?? "Someone"}
          loserName={g.players.find((p) => p.id === g.verdict!.loserId)?.name ?? "Someone"}
          livesLost={g.verdict.livesLost}
          isEliminated={g.verdict.isEliminated}
          revealedRoll={g.verdict.revealedRoll}
          declared={g.verdict.declared}
          onContinue={dismissVerdict}
        />
      )}

      {/* Game over */}
      {g.phase === "game_over" && (
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
              backgroundColor: C.card, borderRadius: 22, padding: 32,
              width: "100%", maxWidth: 380, alignItems: "center",
              borderWidth: 1, borderColor: "#22242a",
            }}
          >
            <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.fgFaint, textTransform: "uppercase", marginBottom: 10 }}>
              Game over
            </Text>
            <Text style={{ color: C.fg, fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginBottom: 24, textAlign: "center" }}>
              {winner?.id === "me" ? "You win." : `${winner?.name ?? "Someone"} wins.`}
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: C.accent, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 40, marginBottom: 12 }}
              onPress={handleReset}
            >
              <Text style={{ color: C.onAccent, fontWeight: "700", fontSize: 15 }}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgFaint }}>Exit preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header */}
      <SafeAreaView>
        <View
          style={{
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 6, marginRight: 10 }}>
            <Ionicons name="arrow-back" size={20} color={C.fg} />
          </TouchableOpacity>
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", flex: 1 }}>
            Table v2 — design preview
          </Text>
          <TouchableOpacity onPress={handleReset} style={{ padding: 6 }}>
            <Ionicons name="refresh" size={18} color={C.fgMuted} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Table */}
      <View>
        <GameTable2
          players={g.players}
          myId="me"
          currentId={g.currentId}
          prevId={g.prevId}
          callValue={g.call}
          flashId={g.flashId}
          myRoll={g.myRoll}
          peeking={g.peeking}
          isRolling={g.isRolling}
          onTogglePeek={() => { g.peeking = !g.peeking; sync(); }}
          cupInteractive={g.phase === "my_declare"}
          revealRoll={g.revealRoll}
          cupTint={g.cupTint}
          emotes={activeEmotes}
        />
        <EmotePicker onSend={sendEmote} />
      </View>

      {/* Declare input */}
      {g.phase === "my_declare" && (
        <View style={{ marginTop: 2 }}>
          <DeclarationInput
            key={g.roundKey}
            currentDeclaration={g.call}
            onDeclare={handleDeclare}
          />
        </View>
      )}

      {/* Action panel */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 34, marginTop: "auto" }}>
        {g.phase === "bot_turn" && currentPlayer && (
          <View
            style={{
              backgroundColor: C.surface, borderRadius: 14, padding: 15,
              alignItems: "center", borderWidth: 1, borderColor: "#1d1f24",
            }}
          >
            <Text style={{ fontFamily: MONO, color: C.fgFaint, fontSize: 12 }}>
              <Text style={{ color: C.fg, fontWeight: "700" }}>{currentPlayer.name}</Text>
              {g.isRolling ? " shakes the cup…" : " is thinking…"}
            </Text>
          </View>
        )}

        {g.phase === "reveal" && (
          <View style={{ alignItems: "center", padding: 15 }}>
            <Text style={{ fontFamily: MONO, color: C.danger, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
              {challengerName === "You" ? "You pull it!" : `${challengerName ?? "Someone"} pulls it!`}
            </Text>
          </View>
        )}

        {g.phase === "my_pre" && (
          <View>
            <Text style={{ fontFamily: MONO, color: C.accent, textAlign: "center", fontWeight: "700", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
              Your turn
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {canPullIt && (
                <TouchableOpacity
                  style={{
                    flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center",
                    borderWidth: 1.5, borderColor: C.danger,
                  }}
                  onPress={handlePullIt}
                >
                  <Text style={{ color: C.danger, fontWeight: "700", fontSize: 15 }}>Pull It</Text>
                  <Text style={{ fontFamily: MONO, color: C.fgFaint, fontSize: 9, marginTop: 2 }}>call the bluff</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  flex: 1, borderRadius: 14, paddingVertical: 16,
                  alignItems: "center", backgroundColor: C.accent,
                }}
                onPress={handleRoll}
              >
                <Text style={{ color: C.onAccent, fontWeight: "700", fontSize: 15 }}>Roll</Text>
                <Text style={{ fontFamily: MONO, color: "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 2 }}>
                  {g.call != null ? `then beat ${formatDeclaration(g.call)}` : "open the round"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {g.phase === "my_declare" && (
          <Text style={{ fontFamily: MONO, color: C.fgFaint, fontSize: 10, textAlign: "center", letterSpacing: 1 }}>
            Peek under the cup, then declare — truth optional.
          </Text>
        )}
      </View>
    </View>
  );
}
