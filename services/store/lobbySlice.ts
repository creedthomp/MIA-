import type { RoomType } from "@/services/roomService";

export interface LobbySlice {
  currentRoomId: string | null;
  currentRoomCode: string | null;
  currentRoomType: RoomType | null;
  setCurrentRoom: (id: string, code: string, type: RoomType) => void;
  clearRoom: () => void;
}

export const createLobbySlice = (
  set: (fn: (state: LobbySlice) => Partial<LobbySlice>) => void
): LobbySlice => ({
  currentRoomId: null,
  currentRoomCode: null,
  currentRoomType: null,

  setCurrentRoom: (id, code, type) =>
    set(() => ({ currentRoomId: id, currentRoomCode: code, currentRoomType: type })),

  clearRoom: () =>
    set(() => ({ currentRoomId: null, currentRoomCode: null, currentRoomType: null })),
});
