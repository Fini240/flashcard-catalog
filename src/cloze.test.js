import { describe, it, expect } from "vitest";
import * as cloze from "./cloze";
import * as tags from "./tags";
import * as noteToCards from "./noteToCards";

describe("cloze parsing", () => {
  const text = "The {{c1::mitochondrion}} is the powerhouse of the {{c2::cell}}.";

  it("finds every distinct number, ascending", () => {
    expect(cloze.clozeNumbers(text)).toEqual([1, 2]);
    expect(cloze.clozeNumbers("{{c3::a}} {{c1::b}} {{c3::c}}")).toEqual([1, 3]);
    expect(cloze.clozeNumbers("no markup here")).toEqual([]);
  });

  // The other blanks must read as plain words, or the card asks two questions.
  it("hides only its own number and shows the rest as text", () => {
    const c1 = cloze.render(text, 1);
    expect(c1.question).toBe("The […] is the powerhouse of the cell.");
    expect(c1.answer).toBe("The mitochondrion is the powerhouse of the cell.");
    const c2 = cloze.render(text, 2);
    expect(c2.question).toBe("The mitochondrion is the powerhouse of the […].");
  });

  it("shows a hint in place of the blank when one is given", () => {
    const { question } = cloze.render("{{c1::Paris::capital}} is in France.", 1);
    expect(question).toBe("[capital] is in France.");
  });

  it("hides every deletion sharing a number at once", () => {
    const both = cloze.render("{{c1::a}} and {{c1::b}} and {{c2::c}}", 1);
    expect(both.question).toBe("[…] and […] and c");
    expect(cloze.answersFor("{{c1::a}} and {{c1::b}}", 1)).toEqual(["a", "b"]);
  });

  it("strips markup for previews", () => {
    expect(cloze.plainText(text)).toBe("The mitochondrion is the powerhouse of the cell.");
    expect(cloze.plainText("{{c1::Paris::capital}}")).toBe("Paris");
  });

  it("leaves malformed markup alone instead of eating the rest of the text", () => {
    expect(cloze.hasCloze("{{c1::unclosed")).toBe(false);
    expect(cloze.plainText("{{c1::unclosed and more text")).toBe("{{c1::unclosed and more text");
  });
});

describe("expanding a source into cards", () => {
  const text = "The {{c1::mitochondrion}} powers the {{c2::cell}}.";

  it("produces one card per number", () => {
    const cards = cloze.expand(text);
    expect(cards).toHaveLength(2);
    expect(cards[0].clozeIndex).toBe(1);
    expect(cards[1].clozeIndex).toBe(2);
    expect(cards[0].clozeTotal).toBe(2);
  });

  // The failure this exists to prevent: fixing a typo in c2 must not reset the
  // months of scheduling history sitting on c1.
  it("keeps the identity and schedule of cards that survive an edit", () => {
    const existing = [
      { id: "keep-me", clozeIndex: 1, fsrsStability: 42, srsBox: 5 },
      { id: "other", clozeIndex: 2, fsrsStability: 3 },
    ];
    const edited = "The {{c1::mitochondrion}} powers the {{c2::eukaryotic cell}}.";
    const cards = cloze.expand(edited, { existing });
    const c1 = cards.find((c) => c.clozeIndex === 1);
    expect(c1.id).toBe("keep-me");
    expect(c1.fsrsStability).toBe(42);
    expect(c1.srsBox).toBe(5);
  });

  it("reports cards whose number no longer exists", () => {
    const existing = [{ id: "a", clozeIndex: 1 }, { id: "b", clozeIndex: 2 }, { id: "c", clozeIndex: 3 }];
    const gone = cloze.orphaned("only {{c1::one}} left", existing);
    expect(gone.map((c) => c.id)).toEqual(["b", "c"]);
  });

  it("returns nothing for text with no deletions", () => {
    expect(cloze.expand("plain text")).toEqual([]);
  });
});

describe("wrapping a selection", () => {
  it("uses the next free number", () => {
    const out = cloze.wrapSelection("The cell is small", 4, 8);
    expect(out.text).toBe("The {{c1::cell}} is small");
    expect(out.number).toBe(1);
    const second = cloze.wrapSelection(out.text, 20, 25);
    expect(second.number).toBe(2);
  });

  it("can reuse the previous number to hide a pair together", () => {
    const first = cloze.wrapSelection("alpha beta", 0, 5);
    const second = cloze.wrapSelection(first.text, 15, 19, { sameAsLast: true });
    expect(cloze.clozeNumbers(second.text)).toEqual([1]);
  });

  it("does nothing without a selection", () => {
    expect(cloze.wrapSelection("abc", 2, 2).text).toBe("abc");
  });
});

