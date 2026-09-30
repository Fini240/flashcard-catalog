// Device-local session checkpoints. Card content stays in the catalog: a
// checkpoint stores IDs and exercise payloads, never another copy of the deck.
// It is scoped to the catalog owner and is not uploaded to Firestore.
export const SESSION_KEY = "flashcard-study-session-v1";
const TYPES = new Set(["flip", "mcq", "write", "cloze", "truefalse", "match"]);
const SCHEDULER_FIELDS = ["srsBox", "srsDue", "srsPeak", "fsrsStability", "fsrsDifficulty", "fsrsLastReview", "fsrsReps", "fsrsLapses", "intervalDays", "leech", "leechSuspended", "leechSuspendedAt"];

export function restoreGrade(card, receipt) {
  if (!card || !receipt || card.id !== receipt.before.id ||
      SCHEDULER_FIELDS.some(key => card[key] !== receipt.after[key])) return null;
  const restored = { ...card };
  for (const key of SCHEDULER_FIELDS) {
    if (Object.hasOwn(receipt.before, key)) restored[key] = receipt.before[key];
    else delete restored[key];
  }
  return restored;
}

export function restoreAward(game, receipt) {
  if (!receipt) return null;
  const keys = [...new Set([...Object.keys(receipt.before), ...Object.keys(receipt.after)])]
    .filter(key => key !== "reviewLog" && JSON.stringify(receipt.before[key]) !== JSON.stringify(receipt.after[key]));
  if (keys.some(key => JSON.stringify(game[key]) !== JSON.stringify(receipt.after[key]))) return null;
  const restored = { ...game };
  for (const key of keys) {
    if (Object.hasOwn(receipt.before, key)) restored[key] = receipt.before[key];
    else delete restored[key];
  }
  return restored;
}

function fingerprint(card) {
  const text = JSON.stringify([card.front, card.back, card.frontImageId, card.backImageId, card.clozeSource, card.clozeIndex, card.occlusionMaskId, card.occlusionMask, card.occlusionMasks]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}

export function encodeSession(session) {
  const steps = {};
  for (const step of [...session.initialQueue, ...session.queue]) {
    steps[step.key] = {
      key: step.key, type: step.type, payload: step.payload,
      cards: step.cards.map(card => ({ id: card.id, fingerprint: fingerprint(card) })),
    };
  }
  return {
    version: 1, id: session.id, ownerUid: session.ownerUid || null,
    origin: session.origin, drillId: session.drillId, content: session.content || {},
    savedAt: Date.now(), steps,
    initialQueue: session.initialQueue.map(step => step.key),
    queue: session.queue.map(step => step.key), index: session.index,
    missedIds: session.missed.map(card => card.id), correctCount: session.correctCount,
    round: session.round, gradedIds: session.gradedIds, answerLog: session.answerLog,
    exerciseState: session.exerciseState || null,
  };
}

export function decodeSession(raw, cards, ownerUid) {
  if (!raw || raw.version !== 1 || raw.ownerUid !== (ownerUid || null) ||
      typeof raw.id !== "string" || !Array.isArray(raw.queue) || !Array.isArray(raw.initialQueue) ||
      !Number.isInteger(raw.index) || raw.index < 0 || raw.index >= raw.queue.length ||
      !Array.isArray(raw.gradedIds) || !Array.isArray(raw.answerLog) || !Array.isArray(raw.missedIds)) return null;
  const byId = new Map(cards.filter(card => !card.deletedAt).map(card => [card.id, card]));
  const hydrate = key => {
    const step = raw.steps?.[key];
    if (!step || !TYPES.has(step.type) || !Array.isArray(step.cards) || !step.cards.length) return null;
    const live = step.cards.map(ref => byId.get(ref.id));
    // Edited or deleted content must not reappear as an outdated question or
    // an impossible multiple choice/matching exercise. Skip that step.
    if (live.some((card, i) => !card || fingerprint(card) !== step.cards[i].fingerprint)) return null;
    if (step.type === "mcq" && !Array.isArray(step.payload?.options)) return null;
    if (step.type === "cloze" && typeof step.payload?.text !== "string") return null;
    if (step.type === "match" && !Array.isArray(step.payload?.pairs)) return null;
    if (step.type === "truefalse" && typeof step.payload?.isTrue !== "boolean") return null;
    return { ...step, cards: live };
  };
  const hydrated = raw.queue.map(hydrate);
  const index = hydrated.slice(0, raw.index).filter(Boolean).length;
  const queue = hydrated.filter(Boolean);
  if (index >= queue.length) return null;
  return {
    ...raw, origin: raw.origin === "study" ? "study" : "library",
    initialQueue: raw.initialQueue.map(hydrate).filter(Boolean), queue, index,
    missed: raw.missedIds.map(id => byId.get(id)).filter(Boolean),
    correctCount: Math.max(0, Number(raw.correctCount) || 0),
    round: Math.max(1, Number(raw.round) || 1),
    exerciseState: raw.exerciseState?.stepKey === queue[index].key ? raw.exerciseState : null,
  };
}

export function readSession(cards, ownerUid) {
  try { return decodeSession(JSON.parse(localStorage.getItem(SESSION_KEY)), cards, ownerUid); }
  catch { return null; }
}

export function writeSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(encodeSession(session))); return true; }
  catch { return false; }
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* private/blocked storage */ }
}
