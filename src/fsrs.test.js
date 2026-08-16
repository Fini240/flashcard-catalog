import { describe, it, expect } from "vitest";
import * as F from "./fsrs";

const DAY = F.DAY_MS;

describe("forgetting curve", () => {
  it("is 1.0 at zero elapsed time", () => {
    expect(F.retrievability(10, 0)).toBeCloseTo(1, 6);
  });

  // The invariant the whole model rests on: stability IS the 90%-retention
  // interval. If this drifts, every interval the app shows is a different
  // promise than the one documented.
  it("is exactly 0.9 when elapsed equals stability", () => {
    for (const s of [0.5, 1, 7, 30, 365]) {
      expect(F.retrievability(s, s)).toBeCloseTo(0.9, 6);
    }
  });

  it("decreases with time and increases with stability", () => {
    expect(F.retrievability(10, 20)).toBeLessThan(F.retrievability(10, 5));
    expect(F.retrievability(50, 20)).toBeGreaterThan(F.retrievability(10, 20));
  });

  it("round-trips through intervalFor", () => {
    for (const s of [1, 7, 100]) {
      const i = F.intervalFor(s, 0.9);
      expect(i).toBeCloseTo(s, 4);
      expect(F.retrievability(s, i)).toBeCloseTo(0.9, 4);
    }
  });

  it("gives shorter intervals for higher desired retention", () => {
    expect(F.intervalFor(30, 0.97)).toBeLessThan(F.intervalFor(30, 0.85));
  });
});

describe("scheduling a brand new card", () => {
  const fresh = { id: "a" };

  it("seeds stability from the grade, hardest to easiest", () => {
    const again = F.schedule(fresh, F.AGAIN);
    const good = F.schedule(fresh, F.GOOD);
    const easy = F.schedule(fresh, F.EASY);
    expect(again.fsrsStability).toBeLessThan(good.fsrsStability);
    expect(good.fsrsStability).toBeLessThan(easy.fsrsStability);
  });

  it("sends a failed card back into this session, not into the future", () => {
    const now = Date.now();
    const out = F.schedule(fresh, F.AGAIN, { now });
    expect(out.srsDue).toBe(now);
    expect(out.intervalDays).toBe(0);
  });

  it("counts a lapse only when the answer was wrong", () => {
    expect(F.schedule(fresh, F.AGAIN).fsrsLapses).toBe(1);
    expect(F.schedule(fresh, F.GOOD).fsrsLapses).toBe(0);
    expect(F.schedule(fresh, F.GOOD).fsrsReps).toBe(1);
  });
});

