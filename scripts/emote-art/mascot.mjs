// Emote mascot art — Deuce (male) and Ace (female), the MiA! card-sharp raccoons.
//
// Every emote is one SVG built from parameterized parts: eyes, brows, mouth,
// gesture, props. Bust framing on a 512 canvas, bold keyline, flat fills with a
// soft shade pass and an upper-left rim light. Designed to read at 64px.
//
// Rendered to PNG by generate.mjs. Art direction: docs/emote-art-brief.md.

export const SIZE = 512;

// ── Palette ───────────────────────────────────────────────────────────────
// Brand: teal #1DB6BB, magenta #DE1A62, amber #F59F0C, ink #232222, cream #F7F3EC
const P = {
  line: "#2B1B22", // keyline — warm plum-brown, never pure black
  fur: "#8A8280",
  furDark: "#6E6664",
  mask: "#232222",
  cream: "#F7F3EC",
  creamShade: "#DCD5CB",
  teal: "#1DB6BB",
  tealDark: "#14898D",
  magenta: "#DE1A62",
  magentaDark: "#A81049",
  amber: "#F59F0C",
  amberDark: "#C87D00",
  white: "#FFFFFF",
  tongue: "#E4557B",
  tear: "#5FC8F5",
  sweat: "#7FD4F7",
};

const LW = 9; // keyline width

/** Per-character design. The pair swap visor/waistcoat accents. */
const CHARACTERS = {
  male: {
    name: "Deuce",
    visor: P.teal,
    visorDark: P.tealDark,
    vest: P.magenta,
    vestDark: P.magentaDark,
    visorTilt: -7, // worn crooked
    earTuft: false,
    lashes: false,
    earring: false,
    muzzleW: 168,
    browW: 15,
    goldTooth: false,
  },
  female: {
    name: "Ace",
    visor: P.magenta,
    visorDark: P.magentaDark,
    vest: P.teal,
    vestDark: P.tealDark,
    visorTilt: 5,
    earTuft: true,
    lashes: true,
    earring: true,
    muzzleW: 150,
    browW: 12,
    goldTooth: false,
  },
};

// ── Geometry anchors ──────────────────────────────────────────────────────
const HEAD = { cx: 256, top: 96, chin: 424, halfW: 150 };
const EYE = { lx: 202, rx: 310, y: 250, r: 33 };
const BROW_Y = 196;
const MUZZLE = { cx: 256, cy: 318, h: 104 };
const MOUTH_Y = 344;

