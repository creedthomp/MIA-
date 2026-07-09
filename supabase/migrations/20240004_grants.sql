-- Grant table-level privileges to Supabase roles.
-- Without these, RLS policies never even run — PostgREST returns 403 immediately.
grant usage on schema public to anon, authenticated, service_role;

grant all on public.profiles      to anon, authenticated, service_role;
grant all on public.rooms         to anon, authenticated, service_role;
grant all on public.room_players  to anon, authenticated, service_role;
grant all on public.game_events   to anon, authenticated, service_role;
grant all on public.current_rolls to anon, authenticated, service_role;

-- Ensure future tables in this schema inherit the same privileges
alter default privileges in schema public
  grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
