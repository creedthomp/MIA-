alter table public.rooms
  add column if not exists type text not null default 'private'
    check (type in ('private', 'quickmatch')),
  add column if not exists max_players int not null default 8;

-- Any member of a quickmatch room can update its status (used for auto-start)
create policy "rooms_update_quickmatch_members"
  on public.rooms for update
  to authenticated
  using (
    type = 'quickmatch'
    and id in (
      select room_id from public.room_players where user_id = auth.uid()
    )
  );
