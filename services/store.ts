import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAuthSlice, type AuthSlice } from "./store/authSlice";
import { createGameSlice, type GameSlice } from "./store/gameSlice";
import { createLobbySlice, type LobbySlice } from "./store/lobbySlice";
import { createSettingsSlice, type SettingsSlice, EMOTES_MUTED_KEY } from "./store/settingsSlice";

type Store = AuthSlice & GameSlice & LobbySlice & SettingsSlice;

export const useStore = create<Store>((set) => ({
  ...createAuthSlice(set as Parameters<typeof createAuthSlice>[0]),
  ...createGameSlice(set as Parameters<typeof createGameSlice>[0]),
  ...createLobbySlice(set as Parameters<typeof createLobbySlice>[0]),
  ...createSettingsSlice(set as Parameters<typeof createSettingsSlice>[0]),
}));

// Hydrate persisted settings once at startup
AsyncStorage.getItem(EMOTES_MUTED_KEY)
  .then((v) => {
    if (v === "1") useStore.setState({ emotesMuted: true });
  })
  .catch(() => {});
