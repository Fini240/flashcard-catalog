// ---------------------------------------------------------------------------
// Language courses — ready-made vocabulary and grammar laid out along a
// school year plan.
//
// A student does not want "Spanish, 900 words". They want "what we are doing
// in Klasse 8 right now", and the words from Klasse 7 they never really
// learned. So a course is three layers:
//
//   1. **Content**: units, each one vocabulary topic or one grammar topic,
//      written in a small text format (parseCourse below) and bundled with the
//      app — a course must work offline like everything else. The content
//      files are loaded on demand, never in the main bundle.
//   2. **A syllabus**: the units in seven blocks, the order a German school
//      teaches them in, after the NRW Kernlehrplan (Sek I and Sek II). The
//      words are our own, not a textbook's: the topics follow the curriculum,
//      which is public, while a publisher's unit lists are not ours to ship.
//   3. **Tracks**: when the student started (Klasse 6, 7, 9 or a new start in
//      the EF), each mapping its school years onto those blocks. The same
//      block lands in Klasse 8 for one student and the EF for another.
//
// Placement turns a few answers into a plan: which units are "now", which
// are earlier (offered as review) and which come later. Nothing here touches
// app state; addUnits() returns the tree and cards the caller then commits.
// ---------------------------------------------------------------------------

import * as cloze from "./cloze";

export const COURSES = [
  {
    id: "es",
    name: "Spanisch",
    flag: "🇪🇸",
    // The pronunciation each side gets. Manual rather than Auto: a course
    // knows its languages, and Auto guesses wrong on short words like "pan".
    speech: { frontLang: "es-ES", frontLanguageMode: "manual", backLang: "de-DE", backLanguageMode: "manual" },
    load: () => import("./courses/es.js").then((m) => m.default),
  },
];

export const courseById = (id) => COURSES.find((c) => c.id === id) || null;

// The order a German school works through Spanish. Unit ids are the content
// ids; a vocabulary unit starts with "v", a grammar unit with "g".
export const BLOCKS = [
  // B1 — first steps (A1)
  ["v1-hola", "v1-numeros", "v1-familia", "v1-instituto", "v1-tiempolibre", "v1-casa",
    "g1-articulos", "g1-presente", "g1-ser-estar-hay", "g1-preguntas", "g1-irregulares", "g1-posesivos"],
  // B2 — everyday life (A1)
  ["v1-ciudad", "v1-comida", "v1-dia", "v2-ropa", "v2-cuerpo",
    "g1-gustar", "g1-reflexivos", "g2-diptongo", "g2-futuro-proximo", "g2-gerundio", "g2-perfecto"],
  // B3 — telling what happened (A2)
  ["v2-viajes", "v2-naturaleza", "v2-fiestas", "v2-medios", "v2-amigos",
    "g2-indefinido", "g2-indefinido-irr", "g2-pronombres", "g2-comparativo", "g2-imperativo"],
  // B4 — Spain and Latin America (A2)
  ["v3-espana", "v3-latam", "v3-jovenes", "v3-vivienda",
    "g3-imperfecto", "g3-imperf-indef", "g3-futuro", "g3-condicional", "g3-relativos"],
  // B5 — the future and the planet (A2/B1)
  ["v3-futuro", "v3-medioambiente", "v4-analisis",
    "g3-subjuntivo", "g3-imperativo-neg", "g3-pluscuamperfecto"],
  // B6 — Abitur topics I (B1)
  ["v4-migracion", "v4-crisis", "v4-identidad", "v4-opinion",
    "g4-subj-conjunciones", "g4-subj-opinion", "g4-imperf-subj"],
  // B7 — Abitur topics II (B1)
  ["v4-globalizacion", "v4-memoria", "v4-turismo",
    "g4-si", "g4-estilo-indirecto", "g4-pasiva"],
];

