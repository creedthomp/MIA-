import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1c1c1c",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#4d7cff",
        tabBarInactiveTintColor: "#6f6f6f",
      }}
    >
      {/* Landing — hide from tab bar entirely */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarStyle: { display: "none" },
          tabBarButton: () => null,
        }}
      />

      {/* Logged-in hub */}
      <Tabs.Screen
        name="play"
        options={{
          title: "Play",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="dice" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
