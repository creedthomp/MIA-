import type { EmoteId } from "@/types/realtimeEvents";

// Taunt set — tuned for a bluffing game. Order = picker order.
export const EMOTE_IDS: EmoteId[] = [
  "laugh",
  "doubt",
  "liar",
  "shock",
  "cool",
  "sweat",
  "taunt",
  "hurry",
];

export const EMOTES: Record<EmoteId, { emoji: string; phrase: string }> = {
  laugh: { emoji: "😂", phrase: "Ha!" },
  doubt: { emoji: "🤨", phrase: "Suuure." },
  liar:  { emoji: "🤥", phrase: "Trust me." },
  shock: { emoji: "😱", phrase: "No way." },
  cool:  { emoji: "😎", phrase: "Too easy." },
  sweat: { emoji: "😅", phrase: "Getting hot?" },
  taunt: { emoji: "😈", phrase: "Pull it." },
  hurry: { emoji: "😴", phrase: "Any day now." },
};
