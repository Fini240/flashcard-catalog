// Short, explainable daily practice and deadline planning. Nothing here changes
// a card's schedule; only an actual answer can do that through the usual FSRS path.
import { dayKey, dayKeyToDate, daysBetween } from './gamification';
import { isDue, normalizeSettings } from './srs';
import { hasMemoryState } from './fsrs';
import { isSuspended } from './leech';

export const GUIDED_DRILL = { id: 'guided', label: 'Study today', types: ['mcq', 'write', 'flip'] };
export const isUnseen = card => !hasMemoryState(card) && !(card.srsBox > 0);
const usable = card => !card.deletedAt && !isSuspended(card);
const tricky = card => !isUnseen(card) && ((card.srsBox || 0) < 2 || card.fsrsLapses > 0 || card.fsrsDifficulty >= 7);

export function validExamDate(value) {
  return typeof value === 'string' && /^20\d\d-\d\d-\d\d$/.test(value) && dayKey(dayKeyToDate(value).getTime()) === value;
}

export function learningSummary(cards) {
  const result = { unseen: 0, familiar: 0, learning: 0, suspended: 0 };
  for (const card of cards) {
    if (card.deletedAt) continue;
    if (isSuspended(card)) result.suspended++;
    else if (isUnseen(card)) result.unseen++;
    else if (card.srsBox >= 3) result.familiar++;
    else result.learning++;
  }
  return result;
}

export function examPlan(cards, date, settings, now = Date.now()) {
  if (!validExamDate(date)) return null;
  const summary = learningSummary(cards);
  const days = daysBetween(dayKey(now), date);
  const due = cards.filter(card => usable(card) && !isUnseen(card) && isDue(card, now)).length;
  // Leave the final two days for recall, when there is enough time. This is a
  // workload estimate, not a prediction of the student's exam score.
  const newPerDay = Math.ceil(summary.unseen / Math.max(1, days - 2));
  const limit = normalizeSettings(settings).newPerDay;
  return { date, days, due, ...summary, newPerDay, finalReview: days >= 0 && days <= 2,
    catchUp: days >= 0 && summary.unseen > 0 && (days <= 2 || (limit > 0 && newPerDay > limit)) };
}

export function studyTodayPlan(cards, subjects, game, settings, now = Date.now()) {
  const s = normalizeSettings(settings);
  const today = dayKey(now);
  const available = cards.filter(usable);
  const reviewedToday = available.filter(card => card.fsrsLastReview && dayKey(card.fsrsLastReview) === today);
  const todayLog = (game.reviewLog || []).filter(entry => dayKey(entry.at) === today);
  // A new card can be answered again today. Its reps will then exceed one,
  // but the first introduction must still count against today's allowance.
  const introduced = Math.max(reviewedToday.filter(card => card.fsrsReps === 1).length, todayLog.filter(entry => entry.isNew).length);
  const reviewsDone = Math.max(0, reviewedToday.length - introduced, todayLog.filter(entry => !entry.isNew && !entry.sameDay).length);
  const reviewBudget = s.reviewsPerDay ? Math.max(0, s.reviewsPerDay - reviewsDone) : Infinity;
  const newBudget = s.newPerDay ? Math.max(0, s.newPerDay - introduced) : Infinity;
  const nodeOwners = new Map();
  const walk = (node, owner) => { nodeOwners.set(node.id, owner); (node.children || []).forEach(child => walk(child, owner)); };
  subjects.forEach(subject => walk(subject, subject.id));
  const groups = new Map();
  for (const card of available) {
    const id = nodeOwners.get(card.nodeId) || card.subjectId;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(card);
  }
  const options = [...groups].map(([id, deck]) => {
    const subject = subjects.find(subject => subject.id === id);
    const exam = examPlan(deck, game.exams?.[id], s, now);
    const reviews = deck.filter(card => !isUnseen(card) && isDue(card, now)).sort((a, b) => (a.srsDue || 0) - (b.srsDue || 0));
    const fresh = deck.filter(isUnseen);
    return { id, name: subject?.name || 'Loose cards', deck, reviews, fresh, exam };
  }).filter(option => (reviewBudget > 0 && option.reviews.length) || (newBudget > 0 && option.fresh.length));
  options.sort((a, b) => {
    const priority = option => option.exam && option.exam.days >= 0 ? option.exam.days : Infinity;
    return priority(a) - priority(b) || b.reviews.length - a.reviews.length || b.fresh.length - a.fresh.length;
  });
  const selected = options[0];
  if (!selected) return { cards: [], name: 'All caught up', counts: { due: 0, tricky: 0, fresh: 0 }, seconds: 0,
    reason: available.length ? 'Your due reviews and daily new-card allowance are complete. Choose a drill for extra practice.' : 'Add some cards to start your daily practice.' };
  // One sitting remains short even when a large import or deadline adds work.
  // Review gets most of the space; a small new batch moves coverage forward.
  const reviews = selected.reviews.slice(0, Math.min(12, reviewBudget));
  const freshTarget = selected.exam ? Math.max(3, selected.exam.newPerDay) : reviews.length ? 3 : 12;
  const fresh = selected.fresh.slice(0, Math.min(reviews.length ? 6 : 12, freshTarget, newBudget));
  const queue = [...reviews, ...fresh];
  const counts = { due: reviews.filter(card => !tricky(card)).length, tricky: reviews.filter(tricky).length, fresh: fresh.length };
  return { cards: queue, subjectId: selected.id, name: selected.name, counts, exam: selected.exam,
    seconds: queue.reduce((sum, card) => sum + (card.frontImageId || card.backImageId ? 12 : isUnseen(card) || card.srsBox < 2 ? 10 : 20), 0),
    reason: selected.exam && selected.exam.days >= 0 ? `This subject's exam is ${selected.exam.days === 0 ? 'today' : `in ${selected.exam.days} days`}. Its due reviews come first.` : 'Due reviews first, followed by a small batch of new material.' };
}

export function planDescription(plan) {
  return [['due', 'due'], ['tricky', 'tricky'], ['fresh', 'new']].filter(([key]) => plan.counts[key]).map(([key, label]) => `${plan.counts[key]} ${label}`).join(' · ');
}