// When a student started decides which school year each block falls in.
// NRW G9 starts the second foreign language in Klasse 7; Klasse 6 is the
// G8 timing still used by some schools, Klasse 9 the Wahlpflicht course, and
// "EF" the new start in the Oberstufe, which covers the whole syllabus in
// three years. Years list the blocks they teach.
export const TRACKS = [
  {
    id: "ab6", label: "Klasse 6",
    years: [["6", [0]], ["7", [1]], ["8", [2]], ["9", [3]], ["10", [4]], ["EF", [5]], ["Q1", [6]],
      // Q2 has no new block of its own on this track: it is the run-up to
      // the Abitur, so it brings the two Abitur blocks back as review.
      ["Q2", [5, 6], { review: true }]],
  },
  { id: "ab7", label: "Klasse 7",
    years: [["7", [0]], ["8", [1]], ["9", [2]], ["10", [3]], ["EF", [4]], ["Q1", [5]], ["Q2", [6]]] },
  { id: "ab9", label: "Klasse 9 (Wahlpflicht)",
    years: [["9", [0]], ["10", [1]], ["EF", [2]], ["Q1", [3, 4]], ["Q2", [5, 6]]] },
  { id: "abEF", label: "Oberstufe (neu einsetzend)",
    years: [["EF", [0, 1]], ["Q1", [2, 3]], ["Q2", [4, 5, 6]]] },
];

export const trackById = (id) => TRACKS.find((t) => t.id === id) || null;

// How a school year is named in the library and the plan.
export const yearLabel = (year) => (/^\d+$/.test(year) ? `Klasse ${year}` : year);

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

// The questions, in order. `options` may be a function of the answers so far:
// which years you can be in depends on when you started.
export const QUESTIONS = [
  {
    id: "course", title: "Which language do you want to learn?",
    options: () => COURSES.map((c) => ({ value: c.id, label: `${c.flag} ${c.name}` })),
  },
  {
    id: "track", title: "Since when do you learn it at school?",
    options: () => TRACKS.map((t) => ({ value: t.id, label: t.label })),
  },
  {
    id: "year", title: "Which year are you in now?",
    options: (a) => (trackById(a.track)?.years || []).map(([y]) => ({ value: y, label: yearLabel(y) })),
  },
  {
    id: "half", title: "Which half of the school year?",
    options: () => [
      { value: 1, label: "1st half (Aug–Jan)" },
      { value: 2, label: "2nd half (Feb–Jul)" },
    ],
  },
  {
    id: "scope", title: "What should the plan include?",
    options: () => [
      { value: "now", label: "Just what we are doing now" },
      { value: "review", label: "Now, plus earlier years to catch up" },
    ],
  },
];

// The half of the year a date falls in, for preselecting the question: the
// second half starts on 1 February, the new school year in August.
export const halfForDate = (date = new Date()) => {
  const m = date.getMonth();
  return m >= 1 && m <= 6 ? 2 : 1;
};

export const isComplete = (a) =>
  !!(a && courseById(a.course) && trackById(a.track)
    && trackById(a.track).years.some(([y]) => y === a.year)
    && (a.half === 1 || a.half === 2) && (a.scope === "now" || a.scope === "review"));

// Splits a year's units into its two halves, vocabulary and grammar each
// split separately so both halves get some of both.
function halves(ids) {
  const vocab = ids.filter((id) => id.startsWith("v"));
  const grammar = ids.filter((id) => id.startsWith("g"));
  const cut = (list) => [list.slice(0, Math.ceil(list.length / 2)), list.slice(Math.ceil(list.length / 2))];
  const [v1, v2] = cut(vocab);
  const [g1, g2] = cut(grammar);
  return [[...v1, ...g1], [...v2, ...g2]];
}

