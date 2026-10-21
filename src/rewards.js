// ---------------------------------------------------------------------------
// Rewards — gems, chests, weekly/monthly challenges and the gem shop.
// Pure logic like gamification.js, and stored in the same synced `game`.
//
// What the user asked for (2026-10-21): Duolingo-style chests and a reason to
// come back. Choices he made:
//   * Chests hold gems, gems are spent in a shop.
//   * Chests drop for all three daily quests, streak milestones, finished
//     sessions (a chance, guaranteed when flawless) and the weekly and monthly
//     challenges.
//   * Freezes stay free and automatic; gems may buy *extra* ones past the
//     free cap of 3, up to 5.
//
// Every chest is keyed by what earned it ("daily:2026-10-21", "streak:7:…"),
// and `claims` remembers the keys, so a reload, a second device or a
// re-recorded session can never pay the same chest twice. What is inside is
// rolled from that key rather than from Math.random, so two phones opening
// the same synced chest agree on the number and reopening can't reroll it.
// ---------------------------------------------------------------------------
import { dayKey, addDays, daysBetween, weekStartKey, weekXp, questDef, MAX_FREEZES } from "./gamification";

export const MAX_BOUGHT_FREEZES = 5;
export const MAX_CHESTS = 30;
export const SESSION_CHESTS_PER_DAY = 3;
export const SESSION_CHEST_MIN_ANSWERS = 5;
export const SESSION_CHEST_CHANCE = 0.3;
export const WEEKLY_XP_TARGET = 400;
export const MONTHLY_DAYS_TARGET = 20;
export const BOOST_MINUTES = 15;
export const REPAIR_DAYS = 2; // a lost streak can be bought back this many days after it broke
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 150, 200, 365];

// Tiers only change how a chest looks; kinds decide what's inside.
export const TIERS = {
  wood: { color: "#A9713B", lid: "#8A5A2C", band: "#D9B27A" },
  silver: { color: "#9AA5B1", lid: "#7D8894", band: "#E3E8EE" },
  gold: { color: "#D4A537", lid: "#B0861F", band: "#FBE6A6" },
  epic: { color: "#7B5CC9", lid: "#5E43A8", band: "#D7C8FF" },
};
export const CHEST_KINDS = {
  welcome: { name: "Welcome chest", tier: "silver", gems: [50, 50] },
  session: { name: "Session chest", tier: "wood", gems: [5, 15], jackpot: true },
  perfect: { name: "Flawless chest", tier: "silver", gems: [10, 22], jackpot: true },
  daily: { name: "Daily chest", tier: "silver", gems: [15, 35], jackpot: true },
  weekly: { name: "Weekly chest", tier: "gold", gems: [40, 80] },
  monthly: { name: "Monthly chest", tier: "epic", gems: [120, 200] },
  streak: { name: "Streak chest", tier: "gold", gems: [0, 0] }, // sized by the milestone, see rollChest
};
const JACKPOT_ODDS = 12; // one in twelve small chests pays triple

export const SHOP = [
  { id: "freeze", name: "Streak freeze", blurb: "Covers one missed day. You can bank up to 5.", price: 150, icon: "❄️" },
  { id: "boost", name: "Double XP", blurb: `Every session you finish in the next ${BOOST_MINUTES} minutes pays double.`, price: 60, icon: "⚡" },
  { id: "repair", name: "Streak repair", blurb: `Brings back a streak that broke in the last ${REPAIR_DAYS} days.`, price: 350, icon: "🩹" },
];
// Profile emojis for the leaderboard. The owl is everyone's default and free.
export const EMOJIS = [
  { id: "🦉", price: 0 },
  { id: "🦊", price: 100 },
  { id: "🐼", price: 100 },
  { id: "🐙", price: 150 },
  { id: "🚀", price: 200 },
  { id: "🌈", price: 200 },
  { id: "🦄", price: 300 },
  { id: "🐉", price: 400 },
  { id: "👑", price: 600 },
];

// ---------- state ----------
export function normalizeRewards(game) {
  const g = game || {};
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);
  return {
    gems: num(g.gems),
    chests: Array.isArray(g.chests)
      ? g.chests.filter(c => c && typeof c.id === "string" && CHEST_KINDS[c.kind]).slice(-MAX_CHESTS)
      : [],
    claims: g.claims && typeof g.claims === "object" ? g.claims : {},
    badges: g.badges && typeof g.badges === "object" ? g.badges : {},
    emojis: Array.isArray(g.emojis) ? g.emojis.filter(e => typeof e === "string") : [],
    boostUntil: num(g.boostUntil),
    lostStreak: g.lostStreak && typeof g.lostStreak === "object" && g.lostStreak.streak > 0 ? g.lostStreak : null,
  };
}
function withRewards(game) { return { ...game, ...normalizeRewards(game) }; }

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
// Uniform 0..1 from a key, so a roll is stable across devices.
function roll(key) { return hash(key) / 4294967296; }

