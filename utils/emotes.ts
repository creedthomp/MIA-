import type { EmoteId } from "@/types/realtimeEvents";

// Emote set — spec: docs/emote-spec.md.
//
// Each emote is an emoji + a phrase rendered by the app + an optional voice
// clip in that player's voice. (Character art may replace the emoji later —
// see docs/emote-art-brief.md — but emoji is the shipping visual for now.)

export type EmoteVoice = "female" | "male";

/** Voice category — null for the silent emotes. */
export type EmoteCategory =
  | "objection"
  | "booing"
  | "cheering"
  | "crying"
  | "thinking"
  | "affirmation"
  | "erm"
  | "reaction"
  | "pain"
  | "laughing"
  | "exertion"
  | "idle"
  | "screaming"
  | "attacking";

export interface Emote {
  emoji: string;
  phrase: string;
  category: EmoteCategory | null;
  /** Clip filename per voice, relative to assets/sounds/<voice>/. Null = silent. */
  sound: Record<EmoteVoice, string> | null;
  /** Voices using a stand-in clip because they have none in the ideal category. */
  fallback?: EmoteVoice[];
  /** Only offered to the current global #1 ("the Mia"). */
  restricted?: boolean;
}

// Picker order. `crown` is excluded — it is appended to the tray only for the
// current #1 (see EmotePicker's bonusIds).
export const EMOTE_IDS: EmoteId[] = [
  "objection",
  "attack",
  "trust",
  "think",
  "erm",
  "laugh",
  "boo",
  "clown",
  "cry",
  "pain",
  "sweat",
  "noway",
  "mia",
  "scream",
  "cheer",
  "gg",
  "watching",
  "salty",
  "idle",
  "slow",
];

export const EMOTES: Record<EmoteId, Emote> = {
  objection: {
    emoji: "⚖️",
    phrase: "Objection!",
    category: "objection",
    sound: {
      female: "Female Type 1 Objection 1.wav",
      male: "Male Type 2 Objection 4.wav",
    },
  },
  boo: {
    emoji: "👎",
    phrase: "Booo.",
    category: "booing",
    sound: {
      female: "Female Type 1 Booing 1.wav",
      male: "Male Type 1 Reaction 56.wav",
    },
    fallback: ["male"],
  },
  cheer: {
    emoji: "🙌",
    phrase: "Let's go!",
    category: "cheering",
    sound: {
      female: "Female Type 1 Cheering 3.wav",
      male: "Male Type 1 Cheering 2.wav",
    },
  },
  cry: {
    emoji: "😭",
    phrase: "Cry about it.",
    category: "crying",
    sound: {
      female: "Female Type 1 Crying 3.wav",
      male: "Male Type 2 Crying 8.wav",
    },
  },
  think: {
    emoji: "🤔",
    phrase: "Hmmmm…",
    category: "thinking",
    sound: {
      female: "Female Type 1 Thinking 10.wav",
      male: "Male Type 2 Thinking 25.wav",
    },
  },
  trust: {
    emoji: "😏",
    phrase: "Trust me.",
    category: "affirmation",
    sound: {
      female: "Female Type 1 Affirmation 9.wav",
      male: "Male Type 1 Affirmation 24.wav",
    },
  },
  erm: {
    emoji: "😬",
    phrase: "Ermmm…",
    category: "erm",
    sound: {
      female: "Female Type 1 Erm 3.wav",
      male: "Male Type 1 Erm 24.wav",
    },
  },
  noway: {
    emoji: "😱",
    phrase: "No way!",
    category: "reaction",
    sound: {
      female: "Female Type 1 Reaction 3.wav",
      male: "Male Type 1 Reaction 25.wav",
    },
  },
  pain: {
    emoji: "🤕",
    phrase: "That hurt?",
    category: "pain",
    sound: {
      female: "Female Type 1 Crying 3.wav",
      male: "Male Type 2 Pain 3.wav",
    },
    fallback: ["female"],
  },
  laugh: {
    emoji: "😂",
    phrase: "Ha!",
    category: "laughing",
    sound: {
      female: "Female Type 1 Laughing 5.wav",
      male: "Male Type 2 Laughing 3.wav",
    },
  },
  sweat: {
    emoji: "😅",
    phrase: "Getting hot?",
    category: "exertion",
    sound: {
      female: "Female Type 1 Exertion 12.wav",
      male: "Male Type 2 Exertion 7.wav",
    },
  },
  idle: {
    emoji: "🥱",
    phrase: "Any day now…",
    category: "idle",
    sound: {
      female: "Female Type 1 Idle 4.wav",
      male: "Male Type 2 Idle 6.wav",
    },
  },
  scream: {
    emoji: "😱",
    phrase: "NOOO!",
    category: "screaming",
    sound: {
      female: "Female Type 1 Reaction 3.wav",
      male: "Male Type 2 Screaming 1.wav",
    },
    fallback: ["female"],
  },
  attack: {
    emoji: "😤",
    phrase: "Come at me.",
    category: "attacking",
    sound: {
      female: "Female Type 1 Attacking 21.wav",
      male: "Male Type 2 Exertion 7.wav",
    },
    fallback: ["male"],
  },

  // Silent — emoji + phrase only, safe to spam.
  watching: { emoji: "👀", phrase: "I'm watching.", category: null, sound: null },
  clown: { emoji: "🤡", phrase: "Nice bluff.", category: null, sound: null },
  mia: { emoji: "🤯", phrase: "A Mia?!", category: null, sound: null },
  gg: { emoji: "🤝", phrase: "GG.", category: null, sound: null },
  salty: { emoji: "🧂", phrase: "Salty?", category: null, sound: null },
  slow: { emoji: "🐌", phrase: "…", category: null, sound: null },

  crown: {
    emoji: "👑",
    phrase: "Mia.",
    category: "cheering",
    sound: {
      female: "Female Type 1 Cheering 3.wav",
      male: "Male Type 1 Cheering 2.wav",
    },
    restricted: true,
  },
};
