// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({ enabled: false, notification: vi.fn() }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock("@capacitor/haptics", () => ({ Haptics: { notification: native.notification }, NotificationType: { Success: "SUCCESS", Error: "ERROR" } }));
vi.mock("./report", () => ({ report: vi.fn() }));
vi.mock("./speechUI", () => ({ PronounceFace: ({ card }) => <span>{card.front}</span> }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let feedback, root, host, vibrate, contexts;

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks();
  localStorage.clear();
  native.enabled = false; native.notification.mockReset();
  vibrate = vi.fn(); contexts = [];
  vi.stubGlobal("navigator", { vibrate });
  vi.stubGlobal("AudioContext", class {
    constructor() { this.state = "running"; this.currentTime = 10; this.destination = {}; this.tones = []; contexts.push(this); }
    resume = vi.fn(async () => { this.state = "running"; });
    createOscillator() {
      const tone = { frequency: {}, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      this.tones.push(tone); return tone;
    }
    createGain() { return { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }; }
  });
  feedback = await import("./answerFeedback");
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const click = text => act(() => {
  const button = [...host.querySelectorAll("button")].find(b => b.textContent.trim() === text);
  expect(button, text).toBeTruthy(); button.click();
});
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

describe("answer feedback on the device", () => {
  it("uses distinct audible cues and vibration patterns for right and wrong", () => {
    feedback.playAnswerFeedback(true);
    expect(contexts[0].tones.map(t => t.frequency.value)).toEqual([660, 880]);
    feedback.playAnswerFeedback(false);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].tones.slice(2).map(t => t.frequency.value)).toEqual([260, 195]);
    expect(vibrate.mock.calls).toEqual([[35], [[45, 55, 45]]]);
  });
  it("persists separate switches without changing catalog data, and restores them", async () => {
    localStorage.setItem("flashcard-catalog-data", "original cards and progress");
    feedback.setFeedbackSettings({ sound: false });
    feedback.playAnswerFeedback(true);
    expect(contexts).toHaveLength(0); expect(vibrate).toHaveBeenCalledOnce();
    feedback.setFeedbackSettings({ haptics: false });
    feedback.playAnswerFeedback(false);
    expect(vibrate).toHaveBeenCalledOnce();
    expect(localStorage.getItem("flashcard-catalog-data")).toBe("original cards and progress");
    vi.resetModules(); const reloaded = await import("./answerFeedback");
    expect(reloaded.getFeedbackSettings()).toEqual({ sound: false, haptics: false });
  });
  it("keeps a switch effective even if storage refuses the write", () => {
    feedback.setFeedbackSettings({ sound: true, haptics: true });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw Error("quota"); });
    feedback.setFeedbackSettings({ sound: false, haptics: false });
    feedback.playAnswerFeedback(true);
    expect(contexts).toHaveLength(0); expect(vibrate).not.toHaveBeenCalled();
  });
  it("uses native success and error haptics instead of the browser fallback", async () => {
    native.enabled = true;
    feedback.playAnswerFeedback(true); feedback.playAnswerFeedback(false);
    await vi.waitFor(() => expect(native.notification).toHaveBeenCalledTimes(2));
    expect(native.notification.mock.calls).toEqual([[{ type: "SUCCESS" }], [{ type: "ERROR" }]]);
    expect(vibrate).not.toHaveBeenCalled();
  });
  it("resumes suspended audio and still gives haptics when audio is unavailable", async () => {
    feedback.playAnswerFeedback(true);
    contexts[0].state = "suspended";
    feedback.playAnswerFeedback(false); await settle();
    expect(contexts[0].resume).toHaveBeenCalledOnce();
    vi.stubGlobal("AudioContext", undefined);
    feedback.playAnswerFeedback(true);
    expect(vibrate).toHaveBeenCalledTimes(3);
  });
  it("never lets rejected audio or haptics interrupt an answer", async () => {
    native.enabled = true; native.notification.mockRejectedValue(Error("unavailable"));
    vi.stubGlobal("AudioContext", class { constructor() { throw Error("blocked"); } });
    expect(() => feedback.playAnswerFeedback(false)).not.toThrow(); await settle();
    const { report } = await import("./report"); expect(report).toHaveBeenCalledTimes(2);
  });
  it("does not replay a restored answer or a rapid duplicate submission", () => {
    function Answer({ restored }) {
      const answer = feedback.useAnswerFeedback(restored);
      return <button onClick={() => { answer(true); answer(false); }}>Answer</button>;
    }
    act(() => root.render(<Answer restored />)); click("Answer");
    expect(vibrate).not.toHaveBeenCalled();
    act(() => root.render(<Answer key="fresh" />)); click("Answer"); click("Answer");
    expect(vibrate).toHaveBeenCalledOnce();
  });
});

describe("exercise feedback timing", () => {
  const card = { id: "a", front: "hola", back: "hello" };
  it("checks cloze on submission and stays silent on Next or restored results", async () => {
    const { ClozeCard } = await import("./drillUI"); const result = vi.fn();
    const props = { card, payload: { text: "Say ____", answer: "hello" }, onResult: result, shortcutsEnabled: true };
    act(() => root.render(<ClozeCard {...props} initialState={{ values: ["hello"] }} />));
    click("CheckEnter"); expect(vibrate).toHaveBeenLastCalledWith(35);
    click("NextEnter"); expect(result).toHaveBeenCalledWith(true); expect(vibrate).toHaveBeenCalledOnce();
    act(() => root.render(<ClozeCard key="restored" {...props} initialState={{ values: ["bad"], verdict: "wrong" }} />));
    expect(vibrate).toHaveBeenCalledOnce();
  });
  it("gives wrong feedback when a cloze answer is revealed", async () => {
    const { ClozeCard } = await import("./drillUI");
    act(() => root.render(<ClozeCard card={card} payload={{ text: "Say ____", answer: "hello" }} onResult={() => {}} />));
    click("Show me"); expect(vibrate).toHaveBeenLastCalledWith([45, 55, 45]);
  });
  it("gives true/false feedback on the choice, and does not replay on Next", async () => {
    const { TrueFalseCard } = await import("./drillUI"); const result = vi.fn();
    act(() => root.render(<TrueFalseCard card={card} payload={{ claim: "hola means bye", isTrue: false }} onResult={result} />));
    click("True2"); expect(vibrate).toHaveBeenLastCalledWith([45, 55, 45]);
    click("NextEnter"); expect(result).toHaveBeenCalledWith(false); expect(vibrate).toHaveBeenCalledOnce();
  });
  it("gives feedback for each pairing, preserving first-attempt grading", async () => {
    const { MatchCard } = await import("./drillUI"); const result = vi.fn();
    const pairs = [{ id: "a", term: "hola", meaning: "hello" }, { id: "b", term: "adiós", meaning: "bye" }];
    act(() => root.render(<MatchCard payload={{ pairs }} onResult={result} />));
    click("hola"); expect(vibrate).not.toHaveBeenCalled();
    click("bye"); expect(vibrate).toHaveBeenLastCalledWith([45, 55, 45]);
    click("hola"); click("hello"); expect(vibrate).toHaveBeenLastCalledWith(35);
    click("adiós"); click("bye"); click("NextEnter");
    expect(vibrate).toHaveBeenCalledTimes(3);
    expect(result).toHaveBeenCalledWith([{ cardId: "a", correct: false }, { cardId: "b", correct: false }]);
  });
});
