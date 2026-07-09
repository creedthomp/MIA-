-- Host can update turn_order on players in their room.
-- Temporary until Phase 6 edge functions take this over.
create policy "room_players_update_host"
  on public.room_players for update
  to authenticated
  using (
    room_id in (
      select id from public.rooms where host_id = auth.uid()
    )
  )
  with check (
    room_id in (
      select id from public.rooms where host_id = auth.uid()
    )
  );
