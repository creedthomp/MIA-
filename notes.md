# Mia — Notes

---

## Game Rules

### Overview
2–6 players. Each player starts with 5 lives. Players take turns rolling two dice under a cup, peeking privately, and declaring a value. You can lie. Players can challenge the previous roll before taking their turn. Last player with lives wins.

### Reading a Roll
Always read the higher die first. Rolling a 2 and a 6 = **62**, not 26.

### Roll Hierarchy (low to high)
1. Normal rolls (31 through 65), highest number wins
2. Doubles (11, 22, 33, 44, 55, 66) — beat any normal roll; higher doubles beat lower
3. **21 (Mia)** — beats everything, the best roll in the game

### Turn Order
- A random player starts each game
- Play goes in a circle; each player must declare a value **higher** than the previous declaration
- If you can't beat it (or don't want to admit it), you can lie and declare anything higher

### Lying & Bluffing
- You may declare any value — you are not required to be honest
- Common reason to lie: your actual roll is lower than what was declared before you

### Challenging ("Pulling It")
Before picking up the cup on your turn, you may "pull it" — lift the cup to reveal the previous player's actual roll:
- **Previous player was lying** → they lose **1 life**
- **Previous player was telling the truth** → you lose **2 lives**

### Losing a Life & Restarting
- Whenever a life is lost (from failing to beat the score OR a challenge), the score **resets**
- The player after the one who lost a life starts fresh — no minimum to beat

### Elimination
A player at 0 lives is out. Game ends when one player remains.

---

## Tech Stack — Deep Dives

### Expo (SDK 52+)
Expo is a framework built on top of React Native that lets you write one JavaScript/TypeScript codebase and compile it to native iOS, Android, and web apps. It handles the build tooling, native module linking, and over-the-air updates so you don't have to touch Xcode or Android Studio for most things. SDK 52 is the current stable release as of 2025/2026 and includes the New Architecture (JSI) by default, which makes native bridge calls significantly faster.

### Expo Router (v3)
File-based routing for Expo apps — the same mental model as Next.js but for mobile + web. Each file in the `app/` directory becomes a route. Supports nested layouts, dynamic segments (`[roomId].tsx`), and tab navigators. Crucially, it renders the same routes on web (as a SPA) and on mobile (as native stack/tab navigation), so one routing setup covers all platforms.

### Supabase
An open-source Firebase alternative built on PostgreSQL. It bundles several services:
- **Database** — Postgres with a full REST and GraphQL API auto-generated from your schema
- **Auth** — Email/password, OAuth (Google, Apple, etc.), magic links, phone OTP
- **Realtime** — WebSocket-based subscriptions. Two modes relevant here: *Broadcast* (fast ephemeral pub/sub for game events) and *Presence* (tracks who is online in a channel, great for lobbies)
- **Edge Functions** — Serverless Deno functions that run close to the user; used for server-authoritative game logic
- **Row Level Security (RLS)** — Postgres policies that enforce who can read/write which rows, enforced at the database level

For Mia specifically: game rooms are Realtime broadcast channels, player state is Postgres, and challenge resolution (who loses lives) is validated in Edge Functions so clients can't cheat.

### TypeScript
A statically-typed superset of JavaScript. Catches type mismatches at compile time rather than runtime. In a multiplayer game where game state is passed between client, server, and database, TypeScript prevents entire categories of bugs (wrong field name, missing property, wrong value type). Supabase can generate TypeScript types directly from your database schema via CLI, so your DB types and app types stay in sync automatically.

### Styling (inline styles + design tokens)
All screens use React Native's built-in `style` prop with plain JavaScript objects. A `C` constant at the top of each file holds the full design token set (colors, etc.), and a `MONO` constant provides the monospace font string. This approach works identically on iOS, Android, and web with no build-time processing, and avoids the web-compatibility bugs that NativeWind v4 introduced. NativeWind and Tailwind have been removed from the project.

### Zustand
A minimal state management library for React. Unlike Redux, there's no boilerplate — you define a store as a plain object with actions, and components subscribe to only the slices they need. For Mia, Zustand holds transient UI state (current player's view, pending declarations, animation state) while Supabase holds the authoritative game state. The two are kept in sync via Supabase Realtime subscriptions that write into the Zustand store.

