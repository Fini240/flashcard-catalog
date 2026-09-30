import { describe, it, expect } from "vitest";
import { encodeSession, decodeSession, restoreGrade, restoreAward } from "./studySession";

const cards = [
  { id: "a", front: "Hund", back: "dog", srsBox: 0 },
  { id: "b", front: "Katze", back: "cat", srsBox: 1 },
  { id: "c", front: "Vogel", back: "bird", srsBox: 2 },
];
const queue = cards.map(card => ({ key: `flip:${card.id}`, type: "flip", cards: [card], payload: null }));
const session = {
  id: "session-1", ownerUid: "owner-1", origin: "study", drillId: "classic",
  initialQueue: queue, queue, index: 1, missed: [cards[0]], correctCount: 0,
  round: 1, gradedIds: ["a"], answerLog: [{ correct: false, repeat: false }],
  exerciseState: { stepKey: "flip:b", data: { flipped: true } },
};
const roundTrip = (source = session, live = cards, owner = "owner-1") =>
  decodeSession(JSON.parse(JSON.stringify(encodeSession(source))), live, owner);

describe("device-local session checkpoints", () => {
  it("restores the cursor, original order, answer state and already graded IDs", () => {
    const restored = roundTrip();
    expect(restored.queue.map(step => step.cards[0].id)).toEqual(["a", "b", "c"]);
    expect(restored.index).toBe(1);
    expect(restored.gradedIds).toEqual(["a"]);
    expect(restored.answerLog).toEqual(session.answerLog);
    expect(restored.exerciseState).toEqual(session.exerciseState);
  });
  it("keeps scheduler updates in the catalog rather than restoring old cards", () => {
    const live = [{ ...cards[0], fsrsReps: 3, srsBox: 4 }, ...cards.slice(1)];
    expect(roundTrip(session, live).queue[0].cards[0]).toBe(live[0]);
  });
  it("does not offer another account's session", () => {
    expect(roundTrip(session, cards, "owner-2")).toBeNull();
    expect(roundTrip(session, cards, null)).toBeNull();
    expect(roundTrip({ ...session, ownerUid: null }, cards, null)).toBeTruthy();
  });
  it("skips deleted steps without losing the cursor or resurrecting cards", () => {
    const restored = roundTrip(session, cards.slice(1));
    expect(restored.index).toBe(0);
    expect(restored.queue[0].cards[0].id).toBe("b");
    expect(restored.missed).toEqual([]);
  });
  it("skips a changed current question and drops its saved answer", () => {
    const restored = roundTrip(session, cards.map(card => card.id === "b" ? { ...card, back: "updated answer" } : card));
    expect(restored.queue[restored.index].cards[0].id).toBe("c");
    expect(restored.exerciseState).toBeNull();
  });
  it("does not resume completed, unsupported or malformed checkpoints", () => {
    const raw = encodeSession(session);
    for (const invalid of [null, {}, { ...raw, version: 99 }, { ...raw, index: -1 }, { ...raw, index: 3 }, { ...raw, gradedIds: null }]) {
      expect(decodeSession(invalid, cards, "owner-1")).toBeNull();
    }
    expect(roundTrip(session, cards.slice(0, 1))).toBeNull();
  });
  it("stores references once without duplicating front/back text", () => {
    const encoded = encodeSession(session);
    expect(Object.keys(encoded.steps)).toHaveLength(3);
    expect(JSON.stringify(encoded)).not.toContain("Hund");
    expect(encoded.queue).toEqual(encoded.initialQueue);
  });
  it("restores retry state without grading already reviewed cards again", () => {
    const retry = { ...session, round: 2, queue: queue.slice(0, 1), index: 0,
      missed: [], gradedIds: ["a", "b", "c"], answerLog: [] };
    const restored = roundTrip(retry);
    expect(restored.round).toBe(2);
    expect(restored.initialQueue).toHaveLength(3);
    expect(restored.gradedIds).toEqual(["a", "b", "c"]);
  });
});

describe("undoing the last answer also reverses its completed session award", () => {
  const before = { xp: 100, history: {}, streak: 1, reminder: { enabled: false } };
  const after = { ...before, xp: 150, history: { today: { cards: 3, xp: 50 } }, streak: 2 };
  it("restores XP, goal and streak changes while keeping other preferences and review history", () => {
    const current = { ...after, reminder: { enabled: true }, reviewLog: [{ id: "last" }] };
    expect(restoreAward(current, { before, after })).toEqual({ ...before, reminder: { enabled: true }, reviewLog: [{ id: "last" }] });
  });
  it("does not roll back a newer session or remote award", () => {
    expect(restoreAward({ ...after, xp: 200 }, { before, after })).toBeNull();
  });
});

describe("undo restores scheduling without replacing content", () => {
  const before = cards[0];
  const after = { ...before, fsrsLastReview: 123, fsrsReps: 1, fsrsLapses: 1,
    srsDue: 456, srsBox: 1, intervalDays: 1, leechSuspended: true, leechSuspendedAt: 123 };
  const receipt = { before, after };
  it("removes newly introduced FSRS, interval and suspension fields", () => {
    expect(restoreGrade(after, receipt)).toEqual(before);
  });
  it("retains unrelated edits and the sync timestamp", () => {
    expect(restoreGrade({ ...after, front: "Updated", updatedAt: 789 }, receipt))
      .toEqual({ ...before, front: "Updated", updatedAt: 789 });
  });
  it("refuses to overwrite a newer review, scheduling edit or deleted card", () => {
    expect(restoreGrade({ ...after, fsrsLastReview: 999 }, receipt)).toBeNull();
    expect(restoreGrade({ ...after, srsDue: 999 }, receipt)).toBeNull();
    expect(restoreGrade(null, receipt)).toBeNull();
  });
});
