// ---------------------------------------------------------------------------
// Leeches — cards you keep getting wrong no matter how often they come back.
//
// A scheduler can only decide *when* to show a card. If the card itself is the
// problem — two answers that are impossible to tell apart, a question with no
// context, a typo that makes it unanswerable — then showing it sooner just
// costs more time for the same failure. Anki's answer is to count lapses and
// take the card out of circulation past a threshold; this is that, with the
// difference that a leech here is surfaced for *fixing* rather than only
// buried, because in this app the person who wrote the card is the person
// reviewing it.
//
// Suspension is deliberately reversible and never silent: the card stays in
// the deck, marked, and the study screen offers "edit" or "bring it back".
// ---------------------------------------------------------------------------

export const DEFAULT_THRESHOLD = 8;
// Past the first suspension the card is re-suspended every this-many further
// lapses, so a card brought back unchanged doesn't nag on every single miss.
const REPEAT_EVERY = 4;

export const isLeech = (card, threshold = DEFAULT_THRESHOLD) =>
  (card?.fsrsLapses || 0) >= threshold;

export const isSuspended = (card) => !!card?.leechSuspended;

// Called by srs.applyGrade after every review. Returns the card unchanged
// unless this particular answer crossed a threshold.
export function applyLeechPolicy(card, opts = {}) {
  const threshold = opts.threshold || DEFAULT_THRESHOLD;
  const lapses = card?.fsrsLapses || 0;
  if (lapses < threshold) return card;

  // Fires on the crossing, then every REPEAT_EVERY lapses after it — not on
  // every lapse past the line, which would re-bury a card the user has just
  // deliberately un-buried.
  const past = lapses - threshold;
  const atMark = past === 0 || past % REPEAT_EVERY === 0;
  if (!atMark || card.leechSuspended) return { ...card, leech: true };

  return {
    ...card,
    leech: true,
    leechSuspended: true,
    leechSuspendedAt: opts.now || Date.now(),
  };
}

// The user chose to keep studying it. Clears the suspension but keeps the
// lapse count — the history is real, and the next threshold should still fire.
export function unsuspend(card) {
  const { leechSuspended, leechSuspendedAt, ...rest } = card || {};
  return { ...rest, leech: true };
}

// The user edited the card to fix whatever made it unanswerable. That is a
// different claim from "let me try again": the card is genuinely different
// now, so the lapse count starts over and the mark comes off.
export function forgive(card) {
  const { leechSuspended, leechSuspendedAt, leech, ...rest } = card || {};
  return { ...rest, fsrsLapses: 0 };
}

export const leeches = (cards, threshold = DEFAULT_THRESHOLD) =>
  (cards || []).filter((c) => isLeech(c, threshold));

export const suspended = (cards) => (cards || []).filter(isSuspended);

// Why this card became a leech, as far as the data can tell. Shown next to it
// in the review list so the suggestion is actionable rather than "this is hard".
export function diagnose(card, allCards = []) {
  const back = String(card?.back || "").trim().toLowerCase();
  const front = String(card?.front || "").trim().toLowerCase();

  const twins = (allCards || []).filter(
    (c) => c.id !== card.id && String(c.back || "").trim().toLowerCase() === back && back
  );
  if (twins.length) {
    return {
      code: "duplicate-answer",
      message: `${twins.length + 1} cards share this answer — they may be impossible to tell apart.`,
    };
  }
  if (front && front === back) {
    return { code: "same-both-sides", message: "Front and back are identical." };
  }
  if (back.length > 120) {
    return {
      code: "answer-too-long",
      message: "The answer is long — long answers are hard to recall exactly. Consider splitting the card.",
    };
  }
  if (!front || !back) {
    return { code: "empty-side", message: "One side of this card is empty." };
  }
  return {
    code: "just-hard",
    message: "No obvious problem with the card — it may just need a mnemonic or an example.",
  };
}
