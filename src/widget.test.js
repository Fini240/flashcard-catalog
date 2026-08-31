import { describe, it, expect } from "vitest";
import * as W from "./widget";
import * as G from "./gamification";

const TODAY = "2026-08-31";
const at = (hour, minute = 0) => {
  const d = G.dayKeyToDate(TODAY);
  d.setHours(hour, minute, 0, 0);
  return d;
};

function gameWith(overrides = {}) {
  return { ...G.emptyGame(), ...overrides };
}

// A game that has done `cards` today.
function withProgress(cards, extra = {}) {
  return gameWith({ history: { [TODAY]: { cards, correct: cards, xp: 0, goalMet: false } }, ...extra });
}

describe("mascots", () => {
  it("defaults an unknown or missing id", () => {
    expect(W.normalizeMascot(undefined)).toBe(W.DEFAULT_MASCOT);
    expect(W.normalizeMascot("dragon")).toBe(W.DEFAULT_MASCOT);
    expect(W.normalizeMascot("fox")).toBe("fox");
  });
  it("happy is the end of the ladder, not a rung on it", () => {
    expect(W.MOODS).toContain("sad");
    expect(W.MOODS).not.toContain(W.HAPPY);
  });

  // The native side resolves art by name (WidgetState.drawableFor), so a
  // missing pair is not a build error there — it is an empty square on
  // someone's home screen, and five blank boxes in the picker here.
  it("every mascot has art for every mood, including happy", () => {
    for (const m of W.MASCOTS) {
      for (const mood of [...W.MOODS, W.HAPPY]) {
        const art = W.mascotArt(m.id, mood);
        expect(art, `${m.id}:${mood}`).toMatch(/^<svg /);
        expect(art, `${m.id}:${mood}`).toContain("</svg>");
      }
    }
  });

  it("draws something for an unknown animal or mood rather than nothing", () => {
    expect(W.mascotArt("dragon", "happy")).toBe(W.mascotArt(W.DEFAULT_MASCOT, "happy"));
    expect(W.mascotArt("fox", "furious")).toMatch(/^<svg /);
  });
});

describe("moodNow", () => {
  it("agrees with the schedule the widget is handed", () => {
    const game = withProgress(0, { streak: 6, goalCards: 20 });
    expect(W.moodNow(game, at(8))).toBe("sleepy");
    expect(W.moodNow(game, at(19))).toBe("worried");
    expect(W.moodNow(game, at(22))).toBe("sad");
  });
  it("is happy once the day is done", () => {
    expect(W.moodNow(withProgress(20, { streak: 6, goalCards: 20 }), at(22))).toBe("happy");
  });
});

describe("moodSchedule", () => {
  it("is happy all day once the goal is met, whatever the hour", () => {
    const s = W.moodSchedule({ done: 20, goal: 20, streak: 5 });
    expect(s).toEqual([{ from: 0, mood: "happy" }]);
    expect(W.moodAt(s, 23 * 60)).toBe("happy");
  });
  it("overshooting the goal is still happy", () => {
    expect(W.moodSchedule({ done: 60, goal: 20, streak: 0 })[0].mood).toBe("happy");
  });

  it("climbs to sad by night when a streak is on the line", () => {
    const s = W.moodSchedule({ done: 0, goal: 20, streak: 9 });
    expect(W.moodAt(s, 8 * 60)).toBe("sleepy");
    expect(W.moodAt(s, 11 * 60)).toBe("neutral");
    expect(W.moodAt(s, 15 * 60)).toBe("waiting");
    expect(W.moodAt(s, 19 * 60)).toBe("worried");
    expect(W.moodAt(s, 22 * 60)).toBe("sad");
  });

  it("never goes past waiting when there is no streak to lose", () => {
    const s = W.moodSchedule({ done: 0, goal: 20, streak: 0 });
    expect(W.moodAt(s, 22 * 60)).toBe("waiting");
    expect(s.map(e => e.mood)).not.toContain("worried");
    expect(s.map(e => e.mood)).not.toContain("sad");
  });

  it("softens by one rung once the user has started", () => {
    const cold = W.moodSchedule({ done: 0, goal: 20, streak: 9 });
    const started = W.moodSchedule({ done: 8, goal: 20, streak: 9 });
    expect(W.moodAt(cold, 22 * 60)).toBe("sad");
    expect(W.moodAt(started, 22 * 60)).toBe("worried");
    expect(W.moodAt(started, 19 * 60)).toBe("waiting");
  });

  it("collapses flattened rungs instead of repeating a mood", () => {
    for (const args of [
      { done: 0, goal: 20, streak: 0 },
      { done: 5, goal: 20, streak: 0 },
      { done: 5, goal: 20, streak: 9 },
    ]) {
      const moods = W.moodSchedule(args).map(e => e.mood);
      expect(new Set(moods).size).toBe(moods.length);
    }
  });

  it("is ascending, starts at midnight, and covers every minute of the day", () => {
    const s = W.moodSchedule({ done: 0, goal: 20, streak: 9 });
    expect(s[0].from).toBe(0);
    for (let i = 1; i < s.length; i++) expect(s[i].from).toBeGreaterThan(s[i - 1].from);
    // No minute may fall through the lookup.
    for (let m = 0; m < 1440; m += 7) expect(typeof W.moodAt(s, m)).toBe("string");
  });
});

