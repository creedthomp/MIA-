import { create } from "zustand";
import { createAuthSlice, type AuthSlice } from "./store/authSlice";
import { createGameSlice, type GameSlice } from "./store/gameSlice";
import { createLobbySlice, type LobbySlice } from "./store/lobbySlice";

type Store = AuthSlice & GameSlice & LobbySlice;

export const useStore = create<Store>((set) => ({
  ...createAuthSlice(set as Parameters<typeof createAuthSlice>[0]),
  ...createGameSlice(set as Parameters<typeof createGameSlice>[0]),
  ...createLobbySlice(set as Parameters<typeof createLobbySlice>[0]),
}));
