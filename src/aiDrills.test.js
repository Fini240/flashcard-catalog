import { describe, it, expect } from "vitest";
import { shapeContent, shapeSuggestions, deckFingerprint } from "./aiDrills";
import { buildQueue, drillById, EXERCISES } from "./drills";

const cards = [
  { id: "1", front: "Was zeigen Skelettmuskelfasern?", back: "Eine regelmäßige Querstreifung" },
  { id: "2", front: "Was ist das Sarkomer?", back: "Die kleinste funktionelle Einheit" },
];

describe("shapeContent", () => {
  it("keeps a well-formed reply", () => {
    const out = shapeContent({
      cards: [{
        id: "1",
        clozeText: "Sie zeigen eine ____ Querstreifung",
        clozeAnswer: "regelmäßige",
        distractors: ["Eine glatte Oberfläche", "Ein einzelner Zellkern", "Keine Struktur"],
        falseClaim: "Eine unregelmäßige Querstreifung",
      }],
    }, cards);
    expect(out["1"].cloze.answer).toBe("regelmäßige");
    expect(out["1"].distractors).toHaveLength(3);
    expect(out["1"].falseClaim).toBeTruthy();
  });

  it("drops a cloze with no blank in it", () => {
    const out = shapeContent({
      cards: [{ id: "1", clozeText: "no blank here", clozeAnswer: "x", distractors: [], falseClaim: "" }],
    }, cards);
    expect(out["1"]?.cloze).toBeUndefined();
  });

  it("drops a cloze whose answer is missing", () => {
    const out = shapeContent({
      cards: [{ id: "1", clozeText: "a ____ b", clozeAnswer: "  ", distractors: [], falseClaim: "" }],
    }, cards);
    expect(out["1"]?.cloze).toBeUndefined();
  });

  it("throws away a distractor that is really the right answer", () => {
    const out = shapeContent({
      cards: [{ id: "1", clozeText: "", clozeAnswer: "", falseClaim: "",
                distractors: ["eine regelmässige querstreifung", "Eine regelmäßige Querstreifung", "Etwas anderes"] }],
    }, cards);
    expect(out["1"].distractors).toEqual(["eine regelmässige querstreifung", "Etwas anderes"]);
  });

  it("throws away a false claim that is just the true answer", () => {
    const out = shapeContent({
      cards: [{ id: "1", clozeText: "", clozeAnswer: "", distractors: [],
                falseClaim: "  Eine regelmäßige Querstreifung " }],
    }, cards);
    expect(out["1"]).toBeUndefined();
  });

  it("ignores rows for cards that were never sent", () => {
    const out = shapeContent({ cards: [{ id: "999", clozeText: "a ____ b", clozeAnswer: "x" }] }, cards);
    expect(out).toEqual({});
  });

  it("survives a reply that is the wrong shape entirely", () => {
    expect(shapeContent({}, cards)).toEqual({});
    expect(shapeContent({ cards: "nope" }, cards)).toEqual({});
    expect(shapeContent({ cards: [null, 7, "x"] }, cards)).toEqual({});
  });

  it("leaves a partly-usable row usable", () => {
    const out = shapeContent({
      cards: [{ id: "1", clozeText: "broken", clozeAnswer: "", distractors: ["Etwas anderes"], falseClaim: "" }],
    }, cards);
    expect(out["1"].distractors).toEqual(["Etwas anderes"]);
    expect(out["1"].cloze).toBeUndefined();
  });
});

describe("shapeSuggestions", () => {
  it("keeps only drills that exist", () => {
    const out = shapeSuggestions({
      suggestions: [{ id: "speed", blurb: "the muscle terms" }, { id: "invented", blurb: "nope" }],
    });
    expect(out).toEqual([{ id: "speed", blurb: "the muscle terms" }]);
  });

  it("de-duplicates repeats", () => {
    const out = shapeSuggestions({
      suggestions: [{ id: "speed", blurb: "a" }, { id: "speed", blurb: "b" }],
    });
    expect(out).toHaveLength(1);
  });

  it("caps the list at four", () => {
    const out = shapeSuggestions({
      suggestions: ["speed", "gaps", "pairs", "weak", "classic"].map((id) => ({ id, blurb: "x" })),
    });
    expect(out).toHaveLength(4);
  });

  it("survives rubbish", () => {
    expect(shapeSuggestions({})).toEqual([]);
    expect(shapeSuggestions({ suggestions: [null, 3] })).toEqual([]);
  });
});

describe("deckFingerprint", () => {
  it("is stable regardless of card order", () => {
    expect(deckFingerprint(cards)).toBe(deckFingerprint([...cards].reverse()));
  });

  it("changes when a card's answer is edited", () => {
    const edited = [{ ...cards[0], back: "Etwas ganz anderes" }, cards[1]];
    expect(deckFingerprint(edited)).not.toBe(deckFingerprint(cards));
  });

  it("changes when a card is added", () => {
    expect(deckFingerprint([...cards, { id: "3", front: "q", back: "a" }])).not.toBe(deckFingerprint(cards));
  });
});

describe("shaped content feeds the queue builder", () => {
  it("produces a playable drill from a partly-broken reply", () => {
    const content = shapeContent({
      cards: [
        { id: "1", clozeText: "Sie zeigen eine ____ Querstreifung", clozeAnswer: "regelmäßige", distractors: [], falseClaim: "" },
        { id: "2", clozeText: "no blank", clozeAnswer: "", distractors: [], falseClaim: "" },
      ],
    }, cards);
    const queue = buildQueue(drillById("gaps"), cards, content, cards);
    // card 1 uses the model's blank, card 2 falls back to a local one
    expect(queue).toHaveLength(2);
    queue.forEach((s) => {
      expect(s.type).toBe(EXERCISES.CLOZE);
      expect(s.payload.text).toContain("____");
      expect(s.payload.answer).toBeTruthy();
    });
    expect(queue[0].payload.answer).toBe("regelmäßige");
  });
});
