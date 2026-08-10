// ---------------------------------------------------------------------------
// Gamification engine — pure logic, no React, no network.
//
// Everything here operates on one plain object (`game`) that lives alongside
// `subjects` and `cards` in the same localStorage payload and the same synced
// Firestore document, so a streak survives a reinstall and follows the user
// across devices exactly like their cards do.
//
// Design notes (what we deliberately do differently from Duolingo):
//   * XP is earned for *recall*, not for time spent. A correct answer is worth
//     more than a wrong one, and pushing a card into a higher review box — real
//     durable progress — is worth the most. You cannot farm XP by replaying
//     easy material: cards you already answered today pay a reduced rate.
//   * The daily goal is measured in cards, not minutes, because "20 cards" is
//     something a student can picture and a minute count isn't.
//   * Streak freezes are automatic and free. Losing a 40-day streak to a sick
//     day makes people quit; we'd rather protect the habit than sell it back.
// ---------------------------------------------------------------------------

export const DAILY_GOALS = [
  { id: "light", cards: 10, label: "Light", blurb: "10 cards a day" },
  { id: "regular", cards: 20, label: "Regular", blurb: "20 cards a day" },
  { id: "serious", cards: 40, label: "Serious", blurb: "40 cards a day" },
  { id: "intense", cards: 75, label: "Intense", blurb: "75 cards a day" },
];
export const DEFAULT_GOAL_CARDS = 20;
export const MAX_FREEZES = 3;

// XP table. Kept small and legible so the numbers shown in the session summary
// are ones a user can add up themselves — opaque scoring feels arbitrary.
export const XP = {
  correct: 3,
  wrong: 1,
  levelUpCard: 5, // card moved into a review box it has never reached before
  sessionComplete: 10,
  perfectSession: 15, // instead of sessionComplete, not on top of it
  goalReached: 20,
  repeatCard: 1, // a card already answered earlier today: no farming
};

// ---------- dates ----------
// Everything is keyed on the user's *local* calendar day. A study session at
// 23:58 belongs to that day even if UTC has already rolled over.
export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export function dayKeyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function daysBetween(fromKey, toKey) {
  const a = dayKeyToDate(fromKey);
  const b = dayKeyToDate(toKey);
  return Math.round((b - a) / 86400000);
}
export function addDays(key, n) {
  const d = dayKeyToDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d.getTime());
}
// Monday-based week start, matching how most of the world reads a calendar.
export function weekStartKey(key = dayKey()) {
  const d = dayKeyToDate(key);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - dow);
  return dayKey(d.getTime());
}

// ---------- state ----------
export function emptyGame() {
  return {
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastStudyDay: null, // last day the daily goal was actually met
    lastSeenDay: null, // last day the app rolled its streak bookkeeping
    freezes: 2,
    frozenDays: [], // days a freeze covered, for the calendar
    goalCards: DEFAULT_GOAL_CARDS,
    history: {}, // dayKey -> { cards, correct, xp, goalMet }
    achievements: {}, // id -> timestamp earned
    questDay: null,
    quests: [], // [{ id, progress, claimed }]
    perfectSessions: 0,
    profileEmoji: "🦉",
    friends: [], // uids the user follows
  };
}

export function normalizeGame(raw) {
  const base = emptyGame();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    history: raw.history && typeof raw.history === "object" ? raw.history : {},
    achievements: raw.achievements && typeof raw.achievements === "object" ? raw.achievements : {},
    frozenDays: Array.isArray(raw.frozenDays) ? raw.frozenDays : [],
    friends: Array.isArray(raw.friends) ? raw.friends : [],
    quests: Array.isArray(raw.quests) ? raw.quests : [],
    goalCards: Number(raw.goalCards) > 0 ? Number(raw.goalCards) : DEFAULT_GOAL_CARDS,
  };
}

export function todayStats(game, today = dayKey()) {
  return game.history[today] || { cards: 0, correct: 0, xp: 0, goalMet: false };
}

