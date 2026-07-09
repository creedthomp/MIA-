export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export type Roll = [DieValue, DieValue]; // always [higher, lower]

export type Declaration = number; // e.g. 62, 21, 66

export type RollCategory = "normal" | "double" | "mia";

export interface Player {
  userId: string;
  displayName: string;
  lives: number;
  turnOrder: number;
  isActive: boolean;
}

export interface ChallengeOutcome {
  challengerUserId: string;
  previousUserId: string;
  declared: Declaration;
  actualRoll: Roll;
  wasHonest: boolean;
  loserUserId: string;
  livesLost: number;
}
