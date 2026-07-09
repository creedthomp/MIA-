import { supabase } from "@/lib/supabase";
import { broadcastGameEvent } from "@/lib/gameChannel";
import type { Player } from "@/types/game";

export async function initGameTurn(roomId: string, players: Player[]): Promise<void> {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const playerOrder = shuffled.map((p) => p.userId);

  // Update turn_order in DB so it persists across reconnects
  for (let i = 0; i < shuffled.length; i++) {
    await supabase
      .from("room_players")
      .update({ turn_order: i })
      .eq("room_id", roomId)
      .eq("user_id", shuffled[i].userId);
  }

  await broadcastGameEvent({
    type: "ROUND_STARTED",
    payload: { currentTurnUserId: playerOrder[0], playerOrder },
  });
}
