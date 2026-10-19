import { describe, it, expect } from "vitest";
import * as C from "./courses";
import * as cloze from "./cloze";
import spanish from "./courses/es.js";

const answers = (over = {}) => ({ course: "es", track: "ab7", year: "8", half: 1, scope: "now", ...over });
let n = 0;
const newId = () => `id${++n}`;

describe("Spanish content", () => {
  const ids = new Set(spanish.map((u) => u.id));

  it("has every unit the syllabus names, and nothing it doesn't", () => {
    const used = C.BLOCKS.flat();
    expect(used.filter((id) => !ids.has(id))).toEqual([]);
    expect([...ids].filter((id) => !used.includes(id))).toEqual([]);
    expect(new Set(used).size).toBe(used.length);
    expect(ids.size).toBe(spanish.length);
  });

  it("gives every unit real content of its kind", () => {
    for (const u of spanish) {
      expect(u.title, u.id).toBeTruthy();
      if (u.kind === "vocab") {
        expect(u.words.length, u.id).toBeGreaterThanOrEqual(25);
        expect(u.exercises, u.id).toEqual([]);
      } else {
        expect(u.explain.length, u.id).toBeGreaterThanOrEqual(4);
        expect(u.exercises.length, u.id).toBeGreaterThanOrEqual(8);
        expect(u.words, u.id).toEqual([]);
      }
    }
  });

  it("has no empty sides and no word taught twice", () => {
    const seen = new Map();
    for (const u of spanish) for (const w of u.words) {
      expect(w.front && w.back, `${u.id}: ${w.front}`).toBeTruthy();
      const key = w.front.toLowerCase();
      expect(seen.get(key), `"${w.front}" in ${u.id} and ${seen.get(key)}`).toBeUndefined();
      seen.set(key, u.id);
    }
  });

  it("makes every exercise a working cloze card with a non-empty answer", () => {
    for (const u of spanish) for (const e of u.exercises) {
      const cards = cloze.expand(e);
      expect(cards.length, e).toBeGreaterThan(0);
      for (const c of cards) {
        expect(c.back.trim(), e).toBeTruthy();
        expect(c.front, e).toContain(cloze.BLANK);
      }
    }
  });

  it("is a course worth the name", () => {
    const total = spanish.reduce((s, u) => s + C.cardCount(u), 0);
    expect(total).toBeGreaterThan(1000);
  });
});

describe("parseCourse", () => {
  it("reads units, words, explanations and exercises", () => {
    const [v, g] = C.parseCourse(`
      // comment
      # v1-x | Title | Sub
      el perro | der Hund
      # g1-y | Grammar
      > Line one
      ? Yo {{c1::hablo}}. (hablar)
    `);
    expect(v).toMatchObject({ id: "v1-x", title: "Title", subtitle: "Sub", kind: "vocab", words: [{ front: "el perro", back: "der Hund" }] });
    expect(g).toMatchObject({ kind: "grammar", explain: ["Line one"], exercises: ["Yo {{c1::hablo}}. (hablar)"] });
  });

  it("refuses a malformed line rather than dropping it", () => {
    expect(() => C.parseCourse("# v1-x | T\nno separator")).toThrow(/front \| back/);
    expect(() => C.parseCourse("el perro | der Hund")).toThrow(/outside a unit/);
  });
});

describe("placement", () => {
  it("offers only the years of the chosen track", () => {
    const years = C.QUESTIONS.find((q) => q.id === "year").options({ track: "abEF" }).map((o) => o.value);
    expect(years).toEqual(["EF", "Q1", "Q2"]);
  });

  it("knows when the answers are complete", () => {
    expect(C.isComplete(answers())).toBe(true);
    expect(C.isComplete(answers({ year: "6" }))).toBe(false); // ab7 has no Klasse 6
    expect(C.isComplete(answers({ half: undefined }))).toBe(false);
  });

  it("preselects the half of the school year from the date", () => {
    expect(C.halfForDate(new Date(2026, 9, 19))).toBe(1);
    expect(C.halfForDate(new Date(2027, 2, 1))).toBe(2);
    expect(C.halfForDate(new Date(2027, 0, 15))).toBe(1);
    expect(C.halfForDate(new Date(2027, 7, 20))).toBe(1);
  });

  it("covers the whole syllabus on every track", () => {
    for (const track of C.TRACKS) {
      const plan = C.buildPlan(answers({ track: track.id, year: track.years[0][0] }));
      const all = new Set(plan.years.flatMap((y) => y.units.map((u) => u.id)));
      expect(all.size, track.id).toBe(C.BLOCKS.flat().length);
    }
  });

  it("marks earlier years done, this half now and the rest next", () => {
    const plan = C.buildPlan(answers({ year: "8", half: 2 }));
    const y7 = plan.years.find((y) => y.year === "7");
    const y8 = plan.years.find((y) => y.year === "8");
    const y9 = plan.years.find((y) => y.year === "9");
    expect(y7.units.every((u) => u.status === "done")).toBe(true);
    expect(y8.units.filter((u) => u.half === 1).every((u) => u.status === "done")).toBe(true);
    expect(y8.units.filter((u) => u.half === 2).every((u) => u.status === "now")).toBe(true);
    expect(y9.units.every((u) => u.status === "next")).toBe(true);
    expect(y8.current).toBe(true);
  });

  it("splits each year so both halves get vocabulary and grammar", () => {
    const plan = C.buildPlan(answers());
    for (const y of plan.years) for (const half of [1, 2]) {
      const units = y.units.filter((u) => u.half === half);
      expect(units.some((u) => u.id.startsWith("v")), `${y.year}/${half}`).toBe(true);
      expect(units.some((u) => u.id.startsWith("g")), `${y.year}/${half}`).toBe(true);
    }
  });

  it("recommends this half, or everything so far when catching up", () => {
    const now = C.recommended(C.buildPlan(answers({ year: "8", half: 1 })), "now");
    expect(now.length).toBeGreaterThan(0);
    expect(now.every((u) => u.status === "now" && u.year === "8")).toBe(true);
    const review = C.recommended(C.buildPlan(answers({ year: "8", half: 1 })), "review");
    expect(review.some((u) => u.year === "7")).toBe(true);
    expect(review.some((u) => u.year === "9")).toBe(false);
  });

  it("treats the Klasse 6 track's Q2 as Abitur review, never as new material", () => {
    const plan = C.buildPlan(answers({ track: "ab6", year: "Q2", half: 1, scope: "review" }));
    const q2 = plan.years.find((y) => y.year === "Q2");
    expect(q2.review).toBe(true);
    expect(q2.units.every((u) => u.status === "done")).toBe(true);
    const rec = C.recommended(plan, "review");
    expect(new Set(rec.map((u) => u.id)).size).toBe(rec.length);
  });
});

