import { View, Image } from "react-native";

// Character art registry. Real art drops in here later, keyed by characterId:
//   rook: require("../../assets/characters/rook.png"),
// Art is cover-fit into the seat's portrait frame (poker-app style), so it
// should be a head-and-shoulders bust crop. Until then, a filler silhouette.
const CHARACTERS: Record<string, number> = {};

// Muted, slightly-varied filler colors so a table of silhouettes reads as
// distinct people rather than clones.
const FILLER_COLORS = ["#9aa0a8", "#8f958c", "#a09488", "#8b90a0", "#8aa098", "#a08b8b"];

function fillerColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FILLER_COLORS[h % FILLER_COLORS.length];
}

// Head-and-shoulders silhouette that fills a portrait frame from the bottom.
function BustFiller({ w, h, color }: { w: number; h: number; color: string }) {
  const head = Math.round(w * 0.4);
  const shoulderW = Math.round(w * 0.8);
  const shoulderH = Math.round(h * 0.36);
  return (
    <View style={{ width: w, height: h, alignItems: "center", justifyContent: "flex-end" }}>
      <View style={{ width: head, height: head, borderRadius: head / 2, backgroundColor: color, marginBottom: Math.round(h * 0.05) }} />
      <View style={{ width: shoulderW, height: shoulderH, borderTopLeftRadius: shoulderW / 2, borderTopRightRadius: shoulderW / 2, backgroundColor: color, marginBottom: -2 }} />
    </View>
  );
}

interface PlayerCharacterProps {
  seed: string;          // usually the player's id — drives the filler variant
  characterId?: string;  // when set + present in CHARACTERS, renders real art
  width: number;         // portrait frame inner size
  height: number;
}

export function PlayerCharacter({ seed, characterId, width, height }: PlayerCharacterProps) {
  const art = characterId ? CHARACTERS[characterId] : undefined;
  if (art) {
    return <Image source={art} style={{ width, height, resizeMode: "cover" }} />;
  }
  return <BustFiller w={width} h={height} color={fillerColor(seed)} />;
}
