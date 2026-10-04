import { describe, expect, it } from "vitest";
import { automaticSpeechLanguage as lang } from "./speechLanguage";

const spanish = { id: "es", name: "Spanish", children: [{ id: "vocab", children: [] }] };
const pool = [
  ["el campamento", "das (Ferien-) Lager"], ["la pronunciación", "die Aussprache"],
  ["hablar", "sprechen; sich unterhalten"], ["el libro", "das Buch"], ["pan", "Brot"],
].map(([front, back], i) => ({ id: String(i), subjectId: "es", nodeId: "vocab", front, back }));
const options = (side = "front", sample = pool) => ({ side, subject: spanish, pool: sample, card: sample[0] });

describe("automatic pronunciation language", () => {
  it.each([
    ["el campamento", "es-ES"], ["das (Ferien-) Lager", "de-DE"],
    ["klein (Körpergröße)", "de-DE"], ["du lebst; du wohnst", "de-DE"],
    ["the house", "en-GB"], ["bonjour", "fr-FR"], ["la maison", "fr-FR"],
    ["la città", "it-IT"], ["こんにちは", "ja-JP"], ["Привет", "ru-RU"],
  ])("detects %s without any configured language", (text, expected) => {
    expect(lang(text)).toBe(expected);
  });
  it("handles both sides and short vocabulary from the same folder", () => {
    expect(lang("pan", options())).toBe("es-ES");
    expect(lang("Brot", options("back"))).toBe("de-DE");
    expect(lang("la casa", options())).toBe("es-ES");
  });
  it("uses the side's content when the cards are reversed", () => {
    const reversed = pool.map(c => ({ ...c, front: c.back, back: c.front }));
    expect(lang("das Haus", options("front", reversed))).toBe("de-DE");
    expect(lang("Brot", options("front", reversed))).toBe("de-DE");
    expect(lang("pan", options("back", reversed))).toBe("es-ES");
  });
  it("does not borrow the language from unrelated subjects", () => {
    const unrelated = pool.map(c => ({ ...c, subjectId: "other", nodeId: "other" }));
    expect(lang("pan", { ...options(), pool: unrelated, subject: { ...spanish, name: "Vocabulary" }, deviceLang: "en-GB" })).toBe("en-GB");
  });
  it("uses folder context to disambiguate a shared word, instead of guessing from it alone", () => {
    const en = pool.map(c => ({ ...c, front: "the house and the garden", back: "das Haus" }));
    expect(lang("pain", { ...options("front", en), subject: { ...spanish, name: "Vocabulary" } })).toBe("en-GB");
  });
  it("keeps a configured region when its base language matches, but corrects a wrong-language hint", () => {
    expect(lang("el campamento", { preferred: "es-MX" })).toBe("es-MX");
    expect(lang("el campamento", { preferred: "de-DE" })).toBe("es-ES");
    expect(lang("νερό", { preferred: "de-DE" })).toBe("el-GR");
  });
  it("uses the device locale for numbers and undetectable isolated words", () => {
    expect(lang("2026", { deviceLang: "de-DE" })).toBe("de-DE");
    expect(lang("pan", { deviceLang: "en-GB" })).toBe("en-GB");
  });
});
