import { useEffect, useRef } from "react";
import { View, Text, Platform, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { SoloCup } from "./SoloCup";
import { DiceFace } from "./DiceFace";
import { EmoteBubble } from "./EmoteBubble";
import { formatDeclaration } from "@/utils/declarations";
import type { Player, Declaration, Roll, DieValue } from "@/types/game";
import type { EmoteId } from "@/types/realtimeEvents";
import type { GamePhase } from "@/services/store/gameSlice";

const C = {
  bg:        "#0a0a0a",
  surface:   "#0f0f0f",
  border:    "#262626",
  fg:        "#fafafa",
  fgMuted:   "#a3a3a3",
  fgFaint:   "#6f6f6f",
  accent:    "#4d7cff",
  danger:    "#f0553b",
  feltA:     "#1d2023",
  feltEdge:  "#2f3438",
  rail:      "#111315",
};
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// ---------- Speech bubble ----------

function SpeechBubble({ text, visible }: { text: string; visible: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1, { damping: 14, stiffness: 160 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 160 });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(6, { duration: 250 });
    }
  }, [visible, text]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: "absolute",
          top: -40,
          alignSelf: "center",
          backgroundColor: C.surface,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: C.border,
          paddingHorizontal: 10,
          paddingVertical: 5,
          minWidth: 44,
          alignItems: "center",
          zIndex: 20,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={{ color: C.fg, fontFamily: MONO, fontWeight: "700", fontSize: 13 }}>{text}</Text>
      {/* Triangle pointer */}
      <View
        style={{
          position: "absolute",
          bottom: -7,
          left: "50%",
          marginLeft: -5,
          width: 0,
          height: 0,
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderTopWidth: 7,
          borderStyle: "solid",
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: C.border,
        }}
      />
    </Animated.View>
  );
}

// ---------- Player seat ----------

const SEAT_BASE = 50;