// The whole plan for a set of answers: every school year of the track, each
// unit tagged with where it stands relative to "now".
//
//   status: "done"  — taught before now (offered as review)
//           "now"   — this half of this year
//           "next"  — the other half of this year, or a later year
//
// A review-only year (Q2 on the Klasse 6 track) never has "now" units of its
// own; its blocks were already met, so they count as review from the start.
export function buildPlan(answers) {
  const track = trackById(answers?.track);
  if (!track) return null;
  const currentIndex = track.years.findIndex(([y]) => y === answers.year);
  const seen = new Set();
  const years = track.years.map(([year, blocks, opts = {}], yearIndex) => {
    const ids = blocks.flatMap((b) => BLOCKS[b]).filter((id) => opts.review || !seen.has(id));
    const [first, second] = halves(ids);
    const statusFor = (id, half) => {
      if (opts.review) return yearIndex <= currentIndex ? "done" : "next";
      if (yearIndex < currentIndex) return "done";
      if (yearIndex > currentIndex) return "next";
      if (half === answers.half) return "now";
      return half < answers.half ? "done" : "next";
    };
    const units = [
      ...first.map((id) => ({ id, half: 1, status: statusFor(id, 1) })),
      ...second.map((id) => ({ id, half: 2, status: statusFor(id, 2) })),
    ];
    if (!opts.review) ids.forEach((id) => seen.add(id));
    return { year, label: yearLabel(year), review: !!opts.review, current: yearIndex === currentIndex, units };
  });
  return { course: answers.course, track: track.id, years };
}

// Which units the plan recommends adding: this half's, plus everything
// earlier when the student asked to catch up. Each id appears once even if a
// review year repeats it.
export function recommended(plan, scope) {
  if (!plan) return [];
  const want = scope === "review" ? new Set(["now", "done"]) : new Set(["now"]);
  const out = [];
  for (const y of plan.years) for (const u of y.units) {
    if (want.has(u.status) && !out.some((o) => o.id === u.id)) out.push({ ...u, year: y.year });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Content format
// ---------------------------------------------------------------------------
//
//   # v1-familia | La familia | Familie und Verwandte
//   la madre | die Mutter
//   el padre | der Vater
//
//   # g1-presente | Präsens: regelmäßige Verben | hablar, comer, vivir
//   > Die Endung hängt an den Stamm: habl-ar → habl-o.
//   > ## -ar
//   > hablar → hablo, hablas, habla, hablamos, habláis, hablan
//   ? Yo {{c1::hablo}} español. (hablar)
//
// "#" starts a unit (id | title | subtitle), "a | b" is a vocabulary card
// (Spanish | German), "> " a line of a grammar explanation and "? " a cloze
// exercise. Blank lines and lines starting with "//" are ignored.

export function parseCourse(text) {
  const units = [];
  let unit = null;
  String(text || "").split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("//")) return;
    if (line.startsWith("# ")) {
      const [id, title, subtitle = ""] = line.slice(2).split("|").map((s) => s.trim());
      unit = { id, title, subtitle, kind: id.startsWith("g") ? "grammar" : "vocab", words: [], explain: [], exercises: [] };
      units.push(unit);
      return;
    }
    if (!unit) throw new Error(`Line ${i + 1} is outside a unit`);
    if (line.startsWith(">")) unit.explain.push(line.replace(/^>\s?/, ""));
    else if (line.startsWith("? ")) unit.exercises.push(line.slice(2).trim());
    else {
      const at = line.indexOf(" | ");
      if (at === -1) throw new Error(`Line ${i + 1} in ${unit.id} is not "front | back"`);
      unit.words.push({ front: line.slice(0, at).trim(), back: line.slice(at + 3).trim() });
    }
  });
  return units;
}

export const cardCount = (unit) =>
  unit ? unit.words.length + unit.exercises.reduce((n, e) => n + cloze.clozeNumbers(e).length, 0) : 0;

// ---------------------------------------------------------------------------
// Adding units to the library
// ---------------------------------------------------------------------------

