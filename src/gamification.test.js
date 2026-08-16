import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as G from "./gamification";

// Fixed "today" for the date-driven tests: a Wednesday.
const TODAY = "2026-08-12";
const todayTs = G.dayKeyToDate(TODAY).getTime();

function gameWith(overrides = {}) {
  return { ...G.emptyGame(), ...overrides };
}

describe("day/week keys", () => {
  it("dayKey round-trips through dayKeyToDate", () => {
    expect(G.dayKey(G.dayKeyToDate(TODAY).getTime())).toBe(TODAY);
  });
  it("weekStartKey is Monday-based", () => {
    expect(G.weekStartKey(TODAY)).toBe("2026-08-10"); // Wednesday -> Monday
    expect(G.weekStartKey("2026-08-10")).toBe("2026-08-10"); // Monday is its own start
    expect(G.weekStartKey("2026-08-16")).toBe("2026-08-10"); // Sunday still same week
  });
  it("daysBetween counts calendar days", () => {
    expect(G.daysBetween("2026-08-10", "2026-08-12")).toBe(2);
    expect(G.daysBetween(TODAY, TODAY)).toBe(0);
  });
  it("addDays crosses month boundaries", () => {
    expect(G.addDays("2026-01-31", 1)).toBe("2026-02-01");
  });
});

describe("normalizeGame", () => {
  it("fills a missing game from scratch", () => {
    const g = G.normalizeGame(null);
    expect(g.xp).toBe(0);
    expect(g.goalCards).toBe(G.DEFAULT_GOAL_CARDS);
    expect(g.listed).toBe(true);
  });
  it("old saves without `listed` are not read as opted out", () => {
    expect(G.normalizeGame({ xp: 10 }).listed).toBe(true);
  });
  it("drops the old hour/minute reminder shape, keeps the flag", () => {
    expect(G.normalizeGame({ reminder: { enabled: true, hour: 18, minute: 30 } }).reminder)
      .toEqual({ enabled: true });
  });
  it("a bogus goalCards falls back to the default", () => {
    expect(G.normalizeGame({ goalCards: -5 }).goalCards).toBe(G.DEFAULT_GOAL_CARDS);
  });
});

describe("rollOver — streaks and freezes", () => {
  it("does nothing when already rolled today", () => {
    const g = gameWith({ lastSeenDay: TODAY, streak: 5 });
    expect(G.rollOver(g, TODAY)).toBe(g);
  });
  it("a one-day gap costs nothing", () => {
    const g = gameWith({ streak: 4, lastStudyDay: "2026-08-11", lastSeenDay: "2026-08-11" });
    const next = G.rollOver(g, TODAY);
    expect(next.streak).toBe(4);
    expect(next.freezes).toBe(2);
  });
  it("missed days are paid out of the freeze bank and the streak grows over them", () => {
    const g = gameWith({ streak: 4, freezes: 2, lastStudyDay: "2026-08-09", lastSeenDay: "2026-08-09" });
    const next = G.rollOver(g, TODAY); // missed 10th + 11th
    expect(next.streak).toBe(6);
    expect(next.freezes).toBe(0);
    expect(next.frozenDays).toEqual(["2026-08-10", "2026-08-11"]);
    expect(next.lastStudyDay).toBe("2026-08-11");
  });
  it("the streak breaks only when the bank runs dry", () => {
    const g = gameWith({ streak: 9, freezes: 1, lastStudyDay: "2026-08-08", lastSeenDay: "2026-08-08" });
    const next = G.rollOver(g, TODAY); // missed 3 days, only 1 freeze
    expect(next.streak).toBe(0);
  });
  it("no study history means no streak to protect", () => {
    const g = gameWith({ lastSeenDay: "2026-08-01" });
    const next = G.rollOver(g, TODAY);
    expect(next.streak).toBe(0);
    expect(next.lastSeenDay).toBe(TODAY);
  });
});

