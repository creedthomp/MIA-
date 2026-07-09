import type { Player } from "@/types/game";

export function nextActivePlayer(players: Player[], currentUserId: string): Player {
  const active = players.filter((p) => p.isActive).sort((a, b) => a.turnOrder - b.turnOrder);
  if (active.length === 0) throw new Error("No active players");

  const currentIdx = active.findIndex((p) => p.userId === currentUserId);
  const nextIdx = (currentIdx + 1) % active.length;
  return active[nextIdx];
}

export function isGameOver(players: Player[]): boolean {
  return players.filter((p) => p.isActive).length <= 1;
}

export function getWinner(players: Player[]): Player | null {
  const active = players.filter((p) => p.isActive);
  return active.length === 1 ? active[0] : null;
}
