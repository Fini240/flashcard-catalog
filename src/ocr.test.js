import { describe, it, expect, vi } from "vitest";

// These two parsers are pure, but they live next to the ML Kit reader, which
// drags in the Capacitor bridge and — through `fileImport` — pdf.js, whose
// module-level DOMMatrix access node has no answer for. Same reasoning as the
// stubs at the top of `smoke.test.jsx`: the gap is in the test environment,
// not the app, and none of it is reachable from what's under test here.
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@capacitor-mlkit/text-recognition", () => ({ TextRecognition: {} }));
vi.mock("@capacitor/filesystem", () => ({ Filesystem: {}, Directory: {} }));
vi.mock("./fileImport", () => ({ fileToBase64: async () => "" }));

const { guessCardPairs, salvageCards } = await import("./ocr");

// A glossary photo: one separator explains the whole page.
const glossary = `Zelle | die kleinste Einheit des Lebens
Mitochondrium | erzeugt ATP
Ribosom | baut Proteine
Zellwand | stützt die Pflanzenzelle`;

// A page of notes: nothing guessCardPairs recognises, everything the notes
// box does. This is the shape that used to come off the camera and produce
// no cards at all once the AI path was unavailable.
const notes = `# Zellbiologie

Mitochondrium :: erzeugt ATP
Ribosom :: baut Proteine

Q: Was ist das Sarkomer?
A: Die kleinste funktionelle Einheit des Muskels`;

describe("guessCardPairs", () => {
  it("reads a two-column page", () => {
    expect(guessCardPairs(glossary)).toHaveLength(4);
  });

  // Not a wish, a warning: `": "` is one of its separators, so on a notes page
  // it reads confidently and wrongly. This is the whole reason `salvageCards`
  // asks the notes parser first when the page carries a `::` or a `Q:`.
  it("misreads a page of notes, which is why it is not tried first", () => {
    const fronts = guessCardPairs(notes).map((c) => c.front);
    expect(fronts).toContain("Q");
    expect(fronts).toContain("Mitochondrium :");
  });
});

describe("salvageCards", () => {
  it("prefers the two-column reading when the page is a list", () => {
    const cards = salvageCards(glossary);
    expect(cards).toHaveLength(4);
    expect(cards[0]).toEqual({ front: "Zelle", back: "die kleinste Einheit des Lebens" });
  });

  // The regression this exists for: a correctly-read page, no key, no
  // network, and zero cards out the other end.
  it("falls through to the notes syntax when there is no column to find", () => {
    const cards = salvageCards(notes);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards).toContainEqual({ front: "Mitochondrium", back: "erzeugt ATP" });
    expect(cards).toContainEqual({
      front: "Was ist das Sarkomer?",
      back: "Die kleinste funktionelle Einheit des Muskels",
    });
  });

  it("returns nothing for prose rather than inventing a card", () => {
    const prose = "Die Zelle ist die kleinste Einheit des Lebens. Sie besteht aus\nvielen Bestandteilen, die zusammenarbeiten.";
    expect(salvageCards(prose)).toEqual([]);
  });

  it("survives empty and missing input", () => {
    expect(salvageCards("")).toEqual([]);
    expect(salvageCards(undefined)).toEqual([]);
  });

  it("only ever returns cards with both sides", () => {
    for (const c of salvageCards(notes)) {
      expect(typeof c.front).toBe("string");
      expect(typeof c.back).toBe("string");
      expect(c.front && c.back).toBeTruthy();
    }
  });
});
