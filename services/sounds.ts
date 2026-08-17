import { Audio } from "expo-av";
import { EMOTES, type EmoteVoice } from "@/utils/emotes";
import type { EmoteId } from "@/types/realtimeEvents";

// Sounds are best-effort — failures (autoplay policy, missing audio output)
// should never interrupt gameplay.

let emotePop: Audio.Sound | null = null;

export async function playEmotePop(): Promise<void> {
  try {
    if (!emotePop) {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/emote-pop.wav"),
        { volume: 0.5 }
      );
      emotePop = sound;
    }
    await emotePop.replayAsync();
  } catch {
    // ignore
  }
}

// Metro needs static literal paths, so every clip is listed. Keys match the
// filenames in EMOTES[...].sound, prefixed by voice.
const VOICE_CLIPS: Record<string, number> = {
  "female/Female Type 1 Affirmation 9.wav": require("../assets/sounds/female/Female Type 1 Affirmation 9.wav"),
  "female/Female Type 1 Attacking 21.wav": require("../assets/sounds/female/Female Type 1 Attacking 21.wav"),
  "female/Female Type 1 Booing 1.wav": require("../assets/sounds/female/Female Type 1 Booing 1.wav"),
  "female/Female Type 1 Cheering 3.wav": require("../assets/sounds/female/Female Type 1 Cheering 3.wav"),
  "female/Female Type 1 Crying 3.wav": require("../assets/sounds/female/Female Type 1 Crying 3.wav"),
  "female/Female Type 1 Erm 3.wav": require("../assets/sounds/female/Female Type 1 Erm 3.wav"),
  "female/Female Type 1 Exertion 12.wav": require("../assets/sounds/female/Female Type 1 Exertion 12.wav"),
  "female/Female Type 1 Idle 3.wav": require("../assets/sounds/female/Female Type 1 Idle 3.wav"),
  "female/Female Type 1 Idle 4.wav": require("../assets/sounds/female/Female Type 1 Idle 4.wav"),
  "female/Female Type 1 Laughing 5.wav": require("../assets/sounds/female/Female Type 1 Laughing 5.wav"),
  "female/Female Type 1 Objection 1.wav": require("../assets/sounds/female/Female Type 1 Objection 1.wav"),
  "female/Female Type 1 Objection 15.wav": require("../assets/sounds/female/Female Type 1 Objection 15.wav"),
  "female/Female Type 1 Reaction 3.wav": require("../assets/sounds/female/Female Type 1 Reaction 3.wav"),
  "female/Female Type 1 Thinking 10.wav": require("../assets/sounds/female/Female Type 1 Thinking 10.wav"),
  "male/Male Type 1 Affirmation 24.wav": require("../assets/sounds/male/Male Type 1 Affirmation 24.wav"),
  "male/Male Type 1 Cheering 2.wav": require("../assets/sounds/male/Male Type 1 Cheering 2.wav"),
  "male/Male Type 1 Erm 24.wav": require("../assets/sounds/male/Male Type 1 Erm 24.wav"),
  "male/Male Type 1 Reaction 25.wav": require("../assets/sounds/male/Male Type 1 Reaction 25.wav"),
  "male/Male Type 1 Reaction 5.wav": require("../assets/sounds/male/Male Type 1 Reaction 5.wav"),
  "male/Male Type 1 Reaction 56.wav": require("../assets/sounds/male/Male Type 1 Reaction 56.wav"),
  "male/Male Type 2 Crying 8.wav": require("../assets/sounds/male/Male Type 2 Crying 8.wav"),
  "male/Male Type 2 Exertion 7.wav": require("../assets/sounds/male/Male Type 2 Exertion 7.wav"),
  "male/Male Type 2 Idle 6.wav": require("../assets/sounds/male/Male Type 2 Idle 6.wav"),
  "male/Male Type 2 Laughing 3.wav": require("../assets/sounds/male/Male Type 2 Laughing 3.wav"),
  "male/Male Type 2 Objection 4.wav": require("../assets/sounds/male/Male Type 2 Objection 4.wav"),
  "male/Male Type 2 Pain 3.wav": require("../assets/sounds/male/Male Type 2 Pain 3.wav"),
  "male/Male Type 2 Screaming 1.wav": require("../assets/sounds/male/Male Type 2 Screaming 1.wav"),
  "male/Male Type 2 Thinking 25.wav": require("../assets/sounds/male/Male Type 2 Thinking 25.wav"),
};

const loadedVoices: Record<string, Audio.Sound> = {};

/** Plays the emote's line in that player's voice. Silent emotes are a no-op. */
export async function playEmoteVoice(
  emote: EmoteId,
  voice: EmoteVoice
): Promise<void> {
  const { sound: clips } = EMOTES[emote];
  if (!clips) return;

  const key = `${voice}/${clips[voice]}`;
  const asset = VOICE_CLIPS[key];
  if (!asset) return;

  try {
    if (!loadedVoices[key]) {
      const { sound } = await Audio.Sound.createAsync(asset, { volume: 0.8 });
      loadedVoices[key] = sound;
    }
    await loadedVoices[key].replayAsync();
  } catch {
    // ignore
  }
}

export async function unloadSounds(): Promise<void> {
  try {
    await emotePop?.unloadAsync();
  } catch {
    // ignore
  }
  emotePop = null;

  for (const key of Object.keys(loadedVoices)) {
    try {
      await loadedVoices[key].unloadAsync();
    } catch {
      // ignore
    }
    delete loadedVoices[key];
  }
}
