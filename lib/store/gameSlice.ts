import type { Player, Declaration, Roll } from "@/types/game";
import type { RealtimeEvent } from "@/types/realtimeEvents";
import { nextActivePlayer } from "@/utils/turnOrder";

export type GamePhase =
  | "waiting"           // between rounds
  | "my_turn_pre_roll"  // my turn, haven't rolled yet
  | "my_turn_declare"   // I've rolled, need to pick a declaration
  | "others_turn"       // not my turn
  | "challenge_pending" // challenge in progress
  | "game_over";

export interface GameSlice {
  gamePlayers: Player[];
  currentDeclaration: Declaration | null;
  currentTurnUserId: string | null;
  previousTurnUserId: string | null;
  myActualRoll: Roll | null;
  phase: GamePhase;
  winnerId: string | null;
  lastEvent: RealtimeEvent | null;

  initGame: (players: Player[], myUserId: string) => void;
  applyBroadcastEvent: (event: RealtimeEvent, myUserId: string) => void;
  setMyRoll: (roll: Roll) => void;
  resetGame: () => void;
}

const INITIAL_STATE = {
  gamePlayers: [] as Player[],
  currentDeclaration: null as Declaration | null,
  currentTurnUserId: null as string | null,
  previousTurnUserId: null as string | null,
  myActualRoll: null as Roll | null,
  phase: "waiting" as GamePhase,
  winnerId: null as string | null,
  lastEvent: null as RealtimeEvent | null,
};

export const createGameSlice = (
  set: (fn: (state: GameSlice) => Partial<GameSlice>) => void
): GameSlice => ({
  ...INITIAL_STATE,

  initGame: (players, _myUserId) =>
    set(() => ({ ...INITIAL_STATE, gamePlayers: players })),

  applyBroadcastEvent: (event, myUserId) =>
    set((state) => {
      const players = state.gamePlayers;

      switch (event.type) {
        case "ROUND_STARTED": {
          const { currentTurnUserId, playerOrder } = event.payload;
          const updatedPlayers = players.map((p) => ({
            ...p,
            turnOrder: playerOrder.indexOf(p.userId),
          }));
          return {
            lastEvent: event,
            gamePlayers: updatedPlayers,
            currentTurnUserId,
            previousTurnUserId: null,
            currentDeclaration: null,
            myActualRoll: null,
            phase: currentTurnUserId === myUserId ? "my_turn_pre_roll" : "others_turn",
          };
        }

        case "ROLL_DECLARED": {
          const { userId, declaration } = event.payload;
          const next = nextActivePlayer(players, userId);
          return {
            lastEvent: event,
            currentDeclaration: declaration,
            previousTurnUserId: userId,
            currentTurnUserId: next.userId,
            phase: next.userId === myUserId ? "my_turn_pre_roll" : "others_turn",
          };
        }

        case "CHALLENGE": {
          return { lastEvent: event, phase: "challenge_pending" };
        }

        case "CHALLENGE_CANCELLED": {
          // Challenger's edge function call failed — revert everyone to playable state
          return {
            lastEvent: event,
            phase: state.currentTurnUserId === myUserId ? "my_turn_pre_roll" : "others_turn",
          };
        }

        case "CHALLENGE_RESOLVED": {
          // Life changes arrive via LIFE_LOST; a new round starts via ROUND_STARTED
          return { lastEvent: event, phase: "waiting" };
        }

        case "LIFE_LOST": {
          const { userId, newLives, isEliminated } = event.payload;
          return {
            lastEvent: event,
            gamePlayers: players.map((p) =>
              p.userId === userId ? { ...p, lives: newLives, isActive: !isEliminated } : p
            ),
          };
        }

        case "GAME_OVER": {
          return {
            lastEvent: event,
            winnerId: event.payload.winnerUserId,
            phase: "game_over",
          };
        }

        default:
          return { lastEvent: event };
      }
    }),

  setMyRoll: (roll) =>
    set(() => ({ myActualRoll: roll, phase: "my_turn_declare" })),

  resetGame: () => set(() => ({ ...INITIAL_STATE })),
});
