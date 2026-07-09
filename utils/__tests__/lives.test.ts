import { describe, it, expect } from "bun:test";
import { applyLifeLoss } from "../lives";
import type { Player } from "@/types/game";

function makePlayer(id: string, lives: number): Player {
  return { userId: id, displayName: id, lives, turnOrder: 0, isActive: lives > 0 };
}

describe("applyLifeLoss", () => {
  it("reduces lives by the given amount", () => {
    const result = applyLifeLoss([makePlayer("A", 5)], "A", 1);
    expect(result[0].lives).toBe(4);
    expect(result[0].isActive).toBe(true);
  });

  it("sets isActive=false when lives reach 0", () => {
    const result = applyLifeLoss([makePlayer("A", 1)], "A", 1);
    expect(result[0].lives).toBe(0);
    expect(result[0].isActive).toBe(false);
  });

  it("does not go below 0 lives", () => {
    const result = applyLifeLoss([makePlayer("A", 1)], "A", 5);
    expect(result[0].lives).toBe(0);
  });

  it("does not affect other players", () => {
    const players = [makePlayer("A", 5), makePlayer("B", 3)];
    const result = applyLifeLoss(players, "A", 2);
    expect(result[0].lives).toBe(3);
    expect(result[1].lives).toBe(3);
  });

  it("is immutable — returns new array", () => {
    const players = [makePlayer("A", 5)];
    const result = applyLifeLoss(players, "A", 1);
    expect(result).not.toBe(players);
    expect(players[0].lives).toBe(5); // original unchanged
  });
});