// Every unit already in the library, by the marker its folder carries. A
// folder the user deleted is gone from the tree, so its unit can be added
// again; one they renamed still counts.
export function addedUnits(subjects, courseId) {
  const out = new Set();
  const walk = (nodes) => (nodes || []).forEach((n) => {
    if (n.course?.unit && n.course.id === courseId) out.add(n.course.unit);
    walk(n.children);
  });
  walk(subjects);
  return out;
}

export const courseSubject = (subjects, courseId) =>
  (subjects || []).find((s) => s.course?.id === courseId && !s.course.unit && !s.course.year) || null;

// Files the chosen units under  Spanisch › Klasse 7 › La familia, creating
// whatever part of that path is missing, and returns the new tree plus the
// cards to add. Pure: the caller commits both in one go, so the sync engine
// sees one tree edit and one batch of cards rather than a burst.
//
// `units` are the parsed content units; `picks` the plan entries ({id, year})
// to add; `answers` the placement, stored on the subject so the plan can be
// reopened where it was left — on every device, since the subject syncs.
export function addUnits({ subjects, course, units, picks, answers, newId }) {
  const byId = new Map(units.map((u) => [u.id, u]));
  const already = addedUnits(subjects, course.id);
  let tree = subjects || [];
  let subject = courseSubject(tree, course.id);
  if (subject) {
    const updated = { ...subject, course: { ...subject.course, answers } };
    tree = tree.map((s) => (s.id === subject.id ? updated : s));
    subject = updated;
  } else {
    subject = { id: newId(), name: course.name, children: [], speech: { ...course.speech }, course: { id: course.id, answers } };
    tree = [...tree, subject];
  }

  const cards = [];
  const added = [];
  for (const pick of picks) {
    const unit = byId.get(pick.id);
    if (!unit || already.has(unit.id)) continue;
    already.add(unit.id);

    // The school-year folder, made once per year and reused.
    let yearNode = subject.children.find((n) => n.course?.year === pick.year);
    if (!yearNode) {
      yearNode = { id: newId(), name: yearLabel(pick.year), children: [], course: { id: course.id, year: pick.year } };
      subject = { ...subject, children: sortYears(course, answers, [...subject.children, yearNode]) };
    }
    const name = unit.kind === "grammar" ? `Grammatik · ${unit.title}` : unit.title;
    const unitNode = { id: newId(), name, children: [], course: { id: course.id, unit: unit.id } };
    subject = {
      ...subject,
      children: subject.children.map((n) => (n.id === yearNode.id ? { ...n, children: [...n.children, unitNode] } : n)),
    };
    yearNode = subject.children.find((n) => n.id === yearNode.id);
    cards.push(...unitCards(unit, unitNode.id, subject.id, newId));
    added.push(unit.id);
  }
  tree = tree.map((s) => (s.id === subject.id ? subject : s));
  return { subjects: tree, cards, added, subjectId: subject.id };
}

// Year folders stay in school order whatever order they were added in.
function sortYears(course, answers, nodes) {
  const order = (trackById(answers?.track)?.years || []).map(([y]) => y);
  const rank = (n) => (order.includes(n.course?.year) ? order.indexOf(n.course.year) : 99);
  return [...nodes].sort((a, b) => rank(a) - rank(b));
}

// The cards one unit makes. Vocabulary is Spanish on the front; a grammar
// exercise is a cloze card whose answer is Spanish too, so it overrides the
// subject's German back-side voice.
export function unitCards(unit, nodeId, subjectId, newId) {
  const base = { nodeId, subjectId, manualOptions: [] };
  if (unit.kind === "vocab") {
    return unit.words.map((w) => ({ ...base, id: newId(), front: w.front, back: w.back }));
  }
  return unit.exercises.flatMap((source) =>
    cloze.expand(source).map((c) => ({
      ...base, ...c, id: newId(),
      speech: { backLang: "es-ES", backLanguageMode: "manual" },
    })));
}
