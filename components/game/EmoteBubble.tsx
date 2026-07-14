import { useEffect } from "react";
import { View, Text, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { EMOTES } from "@/utils/emotes";
import type { EmoteId } from "@/types/realtimeEvents";

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// Keep in sync with EMOTE_VISIBLE_MS in the game screen (bubble starts
// fading ~350ms before the screen removes it)
const HOLD_MS = 2000;

interface EmoteBubbleProps {
  emote: EmoteId;
  anchorX: number; // seat center
  anchorY: number;
  onRight: boolean; // seat is on the right half — mirror the bubble leftward
}

export function EmoteBubble({ emote, anchorX, anchorY, onRight }: EmoteBubbleProps) {
  const { emoji, phrase } = EMOTES[emote];

  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);
  const wobble = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(HOLD_MS, withTiming(0, { duration: 320 })),
    );
    scale.value = withSpring(1, { damping: 9, stiffness: 260 });
    wobble.value = withSequence(
      withTiming(onRight ? 5 : -5, { duration: 90 }),
      withTiming(onRight ? -3 : 3, { duration: 110 }),
      withTiming(0, { duration: 140, easing: Easing.out(Easing.ease) }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${wobble.value}deg` }],
  }));

  const WRAP_W = 150;

  return (
    <View
      style={{
        position: "absolute",
        left: onRight ? anchorX - WRAP_W - 26 : anchorX + 26,
        top: anchorY - 46,
        width: WRAP_W,
        alignItems: onRight ? "flex-end" : "flex-start",
        zIndex: 30,
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          style,
          {
            backgroundColor: "#f4f4f4",
            borderRadius: 14,
            borderBottomLeftRadius: onRight ? 14 : 3,
            borderBottomRightRadius: onRight ? 3 : 14,
            paddingHorizontal: 10,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 6,
          },
        ]}
      >
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: "700", color: "#141414" }}>
          {phrase}
        </Text>
      </Animated.View>
    </View>
  );
}
