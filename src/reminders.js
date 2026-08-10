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

// How far ahead to fill the queue. The app only has to be opened once a
// fortnight to stay ahead of it, and a short horizon keeps a stale schedule
// (goal changed, reminders switched off elsewhere) from lingering for months.
const HORIZON_DAYS = 14;
const CHANNEL_ID = "study-reminders";

export const DEFAULT_REMINDER = { enabled: false, hour: 18, minute: 0 };

export function isSupported() {
  return Capacitor.isNativePlatform();
}

// Notification ids must be 32-bit ints and stable per day, so a rebuild
// replaces the previous day's entry instead of stacking a duplicate.
function idForDay(key) {
  return Number(key.replace(/-/g, "")) % 2147483647;
}

export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// What the notification actually says. A streak that is about to break is the
// only genuinely urgent case, so it gets its own wording; everything else
// rotates so the same sentence doesn't arrive fourteen days running.
const LINES = [
  { title: "Time to study", body: "A few cards now keeps the deck from piling up." },
  { title: "Your cards are waiting", body: "Ten minutes is enough to stay on track." },
  { title: "Keep it going", body: "A short session today beats a long one on Sunday." },
  { title: "Quick review?", body: "The cards you're about to forget are due." },
];

function messageFor(game, dayIndex, dueCount, streak) {
  if (streak > 0 && dayIndex === 0) {
    return {
      title: `Your ${streak}-day streak is at risk`,
      body: "Finish today's goal to keep it alive.",
    };
  }
  const line = LINES[dayIndex % LINES.length];
  if (dueCount > 0 && dayIndex === 0) {
    return { title: line.title, body: `${dueCount} card${dueCount === 1 ? "" : "s"} due right now.` };
  }
  return line;
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

// Which of the next HORIZON_DAYS days deserve a reminder, as concrete fire
// times. Pure so it can be tested without a device.
export function plan(game, reminder, now = new Date()) {
  if (!reminder || !reminder.enabled) return [];
  const today = G.dayKey(now.getTime());
  const studiedToday = G.todayStats(game, today).goalMet || G.todayStats(game, today).cards > 0;
  const out = [];

  for (let i = 0; i < HORIZON_DAYS; i++) {
    const key = G.addDays(today, i);
    // The day is already done — no reason to interrupt anyone.
    if (i === 0 && studiedToday) continue;
    const at = G.dayKeyToDate(key);
    at.setHours(reminder.hour, reminder.minute, 0, 0);
    // Today's slot may already have passed; the queue starts tomorrow then.
    if (at.getTime() <= now.getTime()) continue;
    out.push({ key, at, dayIndex: i });
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

  const notifications = slots.map(({ key, at, dayIndex }) => {
    const msg = messageFor(game, dayIndex, dueCount, game.streak || 0);
    return {
      id: idForDay(key),
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
