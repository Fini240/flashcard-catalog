// Spaced repetition — Leitner boxes. Extracted from FlashcardCatalog.jsx so
// the scheduling math is testable on its own; the component imports it here.
//
// Every card carries an optional srsBox (0-5) and srsDue timestamp. A correct
// answer moves it up one box, pushing the next review further out; a miss
// drops it one box, and it comes back immediately. Cards without these fields
// are brand new and always count as due.
//
// A miss used to reset the card to box 0. One slip on something you'd answered
// correctly five times running threw away every one of them and put the card
// back among cards you had never seen, which isn't what forgetting a word once
// means. Stepping down keeps the difference between "shaky" and "new".
//
// The step-down changes the card's *strength*, not when it comes back: a card
// you just missed is due now regardless of which box it landed in. Otherwise a
// miss at box 5 would drop it to box 4 and then not ask again for a fortnight,
// which would be a worse outcome than the reset it replaced.
export const SRS_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const DAY_MS = 24 * 60 * 60 * 1000;

export function applyGrade(card, correct, now = Date.now()) {
  const current = card.srsBox || 0;
  const box = correct
    ? Math.min(current + 1, SRS_INTERVAL_DAYS.length - 1)
    : Math.max(current - 1, 0);
  // srsPeak is the highest box this card has ever reached. It's what makes a
  // "card strengthened" reward honest: re-climbing a box you already had
  // doesn't pay again, so there's no XP in deliberately failing a strong card.
  const peak = Math.max(card.srsPeak || 0, box);
  const due = correct ? now + SRS_INTERVAL_DAYS[box] * DAY_MS : now;
  return { ...card, srsBox: box, srsPeak: peak, srsDue: due };
}

// Did this answer push the card past its personal best?
export function isLevelUp(card, correct) {
  if (!correct) return false;
  const box = Math.min((card.srsBox || 0) + 1, SRS_INTERVAL_DAYS.length - 1);
  return box > (card.srsPeak || card.srsBox || 0);
}

export const isDue = (card, now = Date.now()) => card.srsDue == null || card.srsDue <= now;
