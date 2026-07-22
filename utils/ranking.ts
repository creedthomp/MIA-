// Ranking tiers + trophy math. Pure functions — the finalize edge function
// mirrors the scoring constants (keep them in sync).

export interface Tier {
  name: string;
  floor: number; // min trophies for this tier
  color: string; // brand-ish accent for the badge
}

// Ascending by floor. A tier's ceiling is the next tier's floor.
export const TIERS: Tier[] = [
  { name: "Bronze",   floor: 0,    color: "#b07a3c" },
  { name: "Silver",   floor: 300,  color: "#9aa3ad" },
  { name: "Gold",     floor: 700,  color: "#f59f0c" },
  { name: "Platinum", floor: 1200, color: "#1db6bb" },
  { name: "Diamond",  floor: 1800, color: "#5b8cff" },
  { name: "Master",   floor: 2500, color: "#de1a62" },
];

export function getTier(trophies: number): Tier {
  let tier = TIERS[0];
  for (const t of TIERS) if (trophies >= t.floor) tier = t;
  return tier;
}

// The floor a player can't drop below (bottom of their current tier).
export function tierFloor(trophies: number): number {
  return getTier(trophies).floor;
}

// ── Scoring (mirrored in supabase/functions/finalize-ranked-match) ──
// Placement points: you gain for everyone you outlast, lose for everyone who
// outlasts you, scaled by K. Losses are softened (halved) for a casual feel.
export const SCORE_K = 8;
export const LOSS_SOFTEN = 0.5;

// rank: 1 = winner … n = last. n = players in the game.
export function placementDelta(rank: number, n: number): number {
  const raw = ((n - rank) - (rank - 1)) * SCORE_K;
  return raw >= 0 ? raw : Math.round(raw * LOSS_SOFTEN);
}

// Win-streak bonus for the winner: +5 per win past the 2nd, capped at +25.
export function streakBonus(newStreak: number): number {
  if (newStreak < 3) return 0;
  return Math.min(25, (newStreak - 2) * 5);
}
