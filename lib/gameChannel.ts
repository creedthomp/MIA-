import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { RealtimeEvent } from "@/types/realtimeEvents";

let activeChannel: RealtimeChannel | null = null;

// Grace-period timers keyed by userId — cleared on rejoin or channel teardown
const leaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

interface PresenceOptions {
  myUserId: string;
  isHost: boolean;
  onPlayerLeft: (userId: string) => void;
}

export function subscribeToGame(
  roomId: string,
  onEvent: (event: RealtimeEvent) => void,
  onStatusChange?: (connected: boolean) => void,
  presenceOptions?: PresenceOptions,
): Promise<void> {
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
    activeChannel = null;
  }

  // Clear any lingering grace timers from a previous session
  for (const t of Object.values(leaveTimers)) clearTimeout(t);
  for (const k of Object.keys(leaveTimers)) delete leaveTimers[k];

  return new Promise((resolve) => {
    let channel = supabase
      .channel(`game:${roomId}`, {
        config: { broadcast: { self: true } },
      })
      .on("broadcast", { event: "*" }, ({ event, payload }) => {
        onEvent({ type: event, payload } as RealtimeEvent);
      });

    // All clients track presence so the host can detect leaves.
    // Only the host listens and acts on leave events.
    if (presenceOptions?.isHost) {
      channel = channel
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          for (const p of leftPresences as Array<{ userId?: string }>) {
            const userId = p.userId;
            if (!userId || userId === presenceOptions.myUserId) continue;
            if (leaveTimers[userId]) continue; // grace period already running
            leaveTimers[userId] = setTimeout(() => {
              delete leaveTimers[userId];
              presenceOptions.onPlayerLeft(userId);
            }, 10_000);
          }
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          // Player rejoined within grace period — cancel elimination
          for (const p of newPresences as Array<{ userId?: string }>) {
            if (p.userId && leaveTimers[p.userId]) {
              clearTimeout(leaveTimers[p.userId]);
              delete leaveTimers[p.userId];
            }
          }
        });
    }

    activeChannel = channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        onStatusChange?.(true);
        // Track own presence after subscription is confirmed
        if (presenceOptions) {
          await activeChannel?.track({ userId: presenceOptions.myUserId });
        }
        resolve();
      } else if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        onStatusChange?.(false);
      }
    });
  });
}

export async function broadcastGameEvent(event: RealtimeEvent): Promise<void> {
  if (!activeChannel) return;
  await activeChannel.send({
    type: "broadcast",
    event: event.type,
    payload: event.payload,
  });
}

export function unsubscribeFromGame(): void {
  for (const t of Object.values(leaveTimers)) clearTimeout(t);
  for (const k of Object.keys(leaveTimers)) delete leaveTimers[k];
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
    activeChannel = null;
  }
}
