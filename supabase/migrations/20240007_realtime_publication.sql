-- Tables must be added to the supabase_realtime publication for
-- Postgres Changes subscriptions to receive events.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.game_events;
