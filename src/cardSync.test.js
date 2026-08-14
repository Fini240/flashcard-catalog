import { describe, it, expect } from "vitest";
import {
  mergeCardMaps, diffDirty, liveCards, toCardMap, sweepTombstones, cardsNeedingWrite,
  applyLocalEdits, TOMBSTONE_MAX_AGE_MS,
} from "./cardSync";

const card = (id, updatedAt, extra = {}) => ({ id, front: `f${id}`, back: `b${id}`, updatedAt, ...extra });

describe("mergeCardMaps — the 90-card regression tests", () => {
  it("two devices adding different cards both survive", () => {
    // The exact 90-card scenario: device A adds cards, device B adds others,
    // both sync. Whole-doc sync lost one side; per-card merge keeps both.
    const a = toCardMap([card("a1", 100), card("a2", 101)]);
    const b = toCardMap([card("b1", 102)]);
    const merged = mergeCardMaps(a, b);
    expect(Object.keys(merged).sort()).toEqual(["a1", "a2", "b1"]);
  });

  it("grading on one device and adding on the other keeps both changes", () => {
    const shared = card("shared", 100);
    const graded = { ...shared, srsBox: 2, updatedAt: 200 };     // device B studied it
    const a = toCardMap([shared, card("newOnA", 150)]);          // device A added a card
    const b = toCardMap([graded]);                               // device B's view
    const merged = mergeCardMaps(a, b);
    expect(merged.shared.srsBox).toBe(2);       // newer grade wins
    expect(merged.newOnA).toBeTruthy();         // A's addition survives
  });

  it("same-card concurrent edit: newer updatedAt wins, nothing else is touched", () => {
    const a = toCardMap([card("x", 100, { front: "old" }), card("y", 100)]);
    const b = toCardMap([card("x", 300, { front: "new" })]);
    const merged = mergeCardMaps(a, b);
    expect(merged.x.front).toBe("new");
    expect(merged.y).toBeTruthy();
  });

  it("a newer tombstone beats an older live card (delete propagates)", () => {
    const a = toCardMap([card("x", 100)]);
    const b = toCardMap([{ id: "x", updatedAt: 100, deletedAt: 200 }]);
    expect(liveCards(mergeCardMaps(a, b))).toEqual([]);
  });

  it("an older tombstone does NOT kill a card still being studied elsewhere", () => {
    // Phone was offline when the card was deleted, then the user kept
    // studying it on another device — the recent edit wins over the stale
    // tombstone.
    const a = toCardMap([{ id: "x", updatedAt: 100, deletedAt: 150 }]);
    const b = toCardMap([card("x", 300, { srsBox: 3 })]);
    const merged = mergeCardMaps(a, b);
    expect(merged.x.deletedAt).toBeUndefined();
    expect(merged.x.srsBox).toBe(3);
  });

  it("gives the same result in either direction when timestamps differ", () => {
    // The property that actually matters: which device happens to merge first
    // must not change the outcome. Compares values, not just key sets — a
    // key-only check passes even when the wrong version of a card wins.
    const a = toCardMap([card("x", 100, { front: "old" }), card("only-a", 100)]);
    const b = toCardMap([card("x", 300, { front: "new" }), card("only-b", 200)]);
    expect(mergeCardMaps(a, b)).toEqual(mergeCardMaps(b, a));
    expect(mergeCardMaps(a, b).x.front).toBe("new");
  });

  it("no card is ever dropped, whichever side it came from", () => {
    const a = toCardMap([card("a1", 100), card("shared", 100)]);
    const b = toCardMap([card("b1", 200), card("shared", 300)]);
    const merged = mergeCardMaps(a, b);
    expect(Object.keys(merged).sort()).toEqual(["a1", "b1", "shared"]);
    expect(liveCards(merged)).toHaveLength(3);
  });

  it("on an exact timestamp tie the second argument wins (documented, not ideal)", () => {
    // Two devices stamping the same millisecond is vanishingly rare, but the
    // tie-break is `rT >= lT`, so the result depends on argument order. Pinned
    // here so it's a deliberate choice rather than a surprise.
    const a = toCardMap([card("x", 100, { front: "local" })]);
    const b = toCardMap([card("x", 100, { front: "remote" })]);
    expect(mergeCardMaps(a, b).x.front).toBe("remote");
  });
});

describe("diffDirty", () => {
  it("only cards newer than their last push go up", () => {
    const local = toCardMap([card("a", 100), card("b", 200), card("c", 300)]);
    const pushed = { a: 100, b: 150 };
    expect(diffDirty(local, pushed).map(c => c.id).sort()).toEqual(["b", "c"]);
  });
  it("a fresh tombstone is dirty", () => {
    const local = toCardMap([{ id: "a", updatedAt: 100, deletedAt: 500 }]);
    expect(diffDirty(local, { a: 100 }).map(c => c.id)).toEqual(["a"]);
  });
  it("nothing dirty when pushed is current", () => {
    const local = toCardMap([card("a", 100)]);
    expect(diffDirty(local, { a: 100 })).toEqual([]);
  });
});

