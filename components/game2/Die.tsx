import { View } from "react-native";
import type { DieValue } from "@/types/game";

// 3×3 grid positions: [TL, TC, TR, ML, MC, MR, BL, BC, BR]
const DOT_POSITIONS: Record<DieValue, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface DieProps {
  value: DieValue;
  size?: number;
  variant?: "ivory" | "graphite";
}

export function Die({ value, size = 56, variant = "ivory" }: DieProps) {
  const ivory = variant === "ivory";
  const dots = DOT_POSITIONS[value] ?? [];
  const dotSize = Math.round(size * 0.16);
  const padding = Math.round(size * 0.13);
  const radius = Math.round(size * 0.24);

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: ivory ? "#f7f6f2" : "#17181c",
        borderRadius: radius,
        borderWidth: 1,
        borderColor: ivory ? "#dcdad2" : "#2c2d33",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.45,
        shadowRadius: 5,
        elevation: 4,
      }}
    >
      {/* Top light catch */}
      <View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: Math.round(size * 0.34),
          backgroundColor: ivory ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.04)",
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
        }}
      />
      <View style={{ flex: 1, padding }}>
        {Array.from({ length: 3 }).map((_, row) => (
          <View key={row} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            {Array.from({ length: 3 }).map((_, col) => {
              const idx = row * 3 + col;
              const visible = dots.includes(idx);
              return (
                <View key={col} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  {visible && (
                    <View
                      style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: ivory ? "#191b20" : "#e9e7e0",
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
