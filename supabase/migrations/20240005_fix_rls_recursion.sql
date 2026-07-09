-- The room_players SELECT policy was self-referential (querying room_players from within
-- room_players RLS), causing infinite recursion → 500. A security definer function
-- bypasses RLS for the membership check, breaking the cycle.

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.room_players
    where room_id = p_room_id
      and user_id = auth.uid()
  );
$$;

-- Recreate the policy using the helper
drop policy if exists "room_players_select_members" on public.room_players;
create policy "room_players_select_members"
  on public.room_players for select
  to authenticated
  using (public.is_room_member(room_id));

-- game_events policy also queries room_players — same fix
drop policy if exists "game_events_select_members" on public.game_events;
create policy "game_events_select_members"
  on public.game_events for select
  to authenticated
  using (public.is_room_member(room_id));
