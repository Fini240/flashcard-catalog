import { describe, it, expect } from "vitest";
import { applyGrade, isLevelUp, isDue, SRS_INTERVAL_DAYS, DAY_MS } from "./srs";

const NOW = 1_700_000_000_000; // fixed point in time for deterministic tests

describe("applyGrade", () => {
  it("promotes a new card to box 1 and schedules it 1 day out", () => {
    const card = { id: "a" };
    const next = applyGrade(card, true, NOW);
    expect(next.srsBox).toBe(1);
    expect(next.srsDue).toBe(NOW + 1 * DAY_MS);
    expect(next.srsPeak).toBe(1);
  });

  it("climbs one box per correct answer through the whole ladder", () => {
    let card = { id: "a" };
    for (let i = 1; i <= 5; i++) card = applyGrade(card, true, NOW);
    expect(card.srsBox).toBe(5);
    expect(card.srsDue).toBe(NOW + 30 * DAY_MS);
  });

  it("never exceeds the top box", () => {
    let card = { id: "a", srsBox: 5, srsPeak: 5 };
    card = applyGrade(card, true, NOW);
    expect(card.srsBox).toBe(5);
  });

  it("drops a wrong answer one box, not back to the start", () => {
    const card = { id: "a", srsBox: 3, srsPeak: 3, srsDue: NOW + 7 * DAY_MS };
    const next = applyGrade(card, false, NOW);
    expect(next.srsBox).toBe(2);
  });

  // The step-down is about strength, not scheduling: a card you just got wrong
  // has to come back now, or a miss at box 5 would buy it a fortnight off.
  it("brings a missed card back immediately, whatever box it lands in", () => {
    [1, 2, 3, 4, 5].forEach((box) => {
      expect(applyGrade({ id: "a", srsBox: box }, false, NOW).srsDue).toBe(NOW);
    });
  });

  it("can't go below the first box", () => {
    expect(applyGrade({ id: "a", srsBox: 0 }, false, NOW).srsBox).toBe(0);
    expect(applyGrade({ id: "a" }, false, NOW).srsBox).toBe(0);
  });

  it("steps down again on a second miss, so repeated failures still bottom out", () => {
    let card = { id: "a", srsBox: 3, srsPeak: 3 };
    card = applyGrade(card, false, NOW);
    expect(card.srsBox).toBe(2);
    card = applyGrade(card, false, NOW);
    expect(card.srsBox).toBe(1);
    card = applyGrade(card, false, NOW);
    expect(card.srsBox).toBe(0);
  });

  it("a wrong answer keeps the peak, so re-climbing doesn't count as new", () => {
    let card = { id: "a", srsBox: 4, srsPeak: 4 };
    card = applyGrade(card, false, NOW);
    expect(card.srsPeak).toBe(4);
    card = applyGrade(card, true, NOW);
    expect(card.srsBox).toBe(4);
    expect(card.srsPeak).toBe(4);
  });

  it("a card recovered after one miss is scheduled by its restored box", () => {
    // missed at 4 → 3, answered right → back to 4, so 14 days rather than the
    // single day a reset-to-zero card would have earned
    let card = { id: "a", srsBox: 4, srsPeak: 4 };
    card = applyGrade(card, false, NOW);
    card = applyGrade(card, true, NOW);
    expect(card.srsDue).toBe(NOW + 14 * DAY_MS);
  });

  it("does not mutate the original card", () => {
    const card = { id: "a", srsBox: 2 };
    applyGrade(card, true, NOW);
    expect(card.srsBox).toBe(2);
  });
});

describe("isLevelUp", () => {
  it("is true only when the answer passes the card's personal best", () => {
    expect(isLevelUp({ srsBox: 0 }, true)).toBe(true);
    expect(isLevelUp({ srsBox: 2, srsPeak: 4 }, true)).toBe(false); // re-climb
    expect(isLevelUp({ srsBox: 4, srsPeak: 4 }, true)).toBe(true); // 4 -> 5 is new
    expect(isLevelUp({ srsBox: 2 }, false)).toBe(false);
  });

  it("is false at the ceiling when the card is already maxed", () => {
    expect(isLevelUp({ srsBox: 5, srsPeak: 5 }, true)).toBe(false);
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

describe("interval ladder", () => {
  it("matches the documented 1/3/7/14/30 schedule", () => {
    expect(SRS_INTERVAL_DAYS).toEqual([0, 1, 3, 7, 14, 30]);
  });
});
