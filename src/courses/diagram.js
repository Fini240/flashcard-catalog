// Builds the labelled diagrams the school-subject courses ship with: a plain
// SVG drawing plus, for every label, the box that hides it on an occlusion
// card. Drawn in code rather than generated: sharp at any size, a few KB, no
// network, and the label text is exactly what the card's answer says.
//
// A diagram is drawn on its own light "paper" so it reads the same in light
// and dark mode — the card face flips with the theme, the drawing doesn't.

const FONT = 17;
const PAD = 5;
// A rough width for the system sans at FONT px. Generous on purpose: a mask a
// little too wide only covers paper, one too narrow leaves the answer showing.
const textWidth = (s) => [...String(s)].reduce((w, ch) => w + (/[ilI.,:;'|!]/.test(ch) ? 0.3 : /[mwMW]/.test(ch) ? 0.85 : 0.6), 0) * FONT;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const INK = "#2B2F3A";
export const SOFT = "#7A8090";

// `shapes` is SVG markup in a w×h coordinate space. Each label is placed with
// its text starting (anchor "start"), ending ("end") or centred ("middle") at
// x/y (the baseline), and an optional leader line `to` the point it names.
export function diagram({ w, h, shapes, labels }) {
  const masks = [];
  const parts = [];
  labels.forEach((l, i) => {
    const tw = textWidth(l.text);
    const anchor = l.anchor || "start";
    const left = anchor === "end" ? l.x - tw : anchor === "middle" ? l.x - tw / 2 : l.x;
    const box = { x: left - PAD, y: l.y - FONT - PAD + 3, w: tw + PAD * 2, h: FONT + PAD * 2 };
    if (l.to) {
      // The leader starts at the side of the label facing its target.
      const fromX = l.to[0] < box.x ? box.x : l.to[0] > box.x + box.w ? box.x + box.w : l.to[0];
      const fromY = box.y + box.h / 2;
      parts.push(`<line x1="${fromX}" y1="${fromY}" x2="${l.to[0]}" y2="${l.to[1]}" stroke="${SOFT}" stroke-width="1.4"/>`,
        `<circle cx="${l.to[0]}" cy="${l.to[1]}" r="3" fill="${INK}"/>`);
    }
    parts.push(`<text x="${l.x}" y="${l.y}" text-anchor="${anchor}" font-size="${FONT}" fill="${INK}">${esc(l.text)}</text>`);
    masks.push({
      id: `m${i + 1}`,
      x: box.x / w, y: box.y / h, w: box.w / w, h: box.h / h,
      label: l.text,
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" `
    + `font-family="Helvetica, Arial, sans-serif"><rect width="${w}" height="${h}" rx="14" fill="#FFFDF7"/>`
    + `${shapes}${parts.join("")}</svg>`;
  return { w, h, svg, masks };
}

export const svgDataUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
