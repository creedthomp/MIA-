# Mia — Build Roadmap

Each phase builds on the last. Don't skip ahead — the game logic in Phase 4 is meaningless without auth and rooms in Phases 2–3.

---

### Phase 1 — Foundation
*Goal: a working skeleton app that runs on iOS, Android, and web*
- Init Expo project with TypeScript strict mode
- Configure NativeWind v4 + Tailwind config
- Set up Supabase project (cloud dashboard + local dev via CLI)
- Wire up `.env.local` and the Supabase client singleton (`lib/supabase.ts`)
- Set up Expo Router with a root layout and placeholder home screen
- Verify the app boots on all three targets (simulator, emulator, browser)

---

### Phase 2 — Auth
*Goal: users can create accounts and sign in*
- Supabase Auth: email/password sign-up and sign-in screens
- Auth guard in `app/_layout.tsx` — redirect unauthenticated users to login
- Display name setup on first login (stored in a `profiles` table)
- Persist session across app restarts (Supabase handles this via AsyncStorage)

---

### Phase 3 — Lobby & Room System
*Goal: players can create and join game rooms and wait for others*
- DB: `rooms` and `room_players` tables with RLS policies
- Create a room — generates a short join code (e.g. "ABC123")
- Join a room by code
- Waiting lobby screen — shows all joined players in real time via Supabase Presence
- Host can start the game once 2+ players are in
- Handle player leaving the lobby

---

### Phase 4 — Core Game Logic
*Goal: all game rules implemented and tested as pure functions*
- Dice roll generation (random 1–6, two dice)
- Roll reading: always higher die first (6+2 = 62)
- Roll hierarchy: normal < doubles < 21 (Mia)
- Roll comparison function: is declaration A higher than declaration B?
- Valid declaration check: new declaration must beat the current one
- Challenge resolution: compare declared vs actual, apply correct life penalty
- Turn order management: circular, skip eliminated players
- Game-over detection: one player remaining

These are pure TypeScript utilities in `utils/` — no Supabase, no UI. Test them in isolation first.

---

### Phase 5 — Game State & Realtime
*Goal: game state syncs live across all connected players*
- `game_events` table for persistent events (life changes, game over)
- Supabase Realtime broadcast channel per room for ephemeral events (declarations, challenges)
- Zustand game store: current declaration, whose turn, lives, phase
- Realtime listeners update the Zustand store on all clients
- Edge Function: challenge resolution runs server-side (clients cannot self-report outcomes)
- Handle player disconnecting mid-game

---

### Phase 6 — Game Screen UI
*Goal: the game is fully playable end-to-end*
- Dice display (static visuals for each face value)
- Cup mechanic: roll hidden, tap to peek privately
- Declare your roll (or lie): input/selector capped to valid higher values
- "Pull it" (challenge) button — visible before picking up the cup
- Lives display for every player
- Turn indicator: who's up now
- Round restart UI when a life is lost
- Game over screen with winner

---

### Phase 7 — Polish
*Goal: the game feels good, not just functional*
- Dice roll animation (shake/tumble effect)
- Life lost animation
- Challenge reveal moment (dramatic cup lift)
- Sound effects (roll, challenge, life lost, win)
- Reconnection handling with a visible "reconnecting..." state
- Eliminated players can spectate the rest of the game

---

### Phase 8 — Testing & QA
*Goal: no embarrassing bugs before real users touch it*
- Multi-device testing on real hardware (local + over internet)
- Edge cases: simultaneous actions, player drops out, host leaves
- RLS policy audit — players should only see/write what they're supposed to
- Challenge resolution stress test (the most cheat-prone part)

---

### Phase 9 — Deployment
*Goal: ship it*
- EAS Build: iOS (TestFlight) + Android (Play Store internal track)
- Web: deploy to Vercel or Netlify
- Supabase: switch to production environment, enable backups
- Set up basic monitoring (Supabase logs + Expo error reporting)
