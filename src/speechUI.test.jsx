// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { PronounceFace } from "./speechUI";
import * as tts from "./tts";

vi.mock("./tts", async importOriginal => ({ ...await importOriginal(),
  isSupported: () => true, availableLanguages: async () => [], speak: vi.fn(), stop: vi.fn(), canOpenVoiceSettings: vi.fn(() => false), openVoiceSettings: vi.fn(),
}));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root, flip;
const card = { front: "el campamento", back: "das Lager" };
beforeEach(() => {
  vi.clearAllMocks(); tts.speak.mockResolvedValue({ ok: true });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  flip = vi.fn();
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = async (subject = { name: "Spanish" }, c = card) => {
  await act(async () => root.render(<div onClick={flip}><PronounceFace card={c} subject={subject} /></div>));
};
const click = async element => { await act(async () => element.click()); };

it("only the small speaker reads aloud; tapping the word keeps the normal card action", async () => {
  await render(); await click(host.querySelector("p"));
  expect(tts.speak).not.toHaveBeenCalled(); expect(flip).toHaveBeenCalledTimes(1);
  flip.mockClear(); await click(host.querySelector("button"));
  expect(tts.speak).toHaveBeenCalledWith(card.front, expect.objectContaining({ lang: "es-ES", strict: true }));
  expect(flip).not.toHaveBeenCalled();
});
it("speaks automatically and leaves no language selector in the study face", async () => {
  await render({ name: "Vocabulary" }); await click(host.querySelector("button"));
  expect(tts.speak).toHaveBeenCalledWith(card.front, expect.objectContaining({ lang: "es-ES" }));
  expect(host.querySelector("select")).toBeNull();
  expect(tts.speak).toHaveBeenCalledTimes(1);
  expect(flip).not.toHaveBeenCalled();
});
it("offers stop during playback and shows actionable missing-voice feedback", async () => {
  tts.speak.mockReturnValueOnce(new Promise(() => {})); await render();
  await click(host.querySelector("button")); expect(host.querySelector("button").title).toBe("Stop pronunciation");
  await click(host.querySelector("button")); expect(tts.stop).toHaveBeenCalled();
  tts.speak.mockResolvedValueOnce({ ok: false, reason: "no-voice" });
  await click(host.querySelector("button")); expect(host.querySelector('[role="status"]').textContent).toContain("Install it");
});
it("does not offer pronunciation for image-only cards", async () => {
  await render({}, { front: "", frontImageId: "photo" });
  expect(host.querySelector("button")).toBeNull();
});

it("releases the busy speaker on failure and opens Android voice settings without flipping", async () => {
  tts.canOpenVoiceSettings.mockReturnValueOnce(true);
  tts.speak.mockResolvedValueOnce({ ok: false, reason: "engine-unavailable" });
  tts.openVoiceSettings.mockResolvedValueOnce(true);
  await render(); await click(host.querySelector("button"));
  expect(host.querySelector("button").title).toBe("Read aloud");
  expect(host.querySelector('[role="status"]').textContent).toContain("speech engine");
  await click([...host.querySelectorAll("button")].find(b => b.textContent === "Voice settings"));
  expect(tts.openVoiceSettings).toHaveBeenCalledTimes(1);
  expect(flip).not.toHaveBeenCalled();
  expect(host.querySelector("select")).toBeNull();
});
