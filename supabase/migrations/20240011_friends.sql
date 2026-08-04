-- Short shareable code for adding friends (generated lazily by the client).
alter table public.profiles add column if not exists friend_code text unique;

-- Friendships / requests. One row per ordered pair (requester → addressee).
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users on delete cascade,
  addressee_id uuid not null references auth.users on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table public.friendships enable row level security;

-- You can see rows you're part of (either side).
create policy "friendships_select_own"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- You can only create requests as yourself.
create policy "friendships_insert_own"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

-- Only the addressee can accept (update) an incoming request.
create policy "friendships_update_addressee"
  on public.friendships for update
  to authenticated
  using (auth.uid() = addressee_id);

-- Either party can remove the row (decline / cancel / unfriend).
create policy "friendships_delete_either"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
