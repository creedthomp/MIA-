import { describe, it, expect } from "bun:test";
import { resolveChallenge } from "../challenge";

const A = "user-A";
const B = "user-B";

describe("resolveChallenge", () => {
  it("honest roll: challenger loses 2 lives", () => {
    const outcome = resolveChallenge(A, B, 62, [6, 2]);
    expect(outcome.wasHonest).toBe(true);
    expect(outcome.loserUserId).toBe(A);
    expect(outcome.livesLost).toBe(2);
  });

  it("lying roll: previous player loses 1 life", () => {
    const outcome = resolveChallenge(A, B, 62, [5, 1]);
    expect(outcome.wasHonest).toBe(false);
    expect(outcome.loserUserId).toBe(B);
    expect(outcome.livesLost).toBe(1);
  });

  it("includes the actual roll in outcome", () => {
    const outcome = resolveChallenge(A, B, 62, [6, 2]);
    expect(outcome.actualRoll).toEqual([6, 2]);
    expect(outcome.declared).toBe(62);
  });
});
