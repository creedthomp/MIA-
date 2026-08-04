import { describe, it, expect } from "bun:test";
import { getTier, tierFloor, placementDelta, streakBonus } from "../ranking";

describe("getTier", () => {
  it("0 trophies → Mark", () => expect(getTier(0).name).toBe("Mark"));
  it("699 → Fibber, 700 → Bluffer", () => {
    expect(getTier(699).name).toBe("Fibber");
    expect(getTier(700).name).toBe("Bluffer");
  });
  it("3000 → Con Artist", () => expect(getTier(3000).name).toBe("Con Artist"));
});

describe("tierFloor", () => {
  it("clamps to the bottom of the current tier", () => {
    expect(tierFloor(850)).toBe(700);  // Bluffer floor
    expect(tierFloor(120)).toBe(0);    // Mark floor
  });
});

describe("placementDelta", () => {
  it("6-player winner gains the most", () => expect(placementDelta(1, 6)).toBe(40));
  it("6-player placements descend", () => {
    expect(placementDelta(2, 6)).toBe(24);
    expect(placementDelta(3, 6)).toBe(8);
  });
  it("losses are softened (halved)", () => {
    expect(placementDelta(6, 6)).toBe(-20); // raw -40 → -20
    expect(placementDelta(4, 6)).toBe(-4);  // raw -8 → -4
  });
  it("scales down with lobby size (anti-farm)", () => {
    expect(placementDelta(1, 2)).toBe(8);   // 2-player win « 6-player win
    expect(placementDelta(2, 2)).toBe(-4);
  });
});

describe("streakBonus", () => {
  it("no bonus below 3 in a row", () => {
    expect(streakBonus(1)).toBe(0);
    expect(streakBonus(2)).toBe(0);
  });
  it("+5 per win past the 2nd, capped at 25", () => {
    expect(streakBonus(3)).toBe(5);
    expect(streakBonus(5)).toBe(15);
    expect(streakBonus(10)).toBe(25);
  });
});
