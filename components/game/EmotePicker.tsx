import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { EMOTES, EMOTE_IDS } from "@/utils/emotes";
import type { EmoteId } from "@/types/realtimeEvents";

const C = {
  surface: "#0f0f0f",
  border:  "#262626",
  fgMuted: "#a3a3a3",
  fgFaint: "#6f6f6f",
};

const COOLDOWN_MS = 4000;

interface EmotePickerProps {
  onSend: (emote: EmoteId) => void;
}

export function EmotePicker({ onSend }: EmotePickerProps) {
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
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 22,
            paddingHorizontal: 5,
            paddingVertical: 4,
            marginBottom: 8,
            gap: 1,
          },
        ]}
        pointerEvents={open ? "auto" : "none"}
      >
        {EMOTE_IDS.map((id) => (
          <TouchableOpacity
            key={id}
            onPress={() => handlePick(id)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18 }}>{EMOTES[id].emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Toggle button */}
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        disabled={coolingDown}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: open ? C.fgFaint : C.border,
          alignItems: "center",
          justifyContent: "center",
          opacity: coolingDown ? 0.35 : 1,
        }}
      >
        <Ionicons
          name={open ? "close" : "happy-outline"}
          size={20}
          color={C.fgMuted}
        />
      </TouchableOpacity>
    </View>
  );
}
