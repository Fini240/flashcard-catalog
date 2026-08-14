import { describe, it, expect } from "vitest";
import { cardKey, dropDuplicateCards } from "./ankiImport";

const deck = (name, subject, category, cards) => ({ name, subject, category, cards });
const c = (front, back) => ({ front, back });

describe("cardKey", () => {
  it("ignores case and whitespace noise", () => {
    expect(cardKey("La Casa", "the house")).toBe(cardKey("  la   casa ", "The House"));
  });

  it("keeps genuinely different cards apart", () => {
    expect(cardKey("la casa", "the house")).not.toBe(cardKey("la casa", "the home"));
  });
});

describe("dropDuplicateCards — the 2026-08-11 triple-import regression", () => {
  it("re-importing the same deck under a different folder name adds nothing", () => {
    // The heart of it: the content provider called this deck "Unidad 1" and
    // the .apkg called it "¡Adelante 1!::Unidad 1::Primer paso". Same cards.
    const existing = [{ front: "la casa", back: "das Haus" }, { front: "doble", back: "doppelt" }];
    const incoming = [deck("¡Adelante 1!::Unidad 1", "¡Adelante 1!", "Unidad 1 · Primer paso", [
      c("la casa", "das Haus"), c("doble", "doppelt"),
    ])];
    const { decks, skipped } = dropDuplicateCards(incoming, existing);
    expect(skipped).toBe(2);
    expect(decks).toEqual([]); // no empty folder left behind either
  });

  it("keeps the new cards and skips only the ones already held", () => {
    const existing = [{ front: "la casa", back: "das Haus" }];
    const incoming = [deck("d", "S", "C", [c("la casa", "das Haus"), c("el perro", "der Hund")])];
    const { decks, skipped } = dropDuplicateCards(incoming, existing);
    expect(skipped).toBe(1);
    expect(decks[0].cards).toEqual([c("el perro", "der Hund")]);
  });

  it("dedupes within a single import, across decks", () => {
    const incoming = [
      deck("a", "S", "C1", [c("la casa", "das Haus")]),
      deck("b", "S", "C2", [c("La Casa", "Das Haus")]),
    ];
    const { decks, skipped } = dropDuplicateCards(incoming, []);
    expect(skipped).toBe(1);
    expect(decks).toHaveLength(1);
  });

  it("an empty catalog imports everything", () => {
    const incoming = [deck("d", "S", "C", [c("a", "1"), c("b", "2")])];
    const { decks, skipped } = dropDuplicateCards(incoming, []);
    expect(skipped).toBe(0);
    expect(decks[0].cards).toHaveLength(2);
  });

  it("preserves deck metadata on the decks it keeps", () => {
    const incoming = [deck("n", "Subj", "Cat", [c("a", "1")])];
    const { decks } = dropDuplicateCards(incoming, []);
    expect(decks[0]).toMatchObject({ name: "n", subject: "Subj", category: "Cat" });
  });
});
