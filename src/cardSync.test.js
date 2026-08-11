import { describe, it, expect } from "vitest";
import {
  mergeCardMaps, diffDirty, liveCards, toCardMap, sweepTombstones, cardsNeedingWrite, TOMBSTONE_MAX_AGE_MS,
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
