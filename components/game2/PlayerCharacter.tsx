import { View, Image } from "react-native";

// Character art registry. Real art drops in here later, keyed by characterId:
//   rook: require("../../assets/characters/rook.png"),
// Until then, PlayerCharacter falls back to a filler stick figure.
const CHARACTERS: Record<string, number> = {};

// Muted, slightly-varied filler colors so a table of stick figures reads as
// distinct people rather than clones.
const FILLER_COLORS = ["#9aa0a8", "#8f958c", "#a09488", "#8b90a0", "#8aa098", "#a08b8b"];

function fillerColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FILLER_COLORS[h % FILLER_COLORS.length];
}

// A crude stick figure drawn with Views (no SVG dependency). Placeholder only.
function StickFigure({ size, color }: { size: number; color: string }) {
  const st = Math.max(2, Math.round(size * 0.06)); // stroke width
  const head = Math.round(size * 0.26);
  const W = Math.round(size * 0.64);
  const cx = W / 2;
  const hipY = Math.round(size * 0.58);
  const legLen = Math.round(size * 0.36);
  const pivot = legLen / 2 - st / 2; // rotate legs around their top (the hip)
  const bar = { position: "absolute" as const, backgroundColor: color, borderRadius: st / 2 };

  return (
    <View style={{ width: W, height: size }}>
      {/* head */}
      <View style={[bar, { left: cx - head / 2, top: 0, width: head, height: head, borderRadius: head / 2 }]} />
      {/* torso */}
      <View style={[bar, { left: cx - st / 2, top: head - st, width: st, height: hipY - (head - st) }]} />
      {/* arms */}
      <View style={[bar, { left: cx - Math.round(size * 0.22), top: Math.round(size * 0.32), width: Math.round(size * 0.44), height: st }]} />
      {/* legs (pivoted at the hip) */}
      <View style={[bar, { left: cx - st / 2, top: hipY - st, width: st, height: legLen, transform: [{ translateY: pivot }, { rotate: "17deg" }, { translateY: -pivot }] }]} />
      <View style={[bar, { left: cx - st / 2, top: hipY - st, width: st, height: legLen, transform: [{ translateY: pivot }, { rotate: "-17deg" }, { translateY: -pivot }] }]} />
    </View>
  );
}

interface PlayerCharacterProps {
  seed: string;          // usually the player's id — drives the filler variant
  characterId?: string;  // when set + present in CHARACTERS, renders real art
  size?: number;         // rendered height
  dim?: boolean;
}

export function PlayerCharacter({ seed, characterId, size = 52, dim }: PlayerCharacterProps) {
  const art = characterId ? CHARACTERS[characterId] : undefined;
  return (
    <View style={{ opacity: dim ? 0.5 : 1, alignItems: "center", justifyContent: "flex-end", height: size }}>
      {art ? (
        <Image source={art} style={{ width: size, height: size, resizeMode: "contain" }} />
      ) : (
        <StickFigure size={size} color={fillerColor(seed)} />
      )}
    </View>
  );
}
