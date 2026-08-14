// ---------------------------------------------------------------------------
// Daily "come back and study" reminders.
//
// These are *local* notifications: every one is scheduled on the device by the
// device. No server, no Firebase Cloud Messaging, no cost, and they still fire
// with the phone offline and the app closed — which matters for an app whose
// whole point is working without an account.
//
// The reminder is meant to be skippable rather than nagging, so a day the user
// has already studied never produces one. Android gives us no background hook
// to check that at fire time, so we invert it: the whole schedule is thrown
// away and rebuilt from current state whenever anything relevant changes (app
// open, session finished, settings edited). Rebuilding is cheap and it means
// the pending queue is always a pure function of the game state.
// ---------------------------------------------------------------------------
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import * as G from "./gamification";

// How far ahead to fill the queue. Shorter than a single daily reminder needed,
// because each day now costs several entries — a week is plenty of runway and
// keeps a stale schedule from lingering.
const HORIZON_DAYS = 7;
const CHANNEL_ID = "study-reminders";

export const DEFAULT_REMINDER = { enabled: false };

// The day's ladder. One easy-to-ignore nudge around lunch, then progressively
// more direct as the day runs out — the last one lands while there is still
// time to actually do something about it, not at 23:55 when the answer is
// "too late". Every rung is cancelled the moment the daily goal is met, so a
// user who studies in the morning hears nothing at all.
export const LADDER = [
  { hour: 12, minute: 30, tone: "gentle" },
  { hour: 16, minute: 0, tone: "nudge" },
  { hour: 19, minute: 0, tone: "push" },
  { hour: 21, minute: 0, tone: "last" },
];

export function isSupported() {
  return Capacitor.isNativePlatform();
}

// Notification ids must be 32-bit ints and unique per slot, so a rebuild
// replaces the previous entry instead of stacking a duplicate. Day number
// dominates; the rung index is folded into the low digits.
function idForSlot(key, rung) {
  return (Number(key.replace(/-/g, "")) * 10 + rung) % 2147483647;
}

export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Human-readable summary of the ladder, for the settings screen.
export function ladderSummary() {
  return LADDER.map(r => formatTime(r.hour, r.minute)).join(" · ");
}

// Generic copy for days we know nothing about yet — future days can't have a
// progress number attached, because the progress hasn't happened.
const GENERIC = {
  gentle: { title: "Time to study", body: "A few cards now keeps the deck from piling up." },
  nudge: { title: "Your cards are waiting", body: "Ten minutes is enough to stay on track." },
  push: { title: "Still time today", body: "A short session now beats a long one on Sunday." },
  last: { title: "Last call for today", body: "One quick round and the day counts." },
};

// What a given rung actually says. Today's rungs know exactly how far along the
// user is, which is the difference between a notification that feels aimed at
// you and one that feels like a mailing list.
function messageFor({ tone, dayIndex, done, goal, streak, dueCount }) {
  if (dayIndex > 0) return GENERIC[tone];
  const left = Math.max(0, goal - done);
  const cards = (n) => `${n} card${n === 1 ? "" : "s"}`;

  if (tone === "gentle") {
    if (done > 0) return { title: "Good start", body: `${cards(done)} down, ${left} to go today.` };
    if (dueCount > 0) return { title: "Time to study", body: `${cards(dueCount)} are due right now.` };
    return GENERIC.gentle;
  }
  if (tone === "nudge") {
    if (done > 0) return { title: `${cards(left)} to go`, body: "Finish the goal while the day's still yours." };
    return { title: "Your goal is still open", body: `${cards(goal)} today — that's about ten minutes.` };
  }
  if (tone === "push") {
    if (streak > 0) return { title: `Keep your ${streak}-day streak`, body: `${cards(left)} left to hit today's goal.` };
    return { title: "Evening review?", body: `${cards(left)} left to hit today's goal.` };
  }
  // The last rung is the only one allowed to sound urgent, and only when
  // something is genuinely about to be lost.
  if (streak > 0) {
    return { title: `Your ${streak}-day streak ends tonight`, body: `${cards(left)} to keep it alive.` };
  }
  return { title: "Last call for today", body: `${cards(left)} and the day counts.` };
}

