import { useEffect } from "react";
import { View, Text, Platform, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { DiceCup, CUP_W, CUP_AREA_H } from "./DiceCup";
import { Die } from "./Die";
import { PlayerPlaque, type TablePlayer } from "./PlayerPlaque";
import { formatDeclaration } from "@/utils/declarations";
import type { Declaration, Roll, DieValue } from "@/types/game";

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const C = {
  fg:       "#fafafa",
  fgFaint:  "#6f6f6f",
  accent:   "#4d7cff",
  felt:     "#14171c",
  feltRing: "rgba(255,255,255,0.035)",
  rail:     "#1a1c20",
  railEdge: "#26282c",
};

const REVEAL_DIE = 32;

interface GameTable2Props {
  players: TablePlayer[]; // in turn order
  myId: string;
  currentId: string | null;
  prevId: string | null; // last declarer — shows the call chip
  callValue: Declaration | null;
  flashId: string | null;
  myRoll: Roll | null;
  peeking: boolean;
  isRolling: boolean;
  onTogglePeek: () => void;
  cupInteractive: boolean;
  revealRoll: Roll | null;
  cupTint?: string;
}

export function GameTable2({
  players,
  myId,
  currentId,
  prevId,
  callValue,
  flashId,
  myRoll,
  peeking,
  isRolling,
  onTogglePeek,
  cupInteractive,
  revealRoll,
  cupTint,
}: GameTable2Props) {
  const { width, height } = useWindowDimensions();

  // Table radius — sized so plaques always fit on screen and the felt
  // has room for the cup pad well inside the rim
  const R = Math.max(104, Math.min(width / 2 - 82, height * 0.225, 185));
  const cx = width / 2;
  const cy = R + 115;
  const TABLE_H = 2 * R + 230;

  const n = players.length;
  const myIdx = Math.max(0, players.findIndex((p) => p.id === myId));

  // Seat angles — me at the bottom, others clockwise by turn order
  const seatMap: Record<string, { x: number; y: number; angle: number }> = {};
  players.forEach((p, i) => {
    const rotated = (i - myIdx + n) % n;
    const angle = Math.PI / 2 + (2 * Math.PI * rotated) / n;
    seatMap[p.id] = {
      x: cx + (R + 34) * Math.cos(angle),
      y: cy + (R + 56) * Math.sin(angle),
      angle,
    };
  });

  // Cup pad — well inside the felt so cup + dice never touch the seats
  const PAD_R = R * 0.56;
  function padFor(angle: number) {
    return {
      x: cx + PAD_R * Math.cos(angle),
      y: cy + PAD_R * Math.sin(angle),
    };
  }

  const currentSeat = seatMap[currentId ?? ""] ?? null;
  const pad = currentSeat ? padFor(currentSeat.angle) : { x: cx, y: cy };

  // Cup travel
  const cupX = useSharedValue(cx);
  const cupY = useSharedValue(cy);

  useEffect(() => {
    cupX.value = withSpring(pad.x, { damping: 24, stiffness: 50 });
    cupY.value = withSpring(pad.y, { damping: 24, stiffness: 50 });
  }, [currentId, width, height]);

  // Reveal — cup lifts, carries toward the table center, sets down
  const revealLift = useSharedValue(0);
  const revealShiftX = useSharedValue(0);
  const revealShiftY = useSharedValue(0);
  const revealDiceOpacity = useSharedValue(0);
  const revealDiceScale = useSharedValue(0.8);

  const revealActive = revealRoll != null;

  useEffect(() => {
    if (revealActive) {
      // Direction from the pad toward the table center
      const dx = cx - pad.x;
      const dy = cy - pad.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const carry = R * 0.52;

      revealLift.value = withSequence(
        withTiming(-100, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withDelay(340, withSpring(0, { damping: 13, stiffness: 130 })),
      );
      revealShiftX.value = withDelay(
        360,
        withTiming((dx / len) * carry, { duration: 430, easing: Easing.inOut(Easing.cubic) }),
      );
      revealShiftY.value = withDelay(
        360,
        withTiming((dy / len) * carry, { duration: 430, easing: Easing.inOut(Easing.cubic) }),
      );
      revealDiceOpacity.value = withDelay(320, withTiming(1, { duration: 260 }));
      revealDiceScale.value = withDelay(320, withSpring(1, { damping: 12, stiffness: 160 }));
    } else {
      revealLift.value = withTiming(0, { duration: 200 });
      revealShiftX.value = withTiming(0, { duration: 200 });
      revealShiftY.value = withTiming(0, { duration: 200 });
      revealDiceOpacity.value = withTiming(0, { duration: 150 });
      revealDiceScale.value = 0.8;
    }
  }, [revealActive]);

  const cupStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: cupX.value - (CUP_W + 20) / 2,
    top: cupY.value - 86,
    zIndex: 15,
    transform: [
      { translateY: revealLift.value + revealShiftY.value },
      { translateX: revealShiftX.value },
    ],
  }));

  const revealDiceStyle = useAnimatedStyle(() => ({
    opacity: revealDiceOpacity.value,
    transform: [{ scale: revealDiceScale.value }],
  }));

  const isMyTurn = currentId === myId;

  return (
    <View style={{ width, height: TABLE_H }}>
      {/* Rail */}
      <View
        style={{
          position: "absolute",
          left: cx - R - 14,
          top: cy - R - 14,
          width: (R + 14) * 2,
          height: (R + 14) * 2,
          borderRadius: R + 14,
          backgroundColor: C.rail,
          borderWidth: 1,
          borderColor: C.railEdge,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.6,
          shadowRadius: 26,
          elevation: 16,
        }}
      />

      {/* Felt */}
      <View
        style={{
          position: "absolute",
          left: cx - R,
          top: cy - R,
          width: R * 2,
          height: R * 2,
          borderRadius: R,
          backgroundColor: C.felt,
          borderWidth: 1,
          borderColor: "#20232a",
        }}
      />

      {/* Concentric felt rings */}
      {[0.72, 0.45].map((f) => (
        <View
          key={f}
          style={{
            position: "absolute",
            left: cx - R * f,
            top: cy - R * f,
            width: R * f * 2,
            height: R * f * 2,
            borderRadius: R * f,
            borderWidth: 1,
            borderColor: C.feltRing,
          }}
          pointerEvents="none"
        />
      ))}

      {/* Center — the call to beat */}
      <View
        style={{
          position: "absolute",
          left: cx - 80,
          top: cy - 26,
          width: 160,
          alignItems: "center",
        }}
        pointerEvents="none"
      >
        <Text style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 3, color: C.fgFaint, textTransform: "uppercase" }}>
          {callValue != null ? "Current call" : "Open table"}
        </Text>
        {callValue != null && (
          <Text style={{ fontFamily: MONO, fontSize: 30, fontWeight: "700", color: C.fg, marginTop: 2 }}>
            {formatDeclaration(callValue)}
          </Text>
        )}
      </View>

      {/* Cup pad marker at the current player's spot */}
      {currentId && (
        <View
          style={{
            position: "absolute",
            left: pad.x - 46,
            top: pad.y - 46,
            width: 92,
            height: 92,
            borderRadius: 46,
            backgroundColor: "rgba(0,0,0,0.25)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.03)",
          }}
          pointerEvents="none"
        />
      )}

      {/* Revealed dice — left on the pad when the cup is pulled */}
      {revealRoll && (
        <Animated.View
          style={[
            revealDiceStyle,
            {
              position: "absolute",
              left: pad.x - (REVEAL_DIE * 2 + 6) / 2,
              top: pad.y - 18,
              flexDirection: "row",
              gap: 6,
              zIndex: 12,
            },
          ]}
          pointerEvents="none"
        >
          <Die value={revealRoll[0] as DieValue} size={REVEAL_DIE} />
          <Die value={revealRoll[1] as DieValue} size={REVEAL_DIE} />
        </Animated.View>
      )}

      {/* Cup */}
      <Animated.View style={cupStyle}>
        <DiceCup
          roll={isMyTurn ? myRoll : null}
          peeking={peeking}
          onToggle={onTogglePeek}
          isRolling={isRolling}
          interactive={cupInteractive && !revealActive}
          isMyTurn={isMyTurn && !revealActive}
          tint={cupTint}
        />
      </Animated.View>

      {/* Seats */}
      {players.map((p) => {
        const seat = seatMap[p.id];
        const speaking = p.id === prevId && callValue != null;
        return (
          <PlayerPlaque
            key={p.id}
            player={p}
            isCurrent={p.id === currentId}
            isMe={p.id === myId}
            x={seat.x}
            y={seat.y}
            flashing={p.id === flashId}
            callText={speaking ? formatDeclaration(callValue!) : null}
          />
        );
      })}
    </View>
  );
}
