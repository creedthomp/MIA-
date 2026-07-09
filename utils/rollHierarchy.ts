import type { Declaration, RollCategory } from "@/types/game";

export function getCategory(d: Declaration): RollCategory {
  if (d === 21) return "mia";
  if (d % 11 === 0) return "double";
  return "normal";
}

export function getRank(d: Declaration): number {
  const cat = getCategory(d);
  if (cat === "mia") return 1000;
  if (cat === "double") return 100 + Math.floor(d / 11);
  // normal: encode as the declaration value directly; valid range 31-65
  return d;
}

export function beats(challenger: Declaration, incumbent: Declaration): boolean {
  return getRank(challenger) > getRank(incumbent);
}
