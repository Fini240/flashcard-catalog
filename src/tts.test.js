// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ native: false, platform: "android", plugin: {
  getSupportedVoices: vi.fn(), isLanguageSupported: vi.fn(), speak: vi.fn(), stop: vi.fn(), prepare: vi.fn(), openInstall: vi.fn(),
} }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => mocks.native, getPlatform: () => mocks.platform }, registerPlugin: () => new Proxy(mocks.plugin, { get(target, prop) { if (prop === "then") return () => new Promise(() => {}); return target[prop]; } }) }));
vi.mock("@capacitor-community/text-to-speech", () => ({ TextToSpeech: mocks.plugin }));
vi.mock("./report", () => ({ report: vi.fn() }));
let tts, synth;
const list = [{ name: "Spanish", lang: "es-ES" }, { name: "German", lang: "de-DE" }];
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); mocks.native = false; mocks.platform = "android";
  synth = { getVoices: vi.fn(() => list), speak: vi.fn(), cancel: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(text) { this.text = text; } });
  mocks.plugin.getSupportedVoices.mockResolvedValue({ voices: list });
  mocks.plugin.isLanguageSupported.mockResolvedValue({ supported: true });
  mocks.plugin.stop.mockResolvedValue(); mocks.plugin.speak.mockResolvedValue();
  mocks.plugin.prepare.mockResolvedValue();
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
  it("automatically detects both sides even without a named subject", () => {
    expect(tts.pronunciationFor(card, { name: "Spanisch" }, "front").lang).toBe("es-ES");
    expect(tts.pronunciationFor(card, { name: "Spanish" }, "back").lang).toBe("de-DE");
    expect(tts.pronunciationFor(card, { name: "Vocabulary" }, "front").lang).toBe("es-ES");
    expect(tts.pronunciationFor({ ...card, frontImageId: "image" }, {}, "front")).toBeNull();
  });
  it("defaults to Auto while retaining explicit manual corrections", () => {
    expect(tts.pronunciationFor(card, { speech: { frontLang: "de-DE" } }, "front"))
      .toMatchObject({ lang: "es-ES", automatic: true });
    expect(tts.pronunciationFor(card, { speech: { frontLang: "es-MX", frontLanguageMode: "manual" } }, "front"))
      .toMatchObject({ lang: "es-MX", automatic: false });
  });
  it("uses card-specific corrections and can reset a subject correction to Auto", () => {
    const subject = { speech: { frontLang: "de-DE", frontLanguageMode: "manual" } };
    expect(tts.pronunciationFor({ ...card, speech: { frontLang: "es-MX", frontLanguageMode: "manual" } }, subject, "front"))
      .toMatchObject({ lang: "es-MX", automatic: false });
    expect(tts.pronunciationFor({ ...card, speech: { frontLang: null, frontLanguageMode: "auto" } }, subject, "front"))
      .toMatchObject({ lang: "es-ES", automatic: true });
    expect(tts.pronunciationFor(card, subject, "front").lang).toBe("de-DE");
  });
  it("also detects automatic answer-reading languages, while keeping that feature opt-in", () => {
    expect(tts.speechFor(card, { speech: { enabled: true } }, "back"))
      .toMatchObject({ lang: "de-DE", automatic: true });
    expect(tts.speechFor(card, {}, "back")).toBeNull();
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
    expect(mocks.plugin.speak).toHaveBeenCalledWith(expect.objectContaining({ text: card.front, lang: "es-ES", volume: 1, queueStrategy: 0 }));
    expect(synth.speak).not.toHaveBeenCalled();
  });
  it("releases Android requests on immediate failures and preserves useful error reasons", async () => {
    mocks.native = true;
    for (const [code, reason] of [["PLAYBACK_ERROR", "error"], ["NO_VOICE", "no-voice"], ["CANCELED", "canceled"], ["PLAYBACK_TIMEOUT", "timeout"]]) {
      mocks.plugin.speak.mockRejectedValueOnce({ code });
      expect(await tts.speak(card.front, { lang: "es-ES" })).toEqual({ ok: false, reason });
    }
    mocks.plugin.speak.mockRejectedValueOnce({ code: "ENGINE_UNAVAILABLE" });
    expect(await tts.speak(card.front, { lang: "es-ES" })).toEqual({ ok: false, reason: "engine-unavailable" });
  });
  it("opens Android voice settings and leaves browser speech unchanged", async () => {
    expect(tts.canOpenVoiceSettings()).toBe(false);
    expect(await tts.openVoiceSettings()).toBe(false);
    mocks.native = true;
    expect(tts.canOpenVoiceSettings()).toBe(true);
    expect(await tts.openVoiceSettings()).toBe(true);
    expect(mocks.plugin.openInstall).toHaveBeenCalledTimes(1);
    mocks.plugin.openInstall.mockRejectedValueOnce(new Error("settings unavailable"));
    expect(await tts.openVoiceSettings()).toBe(false);
  });
  it("reports a missing Android language and settles stopped native calls", async () => {
    mocks.native = true; mocks.plugin.speak.mockRejectedValueOnce({ code: "NO_VOICE" });
    expect(await tts.speak("bonjour", { lang: "fr-FR", strict: true })).toEqual({ ok: false, reason: "no-voice" });
    mocks.plugin.speak.mockReturnValue(new Promise(() => {}));
    const pending = tts.speak("uno", { lang: "es-ES" });
    await flush(); tts.stop();
    expect(await pending).toEqual({ ok: false, reason: "canceled" });
  });
  it("warms Android without speaking and needs only one native call per tap", async () => {
    mocks.native = true;
    await tts.prepare();
    expect(mocks.plugin.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.plugin.speak).not.toHaveBeenCalled();
    await tts.speak("uno", { lang: "es-ES" });
    expect(mocks.plugin.speak).toHaveBeenCalledTimes(1);
    expect(mocks.plugin.getSupportedVoices).not.toHaveBeenCalled();
    expect(mocks.plugin.isLanguageSupported).not.toHaveBeenCalled();
    expect(mocks.plugin.stop).not.toHaveBeenCalled();
  });
  it("cancels Android before it crosses the bridge when stopped in the same turn", async () => {
    mocks.native = true;
    const pending = tts.speak("uno", { lang: "es-ES" });
    await tts.stop();
    expect(await pending).toEqual({ ok: false, reason: "canceled" });
    expect(mocks.plugin.speak).not.toHaveBeenCalled();
  });
  it("keeps the indexed-voice community plugin flow for other native platforms", async () => {
    mocks.native = true; mocks.platform = "ios";
    await tts.prepare(); expect(mocks.plugin.prepare).not.toHaveBeenCalled();
    expect(await tts.speak("uno", { lang: "es-ES" })).toEqual({ ok: true });
    expect(mocks.plugin.getSupportedVoices).toHaveBeenCalled();
    expect(mocks.plugin.isLanguageSupported).toHaveBeenCalled();
    expect(mocks.plugin.speak).toHaveBeenCalledWith(expect.objectContaining({ voice: 0 }));
  });
});