// Claims for everything except streak milestones only need to outlive the
// period they cover; the rest is pruned so the synced document stays small.
function pruneClaims(claims, today) {
  const out = {};
  for (const [key, day] of Object.entries(claims)) {
    if (key.startsWith("streak:") || key === "welcome") out[key] = day;
    else if (typeof day === "string" && daysBetween(day, today) <= 70) out[key] = day;
  }
  return out;
}

function grant(game, key, kind, today, extra = {}) {
  if (game.claims[key]) return { game, chest: null };
  const chest = { id: key, kind, at: today, ...extra };
  return {
    game: {
      ...game,
      claims: { ...game.claims, [key]: today },
      chests: [...game.chests, chest].slice(-MAX_CHESTS),
    },
    chest,
  };
}

// ---------- what's inside ----------
export function rollChest(chest) {
  const kind = CHEST_KINDS[chest.kind];
  if (chest.kind === "streak") {
    const m = chest.milestone || 7;
    return { gems: Math.round(40 + m * 2.5), jackpot: false };
  }
  const [lo, hi] = kind.gems;
  let gems = lo + Math.floor(roll(chest.id + ":gems") * (hi - lo + 1));
  const jackpot = !!kind.jackpot && hash(chest.id + ":jackpot") % JACKPOT_ODDS === 0;
  if (jackpot) gems *= 3;
  return { gems, jackpot };
}

export function openChest(game, id) {
  const g = withRewards(game);
  const chest = g.chests.find(c => c.id === id);
  if (!chest) return { game, opened: null };
  const { gems, jackpot } = rollChest(chest);
  return {
    game: { ...g, gems: g.gems + gems, chests: g.chests.filter(c => c.id !== id) },
    opened: { chest, gems, jackpot },
  };
}

// ---------- challenges ----------
export function weeklyChallenge(game, today = dayKey()) {
  const progress = weekXp(game, today);
  const key = `weekly:${weekStartKey(today)}`;
  return { key, target: WEEKLY_XP_TARGET, progress, done: progress >= WEEKLY_XP_TARGET, claimed: !!game.claims?.[key] };
}

export function monthKey(today = dayKey()) { return today.slice(0, 7); }
export function monthlyChallenge(game, today = dayKey()) {
  const month = monthKey(today);
  let progress = 0;
  for (const [key, h] of Object.entries(game.history || {})) {
    if (key.startsWith(month) && (h.habitMet || h.goalMet || (h.cards || 0) > 0)) progress++;
  }
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const daysLeft = daysInMonth - Number(today.slice(8)) + (game.history?.[today]?.cards ? 0 : 1);
  return {
    key: `monthly:${month}`, month, target: MONTHLY_DAYS_TARGET, progress,
    done: progress >= MONTHLY_DAYS_TARGET, claimed: !!game.claims?.[`monthly:${month}`],
    reachable: progress + Math.max(0, daysLeft) >= MONTHLY_DAYS_TARGET,
  };
}

export function nextStreakMilestone(streak) {
  return STREAK_MILESTONES.find(m => m > streak) || null;
}
// The day the current streak started — part of a milestone's key, so a
// streak rebuilt after a break can earn its 7-day chest again, but a streak
// that merely continues cannot.
function streakStart(game) {
  if (!game.streak || !game.lastStudyDay) return null;
  return addDays(game.lastStudyDay, -(game.streak - 1));
}

export function dailyChestState(game, today = dayKey()) {
  const quests = (game.quests || []).filter(q => questDef(q.id));
  const done = game.questDay === today && quests.length > 0 && quests.every(q => q.progress >= questDef(q.id).target);
  return { done, count: quests.filter(q => q.progress >= questDef(q.id).target).length, total: quests.length };
}