function PlayerSeat({
  player,
  isCurrent,
  isMe,
  x,
  y,
  scale,
  flashing,
  isSpeaking,
  spokenText,
}: {
  player: Player;
  isCurrent: boolean;
  isMe: boolean;
  x: number;
  y: number;
  scale: number;
  flashing: boolean;
  isSpeaking: boolean;
  spokenText: string;
}) {
  const flashOpacity = useSharedValue(0);
  const ringPulse = useSharedValue(0);

  useEffect(() => {
    if (flashing) {
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 420 }),
      );
    }
  }, [flashing]);

  // Soft breathing glow on the current player's ring
  useEffect(() => {
    if (isCurrent) {
      ringPulse.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      ringPulse.value = withTiming(0, { duration: 250 });
    }
  }, [isCurrent]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * ringPulse.value,
  }));

  const seatSize = Math.round(SEAT_BASE * scale);
  const letterSize = Math.round(17 * scale);
  const nameSize = Math.max(8, Math.round(9.5 * scale));
  const heartSize = Math.max(7, Math.round(9 * scale));
  const labelW = Math.round(84 * scale);

  return (
    <View
      style={{
        position: "absolute",
        left: x - labelW / 2,
        top: y - seatSize / 2 - 14,
        width: labelW,
        alignItems: "center",
        opacity: player.isActive ? 1 : 0.3,
        zIndex: Math.round(scale * 10),
      }}
    >
      {/* Speech bubble */}
      <SpeechBubble text={spokenText} visible={isSpeaking && spokenText !== ""} />

      {/* Turn ring */}
      {isCurrent && (
        <Animated.View
          style={[
            ringStyle,
            {
              position: "absolute",
              top: -4,
              width: seatSize + 8,
              height: seatSize + 8,
              borderRadius: (seatSize + 8) / 2,
              borderWidth: 2,
              borderColor: C.accent,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Avatar */}
      <View
        style={{
          width: seatSize,
          height: seatSize,
          borderRadius: seatSize / 2,
          backgroundColor: isCurrent ? "#16233f" : "#141414",
          borderWidth: Math.max(1, Math.round(2 * scale)),
          borderColor: isCurrent ? C.accent : isMe ? C.fgFaint : "#2e2e2e",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: isCurrent ? C.accent : "#000",
          shadowOffset: { width: 0, height: isCurrent ? 0 : 2 },
          shadowOpacity: isCurrent ? 0.6 : 0.4,
          shadowRadius: isCurrent ? Math.round(9 * scale) : Math.round(4 * scale),
          elevation: isCurrent ? 8 : 3,
          overflow: "hidden",
        }}
      >
        <Text style={{ color: C.fg, fontWeight: "700", fontSize: letterSize }}>
          {player.displayName.charAt(0).toUpperCase()}
        </Text>
        {/* Life-lost red flash */}
        <Animated.View
          style={[
            flashStyle,
            {
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: C.danger,
              borderRadius: seatSize / 2,
            },
          ]}
          pointerEvents="none"
        />
      </View>

      {/* Name */}
      <Text
        style={{
          color: isMe ? C.fg : C.fgMuted,
          fontFamily: MONO,
          fontSize: nameSize,
          fontWeight: isMe ? "700" : "400",
          marginTop: 3,
          textAlign: "center",
          maxWidth: labelW,
          opacity: 0.65 + 0.35 * scale,
        }}
        numberOfLines={1}
      >
        {isMe ? "YOU" : player.displayName}
      </Text>

      {/* Hearts */}
      <View style={{ flexDirection: "row", marginTop: 2, gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < player.lives ? "heart" : "heart-outline"}
            size={heartSize}
            color={i < player.lives ? C.danger : "#3a3a3a"}
          />
        ))}
      </View>
    </View>
  );
}

// ---------- Table ----------

interface GameTableProps {
  players: Player[];
  myUserId: string;
  currentTurnUserId: string | null;
  previousTurnUserId: string | null;
  currentDeclaration: Declaration | null;
  flashUserId: string | null;
  myActualRoll: Roll | null;
  peeking: boolean;
  isRolling: boolean;
  onTogglePeek: () => void;
  isMyTurn: boolean;
  phase: GamePhase;
  revealRoll: Roll | null; // set during a challenge — cup lifts aside, these dice stay on the felt
  emotes: Record<string, { emote: EmoteId; key: number }>; // active emote bubble per userId
}

const CUP_W = 44;
const REVEAL_DIE = 30;

export function GameTable({
  players,
  myUserId,
  currentTurnUserId,
  previousTurnUserId,
  currentDeclaration,
  flashUserId,
  myActualRoll,
  peeking,
  isRolling,
  onTogglePeek,
  isMyTurn,
  phase,
  revealRoll,
  emotes,
}: GameTableProps) {
  const { width } = useWindowDimensions();

  // Perspective ellipse
  const rx_table = Math.min(width * 0.42, 190);
  const ry_table = Math.round(rx_table * 0.5);
  const TABLE_H = ry_table * 2 + 180;
  const cx = width / 2;
  const cy = TABLE_H / 2 + 10;

  const rx_seat = rx_table + 54;
  const ry_seat = ry_table + 52;
  const nearY = cy + ry_seat;
  const farY = cy - ry_seat;

  const sorted = [...players].sort((a, b) => a.turnOrder - b.turnOrder);
  const myIdx = sorted.findIndex((p) => p.userId === myUserId);
  const n = sorted.length;

  type SeatPos = { x: number; y: number; angle: number };
  const seatMapRef = useRef<Record<string, SeatPos>>({});

  const seatMap: Record<string, SeatPos> = {};
  sorted.forEach((player, i) => {
    const rotated = (i - myIdx + n) % n;
    const angle = Math.PI / 2 + (2 * Math.PI * rotated) / n;
    seatMap[player.userId] = {
      x: cx + rx_seat * Math.cos(angle),
      y: cy + ry_seat * Math.sin(angle),
      angle,
    };
  });
  seatMapRef.current = seatMap;

  // Cup rest position on the felt for a given seat angle (~78% toward the seat)
  function cupSpotFor(angle: number) {
    return {
      x: cx + rx_table * 0.78 * Math.cos(angle) - CUP_W / 2,
      y: cy + ry_table * 0.78 * Math.sin(angle) - 32,
    };
  }

  // Cup travel — slides across the felt to the current player's spot
  const cupAnimX = useSharedValue(cx - CUP_W / 2);
  const cupAnimY = useSharedValue(cy - ry_table * 0.5);

  useEffect(() => {
    const seat = seatMapRef.current[currentTurnUserId ?? ""];
    if (!seat) return;
    const target = cupSpotFor(seat.angle);
    // Slow, readable slide so everyone watches the cup travel
    cupAnimX.value = withSpring(target.x, { damping: 22, stiffness: 55 });
    cupAnimY.value = withSpring(target.y, { damping: 22, stiffness: 55 });
  }, [currentTurnUserId, width]);

  // Reveal choreography — cup lifts up, carries over, sets down beside the dice
  const revealLift = useSharedValue(0);
  const revealShift = useSharedValue(0);
  const revealDiceOpacity = useSharedValue(0);
  const revealDiceScale = useSharedValue(0.8);

  const revealActive = revealRoll != null;
  const revealSeat = seatMap[currentTurnUserId ?? ""] ?? null;
  const revealSpot = revealSeat ? cupSpotFor(revealSeat.angle) : { x: cx - CUP_W / 2, y: cy };
  // Carry the cup toward the horizontal center of the table
  const sideDir = revealSeat && Math.cos(revealSeat.angle) > 0.05 ? -1 : 1;

  useEffect(() => {
    if (revealActive) {
      revealLift.value = withSequence(
        withTiming(-84, { duration: 380, easing: Easing.out(Easing.cubic) }),
        withDelay(320, withSpring(0, { damping: 13, stiffness: 130 })),
      );
      revealShift.value = withDelay(
        340,
        withTiming(sideDir * (CUP_W + 46), { duration: 420, easing: Easing.inOut(Easing.cubic) }),
      );
      revealDiceOpacity.value = withDelay(300, withTiming(1, { duration: 260 }));
      revealDiceScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 160 }));
    } else {
      revealLift.value = withTiming(0, { duration: 200 });
      revealShift.value = withTiming(0, { duration: 200 });
      revealDiceOpacity.value = withTiming(0, { duration: 150 });
      revealDiceScale.value = 0.8;
    }
  }, [revealActive]);

  const cupAnimStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: cupAnimX.value,
    top: cupAnimY.value,
    zIndex: 15,
    transform: [{ translateY: revealLift.value }, { translateX: revealShift.value }],
  }));

  const revealDiceStyle = useAnimatedStyle(() => ({
    opacity: revealDiceOpacity.value,
    transform: [{ scale: revealDiceScale.value }],
  }));

  const rimRx = rx_table + 14;
  const rimRy = ry_table + 14;

  return (
    <View style={{ width, height: TABLE_H }}>
      {/* Outer rail */}
      <View
        style={{
          position: "absolute",
          left: cx - rimRx,
          top: cy - rimRy,
          width: rimRx * 2,
          height: rimRy * 2,
          backgroundColor: C.rail,
          borderRadius: rimRx,
          borderWidth: 1,
          borderColor: "#1f2224",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.6,
          shadowRadius: 22,
          elevation: 14,
        }}
      />

      {/* Felt surface */}
      <View
        style={{
          position: "absolute",
          left: cx - rx_table,
          top: cy - ry_table,
          width: rx_table * 2,
          height: ry_table * 2,
          backgroundColor: C.feltA,
          borderRadius: rx_table,
          borderWidth: 1,
          borderColor: C.feltEdge,
          overflow: "hidden",
        }}
      >
        {/* Depth shadow — far (top) half darker */}
        <View
          style={{
            position: "absolute",
            left: 0, top: 0,
            width: rx_table * 2,
            height: ry_table,
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        />
        {/* Near-edge highlight */}
        <View
          style={{
            position: "absolute",
            left: rx_table * 0.15,
            bottom: 4,
            width: rx_table * 1.7,
            height: 5,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        />
      </View>

      {/* Felt inner ring */}
      <View
        style={{
          position: "absolute",
          left: cx - rx_table + 12,
          top: cy - ry_table + 9,
          width: (rx_table - 12) * 2,
          height: (ry_table - 9) * 2,
          borderRadius: rx_table - 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.05)",
        }}
        pointerEvents="none"
      />

      {/* Center call marker — the floor to beat */}
      <View
        style={{
          position: "absolute",
          left: cx - 70,
          top: cy - ry_table * 0.16 - 16,
          width: 140,
          alignItems: "center",
        }}
        pointerEvents="none"
      >
        <Text style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase" }}>
          {currentDeclaration != null ? "Current call" : "Open table"}
        </Text>
        {currentDeclaration != null && (
          <Text style={{ fontFamily: MONO, fontSize: 22, fontWeight: "700", color: C.fg, marginTop: 1 }}>
            {formatDeclaration(currentDeclaration)}
          </Text>
        )}
      </View>

      {/* Revealed dice — left behind on the felt when the cup is pulled */}
      {revealRoll && (
        <Animated.View
          style={[
            revealDiceStyle,
            {
              position: "absolute",
              // centered on the cup's spot, resting where the cup's mouth was
              left: revealSpot.x + (CUP_W + 16) / 2 - (REVEAL_DIE * 2 + 6) / 2,
              top: revealSpot.y + 92 - 14 - REVEAL_DIE,
              flexDirection: "row",
              gap: 6,
              zIndex: 12,
            },
          ]}
          pointerEvents="none"
        >
          <DiceFace value={revealRoll[0] as DieValue} size={REVEAL_DIE} />
          <DiceFace value={revealRoll[1] as DieValue} size={REVEAL_DIE} />
        </Animated.View>
      )}

      {/* Animated cup — travels to the current player, lifts aside on a reveal */}
      <Animated.View style={cupAnimStyle}>
        <SoloCup
          roll={isMyTurn ? myActualRoll : null}
          peeking={peeking}
          onToggle={onTogglePeek}
          isRolling={isRolling}
          interactive={isMyTurn && phase === "my_turn_declare" && !revealActive}
          isMyTurn={isMyTurn && !revealActive}
        />
      </Animated.View>

      {/* Player seats */}
      {sorted.map((player) => {
        const seat = seatMap[player.userId];
        const depthT = (seat.y - farY) / (nearY - farY);
        const scale = 0.62 + 0.38 * Math.max(0, Math.min(1, depthT));
        const isSpeaking = player.userId === previousTurnUserId && currentDeclaration != null;

        return (
          <PlayerSeat
            key={player.userId}
            player={player}
            isCurrent={player.userId === currentTurnUserId}
            isMe={player.userId === myUserId}
            x={seat.x}
            y={seat.y}
            scale={scale}
            flashing={player.userId === flashUserId}
            isSpeaking={isSpeaking}
            spokenText={isSpeaking ? formatDeclaration(currentDeclaration!) : ""}
          />
        );
      })}

      {/* Emote bubbles — keyed so a repeat taunt re-pops */}
      {sorted.map((player) => {
        const active = emotes[player.userId];
        if (!active) return null;
        const seat = seatMap[player.userId];
        return (
          <EmoteBubble
            key={`${player.userId}-${active.key}`}
            emote={active.emote}
            anchorX={seat.x}
            anchorY={seat.y}
            onRight={seat.x > cx}
          />
        );
      })}
    </View>
  );
}
