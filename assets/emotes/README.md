# Emote art

Two mascots — **Ace** (female) and **Deuce** (male), the MiA! card-sharp raccoons —
in 21 expressions each. 512×512 transparent PNGs, `<voice>/<id>.png`. A player's
emotes use the mascot matching their assigned voice.

The art is **generated from code**, not hand-drawn files:

```bash
node scripts/emote-art/generate.mjs           # all 42 PNGs + contact sheets
node scripts/emote-art/generate.mjs laugh cry # just these ids, both characters
node scripts/emote-art/generate.mjs --sheet   # contact sheets only
```

- Character design + parts: [`scripts/emote-art/mascot.mjs`](../../scripts/emote-art/mascot.mjs)
- Per-emote expression recipes: `EMOTE_SPECS` in the same file — change a brow,
  mouth, or gesture there and re-run
- Registered for Metro in [`utils/emoteArt.ts`](../../utils/emoteArt.ts)
- Review at real size: `docs/art-ref/emotes-<voice>-64px.png` (in-game size) and
  `-128px.png`

To replace this with painted/AI art later, follow
[docs/emote-art-brief.md](../../docs/emote-art-brief.md) and ingest with
`VOICE=male scripts/emote-art.sh --batch raw/` — the registry and app code don't change.

Ids (21): `objection` `boo` `cheer` `cry` `think` `trust` `erm` `noway` `pain` `laugh`
`sweat` `idle` `scream` `attack` `watching` `clown` `mia` `gg` `salty` `slow` `crown`