describe("levels", () => {
  it("level 1 is free, then 100 XP to level 2", () => {
    expect(G.levelForXp(0)).toBe(1);
    expect(G.levelForXp(99)).toBe(1);
    expect(G.levelForXp(100)).toBe(2);
    expect(G.levelForXp(299)).toBe(2);
    expect(G.levelForXp(300)).toBe(3);
  });
  it("levelBounds brackets the current xp", () => {
    const b = G.levelBounds(250);
    expect(b.level).toBe(2);
    expect(b.floor).toBe(100);
    expect(b.ceil).toBe(300);
    expect(b.into).toBe(150);
  });
});

describe("weekXp", () => {
  it("sums only the current Monday-Sunday week", () => {
    const g = gameWith({
      history: {
        "2026-08-09": { xp: 50 },  // Sunday of the previous week — excluded
        "2026-08-10": { xp: 10 },
        "2026-08-12": { xp: 5 },
        "2026-08-16": { xp: 7 },   // Sunday of this week — included (future days just count as 0 in practice)
        "2026-08-17": { xp: 99 },  // next Monday — excluded
      },
    });
    expect(G.weekXp(g, TODAY)).toBe(22);
  });
  it("is zero with no history", () => {
    expect(G.weekXp(gameWith(), TODAY)).toBe(0);
  });
});

describe("quests", () => {
  it("are deterministic for a given day", () => {
    expect(G.questsForDay(TODAY)).toEqual(G.questsForDay(TODAY));
  });
  it("always include the daily-goal quest", () => {
    for (let d = 1; d <= 28; d++) {
      const key = `2026-08-${String(d).padStart(2, "0")}`;
      expect(G.questsForDay(key).some(q => q.id === "goal")).toBe(true);
    }
  });
  it("ensureQuests keeps today's quests stable and rerolls a new day", () => {
    const g = G.ensureQuests(gameWith(), TODAY);
    expect(g.questDay).toBe(TODAY);
    expect(g.quests).toHaveLength(3);
    expect(G.ensureQuests(g, TODAY)).toBe(g); // same day: untouched
    const tomorrow = G.ensureQuests(g, "2026-08-13");
    expect(tomorrow.questDay).toBe("2026-08-13");
    expect(tomorrow.quests.every(q => q.progress === 0)).toBe(true);
  });
});

