# MiA! — Design System (v2)

"Color-block arcade." The single source of truth in code is [`theme.ts`](theme.ts).
Every screen does `const C = COLORS;` and `const MONO = FONT.brand;` at the top —
change the brand here and it propagates everywhere. Never hardcode a hex.

---

## Palette

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| **Teal** | `accent` / `primary` / `ok` | `#1DB6BB` | **Primary buttons** (filled), links, active/current-turn ring, focus, "TRUTH", valid calls |
| **Magenta** | `secondary` / `danger` | `#DE1A62` | **Secondary buttons** (outline), Pull It, "LIE", life lost, error states |
| **Amber** | `warn` | `#F59F0C` | Mia, doubles, room codes, the "spark" accent, rewards |
| **Green** | `success` / `truth` | `#2FB35C` | Won, online dot, saved, honest verdict |
| **Red** | `lie` | `#EF4444` | Caught-lying verdict only |
| **Ink** | (base) | `#232222` | Warm near-black the surface ramp is built from |

**Buttons:** primary = filled teal (`accent`/`primary`), text `onAccent #ffffff`.
Secondary = magenta outline (`secondary`), transparent fill.

**Verdict exception:** the challenge reveal uses universal green (`truth`) / red
(`lie`) instead of the brand teal/magenta — the one spot where "correct vs wrong"
convention beats palette purity. Life-loss/pull-it elsewhere stay magenta `danger`.

**Tri-color usage:** every screen carries all three brand colors, not just teal.
The three-word wordmark ("Roll. Bluff. MiA!" / "Roll. Bluff. Win.") is set teal ·
magenta · amber, and step/number accents cycle the same order.

### Surfaces (warm near-blacks)
`bg #1b1a1a` → `surface #211f1f` → `surface2 #282525` → `elevated #302c2c` → `card #211f1f`
Borders: `border #333030`, `borderSoft #2a2828`, `edge #333030`

### Text (warm off-whites)
`fg #f5f2ee` · `fgMuted #a8a3a0` · `fgFaint #726d6a`

### Table felt (cool blue-black — deliberately distinct from the warm chrome)
`felt #171a1f` · `feltA #20242a` · `feltBorder #2b2f33` ·
`feltRing rgba(255,255,255,0.04)` · `rail #15181c` · `railEdge #2b2f33`

### Color-block motif
The signature accent is a 3-segment strip (teal · magenta · amber) — used to cap
headers and hero cards. The three brand colors read as three players at the table.

---

## Type — Poppins

One family, weight carries hierarchy: Light 300, Regular 400, Medium 500,
SemiBold 600, Bold 700 (+ italics). Exposed as `FONT.brand`.

- **Web** loads all weights from the Google Fonts `<link>` in [`app/+html.tsx`](app/+html.tsx); `fontWeight` works normally.
- **Native** loads Poppins via `@expo-google-fonts/poppins` in [`app/_layout.tsx`](app/_layout.tsx) (held behind the splash until ready); the brand family is Poppins Medium.

Labels are typically uppercase with letter-spacing; headings lean SemiBold/Bold with
tight negative tracking.

---

## Conventions

- Inline `style` objects only — no `className`. Colors come from `C` (= `COLORS`), never hardcoded hex.
- One palette, one type scale, defined in `theme.ts`. Don't reintroduce per-file color literals.
- Semantic tokens over raw values: use `C.danger`, not `"#de1a62"`, so future rebrands stay one-file.
- A light theme is defined in the v2 spec (`data-theme="light"`) but not yet wired in the app — dark is the only active theme for now.