const stroke = (w = LW) =>
  `stroke="${P.line}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

// ── Head, ears, body ──────────────────────────────────────────────────────
function ears(c) {
  const tuft = c.earTuft;
  const ear = (side) => {
    const s = side === "l" ? -1 : 1;
    const bx = HEAD.cx + s * 104;
    // Outer tip is pulled up and out; tufted ears are taller and pointier.
    const tipX = bx + s * (tuft ? 46 : 40);
    const tipY = tuft ? 44 : 74;
    return `
      <path d="M ${bx - s * 44} 150 C ${bx - s * 40} ${tuft ? 92 : 104} ${tipX - s * 18} ${tipY + 22} ${tipX} ${tipY}
               C ${tipX + s * 12} ${tipY + 40} ${bx + s * 52} 150 ${bx + s * 40} 172 Z"
            fill="${P.fur}" ${stroke()} />
      <path d="M ${bx - s * 26} 152 C ${bx - s * 22} ${tuft ? 112 : 120} ${tipX - s * 22} ${tipY + 42} ${tipX - s * 8} ${tipY + 30}
               C ${tipX + s * 2} ${tipY + 52} ${bx + s * 34} 150 ${bx + s * 26} 164 Z"
            fill="${P.mask}" opacity="0.85" />`;
  };
  return ear("l") + ear("r");
}

function headShape() {
  const { cx, top, chin, halfW } = HEAD;
  // Wide brow, full cheeks, tapered chin — the caricature read.
  return `M ${cx} ${top}
          C ${cx + 92} ${top} ${cx + halfW} ${top + 62} ${cx + halfW} ${top + 132}
          C ${cx + halfW} ${top + 206} ${cx + 104} ${chin - 18} ${cx} ${chin}
          C ${cx - 104} ${chin - 18} ${cx - halfW} ${top + 206} ${cx - halfW} ${top + 132}
          C ${cx - halfW} ${top + 62} ${cx - 92} ${top} ${cx} ${top} Z`;
}

function body(c) {
  return `
    <g>
      <path d="M 116 512 C 120 460 168 436 208 428 L 304 428 C 344 436 392 460 396 512 Z"
            fill="${c.vest}" ${stroke()} />
      <path d="M 208 428 L 256 486 L 304 428" fill="${P.cream}" ${stroke()} />
      <circle cx="256" cy="500" r="11" fill="${P.amber}" ${stroke(6)} />
      <path d="M 196 434 C 176 462 172 490 174 512" fill="none" ${stroke(7)} />
      <path d="M 316 434 C 336 462 340 490 338 512" fill="none" ${stroke(7)} />
    </g>`;
}

function visor(c) {
  return `
    <g transform="translate(0 -26) rotate(${c.visorTilt} 256 168)">
      <path d="M 118 172 C 118 132 176 112 256 112 C 336 112 394 132 394 172 Z"
            fill="${c.visor}" ${stroke()} />
      <path d="M 104 176 C 140 196 190 206 256 206 C 322 206 372 196 408 176
               C 408 196 396 214 256 216 C 116 214 104 196 104 176 Z"
            fill="${c.visorDark}" ${stroke()} />
      <path d="M 150 140 C 186 126 226 122 256 122" fill="none"
            stroke="${P.white}" stroke-width="8" stroke-linecap="round" opacity="0.45" />
    </g>`;
}

// ── Eyes ──────────────────────────────────────────────────────────────────
function eyes(c, spec) {
  const { mode = "open", look = [0, 0], squintSide = "r" } = spec.eyes ?? {};
  const one = (side) => {
    const x = side === "l" ? EYE.lx : EYE.rx;
    const y = EYE.y;
    const r = EYE.r;
    const lashes =
      c.lashes && mode !== "shut" && mode !== "x"
        ? `<path d="M ${x - r} ${y - r * 0.75} l -13 -9 M ${x - r * 0.55} ${y - r * 1.08} l -7 -14"
                 fill="none" stroke="${P.cream}" stroke-width="8" stroke-linecap="round" />`
        : "";

    if (mode === "shut" || (mode === "oneSquint" && side === squintSide)) {
      return `<path d="M ${x - r} ${y + 4} Q ${x} ${y - 16} ${x + r} ${y + 4}"
                    fill="none" ${stroke(10)} />${lashes}`;
    }
    if (mode === "happyShut") {
      return `<path d="M ${x - r} ${y + 8} Q ${x} ${y - 22} ${x + r} ${y + 8}"
                    fill="none" ${stroke(11)} />
              <path d="M ${x - r - 6} ${y + 22} l -12 10 M ${x + r + 6} ${y + 22} l 12 10"
                    fill="none" ${stroke(6)} />${lashes}`;
    }
    if (mode === "bored") {
      return `<path d="M ${x - r} ${y} L ${x + r} ${y}" fill="none" ${stroke(10)} />
              <path d="M ${x - r} ${y} Q ${x} ${y + 20} ${x + r} ${y}" fill="${P.white}" ${stroke(7)} />
              <circle cx="${x}" cy="${y + 8}" r="8" fill="${P.line}" />${lashes}`;
    }
    if (mode === "x") {
      return `<path d="M ${x - 22} ${y - 22} L ${x + 22} ${y + 22} M ${x + 22} ${y - 22} L ${x - 22} ${y + 22}"
                    fill="none" ${stroke(11)} />`;
    }

    // Open family — size and pupil scale carry the emotion.
    const rw = mode === "wide" ? r * 1.24 : mode === "squint" ? r : r;
    const rh =
      mode === "wide" ? r * 1.3 : mode === "squint" ? r * 0.4 : mode === "halfLid" ? r * 0.66 : r;
    const pr = mode === "wide" ? 19 : mode === "tiny" ? 8 : 15;
    const px = x + look[0];
    const py = y + look[1] * (rh / r);
    const lid =
      mode === "halfLid"
        ? `<path d="M ${x - rw} ${y - rh * 0.5} Q ${x} ${y - rh * 1.9} ${x + rw} ${y - rh * 0.5}"
                 fill="${P.mask}" />`
        : "";
    return `
      <ellipse cx="${x}" cy="${y}" rx="${rw}" ry="${rh}" fill="${P.white}" ${stroke()} />
      ${lid}
      <circle cx="${px}" cy="${py}" r="${pr}" fill="${P.line}" />
      <circle cx="${px - pr * 0.36}" cy="${py - pr * 0.4}" r="${pr * 0.34}" fill="${P.white}" />
      ${lashes}`;
  };
  return one("l") + one("r");
}

// ── Brows ─────────────────────────────────────────────────────────────────
function brows(c, spec) {
  const { brow = "neutral" } = spec;
  // [inner dy, outer dy] per side — positive is lower (angrier).
  const shapes = {
    neutral: [0, 0, 0, 0],
    angry: [26, -10, 26, -10],
    veryAngry: [34, -14, 34, -14],
    sad: [-18, 20, -18, 20],
    raised: [-22, -18, -22, -18],
    oneUp: [-26, -22, 18, -4],
    flat: [6, 6, 6, 6],
    worried: [-14, 14, 6, -2],
  };
  const [li, lo, ri, ro] = shapes[brow] ?? shapes.neutral;
  const one = (side, inner, outer) => {
    const s = side === "l" ? -1 : 1;
    const x = side === "l" ? EYE.lx : EYE.rx;
    const ix = x + s * 30; // inner end (toward the nose)
    const ox = x - s * 32;
    return `<path d="M ${ix} ${BROW_Y + inner} Q ${x} ${BROW_Y + (inner + outer) / 2 - 14} ${ox} ${BROW_Y + outer}"
                  fill="none" stroke="${P.cream}" stroke-width="${c.browW + 8}" stroke-linecap="round" />`;
  };
  return one("l", li, lo) + one("r", ri, ro);
}

// ── Mask + muzzle ─────────────────────────────────────────────────────────
function maskBand() {
  return `
    <path d="M 112 214 C 150 196 200 190 256 214 C 312 190 362 196 400 214
             C 402 268 372 300 316 300 C 282 300 266 284 256 268
             C 246 284 230 300 196 300 C 140 300 110 268 112 214 Z"
          fill="${P.mask}" ${stroke()} />`;
}

// Cream patches above the mask — they exist so the dark brows have something to
// read against. Without them the brows vanish into the mask at small sizes.
function browPatches() {
  const patch = (x0, x1) => `
    <path d="M ${x0} ${BROW_Y + 22} C ${x0 + 6} ${BROW_Y - 34} ${x1 - 6} ${BROW_Y - 34} ${x1} ${BROW_Y + 22}
             C ${x1 - 10} ${BROW_Y + 34} ${x0 + 10} ${BROW_Y + 34} ${x0} ${BROW_Y + 22} Z"
          fill="${P.cream}" />`;
  return patch(148, 250) + patch(262, 364);
}

function muzzle(c) {
  const w = c.muzzleW;
  return `
    <path d="M ${MUZZLE.cx} ${MUZZLE.cy - MUZZLE.h / 2}
             C ${MUZZLE.cx + w / 2} ${MUZZLE.cy - MUZZLE.h / 2} ${MUZZLE.cx + w / 2} ${MUZZLE.cy + MUZZLE.h / 2} ${MUZZLE.cx} ${MUZZLE.cy + MUZZLE.h / 2 + 8}
             C ${MUZZLE.cx - w / 2} ${MUZZLE.cy + MUZZLE.h / 2} ${MUZZLE.cx - w / 2} ${MUZZLE.cy - MUZZLE.h / 2} ${MUZZLE.cx} ${MUZZLE.cy - MUZZLE.h / 2} Z"
          fill="${P.cream}" ${stroke()} />
    <path d="M 232 288 C 240 278 272 278 280 288 C 274 302 238 302 232 288 Z"
          fill="${P.line}" />`;
}

// ── Mouths ────────────────────────────────────────────────────────────────
function mouth(c, spec) {
  const { mouth: m = "grin", tongue = false } = spec;
  const y = MOUTH_Y;
  const gold = (x, yy) =>
    c.goldTooth
      ? `<rect x="${x}" y="${yy}" width="16" height="18" rx="4" fill="${P.amber}" ${stroke(5)} />`
      : "";
  const tongueShape = (cx, cy, w = 34) =>
    tongue
      ? `<path d="M ${cx - w} ${cy} Q ${cx} ${cy + w * 1.1} ${cx + w} ${cy} Z" fill="${P.tongue}" ${stroke(6)} />`
      : "";

  switch (m) {
    case "grin":
      return `
        <path d="M 210 ${y - 6} Q 256 ${y + 40} 302 ${y - 6} Q 256 ${y + 14} 210 ${y - 6} Z"
              fill="${P.line}" ${stroke()} />
        <path d="M 216 ${y - 2} Q 256 ${y + 8} 296 ${y - 2}" fill="${P.white}" ${stroke(5)} />
        ${gold(282, y - 4)}`;
    case "smirk":
      return `
        <path d="M 216 ${y + 4} Q 256 ${y + 18} 300 ${y - 16}" fill="none" ${stroke(11)} />
        ${gold(288, y - 20)}`;
    case "shout": // wide open, teeth top
      return `
        <path d="M 202 ${y - 22} Q 256 ${y - 40} 310 ${y - 22} Q 314 ${y + 52} 256 ${y + 58} Q 198 ${y + 52} 202 ${y - 22} Z"
              fill="${P.line}" ${stroke()} />
        <path d="M 208 ${y - 18} Q 256 ${y - 6} 304 ${y - 18} L 304 ${y - 26} L 208 ${y - 26} Z" fill="${P.white}" />
        ${tongueShape(256, y + 20)}
        ${gold(286, y - 26)}`;
    case "scream":
      return `
        <ellipse cx="256" cy="${y + 12}" rx="42" ry="54" fill="${P.line}" ${stroke()} />
        <path d="M 220 ${y - 30} Q 256 ${y - 18} 292 ${y - 30} L 292 ${y - 40} L 220 ${y - 40} Z" fill="${P.white}" />
        ${tongueShape(256, y + 26, 26)}`;
    case "o":
      return `<ellipse cx="256" cy="${y + 4}" rx="30" ry="34" fill="${P.line}" ${stroke()} />
              <ellipse cx="256" cy="${y + 16}" rx="16" ry="14" fill="${P.tongue}" opacity="0.8" />`;
    case "frown":
      return `<path d="M 212 ${y + 20} Q 256 ${y - 20} 300 ${y + 20}" fill="none" ${stroke(12)} />`;
    case "wobble":
      return `
        <path d="M 206 ${y + 6} Q 222 ${y - 16} 236 ${y + 4} Q 254 ${y - 18} 272 ${y + 4} Q 288 ${y - 16} 306 ${y + 6}
                 Q 288 ${y + 40} 256 ${y + 42} Q 224 ${y + 40} 206 ${y + 6} Z"
              fill="${P.line}" ${stroke()} />
        ${tongueShape(256, y + 14, 24)}`;
    case "flat":
      return `<path d="M 214 ${y + 4} L 298 ${y + 4}" fill="none" ${stroke(11)} />`;
    case "yawn":
      return `
        <ellipse cx="256" cy="${y + 16}" rx="46" ry="46" fill="${P.line}" ${stroke()} />
        ${tongueShape(256, y + 30, 28)}`;
    case "grit":
      return `
        <path d="M 206 ${y - 12} L 306 ${y - 12} L 306 ${y + 22} L 206 ${y + 22} Z" fill="${P.line}" ${stroke()} />
        <path d="M 212 ${y - 6} L 300 ${y - 6} M 212 ${y + 14} L 300 ${y + 14}" fill="${P.white}" ${stroke(12)} />
        <path d="M 236 ${y - 10} L 236 ${y + 20} M 262 ${y - 10} L 262 ${y + 20} M 288 ${y - 10} L 288 ${y + 20}"
              fill="none" stroke="${P.line}" stroke-width="4" />`;
    case "teeth": // wide nervous grin
      return `
        <path d="M 200 ${y - 8} Q 256 ${y + 6} 312 ${y - 8} Q 306 ${y + 40} 256 ${y + 44} Q 206 ${y + 40} 200 ${y - 8} Z"
              fill="${P.line}" ${stroke()} />
        <path d="M 206 ${y - 4} Q 256 ${y + 8} 306 ${y - 4} L 306 ${y + 14} Q 256 ${y + 24} 206 ${y + 14} Z" fill="${P.white}" />
        ${gold(288, y - 2)}`;
    case "laugh":
      return `
        <path d="M 214 ${y - 26} Q 256 ${y - 6} 298 ${y - 26} Q 312 ${y + 46} 256 ${y + 52} Q 200 ${y + 46} 214 ${y - 26} Z"
              fill="${P.line}" ${stroke()} />
        <path d="M 220 ${y - 22} Q 256 ${y - 6} 292 ${y - 22} L 292 ${y - 32} L 220 ${y - 32} Z" fill="${P.white}" />
        ${tongueShape(256, y + 18, 30)}
        ${gold(280, y - 30)}`;
    case "pucker":
      return `
        <path d="M 224 ${y + 2} Q 256 ${y - 14} 292 ${y + 10}" fill="none" ${stroke(11)} />
        <path d="M 292 ${y + 10} q 8 -6 4 -16" fill="none" ${stroke(8)} />`;
    default:
      return "";
  }
}

// ── Props / hands ─────────────────────────────────────────────────────────
const HAND_R = 45;

/**
 * A paw: palm first, then digits as filled shapes on top so they actually read
 * as fingers at 64px (outlined strokes alone just disappear into the palm).
 */
function paw(x, y, rot = 0, fingers = "fist") {
  const r = HAND_R;
  const digit = (dx, len, w = 24) =>
    `<rect x="${x + dx - w / 2}" y="${y - r - len + 14}" width="${w}" height="${len}" rx="${w / 2}"
           fill="${P.fur}" ${stroke(7)} />`;

  const digits =
    fingers === "open"
      ? digit(-26, 40) + digit(0, 50) + digit(26, 40)
      : fingers === "point"
        ? digit(0, 66, 27)
        : fingers === "two"
          ? digit(-14, 56) + digit(16, 62)
          : "";

  return `
    <g transform="rotate(${rot} ${x} ${y})">
      <circle cx="${x}" cy="${y}" r="${r}" fill="${P.fur}" ${stroke()} />
      ${digits}
      <circle cx="${x}" cy="${y}" r="${r}" fill="none" ${stroke()} />
      <path d="M ${x - r + 12} ${y + 6} a ${r - 12} ${r - 12} 0 0 0 ${(r - 12) * 2} 0"
            fill="none" stroke="${P.line}" stroke-width="6" opacity="0.5" />
    </g>`;
}

function die(x, y, rot = -12, s = 1, pips = 5) {
  const w = 88 * s;
  const dot = (dx, dy) =>
    `<circle cx="${x + dx * w * 0.28}" cy="${y + dy * w * 0.28}" r="${w * 0.1}" fill="${P.amber}" />`;
  const layouts = {
    1: [[0, 0]],
    2: [
      [-1, -1],
      [1, 1],
    ],
    3: [
      [-1, -1],
      [0, 0],
      [1, 1],
    ],
    5: [
      [-1, -1],
      [1, -1],
      [0, 0],
      [-1, 1],
      [1, 1],
    ],
  };
  return `
    <g transform="rotate(${rot} ${x} ${y})">
      <rect x="${x - w / 2}" y="${y - w / 2}" width="${w}" height="${w}" rx="${w * 0.22}"
            fill="${P.cream}" ${stroke()} />
      ${(layouts[pips] ?? layouts[5]).map(([dx, dy]) => dot(dx, dy)).join("")}
    </g>`;
}

function tears() {
  return `
    <path d="M 176 292 q -16 34 4 46 q 20 -12 6 -46 Z" fill="${P.tear}" ${stroke(6)} />
    <path d="M 336 292 q 16 34 -4 46 q -20 -12 -6 -46 Z" fill="${P.tear}" ${stroke(6)} />`;
}

function sweat(n = 1) {
  const drop = (x, y, s) =>
    `<path d="M ${x} ${y} q ${-14 * s} ${26 * s} ${2 * s} ${34 * s} q ${18 * s} ${-8 * s} ${-2 * s} ${-34 * s} Z"
           fill="${P.sweat}" ${stroke(6)} />`;
  return drop(392, 196, 1) + (n > 1 ? drop(430, 250, 0.7) : "");
}

function crown() {
  return `
    <g transform="translate(0 -14)">
      <path d="M 176 104 L 200 52 L 228 88 L 256 40 L 284 88 L 312 52 L 336 104 Z"
            fill="${P.amber}" ${stroke()} />
      <rect x="172" y="100" width="168" height="26" rx="10" fill="${P.amberDark}" ${stroke()} />
      <circle cx="256" cy="74" r="9" fill="${P.magenta}" ${stroke(5)} />
    </g>`;
}

// Gesture layers: [behind head, in front of head]
function gesture(c, spec) {
  const g = spec.gesture ?? "die";
  const d = (x, y, r, s, pips) => die(x, y, r, s, pips);

  switch (g) {
    case "point": // finger jabbed at camera
      return ["", paw(392, 400, 8, "point")];
    case "thumbsDown":
      return [
        "",
        `${paw(140, 430, 200, "point")}${paw(372, 430, 160, "point")}`,
      ];
    case "armsUp":
      return [
        `${paw(104, 214, -8, "open")}${paw(408, 214, 8, "open")}`,
        d(256, 56, 18, 0.9, 3),
      ];
    case "chin": // thinking, hand under the chin
      return ["", paw(292, 446, -16, "point") + d(140, 424, -20, 0.95, 1)];
    case "heart": // hand on heart, die palmed behind
      return [d(424, 392, 14, 1.0, 2), paw(300, 470, 0, "fist")];
    case "shrug":
      return ["", `${paw(122, 404, -24, "open")}${paw(390, 404, 24, "open")}`];
    case "cheeks":
      return ["", `${paw(126, 320, 0, "open")}${paw(386, 320, 0, "open")}`];
    case "clutch":
      return ["", paw(300, 468, 0, "fist")];
    case "kneeSlap":
      return ["", paw(400, 452, 20, "open")];
    case "fan":
      return ["", paw(392, 300, -18, "open")];
    case "slump":
      return ["", paw(300, 466, 0, "fist") + d(140, 470, -8, 0.7, 1)];
    case "claw":
      return ["", `${paw(112, 306, -14, "open")}${paw(400, 306, 14, "open")}`];
    case "beckon":
      return ["", paw(384, 386, -14, "two")];
    case "eyesV":
      return ["", paw(346, 372, -160, "two")];
    case "clap":
      return ["", `${paw(160, 366, 12, "open")}${paw(352, 366, -12, "open")}`];
    case "mindBlown":
      return [
        `${paw(96, 288, -22, "open")}${paw(416, 288, 22, "open")}`,
        d(256, 466, -10, 1.15, 2),
      ];
    case "tipVisor":
      return ["", paw(376, 232, -18, "two") + d(128, 424, 12, 1.0, 3)];
    case "salt": // shaker held up
      return [
        "",
        `<g transform="rotate(24 380 300)">
           <rect x="352" y="268" width="58" height="76" rx="14" fill="${P.cream}" ${stroke()} />
           <path d="M 352 292 h 58" fill="none" ${stroke(6)} />
           <circle cx="368" cy="278" r="4" fill="${P.line}" />
           <circle cx="384" cy="274" r="4" fill="${P.line}" />
           <circle cx="398" cy="280" r="4" fill="${P.line}" />
         </g>
         <circle cx="424" cy="222" r="7" fill="${P.white}" ${stroke(4)} />
         <circle cx="452" cy="256" r="6" fill="${P.white}" ${stroke(4)} />
         <circle cx="440" cy="196" r="5" fill="${P.white}" ${stroke(4)} />
         ${paw(392, 372, 0, "fist")}`,
      ];
    case "watch":
      return [
        "",
        `<g transform="rotate(-12 150 400)">
           <rect x="112" y="368" width="76" height="66" rx="18" fill="${P.cream}" ${stroke()} />
           <circle cx="150" cy="401" r="20" fill="${P.white}" ${stroke(5)} />
           <path d="M 150 401 v -12 M 150 401 h 9" fill="none" stroke="${P.line}" stroke-width="5" stroke-linecap="round" />
         </g>
         ${paw(292, 446, -16, "point")}`,
      ];
    case "diceUp": // admiring the die
      return ["", paw(372, 392, -10, "two") + d(392, 286, 16, 1.1, 1)];
    default:
      return ["", ""];
  }
}

// ── Assembly ──────────────────────────────────────────────────────────────
export function buildSvg(spec, genderKey) {
  const c = CHARACTERS[genderKey];
  const tilt = spec.tilt ?? 0;
  const [behind, front] = gesture(c, spec);
  const head = headShape();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <clipPath id="headClip"><path d="${head}" /></clipPath>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="45%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#1B0F14" stop-opacity="0.34" />
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.32" />
      <stop offset="38%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Scaled up about the face: at 64px the head needs the frame, and the body
       can run off the bottom edge. -->
  <g transform="translate(256 268) scale(1.16) translate(-256 -268)">
  ${body(c)}
  ${behind}

  <g transform="rotate(${tilt} 256 300)">
    ${ears(c)}
    <path d="${head}" fill="${P.fur}" ${stroke()} />
    <g clip-path="url(#headClip)">
      <path d="${head}" fill="url(#shade)" />
      <path d="${head}" fill="url(#rim)" />
    </g>
    ${visor(c)}
    ${maskBand()}
    ${muzzle(c)}
    ${eyes(c, spec)}
    ${brows(c, spec)}
    ${mouth(c, spec)}
    ${spec.tears ? tears() : ""}
    ${spec.sweat ? sweat(spec.sweat) : ""}
    ${c.earring ? `<circle cx="146" cy="330" r="15" fill="none" stroke="${P.amber}" stroke-width="9" />` : ""}
    ${spec.crown ? crown() : ""}
  </g>

  ${front}
  </g>
</svg>`;
}