describe("recordSession", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(todayTs + 12 * 3600 * 1000); }); // midday
  afterEach(() => { vi.useRealTimers(); });

  it("awards correct/wrong/levelUp XP and the session bonus", () => {
    const { award, game } = G.recordSession(gameWith(), [], {
      answers: [
        { correct: true, levelUp: true },
        { correct: true, levelUp: false },
        { correct: false, levelUp: false },
      ],
      perfect: false,
    });
    // 3+3+1 base + 5 levelUp + 10 session = 22, no goal bonus (3 < 20)
    expect(award.base).toBe(12);
    expect(award.bonus).toBe(10);
    expect(award.total).toBe(22 + award.questXp);
    expect(game.xp).toBe(award.total);
  });

  it("a perfect session replaces the completion bonus", () => {
    const { award } = G.recordSession(gameWith(), [], {
      answers: [{ correct: true, levelUp: false }],
      perfect: true,
    });
    expect(award.bonus).toBe(G.XP.perfectSession);
    expect(award.perfect).toBe(true);
  });

  it("repeat cards pay the reduced anti-farming rate", () => {
    const { award } = G.recordSession(gameWith(), [], {
      answers: [{ correct: true, repeat: true }, { correct: true, repeat: true }],
      perfect: false,
    });
    expect(award.base).toBe(2 * G.XP.repeatCard);
  });

  it("meeting the daily goal pays once and starts the streak", () => {
    const g = gameWith({ goalCards: 2 });
    const { award, game } = G.recordSession(g, [], {
      answers: [{ correct: true }, { correct: true }],
      perfect: false,
    });
    expect(award.goalBonus).toBe(G.XP.goalReached);
    expect(award.streak).toBe(1);
    expect(award.streakUp).toBe(true);
    expect(game.lastStudyDay).toBe(TODAY);
    // second session the same day: no second goal bonus, streak doesn't double
    const again = G.recordSession(game, [], { answers: [{ correct: true }], perfect: false });
    expect(again.award.goalBonus).toBe(0);
    expect(again.game.streak).toBe(1);
  });

  it("a continuing streak increments; a broken one restarts at 1", () => {
    const cont = gameWith({ goalCards: 1, streak: 6, lastStudyDay: "2026-08-11", lastSeenDay: TODAY });
    expect(G.recordSession(cont, [], { answers: [{ correct: true }] }).game.streak).toBe(7);
    const fresh = gameWith({ goalCards: 1, streak: 0, lastStudyDay: null });
    expect(G.recordSession(fresh, [], { answers: [{ correct: true }] }).game.streak).toBe(1);
  });

  it("every 7th streak day refills the freeze bank, capped at MAX_FREEZES", () => {
    const g = gameWith({ goalCards: 1, streak: 6, freezes: 0, lastStudyDay: "2026-08-11", lastSeenDay: TODAY });
    const r = G.recordSession(g, [], { answers: [{ correct: true }] });
    expect(r.award.freezeEarned).toBe(true);
    expect(r.game.freezes).toBe(1);
    const capped = gameWith({ goalCards: 1, streak: 13, freezes: G.MAX_FREEZES, lastStudyDay: "2026-08-11", lastSeenDay: TODAY });
    const r2 = G.recordSession(capped, [], { answers: [{ correct: true }] });
    expect(r2.game.freezes).toBe(G.MAX_FREEZES);
    expect(r2.award.freezeEarned).toBe(false);
  });

  it("first-card and flawless achievements unlock retroactively into `game`", () => {
    const { game, award } = G.recordSession(gameWith(), [], {
      answers: [{ correct: true }],
      perfect: true,
    });
    expect(game.achievements.first).toBeTruthy();
    expect(game.achievements.perfect).toBeTruthy();
    expect(award.newAchievements.map(a => a.id)).toContain("first");
  });

  it("a completed quest pays out once, not again on the next session", () => {
    // goalCards: 1 so the "goal" quest completes inside the first session.
    const g = G.ensureQuests(gameWith({ goalCards: 1 }), TODAY);
    const r1 = G.recordSession(g, [], { answers: [{ correct: true }] });
    expect(r1.award.questsDone.some(q => q.id === "goal")).toBe(true);
    const firstXp = r1.award.questXp;
    expect(firstXp).toBeGreaterThan(0);

    // Second session the same day: the quest is already done, so it must not
    // report as newly completed and must not pay its XP a second time.
    const r2 = G.recordSession(r1.game, [], { answers: [{ correct: true }] });
    expect(r2.award.questsDone.some(q => q.id === "goal")).toBe(false);
    expect(r2.award.questXp).toBe(0);
  });

  it("an unmet quest reports no progress payout", () => {
    const g = G.ensureQuests(gameWith({ goalCards: 100 }), TODAY);
    const r = G.recordSession(g, [], { answers: [{ correct: true }] });
    expect(r.award.questsDone.some(q => q.id === "goal")).toBe(false);
  });

  it("history accumulates per day", () => {
    let g = gameWith({ goalCards: 100 });
    g = G.recordSession(g, [], { answers: [{ correct: true }, { correct: false }] }).game;
    g = G.recordSession(g, [], { answers: [{ correct: true }] }).game;
    const h = g.history[TODAY];
    expect(h.cards).toBe(3);
    expect(h.correct).toBe(2);
    expect(h.sessions).toBe(2);
  });
});