---

## Database Schema (Draft)

```sql
-- players / users handled by Supabase Auth (auth.users)

rooms
  id          uuid primary key
  code        text unique          -- short join code e.g. "ABC123"
  status      text                 -- 'lobby' | 'active' | 'finished'
  created_at  timestamptz

room_players
  id          uuid primary key
  room_id     uuid references rooms
  user_id     uuid references auth.users
  lives       int default 5
  turn_order  int
  is_active   bool default true    -- false = eliminated

game_events
  id          uuid primary key
  room_id     uuid references rooms
  user_id     uuid references auth.users
  type        text                 -- 'roll_declared' | 'challenge' | 'life_lost' | 'restart'
  payload     jsonb                -- event-specific data
  created_at  timestamptz
```

Game state during an active round is handled via Supabase Realtime broadcast (ephemeral, not stored). Only significant events (life changes, game over) are persisted to `game_events`.

---

## Folder Guide

| Folder | What lives here |
|--------|-----------------|
| `app/` | Screens — every file is a route (Expo Router: filename = URL) |
| `components/` | Reusable UI pieces shared across multiple screens |
| `services/` | Code that talks to Supabase or manages global state (has side effects) |
| `utils/` | Pure game rule logic — no network calls, no state, fully unit-tested |
| `supabase/` | The backend: SQL migrations and Deno edge functions |
| `types/` | TypeScript type definitions shared across the whole codebase |

**`services/` vs `utils/`** — the key distinction: `services/` files make network calls or mutate state; `utils/` files are pure functions that just take inputs and return outputs. You can call a `utils/` function without a Supabase connection.

---

## Leaderboard & Ranking

**Ranked = Quick Match only.** Private games never affect trophies (prevents collusion/farming).

### Tables (migrations `20240010`–`20240012`)
- `player_stats` — `trophies`, `games_ranked`, `wins`, `streak`, `best_streak`. World-readable to authenticated (the ladder); **no client write policy** — only the finalize edge function (service role) writes.
- `match_results` — per-game placement/delta history (feeds a future "this month" view). Read own only.
- `friendships` — `requester_id`/`addressee_id`/`status` (`pending`|`accepted`). Insert must be `pending`; only the addressee can accept; either party can delete.
- `profiles.friend_code` — short shareable code (generated lazily client-side).
- `rooms.ranked_finalized` — idempotency guard so scoring runs once.

### Scoring (`utils/ranking.ts`, mirrored in `finalize-ranked-match`)
Placement, not win/lose: your delta = (players you outlast − players who outlast you) × `K` (8). Scales with lobby size, so a 6-player win (+40) ≫ a 2-player win (+8). Losses are **softened** (halved) and clamped to your **tier floor** (you can't drop out of a tier). Winner gets a **streak bonus**: +5 per win past the 2nd, capped +25. (MiA!-win bonus is a planned follow-up — needs a game-logic flag.)

### Tiers — the Bluffer's Ladder
Mark → Fibber → Bluffer → Hustler → Shark → Con Artist (floors 0/300/700/1200/1800/2500). The current global **#1 is "the Mia"** (king-of-the-hill) and gets an exclusive 👑 crown emote appended to their in-game picker (`fetchIsMia`).

### Friends
Add by **friend code** (auto-accepts if a mutual request already exists) or **"+ Add" from the ranked game-over screen**. Global + Friends leaderboards share one row component; the Friends board includes you + accepted friends (0-game friends show at 0).

### Security model (why this can't be cheated) — see `20240012`
Trophies are only ever written by the service-role finalize function. It derives the **winner from `room_players.is_active`**, which is authoritative because clients can only update `turn_order` (column-restricted grant) — never `is_active`/`lives`. Finalize requires **exactly one active player** before awarding anything (a host flipping `status` early scores nothing). Placement order comes from `game_events`, but clients can only insert their **own** rows and finalize dedups on the *first* elimination per user, so a player can only ever worsen their own standing. An atomic `ranked_finalized` claim makes it run once even though every client fires it on `GAME_OVER`.
