import { Platform } from "react-native";

// ─────────────────────────────────────────────────────────────
// MiA! design system v2 — "color-block arcade"
// Single source of truth for color + type. Spec: MiA Design System v2.
//
//   Teal    #1DB6BB   accent — links, active/current turn, focus, truth
//   Magenta #DE1A62   primary CTA + danger — pull it, lie, life lost
//   Amber   #F59F0C   spark — Mia, doubles, rewards
//   Green   #2FB35C   success — won, online
//   Ink     #232222   warm near-black base
//
// Every screen does `const C = COLORS;` at the top, so a palette
// change happens here and nowhere else. Never hardcode a hex.
// ─────────────────────────────────────────────────────────────

export const COLORS = {
  // Surfaces — warm near-blacks
  bg:         "#1b1a1a",
  surface:    "#211f1f",
  surface2:   "#282525",
  elevated:   "#302c2c",
  card:       "#211f1f",
  border:     "#333030",
  borderSoft: "#2a2828",
  edge:       "#333030",

  // Text — warm off-whites
  fg:         "#f5f2ee",
  fgMuted:    "#a8a3a0",
  fgFaint:    "#726d6a",

  // Brand accents
  accent:     "#1db6bb", // teal — links, active, current turn, truth/valid
  onAccent:   "#ffffff", // text on a filled brand button
  danger:     "#de1a62", // magenta — pull it, lie, life lost, errors
  warn:       "#f59f0c", // amber — Mia, doubles, rewards
  ok:         "#1db6bb", // teal — truth / valid call
  success:    "#2fb35c", // green — won, online, saved

  // Felt / table (cool blue-black, distinct from the warm chrome)
  felt:       "#171a1f",
  feltA:      "#20242a",
  feltB:      "#171a1f",
  feltBorder: "#2b2f33",
  feltRing:   "rgba(255,255,255,0.04)",
  rail:       "#15181c",
  railEdge:   "#2b2f33",
};

// ─────────────────────────────────────────────────────────────
// Type — the brand font is Poppins (loaded in app/_layout.tsx via
// @expo-google-fonts/poppins on native, and app/+html.tsx on web).
// Weight is carried by the usual `fontWeight` style prop.
// ─────────────────────────────────────────────────────────────

export const FONT = {
  // Web pulls all weights from the Google Fonts <link> in app/+html.tsx and
  // varies them via `fontWeight`. Native loads Poppins Medium as the single
  // brand family (weight hierarchy on native comes mostly from size).
  brand: Platform.select({
    web: '"Poppins", system-ui, -apple-system, sans-serif',
    default: "Poppins_500Medium",
  }) as string,
  // Kept for anything that wants tabular figures; not currently used.
  mono: Platform.OS === "ios" ? "Courier New" : "monospace",
};
