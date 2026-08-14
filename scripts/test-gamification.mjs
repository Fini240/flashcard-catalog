// Node smoke tests for the gamification engine. No test framework — this runs
// with plain `node scripts/test-gamification.mjs` and fails loudly.
import {
  emptyGame, normalizeGame, rollOver, recordSession, dayKey, addDays,
  levelForXp, levelBounds, weekXp, rankForWeekXp, questsForDay, ensureQuests,
  masteryOf, deckStrength, masteryBreakdown, describeDue, weekDays, heatmapWeeks,
  lifetimeTotals, MAX_FREEZES,
} from "../src/gamification.js";

let failures = 0;
function ok(name, cond, extra) {
  if (cond) console.log("  ✓", name);
  else { failures++; console.log("  ✗", name, extra !== undefined ? JSON.stringify(extra) : ""); }
}
function eq(name, a, b) { ok(name, JSON.stringify(a) === JSON.stringify(b), { got: a, want: b }); }

const today = dayKey();
const answers = (n, correct = true) => Array.from({ length: n }, () => ({ correct, levelUp: false, repeat: false }));

console.log("levels");
eq("level 1 at 0 xp", levelForXp(0), 1);
eq("level 1 at 99 xp", levelForXp(99), 1);
eq("level 2 at 100 xp", levelForXp(100), 2);
eq("level 3 at 300 xp", levelForXp(300), 3);
eq("level 4 at 600 xp", levelForXp(600), 4);
ok("bounds are monotonic", (() => {
  let prev = -1;
  for (let xp = 0; xp < 20000; xp += 37) {
    const b = levelBounds(xp);
    if (b.level < prev) return false;
    if (!(xp >= b.floor && xp < b.ceil)) return false;
    if (b.into < 0 || b.into > b.span) return false;
    prev = b.level;
  }
  return true;
})());

console.log("first session");
{
  const g = emptyGame();
  const { game, award } = recordSession(g, [], { answers: answers(20), perfect: true });
  ok("goal met with 20 cards", award.goalMet);
  eq("streak becomes 1", game.streak, 1);
  ok("streak flagged as up", award.streakUp);
  eq("cards recorded", game.history[today].cards, 20);
  ok("xp positive", game.xp > 0, game.xp);
  ok("perfect achievement earned", !!game.achievements.perfect);
  ok("first-card achievement earned", !!game.achievements.first);
  eq("base xp = 20 × 3", award.base, 60);
  eq("perfect bonus", award.bonus, 15);
  eq("goal bonus", award.goalBonus, 20);
}

console.log("streak continuation");
{
  let g = emptyGame();
  g = recordSession(g, [], { answers: answers(20), perfect: false }).game;
  // pretend yesterday
  g = { ...g, lastStudyDay: addDays(today, -1), lastSeenDay: addDays(today, -1),
        history: { [addDays(today, -1)]: g.history[today] } };
  const { game } = recordSession(g, [], { answers: answers(20), perfect: false });
  eq("streak 2 after consecutive days", game.streak, 2);
}

console.log("streak freeze");
{
  let g = emptyGame();
  g = { ...g, streak: 10, bestStreak: 10, freezes: 2, lastStudyDay: addDays(today, -3), lastSeenDay: addDays(today, -3) };
  const rolled = rollOver(g, today);
  eq("two missed days consumed two freezes", rolled.freezes, 0);
  eq("streak survived and grew", rolled.streak, 12);
  eq("frozen days recorded", rolled.frozenDays.length, 2);
}
{
  let g = emptyGame();
  g = { ...g, streak: 10, freezes: 1, lastStudyDay: addDays(today, -4), lastSeenDay: addDays(today, -4) };
  const rolled = rollOver(g, today);
  eq("three missed days with one freeze breaks the streak", rolled.streak, 0);
}
{
  let g = emptyGame();
  g = { ...g, streak: 5, freezes: 3, lastStudyDay: addDays(today, -1), lastSeenDay: addDays(today, -1) };
  const rolled = rollOver(g, today);
  eq("studying yesterday costs no freeze", rolled.freezes, 3);
  eq("streak untouched", rolled.streak, 5);
}

console.log("freeze earned every 7 streak days");
{
  let g = { ...emptyGame(), streak: 6, freezes: 0, lastStudyDay: addDays(today, -1), lastSeenDay: today };
  const { game, award } = recordSession(g, [], { answers: answers(20), perfect: false });
  eq("streak hits 7", game.streak, 7);
  ok("freeze awarded", award.freezeEarned);
  eq("freeze bank", game.freezes, 1);
}
{
  let g = { ...emptyGame(), streak: 6, freezes: MAX_FREEZES, lastStudyDay: addDays(today, -1), lastSeenDay: today };
  const { game } = recordSession(g, [], { answers: answers(20), perfect: false });
  eq("freeze bank capped", game.freezes, MAX_FREEZES);
}

