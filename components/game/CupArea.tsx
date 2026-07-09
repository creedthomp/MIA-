import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";
import { DiceFace } from "./DiceFace";
import type { DieValue, Roll } from "@/types/game";

interface CupAreaProps {
  roll: Roll | null;
  peeking: boolean;
  onTogglePeek: () => void;
  isRolling: boolean;
  interactive: boolean;
}

export function CupArea({ roll, peeking, onTogglePeek, isRolling, interactive }: CupAreaProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  if (isRolling) {
    return (
      <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#e94560" size="large" />
        <Text className="text-gray-500 dark:text-muted text-sm mt-2">Rolling...</Text>
      </View>
    );
  }

  if (!roll) {
    return (
      <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
        <View
          className="w-20 h-20 bg-card dark:bg-panel rounded-2xl items-center justify-center"
          style={{ opacity: 0.5 }}
        >
          <Text style={{ fontSize: 36 }}>🎲</Text>
        </View>
      </View>
    );
  }

  if (!interactive) {
    // Spectator or other player's cup: always hidden
    return (
      <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
        <View className="w-20 h-20 bg-card dark:bg-panel rounded-2xl items-center justify-center border-2 border-muted">
          <Text style={{ fontSize: 36 }}>🎲</Text>
        </View>
        <Text className="text-gray-400 dark:text-muted text-xs mt-1">Hidden</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onTogglePeek}
      style={{ height: 100, alignItems: "center", justifyContent: "center" }}
      activeOpacity={0.8}
    >
      {peeking ? (
        <View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <DiceFace value={roll[0] as DieValue} size={64} dark={isDark} />
            <DiceFace value={roll[1] as DieValue} size={64} dark={isDark} />
          </View>
          <Text className="text-gray-400 dark:text-muted text-xs text-center mt-1">
            Tap to hide
          </Text>
        </View>
      ) : (
        <View style={{ alignItems: "center" }}>
          <View className="w-20 h-20 bg-card dark:bg-panel rounded-2xl items-center justify-center border-2 border-accent">
            <Text style={{ fontSize: 36 }}>🎲</Text>
          </View>
          <Text className="text-accent text-xs mt-1 font-medium">Tap to peek</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
