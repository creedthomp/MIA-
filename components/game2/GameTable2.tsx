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
import { EmoteBubble } from "@/components/game/EmoteBubble";
import { formatDeclaration } from "@/utils/declarations";
import type { Declaration, Roll, DieValue } from "@/types/game";
import type { EmoteId } from "@/types/realtimeEvents";

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
  emotes?: Record<string, { emote: EmoteId; key: number }>; // active emote bubble per player id
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
  emotes,
}: GameTable2Props) {
  const { width, height } = useWindowDimensions();

  // Stadium-shaped table: Rx/Ry are the horizontal/vertical semi-axes.
  // Ry keeps enough headroom that a cup on the far pad clears the top seat;
  // Rx stretches toward the screen edges for the oval look.
  const Rx = Math.max(120, Math.min(width / 2 - 40, 300));
  const Ry = Math.max(100, Math.min(height * 0.26, Rx * 0.78, 190));
  const cx = width / 2;
  const cy = Ry + 115;
  const TABLE_H = 2 * Ry + 230;

  const n = players.length;
  const myIdx = Math.max(0, players.findIndex((p) => p.id === myId));

  // Seat angles — me at the bottom, others clockwise by turn order.
  // Side and bottom seats hug the rail (poker-app style); only the top
  // seat sits fully outside, since the cup's body reaches up toward it.
  const seatMap: Record<string, { x: number; y: number; angle: number }> = {};
  players.forEach((p, i) => {
    const rotated = (i - myIdx + n) % n;
    const angle = Math.PI / 2 + (2 * Math.PI * rotated) / n;
    const sin = Math.sin(angle);
    seatMap[p.id] = {
      x: cx + (Rx - 2) * Math.cos(angle),
      y: cy + (Ry + (sin > 0 ? 20 : 56)) * sin,
      angle,
    };
  });

  // Cup pads — pulled close to each seat (fixed max distance so big tables
  // don't strand the cup mid-felt) but always fully on the felt
  function padFor(angle: number) {
    const sin = Math.sin(angle);
    const px = Math.max(Rx * 0.56, Rx - 90);
    const py = sin > 0 ? Math.max(Ry * 0.56, Ry - 52) : Ry * 0.56;
    return {
      x: cx + px * Math.cos(angle),
      y: cy + py * sin,
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
      const carry = Ry * 0.52;

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
          left: cx - Rx - 14,
          top: cy - Ry - 14,
          width: (Rx + 14) * 2,
          height: (Ry + 14) * 2,
          borderRadius: Ry + 14,
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
          left: cx - Rx,
          top: cy - Ry,
          width: Rx * 2,
          height: Ry * 2,
          borderRadius: Ry,
          backgroundColor: C.felt,
          borderWidth: 1,
          borderColor: "#20232a",
        }}
      />

      {/* Inset racetrack lines */}
      {[0.28, 0.55].map((f) => {
        const inset = Ry * f;
        return (
          <View
            key={f}
            style={{
              position: "absolute",
              left: cx - (Rx - inset),
              top: cy - (Ry - inset),
              width: (Rx - inset) * 2,
              height: (Ry - inset) * 2,
              borderRadius: Ry - inset,
              borderWidth: 1,
              borderColor: C.feltRing,
            }}
            pointerEvents="none"
          />
        );
      })}

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
            left: pad.x - 42,
            top: pad.y - 42,
            width: 84,
            height: 84,
            borderRadius: 42,
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

      {/* Emote bubbles — keyed so a repeat taunt re-pops */}
      {emotes &&
        players.map((p) => {
          const active = emotes[p.id];
          if (!active) return null;
          const seat = seatMap[p.id];
          return (
            <EmoteBubble
              key={`${p.id}-${active.key}`}
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