async function ensureChannel() {
  // Android 8+ ignores notifications that don't belong to a channel.
  if (Capacitor.getPlatform() !== "android") return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Study reminders",
      description: "Daily nudge to review your cards",
      importance: 4,
      visibility: 1,
    });
  } catch {
    // An existing channel can't be reconfigured by the app — that's fine, the
    // user owns those settings once it exists.
  }
}

// Asks only when we're about to schedule something. Android 13+ shows the
// system prompt; older versions grant it silently.
export async function requestPermission() {
  if (!isSupported()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;
    const asked = await LocalNotifications.requestPermissions();
    return asked.display === "granted";
  } catch {
    return false;
  }
}

export async function hasPermission() {
  if (!isSupported()) return false;
  try {
    return (await LocalNotifications.checkPermissions()).display === "granted";
  } catch {
    return false;
  }
}

async function cancelAll() {
  try {
    const { notifications } = await LocalNotifications.getPending();
    if (notifications && notifications.length) {
      await LocalNotifications.cancel({ notifications: notifications.map(n => ({ id: n.id })) });
    }
  } catch {
    // Nothing pending, or the platform doesn't support it — either way there
    // is nothing to clean up before scheduling.
  }
}

// Every rung of every day in the horizon that still deserves a notification,
// as concrete fire times. Pure so it can be tested without a device.
//
// The rule that matters: reminders exist to get the daily goal met, so they all
// stop for a day the moment it is met — not merely when a card has been
// answered. A user who does half the goal at lunch should still hear about the
// other half in the evening.
export function plan(game, reminder, now = new Date()) {
  if (!reminder || !reminder.enabled) return [];
  const today = G.dayKey(now.getTime());
  const stats = G.todayStats(game, today);
  const goal = game.goalCards || G.DEFAULT_GOAL_CARDS;
  const goalMetToday = stats.goalMet || stats.cards >= goal;
  const out = [];

  for (let i = 0; i < HORIZON_DAYS; i++) {
    // Today is already accounted for — no reason to interrupt anyone again.
    if (i === 0 && goalMetToday) continue;
    const key = G.addDays(today, i);
    LADDER.forEach((rung, rungIndex) => {
      const at = G.dayKeyToDate(key);
      at.setHours(rung.hour, rung.minute, 0, 0);
      // A rung whose time has passed is simply skipped; someone enabling
      // reminders at 20:00 gets tonight's last call and nothing retroactive.
      if (at.getTime() <= now.getTime()) return;
      out.push({ key, at, dayIndex: i, rungIndex, tone: rung.tone });
    });
  }
  return out;
}

// Throws the pending queue away and rebuilds it from current state. Safe to
// call as often as you like — it is idempotent by construction.
export async function sync(game, reminder, cards = []) {
  if (!isSupported()) return { scheduled: 0, reason: "not-native" };
  await cancelAll();
  if (!reminder || !reminder.enabled) return { scheduled: 0, reason: "disabled" };
  if (!(await hasPermission())) return { scheduled: 0, reason: "no-permission" };

  await ensureChannel();
  const now = Date.now();
  const dueCount = cards.filter(c => c.srsDue != null && c.srsDue <= now).length;
  const slots = plan(game, reminder);
  if (!slots.length) return { scheduled: 0, reason: "nothing-to-schedule" };

  const goal = game.goalCards || G.DEFAULT_GOAL_CARDS;
  const done = G.todayStats(game).cards;
  const notifications = slots.map(({ key, at, dayIndex, rungIndex, tone }) => {
    const msg = messageFor({ tone, dayIndex, done, goal, streak: game.streak || 0, dueCount });
    return {
      id: idForSlot(key, rungIndex),
      title: msg.title,
      body: msg.body,
      channelId: CHANNEL_ID,
      schedule: { at, allowWhileIdle: true },
    };
  });

  try {
    await LocalNotifications.schedule({ notifications });
    return { scheduled: notifications.length, reason: "ok" };
  } catch (err) {
    return { scheduled: 0, reason: "error", error: String(err) };
  }
}

// Turning reminders on is the one place we may need to interrupt the user for
// a permission, so it lives here rather than in the settings component.
export async function enable(game, reminder, cards) {
  const granted = await requestPermission();
  if (!granted) return { ok: false, reason: "denied" };
  const res = await sync(game, { ...reminder, enabled: true }, cards);
  return { ok: res.scheduled > 0 || res.reason === "nothing-to-schedule", ...res };
}

export async function disable() {
  await cancelAll();
}
