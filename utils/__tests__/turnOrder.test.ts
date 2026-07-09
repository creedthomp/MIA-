import { describe, it, expect } from "bun:test";
import { nextActivePlayer, isGameOver, getWinner } from "../turnOrder";
import type { Player } from "@/types/game";

function makePlayer(id: string, order: number, lives = 5): Player {
  return { userId: id, displayName: id, lives, turnOrder: order, isActive: lives > 0 };
}

const players: Player[] = [
  makePlayer("A", 0),
  makePlayer("B", 1),
  makePlayer("C", 2),
];

describe("nextActivePlayer", () => {
  it("goes A → B → C → A", () => {
    expect(nextActivePlayer(players, "A").userId).toBe("B");
    expect(nextActivePlayer(players, "B").userId).toBe("C");
    expect(nextActivePlayer(players, "C").userId).toBe("A");
  });

  it("skips eliminated players", () => {
    const withElim = [
      makePlayer("A", 0),
      makePlayer("B", 1, 0), // eliminated
      makePlayer("C", 2),
    ];
    expect(nextActivePlayer(withElim, "A").userId).toBe("C");
  });

  it("wraps around correctly skipping eliminated", () => {
    const withElim = [
      makePlayer("A", 0),
      makePlayer("B", 1),
      makePlayer("C", 2, 0), // eliminated
    ];
    expect(nextActivePlayer(withElim, "B").userId).toBe("A");
  });
});

describe("isGameOver", () => {
  it("false when 3 players active", () => expect(isGameOver(players)).toBe(false));
  it("true when 1 player active", () => {
    const oneLeft = [makePlayer("A", 0), makePlayer("B", 1, 0), makePlayer("C", 2, 0)];
    expect(isGameOver(oneLeft)).toBe(true);
  });
});

describe("getWinner", () => {
  it("returns null when multiple active", () => expect(getWinner(players)).toBeNull());
  it("returns the sole active player", () => {
    const oneLeft = [makePlayer("A", 0), makePlayer("B", 1, 0)];
    expect(getWinner(oneLeft)?.userId).toBe("A");
  });
});
