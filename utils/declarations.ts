import type { Declaration } from "@/types/game";
import { getRank } from "./rollHierarchy";

// All valid declarations in ascending rank order
export const ALL_DECLARATIONS: Declaration[] = [
  31, 32, 41, 42, 43, 51, 52, 53, 54, 61, 62, 63, 64, 65, 11, 22, 33, 44, 55,
  66, 21,
];

export function validDeclarationsAbove(
  current: Declaration | null,
): Declaration[] {
  return ALL_DECLARATIONS;
}

export function isValidDeclaration(
  d: Declaration,
  current: Declaration | null,
): boolean {
  return validDeclarationsAbove(current).includes(d);
}

export function formatDeclaration(d: Declaration): string {
  if (d === 21) return "Mia (21)";
  return String(d);
}