describe("liveCards / toCardMap", () => {
  it("filters tombstones and round-trips", () => {
    const map = toCardMap([card("a", 1), { id: "b", updatedAt: 1, deletedAt: 2 }]);
    expect(liveCards(map).map(c => c.id)).toEqual(["a"]);
  });
});

describe("sweepTombstones", () => {
  it("sweeps only tombstones older than the retention window", () => {
    const now = Date.now();
    const map = toCardMap([
      { id: "old", updatedAt: 1, deletedAt: now - TOMBSTONE_MAX_AGE_MS - 1 },
      { id: "fresh", updatedAt: 1, deletedAt: now - 1000 },
      card("live", 1),
    ]);
    const { map: kept, swept } = sweepTombstones(map, now);
    expect(swept).toEqual(["old"]);
    expect(Object.keys(kept).sort()).toEqual(["fresh", "live"]);
  });
});

describe("cardsNeedingWrite — the repeat-migration regression tests", () => {
  it("a re-run over an already-migrated subcollection writes nothing", () => {
    // A client on an old build overwrites the parent doc and drops
    // cardsMigratedAt, so the next new client migrates again. The parent's
    // cards array is a pre-migration snapshot; writing it back must not
    // happen when the subcollection already holds the same cards.
    const parentSnapshot = toCardMap([card("a", 100), card("b", 100)]);
    const subcollection = toCardMap([card("a", 100), card("b", 100)]);
    const merged = mergeCardMaps(parentSnapshot, subcollection);
    expect(cardsNeedingWrite(merged, subcollection)).toEqual([]);
  });

  it("a re-run never rolls a card back to its pre-migration state", () => {
    // The card was studied after the migration, so the subcollection copy is
    // newer than the stale copy still sitting in the parent doc's array.
    const parentSnapshot = toCardMap([card("x", 100, { srsBox: 0 })]);
    const subcollection = toCardMap([card("x", 500, { srsBox: 4 })]);
    const merged = mergeCardMaps(parentSnapshot, subcollection);
    expect(merged.x.srsBox).toBe(4);
    expect(cardsNeedingWrite(merged, subcollection)).toEqual([]);
  });

  it("a re-run does not resurrect a card deleted after the migration", () => {
    const parentSnapshot = toCardMap([card("gone", 100)]);
    const subcollection = toCardMap([{ id: "gone", updatedAt: 100, deletedAt: 400 }]);
    const merged = mergeCardMaps(parentSnapshot, subcollection);
    expect(merged.gone.deletedAt).toBe(400);
    expect(liveCards(merged)).toEqual([]);
    expect(cardsNeedingWrite(merged, subcollection)).toEqual([]);
  });

  it("still writes cards the subcollection is genuinely missing", () => {
    // The offline-created card that only exists in the parent snapshot has to
    // reach the subcollection, or migrating would lose it.
    const parentSnapshot = toCardMap([card("known", 100), card("onlyInParent", 100)]);
    const subcollection = toCardMap([card("known", 100)]);
    const merged = mergeCardMaps(parentSnapshot, subcollection);
    expect(cardsNeedingWrite(merged, subcollection).map(c => c.id)).toEqual(["onlyInParent"]);
  });
});

