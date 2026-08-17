// Renders the emote art: 21 expressions x 2 characters -> 512x512 transparent PNGs.
//
//   node scripts/emote-art/generate.mjs            # all of them
//   node scripts/emote-art/generate.mjs laugh cry  # just these ids
//   node scripts/emote-art/generate.mjs --sheet    # 64px + 128px contact sheets
//
// Output: assets/emotes/<female|male>/<id>.png
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { buildSvg, EMOTE_SPECS, EMOTE_IDS, GENDERS, SIZE } from "./mascot.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "assets/emotes");
const REF = path.join(ROOT, "docs/art-ref");

async function renderOne(id, gender) {
  const spec = EMOTE_SPECS[id];
  if (!spec) throw new Error(`unknown emote id: ${id}`);
  const svg = buildSvg(spec, gender);
  const dir = path.join(OUT, gender);
  await mkdir(dir, { recursive: true });
  await sharp(Buffer.from(svg))
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, `${id}.png`));
}

/** Contact sheet at a given px size — the readability check. */
async function sheet(px, cols = 7) {
  await mkdir(REF, { recursive: true });
  for (const gender of GENDERS) {
    const cell = px + 16;
    const files = EMOTE_IDS.map((id) => path.join(OUT, gender, `${id}.png`)).filter(existsSync);
    if (!files.length) continue;
    const rows = Math.ceil(files.length / cols);
    const tiles = await Promise.all(
      files.map(async (file, i) => ({
        input: await sharp(file).resize(px, px).png().toBuffer(),
        left: (i % cols) * cell + 8,
        top: Math.floor(i / cols) * cell + 8,
      })),
    );
    const out = path.join(REF, `emotes-${gender}-${px}px.png`);
    await sharp({
      create: {
        width: cols * cell,
        height: rows * cell,
        channels: 4,
        background: { r: 27, g: 26, b: 26, alpha: 1 }, // app surface #1b1a1a
      },
    })
      .composite(tiles)
      .png()
      .toFile(out);
    console.log(`sheet: docs/art-ref/${path.basename(out)}`);
  }
}

const args = process.argv.slice(2);
const sheetOnly = args.includes("--sheet");
const ids = args.filter((a) => !a.startsWith("--"));
const targets = ids.length ? ids : EMOTE_IDS;

if (!sheetOnly) {
  for (const gender of GENDERS) {
    for (const id of targets) await renderOne(id, gender);
  }
  console.log(`rendered ${targets.length * GENDERS.length} PNGs into assets/emotes/`);
}
await sheet(64);
await sheet(128);
