-- Cosmetic ownership (cups, emotes) granted by the Stripe webhook only.
create table if not exists entitlements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  item_id    text not null,
  source     text not null default 'stripe',   -- 'stripe' | 'grant' | 'iap'
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table entitlements enable row level security;

-- Players may read their own entitlements.
create policy "read own entitlements"
  on entitlements for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy on purpose: only the service role
-- (the stripe-webhook edge function) may write ownership. Clients can
-- never self-grant an item.
