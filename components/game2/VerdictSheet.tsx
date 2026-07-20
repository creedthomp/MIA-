import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Die } from "./Die";
import { formatDeclaration } from "@/utils/declarations";
import { rollToDeclaration } from "@/utils/dice";
import type { Declaration, DieValue, Roll } from "@/types/game";

import { COLORS, FONT } from "@/theme";

const C = COLORS;
const MONO = FONT.brand;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface VerdictSheetProps {
  wasHonest: boolean;
  challengerName: string;
  loserName: string;
  loserIsYou?: boolean;
  livesLost: number;
  isEliminated: boolean;
  revealedRoll: Roll;
  declared: Declaration;
  onContinue: () => void;
}

export function VerdictSheet({
  wasHonest,
  challengerName,
  loserName,
  loserIsYou,
  livesLost,
  isEliminated,
  revealedRoll,
  declared,
  onContinue,
}: VerdictSheetProps) {
  const slide = useSharedValue(320);
  const scrim = useSharedValue(0);

  useEffect(() => {
    slide.value = withSpring(0, { damping: 20, stiffness: 160 });
    scrim.value = withTiming(1, { duration: 250 });
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slide.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  const actual = rollToDeclaration(revealedRoll);

  return (
    <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, zIndex: 200 }}>
      {/* Tap the backdrop to dismiss early (it also auto-closes) */}
      <AnimatedPressable
        onPress={onContinue}
        style={[scrimStyle, { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.72)" }]}
      />
      <Animated.View
        style={[
          sheetStyle,
          {
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            backgroundColor: C.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: "#22242a",
            paddingTop: 14,
            paddingBottom: 40,
            paddingHorizontal: 28,
            alignItems: "center",
          },
        ]}
      >
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#2c2e34", marginBottom: 20 }} />

        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.fgFaint, textTransform: "uppercase", marginBottom: 8 }}>
          The verdict
        </Text>
        <Text style={{ fontSize: 38, fontWeight: "800", letterSpacing: -1, color: wasHonest ? C.truth : C.lie, marginBottom: 10 }}>
          {wasHonest ? "TRUTH." : "LIE."}
        </Text>
        <Text style={{ fontFamily: MONO, fontSize: 12, color: C.fgMuted, marginBottom: 20, textAlign: "center", lineHeight: 18 }}>
          {challengerName} pulled it.{"\n"}
          Called {formatDeclaration(declared)} — rolled {formatDeclaration(actual)}.
        </Text>

        <View style={{ flexDirection: "row", gap: 14, marginBottom: 22 }}>
          <Die value={revealedRoll[0] as DieValue} size={62} />
          <Die value={revealedRoll[1] as DieValue} size={62} />
        </View>

        <View
          style={{
            backgroundColor: wasHonest ? "rgba(47,179,92,0.10)" : "rgba(239,68,68,0.10)",
            borderWidth: 1,
            borderColor: wasHonest ? "rgba(47,179,92,0.34)" : "rgba(239,68,68,0.34)",
            borderRadius: 10,
            paddingHorizontal: 18,
            paddingVertical: 9,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontFamily: MONO, color: wasHonest ? C.truth : C.lie, fontWeight: "700", fontSize: 13 }}>
            {loserName} {loserIsYou ? "lose" : "loses"} {livesLost} {livesLost === 1 ? "life" : "lives"}
            {isEliminated ? " — out" : ""}
          </Text>
        </View>

        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: C.fgFaint }}>
          tap outside to dismiss
        </Text>
      </Animated.View>
    </View>
  );
}
