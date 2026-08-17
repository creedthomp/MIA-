import type { EmoteId } from "@/types/realtimeEvents";
import type { EmoteVoice } from "@/utils/emotes";

// Emote art registry — 21 expressions per character.
//
// Two mascots, matched to the player's voice: Ace (female) and Deuce (male), the
// MiA! card-sharp raccoons. Art is generated, not hand-placed:
//
//   node scripts/emote-art/generate.mjs           # all 42 PNGs + contact sheets
//   node scripts/emote-art/generate.mjs laugh     # just one, both characters
//
// Shapes live in scripts/emote-art/mascot.mjs (expressions in EMOTE_SPECS).
// Metro needs static paths, so every file is listed here.

const ART: Record<EmoteVoice, Record<EmoteId, number>> = {
  female: {
    objection: require("../assets/emotes/female/objection.png"),
    boo: require("../assets/emotes/female/boo.png"),
    cheer: require("../assets/emotes/female/cheer.png"),
    cry: require("../assets/emotes/female/cry.png"),
    think: require("../assets/emotes/female/think.png"),
    trust: require("../assets/emotes/female/trust.png"),
    erm: require("../assets/emotes/female/erm.png"),
    noway: require("../assets/emotes/female/noway.png"),
    pain: require("../assets/emotes/female/pain.png"),
    laugh: require("../assets/emotes/female/laugh.png"),
    sweat: require("../assets/emotes/female/sweat.png"),
    idle: require("../assets/emotes/female/idle.png"),
    scream: require("../assets/emotes/female/scream.png"),
    attack: require("../assets/emotes/female/attack.png"),
    watching: require("../assets/emotes/female/watching.png"),
    clown: require("../assets/emotes/female/clown.png"),
    mia: require("../assets/emotes/female/mia.png"),
    gg: require("../assets/emotes/female/gg.png"),
    salty: require("../assets/emotes/female/salty.png"),
    slow: require("../assets/emotes/female/slow.png"),
    crown: require("../assets/emotes/female/crown.png"),
  },
  male: {
    objection: require("../assets/emotes/male/objection.png"),
    boo: require("../assets/emotes/male/boo.png"),
    cheer: require("../assets/emotes/male/cheer.png"),
    cry: require("../assets/emotes/male/cry.png"),
    think: require("../assets/emotes/male/think.png"),
    trust: require("../assets/emotes/male/trust.png"),
    erm: require("../assets/emotes/male/erm.png"),
    noway: require("../assets/emotes/male/noway.png"),
    pain: require("../assets/emotes/male/pain.png"),
    laugh: require("../assets/emotes/male/laugh.png"),
    sweat: require("../assets/emotes/male/sweat.png"),
    idle: require("../assets/emotes/male/idle.png"),
    scream: require("../assets/emotes/male/scream.png"),
    attack: require("../assets/emotes/male/attack.png"),
    watching: require("../assets/emotes/male/watching.png"),
    clown: require("../assets/emotes/male/clown.png"),
    mia: require("../assets/emotes/male/mia.png"),
    gg: require("../assets/emotes/male/gg.png"),
    salty: require("../assets/emotes/male/salty.png"),
    slow: require("../assets/emotes/male/slow.png"),
    crown: require("../assets/emotes/male/crown.png"),
  },
};

/** Art for an emote in that player's character. */
export function emoteArt(id: EmoteId, voice: EmoteVoice): number {
  return ART[voice][id];
}
