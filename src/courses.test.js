import { describe, it, expect, beforeAll } from "vitest";
import * as C from "./courses";
import * as cloze from "./cloze";

const answers = (over = {}) => ({ course: "es", track: "ab7", year: "8", half: 1, scope: "now", ...over });
let n = 0;
const newId = () => `id${++n}`;

const content = {};
beforeAll(async () => {
  for (const c of C.COURSES) content[c.id] = await c.load();
});

describe.each(C.COURSES.map((c) => [c.id, c]))("%s content", (id, course) => {
  const get = () => content[id];

  it("has every unit its syllabus names, and nothing it doesn't", () => {
    const { units, blocks } = get();
    const ids = new Set(units.map((u) => u.id));
    const used = blocks.flat();
    expect(used.filter((x) => !ids.has(x))).toEqual([]);
    expect([...ids].filter((x) => !used.includes(x))).toEqual([]);
    expect(new Set(used).size).toBe(used.length);
    expect(ids.size).toBe(units.length);
  });

  it("has exactly the blocks its tracks teach", () => {
    const { blocks } = get();
    for (const track of course.tracks) {
      const taught = new Set(track.years.flatMap(([, b]) => b));
      expect([...taught].sort((a, b) => a - b), track.id).toEqual(blocks.map((_, i) => i));
    }
  });

  it("gives every unit real content of its kind", () => {
    for (const u of get().units) {
      expect(u.title, u.id).toBeTruthy();
      if (u.kind === "vocab") {
        expect(u.words.length, u.id).toBeGreaterThanOrEqual(20);
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
    for (const u of get().units) for (const w of u.words) {
      expect(w.front && w.back, `${u.id}: ${w.front}`).toBeTruthy();
      const key = w.front.toLowerCase();
      expect(seen.get(key), `"${w.front}" in ${u.id} and ${seen.get(key)}`).toBeUndefined();
      seen.set(key, u.id);
    }
  });

  it("makes every exercise a working cloze card with a non-empty answer", () => {
    for (const u of get().units) for (const e of u.exercises) {
      const cards = cloze.expand(e);
      expect(cards.length, e).toBeGreaterThan(0);
      for (const c of cards) {
        expect(c.back.trim(), e).toBeTruthy();
        expect(c.front, e).toContain(cloze.BLANK);
      }
    }
  });

  it("is a course worth the name", () => {
    expect(get().units.reduce((s, u) => s + C.cardCount(u), 0)).toBeGreaterThan(400);
  });

  it("covers the whole syllabus on every track, with both kinds in every half", () => {
    const { blocks } = get();
    for (const track of course.tracks) {
      const plan = C.buildPlan(C.withDefaults({ course: id, track: track.id, year: track.years[0][0], half: 1, scope: "now" }), blocks);
      const all = new Set(plan.years.flatMap((y) => y.units.map((u) => u.id)));
      expect(all.size, track.id).toBe(blocks.flat().length);
      for (const y of plan.years) for (const half of plan.halves ? [1, 2] : [1]) {
        const units = y.units.filter((u) => u.half === half);
        expect(units.some((u) => u.id.startsWith("v")), `${track.id} ${y.year}/${half}`).toBe(true);
        expect(units.some((u) => u.id.startsWith("g")), `${track.id} ${y.year}/${half}`).toBe(true);
      }
    }
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
  const blocks = () => content.es.blocks;

  it("offers only the years of the chosen track", () => {
    const years = C.QUESTIONS.find((q) => q.id === "year").options({ course: "es", track: "abEF" }).map((o) => o.value);
    expect(years).toEqual(["EF", "Q1", "Q2"]);
  });

  it("skips what a course forces: one track, no half-years for self-study", () => {
    const ja = C.withDefaults({ course: "ja" });
    expect(ja).toMatchObject({ track: "self", half: 1 });
    expect(C.applicable(ja).map((q) => q.id)).toEqual(["course", "year", "scope"]);
    const en = C.withDefaults({ course: "en" });
    expect(en.track).toBe("ab5");
    expect(C.applicable(en).map((q) => q.id)).toEqual(["course", "year", "half", "scope"]);
    expect(C.applicable({ course: "fr" }).map((q) => q.id)).toEqual(["course", "track", "year", "half", "scope"]);
    expect(C.QUESTIONS.find((q) => q.id === "year").title(ja)).toMatch(/start/);
  });

  it("knows when the answers are complete", () => {
    expect(C.isComplete(answers())).toBe(true);
    expect(C.isComplete(answers({ year: "6" }))).toBe(false); // ab7 has no Klasse 6
    expect(C.isComplete(answers({ half: undefined }))).toBe(false);
    expect(C.isComplete(C.withDefaults({ course: "ko", year: "2", scope: "now" }))).toBe(true);
  });

  it("preselects the half of the school year from the date", () => {
    expect(C.halfForDate(new Date(2026, 9, 19))).toBe(1);
    expect(C.halfForDate(new Date(2027, 2, 1))).toBe(2);
    expect(C.halfForDate(new Date(2027, 0, 15))).toBe(1);
    expect(C.halfForDate(new Date(2027, 7, 20))).toBe(1);
  });

  it("marks earlier years done, this half now and the rest next", () => {
    const plan = C.buildPlan(answers({ year: "8", half: 2 }), blocks());
    const y7 = plan.years.find((y) => y.year === "7");
    const y8 = plan.years.find((y) => y.year === "8");
    const y9 = plan.years.find((y) => y.year === "9");
    expect(y7.units.every((u) => u.status === "done")).toBe(true);
    expect(y8.units.filter((u) => u.half === 1).every((u) => u.status === "done")).toBe(true);
    expect(y8.units.filter((u) => u.half === 2).every((u) => u.status === "now")).toBe(true);
    expect(y9.units.every((u) => u.status === "next")).toBe(true);
    expect(y8.current).toBe(true);
    expect(y8.label).toBe("Klasse 8");
  });

  it("names self-study levels by their label and keeps each level whole", () => {
    const a = C.withDefaults({ course: "ja", year: "2", scope: "review" });
    const plan = C.buildPlan(a, content.ja.blocks);
    expect(plan.halves).toBe(false);
    expect(plan.years[1]).toMatchObject({ label: "Stufe 2 · A1", current: true });
    expect(plan.years[1].units.every((u) => u.status === "now")).toBe(true);
    expect(plan.years[0].units.every((u) => u.status === "done")).toBe(true);
    const rec = C.recommended(plan, "review");
    expect(rec.some((u) => u.label === "Stufe 1 · Kana")).toBe(true);
    expect(rec.some((u) => u.year === "3")).toBe(false);
  });

  it("recommends this half, or everything so far when catching up", () => {
    const now = C.recommended(C.buildPlan(answers({ year: "8", half: 1 }), blocks()), "now");
    expect(now.length).toBeGreaterThan(0);
    expect(now.every((u) => u.status === "now" && u.year === "8")).toBe(true);
    const review = C.recommended(C.buildPlan(answers({ year: "8", half: 1 }), blocks()), "review");
    expect(review.some((u) => u.year === "7")).toBe(true);
    expect(review.some((u) => u.year === "9")).toBe(false);
  });

  it("treats the Klasse 6 track's Q2 as Abitur review, never as new material", () => {
    const plan = C.buildPlan(answers({ track: "ab6", year: "Q2", half: 1, scope: "review" }), blocks());
    const q2 = plan.years.find((y) => y.year === "Q2");
    expect(q2.review).toBe(true);
    expect(q2.units.every((u) => u.status === "done")).toBe(true);
    const rec = C.recommended(plan, "review");
    expect(new Set(rec.map((u) => u.id)).size).toBe(rec.length);
  });

  it("reads the saved placement of every course in the library", () => {
    const es = answers();
    const subjects = [
      { id: "a", name: "Spanisch", children: [], course: { id: "es", answers: es } },
      { id: "b", name: "Französisch", children: [], course: { id: "fr", answers: { course: "fr" } } },
    ];
    expect(C.savedAnswers(subjects)).toEqual({ es });
  });
});

describe("addUnits", () => {
  const es = C.courseById("es");
  const picks = (plan, ids) => C.recommended(plan, "review").filter((u) => ids.includes(u.id));
  const plan = (a) => C.buildPlan(a, content.es.blocks);

  it("files units under Spanisch › Klasse 7 › unit with the course's voices", () => {
    const a = answers({ year: "7", half: 1 });
    const out = C.addUnits({ subjects: [], course: es, units: content.es.units, picks: picks(plan(a), ["v1-familia", "g1-presente"]), answers: a, newId });
    expect(out.subjects).toHaveLength(1);
    const subject = out.subjects[0];
    expect(subject.name).toBe("Spanisch");
    expect(subject.speech).toMatchObject({ frontLang: "es-ES", backLang: "de-DE", frontLanguageMode: "manual" });
    expect(subject.course.answers.year).toBe("7");
    expect(subject.children.map((x) => x.name)).toEqual(["Klasse 7"]);
    expect(subject.children[0].children.map((x) => x.name)).toEqual(["La familia", "Grammatik · Präsens: regelmäßige Verben"]);
    expect(out.added).toEqual(["v1-familia", "g1-presente"]);

    const familia = content.es.units.find((u) => u.id === "v1-familia");
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
    const first = C.addUnits({ subjects: [{ id: "other", name: "Bio", children: [] }], course: es, units: content.es.units, picks: picks(plan(a), ["v1-ciudad"]), answers: a, newId });
    const second = C.addUnits({ subjects: first.subjects, course: es, units: content.es.units, picks: picks(plan(a), ["v1-ciudad", "v1-familia"]), answers: a, newId });
    expect(second.subjects).toHaveLength(2);
    const subject = second.subjects.find((s) => s.course);
    expect(subject.children.map((x) => x.name)).toEqual(["Klasse 7", "Klasse 8"]);
    expect(second.added).toEqual(["v1-familia"]);
    expect(C.addedUnits(second.subjects, "es")).toEqual(new Set(["v1-ciudad", "v1-familia"]));
    expect(second.subjects.find((s) => s.id === "other")).toEqual({ id: "other", name: "Bio", children: [] });
  });

  it("lets a unit come back after its folder was deleted", () => {
    const a = answers({ year: "7" });
    const first = C.addUnits({ subjects: [], course: es, units: content.es.units, picks: picks(plan(a), ["v1-hola"]), answers: a, newId });
    const subject = first.subjects[0];
    const emptied = [{ ...subject, children: [{ ...subject.children[0], children: [] }] }];
    const again = C.addUnits({ subjects: emptied, course: es, units: content.es.units, picks: picks(plan(a), ["v1-hola"]), answers: a, newId });
    expect(again.added).toEqual(["v1-hola"]);
  });

  it("keeps two languages apart and voices each in its own language", () => {
    const fr = C.courseById("fr");
    const ja = C.courseById("ja");
    const aFr = { course: "fr", track: "ab7", year: "7", half: 1, scope: "now" };
    const aJa = C.withDefaults({ course: "ja", year: "1", scope: "now" });
    const one = C.addUnits({ subjects: [], course: fr, units: content.fr.units, picks: C.recommended(C.buildPlan(aFr, content.fr.blocks), "now"), answers: aFr, newId });
    const two = C.addUnits({ subjects: one.subjects, course: ja, units: content.ja.units, picks: C.recommended(C.buildPlan(aJa, content.ja.blocks), "now"), answers: aJa, newId });
    expect(two.subjects.map((s) => s.name)).toEqual(["Französisch", "Japanisch"]);
    expect(two.subjects[1].speech.frontLang).toBe("ja-JP");
    expect(two.subjects[1].children[0].name).toBe("Stufe 1 · Kana");
    expect(two.cards.filter((c) => c.clozeSource).every((c) => c.speech.backLang === "ja-JP")).toBe(true);
    expect(C.savedAnswers(two.subjects)).toEqual({ fr: aFr, ja: aJa });
  });
});
