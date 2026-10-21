import { describe, it, expect } from "vitest";
import * as G from "./gamification";
import * as R from "./rewards";

const TODAY = "2026-10-21";
const NOON = new Date(2026, 9, 21, 12).getTime();
const award = (over = {}) => ({ answered: 10, correct: 8, perfect: false, total: 40, ...over });
const game = (over = {}) => ({ ...G.emptyGame(), lastSeenDay: TODAY, ...over });
const studied = (over = {}) => game({
  streak: 1, lastStudyDay: TODAY, claims: { welcome: TODAY },
  history: { [TODAY]: { cards: 10, correct: 8, xp: 40, sessions: 1, habitMet: true } }, ...over,
});

describe("chests", () => {
  it("gives one welcome chest on the first session and never again", () => {
    const first = R.afterSession(studied({ claims: {} }), award(), NOON);
    expect(first.award.chests.map(c => c.kind)).toContain("welcome");
    const again = R.afterSession(first.game, award(), NOON);
    expect(again.award.chests.map(c => c.kind)).not.toContain("welcome");
  });

  it("always drops a chest after a flawless session of five or more", () => {
    const r = R.afterSession(studied(), award({ perfect: true }), NOON);
    expect(r.award.chests.map(c => c.kind)).toEqual(["perfect"]);
    const short = R.afterSession(studied(), award({ perfect: true, answered: 3 }), NOON);
    expect(short.award.chests).toEqual([]);
  });

  it("caps session chests at three a day", () => {
    let g = studied();
    let count = 0;
    for (let s = 1; s <= 6; s++) {
      g = { ...g, history: { ...g.history, [TODAY]: { ...g.history[TODAY], sessions: s } } };
      const r = R.afterSession(g, award({ perfect: true }), NOON);
      count += r.award.chests.length;
      g = r.game;
    }
    expect(count).toBe(R.SESSION_CHESTS_PER_DAY);
  });

  it("drops the daily chest once all three quests are done, once", () => {
    const quests = G.questsForDay(TODAY).map(q => ({ id: q.id, progress: q.target, claimed: true }));
    const g = studied({ questDay: TODAY, quests });
    const r = R.afterSession(g, award(), NOON);
    expect(r.award.chests.map(c => c.kind)).toContain("daily");
    expect(R.afterSession(r.game, award(), NOON).award.chests.map(c => c.kind)).not.toContain("daily");
    const partial = studied({ questDay: TODAY, quests: quests.map((q, i) => (i ? q : { ...q, progress: 0 })) });
    expect(R.afterSession(partial, award(), NOON).award.chests.map(c => c.kind)).not.toContain("daily");
  });

  it("pays a streak milestone once per streak, and again for a rebuilt one", () => {
    const g = studied({ streak: 7 });
    const r = R.afterSession(g, award(), NOON);
    expect(r.award.chests.filter(c => c.kind === "streak").map(c => c.milestone)).toEqual([7]);
    expect(R.afterSession(r.game, award(), NOON).award.chests.filter(c => c.kind === "streak")).toEqual([]);
    // The same 7 reached by a streak that began on a different day is a new one.
    const rebuilt = { ...r.game, lastStudyDay: "2026-11-30" };
    const later = R.afterSession(rebuilt, award(), new Date(2026, 10, 30, 12).getTime());
    expect(later.award.chests.filter(c => c.kind === "streak").map(c => c.milestone)).toEqual([7]);
  });

  it("gives a long-standing streak only its highest milestone on the first session", () => {
    const r = R.afterSession(studied({ streak: 40, claims: {} }), award(), NOON);
    expect(r.award.chests.filter(c => c.kind === "streak").map(c => c.milestone)).toEqual([30]);
  });

  it("opens to the same gems on every device and cannot be opened twice", () => {
    const r = R.afterSession(studied(), award({ perfect: true }), NOON);
    const id = r.award.chests[0].id;
    const a = R.openChest(r.game, id);
    const b = R.openChest(JSON.parse(JSON.stringify(r.game)), id);
    expect(a.opened.gems).toBe(b.opened.gems);
    expect(a.opened.gems).toBeGreaterThan(0);
    expect(a.game.gems).toBe(a.opened.gems);
    expect(R.openChest(a.game, id).opened).toBeNull();
  });

  it("keeps every roll inside its kind's range", () => {
    for (let i = 0; i < 300; i++) {
      for (const kind of ["session", "perfect", "daily", "weekly", "monthly"]) {
        const { gems, jackpot } = R.rollChest({ id: `${kind}:${i}`, kind });
        const [lo, hi] = R.CHEST_KINDS[kind].gems;
        expect(gems).toBeGreaterThanOrEqual(jackpot ? lo * 3 : lo);
        expect(gems).toBeLessThanOrEqual(jackpot ? hi * 3 : hi);
      }
    }
  });
});