describe("tags", () => {
  it("normalises the ways a person might type the same tag", () => {
    expect(tags.normalizeTag("#Exam")).toBe("exam");
    expect(tags.normalizeTag("  exam  ")).toBe("exam");
    expect(tags.normalizeTag("past paper")).toBe("past-paper");
    expect(tags.normalizeTag("Physics/Optics")).toBe("physics/optics");
    expect(tags.normalizeTag("!!!")).toBe("");
  });

  it("parses the separators people actually use", () => {
    expect(tags.parseTags("#exam, formulas  physics")).toEqual(["exam", "formulas", "physics"]);
    expect(tags.parseTags(["a", "a", "b"])).toEqual(["a", "b"]);
  });

  it("adds and removes without mutating", () => {
    const card = { id: "a", tags: ["exam"] };
    expect(tags.addTag(card, "#Formulas").tags).toEqual(["exam", "formulas"]);
    expect(card.tags).toEqual(["exam"]);
    expect(tags.removeTag(card, "exam").tags).toEqual([]);
    expect(tags.addTag(card, "exam")).toBe(card); // already there — no new object
  });

  it("counts tags most-used first, ties alphabetical", () => {
    const cards = [{ tags: ["b", "a"] }, { tags: ["a"] }, { tags: ["a", "c"] }, { tags: ["c"] }];
    expect(tags.tagCounts(cards)).toEqual([
      { tag: "a", count: 3 },
      { tag: "c", count: 2 },
      { tag: "b", count: 1 },
    ]);
  });

  it("filters with AND by default and OR on request", () => {
    const cards = [
      { id: "1", tags: ["exam", "optics"] },
      { id: "2", tags: ["exam"] },
      { id: "3", tags: ["optics"] },
    ];
    expect(tags.filterByTags(cards, ["exam", "optics"]).map((c) => c.id)).toEqual(["1"]);
    expect(tags.filterByTags(cards, ["exam", "optics"], "any").map((c) => c.id)).toEqual(["1", "2", "3"]);
    expect(tags.filterByTags(cards, [])).toHaveLength(3);
  });

  it("treats a hierarchical tag as implying its parents", () => {
    expect(tags.expandHierarchy(["physics/optics/lenses"])).toEqual([
      "physics",
      "physics/optics",
      "physics/optics/lenses",
    ]);
    expect(tags.matchesHierarchical({ tags: ["physics/optics"] }, "physics")).toBe(true);
    expect(tags.matchesHierarchical({ tags: ["physics"] }, "physics/optics")).toBe(false);
  });

  it("renames a tag and everything beneath it, returning only what changed", () => {
    const cards = [
      { id: "1", tags: ["physics", "x"] },
      { id: "2", tags: ["physics/optics"] },
      { id: "3", tags: ["biology"] },
    ];
    const changed = tags.renameTag(cards, "physics", "phys");
    expect(changed.map((c) => c.id)).toEqual(["1", "2"]);
    expect(changed[0].tags).toEqual(["phys", "x"]);
    expect(changed[1].tags).toEqual(["phys/optics"]);
  });

  it("deletes a tag and its children", () => {
    const cards = [{ id: "1", tags: ["physics/optics", "keep"] }];
    expect(tags.deleteTag(cards, "physics")[0].tags).toEqual(["keep"]);
  });
});

describe("notes to cards", () => {
  it("turns :: lines into cards and leaves prose alone", () => {
    const { cards } = noteToCards.toCards(
      "This paragraph is just notes.\nmitochondrion :: powerhouse of the cell\nMore prose."
    );
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ front: "mitochondrion", back: "powerhouse of the cell" });
  });

  it("makes ::: two cards, one each way", () => {
    const { cards } = noteToCards.toCards("Hund ::: dog");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({ front: "Hund", back: "dog" });
    expect(cards[1]).toMatchObject({ front: "dog", back: "Hund", reversed: true });
  });

  // ::: has to be tested before ::, or the answer starts with a stray colon.
  it("does not parse ::: as :: with a leading colon", () => {
    const { cards } = noteToCards.toCards("a ::: b");
    expect(cards[0].back).toBe("b");
  });

  it("files cards under the headings above them", () => {
    const { cards } = noteToCards.toCards(`# Biology
## Cells
mitochondrion :: powerhouse
## Genetics
allele :: variant of a gene`);
    expect(cards[0].path).toEqual(["Biology", "Cells"]);
    expect(cards[1].path).toEqual(["Biology", "Genetics"]);
  });

  it("reads bullet and dash vocabulary lists", () => {
    const { cards } = noteToCards.toCards("- der Hund — the dog\n* die Katze - the cat");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({ front: "der Hund", back: "the dog" });
    expect(cards[1]).toMatchObject({ front: "die Katze", back: "the cat" });
  });

  // "e-mail" must not split on the hyphen inside the word.
  it("only splits on a dash with spaces around it", () => {
    const { cards } = noteToCards.toCards("e-mail address");
    expect(cards).toHaveLength(0);
  });

  it("pairs Q: and A: lines", () => {
    const { cards } = noteToCards.toCards("Q: What is 2+2?\nA: 4");
    expect(cards[0]).toMatchObject({ front: "What is 2+2?", back: "4" });
  });

  it("drops a question whose answer never arrives", () => {
    const { cards } = noteToCards.toCards("Q: dangling\n\nunrelated prose");
    expect(cards).toHaveLength(0);
  });

  it("expands a cloze line into one card per number", () => {
    const { cards } = noteToCards.toCards("The {{c1::heart}} pumps {{c2::blood}}.");
    expect(cards).toHaveLength(2);
    expect(cards[0].front).toContain("[…]");
  });

  it("pulls inline #tags out of the card text", () => {
    const { cards } = noteToCards.toCards("mitochondrion :: powerhouse #exam #biology");
    expect(cards[0].back).toBe("powerhouse");
    expect(cards[0].tags).toEqual(["exam", "biology"]);
  });

  it("counts without building, for the live preview", () => {
    expect(noteToCards.countCards("a :: b\nc ::: d")).toBe(3);
  });
});
