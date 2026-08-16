import { describe, it, expect } from "vitest";
import * as stats from "./stats";
import * as testMode from "./testMode";
import * as tts from "./tts";
import { DAY_MS } from "./fsrs";

const NOW = new Date("2026-06-15T12:00:00Z").getTime();
const card = (over = {}) => ({
  id: Math.random().toString(36).slice(2),
  front: "f",
  back: "b",
  fsrsStability: 10,
  fsrsDifficulty: 5,
  fsrsLastReview: NOW - 5 * DAY_MS,
  srsDue: NOW + 5 * DAY_MS,
  ...over,
});

describe("forecast", () => {
  it("buckets cards by the day they come due", () => {
    const cards = [card({ srsDue: NOW + 1 * DAY_MS }), card({ srsDue: NOW + 1 * DAY_MS }), card({ srsDue: NOW + 3 * DAY_MS })];
    const f = stats.forecast(cards, 7, NOW);
    expect(f[1].due).toBe(2);
    expect(f[3].due).toBe(1);
    expect(f[2].due).toBe(0);
  });

  // Overdue work is today's problem; charting it in the past would be drawing
  // a history nobody can act on.
  it("folds overdue cards into today and counts them separately", () => {
    const f = stats.forecast([card({ srsDue: NOW - 10 * DAY_MS }), card({ srsDue: NOW - DAY_MS })], 7, NOW);
    expect(f[0].due).toBe(2);
    expect(f[0].overdue).toBe(2);
  });

  it("ignores never-studied and suspended cards", () => {
    const f = stats.forecast([card({ srsDue: null }), card({ srsDue: NOW, leechSuspended: true })], 7, NOW);
    expect(f.reduce((n, b) => n + b.due, 0)).toBe(0);
  });

  it("drops cards beyond the horizon rather than piling them on the last day", () => {
    const f = stats.forecast([card({ srsDue: NOW + 100 * DAY_MS })], 7, NOW);
    expect(f.reduce((n, b) => n + b.due, 0)).toBe(0);
  });
});

describe("daily load", () => {
  // A card seen every 10 days is 0.1 reviews a day. This is the number that
  // answers "what does this deck cost me", which today's due count does not.
  it("is the sum of one-over-stability", () => {
    const cards = [card({ fsrsStability: 10 }), card({ fsrsStability: 10 }), card({ fsrsStability: 20 })];
    expect(stats.dailyLoad(cards)).toBeCloseTo(0.1 + 0.1 + 0.05, 6);
  });

  it("rises when the user asks for higher retention", () => {
    const cards = [card({ fsrsStability: 10 })];
    expect(stats.dailyLoad(cards, { desiredRetention: 0.97 })).toBeGreaterThan(stats.dailyLoad(cards, { desiredRetention: 0.9 }));
  });

  it("ignores cards with no memory state", () => {
    expect(stats.dailyLoad([{ id: "a" }])).toBe(0);
  });
});

describe("retention", () => {
  const entry = (over = {}) => ({ at: NOW, correct: true, stability: 30, elapsedDays: 30, ...over });

  it("excludes same-day repeats and first looks, which would flatter it", () => {
    const log = [entry({ correct: false, sameDay: true }), entry({ correct: false, isNew: true }), entry({ correct: true })];
    expect(stats.retention(log).reviews).toBe(1);
    expect(stats.retention(log).overall).toBe(1);
  });

  // Young cards failing is ordinary learning; mature cards failing means the
  // schedule is wrong. One number would hide the difference.
  it("splits young from mature at 21 days", () => {
    const log = [
      entry({ stability: 30, correct: true }),
      entry({ stability: 30, correct: false }),
      entry({ stability: 5, correct: false }),
    ];
    const r = stats.retention(log);
    expect(r.mature).toBe(0.5);
    expect(r.young).toBe(0);
    expect(r.matureReviews).toBe(2);
  });

  it("is null rather than zero when nothing qualifies", () => {
    expect(stats.retention([])).toBeNull();
    expect(stats.retention([entry({ sameDay: true })])).toBeNull();
  });
});

describe("calibration curve", () => {
  it("bins by predicted probability and reports both sides", () => {
    const log = Array.from({ length: 200 }, (_, i) => ({
      at: NOW,
      stability: 10,
      elapsedDays: i % 2 === 0 ? 1 : 100,
      correct: i % 2 === 0,
    }));
    const curve = stats.calibrationCurve(log);
    expect(curve.length).toBeGreaterThan(0);
    for (const b of curve) {
      expect(b.predicted).toBeGreaterThanOrEqual(b.from);
      expect(b.predicted).toBeLessThanOrEqual(b.to);
      expect(b.count).toBeGreaterThan(0);
    }
  });

  it("drops empty bins instead of drawing zeroes", () => {
    expect(stats.calibrationCurve([])).toEqual([]);
  });
});

