import { describe, it, expect } from 'vitest';
import { studyTodayPlan, examPlan, validExamDate, learningSummary, GUIDED_DRILL } from './studyPlan';
import { buildQueue, drillById } from './drills';
import { emptyGame } from './gamification';

const now = new Date(2026, 8, 30, 12).getTime();
const subjects = [{ id: 's', name: 'Spanish', children: [{ id: 'v', name: 'Words' }] }, { id: 'b', name: 'Biology' }];
const card = (id, extra = {}) => ({ id, nodeId: 'v', subjectId: 's', front: `word ${id}`, back: `meaning ${id}`, ...extra });
const review = (id, extra = {}) => card(id, { srsBox: 3, fsrsStability: 5, fsrsReps: 3, srsDue: now - 1000, ...extra });
const game = emptyGame();

describe('guided daily practice', () => {
  it('prioritises reviews, separates tricky counts, and keeps new material small', () => {
    const cards = [...Array.from({ length: 20 }, (_, i) => review(String(i))), review('weak', { srsBox: 1, srsDue: now - 2000 }), ...Array.from({ length: 20 }, (_, i) => card(`new${i}`))];
    const plan = studyTodayPlan(cards, subjects, game, null, now);
    expect(plan.cards).toHaveLength(15);
    expect(plan.counts).toEqual({ due: 11, tricky: 1, fresh: 3 });
    expect(plan.cards[0].id).toBe('weak');
    expect(plan.name).toBe('Spanish');
  });
  it('excludes deleted and suspended cards and does not bring future reviews forward', () => {
    const plan = studyTodayPlan([review('future', { srsDue: now + 1000 }), card('deleted', { deletedAt: now }), card('suspended', { leechSuspended: true })], subjects, game, null, now);
    expect(plan.cards).toEqual([]);
  });
  it('respects remaining daily allowances rather than resetting them every session', () => {
    const cards = [card('introduced', { fsrsReps: 1, fsrsStability: 1, fsrsLastReview: now, srsDue: now + 10000 }), review('answered', { fsrsLastReview: now, srsDue: now + 10000 }), card('new'), review('due')];
    expect(studyTodayPlan(cards, subjects, game, { newPerDay: 1, reviewsPerDay: 1 }, now).cards).toEqual([]);
  });
  it('prioritises the next exam and stops prioritising expired dates', () => {
    const cards = [review('spanish'), review('bio', { subjectId: 'b', nodeId: 'b' })];
    expect(studyTodayPlan(cards, subjects, { ...game, exams: { b: '2026-10-02' } }, null, now).name).toBe('Biology');
    expect(studyTodayPlan(cards, subjects, { ...game, exams: { b: '2026-09-29' } }, null, now).name).toBe('Spanish');
  });
  it('keeps a repeated new card counted against the introduction allowance', () => {
    const g = { ...game, reviewLog: [{ at: now, isNew: true }] };
    const plan = studyTodayPlan([card('new'), review('repeated', { fsrsLastReview: now, fsrsReps: 2, srsDue: now + 1000 })], subjects, g, { newPerDay: 1 }, now);
    expect(plan.cards).toEqual([]);
  });
  it('uses a short first session for a large import without mutating its cards', () => {
    const cards = Array.from({ length: 2889 }, (_, i) => card(String(i)));
    const before = JSON.stringify(cards);
    expect(studyTodayPlan(cards, subjects, game, null, now).cards).toHaveLength(12);
    expect(JSON.stringify(cards)).toBe(before);
  });
  it('moves from first exposure to recognition to written recall, with picture/long-answer fallback', () => {
    const cards = [card('new'), review('seen', { srsBox: 1 }), review('familiar'), review('picture', { backImageId: 'image' }), review('essay', { back: 'x'.repeat(121) })];
    const queue = buildQueue(GUIDED_DRILL, cards, {}, cards);
    expect(queue.map(step => step.type)).toEqual(['flip', 'mcq', 'write', 'flip', 'flip']);
    expect(drillById('guided').id).toBe('guided');
  });
});

describe('exam workload and visible learning progress', () => {
  it('validates local calendar dates, including leap years', () => {
    expect(validExamDate('2028-02-29')).toBe(true);
    for (const value of ['2027-02-29', '2026-13-01', '', null, 'tomorrow']) expect(validExamDate(value)).toBe(false);
  });
  it('reserves review time, calculates coverage, and flags a workload over the new-card limit', () => {
    const cards = Array.from({ length: 30 }, (_, i) => card(String(i)));
    const plan = examPlan(cards, '2026-10-05', { newPerDay: 5 }, now);
    expect(plan).toMatchObject({ days: 5, newPerDay: 10, catchUp: true, finalReview: false });
    expect(examPlan(cards, '2026-10-01', null, now)).toMatchObject({ finalReview: true, catchUp: true });
    expect(examPlan(cards, '2026-09-29', null, now)).toMatchObject({ days: -1, catchUp: false });
  });
  it('keeps unfamiliar, familiar and set-aside cards distinct without equating XP with knowledge', () => {
    expect(learningSummary([card('new'), review('learning', { srsBox: 1 }), review('known'), review('buried', { leechSuspended: true }), card('deleted', { deletedAt: now })]))
      .toEqual({ unseen: 1, learning: 1, familiar: 1, suspended: 1 });
  });
});
