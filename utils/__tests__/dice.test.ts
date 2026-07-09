import { describe, it, expect } from "bun:test";
import { rollDie, rollDice, rollToDeclaration } from "../dice";

describe("rollDie", () => {
  it("returns a value 1-6", () => {
    for (let i = 0; i < 100; i++) {
      const v = rollDie();
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
});

describe("rollDice", () => {
  it("returns [higher, lower]", () => {
    for (let i = 0; i < 100; i++) {
      const [high, low] = rollDice();
      expect(high).toBeGreaterThanOrEqual(low);
    }
  });
});

describe("rollToDeclaration", () => {
  it("encodes [6,2] as 62", () => expect(rollToDeclaration([6, 2])).toBe(62));
  it("encodes [2,1] as 21", () => expect(rollToDeclaration([2, 1])).toBe(21));
  it("encodes [6,6] as 66", () => expect(rollToDeclaration([6, 6])).toBe(66));
  it("encodes [3,1] as 31", () => expect(rollToDeclaration([3, 1])).toBe(31));
});
