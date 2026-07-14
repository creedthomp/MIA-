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

// Any roll may be declared at any time — declaring below the current call
// costs a life instead of being blocked (see report-forfeit flow).
describe("validDeclarationsAbove", () => {
  it("returns all declarations when current is null", () =>
    expect(validDeclarationsAbove(null)).toEqual(ALL_DECLARATIONS));

  it("still returns all declarations above 65", () =>
    expect(validDeclarationsAbove(65)).toEqual(ALL_DECLARATIONS));

  it("still returns all declarations above 21 (mia)", () =>
    expect(validDeclarationsAbove(21)).toEqual(ALL_DECLARATIONS));
});

describe("isValidDeclaration", () => {
  it("62 is valid above 31", () => expect(isValidDeclaration(62, 31)).toBe(true));
  it("31 is declarable above 62 (costs a life, but valid)", () =>
    expect(isValidDeclaration(31, 62)).toBe(true));
  it("21 is valid above 66", () => expect(isValidDeclaration(21, 66)).toBe(true));
  it("26 is never a valid declaration", () =>
    expect(isValidDeclaration(26, null)).toBe(false));
});

describe("formatDeclaration", () => {
  it("21 → Mia (21)", () => expect(formatDeclaration(21)).toBe("Mia (21)"));
  it("66 → 66", () => expect(formatDeclaration(66)).toBe("66"));
  it("62 → 62", () => expect(formatDeclaration(62)).toBe("62"));
});
