# Mia — Notes

---

## Game Rules

### Overview
2–10 players. Each player starts with 5 lives. Players take turns rolling two dice under a cup, peeking privately, and declaring a value. You can lie. Players can challenge the previous roll before taking their turn. Last player with lives wins.

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