describe("encodeSchedule", () => {
  it("round-trips through the format the native side parses", () => {
    const s = W.moodSchedule({ done: 0, goal: 20, streak: 9 });
    const encoded = W.encodeSchedule(s);
    expect(encoded).toBe("0:sleepy,600:neutral,840:waiting,1080:worried,1260:sad");
    // Parsed back the way StreakWidgetProvider does it.
    const parsed = encoded.split(",").map(p => {
      const [from, mood] = p.split(":");
      return { from: Number(from), mood };
    });
    expect(parsed).toEqual(s);
  });
  it("emits no separators a splitter could trip on", () => {
    for (const m of [...W.MOODS, W.HAPPY]) {
      expect(m).not.toContain(",");
      expect(m).not.toContain(":");
    }
  });
});

describe("messageFor", () => {
  const args = { done: 6, goal: 20, streak: 9 };
  it("counts up early and counts down late", () => {
    expect(W.messageFor("neutral", args)).toBe("6 of 20 today");
    expect(W.messageFor("waiting", args)).toBe("14 to go today");
  });
  it("only invokes the streak when there is one to lose", () => {
    expect(W.messageFor("worried", args)).toBe("14 left to keep your streak");
    expect(W.messageFor("sad", args)).toBe("Don't lose 9 days tonight");
    expect(W.messageFor("worried", { ...args, streak: 0 })).toBe("14 to go today");
    expect(W.messageFor("sad", { ...args, streak: 0 })).toBe("14 to go today");
  });
  it("never counts below zero once the goal is passed", () => {
    expect(W.messageFor("waiting", { done: 50, goal: 20, streak: 3 })).toBe("0 to go today");
    expect(W.messageFor(W.HAPPY, args)).toBe("All done for today");
  });
  it("has a line for every mood, short enough for the widget", () => {
    const msgs = W.messagesFor(args);
    for (const mood of [...W.MOODS, W.HAPPY]) {
      expect(msgs[mood], mood).toBeTruthy();
      expect(msgs[mood].length, `${mood}: ${msgs[mood]}`).toBeLessThanOrEqual(30);
    }
  });
});

