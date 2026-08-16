import { describe, it, expect } from "vitest";
import * as rt from "./richText";
import * as deckShare from "./deckShare";
import * as leech from "./leech";
import * as tutor from "./tutor";

describe("symbols", () => {
  it("replaces Greek letters and operators", () => {
    expect(rt.applySymbols("\\alpha + \\beta")).toBe("α + β");
    expect(rt.applySymbols("x \\leq y \\neq z")).toBe("x ≤ y ≠ z");
    expect(rt.applySymbols("\\Omega and \\omega")).toBe("Ω and ω");
  });

  // \int must not be eaten by \in, and \Leftrightarrow not by \Leftarrow.
  it("prefers the longest matching command", () => {
    expect(rt.applySymbols("\\int")).toBe("∫");
    expect(rt.applySymbols("\\in")).toBe("∈");
    expect(rt.applySymbols("\\Leftrightarrow")).toBe("⇔");
    expect(rt.applySymbols("\\subseteq")).toBe("⊆");
  });

  it("leaves unknown commands as written", () => {
    expect(rt.applySymbols("\\notacommand")).toBe("\\notacommand");
  });
});

describe("maths parsing", () => {
  it("uses real Unicode for simple superscripts and subscripts", () => {
    expect(rt.parseMath("x^2")).toEqual([{ type: "text", value: "x²" }]);
    expect(rt.parseMath("H_2O")).toEqual([{ type: "text", value: "H₂O" }]);
    expect(rt.parseMath("x^{123}")).toEqual([{ type: "text", value: "x¹²³" }]);
  });

  // Unicode covers the digits, the operators and a handful of letters, so
  // "n+1" comes out as real characters that copy and read aloud correctly.
  it("uses Unicode for a multi-character exponent when every character has one", () => {
    expect(rt.parseMath("x^{n+1}")).toEqual([{ type: "text", value: "xⁿ⁺¹" }]);
  });

  // Most letters have no sub/superscript form, and those need real markup.
  it("falls back to markup when Unicode has no character", () => {
    expect(rt.parseMath("x^{abc}").some((n) => n.type === "sup" && n.value === "abc")).toBe(true);
    expect(rt.parseMath("a_{max}").some((n) => n.type === "sub" && n.value === "max")).toBe(true);
  });

  it("parses fractions and roots", () => {
    expect(rt.parseMath("\\frac{a}{b}")).toEqual([{ type: "frac", num: "a", den: "b" }]);
    expect(rt.parseMath("\\sqrt{2}")).toEqual([{ type: "sqrt", value: "2" }]);
  });

  it("handles nested braces in a group", () => {
    expect(rt.parseMath("\\frac{x^{2}}{y}")[0]).toMatchObject({ type: "frac", den: "y" });
  });

  it("drops grouping braces that aren't part of a command", () => {
    expect(rt.parseMath("{abc}")).toEqual([{ type: "text", value: "abc" }]);
  });

  it("does not hang on unbalanced input", () => {
    expect(() => rt.parseMath("\\frac{a")).not.toThrow();
    expect(() => rt.parseMath("x^{")).not.toThrow();
    expect(() => rt.parseMath("}}}{{{")).not.toThrow();
  });
});

describe("segmentation", () => {
  it("finds inline maths between dollars", () => {
    const out = rt.segment("Energy is $E = mc^2$ exactly");
    expect(out).toHaveLength(3);
    expect(out[1]).toMatchObject({ type: "math", value: "E = mc^2" });
  });

  it("finds fenced and inline code", () => {
    const fenced = rt.segment("```js\nconst a = 1;\n```");
    expect(fenced[0]).toMatchObject({ type: "code", block: true, lang: "js", value: "const a = 1;" });
    expect(rt.segment("use `npm install` first")[1]).toMatchObject({ type: "code", block: false, value: "npm install" });
  });

  // A $ inside a shell snippet is a variable, not the start of a formula.
  it("does not read a dollar inside code as maths", () => {
    const out = rt.segment("run `echo $HOME` now");
    expect(out.some((n) => n.type === "math")).toBe(false);
    expect(out[1]).toMatchObject({ type: "code", value: "echo $HOME" });
  });

  it("renders symbols in ordinary prose as well as in maths", () => {
    expect(rt.segment("the \\alpha particle")[0].value).toBe("the α particle");
  });

  it("returns plain text unchanged as a single node", () => {
    expect(rt.segment("just words")).toEqual([{ type: "text", value: "just words" }]);
  });

  it("recognises which strings need the renderer at all", () => {
    expect(rt.isRich("plain text")).toBe(false);
    expect(rt.isRich("$x^2$")).toBe(true);
    expect(rt.isRich("`code`")).toBe(true);
    expect(rt.isRich("H_2O")).toBe(true);
  });
});

