import { describe, it, expect } from "vitest";
import * as D from "./drills";

const card = (id, front, back, extra = {}) => ({ id, front, back, ...extra });

const deck = [
  card("1", "Was zeigen Skelettmuskelfasern?", "Eine regelmäßige Querstreifung"),
  card("2", "Was ist das Sarkomer?", "Die kleinste funktionelle Einheit"),
  card("3", "Wo liegt das Ribosom?", "Am rauen endoplasmatischen Retikulum"),
  card("4", "Was macht die Mitochondrie?", "Sie erzeugt ATP"),
  card("5", "Was ist Chlorophyll?", "Der grüne Farbstoff der Pflanzen"),
  card("6", "Was ist die Zellwand?", "Die äußere Stützschicht der Pflanzenzelle"),
];

describe("availableDrills", () => {
  it("offers everything for a healthy text deck", () => {
    const ids = D.availableDrills(deck).map((d) => d.id);
    expect(ids).toContain("speed");
    expect(ids).toContain("gaps");
    expect(ids).toContain("pairs");
    expect(ids).toContain("classic");
  });

  it("drops matching when there are not enough cards to pair", () => {
    const ids = D.availableDrills(deck.slice(0, 3)).map((d) => d.id);
    expect(ids).not.toContain("pairs");
    expect(ids).toContain("classic");
  });

  it("leaves only flipping for a deck of picture answers", () => {
    const pics = deck.map((c) => ({ ...c, backImageId: "img" + c.id }));
    expect(D.availableDrills(pics).map((d) => d.id)).toEqual(["classic"]);
  });

  it("never returns an empty list for a deck with a single card", () => {
    expect(D.availableDrills([deck[0]]).length).toBeGreaterThan(0);
  });
});

describe("localCloze", () => {
  it("blanks a contentful word and can be answered with it", () => {
    const c = D.localCloze(deck[0]);
    expect(c.text).toContain("____");
    expect(c.answer.length).toBeGreaterThan(3);
    expect(c.text.replace("____", c.answer)).toBe(deck[0].back);
  });

  it("skips articles and other furniture", () => {
    const c = D.localCloze(card("x", "q", "Die Zelle"));
    expect(c.answer).toBe("Zelle");
  });

  it("flags a one-word answer, which blanks away the whole sentence", () => {
    expect(D.localCloze(card("x", "q", "Canberra")).whole).toBe(true);
  });

  it("returns nothing for an empty answer", () => {
    expect(D.localCloze(card("x", "q", "   "))).toBe(null);
  });
});

describe("localTrueFalse", () => {
  it("states either the card's own answer or another card's, and labels it", () => {
    for (let i = 0; i < 40; i++) {
      const tf = D.localTrueFalse(deck[0], deck);
      expect(tf.isTrue).toBe(tf.claim === deck[0].back);
    }
  });

  it("tells the truth when there is no other card to borrow from", () => {
    expect(D.localTrueFalse(deck[0], [deck[0]]).isTrue).toBe(true);
  });
});

describe("localDistractors", () => {
  it("never offers the right answer as a wrong one", () => {
    const d = D.localDistractors(deck[0], deck);
    expect(d).not.toContain(deck[0].back);
    expect(d.length).toBe(3);
  });

  it("copes with a deck too small to fill the options", () => {
    expect(D.localDistractors(deck[0], deck.slice(0, 2)).length).toBe(1);
  });
});

describe("buildQueue", () => {
  it("covers every card exactly once", () => {
    const q = D.buildQueue(D.drillById("speed"), deck, {}, deck);
    expect(q.flatMap((s) => s.cards.map((c) => c.id)).sort()).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("mixes the drill's formats rather than picking one", () => {
    const types = new Set(D.buildQueue(D.drillById("speed"), deck, {}, deck).map((s) => s.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it("prefers the AI's cloze and distractors when they are there", () => {
    const content = {
      1: { cloze: { text: "Sie zeigen eine ____ Querstreifung", answer: "regelmäßige" },
           distractors: ["Eine glatte Oberfläche", "Ein einzelner Zellkern", "Keine Struktur"] },
    };
    const q = D.buildQueue(D.drillById("gaps"), [deck[0]], content, deck);
    expect(q[0].payload.answer).toBe("regelmäßige");
  });

  it("falls back to local content for cards the AI did not cover", () => {
    const content = { 1: { cloze: { text: "a ____ b", answer: "x" } } };
    const q = D.buildQueue(D.drillById("gaps"), deck, content, deck);
    expect(q.every((s) => s.payload && s.payload.answer)).toBe(true);
  });

  it("puts the answer among the options for multiple choice", () => {
    const q = D.buildQueue(D.drillById("speed"), deck, {}, deck).filter((s) => s.type === D.EXERCISES.MCQ);
    q.forEach((s) => expect(s.payload.options).toContain(s.cards[0].back));
  });

  it("orders weak spots by how shaky the card is", () => {
    const scored = [
      card("a", "q", "a", { box: 5, correctCount: 9, wrongCount: 0 }),
      card("b", "q", "b", { box: 0, correctCount: 1, wrongCount: 8 }),
      card("c", "q", "c", { box: 3, correctCount: 5, wrongCount: 2 }),
      card("d", "q", "d", { box: 4, correctCount: 6, wrongCount: 1 }),
    ];
    const picked = D.selectCards(D.drillById("weak"), scored);
    expect(picked[0].id).toBe("b");
    expect(picked[picked.length - 1].id).toBe("a");
  });
});

describe("buildQueue for matching", () => {
  it("pairs cards in groups and covers each card once", () => {
    const q = D.buildQueue(D.drillById("pairs"), deck, {}, deck);
    const ids = q.flatMap((s) => s.cards.map((c) => c.id)).sort();
    expect(ids).toEqual(["1", "2", "3", "4", "5", "6"]);
    q.forEach((s) => expect(s.type).toBe(D.EXERCISES.MATCH));
  });

  it("never leaves a group with nothing to pair against", () => {
    // 6 cards = a group of 5 and a stray one, which must be folded back in
    const q = D.buildQueue(D.drillById("pairs"), deck, {}, deck);
    q.forEach((s) => expect(s.cards.length).toBeGreaterThan(1));
  });

  it("carries a term and meaning for every card in the group", () => {
    const q = D.buildQueue(D.drillById("pairs"), deck, {}, deck);
    q.forEach((s) => {
      expect(s.payload.pairs.length).toBe(s.cards.length);
      s.payload.pairs.forEach((p) => {
        expect(p.term).toBeTruthy();
        expect(p.meaning).toBeTruthy();
      });
    });
  });
});

describe("estimateSeconds", () => {
  it("scales with the number of cards", () => {
    const d = D.drillById("classic");
    expect(D.estimateSeconds(d, 20)).toBeGreaterThan(D.estimateSeconds(d, 10));
  });

  it("charges matching per group, not per card", () => {
    expect(D.estimateSeconds(D.drillById("pairs"), 10)).toBe(60);
  });

  it("reads as minutes once it is long enough", () => {
    expect(D.formatDuration(30)).toBe("under a min");
    expect(D.formatDuration(180)).toBe("3 min");
  });
});
