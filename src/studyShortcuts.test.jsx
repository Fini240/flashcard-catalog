// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useStudyKeys } from "./studyShortcuts";
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host, root, answer, undo, reveal;
function Controls() {
  useStudyKeys({ "1": answer, " ": reveal, undo });
  return <><input /><textarea /><button>Ordinary button</button></>;
}
const press = (target, key, extra = {}) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...extra });
  act(() => target.dispatchEvent(event));
  return event;
};
beforeEach(() => {
  answer = vi.fn(); undo = vi.fn(); reveal = vi.fn();
  host = document.createElement("div"); document.body.append(host);
  root = createRoot(host); act(() => root.render(<Controls />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe("study shortcuts", () => {
  it("handles an answer once and ignores held keys and composing input", () => {
    expect(press(document.body, "1").defaultPrevented).toBe(true);
    press(document.body, "1", { repeat: true });
    press(document.body, "1", { isComposing: true });
    expect(answer).toHaveBeenCalledTimes(1);
  });
  it("never grades while typing in an input, textarea or editable region", () => {
    press(host.querySelector("input"), "1");
    press(host.querySelector("textarea"), "1");
    const editable = document.createElement("div"); editable.setAttribute("contenteditable", "true"); host.append(editable);
    press(editable, "1");
    expect(answer).not.toHaveBeenCalled();
  });
  it("respects native button activation and prevents Space scrolling elsewhere", () => {
    expect(press(host.querySelector("button"), " ").defaultPrevented).toBe(false);
    expect(reveal).not.toHaveBeenCalled();
    expect(press(document.body, " ").defaultPrevented).toBe(true);
    expect(reveal).toHaveBeenCalledTimes(1);
  });
  it("supports Mac and Windows undo without taking over text undo or redo", () => {
    press(document.body, "z", { metaKey: true });
    press(document.body, "z", { ctrlKey: true });
    press(host.querySelector("input"), "z", { metaKey: true });
    press(document.body, "z", { metaKey: true, shiftKey: true });
    press(document.body, "1", { ctrlKey: true });
    expect(undo).toHaveBeenCalledTimes(2);
    expect(answer).not.toHaveBeenCalled();
  });
  it("does not trigger study actions behind an open tutor", () => {
    const overlay = document.createElement("div"); overlay.className = "fc-study-overlay"; host.append(overlay);
    press(document.body, "1");
    expect(answer).not.toHaveBeenCalled();
  });
});