// The bug: study a few cards, reload, all the progress is gone.
//
// Card objects are produced by applyGrade, which knows nothing about sync and
// never set updatedAt. The map maintenance stamped only cards that arrived
// with no timestamp at all, so a studied card kept the stamp it was downloaded
// with. diffDirty then never saw it as dirty (so the progress never left the
// device) and mergeCardMaps gives ties to the remote copy (so the next load
// replaced the studied card with the version it came from).
describe("applyLocalEdits — studying a card must survive a reload", () => {
  const graded = (c, box) => ({ ...c, srsBox: box, srsPeak: box, srsDue: 999 });

  it("stamps a card that was studied", () => {
    const before = toCardMap([card("c1", 100)]);
    const after = applyLocalEdits(before, [graded(card("c1", 100), 2)], { now: 500 });
    expect(after.c1.updatedAt).toBe(500);
    expect(after.c1.srsBox).toBe(2);
  });

  it("uploads that card — it is dirty against the last push", () => {
    const pushed = { c1: 100 };
    const after = applyLocalEdits(toCardMap([card("c1", 100)]), [graded(card("c1", 100), 2)], { now: 500 });
    expect(diffDirty(after, pushed).map((c) => c.id)).toEqual(["c1"]);
  });

  it("beats the remote copy it was derived from, instead of being replaced", () => {
    const remote = toCardMap([card("c1", 100)]);              // what the cloud still holds
    const local = applyLocalEdits(remote, [graded(card("c1", 100), 2)], { now: 500 });
    expect(mergeCardMaps(local, remote).c1.srsBox).toBe(2);
  });

  it("survives the whole round trip: study, reload, merge", () => {
    const remote = toCardMap([card("c1", 100), card("c2", 100)]);
    // studied locally
    const afterStudy = applyLocalEdits(remote, [graded(card("c1", 100), 3), card("c2", 100)], { now: 500 });
    // reload: local storage is re-read and merged with what the cloud holds
    const reloaded = mergeCardMaps(toCardMap(liveCards(afterStudy)), remote);
    expect(reloaded.c1.srsBox).toBe(3);
    expect(reloaded.c1.updatedAt).toBe(500);
  });

  it("leaves untouched cards alone, so a session doesn't push the whole deck", () => {
    const before = toCardMap([card("c1", 100), card("c2", 100), card("c3", 100)]);
    const after = applyLocalEdits(before, [graded(card("c1", 100), 1), card("c2", 100), card("c3", 100)], { now: 500 });
    expect(diffDirty(after, { c1: 100, c2: 100, c3: 100 }).map((c) => c.id)).toEqual(["c1"]);
    expect(after.c2.updatedAt).toBe(100);
    expect(after.c3.updatedAt).toBe(100);
  });

  it("treats an edit to the card's text as a change too", () => {
    const before = toCardMap([card("c1", 100)]);
    const after = applyLocalEdits(before, [{ ...card("c1", 100), back: "rewritten" }], { now: 500 });
    expect(after.c1.updatedAt).toBe(500);
  });

  it("notices a changed list of manual wrong answers", () => {
    const before = toCardMap([card("c1", 100, { manualOptions: ["a", "b"] })]);
    const same = applyLocalEdits(before, [card("c1", 100, { manualOptions: ["a", "b"] })], { now: 500 });
    expect(same.c1.updatedAt).toBe(100);
    const changed = applyLocalEdits(before, [card("c1", 100, { manualOptions: ["a", "c"] })], { now: 500 });
    expect(changed.c1.updatedAt).toBe(500);
  });

  it("does not resurrect a card another device deleted", () => {
    const before = { c1: { ...card("c1", 100), deletedAt: 200 } };
    const after = applyLocalEdits(before, [graded(card("c1", 100), 2)], { now: 500 });
    expect(after.c1.deletedAt).toBe(200);
  });

  it("tombstones a deleted card in per-card mode", () => {
    const before = toCardMap([card("c1", 100), card("c2", 100)]);
    const after = applyLocalEdits(before, [card("c1", 100)], { now: 500, perCardMode: true });
    expect(after.c2.deletedAt).toBe(500);
  });

  it("drops a deleted card outright in legacy mode", () => {
    const before = toCardMap([card("c1", 100), card("c2", 100)]);
    const after = applyLocalEdits(before, [card("c1", 100)], { now: 500, perCardMode: false });
    expect(after.c2).toBeUndefined();
  });

  it("stamps a card that has never been stamped", () => {
    const after = applyLocalEdits({}, [{ id: "new", front: "f", back: "b" }], { now: 500 });
    expect(after.new.updatedAt).toBe(500);
  });
});

// Rescues progress made *before* local edits were stamped: on those devices the
// studied card and the cloud's stale copy carry the same timestamp, and the
// tie used to go to the cloud.
describe("mergeCardMaps — a tie goes to the card that has been studied", () => {
  it("keeps local progress when the timestamps are identical", () => {
    const stale = card("c1", 100, { srsBox: 0, srsPeak: 0 });
    const studied = card("c1", 100, { srsBox: 3, srsPeak: 3 });
    expect(mergeCardMaps({ c1: studied }, { c1: stale }).c1.srsBox).toBe(3);
  });

  it("takes the remote's progress on a tie when the remote is the studied one", () => {
    const stale = card("c1", 100, { srsBox: 0, srsPeak: 0 });
    const studied = card("c1", 100, { srsBox: 3, srsPeak: 3 });
    expect(mergeCardMaps({ c1: stale }, { c1: studied }).c1.srsBox).toBe(3);
  });

  it("still lets a genuinely newer remote win, progress or not", () => {
    const local = card("c1", 100, { srsBox: 5, srsPeak: 5 });
    const remote = card("c1", 200, { srsBox: 1, srsPeak: 1 });
    expect(mergeCardMaps({ c1: local }, { c1: remote }).c1.srsBox).toBe(1);
  });

  it("still lets a genuinely newer local win", () => {
    const local = card("c1", 300, { srsBox: 1, srsPeak: 1 });
    const remote = card("c1", 200, { srsBox: 5, srsPeak: 5 });
    expect(mergeCardMaps({ c1: local }, { c1: remote }).c1.srsBox).toBe(1);
  });

  it("falls back to the remote when a tie is genuinely indistinguishable", () => {
    const local = card("c1", 100, { srsBox: 2, srsPeak: 2, back: "local" });
    const remote = card("c1", 100, { srsBox: 2, srsPeak: 2, back: "remote" });
    expect(mergeCardMaps({ c1: local }, { c1: remote }).c1.back).toBe("remote");
  });

  it("does not let a tie override a newer tombstone", () => {
    const local = card("c1", 100, { srsBox: 4, srsPeak: 4 });
    const remote = { ...card("c1", 100), deletedAt: 300 };
    expect(mergeCardMaps({ c1: local }, { c1: remote }).c1.deletedAt).toBe(300);
  });
});
