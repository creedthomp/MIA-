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

interface DiceFaceProps {
  value: DieValue;
  size?: number;
  dark?: boolean;
}

export function DiceFace({ value, size = 60, dark = false }: DiceFaceProps) {
  const dots = DOT_POSITIONS[value] ?? [];
  const dotSize = Math.round(size * 0.17);
  const padding = Math.round(size * 0.12);

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: dark ? "#16213e" : "#ffffff",
        borderRadius: Math.round(size * 0.14),
        padding,
        borderWidth: 1,
        borderColor: dark ? "#2a2a4a" : "#e5e7eb",
      }}
    >
      {Array.from({ length: 3 }).map((_, row) => (
        <View
          key={row}
          style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
        >
          {Array.from({ length: 3 }).map((_, col) => {
            const idx = row * 3 + col;
            const visible = dots.includes(idx);
            return (
              <View
                key={col}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                {visible && (
                  <View
                    style={{
                      width: dotSize,
                      height: dotSize,
                      borderRadius: dotSize / 2,
                      backgroundColor: dark ? "#e94560" : "#1a1a2e",
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
