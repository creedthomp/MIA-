import type { EmoteVoice } from "@/utils/emotes";

// Each player has one emote voice for the whole game. There is no voice column
// on the profile yet, so it is derived from the user id — stable for a given
// player, and the same on every client without another round trip. When a real
// preference lands, this is the only function that changes.

export function voiceForUser(userId: string): EmoteVoice {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? "female" : "male";
}
