import { describe, it, expect } from "vitest";
import { findOrphans, groupOrphans, rehome, nodeIdsIn } from "./orphans";

const tree = [
  { id: "bio", name: "Biology", children: [
    { id: "summer", name: "summer work", children: [] },
    { id: "chem", name: "chemistry", children: [
      { id: "atom", name: "1.2 The nuclear atom", children: [] },
    ] },
  ] },
];
const card = (id, nodeId, extra = {}) => ({ id, nodeId, front: `f${id}`, back: `b${id}`, ...extra });

describe("findOrphans", () => {
  it("finds cards pointing at a folder that isn't in the tree", () => {
    // The 2026-09-15 account: 90 cards in a folder that survived, 24 in five
    // that didn't. The cards were all there and none of them could be opened.
    const cards = [
      card("a", "atom"), card("b", "summer"),
      card("c", "caqn8o91jxmu0vm0dn"), card("d", "caqn8o91jxmu0vm0dn"),
      card("e", "0zs5zvar7gbmu0xdiss"),
    ];
    expect(findOrphans(cards, tree).map((c) => c.id)).toEqual(["c", "d", "e"]);
  });

  it("counts a subject's own id as a folder — cards can sit directly on one", () => {
    expect(findOrphans([card("a", "bio")], tree)).toEqual([]);
  });

  it("ignores tombstones: a deleted card is not a lost one", () => {
    expect(findOrphans([card("a", "gone", { deletedAt: 5 })], tree)).toEqual([]);
  });

  it("says everything is orphaned when the tree is empty, and survives no input", () => {
    // Which is why nothing may act on this automatically — an empty tree is
    // also what a client holds for the moment before its first sync lands.
    expect(findOrphans([card("a", "atom")], [])).toHaveLength(1);
    expect(findOrphans(null, null)).toEqual([]);
    expect(nodeIdsIn(null).size).toBe(0);
  });
});

describe("groupOrphans", () => {
  it("groups by the folder they shared, biggest first, with the last date worked on", () => {
    const groups = groupOrphans([
      card("a", "x", { updatedAt: 100 }),
      card("b", "y", { updatedAt: 500 }),
      card("c", "x", { updatedAt: 300 }),
      card("d", "x", { updatedAt: 200 }),
    ]);
    expect(groups.map((g) => [g.nodeId, g.cards.length])).toEqual([["x", 3], ["y", 1]]);
    expect(groups[0].lastEdited).toBe(300);
  });
});

describe("rehome", () => {
  it("refiles only the cards asked for, and leaves everything else identical", () => {
    const cards = [card("a", "lost"), card("b", "lost"), card("c", "atom")];
    const moved = rehome(cards, ["a", "b"], "summer");
    expect(moved.map((c) => c.nodeId)).toEqual(["summer", "summer", "atom"]);
    expect(moved[2]).toBe(cards[2]); // untouched cards keep their identity
  });

  it("does not stamp updatedAt — cardSync is the only place allowed to", () => {
    // Two places stamping a card is the hazard that cost a whole study
    // session once; applyLocalEdits sees the changed nodeId by itself.
    const moved = rehome([card("a", "lost", { updatedAt: 42 })], ["a"], "summer");
    expect(moved[0].updatedAt).toBe(42);
  });

  it("is a no-op without a target or without anything to move", () => {
    const cards = [card("a", "lost")];
    expect(rehome(cards, ["a"], "")).toBe(cards);
    expect(rehome(cards, [], "summer")).toBe(cards);
  });
});
