import { describe, it, expect } from "vitest";
import { folderOptions, groupKey, expandSelection, moveCards } from "./moveCards";

const subjects = [
  {
    id: "bio", name: "Biology", children: [
      { id: "cells", name: "Cells", children: [{ id: "membranes", name: "Membranes", children: [] }] },
    ],
  },
  { id: "esp", name: "Español", children: [{ id: "verbs", name: "Verbs", children: [] }] },
];

const card = (id, nodeId, extra = {}) => ({ id, nodeId, subjectId: "bio", front: id, back: id, ...extra });

describe("folderOptions", () => {
  it("flattens every folder with its depth, full path and subject", () => {
    expect(folderOptions(subjects)).toEqual([
      { nodeId: "bio", name: "Biology", depth: 0, subjectId: "bio", path: ["Biology"], label: "Biology" },
      { nodeId: "cells", name: "Cells", depth: 1, subjectId: "bio", path: ["Biology", "Cells"], label: "Biology / Cells" },
      { nodeId: "membranes", name: "Membranes", depth: 2, subjectId: "bio", path: ["Biology", "Cells", "Membranes"], label: "Biology / Cells / Membranes" },
      { nodeId: "esp", name: "Español", depth: 0, subjectId: "esp", path: ["Español"], label: "Español" },
      { nodeId: "verbs", name: "Verbs", depth: 1, subjectId: "esp", path: ["Español", "Verbs"], label: "Español / Verbs" },
    ]);
  });

  // A folder option is handed straight to moveCards as its target, so the key
  // it names the folder with has to be the key moveCards reads.
  it("names the folder with the same key moveCards moves cards to", () => {
    const [biology] = folderOptions(subjects);
    const [moved] = moveCards([card("a", "cells")], ["a"], biology);
    expect(moved.nodeId).toBe("bio");
  });

  it("survives an empty or missing tree", () => {
    expect(folderOptions([])).toEqual([]);
    expect(folderOptions(undefined)).toEqual([]);
  });
});

describe("moveCards", () => {
  it("sets the new folder and the new subject together", () => {
    const cards = [card("a", "cells"), card("b", "cells")];
    const moved = moveCards(cards, ["a"], { nodeId: "verbs", subjectId: "esp" });
    expect(moved[0]).toMatchObject({ id: "a", nodeId: "verbs", subjectId: "esp" });
    expect(moved[1]).toBe(cards[1]);
  });

  // The whole reason this module exists: drills.js reads subjectId, so a card
  // that moved house while still claiming its old subject gets no distractors.
  it("never leaves a card claiming the subject it left", () => {
    const cards = [card("a", "cells", { subjectId: "gone" })];
    const [moved] = moveCards(cards, ["a"], { nodeId: "verbs", subjectId: "esp" });
    expect(moved.subjectId).toBe("esp");
  });

  it("does not stamp updatedAt — applyLocalEdits is the only place allowed to", () => {
    const cards = [card("a", "cells", { updatedAt: 42 })];
    const [moved] = moveCards(cards, ["a"], { nodeId: "verbs", subjectId: "esp" });
    expect(moved.updatedAt).toBe(42);
  });

  it("returns the same array when nothing would change", () => {
    const cards = [card("a", "cells")];
    expect(moveCards(cards, ["a"], "")).toBe(cards);
    expect(moveCards(cards, [], { nodeId: "verbs", subjectId: "esp" })).toBe(cards);
    expect(moveCards(cards, ["a"], { nodeId: "cells", subjectId: "bio" })).toBe(cards);
  });

  it("accepts a bare nodeId and then leaves subjectId alone", () => {
    const cards = [card("a", "cells")];
    const [moved] = moveCards(cards, ["a"], "verbs");
    expect(moved.nodeId).toBe("verbs");
    expect(moved.subjectId).toBe("bio");
  });
});

describe("groupKey", () => {
  it("groups the deletions of one cloze text in one folder", () => {
    const a = card("a", "cells", { clozeSource: "The {{c1::nucleus}} and the {{c2::ribosome}}" });
    const b = card("b", "cells", { clozeSource: "The {{c1::nucleus}} and the {{c2::ribosome}}" });
    expect(groupKey(a)).toBe(groupKey(b));
  });

  it("does not group the same text filed in two different folders", () => {
    const a = card("a", "cells", { clozeSource: "x {{c1::y}}" });
    const b = card("b", "verbs", { clozeSource: "x {{c1::y}}" });
    expect(groupKey(a)).not.toBe(groupKey(b));
  });

  it("groups the masks of one occluded image, and leaves plain cards alone", () => {
    const a = card("a", "cells", { frontImageId: "img1", occlusionMaskId: "m1" });
    const b = card("b", "cells", { frontImageId: "img1", occlusionMaskId: "m2" });
    expect(groupKey(a)).toBe(groupKey(b));
    // A picture card that isn't occluded is its own card, not part of a set.
    expect(groupKey(card("c", "cells", { frontImageId: "img1" }))).toBe(null);
    expect(groupKey(card("d", "cells"))).toBe(null);
    expect(groupKey(null)).toBe(null);
  });
});

describe("expandSelection", () => {
  const clozeA = card("a", "cells", { clozeSource: "The {{c1::x}} and {{c2::y}}" });
  const clozeB = card("b", "cells", { clozeSource: "The {{c1::x}} and {{c2::y}}" });
  const plain = card("c", "cells");

  it("pulls in the rest of a cloze group, so a move can't split one", () => {
    expect(expandSelection([clozeA, clozeB, plain], ["a"])).toEqual(["a", "b"]);
  });

  it("leaves a selection of ordinary cards exactly as chosen", () => {
    expect(expandSelection([clozeA, clozeB, plain], ["c"])).toEqual(["c"]);
  });

  it("does not pull in a group the selection never touched", () => {
    const other = card("d", "cells", { clozeSource: "Another {{c1::z}}" });
    expect(expandSelection([clozeA, clozeB, plain, other], ["a", "c"])).toEqual(["a", "b", "c"]);
  });

  it("ignores tombstones and an empty selection", () => {
    const dead = card("e", "cells", { clozeSource: "The {{c1::x}} and {{c2::y}}", deletedAt: 1 });
    expect(expandSelection([clozeA, clozeB, dead], ["a"])).toEqual(["a", "b"]);
    expect(expandSelection([clozeA], [])).toEqual([]);
  });
});
