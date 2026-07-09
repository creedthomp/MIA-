import { useEffect, useRef } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SoloCup } from "./SoloCup";
import { formatDeclaration } from "@/utils/declarations";
import type { Player, Declaration, Roll } from "@/types/game";
import type { GamePhase } from "@/lib/store/gameSlice";

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
          top: -38,
          left: "50%",
          transform: [{ translateX: -38 }],
          backgroundColor: "#1e293b",
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: "#334155",
          paddingHorizontal: 10,
          paddingVertical: 5,
          minWidth: 44,
          alignItems: "center",
          zIndex: 20,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={{ color: "#e8dfa0", fontWeight: "800", fontSize: 13 }}>{text}</Text>
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
          borderTopColor: "#334155",
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

  useEffect(() => {
    if (flashing) {
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 420 }),
      );
    }
  }, [flashing]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const seatSize = Math.round(SEAT_BASE * scale);
  const letterSize = Math.round(17 * scale);
  const nameSize = Math.max(7, Math.round(9 * scale));
  const heartSize = Math.max(6, Math.round(9 * scale));
  const labelW = Math.round(80 * scale);

  return (
    <View
      style={{
        position: "absolute",
        left: x - labelW / 2,
        top: y - seatSize / 2 - 14,
        width: labelW,
        alignItems: "center",
        opacity: player.isActive ? 1 : 0.35,
        zIndex: Math.round(scale * 10),
      }}
    >
      {/* Speech bubble */}
      <SpeechBubble text={spokenText} visible={isSpeaking && spokenText !== ""} />

      {/* Avatar */}
      <View
        style={{
          width: seatSize,
          height: seatSize,
          borderRadius: seatSize / 2,
          backgroundColor: isCurrent ? "#e94560" : isMe ? "#2a5cb8" : "#3a3a60",
          borderWidth: Math.max(1, Math.round(isCurrent ? 3 * scale : 2 * scale)),
          borderColor: isCurrent ? "#ffffff" : isMe ? "#6080ff" : "#555580",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: isCurrent ? "#fff" : "#000",
          shadowOffset: { width: 0, height: isCurrent ? 0 : 2 },
          shadowOpacity: isCurrent ? 0.8 : 0.4,
          shadowRadius: isCurrent ? Math.round(8 * scale) : Math.round(4 * scale),
          elevation: isCurrent ? 8 : 3,
          overflow: "hidden",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: letterSize }}>
          {player.displayName.charAt(0).toUpperCase()}
        </Text>
        {/* Life-lost red flash */}
        <Animated.View
          style={[
            flashStyle,
            {
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "#ff1a1a",
              borderRadius: seatSize / 2,
            },
          ]}
          pointerEvents="none"
        />
      </View>

      {/* Name */}
      <Text
        style={{
          color: "#e8e8f0",
          fontSize: nameSize,
          fontWeight: isMe ? "700" : "400",
          marginTop: 3,
          textShadowColor: "rgba(0,0,0,0.9)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
          textAlign: "center",
          maxWidth: labelW,
          opacity: 0.65 + 0.35 * scale,
        }}
        numberOfLines={1}
      >
        {isMe ? "You" : player.displayName}
      </Text>

      {/* Hearts */}
      <View style={{ flexDirection: "row", marginTop: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < player.lives ? "heart" : "heart-outline"}
            size={heartSize}
            color={i < player.lives ? "#e94560" : "#445"}
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
}

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
}: GameTableProps) {
  const { width } = useWindowDimensions();

  // Perspective ellipse
  const rx_table = Math.min(width * 0.42, 180);
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

  // Compute seat positions every render and keep in a ref for the effect
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

  // Cup animation — slides to current player's position on the felt
  const CUP_W = 44;
  const cupAnimX = useSharedValue(cx - CUP_W / 2);
  const cupAnimY = useSharedValue(cy - ry_table * 0.5);

  useEffect(() => {
    const seat = seatMapRef.current[currentTurnUserId ?? ""];
    if (!seat) return;
    // Place cup on the felt surface, ~78% toward the player's seat
    const targetX = cx + rx_table * 0.78 * Math.cos(seat.angle) - CUP_W / 2;
    const targetY = cy + ry_table * 0.78 * Math.sin(seat.angle) - 32;
    cupAnimX.value = withSpring(targetX, { damping: 18, stiffness: 110 });
    cupAnimY.value = withSpring(targetY, { damping: 18, stiffness: 110 });
  }, [currentTurnUserId]);

  const cupAnimStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: cupAnimX.value,
    top: cupAnimY.value,
    zIndex: 15,
  }));

  const rimRx = rx_table + 12;
  const rimRy = ry_table + 12;

  return (
    <View style={{ width, height: TABLE_H }}>
      {/* Wood rim */}
      <View
        style={{
          position: "absolute",
          left: cx - rimRx,
          top: cy - rimRy,
          width: rimRx * 2,
          height: rimRy * 2,
          backgroundColor: "#3d1a06",
          borderRadius: rimRx,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.7,
          shadowRadius: 20,
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
          backgroundColor: "#1a5c30",
          borderRadius: rx_table,
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
            backgroundColor: "rgba(0,0,0,0.22)",
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
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
      </View>

      {/* Felt inner ring */}
      <View
        style={{
          position: "absolute",
          left: cx - rx_table + 10,
          top: cy - ry_table + 8,
          width: (rx_table - 10) * 2,
          height: (ry_table - 8) * 2,
          borderRadius: rx_table - 10,
          borderWidth: 1,
          borderColor: "#2a7840",
        }}
      />

      {/* Near-edge wood highlight */}
      <View
        style={{
          position: "absolute",
          left: cx - rx_table - 2,
          top: cy + ry_table - 6,
          width: (rx_table + 2) * 2,
          height: 18,
          backgroundColor: "#5a2a0a",
          borderBottomLeftRadius: rx_table + 2,
          borderBottomRightRadius: rx_table + 2,
        }}
      />

      {/* Animated cup — slides to current player's seat */}
      <Animated.View style={cupAnimStyle}>
        <SoloCup
          roll={isMyTurn ? myActualRoll : null}
          peeking={peeking}
          onToggle={onTogglePeek}
          isRolling={isRolling}
          interactive={isMyTurn && phase === "my_turn_declare"}
          isMyTurn={isMyTurn}
        />
      </Animated.View>

      {/* Player seats */}
      {sorted.map((player, i) => {
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
    </View>
  );
}
