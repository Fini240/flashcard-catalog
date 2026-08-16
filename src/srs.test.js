import { describe, it, expect } from "vitest";
import { applyGrade, isLevelUp, isDue, applyDailyLimits, nextIntervalDays, recallProbability, SRS_INTERVAL_DAYS, DAY_MS } from "./srs";

const NOW = 1_700_000_000_000; // fixed point in time for deterministic tests

// These tests changed shape in 1.2.0, when scheduling moved from fixed Leitner
// intervals to FSRS (see fsrs.js). The assertions that used to pin exact days
// — "box 3 means exactly 7 days" — are gone on purpose: the interval is now
// computed per card from its own history, and pinning it would be asserting
// the algorithm's arithmetic rather than the app's behaviour. fsrs.test.js
// covers the maths. What stays here is every behavioural promise the app makes
// to the user, all of which survived the change.
describe("applyGrade", () => {
  it("schedules a correct new card into the future and records a peak", () => {
    const next = applyGrade({ id: "a" }, true, NOW);
    expect(next.srsDue).toBeGreaterThan(NOW);
    expect(next.srsBox).toBeGreaterThanOrEqual(1);
    expect(next.srsPeak).toBe(next.srsBox);
  });

  it("pushes the interval further out with each correct answer", () => {
    let card = { id: "a" };
    let previous = 0;
    for (let i = 1; i <= 5; i++) {
      // Answer each review when it comes due, which is how a real user meets it.
      const at = previous ? previous : NOW;
      card = applyGrade(card, true, { now: at });
      const interval = card.srsDue - at;
      expect(interval).toBeGreaterThan(previous ? previous - at : 0);
      previous = card.srsDue;
    }
    expect(card.srsBox).toBe(5);
  });

  it("never exceeds the top box", () => {
    let card = { id: "a", srsBox: 5, srsPeak: 5, fsrsStability: 400, fsrsDifficulty: 5, fsrsLastReview: NOW - 400 * DAY_MS };
    card = applyGrade(card, true, { now: NOW });
    expect(card.srsBox).toBe(5);
  });

  it("weakens a missed card without dropping it to the floor", () => {
    const card = { id: "a", fsrsStability: 20, fsrsDifficulty: 5, fsrsLastReview: NOW - 20 * DAY_MS, srsBox: 4, srsPeak: 4 };
    const next = applyGrade(card, false, { now: NOW });
    expect(next.fsrsStability).toBeLessThan(20);
    // Still stronger than a card that was never known — the point of the
    // step-down over a reset.
    expect(next.fsrsStability).toBeGreaterThan(applyGrade({ id: "b" }, false, { now: NOW }).fsrsStability);
  });

  // The step-down is about strength, not scheduling: a card you just got wrong
  // has to come back now, or a miss on a strong card would buy it a fortnight off.
  it("brings a missed card back immediately, however strong it was", () => {
    [1, 2, 3, 4, 5].forEach((box) => {
      const card = { id: "a", srsBox: box, fsrsStability: box * 8, fsrsDifficulty: 5, fsrsLastReview: NOW - DAY_MS };
      expect(applyGrade(card, false, { now: NOW }).srsDue).toBe(NOW);
    });
  });

  it("can't go below the first box", () => {
    expect(applyGrade({ id: "a", srsBox: 0 }, false, NOW).srsBox).toBe(0);
    expect(applyGrade({ id: "a" }, false, NOW).srsBox).toBe(0);
  });

  it("keeps weakening on repeated misses, so failures still bottom out", () => {
    let card = { id: "a", fsrsStability: 30, fsrsDifficulty: 5, fsrsLastReview: NOW - 30 * DAY_MS, srsBox: 5, srsPeak: 5 };
    let last = card.fsrsStability;
    for (let i = 1; i <= 3; i++) {
      card = applyGrade(card, false, { now: NOW + i * 60 * 60 * 1000 });
      expect(card.fsrsStability).toBeLessThanOrEqual(last);
      last = card.fsrsStability;
    }
    expect(card.srsBox).toBeLessThan(5);
  });

  it("a wrong answer keeps the peak, so re-climbing doesn't count as new", () => {
    let card = { id: "a", srsBox: 4, srsPeak: 4, fsrsStability: 15, fsrsDifficulty: 5, fsrsLastReview: NOW - 15 * DAY_MS };
    card = applyGrade(card, false, { now: NOW });
    expect(card.srsPeak).toBe(4);
  });

  it("does not mutate the original card", () => {
    const card = { id: "a", srsBox: 2 };
    applyGrade(card, true, NOW);
    expect(card.srsBox).toBe(2);
    expect(card.fsrsStability).toBeUndefined();
  });

  // The old signature was applyGrade(card, correct, now). Callers and stored
  // sessions still use it.
  it("accepts a bare timestamp as the third argument", () => {
    const positional = applyGrade({ id: "a" }, true, NOW);
    const named = applyGrade({ id: "a" }, true, { now: NOW });
    expect(positional.srsDue).toBe(named.srsDue);
    expect(positional.fsrsLastReview).toBe(NOW);
  });

  it("accepts a 1-5 confidence rating instead of a boolean", () => {
    const shaky = applyGrade({ id: "a" }, null, { now: NOW, confidence: 3 });
    const solid = applyGrade({ id: "a" }, null, { now: NOW, confidence: 5 });
    expect(solid.srsDue).toBeGreaterThan(shaky.srsDue);
    expect(applyGrade({ id: "a" }, null, { now: NOW, confidence: 1 }).srsDue).toBe(NOW);
  });

  it("honours a higher desired retention with shorter intervals", () => {
    const card = { id: "a", fsrsStability: 30, fsrsDifficulty: 5, fsrsLastReview: NOW - 30 * DAY_MS };
    const relaxed = applyGrade(card, true, { now: NOW, settings: { desiredRetention: 0.8 } });
    const strict = applyGrade(card, true, { now: NOW, settings: { desiredRetention: 0.97 } });
    expect(strict.srsDue).toBeLessThan(relaxed.srsDue);
  });
});