describe("addUnits", () => {
  const course = C.courseById("es");
  const picks = (plan, ids) => C.recommended(plan, "review").filter((u) => ids.includes(u.id));

  it("files units under Spanisch › Klasse 7 › unit with the course's voices", () => {
    const plan = C.buildPlan(answers({ year: "7", half: 1 }));
    const out = C.addUnits({ subjects: [], course, units: spanish, picks: picks(plan, ["v1-familia", "g1-presente"]), answers: answers({ year: "7" }), newId });
    expect(out.subjects).toHaveLength(1);
    const subject = out.subjects[0];
    expect(subject.name).toBe("Spanisch");
    expect(subject.speech).toMatchObject({ frontLang: "es-ES", backLang: "de-DE", frontLanguageMode: "manual" });
    expect(subject.course.answers.year).toBe("7");
    expect(subject.children.map((n) => n.name)).toEqual(["Klasse 7"]);
    expect(subject.children[0].children.map((n) => n.name)).toEqual(["La familia", "Grammatik · Präsens: regelmäßige Verben"]);
    expect(out.added).toEqual(["v1-familia", "g1-presente"]);

    const familia = spanish.find((u) => u.id === "v1-familia");
    const vocab = out.cards.filter((c) => c.nodeId === subject.children[0].children[0].id);
    expect(vocab).toHaveLength(familia.words.length);
    expect(vocab[0]).toMatchObject({ front: familia.words[0].front, back: familia.words[0].back, subjectId: subject.id });
    expect(vocab[0].due).toBeUndefined();

    const grammar = out.cards.filter((c) => c.nodeId === subject.children[0].children[1].id);
    expect(grammar.length).toBeGreaterThan(0);
    expect(grammar.every((c) => c.clozeSource && c.speech?.backLang === "es-ES")).toBe(true);
    expect(new Set(out.cards.map((c) => c.id)).size).toBe(out.cards.length);
  });

  it("reuses the subject and year folders, keeps years in school order and never adds a unit twice", () => {
    const a = answers({ year: "8", scope: "review" });
    const plan = C.buildPlan(a);
    const first = C.addUnits({ subjects: [{ id: "other", name: "Bio", children: [] }], course, units: spanish, picks: picks(plan, ["v1-ciudad"]), answers: a, newId });
    const second = C.addUnits({ subjects: first.subjects, course, units: spanish, picks: picks(plan, ["v1-ciudad", "v1-familia"]), answers: a, newId });
    expect(second.subjects).toHaveLength(2);
    const subject = second.subjects.find((s) => s.course);
    expect(subject.children.map((n) => n.name)).toEqual(["Klasse 7", "Klasse 8"]);
    expect(second.added).toEqual(["v1-familia"]);
    expect(C.addedUnits(second.subjects, "es")).toEqual(new Set(["v1-ciudad", "v1-familia"]));
    expect(second.subjects.find((s) => s.id === "other")).toEqual({ id: "other", name: "Bio", children: [] });
  });

  it("lets a unit come back after its folder was deleted", () => {
    const a = answers({ year: "7" });
    const plan = C.buildPlan(a);
    const first = C.addUnits({ subjects: [], course, units: spanish, picks: picks(plan, ["v1-hola"]), answers: a, newId });
    const subject = first.subjects[0];
    const emptied = [{ ...subject, children: [{ ...subject.children[0], children: [] }] }];
    const again = C.addUnits({ subjects: emptied, course, units: spanish, picks: picks(plan, ["v1-hola"]), answers: a, newId });
    expect(again.added).toEqual(["v1-hola"]);
  });
});
