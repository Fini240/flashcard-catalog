// @vitest-environment jsdom
// Use Capacitor's real proxy: an ordinary object mock hides its synthetic `then`.
import { beforeAll, beforeEach, afterAll, it, expect, vi } from "vitest";

vi.mock("./report", () => ({ report: vi.fn() }));
let tts, bridge;
beforeAll(async () => {
  vi.resetModules();
  window.CapacitorCustomPlatform = { name: "android" };
  bridge = vi.fn(async (_plugin, method) => {
    if (method === "getSupportedVoices") return { voices: [{ name: "Spanish", lang: "es-ES", localService: true }] };
    if (method === "isLanguageSupported") return { supported: true };
  });
  window.Capacitor = {
    PluginHeaders: [{ name: "CatalogSpeech", methods: ["speak", "stop", "prepare", "getSupportedVoices", "isLanguageSupported", "openInstall"].map(name => ({ name, rtype: "promise" })) }],
    nativePromise: bridge,
  };
  tts = await import("./tts");
});
beforeEach(() => { bridge.mockClear(); });
afterAll(async () => {
  await tts.stop();
  delete window.CapacitorCustomPlatform;
  delete window.Capacitor;
});

it("reaches Android speech through the real Capacitor proxy without invoking its synthetic then", async () => {
  expect(await tts.speak("el campamento", { lang: "es-ES", strict: true })).toEqual({ ok: true });
  expect(bridge).toHaveBeenCalledWith("CatalogSpeech", "speak", expect.objectContaining({ text: "el campamento", lang: "es-ES", volume: 1 }));
  expect(bridge.mock.calls.map(([, method]) => method)).toEqual(["speak"]);
}, 2000);

it("settles a real-proxy Android playback rejection instead of leaving the speaker busy", async () => {
  bridge.mockImplementation(async (_plugin, method) => {
    if (method === "getSupportedVoices") return { voices: [] };
    if (method === "isLanguageSupported") return { supported: true };
    if (method === "speak") throw { code: "PLAYBACK_ERROR" };
  });
  expect(await tts.speak("el campamento", { lang: "es-ES" })).toEqual({ ok: false, reason: "error" });
}, 2000);
