// Smoke tests for the escalating daily study reminders.
//
// Two things are worth testing: which slots get scheduled (the ladder, and the
// rule that all of it stops once the daily goal is met — not merely once a
// single card has been answered), and what each rung says, since the whole
// point of escalating is that the wording escalates with it.
//
// Run: node scripts/test-reminders.mjs
import { readFileSync } from "node:fs";
import * as G from "../src/gamification.js";

// reminders.js imports Capacitor plugins that can't load in bare Node, so we
// evaluate the pure scheduling functions out of the source — same approach as
// test-social.mjs.
const src = readFileSync(new URL("../src/reminders.js", import.meta.url), "utf8");
function slice(from, to) {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`could not slice ${from}`);
  return src.slice(a, b).replace(/export /g, "");
}
const pure = [
  "const HORIZON_DAYS = 7;",
  slice("export const LADDER", "export function isSupported"),
  slice("function idForSlot", "export function formatTime"),
  slice("export function formatTime", "// Human-readable summary"),
  slice("export function ladderSummary", "// Generic copy"),
  slice("const GENERIC = {", "async function ensureChannel"),
  slice("export function plan", "// Throws the pending queue"),
].join("\n");
const M = new Function("G", `${pure}; return { plan, idForSlot, formatTime, ladderSummary, messageFor, LADDER };`)(G);
const { plan, idForSlot, formatTime, ladderSummary, messageFor, LADDER } = M;

let failures = 0;
const ok = (n, c, x) => { if (c) console.log("  ✓", n); else { failures++; console.log("  ✗", n, x === undefined ? "" : JSON.stringify(x)); } };

const RUNGS = LADDER.length;
const base = { ...G.emptyGame(), goalCards: 20 };
const on = { enabled: true };
const today = "2026-08-10";
const at = (h, m = 0) => new Date(2026, 7, 10, h, m, 0, 0);
const dayOf = (slot) => slot.key;
const hoursOn = (slots, key) => slots.filter(s => s.key === key).map(s => s.at.getHours());

console.log("the ladder");
ok("four rungs", RUNGS === 4, RUNGS);
ok("rungs run midday to evening", LADDER.map(r => r.hour).join(",") === "12,16,19,21", LADDER.map(r => r.hour));
ok("rungs are in ascending order", LADDER.every((r, i) => i === 0 || r.hour > LADDER[i - 1].hour));
ok("last rung leaves time to act", LADDER[RUNGS - 1].hour <= 21);
ok("summary lists every rung", ladderSummary().split("·").length === RUNGS, ladderSummary());

console.log("scheduling");
ok("disabled schedules nothing", plan(base, { enabled: false }, at(9)).length === 0);
ok("missing settings schedule nothing", plan(base, null, at(9)).length === 0);

const early = plan(base, on, at(9));
ok("a fresh morning fills the whole horizon", early.length === 7 * RUNGS, early.length);
ok("today gets every rung", hoursOn(early, today).join(",") === "12,16,19,21", hoursOn(early, today));
ok("every slot is in the future", early.every(s => s.at.getTime() > at(9).getTime()));
ok("slots come out in time order", early.every((s, i) => i === 0 || s.at >= early[i - 1].at));
ok("tones ride along", early.slice(0, 4).map(s => s.tone).join(",") === "gentle,nudge,push,last");
ok("day indexes count from zero", early[0].dayIndex === 0 && early[early.length - 1].dayIndex === 6);

console.log("rungs whose time has passed");
ok("at 17:00 only the evening rungs remain today", hoursOn(plan(base, on, at(17)), today).join(",") === "19,21");
ok("at 20:00 only the last call remains", hoursOn(plan(base, on, at(20)), today).join(",") === "21");
const late = plan(base, on, at(22));
ok("after the last rung today is empty", hoursOn(late, today).length === 0);
ok("and tomorrow is intact", hoursOn(late, "2026-08-11").length === RUNGS);
ok("enabling late still fills the horizon", late.length === 6 * RUNGS, late.length);

