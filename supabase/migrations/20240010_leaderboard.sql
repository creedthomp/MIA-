-- ── Lobby size 2–6 ───────────────────────────────────────────────
alter table public.rooms alter column max_players set default 6;
update public.rooms set max_players = 6 where max_players > 6 and status = 'lobby';

-- Idempotency guard so ranked scoring runs exactly once per room
alter table public.rooms add column if not exists ranked_finalized boolean not null default false;

-- ── Player ranking stats (the global ladder) ─────────────────────
create table if not exists public.player_stats (
  user_id      uuid primary key references auth.users on delete cascade,
  trophies     int not null default 0,
  games_ranked int not null default 0,
  wins         int not null default 0,
  streak       int not null default 0,   -- current win streak
  best_streak  int not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.player_stats enable row level security;

-- Anyone signed in can read the ladder (needed for the leaderboard).
create policy "player_stats_select_all"
  on public.player_stats for select
  to authenticated using (true);
-- No client write policy: only the finalize edge function (service role) writes.

-- ── Per-match results (history; feeds a future "this month" view) ─
create table if not exists public.match_results (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms on delete cascade,
  user_id       uuid not null references auth.users on delete cascade,
  placement     int not null,   -- 1 = winner
  players_count int not null,
  trophies_delta int not null,
  created_at    timestamptz not null default now(),
  unique (room_id, user_id)
);

alter table public.match_results enable row level security;

-- Players can read their own match history.
create policy "match_results_select_own"
  on public.match_results for select
  to authenticated using (auth.uid() = user_id);
-- No client write policy: only the finalize edge function writes.
