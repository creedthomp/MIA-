import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { ALL_DECLARATIONS, formatDeclaration } from "@/utils/declarations";
import { getRank } from "@/utils/rollHierarchy";
import type { Declaration } from "@/types/game";

interface Props {
  currentDeclaration: Declaration | null;
  onDeclare: (d: Declaration) => void;
  disabled?: boolean;
}

function parse(text: string): Declaration | null {
  if (text.length !== 2) return null;
  const n = parseInt(text, 10);
  return ALL_DECLARATIONS.includes(n as Declaration) ? (n as Declaration) : null;
}

function suggest(text: string): Declaration | null {
  if (text.length !== 2) return null;
  const reversed = parseInt(text[1] + text[0], 10);
  return ALL_DECLARATIONS.includes(reversed as Declaration) ? (reversed as Declaration) : null;
}

export function DeclarationInput({ currentDeclaration, onDeclare, disabled }: Props) {
  const [text, setText] = useState("");

  const parsed = parse(text);
  const hint = suggest(text);
  const isBelowFloor =
    parsed != null &&
    currentDeclaration != null &&
    getRank(parsed) < getRank(currentDeclaration);

  const effectiveDeclaration: Declaration | null = parsed ?? (text.length === 2 ? hint : null);
  const isBelow =
    effectiveDeclaration != null &&
    currentDeclaration != null &&
    getRank(effectiveDeclaration) < getRank(currentDeclaration);

  let hintText = "";
  let hintColor = "#9ca3af";

  if (text.length === 2) {
    if (parsed != null) {
      if (parsed === 21) {
        hintText = "MIA! 🎲";
        hintColor = "#f59e0b";
      } else if (parsed % 11 === 0) {
        hintText = isBelowFloor ? "Doubles — below floor ⚠️" : "Doubles ✓";
        hintColor = isBelowFloor ? "#f59e0b" : "#4ade80";
      } else {
        hintText = isBelowFloor ? "Below floor — costs 1 life ⚠️" : `${formatDeclaration(parsed)} ✓`;
        hintColor = isBelowFloor ? "#f59e0b" : "#4ade80";
      }
    } else if (hint != null) {
      hintText = `Did you mean ${formatDeclaration(hint)}?`;
      hintColor = "#f59e0b";
    } else {
      hintText = "Not valid (e.g. 63, 55, 21)";
      hintColor = "#ef4444";
    }
  }

  const canDeclare = effectiveDeclaration != null && !disabled;

  function handlePress() {
    if (!canDeclare || effectiveDeclaration == null) return;
    onDeclare(effectiveDeclaration);
    setText("");
  }

  let borderColor = "#2a3a54";
  if (text.length === 2) {
    if (parsed != null) borderColor = isBelow ? "#f59e0b" : "#16a34a";
    else if (hint != null) borderColor = "#f59e0b";
    else borderColor = "#ef4444";
  }

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "#4a5568", fontSize: 10, letterSpacing: 1, marginBottom: 5 }}>
        DECLARE YOUR ROLL
      </Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TextInput
          value={text}
          onChangeText={(t) => setText(t.replace(/[^0-9]/g, "").slice(0, 2))}
          keyboardType="numeric"
          maxLength={2}
          placeholder="—"
          placeholderTextColor="#374151"
          autoFocus
          style={{
            width: 56,
            backgroundColor: "#0d1626",
            borderWidth: 2,
            borderColor,
            borderRadius: 10,
            paddingVertical: 7,
            color: "#fff",
            fontSize: 20,
            fontWeight: "800",
            textAlign: "center",
            letterSpacing: 2,
          }}
        />
        <TouchableOpacity
          onPress={handlePress}
          disabled={!canDeclare}
          style={{
            borderRadius: 10,
            paddingVertical: 9,
            paddingHorizontal: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: !canDeclare
              ? "#111827"
              : isBelow
              ? "transparent"
              : "#e94560",
            borderWidth: isBelow && canDeclare ? 1.5 : 0,
            borderColor: "#f59e0b",
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 13,
              color: !canDeclare ? "#374151" : isBelow ? "#f59e0b" : "#fff",
            }}
          >
            {effectiveDeclaration != null
              ? isBelow
                ? "Declare (−1 life)"
                : `Declare ${formatDeclaration(effectiveDeclaration)}`
              : "Type roll →"}
          </Text>
        </TouchableOpacity>
      </View>
      {hintText !== "" && (
        <Text style={{ color: hintColor, fontSize: 11, marginTop: 4 }}>
          {hintText}
        </Text>
      )}
    </View>
  );
}
