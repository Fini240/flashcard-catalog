// ---------------------------------------------------------------------------
// Learning statistics — as opposed to the motivation numbers in gamification.js.
//
// XP, streaks and quests answer "am I showing up". These answer "is it
// working", which is a different question and the one a fixed schedule can
// never answer honestly. Four things, each chosen because it changes a
// decision:
//
//   forecast   — how much work the next weeks hold. The number that tells you
//                whether today's 200-card import was a good idea.
//   retention  — how often you actually recall a card when asked. If this sits
//                far from the desired retention, the schedule is miscalibrated
//                and srs settings should move.
//   heatmap    — days studied, so a broken streak is visible as a shape rather
//                than a number that reset to zero.
//   maturity   — how the deck is distributed across stability. A deck that is
//                all young cards is a deck that will demand a lot soon.
//
// Everything here is pure and takes cards + a review log. The log lives on the
// game object (gamification.js) and is capped there; nothing in this file
// writes anything.
// ---------------------------------------------------------------------------

import { DAY_MS, retrievability, hasMemoryState } from "./fsrs";
import { normalizeSettings } from "./srs";
import { isSuspended } from "./leech";

// Day keys come from gamification.js rather than being defined again here.
// The first version of this file used toISOString().slice(0,10), which is UTC,
// alongside a local-midnight startOfDay — so every user east of Greenwich (all
// of them, in this app's case) got a heatmap and a streak shifted by a day, and
// the two disagreed with the streak the rest of the app already showed. One
// definition of "which day is it" is the only way that stays fixed.
export { dayKey, dayKeyToDate } from "./gamification";
import { dayKey, dayKeyToDate } from "./gamification";

const startOfDay = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Calendar arithmetic, not millisecond arithmetic. `ts ± n * DAY_MS` is wrong
// twice a year: the day the clocks go back is 25 hours long and the day they go
// forward is 23, so a fixed 24-hour step drifts off midnight and lands either
// on the same date twice or skips one. Every window in this file is at least a
// month long, and the year-long ones cross both transitions, so this is a
// certainty rather than an edge case.
const addDays = (ts, n) => {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
};

// Whole calendar days between two instants, both snapped to local midnight
// first. Rounding after the division absorbs the 23- or 25-hour day.
const daysApart = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);

// ---------- forecast ----------

// Cards due per day for the next `days` days. Overdue cards are folded into
// day 0 rather than given negative buckets — they are all "today's problem",
// and spreading them backwards would draw a chart of the past.
export function forecast(cards, days = 30, now = Date.now()) {
  const buckets = Array.from({ length: days + 1 }, (_, i) => ({ day: i, date: dayKey(addDays(now, i)), due: 0, overdue: 0 }));
  for (const c of cards || []) {
    if (isSuspended(c)) continue;
    if (c.srsDue == null) continue; // never studied — not scheduled work
    const offset = daysApart(now, c.srsDue);
    if (offset <= 0) {
      buckets[0].due++;
      if (offset < 0) buckets[0].overdue++;
    } else if (offset <= days) {
      buckets[offset].due++;
    }
  }
  return buckets;
}

// The single number under the forecast chart: average daily reviews once the
// deck settles. A card with stability S is asked roughly every S days, so it
// contributes 1/S reviews per day. This is the honest answer to "how much will
// this deck cost me", and it is not the same as today's due count.
export function dailyLoad(cards, settings) {
  const s = normalizeSettings(settings);
  let load = 0;
  for (const c of cards || []) {
    if (isSuspended(c) || !hasMemoryState(c)) continue;
    const interval = Math.max(0.5, c.fsrsStability);
    load += 1 / interval;
  }
  // Higher desired retention means shorter intervals means more reviews; the
  // ratio is the same one intervalFor applies.
  const scale = s.desiredRetention === 0.9 ? 1 : Math.log(0.9) / Math.log(s.desiredRetention);
  return load * scale;
}

// ---------- retention ----------

// True retention: of the reviews that were actually due (not same-day repeats,
// not brand-new cards), how many were recalled. Anki calls this "true retention"
// precisely because the naive figure — all answers, including relearning steps
// — flatters itself badly.
export function retention(log, opts = {}) {
  const since = opts.since || 0;
  const entries = (log || []).filter((e) => e && e.at >= since && !e.isNew && !e.sameDay);
  if (!entries.length) return null;
  const correct = entries.filter((e) => e.correct).length;
  const mature = entries.filter((e) => (e.stability || 0) >= 21);
  const young = entries.filter((e) => (e.stability || 0) < 21);
  const rate = (list) => (list.length ? list.filter((e) => e.correct).length / list.length : null);
  return {
    reviews: entries.length,
    overall: correct / entries.length,
    // Split because they mean different things: young cards failing is normal
    // learning, mature cards failing means the schedule is wrong.
    mature: rate(mature),
    young: rate(young),
    matureReviews: mature.length,
    youngReviews: young.length,
  };
}

