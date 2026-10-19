// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { CourseSheet, GrammarNote } from "./courseUI";
import * as C from "./courses";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => { host = document.createElement("div"); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = async (el) => { await act(async () => root.render(el)); };
const buttons = () => [...host.querySelectorAll("button")];
const press = async (text) => {
  const b = buttons().find((x) => x.textContent.includes(text));
  if (!b) throw new Error(`No button "${text}" in: ${buttons().map((x) => x.textContent).join(" | ")}`);
  await act(async () => b.click());
};
// The content arrives through a dynamic import; give it a moment.
const settle = async () => { for (let i = 0; i < 20 && host.textContent.includes("Loading the course"); i++) await act(() => new Promise((r) => setTimeout(r, 10))); };

it("asks the placement questions, then adds this half's topics to the library", async () => {
  const onAdd = vi.fn();
  await render(<CourseSheet subjects={[]} onAdd={onAdd} onClose={() => {}} />);
  expect(host.textContent).toContain("Question 1 of 5");
  await press("Spanisch");
  await press("Klasse 7");
  // Only the Klasse 7 track's years are offered.
  expect(buttons().some((b) => b.textContent.includes("Klasse 6"))).toBe(false);
  await press("Klasse 8");
  await press("1st half");
  await press("Just what we are doing now");
  await settle();
  expect(host.textContent).toContain("YOU ARE HERE");
  await press("Add what I need now");
  expect(onAdd).toHaveBeenCalledTimes(1);
  const { picks, answers, units, course } = onAdd.mock.calls[0][0];
  expect(answers).toMatchObject({ course: "es", track: "ab7", year: "8", half: 1, scope: "now" });
  expect(course.id).toBe("es");
  expect(units.length).toBeGreaterThan(40);
  expect(picks.length).toBeGreaterThan(0);
  expect(picks.every((p) => p.year === "8" && p.status === "now")).toBe(true);
});

it("reopens on the saved plan, shows added topics as added, and can go back to the questions", async () => {
  const answers = { course: "es", track: "abEF", year: "EF", half: 2, scope: "review" };
  const units = await C.courseById("es").load();
  const plan = C.buildPlan(answers);
  const { subjects } = C.addUnits({ subjects: [], course: C.courseById("es"), units, picks: C.recommended(plan, "now").slice(0, 1), answers, newId: (() => { let i = 0; return () => `n${++i}`; })() });
  await render(<CourseSheet subjects={subjects} onAdd={() => {}} onClose={() => {}} />);
  await settle();
  expect(host.textContent).toContain("Oberstufe (neu einsetzend)");
  expect(host.textContent).toContain("Added");
  await press("Change");
  expect(host.textContent).toContain("Question 1 of 5");
});

it("shows a grammar folder's rule, and nothing for a vocabulary folder", async () => {
  await render(<GrammarNote courseId="es" unitId="g1-ser-estar-hay" />);
  for (let i = 0; i < 20 && !host.textContent.includes("The rule"); i++) await act(() => new Promise((r) => setTimeout(r, 10)));
  expect(host.textContent).toContain("The rule");
  expect(host.textContent).toContain("soy · eres · es");
  await render(<GrammarNote courseId="es" unitId="v1-familia" />);
  expect(host.textContent).toBe("");
});