// A card whose history predates FSRS must not lose the standing it had.
describe("migration from the Leitner ladder", () => {
  it("credits a veteran's correct answer instead of pinning it to its old box", () => {
    const veteran = { id: "a", srsBox: 4, srsPeak: 4, srsDue: NOW - DAY_MS };
    const next = applyGrade(veteran, true, { now: NOW });
    expect(next.srsBox).toBeGreaterThanOrEqual(4);
    expect(next.srsDue - NOW).toBeGreaterThan(14 * DAY_MS);
  });

  it("does not send a strong old card back among cards never seen", () => {
    const veteran = applyGrade({ id: "a", srsBox: 5, srsDue: NOW - DAY_MS }, false, { now: NOW });
    const fresh = applyGrade({ id: "b" }, false, { now: NOW });
    expect(veteran.fsrsStability).toBeGreaterThan(fresh.fsrsStability);
  });
});

describe("isLevelUp", () => {
  it("is true only when the answer passes the card's personal best", () => {
    expect(isLevelUp({ srsBox: 0 }, true)).toBe(true);
    // `now` has to be passed here: NOW is a fixed 2023 timestamp, so without it
    // the card reads as years overdue and earns a genuine (correct) jump past
    // its peak — which would be testing the clock rather than the re-climb rule.
    expect(isLevelUp({ srsBox: 2, srsPeak: 4, srsDue: NOW }, true, { now: NOW })).toBe(false);
    expect(isLevelUp({ srsBox: 2 }, false)).toBe(false);
  });

  it("is false at the ceiling when the card is already maxed", () => {
    const maxed = { srsBox: 5, srsPeak: 5, fsrsStability: 300, fsrsDifficulty: 5, fsrsLastReview: NOW };
    expect(isLevelUp(maxed, true)).toBe(false);
  });
});

