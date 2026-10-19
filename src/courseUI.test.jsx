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
const until = async (fn) => { for (let i = 0; i < 40 && !fn(); i++) await act(() => new Promise((r) => setTimeout(r, 10))); };
const settle = () => until(() => !host.textContent.includes("Loading the course"));
let n = 0;
const newId = () => `n${++n}`;

it("asks the placement questions, then adds this half's topics to the library", async () => {
  const onAdd = vi.fn();
  await render(<CourseSheet subjects={[]} onAdd={onAdd} onClose={() => {}} />);
  expect(host.textContent).toContain("Question 1 of 5");
  for (const c of C.COURSES) expect(host.textContent).toContain(c.name);
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
  expect(picks.every((p) => p.year === "8" && p.label === "Klasse 8" && p.status === "now")).toBe(true);
});

it("skips the school questions for a self-study language", async () => {
  const onAdd = vi.fn();
  await render(<CourseSheet subjects={[]} onAdd={onAdd} onClose={() => {}} />);
  await press("Japanisch");
  expect(host.textContent).toContain("Question 2 of 3");
  expect(host.textContent).toContain("Where do you want to start?");
  await press("Stufe 1 · Kana");
  await press("Just this level");
  await settle();
  expect(host.textContent).toContain("Self-study");
  expect(host.textContent).not.toContain("half");
  await press("Add what I need now");
  const { picks, answers } = onAdd.mock.calls[0][0];
  expect(answers).toMatchObject({ course: "ja", track: "self", year: "1", half: 1 });
  expect(picks.some((p) => p.id === "v1-hiragana")).toBe(true);
});

it("reopens a saved plan from the language list, shows added topics, and can change answers", async () => {
  const answers = { course: "es", track: "abEF", year: "EF", half: 2, scope: "review" };
  const content = await C.courseById("es").load();
  const plan = C.buildPlan(answers, content.blocks);
  const { subjects } = C.addUnits({ subjects: [], course: C.courseById("es"), units: content.units, picks: C.recommended(plan, "now").slice(0, 1), answers, newId });
  await render(<CourseSheet subjects={subjects} onAdd={() => {}} onClose={() => {}} />);
  expect(host.textContent).toContain("Your plan");
  await press("Spanisch");
  await settle();
  expect(host.textContent).toContain("Oberstufe (neu einsetzend)");
  expect(host.textContent).toContain("Added");
  await press("Change");
  expect(host.textContent).toContain("Since when do you learn it at school?");
  // One step back from the track question is the language list.
  await press("Previous question");
  expect(host.textContent).toContain("Which language do you want to learn?");
});

it("opens straight on a course's plan from inside its folder", async () => {
  const answers = { course: "fr", track: "ab7", year: "9", half: 1, scope: "now" };
  const subjects = [{ id: "s", name: "Französisch", children: [], course: { id: "fr", answers } }];
  await render(<CourseSheet subjects={subjects} initialCourse="fr" onAdd={() => {}} onClose={() => {}} />);
  await settle();
  expect(host.textContent).toContain("Französisch");
  expect(host.textContent).toContain("Klasse 9");
  expect(host.textContent).not.toContain("Question 1");
});

it("shows a grammar folder's rule, and nothing for a vocabulary folder", async () => {
  await render(<GrammarNote courseId="es" unitId="g1-ser-estar-hay" />);
  await until(() => host.textContent.includes("The rule"));
  expect(host.textContent).toContain("The rule");
  expect(host.textContent).toContain("soy · eres · es");
  await render(<GrammarNote courseId="ru" unitId="g2-dvizhenie" />);
  await until(() => host.textContent.includes("идти"));
  expect(host.textContent).toContain("идти");
  await render(<GrammarNote courseId="es" unitId="v1-familia" />);
  expect(host.textContent).toBe("");
});
