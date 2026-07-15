import { useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Die } from "./Die";
import type { DieValue, Roll } from "@/types/game";

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";
const ACCENT = "#4d7cff";

export const CUP_W = 68;
export const CUP_AREA_H = 118;

const DICE_SIZE = 32;
const LIFT_DISTANCE = 96;
const CUP_H = 74;
const MOUTH_Y = 8 + CUP_H; // where the cup's mouth meets the felt

// Multiply a hex color's rgb by `f` (clamped) — cheap shading for the cup tint
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// Cup drawn inverted (mouth down, covering the dice): base cap flaring to the mouth
function buildSections(tint: string) {
  return [
    { w: 40, h: 10, bg: shade(tint, 1.14), rTop: 6 },
    { w: 46, h: 12, bg: shade(tint, 0.8) },
    { w: 52, h: 13, bg: tint },
    { w: 57, h: 13, bg: shade(tint, 0.8) },
    { w: 61, h: 13, bg: tint },
    { w: 66, h: 3,  bg: shade(tint, 1.65) },
    { w: 68, h: 10, bg: shade(tint, 1.28), rBottom: 5 },
  ];
}

function CupBody({ tint }: { tint: string }) {
  const sections = useMemo(() => buildSections(tint), [tint]);
  return (
    <View style={{ alignItems: "center", width: CUP_W }}>
      {sections.map((s, i) => (
        <View
          key={i}
          style={{
            width: s.w,
            height: s.h,
            backgroundColor: s.bg,
            borderTopLeftRadius: s.rTop ?? 0,
            borderTopRightRadius: s.rTop ?? 0,
            borderBottomLeftRadius: s.rBottom ?? 0,
            borderBottomRightRadius: s.rBottom ?? 0,
          }}
        />
      ))}
    </View>
  );
}

interface DiceCupProps {
  roll: Roll | null;
  peeking: boolean;
  onToggle: () => void;
  isRolling: boolean;
  interactive: boolean;
  isMyTurn: boolean;
  tint?: string;
}

export function DiceCup({
  roll,
  peeking,
  onToggle,
  isRolling,
  interactive,
  isMyTurn,
  tint = "#24262b",
}: DiceCupProps) {
  const liftY = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const shakeRot = useSharedValue(0);

  useEffect(() => {
    liftY.value = withSpring(peeking ? -LIFT_DISTANCE : 0, {
      damping: 15,
      stiffness: 130,
    });
  }, [peeking]);

  useEffect(() => {
    if (isRolling) {
      // Gentle swirl — small amplitude, slow, sine-eased
      shakeX.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 105, easing: Easing.inOut(Easing.sin) }),
          withTiming(4, { duration: 105, easing: Easing.inOut(Easing.sin) }),
          withTiming(-3, { duration: 95, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 95, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      );
      shakeRot.value = withRepeat(
        withSequence(
          withTiming(-2.5, { duration: 150, easing: Easing.inOut(Easing.sin) }),
          withTiming(2.5, { duration: 150, easing: Easing.inOut(Easing.sin) }),
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
    opacity: Math.max(0, Math.min(1, (-liftY.value - 34) / 46)),
  }));

  // Ground shadow stays on the felt; softens as the cup lifts
  const groundStyle = useAnimatedStyle(() => {
    const t = Math.min(1, -liftY.value / LIFT_DISTANCE);
    return {
      opacity: 0.45 - 0.3 * t,
      transform: [{ scaleX: 1 - 0.25 * t }],
    };
  });

  const glowing = isMyTurn && !peeking && !isRolling;
  const showHint = interactive && roll != null && !isRolling;

  return (
    <View style={{ width: CUP_W + 20, height: CUP_AREA_H, alignItems: "center" }}>
      {/* Turn spotlight — soft accent pool on the felt */}
      {glowing && (
        <>
          <View
            style={{
              position: "absolute",
              top: MOUTH_Y - 10,
              width: 104,
              height: 26,
              borderRadius: 52,
              backgroundColor: "rgba(77,124,255,0.10)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: MOUTH_Y - 6,
              width: 86,
              height: 18,
              borderRadius: 43,
              backgroundColor: "rgba(77,124,255,0.16)",
            }}
          />
        </>
      )}

      {/* Ground shadow */}
      <Animated.View
        style={[
          groundStyle,
          {
            position: "absolute",
            top: MOUTH_Y - 5,
            width: 76,
            height: 13,
            borderRadius: 38,
            backgroundColor: "rgba(0,0,0,0.45)",
          },
        ]}
      />

      {/* Dice — revealed when the cup lifts */}
      <Animated.View
        style={[
          diceStyle,
          {
            position: "absolute",
            bottom: 18,
            flexDirection: "row",
            gap: 6,
          },
        ]}
      >
        {roll ? (
          <>
            <Die value={roll[0] as DieValue} size={DICE_SIZE} />
            <Die value={roll[1] as DieValue} size={DICE_SIZE} />
          </>
        ) : null}
      </Animated.View>

      {/* Cup */}
      <Animated.View style={[cupStyle, { position: "absolute", top: 8 }]}>
        <TouchableOpacity
          onPress={interactive ? onToggle : undefined}
          disabled={!interactive}
          activeOpacity={interactive ? 0.85 : 1}
        >
          <CupBody tint={tint} />
        </TouchableOpacity>
      </Animated.View>

      {/* Hint */}
      {showHint && (
        <Text
          style={{
            position: "absolute",
            bottom: 0,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: peeking ? "#6f6f6f" : ACCENT,
            fontWeight: "600",
          }}
        >
          {peeking ? "tap to cover" : "tap to peek"}
        </Text>
      )}
      {isRolling && (
        <Text style={{ position: "absolute", bottom: 0, fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: "#6f6f6f" }}>
          rolling…
        </Text>
      )}
    </View>
  );
}
