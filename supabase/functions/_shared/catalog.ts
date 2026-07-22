// Server-side source of truth for what's for sale and what it costs.
// The client Shop shows prices for display only — the amount actually
// charged is always read from here, so a tampered client can't change it.

export interface CatalogItem {
  name: string;
  priceCents: number;
  kind: "cup" | "emote";
}

export const CATALOG: Record<string, CatalogItem> = {
  // Cups
  cup_teal:    { name: "Teal Cup",    priceCents: 100, kind: "cup" },
  cup_magenta: { name: "Magenta Cup", priceCents: 100, kind: "cup" },
  cup_amber:   { name: "Amber Cup",   priceCents: 100, kind: "cup" },
  cup_crimson: { name: "Crimson Cup", priceCents: 100, kind: "cup" },
  cup_royal:   { name: "Royal Cup",   priceCents: 100, kind: "cup" },

  // Emotes
  emote_royalty: { name: "Royalty Emote",   priceCents: 100, kind: "emote" },
  emote_fire:    { name: "On Fire Emote",   priceCents: 100, kind: "emote" },
  emote_clown:   { name: "Clown Emote",     priceCents: 100, kind: "emote" },
  emote_dead:    { name: "Dead Emote",      priceCents: 100, kind: "emote" },
  emote_cap:     { name: "Cap Emote",       priceCents: 100, kind: "emote" },
  emote_target:  { name: "Called It Emote", priceCents: 100, kind: "emote" },
};
