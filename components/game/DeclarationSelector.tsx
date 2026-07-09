import { ScrollView, TouchableOpacity, Text } from "react-native";
import { validDeclarationsAbove, formatDeclaration } from "@/utils/declarations";
import type { Declaration } from "@/types/game";

interface DeclarationSelectorProps {
  current: Declaration | null;
  selected: Declaration | null;
  onSelect: (d: Declaration) => void;
}

export function DeclarationSelector({ current, selected, onSelect }: DeclarationSelectorProps) {
  const valid = validDeclarationsAbove(current);

  if (valid.length === 0) {
    return (
      <Text className="text-gray-400 dark:text-muted text-sm text-center py-2">
        No higher declarations available (declare Mia or challenge)
      </Text>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 4 }}
    >
      {valid.map((d) => (
        <TouchableOpacity
          key={d}
          onPress={() => onSelect(d)}
          style={{ marginRight: 8 }}
          className={`px-4 py-2 rounded-xl border ${
            d === selected
              ? "bg-accent border-accent"
              : "bg-card dark:bg-panel border-gray-200 dark:border-gray-700"
          }`}
        >
          <Text
            className={`font-semibold text-sm ${
              d === selected ? "text-white" : "text-gray-900 dark:text-white"
            }`}
          >
            {formatDeclaration(d)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
