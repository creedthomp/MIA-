import type { Player } from "@/types/game";

export function applyLifeLoss(players: Player[], userId: string, livesLost: number): Player[] {
  return players.map((p) => {
    if (p.userId !== userId) return p;
    const newLives = Math.max(0, p.lives - livesLost);
    return { ...p, lives: newLives, isActive: newLives > 0 };
  });
}