describe("scheduling a card with history", () => {
  const now = Date.now();
  const card = {
    fsrsStability: 10,
    fsrsDifficulty: 5,
    fsrsLastReview: now - 10 * DAY,
    fsrsReps: 3,
    fsrsLapses: 0,
  };

  it("grows stability on success and shrinks it on a lapse", () => {
    expect(F.schedule(card, F.GOOD, { now }).fsrsStability).toBeGreaterThan(10);
    expect(F.schedule(card, F.AGAIN, { now }).fsrsStability).toBeLessThan(10);
  });

  it("never lets a lapse increase the interval", () => {
    for (const s of [0.5, 5, 50, 500]) {
      const lapsed = F.schedule({ ...card, fsrsStability: s }, F.AGAIN, { now });
      expect(lapsed.fsrsStability).toBeLessThanOrEqual(s);
    }
  });

  // The headline behaviour that a fixed ladder cannot express: succeeding on a
  // card you had nearly forgotten is worth more than succeeding on one you
  // just saw.
  it("rewards a late success more than an early one", () => {
    const early = F.schedule({ ...card, fsrsLastReview: now - 2 * DAY }, F.GOOD, { now });
    const late = F.schedule({ ...card, fsrsLastReview: now - 25 * DAY }, F.GOOD, { now });
    expect(late.fsrsStability).toBeGreaterThan(early.fsrsStability);
  });

  it("orders stability growth by grade", () => {
    const hard = F.schedule(card, F.HARD, { now }).fsrsStability;
    const good = F.schedule(card, F.GOOD, { now }).fsrsStability;
    const easy = F.schedule(card, F.EASY, { now }).fsrsStability;
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it("moves difficulty down on easy and up on again", () => {
    expect(F.schedule(card, F.EASY, { now }).fsrsDifficulty).toBeLessThan(5);
    expect(F.schedule(card, F.AGAIN, { now }).fsrsDifficulty).toBeGreaterThan(5);
  });

  it("keeps difficulty inside 1..10 under sustained failure and sustained success", () => {
    let c = { ...card };
    for (let i = 0; i < 50; i++) c = { ...c, ...F.schedule(c, F.AGAIN, { now: now + i * DAY }) };
    expect(c.fsrsDifficulty).toBeLessThanOrEqual(10);
    expect(c.fsrsDifficulty).toBeGreaterThanOrEqual(1);
    let e = { ...card };
    for (let i = 0; i < 50; i++) e = { ...e, ...F.schedule(e, F.EASY, { now: now + i * 100 * DAY }) };
    expect(e.fsrsDifficulty).toBeGreaterThanOrEqual(1);
    expect(e.fsrsDifficulty).toBeLessThanOrEqual(10);
  });

  it("caps the interval so one lucky streak can't park a card for a century", () => {
    let c = { ...card };
    for (let i = 0; i < 40; i++) {
      c = { ...c, ...F.schedule(c, F.EASY, { now: now + i * 500 * DAY }) };
    }
    expect(c.intervalDays).toBeLessThanOrEqual(F.MAX_INTERVAL_DAYS);
  });

  it("treats a repeat inside the hour as a same-day review", () => {
    const justNow = { ...card, fsrsLastReview: now - 60 * 1000 };
    const out = F.schedule(justNow, F.GOOD, { now });
    // The long-term formula would barely move S here (R ≈ 1); the short-term
    // branch must still make progress rather than stalling.
    expect(out.fsrsStability).toBeGreaterThanOrEqual(card.fsrsStability);
  });
});

describe("migration from Leitner boxes", () => {
  it("reads an existing box as the stability that box implied", () => {
    expect(F.initialFrom({ srsBox: 0 }).stability).toBeCloseTo(0.5, 6);
    expect(F.initialFrom({ srsBox: 3 }).stability).toBeCloseTo(7, 6);
    expect(F.initialFrom({ srsBox: 5 }).stability).toBeCloseTo(30, 6);
  });

  it("keeps a long-known card long-known on its first FSRS review", () => {
    const veteran = { srsBox: 5, srsDue: Date.now() - DAY };
    const out = F.schedule(veteran, F.GOOD);
    // It must not be dropped back among cards never seen before.
    expect(out.fsrsStability).toBeGreaterThan(10);
    expect(out.srsBox).toBeGreaterThanOrEqual(4);
  });

  it("does not treat a veteran's lapse as a fresh card's first look", () => {
    const veteran = { srsBox: 5, srsDue: Date.now() - DAY };
    const lapsed = F.schedule(veteran, F.AGAIN);
    const brandNew = F.schedule({}, F.AGAIN);
    expect(lapsed.fsrsStability).toBeGreaterThan(brandNew.fsrsStability);
  });

  it("projects stability back onto boxes at the old ladder's thresholds", () => {
    expect(F.boxForStability(0.5)).toBe(0);
    expect(F.boxForStability(2)).toBe(1);
    expect(F.boxForStability(5)).toBe(2);
    expect(F.boxForStability(10)).toBe(3);
    expect(F.boxForStability(20)).toBe(4);
    expect(F.boxForStability(200)).toBe(5);
  });

  it("never lowers srsPeak", () => {
    const out = F.schedule({ srsPeak: 5, fsrsStability: 1, fsrsDifficulty: 5, fsrsLastReview: Date.now() }, F.AGAIN);
    expect(out.srsPeak).toBe(5);
  });
});

describe("grade mapping", () => {
  it("maps binary correctness onto Good and Again", () => {
    expect(F.gradeFromCorrect(true)).toBe(F.GOOD);
    expect(F.gradeFromCorrect(false)).toBe(F.AGAIN);
  });

  it("maps a 1-5 confidence dial across the full grade range", () => {
    expect(F.gradeFromConfidence(1)).toBe(F.AGAIN);
    expect(F.gradeFromConfidence(2)).toBe(F.AGAIN);
    expect(F.gradeFromConfidence(3)).toBe(F.HARD);
    expect(F.gradeFromConfidence(4)).toBe(F.GOOD);
    expect(F.gradeFromConfidence(5)).toBe(F.EASY);
  });

  it("clamps nonsense input instead of producing an invalid grade", () => {
    expect(F.gradeFromConfidence(0)).toBe(F.AGAIN);
    expect(F.gradeFromConfidence(99)).toBe(F.EASY);
  });
});

describe("parameter optimisation", () => {
  it("refuses to fit on too little evidence", () => {
    const out = F.optimizeParameters([{ stability: 5, elapsedDays: 5, correct: true }]);
    expect(out.fitted).toBe(false);
    expect(out.reason).toBe("not-enough-reviews");
    expect(out.params).toEqual(F.DEFAULT_PARAMS);
  });

  // Generate a log from a known decay and check the optimiser recovers it —
  // the only honest test of a fitter is whether it finds a planted answer.
  it("recovers the decay that generated the log", () => {
    const truth = [...F.DEFAULT_PARAMS];
    truth[20] = 0.45;
    const log = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 4000; i++) {
      const stability = 1 + rand() * 60;
      const elapsedDays = rand() * 120;
      const p = F.retrievability(stability, elapsedDays, truth);
      log.push({ stability, elapsedDays, correct: rand() < p });
    }
    const out = F.optimizeParameters(log);
    expect(out.fitted).toBe(true);
    expect(out.params[20]).toBeGreaterThan(0.35);
    expect(out.params[20]).toBeLessThan(0.55);
  });

  it("reports calibration only once there is enough to report", () => {
    expect(F.calibration([{ stability: 1, elapsedDays: 1, correct: true }])).toBeNull();
    const log = Array.from({ length: 100 }, () => ({ stability: 10, elapsedDays: 10, correct: true }));
    const c = F.calibration(log);
    expect(c.reviews).toBe(100);
    expect(c.actual).toBe(1);
    expect(c.predicted).toBeCloseTo(0.9, 2);
  });
});
