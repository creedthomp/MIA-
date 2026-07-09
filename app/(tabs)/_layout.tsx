import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#16213e" : "#ffffff",
          borderTopColor: isDark ? "#1a1a2e" : "#e5e7eb",
        },
        tabBarActiveTintColor: "#e94560",
        tabBarInactiveTintColor: isDark ? "#a0a0b0" : "#9ca3af",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
