// ---------------------------------------------------------------------------
// The home-screen widget: a streak number, today's goal, and a mascot whose
// mood tracks how the day is going.
//
// The widget is native — a RemoteViews tree drawn by the launcher, not a
// WebView — so none of the app's UI reaches it. All it ever gets is the small
// snapshot below, written into SharedPreferences through StreakWidgetPlugin.
//
// The one design decision worth knowing about: **the widget does no policy.**
// A launcher can redraw a widget at any moment, hours after the app was last
// open and often with the app's process long dead, so anything the widget had
// to *decide* would either be a second copy of the rules in Java or a stale
// answer. Instead this file precomputes the whole day as a schedule —
// "sleepy until 10:00, then neutral, then waiting…" — and the native side
// only looks up which entry covers the current minute. The rules stay here,
// pure and unit-tested; Java does a comparison it cannot get wrong.
//
// The same trick covers midnight. The app is usually closed when the day
// rolls over, so every snapshot also carries `nextDay`: the schedule for a
// fresh day with nothing done yet and the streak intact. The widget picks it
// whenever the stored day key isn't today, which is exactly right in the
// ordinary case — on a new day the progress genuinely *is* zero, and the
// streak genuinely is still what it was until a day is actually missed.
// Opening the app replaces the guess with the truth.
// ---------------------------------------------------------------------------
import { registerPlugin, Capacitor } from "@capacitor/core";
import * as G from "./gamification";

const StreakWidget = registerPlugin("StreakWidget");

// The animals. `emoji` is only for the picker inside the app — the widget
// draws the generated art (res/drawable-nodpi/mascot_<id>_<mood>.png, cut
// from expression sheets by scripts/mascot_sheets.py), because an emoji has
// no moods to give.
export const MASCOTS = [
  { id: "owl", name: "Owl", emoji: "🦉" },
  { id: "cat", name: "Cat", emoji: "🐱" },
  { id: "fox", name: "Fox", emoji: "🦊" },
  { id: "bunny", name: "Bunny", emoji: "🐰" },
  { id: "panda", name: "Panda", emoji: "🐼" },
];

// Matches the default profileEmoji in gamification.js, so a user who never
// touches either setting sees the same animal in both places.
export const DEFAULT_MASCOT = "owl";

export function mascotDef(id) {
  return MASCOTS.find(m => m.id === id) || MASCOTS.find(m => m.id === DEFAULT_MASCOT);
}

export function normalizeMascot(raw) {
  return MASCOTS.some(m => m.id === raw) ? raw : DEFAULT_MASCOT;
}

// ---------- moods ----------
// Ordered by how much the mascot minds. The index is the whole point: both
// softening rules below are "one step down this list", which keeps them from
// interacting in ways nobody can predict from reading either one.
export const MOODS = ["sleepy", "neutral", "waiting", "worried", "sad"];

// Goal met. Not part of MOODS because it isn't a rung — it is the end of the
// ladder, and nothing that happens later in the day can walk it back.
export const HAPPY = "happy";

// When the mascot moves up a rung, as minutes past midnight. Deliberately
// offset from the reminder ladder in reminders.js (12:30 / 16:00 / 19:00 /
// 21:00): the mascot should already look concerned by the time the phone
// buzzes, so the notification confirms something the user has been walking
// past all afternoon rather than announcing it cold.
const LADDER = [
  { from: 0, rank: 0 },     // 00:00 — asleep, like everyone else
  { from: 600, rank: 1 },   // 10:00 — awake, waiting to be asked
  { from: 840, rank: 2 },   // 14:00 — the day is half gone
  { from: 1080, rank: 3 },  // 18:00 — evening, and still nothing
  { from: 1260, rank: 4 },  // 21:00 — this is about to be lost
];