describe("dayWindow", () => {
  it("ends on the day it is given, oldest first", () => {
    const days = W.dayWindow(G.emptyGame(), TODAY);
    expect(days).toHaveLength(W.DAY_WINDOW);
    expect(days[days.length - 1].key).toBe(TODAY);
    expect(days[0].key).toBe("2026-08-27");
  });
  it("marks a met goal, a freeze and a missed day apart", () => {
    const game = gameWith({
      goalCards: 20,
      history: {
        "2026-08-28": { cards: 20, correct: 20, xp: 0, goalMet: true },
        // Enough cards but the flag never got set — still a met day.
        "2026-08-29": { cards: 25, correct: 25, xp: 0, goalMet: false },
        "2026-08-30": { cards: 3, correct: 3, xp: 0, goalMet: false },
      },
      frozenDays: ["2026-08-30"],
    });
    const byKey = Object.fromEntries(W.dayWindow(game, TODAY).map(d => [d.key, d.state]));
    expect(byKey["2026-08-27"]).toBe(W.DAY_NONE);
    expect(byKey["2026-08-28"]).toBe(W.DAY_MET);
    expect(byKey["2026-08-29"]).toBe(W.DAY_MET);
    // A freeze covered it, but it is not a day that was studied.
    expect(byKey["2026-08-30"]).toBe(W.DAY_FROZEN);
    expect(byKey[TODAY]).toBe(W.DAY_NONE);
  });
  it("encodes as day keys, so the native side can localise the labels", () => {
    const encoded = W.encodeDays(W.dayWindow(G.emptyGame(), TODAY));
    expect(encoded).toBe("2026-08-27:0,2026-08-28:0,2026-08-29:0,2026-08-30:0,2026-08-31:0");
  });
});

describe("snapshot", () => {
  it("carries the day, streak and goal the widget draws", () => {
    const snap = W.snapshot(withProgress(8, { streak: 12, goalCards: 20, mascot: "fox" }), at(15));
    expect(snap).toMatchObject({ day: TODAY, streak: 12, done: 8, goal: 20, mascot: "fox" });
  });

  it("clamps a finished day's count to the goal so the bar can't overflow", () => {
    const snap = W.snapshot(withProgress(53, { goalCards: 20 }), at(15));
    expect(snap.done).toBe(20);
    expect(W.moodAt(decode(snap.today), 15 * 60)).toBe("happy");
  });

  it("sends a message for every mood, as parseable JSON", () => {
    const snap = W.snapshot(withProgress(6, { streak: 9, goalCards: 20 }), at(15));
    const msgs = JSON.parse(snap.messages);
    for (const mood of [...W.MOODS, W.HAPPY]) expect(msgs[mood], mood).toBeTruthy();
    expect(msgs.neutral).toBe("6 of 20 today");
    expect(JSON.parse(snap.nextDayMessages).neutral).toBe("0 of 20 today");
  });

  it("rolls the day strip forward for tomorrow, keeping today's tick", () => {
    const snap = W.snapshot(withProgress(20, { streak: 4, goalCards: 20 }), at(21));
    const today = snap.days.split(",");
    const next = snap.nextDays.split(",");
    expect(today[today.length - 1]).toBe(`${TODAY}:${W.DAY_MET}`);
    // Tomorrow's window ends on tomorrow, and today keeps the tick it earned.
    expect(next[next.length - 1]).toBe(`2026-09-01:${W.DAY_NONE}`);
    expect(next[next.length - 2]).toBe(`${TODAY}:${W.DAY_MET}`);
  });

  it("nextDay forgets today's progress but keeps the streak", () => {
    const snap = W.snapshot(withProgress(20, { streak: 4, goalCards: 20 }), at(21));
    // Today is done — the mascot is happy right up to midnight.
    expect(W.moodAt(decode(snap.today), 23 * 60)).toBe("happy");
    // Tomorrow starts from nothing, with the streak still to protect.
    expect(W.moodAt(decode(snap.nextDay), 8 * 60)).toBe("sleepy");
    expect(W.moodAt(decode(snap.nextDay), 22 * 60)).toBe("sad");
  });

  it("falls back to the default goal and mascot for an untouched save", () => {
    const snap = W.snapshot(G.emptyGame(), at(9));
    expect(snap.goal).toBe(G.DEFAULT_GOAL_CARDS);
    expect(snap.mascot).toBe(W.DEFAULT_MASCOT);
    expect(snap.done).toBe(0);
    expect(snap.streak).toBe(0);
  });

  it("reads the day it is given, not the day the machine is in", () => {
    const game = withProgress(9, { goalCards: 20 });
    // A day with no history entry has no progress, even for the same game.
    const other = W.snapshot(game, G.dayKeyToDate("2026-09-02"));
    expect(other.day).toBe("2026-09-02");
    expect(other.done).toBe(0);
  });
});

function decode(encoded) {
  return encoded.split(",").map(p => {
    const [from, mood] = p.split(":");
    return { from: Number(from), mood };
  });
}
