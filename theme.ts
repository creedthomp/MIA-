import { Platform } from "react-native";

// ─────────────────────────────────────────────────────────────
// Mia design system — single source of truth for color + type.
// Brand ref: assets/colors-and-fonts.jpg
//
//   Teal   #1DB6BB   primary / links / current turn / truth
//   Pink   #DE1A62   danger / pull-it / lie / life lost
//   Amber  #F59F0C   highlight / Mia / doubles / warnings
//   Ink    #232222   warm near-black base
//
// Every screen does `const C = COLORS;` at the top, so a palette
// change happens here and nowhere else.
// ─────────────────────────────────────────────────────────────

export const COLORS = {
  // Surfaces — warm near-blacks derived from the brand ink (#232222)
  bg:         "#161514",
  surface:    "#1e1c1b",
  surface2:   "#252322",
  elevated:   "#2c2928",
  card:       "#201e1d",
  border:     "#3a3735",
  borderSoft: "#2a2726",
  edge:       "#332f2e",

  // Text — warm off-whites
  fg:         "#f5f1ec",
  fgMuted:    "#a8a29c",
  fgFaint:    "#726c67",

  // Brand accents
  accent:     "#1db6bb", // teal — primary
  onAccent:   "#08211f", // near-black ink for text on teal
  danger:     "#de1a62", // pink
  warn:       "#f59f0c", // amber
  ok:         "#1db6bb", // teal — truth / valid
  success:    "#1db6bb", // teal — online / saved

  // Felt / table (game2)
  felt:       "#181615",
  feltA:      "#252322",
  feltB:      "#141312",
  feltBorder: "#332f2e",
  feltRing:   "rgba(255,255,255,0.04)",
  rail:       "#201e1d",
  railEdge:   "#332f2e",
};

// ─────────────────────────────────────────────────────────────
// Type — brand fontset is "Metallophile Sp8" (Light / Medium).
// Until the .ttf files are added (see assets/fonts/README.md) this
// falls back to a clean system sans. Swap the `default` value to
// "Metallophile Sp8" once the font is loaded in app/_layout.tsx.
// ─────────────────────────────────────────────────────────────

export const FONT = {
  brand: Platform.select({
    web: '"Metallophile Sp8", "Avenir Next", "Segoe UI", system-ui, sans-serif',
    default: "System",
  }) as string,
  // Kept for anything that wants tabular figures; not currently used.
  mono: Platform.OS === "ios" ? "Courier New" : "monospace",
};