// The mascot's day, as a list of `{ from, mood }` in ascending minute order.
// Pure — `done`, `goal` and `streak` are the only inputs, and the caller's
// clock is not one of them.
//
// Two rules soften the ladder, both for the same reason the last reminder
// rung is the only one allowed to sound urgent: a mascot that looks stricken
// every evening is one the user stops reading.
//
//   * Nothing at stake — no streak yet — caps the mascot at `waiting`. There
//     is no bad news to deliver, so it doesn't invent any.
//   * Started but not finished drops every rung by one. Someone who did half
//     the goal at lunch has not been ignoring it.
export function moodSchedule({ done = 0, goal = G.DEFAULT_GOAL_CARDS, streak = 0 } = {}) {
  if (done >= goal) return [{ from: 0, mood: HAPPY }];

  const cap = streak > 0 ? MOODS.length - 1 : 2;
  const soften = done > 0 ? 1 : 0;

  const out = [];
  for (const rung of LADDER) {
    const rank = Math.max(0, Math.min(cap, rung.rank - soften));
    const mood = MOODS[rank];
    // Both softeners flatten neighbouring rungs into the same mood; keeping
    // one entry per *change* is what stops a capped schedule being five
    // copies of "waiting".
    if (out.length && out[out.length - 1].mood === mood) continue;
    out.push({ from: rung.from, mood });
  }
  return out;
}

// ---------- the message line ----------
// The sentence under the streak, per mood. Kept here rather than in Java for
// the same reason the mood ladder is: it is copy, it will be rewritten a
// dozen times, and every rewrite should be one file and one test away.
//
// Short on purpose — the widget gives this line about half its width, and an
// ellipsised sentence says less than a blunt one.
export function messageFor(mood, { done = 0, goal = G.DEFAULT_GOAL_CARDS, streak = 0 } = {}) {
  const left = Math.max(0, goal - done);
  if (mood === HAPPY) return "All done for today";
  if (mood === "waiting") return `${left} to go today`;
  if (mood === "worried") {
    return streak > 0 ? `${left} left to keep your streak` : `${left} to go today`;
  }
  if (mood === "sad") {
    return streak > 0 ? `Don't lose ${streak} days tonight` : `${left} to go today`;
  }
  return `${done} of ${goal} today`; // sleepy, neutral
}

// Every message the day can produce, as {mood: line}. The whole set goes over
// because the mood advances with the app closed — sending only the current
// line would freeze the sentence at whatever it said this morning.
export function messagesFor(args) {
  const out = {};
  for (const mood of [...MOODS, HAPPY]) out[mood] = messageFor(mood, args);
  return out;
}

// ---------- the day strip ----------
// The last few days, oldest first, as the widget's row of ticks. A rolling
// window ending today rather than a calendar week: the point is "have I kept
// this up", and on a Monday a calendar week is one box and six blanks.
export const DAY_WINDOW = 5;

export const DAY_NONE = 0;
export const DAY_MET = 1;
export const DAY_FROZEN = 2;

export function dayWindow(game, endKey, size = DAY_WINDOW) {
  const out = [];
  for (let i = size - 1; i >= 0; i--) {
    const key = G.addDays(endKey, -i);
    const h = game.history[key];
    const goal = game.goalCards || G.DEFAULT_GOAL_CARDS;
    // Same test reminders.js uses: `goalMet` is set when a session records it,
    // but a day whose count already covers the goal is met either way.
    const met = !!(h && (h.goalMet || h.cards >= goal));
    // A frozen day is not a day the user studied, and drawing it as one would
    // be a lie the streak itself doesn't tell — it gets its own mark.
    const frozen = Array.isArray(game.frozenDays) && game.frozenDays.includes(key);
    out.push({ key, state: met ? DAY_MET : frozen ? DAY_FROZEN : DAY_NONE });
  }
  return out;
}

// `2026-08-27:1,2026-08-28:0`. The day keys travel rather than weekday names
// so the native side can label them in the phone's own locale — the app is in
// English, but "Do Fr Sa" is what a German phone should say.
export function encodeDays(days) {
  return days.map(d => `${d.key}:${d.state}`).join(",");
}