describe("heatmap and streak", () => {
  it("includes days with nothing, because the gaps are the point", () => {
    const log = [{ at: NOW }, { at: NOW - 2 * DAY_MS }];
    const h = stats.heatmap(log, 5, NOW);
    expect(h).toHaveLength(5);
    expect(h[h.length - 1].count).toBe(1);
    expect(h[h.length - 2].count).toBe(0);
    expect(h[h.length - 3].count).toBe(1);
  });

  it("counts the current run and the best run", () => {
    const log = [
      { at: NOW }, { at: NOW - DAY_MS }, { at: NOW - 2 * DAY_MS },
      { at: NOW - 10 * DAY_MS }, { at: NOW - 11 * DAY_MS }, { at: NOW - 12 * DAY_MS }, { at: NOW - 13 * DAY_MS },
    ];
    const s = stats.studyStreak(log, NOW);
    expect(s.current).toBe(3);
    expect(s.best).toBe(4);
    expect(s.daysStudied).toBe(7);
  });

  it("reports a current streak of zero when today and yesterday are empty", () => {
    expect(stats.studyStreak([{ at: NOW - 5 * DAY_MS }], NOW).current).toBe(0);
  });

  // Found by the render smoke test, as duplicate React keys: the heatmap
  // stepped back by a fixed 24 hours, and the day the clocks go back is 25
  // hours long, so two steps landed on the same date. A year-long window
  // crosses both transitions, so this happens to every user every year.
  describe("across a daylight-saving change", () => {
    // 2026-11-05, well past both European (Oct 25) and US (Nov 1) transitions.
    const afterDst = new Date("2026-11-05T12:00:00").getTime();

    it("produces one entry per day with no repeats and no gaps", () => {
      const h = stats.heatmap([], 365, afterDst);
      expect(h).toHaveLength(365);
      expect(new Set(h.map((d) => d.date)).size).toBe(365);
    });

    it("keeps the days in order and one calendar day apart", () => {
      const h = stats.heatmap([], 30, afterDst);
      for (let i = 1; i < h.length; i++) {
        const previous = new Date(h[i - 1].date + "T12:00:00");
        const current = new Date(h[i].date + "T12:00:00");
        expect(Math.round((current - previous) / DAY_MS)).toBe(1);
      }
    });

    it("does not break a streak that runs through the transition", () => {
      // Seven consecutive calendar days ending the day after the clocks changed.
      const log = [];
      const cursor = new Date(afterDst);
      for (let i = 0; i < 7; i++) {
        log.push({ at: cursor.getTime() });
        cursor.setDate(cursor.getDate() - 1);
      }
      expect(stats.studyStreak(log, afterDst).current).toBe(7);
      expect(stats.studyStreak(log, afterDst).best).toBe(7);
    });

    it("buckets a card due tomorrow into tomorrow, not today", () => {
      const tomorrow = new Date(afterDst);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const f = stats.forecast([card({ srsDue: tomorrow.getTime() })], 7, afterDst);
      expect(f[1].due).toBe(1);
      expect(f[0].due).toBe(0);
    });
  });
});

describe("maturity", () => {
  it("sorts cards into the standard buckets", () => {
    const m = stats.maturity([
      { id: "1" },
      { id: "2", fsrsStability: 0.4, srsDue: NOW },
      { id: "3", fsrsStability: 5, srsDue: NOW },
      { id: "4", fsrsStability: 60, srsDue: NOW },
      { id: "5", fsrsStability: 60, srsDue: NOW, leechSuspended: true },
    ]);
    expect(m).toMatchObject({ new: 1, learning: 1, young: 1, mature: 1, suspended: 1, total: 5 });
  });
});

describe("at risk", () => {
  it("puts the least recallable card first", () => {
    const fresh = card({ id: "fresh", fsrsStability: 30, fsrsLastReview: NOW });
    const stale = card({ id: "stale", fsrsStability: 3, fsrsLastReview: NOW - 30 * DAY_MS });
    const out = stats.atRisk([fresh, stale], null, NOW);
    expect(out[0].card.id).toBe("stale");
    expect(out[0].recall).toBeLessThan(out[1].recall);
  });
});