// ---------- streak bookkeeping ----------
// Called whenever the app opens or the calendar day changes underneath a
// running app. Missed days are paid for out of the freeze bank first; only
// when the bank runs dry does the streak actually break.
export function rollOver(game, today = dayKey()) {
  if (game.lastSeenDay === today) return game;
  const next = { ...game, lastSeenDay: today };
  if (!game.lastStudyDay) return next;

  const gap = daysBetween(game.lastStudyDay, today);
  if (gap <= 1) return next; // studied today or yesterday — nothing at risk yet

  const missed = gap - 1; // days strictly between last study day and today
  if (missed <= next.freezes) {
    next.freezes -= missed;
    const frozen = [...next.frozenDays];
    for (let i = 1; i <= missed; i++) frozen.push(addDays(game.lastStudyDay, i));
    next.frozenDays = frozen.slice(-60);
    // The streak survives, and the frozen days count as covered — so the
    // streak keeps growing rather than silently stalling at the old number.
    next.streak = game.streak + missed;
    next.lastStudyDay = addDays(game.lastStudyDay, missed);
  } else {
    next.streak = 0;
  }
  return next;
}

export function streakAtRisk(game, today = dayKey()) {
  if (game.streak <= 0) return false;
  return !todayStats(game, today).goalMet;
}

// ---------- levels ----------
// Cumulative XP for level L is 50·L·(L+1): 100, 300, 600, 1000, 1500 …
// Early levels come fast (the first one inside a single session), later ones
// stretch out, which is the shape that keeps a progress bar feeling alive.
export function levelForXp(xp) {
  let level = 0;
  while (50 * (level + 1) * (level + 2) <= xp) level++;
  return level + 1;
}
export function levelBounds(xp) {
  const level = levelForXp(xp);
  const floor = level === 1 ? 0 : 50 * (level - 1) * level;
  const ceil = 50 * level * (level + 1);
  return { level, floor, ceil, into: xp - floor, span: ceil - floor };
}

// ---------- ranks (our answer to Duolingo's leagues) ----------
// Duolingo drops you into a pool of 30 strangers. We rank you against your own
// weekly output and show your friends on the same board — the comparison that
// actually motivates, without the fake-lobby feeling.
export const RANKS = [
  { id: "bronze", name: "Bronze", min: 0, color: "#A9713B" },
  { id: "silver", name: "Silver", min: 150, color: "#9AA5B1" },
  { id: "gold", name: "Gold", min: 350, color: "#D4A537" },
  { id: "sapphire", name: "Sapphire", min: 650, color: "#3E7CB1" },
  { id: "ruby", name: "Ruby", min: 1000, color: "#B03A5B" },
  { id: "emerald", name: "Emerald", min: 1500, color: "#3E8E6B" },
  { id: "diamond", name: "Diamond", min: 2200, color: "#5FC5D8" },
];
export function rankForWeekXp(weekXp) {
  let r = RANKS[0];
  for (const rank of RANKS) if (weekXp >= rank.min) r = rank;
  return r;
}
export function nextRank(weekXp) {
  return RANKS.find(r => r.min > weekXp) || null;
}

export function weekXp(game, today = dayKey()) {
  const start = weekStartKey(today);
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const k = addDays(start, i);
    sum += (game.history[k] && game.history[k].xp) || 0;
  }
  return sum;
}
export function weekDays(game, today = dayKey()) {
  const start = weekStartKey(today);
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(start, i);
    const h = game.history[key];
    return {
      key,
      future: daysBetween(today, key) > 0,
      today: key === today,
      goalMet: !!(h && h.goalMet),
      frozen: game.frozenDays.includes(key),
      xp: (h && h.xp) || 0,
    };
  });
}

