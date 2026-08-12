import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { EMOTE_IDS, EMOTES } from "@/utils/emotes";
import type { EmoteId } from "@/types/realtimeEvents";

import { COLORS, FONT } from "@/theme";

const C = COLORS;
const MONO = FONT.brand;

const COOLDOWN_MS = 4000;

// 21 emotes don't fit one row — the tray wraps into a grid.
const CELL = 40;
const COLUMNS = 5;

interface EmotePickerProps {
  onSend: (emote: EmoteId) => void;
  bonusIds?: EmoteId[]; // extra emotes (e.g. the #1 crown) appended to the tray
}

export function EmotePicker({ onSend, bonusIds }: EmotePickerProps) {
  const trayIds = bonusIds && bonusIds.length ? [...EMOTE_IDS, ...bonusIds] : EMOTE_IDS;
  const [open, setOpen] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trayScale = useSharedValue(0.6);
  const trayOpacity = useSharedValue(0);

  useEffect(() => {
    if (open) {
      trayScale.value = withSpring(1, { damping: 14, stiffness: 220 });
      trayOpacity.value = withTiming(1, { duration: 120 });
    } else {
      trayScale.value = withTiming(0.6, { duration: 120 });
      trayOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const trayStyle = useAnimatedStyle(() => ({
    opacity: trayOpacity.value,
    transform: [{ scale: trayScale.value }],
  }));

  function handlePick(emote: EmoteId) {
    setOpen(false);
    setCoolingDown(true);
    cooldownTimer.current = setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
    onSend(emote);
  }

  return (
    <View style={{ position: "absolute", right: 14, bottom: 6, alignItems: "flex-end", zIndex: 40 }}>
      {/* Tray */}
      <Animated.View
        style={[
          trayStyle,
          {
            flexDirection: "row",
            flexWrap: "wrap",
            width: COLUMNS * CELL + 10,
            backgroundColor: C.surface,
            borderWidth: 1.5,
            borderColor: C.border,
            borderRadius: 14,
            paddingHorizontal: 5,
            paddingVertical: 4,
            marginBottom: 8,
          },
        ]}
        pointerEvents={open ? "auto" : "none"}
      >
        {trayIds.map((id) => (
          <TouchableOpacity
            key={id}
            onPress={() => handlePick(id)}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>{EMOTES[id].emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Toggle button — same language as the Roll / Pull It buttons */}
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        disabled={coolingDown}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: open ? C.fgFaint : C.border,
          backgroundColor: C.surface,
          paddingVertical: 11,
          paddingHorizontal: 15,
          opacity: coolingDown ? 0.35 : 1,
        }}
      >
        <Text style={{ fontSize: 15 }}>{open ? "✕" : "🙂"}</Text>
        <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.fgMuted, textTransform: "uppercase", fontWeight: "600" }}>
          Emote
        </Text>
      </TouchableOpacity>
    </View>
  );
}