// Predicted vs actual, bucketed by predicted recall probability. This is the
// chart that shows whether FSRS's model of *you* is right: the points should
// sit on the diagonal. Off-diagonal means the parameters want optimising.
export function calibrationCurve(log, settings, buckets = 10) {
  const s = normalizeSettings(settings);
  const bins = Array.from({ length: buckets }, (_, i) => ({
    from: i / buckets,
    to: (i + 1) / buckets,
    predicted: 0,
    actual: 0,
    count: 0,
  }));
  for (const e of log || []) {
    if (!e || !e.stability || e.sameDay || e.isNew) continue;
    const p = retrievability(e.stability, e.elapsedDays || 0, s.params);
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor(p * buckets)));
    bins[idx].predicted += p;
    bins[idx].actual += e.correct ? 1 : 0;
    bins[idx].count++;
  }
  return bins
    .filter((b) => b.count > 0)
    .map((b) => ({ ...b, predicted: b.predicted / b.count, actual: b.actual / b.count }));
}

// ---------- heatmap ----------

// One entry per day for the last `days` days, including days with nothing —
// the gaps are the information.
export function heatmap(log, days = 365, now = Date.now()) {
  const counts = new Map();
  for (const e of log || []) {
    if (!e || !e.at) continue;
    const k = dayKey(e.at);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  // Stepping by calendar days, not by DAY_MS. Subtracting a fixed 24 hours
  // walks off midnight at every DST change: the day the clocks go back is 25
  // hours long, so two iterations land inside it and produce the same date key
  // twice — a duplicated column, a missing day, and duplicate React keys.
  // Northern-hemisphere autumn is squarely inside a 365-day window, so this is
  // an every-year certainty rather than an edge case.
  const out = [];
  let ts = addDays(startOfDay(now), -(days - 1));
  for (let i = 0; i < days; i++) {
    const key = dayKey(ts);
    out.push({ date: key, ts, count: counts.get(key) || 0 });
    ts = addDays(ts, 1);
  }
  return out;
}

// Longest and current run of consecutive studied days, computed from the log
// rather than from the streak counter — this is the audit of that counter.
export function studyStreak(log, now = Date.now()) {
  const days = new Set((log || []).filter((e) => e && e.at).map((e) => dayKey(e.at)));
  let current = 0;
  for (let i = 0; ; i++) {
    const k = dayKey(addDays(now, -i));
    if (days.has(k)) current++;
    else if (i > 0 || !days.has(dayKey(startOfDay(now)))) break;
    else break;
  }
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const d of sorted) {
    // Local midnight, matching dayKey. Parsing as UTC here would make the
    // day-to-day difference 23 or 25 hours across a DST boundary and silently
    // break the run exactly once every spring and autumn.
    const ts = dayKeyToDate(d).getTime();
    run = previous != null && daysApart(previous, ts) === 1 ? run + 1 : 1;
    previous = ts;
    best = Math.max(best, run);
  }
  return { current, best, daysStudied: days.size };
}

// ---------- deck composition ----------

// Anki's maturity buckets, which are the standard vocabulary for this and
// worth matching so a user's expectations transfer.
export function maturity(cards) {
  const out = { new: 0, learning: 0, young: 0, mature: 0, suspended: 0, total: 0 };
  for (const c of cards || []) {
    out.total++;
    if (isSuspended(c)) { out.suspended++; continue; }
    if (!hasMemoryState(c) && c.srsDue == null) { out.new++; continue; }
    const s = c.fsrsStability || 0;
    if (s < 1) out.learning++;
    else if (s < 21) out.young++;
    else out.mature++;
  }
  return out;
}

// Cards sorted by how likely they are to be forgotten right now. The study
// screen's "weakest first" order and the list's at-risk badge read this.
export function atRisk(cards, settings, now = Date.now(), limit = 20) {
  const s = normalizeSettings(settings);
  return (cards || [])
    .filter((c) => hasMemoryState(c) && !isSuspended(c))
    .map((c) => ({
      card: c,
      recall: retrievability(c.fsrsStability, (now - (c.fsrsLastReview || now)) / DAY_MS, s.params),
    }))
    .sort((a, b) => a.recall - b.recall)
    .slice(0, limit);
}

// Time spent, per day, from the log's per-answer durations. Reported in minutes
// because "3600 seconds" is not a fact anyone acts on.
export function timeSpent(log, days = 30, now = Date.now()) {
  const cutoff = addDays(startOfDay(now), -(days - 1));
  const out = new Map();
  for (const e of log || []) {
    if (!e || !e.at || !e.ms) continue;
    if (e.at < cutoff) continue;
    const k = dayKey(e.at);
    out.set(k, (out.get(k) || 0) + e.ms);
  }
  return [...out.entries()]
    .map(([date, ms]) => ({ date, minutes: ms / 60000 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Everything the Statistics screen needs, in one pass, so the component does
// no arithmetic of its own.
export function summary(cards, log, settings, now = Date.now()) {
  return {
    forecast: forecast(cards, 30, now),
    dailyLoad: dailyLoad(cards, settings),
    retention: retention(log, { since: now - 30 * DAY_MS }),
    retentionAllTime: retention(log),
    calibration: calibrationCurve(log, settings),
    heatmap: heatmap(log, 365, now),
    streak: studyStreak(log, now),
    maturity: maturity(cards),
    atRisk: atRisk(cards, settings, now, 10),
    timeSpent: timeSpent(log, 30, now),
  };
}