describe("plain text form", () => {
  // Speech and search need words, not markup: "\frac{a}{b}" read aloud is worse
  // than "a/b".
  it("flattens maths for speech and search", () => {
    expect(rt.toPlainText("$\\frac{a}{b}$")).toBe("a/b");
    expect(rt.toPlainText("$\\sqrt{2}$")).toBe("√(2)");
    expect(rt.toPlainText("$x^2$")).toBe("x²");
    expect(rt.toPlainText("`code` and text")).toBe("code and text");
  });
});

describe("deck sharing codes", () => {
  it("generates codes from an unambiguous alphabet", () => {
    const rand = (() => { let s = 1; return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648); })();
    for (let i = 0; i < 200; i++) {
      const code = deckShare.generateCode(rand);
      expect(code).toHaveLength(deckShare.CODE_LENGTH);
      expect(deckShare.isValidCode(code)).toBe(true);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it("rejects rather than guesses when a code contains an impossible character", () => {
    // O and I are not in the alphabet, so a code containing them was misread;
    // dropping them yields a short code, which fails validation rather than
    // silently fetching somebody else's deck.
    expect(deckShare.isValidCode(deckShare.normalizeCode("ABC0IL"))).toBe(false);
    expect(deckShare.normalizeCode("ab-cd ef")).toBe("ABCDEF");
  });
});

describe("deck sharing payload", () => {
  const card = (over = {}) => ({ id: `c${Math.random()}`, front: "f", back: "b", ...over });

  it("strips scheduling and history from published cards", () => {
    const clean = deckShare.sanitizeCard(
      card({ fsrsStability: 40, fsrsLapses: 3, srsDue: 123, srsBox: 5, leech: true, tags: ["exam"] })
    );
    expect(clean).toEqual({ front: "f", back: "b", tags: ["exam"] });
    expect(clean.fsrsStability).toBeUndefined();
    expect(clean.srsDue).toBeUndefined();
  });

  it("reports cards it cannot share, with a reason", () => {
    const out = deckShare.unshareable([
      card({ id: "img", frontImageId: "i1" }),
      card({ id: "occ", occlusionMaskId: "m1" }),
      card({ id: "empty", front: "  " }),
      card({ id: "fine" }),
    ]);
    expect(out.map((s) => [s.card.id, s.reason])).toEqual([
      ["img", "image"],
      ["occ", "occlusion"],
      ["empty", "empty"],
    ]);
  });

  it("publishes the username rather than any real name", () => {
    const built = deckShare.buildPayload({ name: "Vocab" }, [card()], { username: "finn", uid: "u1", name: "Finn R." });
    expect(built.payload.byUsername).toBe("finn");
    expect(JSON.stringify(built.payload)).not.toContain("Finn R.");
  });

  it("refuses a deck that would exceed the document limit", () => {
    const huge = Array.from({ length: 500 }, () => card({ front: "x".repeat(2000), back: "y".repeat(2000) }));
    const built = deckShare.buildPayload({ name: "Big" }, huge, { username: "a" });
    expect(built.ok).toBe(false);
    expect(built.error).toMatch(/too large/i);
  });

  it("refuses an empty deck", () => {
    expect(deckShare.buildPayload({ name: "x" }, [], {}).ok).toBe(false);
    expect(deckShare.buildPayload({ name: "x" }, [card({ frontImageId: "i" })], {}).ok).toBe(false);
  });

  it("imports as unlearned cards with fresh ids", () => {
    let n = 0;
    const { cards } = deckShare.toCards(
      { cards: [{ front: "a", back: "b" }, { front: "c", back: "d" }] },
      "node1",
      { newId: () => `new${n++}` }
    );
    expect(cards.map((c) => c.id)).toEqual(["new0", "new1"]);
    expect(cards[0].nodeId).toBe("node1");
    expect(cards[0].srsDue).toBeUndefined();
    expect(cards[0].fsrsStability).toBeUndefined();
  });

  it("skips cards the user already has", () => {
    const { cards, duplicates } = deckShare.toCards(
      { cards: [{ front: "a", back: "b" }, { front: "c", back: "d" }] },
      "n1",
      { existing: [{ front: "A", back: " b " }] }
    );
    expect(duplicates).toBe(1);
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe("c");
  });
});

describe("leeches", () => {
  const card = (lapses, over = {}) => ({ id: "a", fsrsLapses: lapses, ...over });

  it("marks a card as a leech at the threshold", () => {
    expect(leech.isLeech(card(7))).toBe(false);
    expect(leech.isLeech(card(8))).toBe(true);
    expect(leech.isLeech(card(4), 4)).toBe(true);
  });

  it("suspends on the crossing, not on every lapse after it", () => {
    const crossed = leech.applyLeechPolicy(card(8));
    expect(crossed.leechSuspended).toBe(true);

    // Brought back by the user, then missed again: one miss must not re-bury it.
    const revived = leech.unsuspend({ ...crossed, fsrsLapses: 9 });
    expect(revived.leechSuspended).toBeUndefined();
    expect(leech.applyLeechPolicy({ ...revived, fsrsLapses: 9 }).leechSuspended).toBeUndefined();
    // ...but four more lapses do.
    expect(leech.applyLeechPolicy({ ...revived, fsrsLapses: 12 }).leechSuspended).toBe(true);
  });

  it("leaves a card below the threshold untouched", () => {
    const c = card(3);
    expect(leech.applyLeechPolicy(c)).toBe(c);
  });

  // Editing the card is a different claim from "let me try again": the card is
  // genuinely different now, so its failure history no longer applies.
  it("clears the lapse count when the card is edited, but not when merely revived", () => {
    const buried = leech.applyLeechPolicy(card(8));
    expect(leech.unsuspend(buried).fsrsLapses).toBe(8);
    expect(leech.forgive(buried).fsrsLapses).toBe(0);
    expect(leech.forgive(buried).leech).toBeUndefined();
  });

  it("diagnoses the common reasons a card is unanswerable", () => {
    const all = [{ id: "1", front: "a", back: "same" }, { id: "2", front: "b", back: "same" }];
    expect(leech.diagnose(all[0], all).code).toBe("duplicate-answer");
    expect(leech.diagnose({ id: "3", front: "x", back: "x" }, []).code).toBe("same-both-sides");
    expect(leech.diagnose({ id: "4", front: "q", back: "z".repeat(200) }, []).code).toBe("answer-too-long");
    expect(leech.diagnose({ id: "5", front: "q", back: "short" }, []).code).toBe("just-hard");
  });
});

describe("tutor guards", () => {
  it("treats a hint containing the answer as a failure", () => {
    expect(tutor.hintLeaksAnswer("It starts with M — mitochondria", "mitochondria")).toBe(true);
    expect(tutor.hintLeaksAnswer("It's an organelle that makes energy", "mitochondria")).toBe(false);
  });

  it("catches a hint that gives away every distinctive word", () => {
    expect(tutor.hintLeaksAnswer("think about the cellular respiration process", "cellular respiration")).toBe(true);
  });

  it("does not call a shared short word a leak", () => {
    expect(tutor.hintLeaksAnswer("the answer is a place", "the pit")).toBe(false);
  });

  it("parses a reply and tolerates fenced JSON", () => {
    const out = tutor.parse('```json\n{"explanation":"because","memoryAid":"","confusedWith":""}\n```');
    expect(out.explanation).toBe("because");
    expect(() => tutor.parse("")).toThrow();
  });
});