describe("challenges", () => {
  it("drops the weekly chest at the XP target", () => {
    const g = studied({ history: { [TODAY]: { cards: 80, xp: R.WEEKLY_XP_TARGET, sessions: 1 } } });
    expect(R.afterSession(g, award(), NOON).award.chests.map(c => c.kind)).toContain("weekly");
  });

  it("drops the monthly chest and badge after enough study days", () => {
    const history = {};
    for (let d = 1; d <= R.MONTHLY_DAYS_TARGET; d++) history[`2026-10-${String(d).padStart(2, "0")}`] = { cards: 5, habitMet: true };
    const r = R.afterSession(studied({ history }), award(), NOON);
    expect(r.award.chests.map(c => c.kind)).toContain("monthly");
    expect(r.game.badges["2026-10"]).toBe(TODAY);
  });

  it("says when the monthly target can no longer be reached", () => {
    const late = R.monthlyChallenge(game({ history: {} }), "2026-10-25");
    expect(late.reachable).toBe(false);
    expect(R.monthlyChallenge(game({ history: {} }), "2026-10-02").reachable).toBe(true);
  });
});

describe("shop", () => {
  it("sells freezes beyond the free cap up to five", () => {
    let g = game({ gems: 1000, freezes: 3 });
    g = R.buy(g, "freeze", NOON).game;
    g = R.buy(g, "freeze", NOON).game;
    expect(g.freezes).toBe(5);
    expect(R.buy(g, "freeze", NOON)).toMatchObject({ ok: false, reason: "full" });
    expect(g.gems).toBe(1000 - 2 * 150);
  });

  it("does not let a weekly freeze award trim bought freezes", () => {
    const g = game({ freezes: 5, streak: 6, lastStudyDay: "2026-10-19", lastSeenDay: "2026-10-19" });
    expect(G.rollOver(g, TODAY).freezes).toBeGreaterThanOrEqual(4); // one spent, none trimmed
  });

  it("refuses without enough gems", () => {
    expect(R.buy(game({ gems: 10 }), "boost", NOON)).toMatchObject({ ok: false, reason: "gems" });
  });

  it("doubles session XP while a boost runs", () => {
    const g = R.buy(studied({ gems: 100 }), "boost", NOON).game;
    const r = R.afterSession(g, award({ total: 40 }), NOON + 60000);
    expect(r.award.boostXp).toBe(40);
    expect(r.game.xp).toBe(g.xp + 40);
    expect(r.game.history[TODAY].xp).toBe(80);
    const after = R.afterSession(g, award({ total: 40 }), NOON + (R.BOOST_MINUTES + 1) * 60000);
    expect(after.award.boostXp).toBe(0);
  });

  it("repairs a streak that broke, joining it to today's", () => {
    // Studied up to the 17th on a 12-day streak, missed three days with no freezes.
    let g = game({ streak: 12, bestStreak: 12, lastStudyDay: "2026-10-17", lastSeenDay: "2026-10-17", freezes: 0, gems: 400 });
    g = G.rollOver(g, TODAY);
    expect(g.streak).toBe(0);
    expect(R.repairAvailable(g, TODAY)).toMatchObject({ streak: 12 });
    const r = R.buy(g, "repair", NOON);
    expect(r.ok).toBe(true);
    // 12 + the 18th, 19th, 20th frozen; today not studied yet.
    expect(r.game.streak).toBe(15);
    expect(r.game.lastStudyDay).toBe("2026-10-20");
    expect(r.game.frozenDays).toEqual(expect.arrayContaining(["2026-10-18", "2026-10-19", "2026-10-20"]));
    expect(G.streakAtRisk(r.game, TODAY)).toBe(true);
    expect(R.repairAvailable(r.game, TODAY)).toBeNull();
  });

  it("repairs into a streak that already restarted today", () => {
    const g = game({ streak: 1, lastStudyDay: TODAY, gems: 400,
      lostStreak: { streak: 9, last: "2026-10-18", on: "2026-10-20" } });
    const r = R.buy(g, "repair", NOON).game;
    expect(r.streak).toBe(9 + 2 + 1); // 19th and 20th frozen, plus today
    expect(r.lastStudyDay).toBe(TODAY);
  });

  it("offers no repair after the window", () => {
    const g = game({ lostStreak: { streak: 9, last: "2026-10-10", on: "2026-10-15" } });
    expect(R.repairAvailable(g, TODAY)).toBeNull();
  });

  it("buys and equips profile emojis", () => {
    let g = game({ gems: 150 });
    expect(R.buyEmoji(g, "🐉")).toMatchObject({ ok: false, reason: "gems" });
    g = R.buyEmoji(g, "🦊").game;
    expect(g).toMatchObject({ gems: 50, profileEmoji: "🦊", emojis: ["🦊"] });
    g = R.buyEmoji(g, "🦉").game;
    g = R.buyEmoji(g, "🦊").game; // owned: free to switch back
    expect(g).toMatchObject({ gems: 50, profileEmoji: "🦊" });
  });
});

describe("normalizeRewards", () => {
  it("survives junk and saves from before rewards existed", () => {
    expect(R.normalizeRewards({})).toMatchObject({ gems: 0, chests: [], claims: {}, boostUntil: 0, lostStreak: null });
    expect(R.normalizeRewards({ gems: "x", chests: [null, { id: 1 }, { id: "a", kind: "nope" }] })).toMatchObject({ gems: 0, chests: [] });
  });
});
