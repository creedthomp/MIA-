import { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

interface VerdictSheetProps {
  wasHonest: boolean;
  challengerName: string;
  loserName: string;
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
      <Animated.View
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
        <Text style={{ fontSize: 38, fontWeight: "800", letterSpacing: -1, color: wasHonest ? C.ok : C.danger, marginBottom: 10 }}>
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
            backgroundColor: wasHonest ? "rgba(29,182,187,0.09)" : "rgba(222,26,98,0.09)",
            borderWidth: 1,
            borderColor: wasHonest ? "rgba(29,182,187,0.32)" : "rgba(222,26,98,0.32)",
            borderRadius: 10,
            paddingHorizontal: 18,
            paddingVertical: 9,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontFamily: MONO, color: wasHonest ? C.ok : C.danger, fontWeight: "700", fontSize: 13 }}>
            {loserName} loses {livesLost} {livesLost === 1 ? "life" : "lives"}
            {isEliminated ? " — out" : ""}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onContinue}
          style={{
            backgroundColor: C.accent, borderRadius: 12,
            paddingVertical: 14, alignItems: "center", alignSelf: "stretch",
          }}
        >
          <Text style={{ color: C.onAccent, fontWeight: "700", fontSize: 15 }}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
