// ---------------------------------------------------------------------------
// Image occlusion — cover parts of a picture and ask what's underneath.
//
// For anatomy, diagrams, maps and circuits this is the card type; a text card
// asking "what is the structure labelled 3" without the picture is a worse
// question about the same thing. The app can already put an image on a card,
// but nothing could hide part of one.
//
// The model is deliberately not "burn boxes into a bitmap". Masks are stored as
// fractions of the image's width and height:
//
//   { id, x, y, w, h, label? }   all in 0..1
//
// Fractions rather than pixels because the same card is drawn at 320px on a
// phone and 900px on the web, and a mask stored in source pixels lands in the
// wrong place on one of them. It also means the original image is stored once,
// unmodified, and every card built from it references the same imageStore
// entry rather than carrying its own copy — twenty masks on one diagram cost
// one image, not twenty.
//
// Two modes, both of which Anki offers and which mean different things:
//
//   hide-all   every mask is covered; answering reveals only this card's.
//              The test is "what is *this* one" with no help from the others.
//   hide-one   only this card's mask is covered, the rest are visible.
//              Easier, and right for learning a diagram the first time.
// ---------------------------------------------------------------------------

export const HIDE_ALL = "hide-all";
export const HIDE_ONE = "hide-one";

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

// Masks arrive from a drag, which can go right-to-left or bottom-to-top and can
// run off the edge of the image. Normalising here means every consumer can
// assume x/y is the top-left corner and the rect is inside the picture.
export function normalizeMask(mask) {
  const x1 = clamp01(mask?.x);
  const y1 = clamp01(mask?.y);
  const x2 = clamp01((Number(mask?.x) || 0) + (Number(mask?.w) || 0));
  const y2 = clamp01((Number(mask?.y) || 0) + (Number(mask?.h) || 0));
  return {
    id: mask?.id || `m${Math.random().toString(36).slice(2, 9)}`,
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
    ...(mask?.label ? { label: String(mask.label).slice(0, 60) } : {}),
  };
}

// A mask too small to be a deliberate drag is a stray tap. Discarding these is
// what stops an accidental click from adding an invisible card the user then
// has to hunt down.
export const MIN_MASK_SIZE = 0.01;
export const isUsableMask = (m) => m && m.w >= MIN_MASK_SIZE && m.h >= MIN_MASK_SIZE;

export function normalizeMasks(masks) {
  return (masks || []).map(normalizeMask).filter(isUsableMask);
}

// Expands one occluded image into one card per mask.
//
// Like cloze.expand, this preserves the identity and schedule of cards whose
// mask survived an edit: adding a twentieth label to a diagram must not reset
// the nineteen you have been learning for a month.
export function expand(imageId, masks, opts = {}) {
  const list = normalizeMasks(masks);
  if (!list.length) return [];
  const mode = opts.mode === HIDE_ONE ? HIDE_ONE : HIDE_ALL;
  const existing = new Map((opts.existing || []).map((c) => [c.occlusionMaskId, c]));

  return list.map((mask, i) => {
    const prior = existing.get(mask.id);
    return {
      ...(prior || {}),
      ...(opts.base || {}),
      ...(prior ? { id: prior.id } : {}),
      frontImageId: imageId,
      occlusionMaskId: mask.id,
      occlusionMode: mode,
      occlusionMasks: list,
      // The back is the label when there is one. Without a label the card is
      // still answerable — you look and see what was under the box — so an
      // unlabelled mask is a legitimate card, not an incomplete one.
      front: mask.label ? "" : `What is hidden here? (${i + 1}/${list.length})`,
      back: mask.label || "",
      occlusionIndex: i + 1,
      occlusionTotal: list.length,
    };
  });
}

export function orphaned(masks, existing) {
  const live = new Set(normalizeMasks(masks).map((m) => m.id));
  return (existing || []).filter((c) => c.occlusionMaskId && !live.has(c.occlusionMaskId));
}

export const isOcclusionCard = (card) => !!card?.occlusionMaskId && !!card?.frontImageId;

// Which masks to paint, given the card and whether the answer is showing.
// This is the whole behavioural difference between the two modes, kept in one
// place so the renderer stays a renderer.
export function visibleMasks(card, revealed) {
  if (!isOcclusionCard(card)) return [];
  const all = normalizeMasks(card.occlusionMasks);
  const mine = (m) => m.id === card.occlusionMaskId;
  if (revealed) {
    // The answer is showing: this card's mask always comes off. In hide-all the
    // others stay on, so the eye isn't pulled to labels that aren't the answer.
    return card.occlusionMode === HIDE_ONE ? [] : all.filter((m) => !mine(m));
  }
  return card.occlusionMode === HIDE_ONE ? all.filter(mine) : all;
}

// The mask being asked about — the renderer outlines it so "which box is the
// question" is never ambiguous on a diagram with twenty of them.
export const activeMask = (card) =>
  normalizeMasks(card?.occlusionMasks).find((m) => m.id === card?.occlusionMaskId) || null;

// Converts a drag in on-screen pixels into a stored fractional mask. The
// element's displayed size is the divisor, not the image's natural size:
// the picture is drawn scaled to fit, and using natural pixels would put the
// mask somewhere else entirely on a phone.
export function maskFromRect(rect, displayed) {
  const w = displayed?.width || 1;
  const h = displayed?.height || 1;
  return normalizeMask({
    x: (rect?.x || 0) / w,
    y: (rect?.y || 0) / h,
    w: (rect?.w || 0) / w,
    h: (rect?.h || 0) / h,
    label: rect?.label,
  });
}

// A stored mask back to pixels for drawing.
export const maskToRect = (mask, displayed) => ({
  x: mask.x * (displayed?.width || 0),
  y: mask.y * (displayed?.height || 0),
  w: mask.w * (displayed?.width || 0),
  h: mask.h * (displayed?.height || 0),
});

// Masks that overlap enough to be ambiguous — two boxes on the same structure
// make two cards with the same answer, and the user should be told before it
// becomes twenty. Returns pairs, not a boolean, so the editor can highlight them.
export function overlapping(masks, threshold = 0.6) {
  const list = normalizeMasks(masks);
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const overlap = ox * oy;
      const smaller = Math.min(a.w * a.h, b.w * b.h);
      if (smaller > 0 && overlap / smaller >= threshold) out.push([a.id, b.id]);
    }
  }
  return out;
}