// ---------- daily quests ----------
// Three a day, drawn deterministically from the date so they're stable across
// devices and across a reload without needing to be synced.
const QUEST_POOL = [
  { id: "cards15", label: "Answer 15 cards", target: 15, metric: "cards", xp: 15 },
  { id: "cards30", label: "Answer 30 cards", target: 30, metric: "cards", xp: 25 },
  { id: "correct12", label: "Get 12 answers right", target: 12, metric: "correct", xp: 15 },
  { id: "correct25", label: "Get 25 answers right", target: 25, metric: "correct", xp: 25 },
  { id: "perfect1", label: "Finish a session with no mistakes", target: 1, metric: "perfect", xp: 20 },
  { id: "levelup3", label: "Strengthen 3 cards a level", target: 3, metric: "levelUps", xp: 20 },
  { id: "sessions2", label: "Study twice today", target: 2, metric: "sessions", xp: 15 },
  { id: "goal", label: "Hit your daily goal", target: 1, metric: "goal", xp: 15 },
];
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
export function questsForDay(key) {
  const h = hashString(key);
  const picked = [];
  const pool = [...QUEST_POOL];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = (h >> (i * 5)) % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  // Always include the daily-goal quest so the headline objective is on the
  // list rather than hidden behind a random draw.
  if (!picked.some(q => q.id === "goal")) {
    picked[2] = QUEST_POOL.find(q => q.id === "goal");
  }
  return picked;
}
export function ensureQuests(game, today = dayKey()) {
  if (game.questDay === today && game.quests.length) return game;
  return {
    ...game,
    questDay: today,
    quests: questsForDay(today).map(q => ({ id: q.id, progress: 0, claimed: false })),
  };
}
export function questDef(id) {
  return QUEST_POOL.find(q => q.id === id);
}

// ---------- achievements ----------
export const ACHIEVEMENTS = [
  { id: "first", name: "First card", blurb: "Answer your very first card", icon: "🎬" },
  { id: "streak3", name: "Three in a row", blurb: "A 3-day streak", icon: "🔥" },
  { id: "streak7", name: "Full week", blurb: "A 7-day streak", icon: "🗓️" },
  { id: "streak30", name: "Month on", blurb: "A 30-day streak", icon: "🌙" },
  { id: "streak100", name: "Century", blurb: "A 100-day streak", icon: "💯" },
  { id: "streak365", name: "Year of it", blurb: "A 365-day streak", icon: "🏛️" },
  { id: "cards100", name: "Hundred up", blurb: "100 cards answered", icon: "📚" },
  { id: "cards1000", name: "Thousand up", blurb: "1000 cards answered", icon: "📖" },
  { id: "cards5000", name: "Card shark", blurb: "5000 cards answered", icon: "🦈" },
  { id: "perfect", name: "Flawless", blurb: "A session with no mistakes", icon: "🎯" },
  { id: "perfect10", name: "Ten flawless", blurb: "10 perfect sessions", icon: "💎" },
  { id: "mastered10", name: "Ten mastered", blurb: "10 cards fully mastered", icon: "🌱" },
  { id: "mastered100", name: "Hundred mastered", blurb: "100 cards fully mastered", icon: "🌳" },
  { id: "level5", name: "Level 5", blurb: "Reach level 5", icon: "⭐" },
  { id: "level10", name: "Level 10", blurb: "Reach level 10", icon: "🌟" },
  { id: "level25", name: "Level 25", blurb: "Reach level 25", icon: "✨" },
  { id: "earlybird", name: "Early bird", blurb: "Study before 7am", icon: "🌅" },
  { id: "nightowl", name: "Night owl", blurb: "Study after 11pm", icon: "🦉" },
  { id: "friend", name: "Better together", blurb: "Add your first friend", icon: "🤝" },
  { id: "week", name: "Perfect week", blurb: "Hit your goal 7 days in one week", icon: "🏆" },
];
export function achievementDef(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}

// Recomputes the whole achievement set from scratch. Cheap (20 checks), and it
// means an achievement added in a later version is awarded retroactively
// instead of being unreachable for existing users.
export function evaluateAchievements(game, cards, extra = {}) {
  const earned = { ...game.achievements };
  const now = Date.now();
  const totals = lifetimeTotals(game);
  const mastered = cards.filter(c => (c.srsBox || 0) >= 5).length;
  const level = levelForXp(game.xp);
  const perfectSessions = game.perfectSessions || 0;
  const hour = new Date().getHours();
  const days = weekDays(game);
  const perfectWeek = days.every(d => d.goalMet || d.frozen);

  const check = (id, cond) => { if (cond && !earned[id]) earned[id] = now; };
  check("first", totals.cards >= 1);
  check("streak3", game.streak >= 3 || game.bestStreak >= 3);
  check("streak7", game.streak >= 7 || game.bestStreak >= 7);
  check("streak30", game.streak >= 30 || game.bestStreak >= 30);
  check("streak100", game.streak >= 100 || game.bestStreak >= 100);
  check("streak365", game.streak >= 365 || game.bestStreak >= 365);
  check("cards100", totals.cards >= 100);
  check("cards1000", totals.cards >= 1000);
  check("cards5000", totals.cards >= 5000);
  check("perfect", perfectSessions >= 1 || extra.perfect);
  check("perfect10", perfectSessions >= 10);
  check("mastered10", mastered >= 10);
  check("mastered100", mastered >= 100);
  check("level5", level >= 5);
  check("level10", level >= 10);
  check("level25", level >= 25);
  check("earlybird", extra.studied && hour < 7);
  check("nightowl", extra.studied && hour >= 23);
  check("friend", (game.friends || []).length >= 1);
  check("week", perfectWeek && days.some(d => d.goalMet));
  return earned;
}

