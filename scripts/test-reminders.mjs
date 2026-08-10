// Smoke tests for the daily study reminder scheduling.
//
// The scheduling decision is the part worth testing: which days get a
// notification, at what time, and — the whole point of the feature — that a day
// already studied never produces one. Firing them is Android's job.
//
// Run: node scripts/test-reminders.mjs
import { readFileSync } from "node:fs";
import * as G from "../src/gamification.js";

// reminders.js imports Capacitor plugins that can't load in bare Node, so we
// evaluate the pure scheduling functions out of the source — same approach as
// test-social.mjs.
const src = readFileSync(new URL("../src/reminders.js", import.meta.url), "utf8");
function extract(startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`could not slice ${startMarker}`);
  return src.slice(start, end).replace(/export /g, "");
}
const pure = [
  "const HORIZON_DAYS = 14;",
  extract("function idForDay", "export function formatTime"),
  extract("export function formatTime", "// What the notification"),
  extract("export function plan", "// Throws the pending queue"),
].join("\n");
const { plan, idForDay, formatTime } = new Function("G", `${pure}; return { plan, idForDay, formatTime };`)(G);

let failures = 0;
const ok = (n, c, x) => { if (c) console.log("  ✓", n); else { failures++; console.log("  ✗", n, x === undefined ? "" : JSON.stringify(x)); } };

const base = G.emptyGame();
const on = { enabled: true, hour: 18, minute: 0 };
// A fixed "now" so the suite doesn't drift with the clock it runs on.
const noon = new Date(2026, 7, 10, 12, 0, 0, 0); // 10 Aug 2026, 12:00 local
const evening = new Date(2026, 7, 10, 21, 30, 0, 0);
const today = G.dayKey(noon.getTime());

console.log("scheduling");
ok("disabled schedules nothing", plan(base, { ...on, enabled: false }, noon).length === 0);
ok("missing settings schedule nothing", plan(base, null, noon).length === 0);

const fresh = plan(base, on, noon);
ok("a fresh day fills the horizon", fresh.length === 14, fresh.length);
ok("first slot is today", fresh[0].key === today, fresh[0] && fresh[0].key);
ok("first slot is at 18:00", fresh[0].at.getHours() === 18 && fresh[0].at.getMinutes() === 0);
ok("every slot is in the future", fresh.every(s => s.at.getTime() > noon.getTime()));
ok("slots are one day apart", fresh.every((s, i) => i === 0 || (s.at - fresh[i - 1].at) === 864e5));
ok("all slots share the configured time", fresh.every(s => s.at.getHours() === 18 && s.at.getMinutes() === 0));
ok("day indexes count from zero", fresh[0].dayIndex === 0 && fresh[13].dayIndex === 13);

console.log("a day already studied is left alone");
const studied = { ...base, history: { [today]: { cards: 12, correct: 9, xp: 60, goalMet: false, sessions: 1 } } };
const afterStudy = plan(studied, on, noon);
ok("today is skipped once any card is done", !afterStudy.some(s => s.key === today));
ok("tomorrow still scheduled", afterStudy.length === 13, afterStudy.length);

const goalMet = { ...base, history: { [today]: { cards: 30, correct: 28, xp: 190, goalMet: true, sessions: 1 } } };
ok("today skipped when the goal is met", !plan(goalMet, on, noon).some(s => s.key === today));

console.log("a time that has already passed");
const late = plan(base, on, evening); // 21:30 vs an 18:00 reminder
ok("today's slot is dropped once its time has gone", !late.some(s => s.key === today));
ok("the queue starts tomorrow", late[0].key === G.addDays(today, 1), late[0] && late[0].key);
ok("still fills the rest of the horizon", late.length === 13, late.length);

const midnight = plan(base, { enabled: true, hour: 0, minute: 5 }, noon);
ok("a past midnight slot rolls to tomorrow", midnight[0].key === G.addDays(today, 1));

console.log("notification ids");
const ids = plan(base, on, noon).map(s => idForDay(s.key));
ok("one id per day", new Set(ids).size === ids.length);
ok("ids are 32-bit safe", ids.every(i => Number.isInteger(i) && i > 0 && i < 2147483647));
ok("ids are stable across calls", idForDay(today) === idForDay(today));
ok("different days differ", idForDay("2026-08-10") !== idForDay("2026-08-11"));

console.log("time formatting");
ok("pads both halves", formatTime(9, 5) === "09:05", formatTime(9, 5));
ok("midnight", formatTime(0, 0) === "00:00");
ok("end of day", formatTime(23, 59) === "23:59");

console.log("settings are repaired, never trusted");
ok("garbage hour falls back", G.normalizeGame({ reminder: { enabled: true, hour: 99, minute: 0 } }).reminder.hour === 18);
ok("garbage minute falls back", G.normalizeGame({ reminder: { enabled: true, hour: 7, minute: -3 } }).reminder.minute === 0);
ok("a good time survives", G.normalizeGame({ reminder: { enabled: true, hour: 7, minute: 45 } }).reminder.hour === 7);
ok("non-object reminder repaired", G.normalizeGame({ reminder: "nope" }).reminder.enabled === false);
ok("absent reminder defaults off", G.normalizeGame({}).reminder.enabled === false);
ok("a repaired time is schedulable", plan(base, G.normalizeGame({ reminder: { enabled: true, hour: 99, minute: 99 } }).reminder, noon).length === 14);

console.log("");
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log("all reminder tests passed");
