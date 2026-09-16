import { describe, it, expect } from "vitest";
import {
  normalizeTag, parseTags, formatTags, cardTags, hasTag, addTag, removeTag,
  tagCounts, filterByTags, expandHierarchy, matchesHierarchical, renameTag, deleteTag,
  MAX_TAGS_PER_CARD, MAX_TAG_LENGTH,
} from "./tags";
import { parse } from "./noteToCards";

describe("normalizeTag", () => {
  it("accepts what people actually type", () => {
    expect(normalizeTag("#Exam")).toBe("exam");
    expect(normalizeTag("  exam ")).toBe("exam");
    expect(normalizeTag("past paper")).toBe("past-paper");
    expect(normalizeTag("physics/optics")).toBe("physics/optics");
    expect(normalizeTag("##exam!!")).toBe("exam");
  });

  // This app is used to study languages, by someone writing in German. An
  // ASCII-only normaliser deleted the letter rather than rejecting the tag.
  it("keeps letters that are not ASCII", () => {
    expect(normalizeTag("#Prüfung")).toBe("prüfung");
    expect(normalizeTag("Größe")).toBe("größe");
    expect(normalizeTag("Español")).toBe("español");
    expect(normalizeTag("математика")).toBe("математика");
    expect(normalizeTag("数学")).toBe("数学");
  });

  it("does not turn one tag into two different ones", () => {
    expect(normalizeTag("#prüfung")).toBe(normalizeTag("Prüfung"));
  });

  it("caps the length and strips stray separators", () => {
    expect(normalizeTag("-/exam/-")).toBe("exam");
    expect(normalizeTag("a".repeat(40))).toHaveLength(MAX_TAG_LENGTH);
    expect(normalizeTag("a--b")).toBe("a-b");
    expect(normalizeTag("")).toBe("");
    expect(normalizeTag(null)).toBe("");
  });
});

describe("parseTags", () => {
  it("splits on commas, newlines and spaces alike", () => {
    expect(parseTags("#exam, formulas  physics/optics")).toEqual(["exam", "formulas", "physics/optics"]);
    expect(parseTags("a\nb")).toEqual(["a", "b"]);
  });

  it("takes an array as readily as a string, and dedupes either", () => {
    expect(parseTags(["#Exam", "exam", " EXAM "])).toEqual(["exam"]);
    expect(parseTags("exam exam")).toEqual(["exam"]);
  });

  it("caps how many one card can carry", () => {
    const many = Array.from({ length: 30 }, (_, i) => `t${i}`);
    expect(parseTags(many)).toHaveLength(MAX_TAGS_PER_CARD);
  });

  it("carries German tags through unmangled", () => {
    expect(parseTags("#prüfung, #español")).toEqual(["prüfung", "español"]);
  });
});

describe("a card's tags", () => {
  it("reads missing or malformed tags as none", () => {
    expect(cardTags(undefined)).toEqual([]);
    expect(cardTags({ tags: "exam" })).toEqual([]);
  });

  it("adds, removes and tests by normalised form", () => {
    const card = { id: "a" };
    const tagged = addTag(card, "#Exam");
    expect(tagged.tags).toEqual(["exam"]);
    expect(hasTag(tagged, "EXAM")).toBe(true);
    // Adding the same tag twice is not a change, so sync sees no edit.
    expect(addTag(tagged, "exam")).toBe(tagged);
    expect(removeTag(tagged, "#exam").tags).toEqual([]);
    expect(removeTag(tagged, "nope")).toBe(tagged);
  });

  it("formats them back the way they were typed", () => {
    expect(formatTags(["exam", "physics/optics"])).toBe("#exam #physics/optics");
    expect(formatTags(null)).toBe("");
  });
});

describe("tagCounts", () => {
  it("is most-used first, then alphabetical so the order never jitters", () => {
    const cards = [
      { tags: ["exam", "optics"] },
      { tags: ["exam", "atoms"] },
      { tags: ["exam"] },
    ];
    expect(tagCounts(cards)).toEqual([
      { tag: "exam", count: 3 },
      { tag: "atoms", count: 1 },
      { tag: "optics", count: 1 },
    ]);
  });
});

describe("filterByTags", () => {
  const cards = [
    { id: "a", tags: ["exam", "optics"] },
    { id: "b", tags: ["exam"] },
    { id: "c", tags: [] },
  ];

  it("narrows with AND by default", () => {
    expect(filterByTags(cards, ["exam", "optics"]).map((c) => c.id)).toEqual(["a"]);
  });

  it("unions in any mode", () => {
    expect(filterByTags(cards, ["optics"], "any").map((c) => c.id)).toEqual(["a"]);
    expect(filterByTags(cards, ["exam", "optics"], "any").map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("with no tags chosen is not a filter at all", () => {
    expect(filterByTags(cards, [])).toBe(cards);
  });
});

describe("hierarchy", () => {
  it("implies every parent of a nested tag", () => {
    expect(expandHierarchy(["physics/optics/lenses"])).toEqual([
      "physics", "physics/optics", "physics/optics/lenses",
    ]);
  });

  it("matches a card by an ancestor it never spelled out", () => {
    const card = { tags: ["physics/optics"] };
    expect(matchesHierarchical(card, "physics")).toBe(true);
    expect(matchesHierarchical(card, "chemistry")).toBe(false);
  });
});

describe("renameTag and deleteTag", () => {
  const cards = [
    { id: "a", tags: ["physics", "exam"] },
    { id: "b", tags: ["physics/optics"] },
    { id: "c", tags: ["chemistry"] },
  ];

  it("renames the tag and everything beneath it, returning only what changed", () => {
    const changed = renameTag(cards, "physics", "natural-science");
    expect(changed.map((c) => c.id)).toEqual(["a", "b"]);
    expect(changed[0].tags).toEqual(["natural-science", "exam"]);
    expect(changed[1].tags).toEqual(["natural-science/optics"]);
  });

  it("refuses a rename that would be a no-op or nonsense", () => {
    expect(renameTag(cards, "physics", "physics")).toEqual([]);
    expect(renameTag(cards, "", "x")).toEqual([]);
    expect(renameTag(cards, "physics", "!!")).toEqual([]);
  });

  it("deletes the tag and its children, leaving other tags alone", () => {
    const changed = deleteTag(cards, "physics");
    expect(changed.map((c) => c.id)).toEqual(["a", "b"]);
    expect(changed[0].tags).toEqual(["exam"]);
    expect(changed[1].tags).toEqual([]);
  });
});

// noteToCards has its own copy of the tag pattern, and it has to agree with
// normalizeTag. When it didn't, `#prüfung` was read as the tag `pr` and the
// remaining `üfung` was left behind inside the card's answer.
describe("inline tags in notes", () => {
  it("pulls a German tag out whole, leaving no debris in the card", () => {
    const { drafts } = parse("Zelle :: kleinste Einheit #prüfung");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].back).toBe("kleinste Einheit");
    expect(drafts[0].tags).toEqual(["prüfung"]);
  });

  it("still handles a plain ASCII tag", () => {
    const { drafts } = parse("cell :: smallest unit #exam");
    expect(drafts[0].back).toBe("smallest unit");
    expect(drafts[0].tags).toEqual(["exam"]);
  });
});
