import AsyncStorage from "@react-native-async-storage/async-storage";

export const EMOTES_MUTED_KEY = "mia.settings.emotesMuted";

export interface SettingsSlice {
  emotesMuted: boolean;
  setEmotesMuted: (muted: boolean) => void;
}

export const createSettingsSlice = (
  set: (fn: (state: SettingsSlice) => Partial<SettingsSlice>) => void
): SettingsSlice => ({
  emotesMuted: false,

  setEmotesMuted: (muted) => {
    AsyncStorage.setItem(EMOTES_MUTED_KEY, muted ? "1" : "0").catch(() => {});
    set(() => ({ emotesMuted: muted }));
  },
});