console.log("the goal is what silences them");
const partial = { ...base, history: { [today]: { cards: 6, correct: 5, xp: 40, goalMet: false, sessions: 1 } } };
ok("partial progress still gets reminded", hoursOn(plan(partial, on, at(9)), today).length === RUNGS);
const met = { ...base, history: { [today]: { cards: 20, correct: 18, xp: 130, goalMet: true, sessions: 1 } } };
ok("a met goal clears the rest of today", hoursOn(plan(met, on, at(9)), today).length === 0);
ok("but tomorrow is untouched", hoursOn(plan(met, on, at(9)), "2026-08-11").length === RUNGS);
const overshot = { ...base, history: { [today]: { cards: 25, correct: 20, xp: 150, goalMet: false, sessions: 1 } } };
ok("reaching the count is enough on its own", hoursOn(plan(overshot, on, at(9)), today).length === 0);
const bigGoal = { ...base, goalCards: 50, history: { [today]: { cards: 25, correct: 20, xp: 150, goalMet: false, sessions: 1 } } };
ok("a bigger goal keeps the day alive", hoursOn(plan(bigGoal, on, at(9)), today).length === RUNGS);

console.log("notification ids");
const ids = early.map(s => idForSlot(s.key, s.rungIndex));
ok("one id per slot", new Set(ids).size === ids.length, ids.length - new Set(ids).size);
ok("ids are 32-bit safe", ids.every(i => Number.isInteger(i) && i > 0 && i < 2147483647));
ok("stable across calls", idForSlot(today, 2) === idForSlot(today, 2));
ok("rungs of one day differ", idForSlot(today, 0) !== idForSlot(today, 1));
ok("same rung on different days differs", idForSlot(today, 0) !== idForSlot("2026-08-11", 0));

console.log("what each rung says");
const msg = (tone, over = {}) => messageFor({ tone, dayIndex: 0, done: 0, goal: 20, streak: 0, dueCount: 0, ...over });
const text = (m) => `${m.title} ${m.body}`;
ok("midday with no progress is soft", !/streak|Last call/i.test(text(msg("gentle"))), text(msg("gentle")));
ok("midday names what's due", text(msg("gentle", { dueCount: 5 })).includes("5 cards"), text(msg("gentle", { dueCount: 5 })));
ok("midday credits a good start", text(msg("gentle", { done: 6 })).includes("6 cards down"), text(msg("gentle", { done: 6 })));
ok("afternoon counts what's left", text(msg("nudge", { done: 6 })).includes("14 cards"), text(msg("nudge", { done: 6 })));
ok("evening mentions the streak", text(msg("push", { streak: 9, done: 5 })).includes("9-day"), text(msg("push", { streak: 9, done: 5 })));
ok("evening without a streak stays plain", !text(msg("push", { done: 5 })).includes("streak"));
ok("last call is urgent with a streak", text(msg("last", { streak: 9, done: 5 })).includes("ends tonight"), text(msg("last", { streak: 9, done: 5 })));
ok("last call without a streak is still final", text(msg("last", { done: 5 })).includes("Last call"));
ok("singular card reads correctly", text(msg("nudge", { done: 19 })).includes("1 card to go"), text(msg("nudge", { done: 19 })));
ok("no negative remainder when overshot", !/-\d/.test(text(msg("last", { done: 30 }))), text(msg("last", { done: 30 })));
ok("every tone produces text", LADDER.every(r => { const m = msg(r.tone); return m && m.title && m.body; }));

console.log("future days can't know today's numbers");
for (const rung of LADDER) {
  const m = messageFor({ tone: rung.tone, dayIndex: 3, done: 6, goal: 20, streak: 9, dueCount: 4 });
  ok(`${rung.tone} on a future day is generic`, !/\d/.test(`${m.title} ${m.body}`), `${m.title} ${m.body}`);
}

console.log("settings are repaired, never trusted");
ok("non-object reminder repaired", G.normalizeGame({ reminder: "nope" }).reminder.enabled === false);
ok("absent reminder defaults off", G.normalizeGame({}).reminder.enabled === false);
ok("an enabled flag survives", G.normalizeGame({ reminder: { enabled: true } }).reminder.enabled === true);
ok("an old hour/minute save still works", plan(base, G.normalizeGame({ reminder: { enabled: true, hour: 18, minute: 0 } }).reminder, at(9)).length === 7 * RUNGS);
ok("time formatting pads", formatTime(9, 5) === "09:05", formatTime(9, 5));

console.log("");
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log("all reminder tests passed");
