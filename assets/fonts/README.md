# Fonts — Metallophile Sp8

The brand fontset is **Metallophile Sp8** (Light, Light Italic, Medium, Medium Italic).
It is a licensed font, so the `.ttf`/`.otf` files are **not** committed here.

Until the files are added, `FONT.brand` in [`theme.ts`](../../theme.ts) falls back to a
clean system sans, so the app looks correct but not yet on-brand.

## To enable the real font

1. Drop the font files in this folder, e.g.:
   ```
   assets/fonts/MetallophileSp8-Light.ttf
   assets/fonts/MetallophileSp8-Medium.ttf
   ```
2. Load them at startup in [`app/_layout.tsx`](../../app/_layout.tsx):
   ```ts
   import { useFonts } from "expo-font";

   const [fontsLoaded] = useFonts({
     "Metallophile Sp8":        require("@/assets/fonts/MetallophileSp8-Medium.ttf"),
     "Metallophile Sp8 Light":  require("@/assets/fonts/MetallophileSp8-Light.ttf"),
   });
   if (!fontsLoaded) return null; // or a splash
   ```
   (`expo-font` is already a dependency.)
3. In [`theme.ts`](../../theme.ts), change the native fallback in `FONT.brand`
   from `"System"` to `"Metallophile Sp8"`. The web stack already lists it first.

That's the whole switch — every screen reads `FONT.brand`, so nothing else changes.