// ── The 21 emotes ─────────────────────────────────────────────────────────
// Each spec is the expression recipe from docs/emote-art-brief.md §5.
export const EMOTE_SPECS = {
  objection: { eyes: { mode: "tiny" }, brow: "veryAngry", mouth: "shout", tongue: true, gesture: "point", tilt: -4 },
  boo: { eyes: { mode: "squint" }, brow: "angry", mouth: "frown", gesture: "thumbsDown", tilt: 3 },
  cheer: { eyes: { mode: "happyShut" }, brow: "raised", mouth: "laugh", gesture: "armsUp", tilt: -2 },
  cry: { eyes: { mode: "shut" }, brow: "sad", mouth: "wobble", tears: true, gesture: "clutch", tilt: 5 },
  think: { eyes: { mode: "oneSquint", look: [10, -6] }, brow: "oneUp", mouth: "pucker", gesture: "chin", tilt: -8 },
  trust: { eyes: { mode: "halfLid", look: [8, 0] }, brow: "oneUp", mouth: "smirk", gesture: "heart", tilt: -3 },
  erm: { eyes: { mode: "open", look: [18, -4] }, brow: "worried", mouth: "grit", sweat: 1, gesture: "shrug", tilt: 4 },
  noway: { eyes: { mode: "wide" }, brow: "raised", mouth: "o", gesture: "cheeks", tilt: 0 },
  pain: { eyes: { mode: "oneSquint", squintSide: "l" }, brow: "angry", mouth: "grit", tongue: true, gesture: "clutch", tilt: 6 },
  laugh: { eyes: { mode: "happyShut" }, brow: "raised", mouth: "laugh", tongue: true, gesture: "kneeSlap", tilt: -10 },
  sweat: { eyes: { mode: "open", look: [-16, -2] }, brow: "worried", mouth: "teeth", sweat: 2, gesture: "fan", tilt: 3 },
  idle: { eyes: { mode: "bored" }, brow: "flat", mouth: "yawn", gesture: "slump", tilt: 8 },
  scream: { eyes: { mode: "x" }, brow: "veryAngry", mouth: "scream", tongue: true, gesture: "claw", tilt: -3 },
  attack: { eyes: { mode: "squint", look: [0, -6] }, brow: "veryAngry", mouth: "smirk", gesture: "beckon", tilt: 2 },
  watching: { eyes: { mode: "open", look: [20, 0] }, brow: "oneUp", mouth: "smirk", gesture: "eyesV", tilt: -4 },
  clown: { eyes: { mode: "halfLid" }, brow: "raised", mouth: "flat", gesture: "clap", tilt: 2 },
  mia: { eyes: { mode: "wide", look: [0, 2] }, brow: "raised", mouth: "shout", gesture: "mindBlown", tilt: 0 },
  gg: { eyes: { mode: "happyShut" }, brow: "neutral", mouth: "grin", gesture: "tipVisor", tilt: -3 },
  salty: { eyes: { mode: "halfLid", look: [-10, 0] }, brow: "oneUp", mouth: "grin", tongue: true, gesture: "salt", tilt: 4 },
  slow: { eyes: { mode: "halfLid" }, brow: "flat", mouth: "flat", gesture: "watch", tilt: 0 },
  crown: { eyes: { mode: "halfLid", look: [10, 2] }, brow: "oneUp", mouth: "smirk", crown: true, gesture: "diceUp", tilt: -4 },
};

export const EMOTE_IDS = Object.keys(EMOTE_SPECS);
export const GENDERS = ["female", "male"];
