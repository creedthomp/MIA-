# Mia: a dice game

A real-time multiplayer dice game (web + mobile) for 2–8 players. Players roll dice secretly, declare results — truthfully or lying — and can challenge the previous player's claim. See notes.md for full rules and tech deep-dives.

---

## Tech Stack

- **Expo** (SDK 52+) — React Native cross-platform framework targeting iOS, Android, and web from one codebase
- **Expo Router** (v3) — File-based navigation across all platforms
- **Supabase** — Backend: PostgreSQL database, auth, realtime multiplayer channels, edge functions
- **TypeScript** — End-to-end type safety, strict mode
- **Zustand** — Lightweight client-side state management

---

## Project Structure

```
mia/
├── app/                    # Expo Router screens (file = route)
│   ├── (tabs)/
│   │   ├── index.tsx       # Landing page (logged-out)
│   │   └── play.tsx        # Hub / home (logged-in)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── lobby/
│   │   └── [roomId].tsx    # Pre-game waiting room
│   ├── game/
│   │   └── [roomId].tsx    # Active game room
│   └── _layout.tsx         # Root layout + auth guard
├── components/             # Reusable UI components
├── services/
│   ├── supabase.ts         # Supabase client singleton
│   ├── store.ts            # Zustand global store
│   ├── roomService.ts      # Room create/join logic
│   ├── gameChannel.ts      # Realtime channel helpers
│   └── authService.ts      # Profile fetch
├── types/                  # Shared TypeScript types
├── utils/                  # Game logic (dice scoring, validation) — pure functions, no network
├── assets/                 # Images, fonts, sounds
├── supabase/
│   ├── migrations/         # SQL schema migrations
│   └── functions/          # Deno edge functions (server-side game logic)
└── app.json                # Expo config
```

---

## Development Setup

### Prerequisites

- Node.js 20+ (managed via nvm)
- Bun — installed at `~/.bun/bin/bun`
- Supabase CLI — installed at `~/.local/share/supabase/supabase` (requires both `supabase` + `supabase-go` in same dir)
- Colima + Lima — installed at `~/.local/bin/colima` and `~/.local/bin/limactl` (Docker Desktop replacement)
- Lima guest agent — `~/.local/share/lima/lima-guestagent.Linux-aarch64.gz` (required for Colima VM)
- iOS Simulator (Xcode) or Android Emulator, or the Expo Go app on a physical device

> **PATH note:** `export PATH="$HOME/.local/share/supabase:$HOME/.local/bin:$HOME/.bun/bin:$PATH"`

### Install

```bash
bun install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Common Commands

```bash
# Expo
bun start            # Start Expo dev server
bun run ios          # Run on iOS simulator
bun run android      # Run on Android emulator
bun run web          # Run in browser

# Colima (Docker replacement — must be running before supabase start)
colima start         # Start the Docker VM (run once per machine restart)
colima stop          # Stop the Docker VM
colima status        # Check if Colima is running

# Supabase local dev (requires Colima running)
# Always set DOCKER_HOST and PATH first:
# export PATH="$HOME/.local/share/supabase:$HOME/.local/bin:$HOME/.bun/bin:$PATH"
# export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"

DOCKER_HOST="unix://$HOME/.colima/default/docker.sock" supabase start     # Start local stack
DOCKER_HOST="unix://$HOME/.colima/default/docker.sock" supabase stop      # Stop local stack
DOCKER_HOST="unix://$HOME/.colima/default/docker.sock" supabase status    # Show local URLs
supabase db push     # Push migrations to remote (cloud)
DOCKER_HOST="unix://$HOME/.colima/default/docker.sock" SUPABASE_ACCESS_TOKEN=local supabase gen types typescript --local > types/supabase.ts
```

---

## Architecture

- **Client** — Expo app subscribes to Supabase Realtime channels for live game state. Local UI state lives in Zustand; authoritative game state lives in Supabase.
- **Realtime** — Each game room has a Supabase broadcast channel. Game events (roll declarations, challenges, life changes) are broadcast; persistent state written to Postgres.
- **Auth** — Supabase Auth handles sessions. Row Level Security (RLS) policies enforce data access on all tables.
- **Game logic** — Core rules (dice hierarchy, challenge resolution, life deduction) run in Edge Functions to prevent client-side cheating.

---

## Code Style & Conventions

- TypeScript strict mode — no `any`
- Inline `style` objects with a `C` design token constant at the top of each file — no `className` props
- `const MONO = Platform.OS === "ios" ? "Courier New" : "monospace"` for monospace font
- One component per file, named exports
- Zustand slices per domain: `game`, `auth`, `ui`
- Supabase types generated via CLI and committed — never manually maintained

---

## Compact Instructions

Full game rules, database schema notes, and tech stack deep-dives live in notes.md.

---

## Agent Instructions

- Proceed with your best judgment; only ask when genuinely blocked on a decision that cannot be inferred
- Keep reports and summaries concise — bullet points over paragraphs
- Cite sources when doing research
- Prefer up-to-date technology and modern patterns
- Clear, clean, concise code organized per industry standards
- Do not add features, abstractions, or error handling beyond what is asked
- Use subagents when needed
