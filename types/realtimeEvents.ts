import type { Declaration, Roll } from "./game";

export type RealtimeEventType =
  | "ROLL_DECLARED"
  | "CHALLENGE"
  | "CHALLENGE_CANCELLED"
  | "CHALLENGE_RESOLVED"
  | "LIFE_LOST"
  | "ROUND_STARTED"
  | "GAME_OVER";

export interface RollDeclaredPayload {
  userId: string;
  declaration: Declaration;
}

export interface ChallengePayload {
  challengerUserId: string;
}

export interface ChallengeResolvedPayload {
  wasHonest: boolean;
  loserUserId: string;
  livesLost: number;
  revealedRoll: Roll;
  declared: Declaration;
}

export interface LifeLostPayload {
  userId: string;
  newLives: number;
  isEliminated: boolean;
}

export interface RoundStartedPayload {
  currentTurnUserId: string;
  playerOrder: string[]; // userIds in turn order, used to sync all clients
}

export interface GameOverPayload {
  winnerUserId: string;
}

export type RealtimeEvent =
  | { type: "ROLL_DECLARED"; payload: RollDeclaredPayload }
  | { type: "CHALLENGE"; payload: ChallengePayload }
  | { type: "CHALLENGE_CANCELLED"; payload: Record<string, never> }
  | { type: "CHALLENGE_RESOLVED"; payload: ChallengeResolvedPayload }
  | { type: "LIFE_LOST"; payload: LifeLostPayload }
  | { type: "ROUND_STARTED"; payload: RoundStartedPayload }
  | { type: "GAME_OVER"; payload: GameOverPayload };
