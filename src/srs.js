// Spaced repetition — Leitner boxes. Extracted from FlashcardCatalog.jsx so
// the scheduling math is testable on its own; the component imports it here.
//
// Every card carries an optional srsBox (0-5) and srsDue timestamp. A correct
// answer moves it up one box, pushing the next review further out; a miss
// drops it back to box 0 (due immediately). Cards without these fields are
// brand new and always count as due.
export const SRS_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const DAY_MS = 24 * 60 * 60 * 1000;

export function applyGrade(card, correct, now = Date.now()) {
  const box = correct ? Math.min((card.srsBox || 0) + 1, SRS_INTERVAL_DAYS.length - 1) : 0;
  // srsPeak is the highest box this card has ever reached. It's what makes a
  // "card strengthened" reward honest: re-climbing a box you already had
  // doesn't pay again, so there's no XP in deliberately failing a strong card.
  const peak = Math.max(card.srsPeak || 0, box);
  return { ...card, srsBox: box, srsPeak: peak, srsDue: now + SRS_INTERVAL_DAYS[box] * DAY_MS };
}

// Did this answer push the card past its personal best?
export function isLevelUp(card, correct) {
  if (!correct) return false;
  const box = Math.min((card.srsBox || 0) + 1, SRS_INTERVAL_DAYS.length - 1);
  return box > (card.srsPeak || card.srsBox || 0);
}

export const isDue = (card, now = Date.now()) => card.srsDue == null || card.srsDue <= now;
