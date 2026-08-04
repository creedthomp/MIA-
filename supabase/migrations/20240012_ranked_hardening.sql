-- Security hardening for ranked play (see review of the leaderboard branch).

-- Finding 1 (HIGH): `room_players_update_host` + `grant all` let the room host
-- write ANY column on any player row — including `is_active`, which
-- finalize-ranked-match trusts to pick the winner. Since a quick-match creator
-- becomes the host, a host could forge the winner and self-grant trophies.
-- Clients legitimately only need to set `turn_order` (initGameTurn), so scope
-- the column privilege to that. `is_active`/`lives` become service-role-only
-- again (edge functions still write them; service_role keeps its own grants).
revoke update on public.room_players from anon, authenticated;
grant  update (turn_order) on public.room_players to authenticated;

-- Likewise the host only needs to flip `status` (lobby → active in startGame).
-- Column-restrict so a host can't tamper with `ranked_finalized`.
revoke update on public.rooms from anon, authenticated;
grant  update (status) on public.rooms to authenticated;

-- Finding 2 (MEDIUM): the friendships insert policy didn't constrain `status`,
-- so a user could insert a row already 'accepted', adding themselves to another
-- user's friend list without consent. New rows must start 'pending'; they can
-- only reach 'accepted' via the addressee-only UPDATE policy.
drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id and status = 'pending');
