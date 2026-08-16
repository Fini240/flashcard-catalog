// Spaced repetition. The scheduling maths now lives in fsrs.js — this module
// is the app's view of it, and the boundary that kept the migration small.
//
// Until 1.2.0 this file *was* the scheduler: fixed Leitner boxes with the
// intervals below. Those intervals were the same for every card and every
// person, which is a guess about memory rather than a measurement of one.
// FSRS keeps a stability and a difficulty per card and predicts from them; see
// the header of fsrs.js for what that buys and why the migration needs no
// rewrite of stored cards.
//
// What stays true for callers:
//   - applyGrade(card, correct) still takes a boolean and returns a new card
//   - srsBox 0-5 still exists and still means what it meant (deck strength,
//     drill selection and the XP rules read it unchanged)
//   - a missed card is still due immediately
//
// What is new: applyGrade accepts a grade (1-4) or a confidence (1-5) instead
// of a boolean, for the modes that collect one, and the card gains fsrs*
// fields. Cards without them are scheduled from their box on first review.
import * as fsrs from "./fsrs";
import * as leech from "./leech";

export { DAY_MS } from "./fsrs";

// The old ladder, kept because two things still read it: the migration in
// fsrs.initialFrom (which reconstructs stability from a box) and the interval
// preview in the card list. Nothing schedules from it any more.
export const SRS_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];

// Settings the user can move (Statistics screen). Desired retention is the one
// dial that genuinely changes the workload/recall trade-off: 0.9 is the
// default, higher means more reviews for better recall.
export const DEFAULT_SETTINGS = {
  desiredRetention: 0.9,
  params: fsrs.DEFAULT_PARAMS,
  // Anki's two limiters. Without them a big import dumps every card into one
  // session and the user meets a 400-card queue on day one.
  newPerDay: 20,
  reviewsPerDay: 200,
  leechThreshold: leech.DEFAULT_THRESHOLD,
};

export function normalizeSettings(s) {
  const base = { ...DEFAULT_SETTINGS, ...(s || {}) };
  return {
    ...base,
    desiredRetention: Math.min(0.99, Math.max(0.7, Number(base.desiredRetention) || 0.9)),
    params: Array.isArray(base.params) && base.params.length === fsrs.DEFAULT_PARAMS.length
      ? base.params
      : fsrs.DEFAULT_PARAMS,
    newPerDay: Math.max(0, Math.floor(Number(base.newPerDay) || 0)),
    reviewsPerDay: Math.max(0, Math.floor(Number(base.reviewsPerDay) || 0)),
    leechThreshold: Math.max(2, Math.floor(Number(base.leechThreshold) || leech.DEFAULT_THRESHOLD)),
  };
}

// Accepts a boolean (the binary drills), an FSRS grade 1-4, or a confidence
// 1-5 via { confidence }. Returns a new card — never mutates.
export function applyGrade(card, correct, opts = {}) {
  // The pre-1.2.0 signature was applyGrade(card, correct, now). Accepting a
  // bare number here keeps every existing call site — and the saved sessions
  // that replay through them — working, rather than silently scheduling
  // everything at the current time.
  if (typeof opts === "number") opts = { now: opts };
  const settings = normalizeSettings(opts.settings);
  const grade =
    typeof opts.confidence === "number"
      ? fsrs.gradeFromConfidence(opts.confidence)
      : typeof correct === "number"
        ? correct
        : fsrs.gradeFromCorrect(correct);

  const next = {
    ...card,
    ...fsrs.schedule(card, grade, {
      now: opts.now || Date.now(),
      params: settings.params,
      desiredRetention: settings.desiredRetention,
    }),
  };
  // A card that keeps coming back wrong is a card the schedule cannot fix;
  // leech.js decides what to do about it rather than burying the rule here.
  return leech.applyLeechPolicy(next, { threshold: settings.leechThreshold });
}

// Did this answer push the card past its personal best? Unchanged in meaning:
// the reward is for reaching a box you have never held, so re-climbing pays
// nothing and there is no XP in deliberately failing a strong card.
export function isLevelUp(card, correct, opts = {}) {
  if (typeof opts === "number") opts = { now: opts };
  const grade =
    typeof opts.confidence === "number"
      ? fsrs.gradeFromConfidence(opts.confidence)
      : typeof correct === "number"
        ? correct
        : fsrs.gradeFromCorrect(correct);
  if (grade === fsrs.AGAIN) return false;
  const settings = normalizeSettings(opts.settings);
  const projected = fsrs.schedule(card, grade, {
    now: opts.now || Date.now(),
    params: settings.params,
    desiredRetention: settings.desiredRetention,
  });
  return projected.srsBox > (card.srsPeak || card.srsBox || 0);
}

// A buried leech is not due even when its timestamp says so — that is the
// whole point of burying it.
export const isDue = (card, now = Date.now()) =>
  !leech.isSuspended(card) && (card.srsDue == null || card.srsDue <= now);

// What the app shows next to a card: how long until it comes back.
export function nextIntervalDays(card, settings) {
  const s = normalizeSettings(settings);
  if (!fsrs.hasMemoryState(card)) return null;
  return fsrs.intervalFor(card.fsrsStability, s.desiredRetention, s.params);
}

// Probability the user would recall this card right now. Drives the retention
// figures in Statistics and the "at risk" sort in the card list.
export function recallProbability(card, now = Date.now(), settings) {
  const s = normalizeSettings(settings);
  if (!fsrs.hasMemoryState(card)) return null;
  const elapsedDays = card.fsrsLastReview ? (now - card.fsrsLastReview) / fsrs.DAY_MS : 0;
  return fsrs.retrievability(card.fsrsStability, elapsedDays, s.params);
}

// Applies the daily limits to a due queue. New cards and reviews are capped
// separately because they cost different amounts of attention, and reviews are
// served first: falling behind on reviews is how a backlog becomes unrecoverable,
// while a new card deferred is simply a new card met tomorrow.
export function applyDailyLimits(cards, settings, now = Date.now()) {
  const s = normalizeSettings(settings);
  const due = (cards || []).filter((c) => isDue(c, now));
  const isNew = (c) => c.srsDue == null && !fsrs.hasMemoryState(c);
  const reviews = due.filter((c) => !isNew(c)).slice(0, s.reviewsPerDay || Infinity);
  const fresh = due.filter(isNew).slice(0, s.newPerDay || Infinity);
  return [...reviews, ...fresh];
}