// ---------- the one entry point after a finished session ----------
// `game` and `award` are what gamification.recordSession just returned.
// Returns the game with any boost XP and new chests applied, and the award
// extended with `boostXp` and `chests` for the reward screen.
export function afterSession(game, award, now = Date.now()) {
  const today = dayKey(now);
  let g = withRewards(game);
  g = { ...g, claims: pruneClaims(g.claims, today) };
  const chests = [];
  const add = (key, kind, extra) => {
    const r = grant(g, key, kind, today, extra);
    g = r.game;
    if (r.chest) chests.push(r.chest);
  };

  // Double XP: the whole session's XP again, recorded in today's history so
  // weekly ranks see it too.
  let boostXp = 0;
  if (award.total > 0 && g.boostUntil > now) {
    boostXp = award.total;
    const h = g.history[today] || {};
    g = { ...g, xp: g.xp + boostXp, history: { ...g.history, [today]: { ...h, xp: (h.xp || 0) + boostXp } } };
  }

  if (award.answered > 0) {
    // The first session after this feature arrived: one welcome chest, and a
    // streak already past some milestones gets the highest of them rather
    // than a pile of seven chests at once.
    if (!g.claims.welcome) {
      add("welcome", "welcome");
      const start = streakStart(g);
      const passed = STREAK_MILESTONES.filter(m => m <= g.streak);
      passed.slice(0, -1).forEach(m => { g = { ...g, claims: { ...g.claims, [`streak:${m}:${start}`]: today } }; });
    }

    const sessions = g.history[today]?.sessions || 1;
    const sessionChestsToday = Object.keys(g.claims).filter(k => k.startsWith(`session:${today}:`)).length;
    if (award.answered >= SESSION_CHEST_MIN_ANSWERS && sessionChestsToday < SESSION_CHESTS_PER_DAY) {
      const key = `session:${today}:${sessions}`;
      if (award.perfect) add(key, "perfect");
      else if (roll(key) < SESSION_CHEST_CHANCE) add(key, "session");
    }

    if (dailyChestState(g, today).done) add(`daily:${today}`, "daily");

    const start = streakStart(g);
    for (const m of STREAK_MILESTONES) {
      if (g.streak >= m && start) add(`streak:${m}:${start}`, "streak", { milestone: m });
    }
  }

  const week = weeklyChallenge(g, today);
  if (week.done) add(week.key, "weekly");
  const month = monthlyChallenge(g, today);
  if (month.done) {
    add(month.key, "monthly");
    if (!g.badges[month.month]) g = { ...g, badges: { ...g.badges, [month.month]: today } };
  }

  return { game: g, award: { ...award, boostXp, total: award.total + boostXp, chests } };
}

// ---------- shop ----------
export function repairAvailable(game, today = dayKey()) {
  const lost = normalizeRewards(game).lostStreak;
  if (!lost || lost.streak < 2 || !lost.on) return null;
  if (daysBetween(lost.on, today) > REPAIR_DAYS) return null;
  return lost;
}

export function canBuy(game, id, today = dayKey()) {
  const g = withRewards(game);
  const item = SHOP.find(i => i.id === id);
  if (!item) return { ok: false, reason: "unknown" };
  if (g.gems < item.price) return { ok: false, reason: "gems" };
  if (id === "freeze" && g.freezes >= MAX_BOUGHT_FREEZES) return { ok: false, reason: "full" };
  if (id === "repair" && !repairAvailable(g, today)) return { ok: false, reason: "nothing" };
  return { ok: true };
}

export function buy(game, id, now = Date.now()) {
  const today = dayKey(now);
  const check = canBuy(game, id, today);
  if (!check.ok) return { game, ok: false, reason: check.reason };
  const item = SHOP.find(i => i.id === id);
  let g = withRewards(game);
  g = { ...g, gems: g.gems - item.price };
  if (id === "freeze") g.freezes = (g.freezes || 0) + 1;
  if (id === "boost") g.boostUntil = Math.max(now, g.boostUntil) + BOOST_MINUTES * 60000;
  if (id === "repair") g = repairStreak(g, today);
  return { game: g, ok: true };
}

// The days between the lost streak's last study day and today (or the start
// of whatever new streak followed it) are filled in as frozen, exactly like a
// freeze would have, and the two streaks join up.
function repairStreak(g, today) {
  const lost = g.lostStreak;
  const yesterday = addDays(today, -1);
  const current = g.streak > 0 && g.lastStudyDay && daysBetween(g.lastStudyDay, today) <= 1 ? g.streak : 0;
  const lastStudyDay = current ? g.lastStudyDay : yesterday;
  const currentStart = current ? addDays(g.lastStudyDay, -(current - 1)) : today;
  const gap = [];
  for (let d = addDays(lost.last, 1); daysBetween(d, currentStart) > 0; d = addDays(d, 1)) gap.push(d);
  const streak = lost.streak + gap.length + current;
  return {
    ...g,
    streak,
    bestStreak: Math.max(g.bestStreak || 0, streak),
    lastStudyDay,
    frozenDays: [...(g.frozenDays || []), ...gap].slice(-60),
    lostStreak: null,
  };
}

export function buyEmoji(game, emoji) {
  const g = withRewards(game);
  const item = EMOJIS.find(e => e.id === emoji);
  if (!item) return { game, ok: false, reason: "unknown" };
  const owned = item.price === 0 || g.emojis.includes(emoji);
  if (owned) return { game: { ...g, profileEmoji: emoji }, ok: true };
  if (g.gems < item.price) return { game, ok: false, reason: "gems" };
  return { game: { ...g, gems: g.gems - item.price, emojis: [...g.emojis, emoji], profileEmoji: emoji }, ok: true };
}
export function ownsEmoji(game, emoji) {
  const item = EMOJIS.find(e => e.id === emoji);
  return !!item && (item.price === 0 || (game.emojis || []).includes(emoji));
}

export { MAX_FREEZES };