console.log("no double-counting the goal");
{
  let g = emptyGame();
  const r1 = recordSession(g, [], { answers: answers(20), perfect: false });
  const r2 = recordSession(r1.game, [], { answers: answers(20), perfect: false });
  eq("goal bonus only once", r2.award.goalBonus, 0);
  eq("streak stays 1 on the same day", r2.game.streak, 1);
  eq("cards accumulate", r2.game.history[today].cards, 40);
}

console.log("repeat cards pay less");
{
  const g = emptyGame();
  const fresh = recordSession(g, [], { answers: answers(10), perfect: false }).award.base;
  const repeat = recordSession(g, [], {
    answers: Array.from({ length: 10 }, () => ({ correct: true, repeat: true })), perfect: false,
  }).award.base;
  ok("repeat base is lower", repeat < fresh, { fresh, repeat });
}

console.log("quests");
{
  const qs = questsForDay(today);
  eq("three quests", qs.length, 3);
  ok("all quests defined", qs.every(Boolean));
  ok("stable across calls", JSON.stringify(qs) === JSON.stringify(questsForDay(today)));
  ok("includes the goal quest", qs.some(q => q.id === "goal"));
  const g = ensureQuests(emptyGame(), today);
  eq("quests seeded", g.quests.length, 3);
  const { game, award } = recordSession(g, [], { answers: answers(40), perfect: true });
  ok("some quest completed", award.questsDone.length > 0, award.questsDone);
  ok("quest xp added", award.questXp > 0);
  const again = recordSession(game, [], { answers: answers(40), perfect: true });
  ok("completed quests don't pay twice", again.award.questXp < award.questXp, { first: award.questXp, second: again.award.questXp });
}

console.log("week + ranks");
{
  let g = emptyGame();
  g = recordSession(g, [], { answers: answers(30), perfect: false }).game;
  ok("week xp counts today", weekXp(g) > 0);
  eq("bronze at 0", rankForWeekXp(0).id, "bronze");
  eq("silver at 150", rankForWeekXp(150).id, "silver");
  eq("diamond at 5000", rankForWeekXp(5000).id, "diamond");
  const days = weekDays(g);
  eq("seven days", days.length, 7);
  eq("exactly one today", days.filter(d => d.today).length, 1);
}

console.log("mastery");
{
  eq("no box = new", masteryOf({}).id, "new");
  eq("box 5 = mastered", masteryOf({ srsBox: 5 }).id, "mastered");
  eq("box 2 = learning", masteryOf({ srsBox: 2 }).id, "learning");
  eq("out of range clamps", masteryOf({ srsBox: 99 }).id, "mastered");
  eq("empty deck strength", deckStrength([]), 0);
  eq("all mastered = 1", deckStrength([{ srsBox: 5 }, { srsBox: 5 }]), 1);
  eq("all new = 0", deckStrength([{}, {}]), 0);
  const bd = masteryBreakdown([{}, { srsBox: 5 }, { srsBox: 5 }]);
  eq("breakdown counts", bd.map(b => b.count), [1, 0, 0, 0, 0, 2]);
  eq("new card due text", describeDue({}), "New card");
  eq("past due", describeDue({ srsDue: Date.now() - 1000 }), "Due now");
  eq("tomorrow", describeDue({ srsDue: Date.now() + 20 * 3600 * 1000 }), "Due tomorrow");
}

console.log("heatmap + totals + normalize");
{
  let g = recordSession(emptyGame(), [], { answers: answers(25), perfect: false }).game;
  const hm = heatmapWeeks(g, 18);
  eq("18 columns", hm.length, 18);
  eq("7 rows", hm[0].length, 7);
  const t = lifetimeTotals(g);
  eq("lifetime cards", t.cards, 25);
  eq("lifetime days", t.days, 1);
  eq("accuracy", t.accuracy, 100);
  const n = normalizeGame({ xp: "nope", history: null, friends: "x", goalCards: 0 });
  eq("history repaired", n.history, {});
  eq("friends repaired", n.friends, []);
  eq("goal repaired", n.goalCards, 20);
  ok("normalize of undefined works", normalizeGame(undefined).streak === 0);
}

console.log("");
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log("all gamification tests passed");
