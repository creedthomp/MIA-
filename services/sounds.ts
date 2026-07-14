import { Audio } from "expo-av";

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

export async function unloadSounds(): Promise<void> {
  try {
    await emotePop?.unloadAsync();
  } catch {
    // ignore
  }
  emotePop = null;
}
