import type { Declaration, Roll, ChallengeOutcome } from "@/types/game";
import { rollToDeclaration } from "./dice";

export function resolveChallenge(
  challengerUserId: string,
  previousUserId: string,
  declared: Declaration,
  actualRoll: Roll
): ChallengeOutcome {
  const actual = rollToDeclaration(actualRoll);
  const wasHonest = actual === declared;

  return {
    challengerUserId,
    previousUserId,
    declared,
    actualRoll,
    wasHonest,
    loserUserId: wasHonest ? challengerUserId : previousUserId,
    livesLost: wasHonest ? 2 : 1,
  };
}
