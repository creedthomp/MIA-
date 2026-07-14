import { useEffect } from "react";
import { View, Text, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const C = {
  fg:      "#fafafa",
  fgMuted: "#a3a3a3",
  fgFaint: "#6f6f6f",
  accent:  "#4d7cff",
  danger:  "#f0553b",
  card:    "#191b20",
  edge:    "#2b2d31",
};

export const PLAQUE_W = 78;
const AVATAR = 46;

export interface TablePlayer {
  id: string;
  name: string;
  lives: number;
  isActive: boolean;
}

interface PlayerPlaqueProps {
  player: TablePlayer;
  isCurrent: boolean;
  isMe: boolean;
  x: number; // avatar center
  y: number;
  flashing: boolean;
  callText: string | null; // declaration chip above the avatar
}

export function PlayerPlaque({
  player,
  isCurrent,
  isMe,
  x,
  y,
  flashing,
  callText,
}: PlayerPlaqueProps) {
  const flashOpacity = useSharedValue(0);
  const ringPulse = useSharedValue(0);
  const chipIn = useSharedValue(0);

  useEffect(() => {
    if (flashing) {
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: 220 }),
        withTiming(0, { duration: 420 }),
      );
    }
  }, [flashing]);

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

  useEffect(() => {
    if (callText) {
      chipIn.value = withSpring(1, { damping: 13, stiffness: 180 });
    } else {
      chipIn.value = withTiming(0, { duration: 200 });
    }
  }, [callText]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: 0.3 + 0.7 * ringPulse.value }));
  const chipStyle = useAnimatedStyle(() => ({
    opacity: chipIn.value,
    transform: [{ translateY: 6 * (1 - chipIn.value) }, { scale: 0.85 + 0.15 * chipIn.value }],
  }));

  return (
    <View
      style={{
        position: "absolute",
        left: x - PLAQUE_W / 2,
        top: y - AVATAR / 2,
        width: PLAQUE_W,
        alignItems: "center",
        opacity: player.isActive ? 1 : 0.32,
        zIndex: 20,
      }}
      pointerEvents="none"
    >
      {/* Declaration chip */}
      <Animated.View
        style={[
          chipStyle,
          {
            position: "absolute",
            top: -32,
            backgroundColor: "#0d0e11",
            borderWidth: 1,
            borderColor: C.accent,
            borderRadius: 8,
            paddingHorizontal: 9,
            paddingVertical: 4,
          },
        ]}
      >
        <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: "700", color: C.fg }}>
          {callText ?? ""}
        </Text>
      </Animated.View>

      {/* Turn ring */}
      {isCurrent && (
        <Animated.View
          style={[
            ringStyle,
            {
              position: "absolute",
              top: -5,
              width: AVATAR + 10,
              height: AVATAR + 10,
              borderRadius: (AVATAR + 10) / 2,
              borderWidth: 2,
              borderColor: C.accent,
            },
          ]}
        />
      )}

      {/* Avatar */}
      <View
        style={{
          width: AVATAR,
          height: AVATAR,
          borderRadius: AVATAR / 2,
          backgroundColor: isCurrent ? "#151f38" : C.card,
          borderWidth: 1.5,
          borderColor: isCurrent ? C.accent : isMe ? "#575b63" : C.edge,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          shadowColor: isCurrent ? C.accent : "#000",
          shadowOffset: { width: 0, height: isCurrent ? 0 : 3 },
          shadowOpacity: isCurrent ? 0.55 : 0.45,
          shadowRadius: isCurrent ? 10 : 5,
          elevation: isCurrent ? 9 : 4,
        }}
      >
        <Text style={{ color: C.fg, fontWeight: "700", fontSize: 18 }}>
          {player.name.charAt(0).toUpperCase()}
        </Text>
        <Animated.View
          style={[
            flashStyle,
            {
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: C.danger,
              borderRadius: AVATAR / 2,
            },
          ]}
        />
      </View>

      {/* Name */}
      <Text
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: 0.5,
          color: isMe ? C.fg : C.fgMuted,
          fontWeight: isMe ? "700" : "400",
          marginTop: 5,
          maxWidth: PLAQUE_W,
        }}
        numberOfLines={1}
      >
        {isMe ? "YOU" : player.name.toUpperCase()}
      </Text>

      {/* Life segments */}
      {player.isActive ? (
        <View style={{ flexDirection: "row", gap: 2.5, marginTop: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 9,
                height: 3.5,
                borderRadius: 2,
                backgroundColor: i < player.lives ? C.danger : "#33353a",
              }}
            />
          ))}
        </View>
      ) : (
        <Text style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: C.fgFaint, marginTop: 4 }}>
          OUT
        </Text>
      )}
    </View>
  );
}
