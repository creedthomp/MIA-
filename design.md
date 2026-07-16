# Mia — Design System

The single source of truth in code is [`theme.ts`](theme.ts). Every screen does
`const C = COLORS;` and `const MONO = FONT.brand;` at the top — change the brand here
and it propagates everywhere. Reference art: [`assets/colors-and-fonts.jpg`](assets/colors-and-fonts.jpg).

---

## Palette

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| **Teal** | `accent` / `ok` / `success` | `#1DB6BB` | Primary buttons, links, current-turn ring, "TRUTH", valid calls, online dot |
| **Pink** | `danger` | `#DE1A62` | Pull It, "LIE", life lost, below-floor warnings |
| **Amber** | `warn` | `#F59F0C` | Mia, doubles, highlights, "did you mean…" hints |
| **Ink** | (base) | `#232222` | Warm near-black the surface ramp is built from |

### Surfaces (warm near-blacks)
`bg #161514` → `surface #1e1c1b` → `surface2 #252322` → `elevated #2c2928` → `card #201e1d`
Borders: `border #3a3735`, `borderSoft #2a2726`, `edge #332f2e`

### Text (warm off-whites)
`fg #f5f1ec` · `fgMuted #a8a29c` · `fgFaint #726c67`
Text on teal buttons uses `onAccent #08211f` (dark ink, for contrast on the light teal).

### Table felt (game screen)
`felt #181615` · `feltA #252322` · `feltB #141312` · `feltBorder #332f2e` ·
`feltRing rgba(255,255,255,0.04)` · `rail #201e1d` · `railEdge #332f2e`

---

## Type

**Fontset: Metallophile Sp8** — Light, Light Italic, Medium, Medium Italic.

Exposed as `FONT.brand` in `theme.ts`. Labels are typically uppercase with letter-spacing;
weight carries hierarchy (Light for body, Medium for emphasis/headings).

> **Status:** the licensed `.ttf` files aren't committed yet, so `FONT.brand` currently
> falls back to a system sans. To activate the real font, follow
> [`assets/fonts/README.md`](assets/fonts/README.md) — it's a two-line change once the
> files are dropped in.

---

## Conventions

- Inline `style` objects only — no `className`. Colors come from `C` (= `COLORS`), never hardcoded hex.
- One palette, one type scale, defined in `theme.ts`. Don't reintroduce per-file color literals.
- Semantic tokens over raw values: use `C.danger`, not `"#de1a62"`, so future rebrands stay one-file.
