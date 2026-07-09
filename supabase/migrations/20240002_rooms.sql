create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'lobby' check (status in ('lobby', 'active', 'finished')),
  host_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  lives int not null default 5,
  turn_order int not null default 0,
  is_active boolean not null default true,
  unique (room_id, user_id)
);

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Stores the current roll per room — one row per room_id
-- Only Edge Functions can read/write via service role (no client RLS policies)
create table if not exists public.current_rolls (
  room_id uuid primary key references public.rooms on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  roll jsonb not null,
  created_at timestamptz not null default now()
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_events enable row level security;
alter table public.current_rolls enable row level security;

-- rooms: anyone authenticated can read; only the host can update
create policy "rooms_select_authenticated"
  on public.rooms for select
  to authenticated using (true);

create policy "rooms_insert_own"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "rooms_update_host_only"
  on public.rooms for update
  to authenticated
  using (auth.uid() = host_id);

-- room_players: only members can see rows for their room; can only insert own row
create policy "room_players_select_members"
  on public.room_players for select
  to authenticated
  using (
    room_id in (
      select room_id from public.room_players rp2 where rp2.user_id = auth.uid()
    )
  );

create policy "room_players_insert_own"
  on public.room_players for insert
  to authenticated
  with check (auth.uid() = user_id);

-- NO client update policy on room_players — lives only updated by Edge Functions via service role

-- game_events: room members can read and insert their own events
create policy "game_events_select_members"
  on public.game_events for select
  to authenticated
  using (
    room_id in (
      select room_id from public.room_players rp where rp.user_id = auth.uid()
    )
  );

create policy "game_events_insert_own"
  on public.game_events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- current_rolls: NO client policies — Edge Functions only via service role
-- (deliberately no SELECT or INSERT policy for authenticated role)
