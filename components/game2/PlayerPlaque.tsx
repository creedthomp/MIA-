import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { PlayerCharacter } from "./PlayerCharacter";

import { COLORS, FONT } from "@/theme";

const MONO = FONT.brand;
const C = COLORS;

export const PLAQUE_W = 78;
// Rectangular portrait frame (poker-app style) — the character lives INSIDE
// this rect, so it can never spill onto the felt.
const PORTRAIT_W = 54;
const PORTRAIT_H = 58;
const RADIUS = 12;

export interface TablePlayer {
  id: string;
  name: string;
  lives: number;
  isActive: boolean;
  characterId?: string; // real character art later; undefined → filler bust
}

interface PlayerPlaqueProps {
  player: TablePlayer;
  isCurrent: boolean;
  isMe: boolean;
  x: number; // portrait center
  y: number;
  flashing: boolean;
  callText: string | null; // declaration chip above the portrait
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
        top: y - PORTRAIT_H / 2,
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
            top: -30,
            backgroundColor: "#0d0e11",
            borderWidth: 1,
            borderColor: C.accent,
            borderRadius: 8,
            paddingHorizontal: 9,
            paddingVertical: 4,
            zIndex: 2,
          },
        ]}
      >
        <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: "700", color: C.fg }}>
          {callText ?? ""}
        </Text>
      </Animated.View>

      {/* Turn ring — rectangular, hugs the portrait */}
      {isCurrent && (
        <Animated.View
          style={[
            ringStyle,
            {
              position: "absolute",
              top: -5,
              width: PORTRAIT_W + 10,
              height: PORTRAIT_H + 10,
              borderRadius: RADIUS + 5,
              borderWidth: 2,
              borderColor: C.accent,
            },
          ]}
        />
      )}

      {/* Portrait frame — character clipped inside */}
      <View
        style={{
          width: PORTRAIT_W,
          height: PORTRAIT_H,
          borderRadius: RADIUS,
          backgroundColor: isCurrent ? "#0e2b2c" : C.card,
          borderWidth: 1.5,
          borderColor: isCurrent ? C.accent : isMe ? "#575b63" : C.edge,
          alignItems: "center",
          justifyContent: "flex-end",
          overflow: "hidden",
          shadowColor: isCurrent ? C.accent : "#000",
          shadowOffset: { width: 0, height: isCurrent ? 0 : 3 },
          shadowOpacity: isCurrent ? 0.55 : 0.45,
          shadowRadius: isCurrent ? 10 : 5,
          elevation: isCurrent ? 9 : 4,
        }}
      >
        <PlayerCharacter
          seed={player.id}
          characterId={player.characterId}
          width={PORTRAIT_W - 6}
          height={PORTRAIT_H - 8}
        />
        {/* Life-lost flash */}
        <Animated.View
          style={[
            flashStyle,
            {
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: C.danger,
              borderRadius: RADIUS - 1,
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
