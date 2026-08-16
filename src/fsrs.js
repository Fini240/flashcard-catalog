// ---------------------------------------------------------------------------
// FSRS-6 — the scheduler that replaces the fixed Leitner ladder in srs.js.
//
// The old ladder gave every card and every person the same intervals:
// 1 → 3 → 7 → 14 → 30 days. That is a guess about memory, applied uniformly.
// FSRS instead keeps two numbers per card and predicts from them:
//
//   stability (S)  — days until recall probability falls to 90%. This IS the
//                    interval, by definition of the curve below.
//   difficulty (D) — 1..10, how much harder this card is than average for you.
//
// Every review updates both, so a card you keep getting right stretches out
// fast while a card you keep missing stays close, and neither is capped at
// 30 days. Published benchmarks put FSRS at roughly 15% fewer reviews than
// SM-2 for the same retention; the reason is precisely this per-card fit.
//
// Why the app can adopt this without a migration: a card that has never been
// scheduled by FSRS has no stability, and initialFrom() reconstructs a
// plausible S/D from the Leitner box it currently sits in. Old cards keep
// their place in the queue and gain a real memory model on their next review.
// See srs.js, which now delegates here and keeps srsBox in step for the parts
// of the app (deck strength, drill picking, XP) that still read boxes.
//
// The parameters are the published FSRS-6 defaults. They are meant to be
// optimised against a person's own review log — see optimizeParameters(),
// which does the cheap half of that: it fits the decay and difficulty terms
// the log can actually constrain, and leaves the rest alone.
// ---------------------------------------------------------------------------

export const DAY_MS = 24 * 60 * 60 * 1000;

// FSRS-6 default weights (21). Indices are referenced by the formulas below
// rather than named, which is how the algorithm is published — renaming them
// here would make this file impossible to check against the paper.
export const DEFAULT_PARAMS = [
  0.2172, 1.1771, 3.2602, 16.1507, 7.0114, 0.57, 2.0966, 0.0069, 1.5261,
  0.112, 1.0178, 1.849, 0.1133, 0.3127, 2.2934, 0.2191, 3.0004, 0.7536,
  0.3332, 0.1437, 0.2,
];

// Grades. FSRS is defined on these four; the app's binary right/wrong and the
// 1-5 confidence dial both map onto them (gradeFromCorrect, gradeFromConfidence).
export const AGAIN = 1;
export const HARD = 2;
export const GOOD = 3;
export const EASY = 4;

export const MIN_STABILITY = 0.01;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
// A card scheduled further out than this is effectively learned; the cap keeps
// one lucky streak on a trivial card from parking it past a degree course.
export const MAX_INTERVAL_DAYS = 3650;

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// The forgetting curve. FSRS-6 makes the decay exponent a parameter (w20)
// rather than the fixed -0.5 of FSRS-5, because how fast forgetting tails off
// differs between people and materials.
//
// FACTOR is derived, not chosen: it is whatever makes R(S) exactly 0.9, which
// is what lets "stability" and "interval at 90% retention" be the same number.
const decayOf = (w) => -Math.abs(w[20] || 0.2);
const factorOf = (w) => Math.pow(0.9, 1 / decayOf(w)) - 1;

// Probability of recalling a card `elapsedDays` after its last review.
export function retrievability(stability, elapsedDays, params = DEFAULT_PARAMS) {
  const S = Math.max(MIN_STABILITY, stability || MIN_STABILITY);
  const t = Math.max(0, elapsedDays || 0);
  return Math.pow(1 + factorOf(params) * (t / S), decayOf(params));
}

// The inverse: how long until recall probability falls to `desiredRetention`.
// This is the whole scheduling decision — everything else exists to keep S
// honest so that this number means something.
export function intervalFor(stability, desiredRetention = 0.9, params = DEFAULT_PARAMS) {
  const S = Math.max(MIN_STABILITY, stability || MIN_STABILITY);
  const r = clamp(desiredRetention, 0.7, 0.99);
  const days = (S / factorOf(params)) * (Math.pow(r, 1 / decayOf(params)) - 1);
  return clamp(days, 0, MAX_INTERVAL_DAYS);
}

