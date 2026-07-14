import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Platform } from "react-native";
import { ALL_DECLARATIONS, formatDeclaration } from "@/utils/declarations";
import { getRank } from "@/utils/rollHierarchy";
import type { Declaration } from "@/types/game";

const C = {
  surface:  "#0f0f0f",
  border:   "#262626",
  fg:       "#fafafa",
  fgMuted:  "#a3a3a3",
  fgFaint:  "#6f6f6f",
  accent:   "#4d7cff",
  onAccent: "#ffffff",
  danger:   "#f0553b",
  warn:     "#f5a623",
  ok:       "#4ade80",
};
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

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
  const [confirmingLow, setConfirmingLow] = useState(false);

  const parsed = parse(text);
  const hint = suggest(text);

  const effectiveDeclaration: Declaration | null = parsed ?? (text.length === 2 ? hint : null);
  const isBelow =
    effectiveDeclaration != null &&
    currentDeclaration != null &&
    getRank(effectiveDeclaration) < getRank(currentDeclaration);

  let hintText = "";
  let hintColor = C.fgMuted;

  if (text.length === 2) {
    if (parsed != null) {
      if (parsed === 21) {
        hintText = "MIA — beats everything";
        hintColor = C.warn;
      } else if (parsed % 11 === 0) {
        hintText = isBelow ? "Doubles — below the call. Costs 1 life." : "Doubles — beats any normal roll";
        hintColor = isBelow ? C.warn : C.ok;
      } else {
        hintText = isBelow
          ? `Below ${formatDeclaration(currentDeclaration!)} — declaring this costs 1 life.`
          : `${formatDeclaration(parsed)} — valid call`;
        hintColor = isBelow ? C.warn : C.ok;
      }
    } else if (hint != null) {
      hintText = `Higher die first — did you mean ${formatDeclaration(hint)}?`;
      hintColor = C.warn;
    } else {
      hintText = "Not a real roll (try 63, 55, 21…)";
      hintColor = C.danger;
    }
  }

  const canDeclare = effectiveDeclaration != null && !disabled;

  function handlePress() {
    if (!canDeclare || effectiveDeclaration == null) return;
    // Below-floor declarations cost a life — require a second tap to confirm
    if (isBelow && !confirmingLow) {
      setConfirmingLow(true);
      return;
    }
    setConfirmingLow(false);
    onDeclare(effectiveDeclaration);
    setText("");
  }

  let borderColor = C.border;
  if (text.length === 2) {
    if (parsed != null) borderColor = isBelow ? C.warn : C.ok;
    else if (hint != null) borderColor = C.warn;
    else borderColor = C.danger;
  }

  let buttonLabel = "Type roll";
  if (effectiveDeclaration != null) {
    if (isBelow) buttonLabel = confirmingLow ? "Confirm — lose 1 life" : "Declare (−1 life)";
    else buttonLabel = `Declare ${formatDeclaration(effectiveDeclaration)}`;
  }

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: C.fgFaint, textTransform: "uppercase", marginBottom: 6 }}>
        {currentDeclaration != null
          ? `Declare your roll — beat ${formatDeclaration(currentDeclaration)}`
          : "Declare your roll"}
      </Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t.replace(/[^0-9]/g, "").slice(0, 2));
            setConfirmingLow(false);
          }}
          keyboardType="numeric"
          maxLength={2}
          placeholder="—"
          placeholderTextColor={C.fgFaint}
          autoFocus
          style={{
            width: 58,
            backgroundColor: C.surface,
            borderWidth: 1.5,
            borderColor,
            borderRadius: 10,
            paddingVertical: 8,
            color: C.fg,
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
            letterSpacing: 2,
          }}
        />
        <TouchableOpacity
          onPress={handlePress}
          disabled={!canDeclare}
          style={{
            borderRadius: 10,
            paddingVertical: 11,
            paddingHorizontal: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: !canDeclare
              ? C.surface
              : isBelow
              ? confirmingLow ? C.warn : "transparent"
              : C.accent,
            borderWidth: isBelow && canDeclare && !confirmingLow ? 1.5 : 0,
            borderColor: C.warn,
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 13,
              color: !canDeclare
                ? C.fgFaint
                : isBelow
                ? confirmingLow ? "#141414" : C.warn
                : C.onAccent,
            }}
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
      {hintText !== "" && (
        <Text style={{ fontFamily: MONO, color: hintColor, fontSize: 11, marginTop: 6, textAlign: "center", paddingHorizontal: 16 }}>
          {hintText}
        </Text>
      )}
    </View>
  );
}
