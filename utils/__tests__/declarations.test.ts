import { describe, it, expect } from "bun:test";
import {
  ALL_DECLARATIONS,
  validDeclarationsAbove,
  isValidDeclaration,
  formatDeclaration,
} from "../declarations";

describe("ALL_DECLARATIONS", () => {
  it("starts with 31 and ends with 21", () => {
    expect(ALL_DECLARATIONS[0]).toBe(31);
    expect(ALL_DECLARATIONS[ALL_DECLARATIONS.length - 1]).toBe(21);
  });
  it("has 21 entries", () => expect(ALL_DECLARATIONS.length).toBe(21));
});

describe("validDeclarationsAbove", () => {
  it("returns all declarations when current is null", () =>
    expect(validDeclarationsAbove(null)).toEqual(ALL_DECLARATIONS));

  it("above 65 returns doubles + mia", () => {
    const result = validDeclarationsAbove(65);
    expect(result).toEqual([11, 22, 33, 44, 55, 66, 21]);
  });

  it("above 21 (mia) returns empty", () =>
    expect(validDeclarationsAbove(21)).toEqual([]));

  it("above 66 returns only mia", () =>
    expect(validDeclarationsAbove(66)).toEqual([21]));
});

describe("isValidDeclaration", () => {
  it("62 is valid above 31", () => expect(isValidDeclaration(62, 31)).toBe(true));
  it("31 is not valid above 62", () => expect(isValidDeclaration(31, 62)).toBe(false));
  it("21 is valid above 66", () => expect(isValidDeclaration(21, 66)).toBe(true));
});

describe("formatDeclaration", () => {
  it("21 → Mia", () => expect(formatDeclaration(21)).toBe("Mia"));
  it("66 → 66 (Double)", () => expect(formatDeclaration(66)).toBe("66 (Double)"));
  it("62 → 62", () => expect(formatDeclaration(62)).toBe("62"));
});