export function lifetimeTotals(game) {
  let cards = 0, correct = 0, days = 0;
  for (const k of Object.keys(game.history)) {
    const h = game.history[k];
    cards += h.cards || 0;
    correct += h.correct || 0;
    if ((h.cards || 0) > 0) days++;
  }
  return { cards, correct, days, accuracy: cards ? Math.round((correct / cards) * 100) : 0 };
}

// ---------- the main entry point: record a finished session ----------
// `result` is what the Session screen collected:
//   { answers: [{ correct, levelUp, repeat }], perfect }
// Returns { game, award } where `award` is everything the celebration screen
// needs to show — XP breakdown, whether the streak ticked over, new level,
// achievements unlocked, quests completed.
export function recordSession(game, cards, result) {
  const today = dayKey();
  let next = ensureQuests(rollOver(game, today), today);

  const answers = result.answers || [];
  const answered = answers.length;
  const correct = answers.filter(a => a.correct).length;
  const levelUps = answers.filter(a => a.levelUp).length;

  let base = 0;
  for (const a of answers) {
    if (a.repeat) base += XP.repeatCard;
    else base += a.correct ? XP.correct : XP.wrong;
    if (a.levelUp) base += XP.levelUpCard;
  }
  const bonus = answered === 0 ? 0 : result.perfect ? XP.perfectSession : XP.sessionComplete;

  const before = next.history[today] || { cards: 0, correct: 0, xp: 0, goalMet: false, sessions: 0 };
  const cardsToday = before.cards + answered;
  const correctToday = before.correct + correct;
  const goalMetNow = cardsToday >= next.goalCards;
  const goalJustMet = goalMetNow && !before.goalMet;
  const goalBonus = goalJustMet ? XP.goalReached : 0;

  // quests
  const questProgress = {
    cards: cardsToday,
    correct: correctToday,
    perfect: result.perfect && answered > 0 ? 1 : 0,
    levelUps: (before.levelUps || 0) + levelUps,
    sessions: (before.sessions || 0) + 1,
    goal: goalMetNow ? 1 : 0,
  };
  let questXp = 0;
  const questsDone = [];
  const quests = next.quests.map(q => {
    const def = questDef(q.id);
    if (!def) return q;
    const progress = Math.min(questProgress[def.metric] || 0, def.target);
    const done = progress >= def.target;
    // "perfect" is a one-shot flag rather than a running count, so once a
    // perfect session has been logged the quest stays completed for the day.
    const alreadyDone = q.progress >= def.target;
    if (done && !alreadyDone) {
      questXp += def.xp;
      questsDone.push(def);
    }
    return { ...q, progress: Math.max(q.progress, progress), claimed: done || q.claimed };
  });

  const gained = base + bonus + goalBonus + questXp;
  const xpBefore = next.xp;
  const xpAfter = xpBefore + gained;

  const history = {
    ...next.history,
    [today]: {
      cards: cardsToday,
      correct: correctToday,
      xp: (before.xp || 0) + gained,
      goalMet: goalMetNow,
      sessions: (before.sessions || 0) + 1,
      levelUps: (before.levelUps || 0) + levelUps,
    },
  };

  // streak: only a day where the goal was actually met counts
  let streak = next.streak;
  let streakUp = false;
  let lastStudyDay = next.lastStudyDay;
  if (goalJustMet) {
    const gap = lastStudyDay ? daysBetween(lastStudyDay, today) : null;
    if (gap === 1) streak = streak + 1; // yesterday → continue
    else if (gap === 0) streak = Math.max(streak, 1); // shouldn't happen, but harmless
    else streak = 1; // no history, or a gap the freezes couldn't cover
    lastStudyDay = today;
    streakUp = true;
  }

  // Every 7th streak day tops the freeze bank back up — earned protection,
  // not a purchase.
  let freezes = next.freezes;
  let freezeEarned = false;
  if (streakUp && streak > 0 && streak % 7 === 0 && freezes < MAX_FREEZES) {
    freezes = Math.min(MAX_FREEZES, freezes + 1);
    freezeEarned = true;
  }

  next = {
    ...next,
    xp: xpAfter,
    streak,
    bestStreak: Math.max(next.bestStreak || 0, streak),
    lastStudyDay,
    freezes,
    history,
    quests,
    perfectSessions: (next.perfectSessions || 0) + (result.perfect && answered > 0 ? 1 : 0),
  };

  const before2 = levelBounds(xpBefore);
  const after2 = levelBounds(xpAfter);
  const achievementsBefore = next.achievements;
  const achievements = evaluateAchievements(next, cards, { studied: answered > 0, perfect: result.perfect });
  next.achievements = achievements;
  const newAchievements = Object.keys(achievements)
    .filter(id => !achievementsBefore[id])
    .map(achievementDef)
    .filter(Boolean);

  return {
    game: next,
    award: {
      answered,
      correct,
      levelUps,
      base,
      bonus,
      goalBonus,
      questXp,
      total: gained,
      perfect: !!result.perfect && answered > 0,
      streak,
      streakUp,
      freezeEarned,
      levelUp: after2.level > before2.level ? after2.level : null,
      questsDone,
      newAchievements,
      goalMet: goalMetNow,
      cardsToday,
      goalCards: next.goalCards,
    },
  };
}