describe("isDue", () => {
  it("treats cards with no srsDue as due (brand new)", () => {
    expect(isDue({ id: "a" }, NOW)).toBe(true);
  });
  it("is due exactly at and after srsDue, not before", () => {
    expect(isDue({ srsDue: NOW }, NOW)).toBe(true);
    expect(isDue({ srsDue: NOW - 1 }, NOW)).toBe(true);
    expect(isDue({ srsDue: NOW + 1 }, NOW)).toBe(false);
  });

  it("does not surface a suspended leech, whatever its timestamp says", () => {
    expect(isDue({ srsDue: NOW - DAY_MS, leechSuspended: true }, NOW)).toBe(false);
  });

  // Regression: isDue takes (card, now). Array.filter calls its callback as
  // (element, index, array), so `cards.filter(isDue)` passed the *index* as
  // `now` — 0 for the first card, 1 for the second. Every card with a real
  // srsDue then compared `srsDue <= 0` and reported as not due, so study
  // queues and every due count returned only brand-new cards. Call sites must
  // wrap it: `cards.filter(c => isDue(c))`.
  it("selects overdue cards when filtered the correct way", () => {
    const cards = [{ srsDue: NOW - 1000 }, { srsDue: NOW - 2000 }, { srsDue: NOW + DAY_MS }];
    expect(cards.filter(c => isDue(c, NOW))).toHaveLength(2);
    expect(cards.filter(c => isDue(c, NOW)).map(c => c.srsDue)).toEqual([NOW - 1000, NOW - 2000]);
  });
});

describe("daily limits", () => {
  const review = (i) => ({ id: `r${i}`, srsDue: NOW - DAY_MS, fsrsStability: 5, fsrsDifficulty: 5, fsrsLastReview: NOW - 5 * DAY_MS });
  const fresh = (i) => ({ id: `n${i}` });

  it("caps new cards and reviews separately", () => {
    const cards = [...Array(50)].map((_, i) => review(i)).concat([...Array(50)].map((_, i) => fresh(i)));
    const out = applyDailyLimits(cards, { newPerDay: 5, reviewsPerDay: 10 }, NOW);
    expect(out.filter((c) => c.id.startsWith("r"))).toHaveLength(10);
    expect(out.filter((c) => c.id.startsWith("n"))).toHaveLength(5);
  });

  // Reviews before new cards: a review backlog compounds, a deferred new card
  // is just a card met tomorrow.
  it("serves reviews before new cards", () => {
    const out = applyDailyLimits([fresh(1), review(1)], { newPerDay: 5, reviewsPerDay: 5 }, NOW);
    expect(out[0].id).toBe("r1");
  });

  it("treats a zero limit as unlimited rather than blocking study entirely", () => {
    const cards = [...Array(30)].map((_, i) => review(i));
    expect(applyDailyLimits(cards, { reviewsPerDay: 0, newPerDay: 0 }, NOW)).toHaveLength(30);
  });
});

describe("card-facing predictions", () => {
  it("reports no interval or probability for a card FSRS has never seen", () => {
    expect(nextIntervalDays({ id: "a" })).toBeNull();
    expect(recallProbability({ id: "a" })).toBeNull();
  });

  it("reports a falling recall probability as a card ages", () => {
    const card = { fsrsStability: 10, fsrsDifficulty: 5, fsrsLastReview: NOW };
    const fresh = recallProbability(card, NOW + DAY_MS);
    const stale = recallProbability(card, NOW + 40 * DAY_MS);
    expect(fresh).toBeGreaterThan(stale);
    expect(recallProbability(card, NOW + 10 * DAY_MS)).toBeCloseTo(0.9, 3);
  });
});

describe("legacy ladder constant", () => {
  // Still exported: the migration reconstructs stability from these, and the
  // card list uses them for the "was" column. Nothing schedules from them.
  it("matches the documented 1/3/7/14/30 schedule", () => {
    expect(SRS_INTERVAL_DAYS).toEqual([0, 1, 3, 7, 14, 30]);
  });
});