describe("evaluateAchievements", () => {
  it("is idempotent — already-earned ids keep their original timestamp", () => {
    const g = gameWith({ achievements: { first: 123 }, history: { [TODAY]: { cards: 5, correct: 5, xp: 20, goalMet: true } } });
    const earned = G.evaluateAchievements(g, []);
    expect(earned.first).toBe(123);
  });
  it("mastery counts only fully-mastered cards", () => {
    const cards = Array.from({ length: 10 }, (_, i) => ({ id: String(i), srsBox: 5 }));
    cards.push({ id: "x", srsBox: 4 });
    const earned = G.evaluateAchievements(gameWith(), cards);
    expect(earned.mastered10).toBeTruthy();
    expect(earned.mastered100).toBeFalsy();
  });
  it("the friend achievement fires on the first friend", () => {
    expect(G.evaluateAchievements(gameWith({ friends: ["u1"] }), []).friend).toBeTruthy();
    expect(G.evaluateAchievements(gameWith(), []).friend).toBeFalsy();
  });
});

describe("mastery", () => {
  it("clamps out-of-range boxes", () => {
    expect(G.masteryOf({ srsBox: 99 }).id).toBe("mastered");
    expect(G.masteryOf({ srsBox: -2 }).id).toBe("new");
    expect(G.masteryOf({}).id).toBe("new");
  });
  it("deckStrength is 0 for an empty deck and 1 for a fully mastered one", () => {
    expect(G.deckStrength([])).toBe(0);
    expect(G.deckStrength([{ srsBox: 5 }, { srsBox: 5 }])).toBe(1);
    expect(G.deckStrength([{ srsBox: 5 }, { srsBox: 0 }])).toBe(0.5);
  });
});

describe("describeDue", () => {
  const NOW = G.dayKeyToDate(TODAY).getTime();
  it("covers new / now / tomorrow / days / weeks", () => {
    expect(G.describeDue({}, NOW)).toBe("New card");
    expect(G.describeDue({ srsDue: NOW - 1 }, NOW)).toBe("Due now");
    expect(G.describeDue({ srsDue: NOW + 86400000 }, NOW)).toBe("Due tomorrow");
    expect(G.describeDue({ srsDue: NOW + 3 * 86400000 }, NOW)).toBe("Due in 3 days");
    expect(G.describeDue({ srsDue: NOW + 14 * 86400000 }, NOW)).toBe("Due in 2 weeks");
  });
});

// ---------------------------------------------------------------------------
// The review log (1.2.0) — the record stats.js and the FSRS optimiser read.
// ---------------------------------------------------------------------------
describe("review log", () => {
  it("appends an entry and keeps only the small fields", () => {
    const game = G.emptyGame();
    const log = G.appendReviewLog(game, { at: 1000, correct: true, stability: 12, elapsedDays: 10 });
    expect(log).toHaveLength(1);
    expect(log[0]).toEqual({ at: 1000, correct: true, stability: 12, elapsedDays: 10 });
  });

  it("marks first looks and same-day repeats, which retention has to exclude", () => {
    const game = G.emptyGame();
    expect(G.appendReviewLog(game, { correct: true, isNew: true })[0].isNew).toBe(true);
    expect(G.appendReviewLog(game, { correct: true, sameDay: true })[0].sameDay).toBe(true);
    // Absent rather than false, because this array is synced and twenty
    // thousand `false`s are twenty thousand wasted bytes.
    expect("isNew" in G.appendReviewLog(game, { correct: true })[0]).toBe(false);
  });

  it("drops the oldest entries past the cap instead of growing without bound", () => {
    let game = { ...G.emptyGame(), reviewLog: Array.from({ length: G.MAX_REVIEW_LOG }, (_, i) => ({ at: i, correct: true })) };
    const log = G.appendReviewLog(game, { at: 999999, correct: false });
    expect(log).toHaveLength(G.MAX_REVIEW_LOG);
    expect(log[log.length - 1].at).toBe(999999);
    expect(log[0].at).toBe(1); // the oldest went
  });

  it("survives a save file written before the log existed", () => {
    expect(G.normalizeGame({ xp: 5 }).reviewLog).toEqual([]);
    expect(G.normalizeGame({ reviewLog: "nonsense" }).reviewLog).toEqual([]);
    expect(G.normalizeGame({ srs: { desiredRetention: 0.95 } }).srs.desiredRetention).toBe(0.95);
    expect(G.normalizeGame({}).srs).toBeNull();
  });
});
