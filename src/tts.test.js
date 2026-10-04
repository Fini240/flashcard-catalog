// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ native: false, plugin: {
  getSupportedVoices: vi.fn(), isLanguageSupported: vi.fn(), speak: vi.fn(), stop: vi.fn(),
} }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => mocks.native } }));
vi.mock("@capacitor-community/text-to-speech", () => ({ TextToSpeech: mocks.plugin }));
vi.mock("./report", () => ({ report: vi.fn() }));
let tts, synth;
const list = [{ name: "Spanish", lang: "es-ES" }, { name: "German", lang: "de-DE" }];
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); mocks.native = false;
  synth = { getVoices: vi.fn(() => list), speak: vi.fn(), cancel: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(text) { this.text = text; } });
  mocks.plugin.getSupportedVoices.mockResolvedValue({ voices: list });
  mocks.plugin.isLanguageSupported.mockResolvedValue({ supported: true });
  mocks.plugin.stop.mockResolvedValue(); mocks.plugin.speak.mockResolvedValue();
  tts = await import("./tts");
});
afterEach(() => { tts.stop(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("manual pronunciation", () => {
  const card = { front: "el campamento", back: "das Lager" };
  it("works with automatic reading off and respects independently configured sides", () => {
    const subject = { name: "Spanish", speech: { enabled: false, frontLang: "es-MX", backLang: "de-DE" } };
    expect(tts.pronunciationFor(card, subject, "front")).toMatchObject({ text: card.front, lang: "es-MX", strict: true });
    expect(tts.pronunciationFor(card, subject, "back").lang).toBe("de-DE");
    expect(tts.speechFor(card, subject, "front")).toBeNull();
  });
  it("uses a named subject as a default and leaves ambiguous sides for the picker", () => {
    expect(tts.pronunciationFor(card, { name: "Spanisch" }, "front").lang).toBe("es-ES");
    expect(tts.pronunciationFor(card, { name: "Spanish" }, "back").lang).toBeNull();
    expect(tts.pronunciationFor(card, { name: "Vocabulary" }, "front").lang).toBeNull();
    expect(tts.pronunciationFor({ ...card, frontImageId: "image" }, {}, "front")).toBeNull();
  });
  it("reads the visible plain text with the chosen browser voice", async () => {
    const result = tts.speak("`el campamento`", { lang: "es-ES", strict: true, rate: 0.85 });
    await flush();
    const utterance = synth.speak.mock.calls[0][0];
    expect(utterance).toMatchObject({ text: "el campamento", lang: "es-ES", rate: 0.85, voice: list[0] });
    utterance.onend();
    expect(await result).toEqual({ ok: true });
  });
  it("does not silently read an unavailable language with the default voice", async () => {
    expect(await tts.speak("bonjour", { lang: "fr-FR", strict: true })).toEqual({ ok: false, reason: "no-voice" });
    expect(synth.speak).not.toHaveBeenCalled();
  });
  it("settles interrupted speech and never queues old words", async () => {
    const first = tts.speak("uno", { lang: "es-ES" }); await flush();
    const second = tts.speak("dos", { lang: "es-ES" }); await flush();
    expect(await first).toEqual({ ok: false, reason: "canceled" });
    expect(synth.speak.mock.calls.map(([u]) => u.text)).toEqual(["uno", "dos"]);
    tts.stop(); expect(await second).toEqual({ ok: false, reason: "canceled" });
  });
  it("cancels requests that are still waiting for browser voices", async () => {
    vi.useFakeTimers(); synth.getVoices.mockReturnValue([]);
    const pending = tts.speak("uno", { lang: "es-ES" }); await flush();
    tts.stop(); synth.getVoices.mockReturnValue(list);
    synth.addEventListener.mock.calls[0][1]();
    expect(await pending).toEqual({ ok: false, reason: "canceled" });
    expect(synth.speak).not.toHaveBeenCalled();
  });
  it("uses Android system TTS even with no browser speech synthesis", async () => {
    mocks.native = true; vi.stubGlobal("speechSynthesis", undefined);
    expect(tts.isSupported()).toBe(true);
    expect(await tts.speak(card.front, { lang: "es-ES", strict: true })).toEqual({ ok: true });
    expect(mocks.plugin.speak).toHaveBeenCalledWith(expect.objectContaining({ text: card.front, lang: "es-ES", voice: 0, queueStrategy: 0 }));
    expect(synth.speak).not.toHaveBeenCalled();
  });
  it("reports a missing Android language and settles stopped native calls", async () => {
    mocks.native = true; mocks.plugin.isLanguageSupported.mockResolvedValueOnce({ supported: false });
    expect(await tts.speak("bonjour", { lang: "fr-FR", strict: true })).toEqual({ ok: false, reason: "no-voice" });
    mocks.plugin.speak.mockReturnValue(new Promise(() => {}));
    const pending = tts.speak("uno", { lang: "es-ES" });
    await flush(); tts.stop();
    expect(await pending).toEqual({ ok: false, reason: "canceled" });
  });
});
