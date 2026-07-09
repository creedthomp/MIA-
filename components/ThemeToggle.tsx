import { useEffect } from "react";
import { TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

export function ThemeToggle() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme("light");
  }, []);

  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={{
        position: "absolute",
        bottom: Platform.OS === "ios" ? 100 : 32,
        right: 16,
        zIndex: 9999,
        padding: 8,
        borderRadius: 9999,
        backgroundColor: isDark ? "#16213e" : "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
      onPress={toggleColorScheme}
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Ionicons
        name={isDark ? "sunny" : "moon"}
        size={20}
        color={isDark ? "#e94560" : "#1a1a2e"}
      />
    </TouchableOpacity>
  );
}
