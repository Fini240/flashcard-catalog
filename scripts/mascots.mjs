// ---------------------------------------------------------------------------
// Generates the mascot art, in both forms the app needs:
//
//   * res/drawable/mascot_<animal>_<mood>.xml — Android VectorDrawables, what
//     the home-screen widget actually draws.
//   * src/mascotArt.js — the same drawings as SVG, so the picker in Settings
//     can show each animal in the mood it is in *right now* rather than a
//     stand-in emoji. Picking a mascot you can see is the whole feature.
//
//   node scripts/mascots.mjs
//
// Both come off one description of each drawing, so the animal in Settings and
// the animal on the home screen cannot drift apart.
//
// The output is committed — this is not a build step, and nothing at run time
// or in CI needs Node to have run. It exists because the alternative is thirty
// hand-maintained XML files that must agree with each other about where an eye
// goes: change EYE_Y here and every animal still lines up, whereas changing it
// in thirty files means twenty-nine chances to be slightly off.
//
// Why vectors rather than emoji: the whole point of the mascot is that it has
// moods, and 🦊 has exactly one. Why not PNGs: a widget is drawn at whatever
// size the launcher's grid decides, and these have to stay sharp from a 2x2
// cell to a tablet's 4x2.
//
// The moods, and what each is *for*, live in src/widget.js — that file decides
// which one is showing; this one only knows how to draw them.
// ---------------------------------------------------------------------------
import { writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRAWABLES = join(ROOT, "android/app/src/main/res/drawable");
const ART_MODULE = join(ROOT, "src/mascotArt.js");

// ---------- geometry ----------
// One 108x108 grid for every animal, so a mood swap never shifts the face.
const HEAD = { cx: 54, cy: 62, r: 31 };
const EYE_Y = 58;
const EYE_L = 43;
const EYE_R = 65;
const MUZZLE = { cx: 54, cy: 77, rx: 14, ry: 10 };
const DARK = "#2E2E33";
// One warm gold for every animal's "you did it" sparkles: tinting them per
// animal put a black sparkle on the fox, which reads as a smudge.
const SPARKLE = "#F5B942";

const ellipse = (cx, cy, rx, ry) =>
  `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`;
const circle = (cx, cy, r) => ellipse(cx, cy, r, r);

// A drawing is a list of these, never a list of strings: two output formats
// mean the shapes have to survive being written down twice, and generating one
// of them by re-parsing the other is how they start disagreeing.
const fill = (d, color, alpha) => ({ d, fill: color, alpha });
const stroke = (d, color, width = 3.4) => ({ d, stroke: color, width });
const group = (px, py, rotation, children) => ({ px, py, rotation, children });

function toAndroid(nodes, indent = "  ") {
  const out = [];
  for (const n of nodes) {
    if (n.children) {
      out.push(`${indent}<group android:pivotX="${n.px}" android:pivotY="${n.py}" android:rotation="${n.rotation}">`);
      out.push(...toAndroid(n.children, indent + "  "));
      out.push(`${indent}</group>`);
    } else if (n.fill) {
      out.push(`${indent}<path android:pathData="${n.d}" android:fillColor="${n.fill}"${n.alpha ? ` android:fillAlpha="${n.alpha}"` : ""} />`);
    } else {
      out.push(`${indent}<path android:pathData="${n.d}" android:strokeColor="${n.stroke}" android:strokeWidth="${n.width}" android:strokeLineCap="round" android:strokeLineJoin="round" />`);
    }
  }
  return out;
}

function toSvg(nodes) {
  let out = "";
  for (const n of nodes) {
    if (n.children) {
      out += `<g transform="rotate(${n.rotation} ${n.px} ${n.py})">${toSvg(n.children)}</g>`;
    } else if (n.fill) {
      // SVG fills black by default where a VectorDrawable fills nothing, so
      // every path has to state its fill even when the answer is "none".
      out += `<path d="${n.d}" fill="${n.fill}"${n.alpha ? ` fill-opacity="${n.alpha}"` : ""}/>`;
    } else {
      out += `<path d="${n.d}" fill="none" stroke="${n.stroke}" stroke-width="${n.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }
  return out;
}

// ---------- the animals ----------
// `behind` draws before the head (ears), `front` after it (patches, beak).
// Everything else is shared, which is what keeps five animals from becoming
// five drawing programs.
const ANIMALS = {
  owl: {
    fur: "#8B6F47", shade: "#6F5735", inner: "#E8D5B7", nose: "#F5A623",
    pupil: DARK, brow: DARK, blush: "#E58A8A",
    behind: (a) => [
      fill("M30,42 L25,15 L49,31 Z", a.fur),
      fill("M78,42 L83,15 L59,31 Z", a.fur),
    ],
    // The discs are what make an owl an owl, and they double as a bright
    // ground that keeps a dark pupil legible at widget size.
    front: (a) => [
      fill(circle(EYE_L, EYE_Y, 14), a.inner),
      fill(circle(EYE_R, EYE_Y, 14), a.inner),
      fill("M54,64 L47,73 L61,73 Z", a.nose),
    ],
    muzzle: false,
    mouthless: true, // a beak, drawn above — owls haven't got a mouth to draw
  },
  cat: {
    fur: "#F2A25C", shade: "#D8873F", inner: "#F7C6B0", nose: "#D96D8A",
    pupil: DARK, brow: DARK, blush: "#E58A8A",
    behind: (a) => [
      fill("M30,44 L26,15 L50,29 Z", a.fur),
      fill("M78,44 L82,15 L58,29 Z", a.fur),
      fill("M33,39 L31,23 L44,31 Z", a.inner),
      fill("M75,39 L77,23 L64,31 Z", a.inner),
    ],
    front: () => [],
    muzzle: "#F7C6B0",
    whiskers: true,
  },
  fox: {
    fur: "#E8642F", shade: "#C24E20", inner: "#FFF2E8", nose: DARK,
    pupil: DARK, brow: DARK, blush: "#E58A8A",
    behind: (a) => [
      fill("M28,44 L22,11 L50,28 Z", a.fur),
      fill("M80,44 L86,11 L58,28 Z", a.fur),
      fill("M22,11 L25,23 L34,17 Z", a.shade),
      fill("M86,11 L83,23 L74,17 Z", a.shade),
    ],
    // The white cheeks a fox is drawn with; they sit under the muzzle so the
    // face reads as one shape rather than a patch stuck on.
    front: (a) => [
      fill(ellipse(34, 74, 13, 12), a.inner),
      fill(ellipse(74, 74, 13, 12), a.inner),
    ],
    muzzle: null, // defaults to `inner`
  },
  bunny: {
    fur: "#E5DDD6", shade: "#C9BEB4", inner: "#F2B8C6", nose: "#D96D8A",
    pupil: DARK, brow: DARK, blush: "#E58A8A",
    behind: (a) => [
      group(46, 46, -14, [fill(ellipse(41, 23, 9, 23), a.fur), fill(ellipse(41, 24, 4.5, 16), a.inner)]),
      group(62, 46, 14, [fill(ellipse(67, 23, 9, 23), a.fur), fill(ellipse(67, 24, 4.5, 16), a.inner)]),
    ],
    front: () => [],
    muzzle: null, // defaults to `inner`
  },
  panda: {
    fur: "#FAFAFA", shade: "#8E8E93", inner: "#2E2E33", nose: "#2E2E33",
    // The one animal whose face is drawn in reverse. `inner` is the black of
    // the ears and eye patches, so the brows — which sit *on* that black —
    // and the pupils both have to be light or they disappear into it.
    //
    // And no muzzle patch at all: a light ellipse is invisible on a white
    // face, and a dark one runs into the eye patches to make one shapeless
    // blob. The nose and mouth sit straight on the head instead.
    muzzle: false, pupil: "#FAFAFA", brow: "#FAFAFA", blush: "#E58A8A",
    behind: (a) => [
      fill(circle(30, 33, 13), a.inner),
      fill(circle(78, 33, 13), a.inner),
    ],
    front: (a) => [
      group(EYE_L, EYE_Y, -18, [fill(ellipse(EYE_L, EYE_Y - 1, 9.5, 11.5), a.inner)]),
      group(EYE_R, EYE_Y, 18, [fill(ellipse(EYE_R, EYE_Y - 1, 9.5, 11.5), a.inner)]),
    ],
  },
};

// ---------- the moods ----------
// Each returns the face drawn over the head. Eyes first, then brows, then
// whatever the mood adds on top.
const openEye = (a, r = 4.6) => [
  fill(circle(EYE_L, EYE_Y, r), a.pupil),
  fill(circle(EYE_R, EYE_Y, r), a.pupil),
];
const highlight = (a) => [
  fill(circle(EYE_L + 1.8, EYE_Y - 1.8, 1.5), a.pupil === DARK ? "#FFFFFF" : DARK),
  fill(circle(EYE_R + 1.8, EYE_Y - 1.8, 1.5), a.pupil === DARK ? "#FFFFFF" : DARK),
];
const closedDown = (a) => [
  stroke(`M${EYE_L - 7},${EYE_Y - 2} q7,7 14,0`, a.pupil, 3.2),
  stroke(`M${EYE_R - 7},${EYE_Y - 2} q7,7 14,0`, a.pupil, 3.2),
];
const closedUp = (a) => [
  stroke(`M${EYE_L - 7},${EYE_Y + 3} q7,-8 14,0`, a.pupil, 3.2),
  stroke(`M${EYE_R - 7},${EYE_Y + 3} q7,-8 14,0`, a.pupil, 3.2),
];
const blush = (a) => [
  fill(circle(30, 70, 5.5), a.blush, "0.55"),
  fill(circle(78, 70, 5.5), a.blush, "0.55"),
];
const sparkle = (cx, cy, s, color) =>
  fill(`M${cx},${cy - s} L${cx + s * 0.32},${cy - s * 0.32} L${cx + s},${cy} L${cx + s * 0.32},${cy + s * 0.32} L${cx},${cy + s} L${cx - s * 0.32},${cy + s * 0.32} L${cx - s},${cy} L${cx - s * 0.32},${cy - s * 0.32} Z`, color);

// Mouths are skipped for a beaked animal — see `mouthless` on ANIMALS.owl.
const mouth = (a, d, width) => (a.mouthless ? [] : [stroke(d, DARK, width)]);
const mouthFill = (a, d) => (a.mouthless ? [] : [fill(d, DARK)]);

const MOODS = {
  // Early, and nothing has been asked of anyone yet.
  sleepy: (a) => [
    ...closedDown(a),
    ...mouth(a, "M50,80 q4,4 8,0", 3),
    stroke("M84,20 L94,20 L84,31 L94,31", a.shade, 3),
    stroke("M96,34 L102,34 L96,41 L102,41", a.shade, 2.4),
  ],
  // Awake, no opinion yet.
  neutral: (a) => [
    ...openEye(a),
    ...highlight(a),
    ...mouth(a, "M47,80 L61,80", 3.2),
  ],
  // Expectant: the day is half gone and the cards are still there.
  waiting: (a) => [
    ...openEye(a, 5),
    ...highlight(a),
    stroke(`M${EYE_L - 7},${EYE_Y - 11} q7,-5 14,0`, a.brow, 2.6),
    stroke(`M${EYE_R - 7},${EYE_Y - 11} q7,-5 14,0`, a.brow, 2.6),
    ...mouth(a, ellipse(54, 80, 4.5, 4), 2.8),
  ],
  // Evening, and the streak is genuinely at stake.
  worried: (a) => [
    ...openEye(a),
    ...highlight(a),
    stroke(`M${EYE_L - 8},${EYE_Y - 8} L${EYE_L + 6},${EYE_Y - 13}`, a.brow, 3),
    stroke(`M${EYE_R + 8},${EYE_Y - 8} L${EYE_R - 6},${EYE_Y - 13}`, a.brow, 3),
    ...mouth(a, "M46,81 q4,-4 8,0 q4,4 8,0", 3),
  ],
  // Last call. The only mood allowed to look like bad news, and only when
  // there is a streak to lose — see moodSchedule in src/widget.js.
  sad: (a) => [
    ...openEye(a, 4.2),
    stroke(`M${EYE_L - 8},${EYE_Y - 9} L${EYE_L + 6},${EYE_Y - 13}`, a.brow, 3),
    stroke(`M${EYE_R + 8},${EYE_Y - 9} L${EYE_R - 6},${EYE_Y - 13}`, a.brow, 3),
    fill("M35,64 q-4.5,7.5 0,10 q4.5,-2.5 0,-10 Z", "#6FA8DC"),
    ...mouth(a, "M45,83 q9,-9 18,0", 3.2),
  ],
  // Done for the day. Nothing later can walk this back.
  happy: (a) => [
    ...closedUp(a),
    ...blush(a),
    ...mouthFill(a, "M44,75 q10,13 20,0 Z"),
    sparkle(14, 25, 6.5, SPARKLE),
    sparkle(95, 19, 5, SPARKLE),
  ],
};

// ---------- assembly ----------
// One drawing, as nodes. Order is paint order: ears behind the head, face on
// top of it, nose above the mouth so a smile tucks under it.
function draw(animalId, moodId) {
  const a = ANIMALS[animalId];
  return [
    ...a.behind(a),
    fill(circle(HEAD.cx, HEAD.cy, HEAD.r), a.fur),
    ...a.front(a),
    ...(a.muzzle !== false ? [fill(ellipse(MUZZLE.cx, MUZZLE.cy, MUZZLE.rx, MUZZLE.ry), a.muzzle || a.inner)] : []),
    ...MOODS[moodId](a),
    ...(a.mouthless ? [] : [fill("M49,68 L59,68 L54,74 Z", a.nose)]),
    ...(a.whiskers
      ? [stroke("M20,72 L33,74", a.shade, 2), stroke("M20,80 L33,79", a.shade, 2),
         stroke("M88,72 L75,74", a.shade, 2), stroke("M88,80 L75,79", a.shade, 2)]
      : []),
  ];
}

const VIEWPORT = 108;

const androidFile = (nodes) => [
  "<!-- Generated by scripts/mascots.mjs \u2014 do not edit by hand. -->",
  '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
  '    android:width="72dp"',
  '    android:height="72dp"',
  `    android:viewportWidth="${VIEWPORT}"`,
  `    android:viewportHeight="${VIEWPORT}">`,
  ...toAndroid(nodes),
  "</vector>",
  "",
].join("\n");

// No width/height: the picker sizes these with CSS, and a hardcoded one would
// have to be overridden everywhere it is used.
const svgFile = (nodes) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWPORT} ${VIEWPORT}">${toSvg(nodes)}</svg>`;

// A stale drawable for a renamed animal would sit in the APK forever, so the
// generator owns the whole mascot_* namespace rather than only adding to it.
for (const f of readdirSync(DRAWABLES)) {
  if (f.startsWith("mascot_") && f.endsWith(".xml")) unlinkSync(join(DRAWABLES, f));
}

const art = [];
let n = 0;
for (const animal of Object.keys(ANIMALS)) {
  for (const mood of Object.keys(MOODS)) {
    const nodes = draw(animal, mood);
    writeFileSync(join(DRAWABLES, `mascot_${animal}_${mood}.xml`), androidFile(nodes));
    art.push(`  "${animal}:${mood}": ${JSON.stringify(svgFile(nodes))},`);
    n++;
  }
}

writeFileSync(ART_MODULE, [
  "// Generated by scripts/mascots.mjs \u2014 do not edit by hand.",
  "//",
  "// The same drawings the widget uses, as SVG, so the mascot picker in",
  "// Settings can show the real animal instead of a stand-in. Keyed",
  "// `animal:mood`; read it through mascotArt() in widget.js rather than",
  "// indexing it directly, so an unknown pair falls back instead of",
  "// rendering nothing.",
  "export const MASCOT_ART = {",
  ...art,
  "};",
  "",
].join("\n"));

console.log(`wrote ${n} mascot drawables and ${ART_MODULE}`);
