import { describe, it, expect } from "bun:test";
import { getCategory, getRank, beats } from "../rollHierarchy";

describe("getCategory", () => {
  it("21 is mia", () => expect(getCategory(21)).toBe("mia"));
  it("11 is double", () => expect(getCategory(11)).toBe("double"));
  it("66 is double", () => expect(getCategory(66)).toBe("double"));
  it("62 is normal", () => expect(getCategory(62)).toBe("normal"));
  it("31 is normal", () => expect(getCategory(31)).toBe("normal"));
});

describe("getRank ordering", () => {
  it("31 < 65", () => expect(getRank(31)).toBeLessThan(getRank(65)));
  it("65 < 11 (double)", () => expect(getRank(65)).toBeLessThan(getRank(11)));
  it("11 < 66", () => expect(getRank(11)).toBeLessThan(getRank(66)));
  it("66 < 21 (mia)", () => expect(getRank(66)).toBeLessThan(getRank(21)));
  it("doubles rank by face: 11 < 22 < ... < 66", () => {
    expect(getRank(11)).toBeLessThan(getRank(22));
    expect(getRank(22)).toBeLessThan(getRank(33));
    expect(getRank(55)).toBeLessThan(getRank(66));
  });
});

describe("beats", () => {
  it("62 beats 31", () => expect(beats(62, 31)).toBe(true));
  it("21 beats 66", () => expect(beats(21, 66)).toBe(true));
  it("31 does not beat 62", () => expect(beats(31, 62)).toBe(false));
  it("31 does not beat 31", () => expect(beats(31, 31)).toBe(false));
});