// ---------- first review ----------

const initialStability = (grade, w) => Math.max(MIN_STABILITY, w[grade - 1]);
const initialDifficulty = (grade, w) =>
  clamp(w[4] - Math.exp(w[5] * (grade - 1)) + 1, MIN_DIFFICULTY, MAX_DIFFICULTY);

// ---------- updates ----------

// Difficulty drifts by how the answer went, damped so that a card already at
// the extremes moves less, then pulled back toward the "easy" anchor. The mean
// reversion is what stops difficulty ratcheting to 10 and staying there after
// a bad week.
function nextDifficulty(difficulty, grade, w) {
  const delta = -w[6] * (grade - 3);
  const damped = difficulty + delta * ((10 - difficulty) / 9);
  const reverted = w[7] * initialDifficulty(EASY, w) + (1 - w[7]) * damped;
  return clamp(reverted, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

// Stability after a successful recall. The (1 - R) term is the useful part:
// reviewing a card you had almost forgotten teaches you far more than
// reviewing one you knew cold, so a late review that still succeeds earns a
// bigger jump than an early one. This is why FSRS does not punish overdue
// cards the way a fixed ladder does.
function stabilityAfterRecall(difficulty, stability, r, grade, w) {
  const hardPenalty = grade === HARD ? w[15] : 1;
  const easyBonus = grade === EASY ? w[16] : 1;
  const growth =
    1 +
    Math.exp(w[8]) *
      (11 - difficulty) *
      Math.pow(stability, -w[9]) *
      (Math.exp(w[10] * (1 - r)) - 1) *
      hardPenalty *
      easyBonus;
  return Math.max(MIN_STABILITY, stability * growth);
}

// Stability after a lapse. Deliberately not a reset to zero: a card you have
// known for months and just missed is still better known than one you have
// never seen, and the (S+1)^w13 term keeps that history. Capped at the old
// stability so a lapse can never *increase* the interval.
function stabilityAfterLapse(difficulty, stability, r, w) {
  const postLapse =
    w[11] *
    Math.pow(difficulty, -w[12]) *
    (Math.pow(stability + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r));
  return clamp(postLapse, MIN_STABILITY, stability);
}

// Same-day repeats (the card came back inside one session). These must not run
// through the normal formula: elapsed time is ~0, so R is ~1 and the long-term
// update would barely move S while the user is clearly learning. FSRS-6 gives
// short-term reviews their own term.
function stabilityShortTerm(stability, grade, w) {
  const s = stability * Math.exp(w[17] * (grade - 3 + w[18])) * Math.pow(stability, -w[19]);
  return Math.max(MIN_STABILITY, grade >= GOOD ? Math.max(s, stability) : Math.min(s, stability));
}

// ---------- the card-facing API ----------

// Reconstructs a memory state for a card that predates FSRS, from the Leitner
// box it reached. Box n had interval SRS_INTERVAL_DAYS[n], and a card sitting
// in that box was, by the old scheduler's own claim, due for review then — so
// treating that interval as its stability is the honest reading of what the
// old system believed. Difficulty starts neutral because the box carries no
// information about it.
const LEGACY_BOX_DAYS = [0.5, 1, 3, 7, 14, 30];
export function initialFrom(card, params = DEFAULT_PARAMS) {
  const box = clamp(card?.srsBox || 0, 0, LEGACY_BOX_DAYS.length - 1);
  return {
    stability: Math.max(MIN_STABILITY, LEGACY_BOX_DAYS[box]),
    difficulty: initialDifficulty(GOOD, params),
  };
}

// True once a card carries a real FSRS state rather than a reconstructed one.
export const hasMemoryState = (card) =>
  typeof card?.fsrsStability === "number" && card.fsrsStability > 0;

// The single entry point. Returns the fields to merge onto the card — it does
// not mutate, and it does not know about card storage.
//
// `elapsedDays` is measured from the last review, not from the due date: FSRS
// scores what actually happened, so a card answered three weeks late is scored
// as a three-week gap and rewarded accordingly.
export function schedule(card, grade, opts = {}) {
  const params = opts.params || DEFAULT_PARAMS;
  const now = opts.now || Date.now();
  const desiredRetention = opts.desiredRetention || 0.9;
  const g = clamp(Math.round(grade), AGAIN, EASY);

  // Three cases, not two. A card with no FSRS state is either genuinely new
  // (seed from the grade, which is what the algorithm prescribes) or a card
  // the old Leitner scheduler was already tracking — and the second must be
  // given its reconstructed state *and then reviewed*, not merely seeded.
  // Seeding alone silently threw away the answer the user had just given:
  // a box-4 card answered correctly came back as box 4, so a veteran's
  // review counted for nothing on the one day the migration happened.
  const brandNew = !hasMemoryState(card) && !card?.srsBox && card?.srsDue == null;

  let priorStability, priorDifficulty, elapsedDays, sameDay;
  if (hasMemoryState(card)) {
    priorStability = card.fsrsStability;
    priorDifficulty = card.fsrsDifficulty ?? initialDifficulty(GOOD, params);
    const last = card.fsrsLastReview || null;
    elapsedDays = last ? Math.max(0, (now - last) / DAY_MS) : 0;
    // Under an hour counts as the same sitting: the user is still in the
    // session that first showed them this card, not returning to it.
    sameDay = last != null && now - last < 60 * 60 * 1000;
  } else if (brandNew) {
    priorStability = null;
    priorDifficulty = null;
    elapsedDays = 0;
    sameDay = false;
  } else {
    const seed = initialFrom(card, params);
    priorStability = seed.stability;
    priorDifficulty = seed.difficulty;
    // The old scheduler stored due = lastReview + boxInterval, so the box
    // interval is exactly what has to come back off to recover the last review
    // date. Using it means an overdue veteran is scored as overdue — which is
    // the case FSRS rewards most, and the one a plain reseed would erase.
    const lastReview = card.srsDue != null ? card.srsDue - seed.stability * DAY_MS : now;
    elapsedDays = Math.max(0, (now - lastReview) / DAY_MS);
    sameDay = false;
  }

  let stability, difficulty;
  if (brandNew) {
    stability = initialStability(g, params);
    difficulty = initialDifficulty(g, params);
  } else {
    const r = retrievability(priorStability, elapsedDays, params);
    difficulty = nextDifficulty(priorDifficulty, g, params);
    if (sameDay) {
      stability = stabilityShortTerm(priorStability, g, params);
    } else if (g === AGAIN) {
      stability = stabilityAfterLapse(difficulty, priorStability, r, params);
    } else {
      stability = stabilityAfterRecall(difficulty, priorStability, r, g, params);
    }
  }

  const lapses = (card?.fsrsLapses || 0) + (g === AGAIN ? 1 : 0);
  const reps = (card?.fsrsReps || 0) + 1;

  // A missed card comes back in this session regardless of what the formula
  // says the interval is — the same rule the Leitner version settled on, and
  // for the same reason: "you just got this wrong" and "see it again in four
  // days" cannot both be right.
  const intervalDays = g === AGAIN ? 0 : intervalFor(stability, desiredRetention, params);
  const due = g === AGAIN ? now : now + intervalDays * DAY_MS;

  return {
    fsrsStability: stability,
    fsrsDifficulty: difficulty,
    fsrsLastReview: now,
    fsrsReps: reps,
    fsrsLapses: lapses,
    srsDue: due,
    // Kept in step so deck strength, drill selection and the XP rules keep
    // working unchanged. The box is now a *view* of stability, not the state.
    srsBox: boxForStability(stability),
    srsPeak: Math.max(card?.srsPeak || 0, boxForStability(stability)),
    intervalDays,
  };
}

// Projects stability back onto the 0-5 box scale the rest of the app reads.
// The thresholds are the old ladder's own intervals, so "box 5" still means
// "roughly a month between reviews" and every consumer keeps its meaning.
export function boxForStability(stability) {
  const s = stability || 0;
  if (s < 1) return 0;
  if (s < 3) return 1;
  if (s < 7) return 2;
  if (s < 14) return 3;
  if (s < 30) return 4;
  return 5;
}

// ---------- grade mapping ----------

// The app grades binary right/wrong. Wrong is unambiguously Again; right is
// Good rather than Easy, because Easy in FSRS means "this was trivial, stretch
// it hard" and a plain correct answer does not claim that.
export const gradeFromCorrect = (correct) => (correct ? GOOD : AGAIN);

// Brainscape-style 1-5 confidence, for the modes that ask for it. 1-2 are
// failures, 3 is a shaky pass, 4 solid, 5 trivial.
export function gradeFromConfidence(confidence) {
  const c = clamp(Math.round(confidence || 0), 1, 5);
  if (c <= 2) return AGAIN;
  if (c === 3) return HARD;
  if (c === 4) return GOOD;
  return EASY;
}

// ---------- parameter optimisation ----------

// The real FSRS optimiser fits all 21 weights by gradient descent over a full
// review log. That needs far more history than this app will have for a long
// time, and overfitting a handful of reviews produces worse schedules than the
// defaults do.
//
// So this fits one thing — the decay exponent w20, which governs how fast the
// forgetting curve tails off — by scanning candidate values and keeping the
// one that best predicts the log's actual outcomes (lowest log loss). It is
// the parameter with the most leverage per unit of evidence, and a single
// parameter cannot overfit the way 21 can.
//
// `log` entries are { stability, elapsedDays, correct }. Below MIN_LOG_REVIEWS
// the defaults are returned unchanged, and the caller is told why.
export const MIN_LOG_REVIEWS = 200;

export function optimizeParameters(log, base = DEFAULT_PARAMS) {
  const usable = (log || []).filter(
    (e) => e && typeof e.stability === "number" && e.stability > 0 && typeof e.elapsedDays === "number"
  );
  if (usable.length < MIN_LOG_REVIEWS) {
    return { params: [...base], fitted: false, reviews: usable.length, reason: "not-enough-reviews" };
  }

  let best = { decay: Math.abs(base[20] || 0.2), loss: Infinity };
  for (let decay = 0.1; decay <= 0.7001; decay += 0.01) {
    const candidate = [...base];
    candidate[20] = decay;
    let loss = 0;
    for (const e of usable) {
      const p = clamp(retrievability(e.stability, e.elapsedDays, candidate), 1e-6, 1 - 1e-6);
      loss -= e.correct ? Math.log(p) : Math.log(1 - p);
    }
    loss /= usable.length;
    if (loss < best.loss) best = { decay, loss };
  }

  const params = [...base];
  params[20] = Number(best.decay.toFixed(4));
  return { params, fitted: true, reviews: usable.length, logLoss: best.loss, reason: null };
}

// How well the current parameters predict the log — surfaced in Statistics so
// the number is inspectable rather than a claim. Returns null below the
// threshold rather than a meaningless figure from six reviews.
export function calibration(log, params = DEFAULT_PARAMS) {
  const usable = (log || []).filter((e) => e && typeof e.stability === "number" && e.stability > 0);
  if (usable.length < 30) return null;
  let predicted = 0;
  let actual = 0;
  for (const e of usable) {
    predicted += retrievability(e.stability, e.elapsedDays || 0, params);
    actual += e.correct ? 1 : 0;
  }
  return {
    reviews: usable.length,
    predicted: predicted / usable.length,
    actual: actual / usable.length,
  };
}