// `120:neutral,600:waiting` — one flat string rather than nested JSON,
// because it crosses the Capacitor bridge and then lives in SharedPreferences,
// and neither is a good place to discover a parser bug.
export function encodeSchedule(schedule) {
  return schedule.map(s => `${s.from}:${s.mood}`).join(",");
}

// The mirror of the lookup StreakWidgetProvider does natively. Exported so a
// test can prove the two agree about what a schedule means.
export function moodAt(schedule, minuteOfDay) {
  let mood = schedule.length ? schedule[0].mood : MOODS[0];
  for (const s of schedule) {
    if (s.from > minuteOfDay) break;
    mood = s.mood;
  }
  return mood;
}

// Everything the widget will ever know, and nothing else — no cards, no
// review log, no account. Pure, so the whole contract with the native side is
// visible in one assertion.
export function snapshot(game, now = new Date()) {
  const day = G.dayKey(now.getTime());
  const stats = G.todayStats(game, day);
  const goal = game.goalCards || G.DEFAULT_GOAL_CARDS;
  const streak = game.streak || 0;
  const done = Math.min(stats.cards, goal);

  const tomorrow = G.addDays(day, 1);

  return {
    day,
    streak,
    done,
    goal,
    mascot: normalizeMascot(game.mascot),
    // Today, as it actually stands.
    today: encodeSchedule(moodSchedule({ done: stats.cards, goal, streak })),
    messages: JSON.stringify(messagesFor({ done: stats.cards, goal, streak })),
    days: encodeDays(dayWindow(game, day)),
    // And the day after midnight, which the app will almost certainly not be
    // open to see: nothing done, streak carried over, the strip rolled on by
    // one so today's tick keeps whatever it earned.
    nextDay: encodeSchedule(moodSchedule({ done: 0, goal, streak })),
    nextDayMessages: JSON.stringify(messagesFor({ done: 0, goal, streak })),
    nextDays: encodeDays(dayWindow(game, tomorrow)),
  };
}

// ---------- the picker ----------
// The same drawings the widget uses, so Settings can offer the real animal
// rather than a stand-in emoji.
//
// These live in `public/` and are referenced by URL rather than imported: they
// end up in `dist` either way, so the APK still has them offline, but keeping
// them out of the JS bundle means they cost nothing to anyone who never opens
// Settings. See scripts/mascot_sheets.py for where they come from — Android
// reads the very same drawings out of res/drawable-nodpi.
export function mascotArt(mascot, mood) {
  // An unknown mood would 404 rather than fall back to anything, so it is
  // pinned to a real one here.
  const known = [...MOODS, HAPPY].includes(mood) ? mood : MOODS[1];
  return `/mascots/${normalizeMascot(mascot)}-${known}.png`;
}

// What the widget would be showing at this moment. The picker uses it so the
// animals in Settings are in the same mood as the one on the home screen —
// choosing between five identical happy faces tells you nothing about what
// you are actually going to see this evening.
export function moodNow(game, now = new Date()) {
  const day = G.dayKey(now.getTime());
  const goal = game.goalCards || G.DEFAULT_GOAL_CARDS;
  const schedule = moodSchedule({
    done: G.todayStats(game, day).cards,
    goal,
    streak: game.streak || 0,
  });
  return moodAt(schedule, now.getHours() * 60 + now.getMinutes());
}

export function isSupported() {
  return Capacitor.isNativePlatform();
}

// Push the snapshot and redraw. Safe to call as often as you like — it writes
// a handful of primitives and pokes the launcher, and the launcher ignores it
// entirely when the user has placed no widget.
export async function sync(game) {
  if (!isSupported()) return { updated: false, reason: "not-native" };
  try {
    await StreakWidget.update(snapshot(game));
    return { updated: true };
  } catch (e) {
    // A widget that failed to redraw is not worth breaking a study session
    // over; report() upstream keeps it out of the silent-failure category.
    return { updated: false, reason: "error", error: e };
  }
}