// ---------- mastery ----------
// Five named strength levels replacing the old new/learning/mastered triple.
// Each has a distinct label AND a distinct filled-pip count, so the state is
// readable without relying on colour alone.
export const MASTERY = [
  { box: 0, id: "new", label: "New", short: "New", color: "#7A8DA8", pips: 0 },
  { box: 1, id: "seen", label: "Seen once", short: "Seen", color: "#B5533C", pips: 1 },
  { box: 2, id: "learning", label: "Learning", short: "Learning", color: "#C98A2B", pips: 2 },
  { box: 3, id: "familiar", label: "Familiar", short: "Familiar", color: "#C9A62B", pips: 3 },
  { box: 4, id: "strong", label: "Strong", short: "Strong", color: "#5C7A44", pips: 4 },
  { box: 5, id: "mastered", label: "Mastered", short: "Mastered", color: "#F2C572", pips: 5 },
];
export function masteryOf(card) {
  const box = card.srsBox == null ? 0 : Math.min(5, Math.max(0, card.srsBox));
  return MASTERY[box];
}
export function masteryBreakdown(cards) {
  const counts = MASTERY.map(() => 0);
  cards.forEach(c => { counts[masteryOf(c).box]++; });
  return MASTERY.map((m, i) => ({ ...m, count: counts[i] }));
}
// A single 0-1 number for a deck: mastered cards count fully, weaker ones
// count proportionally. Drives the ring on every folder row.
export function deckStrength(cards) {
  if (!cards.length) return 0;
  const sum = cards.reduce((acc, c) => acc + masteryOf(c).box, 0);
  return sum / (cards.length * 5);
}
export function describeDue(card, now = Date.now()) {
  if (card.srsDue == null) return "New card";
  const diff = card.srsDue - now;
  if (diff <= 0) return "Due now";
  const days = Math.ceil(diff / 86400000);
  if (days === 1) return "Due tomorrow";
  if (days < 7) return `Due in ${days} days`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "Due in a week" : `Due in ${weeks} weeks`;
}

// ---------- heatmap ----------
export function heatmapWeeks(game, weeks = 18, today = dayKey()) {
  const end = weekStartKey(today);
  const start = addDays(end, -7 * (weeks - 1));
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const key = addDays(start, w * 7 + d);
      const h = game.history[key];
      col.push({
        key,
        cards: (h && h.cards) || 0,
        goalMet: !!(h && h.goalMet),
        frozen: game.frozenDays.includes(key),
        future: daysBetween(today, key) > 0,
      });
    }
    out.push(col);
  }
  return out;
}