describe("test mode", () => {
  // A seeded generator, so every assertion below is about the builder rather
  // than about luck.
  const seeded = (seed = 1) => () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const deck = Array.from({ length: 30 }, (_, i) => ({
    id: `c${i}`,
    front: `front ${i}`,
    back: `answer ${i}`,
    nodeId: i < 15 ? "n1" : "n2",
  }));

  it("builds the requested number of questions and never more than the deck", () => {
    expect(testMode.buildTest(deck, { count: 10, rand: seeded() }).questions).toHaveLength(10);
    expect(testMode.buildTest(deck.slice(0, 3), { count: 10, rand: seeded() }).questions).toHaveLength(3);
  });

  it("mixes question types instead of asking one kind throughout", () => {
    const t = testMode.buildTest(deck, { count: 9, rand: seeded() });
    expect(new Set(t.questions.map((q) => q.type)).size).toBeGreaterThan(1);
  });

  it("puts the right answer among the options exactly once", () => {
    const t = testMode.buildTest(deck, { count: 12, rand: seeded(7) });
    for (const q of t.questions.filter((x) => x.type === "choice")) {
      expect(q.options).toContain(q.answer);
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  // A deck with too few distinct answers can't make a fair multiple choice.
  it("falls back to typed when there aren't enough distractors", () => {
    const tiny = [{ id: "a", front: "f", back: "same" }, { id: "b", front: "g", back: "same" }];
    const t = testMode.buildTest(tiny, { count: 2, rand: seeded() });
    expect(t.questions.every((q) => q.type !== "choice")).toBe(true);
  });

  it("does not make every true/false claim true", () => {
    const t = testMode.buildTest(deck, { count: 30, types: ["trueFalse"], rand: seeded(3) });
    const tf = t.questions.filter((q) => q.type === "trueFalse");
    expect(tf.some((q) => q.expected)).toBe(true);
    expect(tf.some((q) => !q.expected)).toBe(true);
  });

  it("grades typed answers with the same normaliser the drills use", () => {
    const q = { type: "typed", answer: "Mitochondria." };
    expect(testMode.gradeAnswer(q, "mitochondria")).toBe(true);
    expect(testMode.gradeAnswer(q, "  MITOCHONDRIA  ")).toBe(true);
    expect(testMode.gradeAnswer(q, "cell")).toBe(false);
    expect(testMode.gradeAnswer(q, "")).toBe(false);
  });

  it("accepts multi-blank cloze answers in any order", () => {
    const q = {
      type: "typed",
      answer: "a, b",
      card: { clozeSource: "{{c1::alpha}} and {{c1::beta}}", clozeIndex: 1 },
    };
    expect(testMode.gradeAnswer(q, "beta, alpha")).toBe(true);
    expect(testMode.gradeAnswer(q, "alpha")).toBe(false);
  });

  it("scores, bands and reports the misses", () => {
    const t = testMode.buildTest(deck, { count: 4, types: ["typed"], rand: seeded(5), passMark: 0.7 });
    const responses = {};
    t.questions.forEach((q, i) => { responses[q.id] = i < 3 ? q.answer : "wrong"; });
    const result = testMode.score(t, responses);
    expect(result.correct).toBe(3);
    expect(result.percent).toBe(75);
    expect(result.passed).toBe(true);
    expect(result.wrong).toHaveLength(1);
    expect(testMode.verdict(result).band).toBe("good");
  });

  // Measuring must not quietly rewrite what it measures — but a real failure
  // is real evidence and shouldn't be thrown away.
  it("feeds only the failures back into the schedule", () => {
    const t = testMode.buildTest(deck, { count: 4, types: ["typed"], rand: seeded(9) });
    const responses = {};
    t.questions.forEach((q, i) => { responses[q.id] = i === 0 ? "wrong" : q.answer; });
    const updates = testMode.scheduleUpdates(testMode.score(t, responses));
    expect(updates).toHaveLength(1);
    expect(updates[0].correct).toBe(false);
  });
});

describe("tts voice selection", () => {
  const list = [
    { name: "Anna", lang: "de-DE" },
    { name: "Markus", lang: "de-AT" },
    { name: "Daniel", lang: "en-GB" },
  ];

  it("prefers an exact locale, then the language, then nothing", () => {
    expect(tts.pickVoice(list, "de-DE").name).toBe("Anna");
    expect(tts.pickVoice(list, "de-CH").lang.startsWith("de")).toBe(true);
    expect(tts.pickVoice(list, "fr-FR")).toBeNull();
    expect(tts.pickVoice(list, null)).toBeNull();
  });

  it("handles the underscore form Android reports", () => {
    expect(tts.pickVoice(list, "de_DE").name).toBe("Anna");
  });

  // Honouring a saved voice from another language would read German aloud in
  // English, which is worse than picking for the user.
  it("ignores a remembered voice that belongs to another language", () => {
    expect(tts.pickVoice(list, "de-DE", "Daniel").name).toBe("Anna");
    expect(tts.pickVoice(list, "de-DE", "Markus").name).toBe("Markus");
  });

  it("reads nothing for a picture side or a subject without speech configured", () => {
    const card = { front: "Hund", back: "dog", frontImageId: "img1" };
    expect(tts.speechFor(card, { speech: { enabled: true, frontLang: "de-DE" } }, "front")).toBeNull();
    expect(tts.speechFor(card, { speech: { enabled: false, backLang: "en-GB" } }, "back")).toBeNull();
    expect(tts.speechFor(card, { speech: { enabled: true, backLang: "en-GB" } }, "back")).toMatchObject({
      text: "dog",
      lang: "en-GB",
    });
  });
});
