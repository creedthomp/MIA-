import { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { DiceFace } from "./DiceFace";
import type { DieValue, Roll } from "@/types/game";

// ---------- Cup sections (right-side up) ----------
const CUP_SECTIONS = [
  { wRatio: 1.00, h: 8,  bg: "#f04535", br: 4 }, // rim
  { wRatio: 0.97, h: 2,  bg: "#8a0e0e", br: 0 }, // ridge
  { wRatio: 0.95, h: 14, bg: "#cc2020", br: 0 }, // body 1
  { wRatio: 0.92, h: 2,  bg: "#8a0e0e", br: 0 }, // ridge
  { wRatio: 0.90, h: 14, bg: "#dd2a2a", br: 0 }, // body 2
  { wRatio: 0.87, h: 2,  bg: "#8a0e0e", br: 0 }, // ridge
  { wRatio: 0.84, h: 14, bg: "#cc2020", br: 0 }, // body 3
  { wRatio: 0.81, h: 2,  bg: "#8a0e0e", br: 0 }, // ridge
  { wRatio: 0.78, h: 14, bg: "#dd2a2a", br: 0 }, // body 4
  { wRatio: 0.70, h: 6,  bg: "#8a0e0e", br: 3 }, // base
];
// Height ≈ 78px

function CupBody({
  width,
  glowing,
  upsideDown,
}: {
  width: number;
  glowing: boolean;
  upsideDown: boolean;
}) {
  const sections = upsideDown ? [...CUP_SECTIONS].reverse() : CUP_SECTIONS;
  return (
    <View
      style={{
        alignItems: "center",
        width,
        shadowColor: glowing ? "#ff6040" : "#000",
        shadowOffset: { width: 0, height: glowing ? 0 : 2 },
        shadowOpacity: glowing ? 0.9 : 0.35,
        shadowRadius: glowing ? 12 : 4,
        elevation: glowing ? 12 : 3,
      }}
    >
      {sections.map((s, i) => (
        <View
          key={i}
          style={{
            width: width * s.wRatio,
            height: s.h,
            backgroundColor: s.bg,
            borderRadius: s.br,
          }}
        />
      ))}
    </View>
  );
}

// ---------- Main component ----------

interface SoloCupProps {
  roll: Roll | null;
  peeking: boolean;
  onToggle: () => void;
  isRolling: boolean;
  interactive: boolean;
  isMyTurn: boolean;
}

const CUP_WIDTH = 44;
const DICE_SIZE = 26;
const LIFT_DISTANCE = 80;

export function SoloCup({
  roll,
  peeking,
  onToggle,
  isRolling,
  interactive,
  isMyTurn,
}: SoloCupProps) {
  const liftY = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const shakeRot = useSharedValue(0);

  // Lift on peek
  useEffect(() => {
    liftY.value = withSpring(peeking ? -LIFT_DISTANCE : 0, {
      damping: 14,
      stiffness: 120,
    });
  }, [peeking]);

  // Shake while rolling
  useEffect(() => {
    if (isRolling) {
      shakeX.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 55 }),
          withTiming(8, { duration: 55 }),
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 50 }),
        ),
        -1,
        true
      );
      shakeRot.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 70 }),
          withTiming(5, { duration: 70 }),
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(shakeX);
      cancelAnimation(shakeRot);
      shakeX.value = withSpring(0, { damping: 12, stiffness: 200 });
      shakeRot.value = withSpring(0, { damping: 12, stiffness: 200 });
    }
  }, [isRolling]);

  const cupStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: liftY.value },
      { translateX: shakeX.value },
      { rotate: `${shakeRot.value}deg` },
    ],
  }));

  const diceStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, (-liftY.value - 30) / 40)),
  }));

  const showHint = interactive && roll != null && !isRolling;

  return (
    <View style={{ width: CUP_WIDTH + 16, height: 92, alignItems: "center" }}>
      {/* Dice — revealed when cup lifts */}
      <Animated.View
        style={[
          diceStyle,
          {
            position: "absolute",
            bottom: 14,
            flexDirection: "row",
            gap: 4,
          },
        ]}
      >
        {roll ? (
          <>
            <DiceFace value={roll[0] as DieValue} size={DICE_SIZE} dark />
            <DiceFace value={roll[1] as DieValue} size={DICE_SIZE} dark />
          </>
        ) : null}
      </Animated.View>

      {/* Cup — upside-down (covering dice), lifts on peek */}
      <Animated.View style={[cupStyle, { position: "absolute", top: 4 }]}>
        <TouchableOpacity
          onPress={interactive ? onToggle : undefined}
          disabled={!interactive}
          activeOpacity={interactive ? 0.85 : 1}
        >
          <CupBody
            width={CUP_WIDTH}
            glowing={isMyTurn && !peeking && !isRolling}
            upsideDown
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Hint */}
      {showHint && (
        <Text
          style={{
            position: "absolute",
            bottom: 0,
            fontSize: 9,
            color: peeking ? "#888" : "#e94560",
            fontWeight: "600",
          }}
        >
          {peeking ? "tap to cover" : "tap to peek"}
        </Text>
      )}
      {isRolling && (
        <Text style={{ position: "absolute", bottom: 0, fontSize: 9, color: "#888" }}>
          rolling…
        </Text>
      )}
    </View>
  );
}
