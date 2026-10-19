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
//      app — a course must work offline like everything else. Each language's
//      content is its own chunk, loaded on demand.
//   2. **A syllabus**: the content module's `blocks`, the units in the order a
//      German school teaches them, after the NRW Kernlehrplan. The words are
//      our own, not a textbook's: the topics follow the curriculum, which is
//      public, while a publisher's unit lists are not ours to ship.
//   3. **Tracks**: when the student started (Klasse 5, 6, 7, 9 or a new start
//      in the EF), each mapping its school years onto those blocks. The same
//      block lands in Klasse 8 for one student and the EF for another.
//      Languages German schools rarely teach (Japanese, Korean, Chinese) have
//      one self-study track whose "years" are levels.
//
// Placement turns a few answers into a plan: which units are "now", which
// are earlier (offered as review) and which come later. Nothing here touches
// app state; addUnits() returns the tree and cards the caller then commits.
// ---------------------------------------------------------------------------

import * as cloze from "./cloze";

// The usual second- and third-language timings in NRW: Klasse 7 is the G9
// second foreign language, Klasse 6 the G8 timing some schools kept, Klasse 9
// the Wahlpflicht course and "EF" the new start in the Oberstufe, which covers
// the whole syllabus in three years. Each year lists the syllabus blocks it
// teaches; all four expect seven blocks.
const FOREIGN_LANGUAGE_TRACKS = [
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

// English starts in Klasse 5 at every secondary school (after Grundschule
// English) and runs to the Abitur: nine years, nine blocks.
const ENGLISH_TRACKS = [
  { id: "ab5", label: "Klasse 5",
    years: [["5", [0]], ["6", [1]], ["7", [2]], ["8", [3]], ["9", [4]], ["10", [5]], ["EF", [6]], ["Q1", [7]], ["Q2", [8]]] },
];

// Latin as first (Klasse 5) or second (Klasse 7) foreign language, or the new
// start in the EF. Seven blocks: four textbook years, the step into real texts,
// and two blocks of author reading (Caesar/Cicero, then Ovid/Seneca).
const LATIN_TRACKS = [
  { id: "ab5", label: "Klasse 5 (Latein I)",
    years: [["5", [0]], ["6", [1]], ["7", [2]], ["8", [3]], ["9", [4]], ["10", [5]], ["EF", [6]],
      ["Q1", [5, 6], { review: true }]] },
  { id: "ab7", label: "Klasse 7 (Latein II)",
    years: [["7", [0]], ["8", [1]], ["9", [2]], ["10", [3]], ["EF", [4]], ["Q1", [5]], ["Q2", [6]]] },
  { id: "abEF", label: "Oberstufe (neu einsetzend)",
    years: [["EF", [0, 1]], ["Q1", [2, 3, 4]], ["Q2", [5, 6]]] },
];

// Self-study: four levels, no half-years. The first level is the script.
const selfStudy = (levels) => [{
  id: "self", label: "Selbst lernen", self: true, halves: false,
  years: levels.map((label, i) => [String(i + 1), [i], { label }]),
}];

const manual = (front) => ({ frontLang: front, frontLanguageMode: "manual", backLang: "de-DE", backLanguageMode: "manual" });

// The pronunciation each side gets. Manual rather than Auto: a course knows
// its languages, and Auto guesses wrong on short words like "pan".
export const COURSES = [
  { id: "en", name: "Englisch", flag: "🇬🇧", speech: manual("en-GB"), tracks: ENGLISH_TRACKS,
    load: () => import("./courses/en.js").then((m) => m.default) },
  { id: "fr", name: "Französisch", flag: "🇫🇷", speech: manual("fr-FR"), tracks: FOREIGN_LANGUAGE_TRACKS,
    load: () => import("./courses/fr.js").then((m) => m.default) },
  { id: "es", name: "Spanisch", flag: "🇪🇸", speech: manual("es-ES"), tracks: FOREIGN_LANGUAGE_TRACKS,
    load: () => import("./courses/es.js").then((m) => m.default) },
  { id: "la", name: "Latein", flag: "🏛️", speech: manual("la"), tracks: LATIN_TRACKS,
    load: () => import("./courses/la.js").then((m) => m.default) },
  { id: "it", name: "Italienisch", flag: "🇮🇹", speech: manual("it-IT"), tracks: FOREIGN_LANGUAGE_TRACKS,
    load: () => import("./courses/it.js").then((m) => m.default) },
  { id: "ru", name: "Russisch", flag: "🇷🇺", speech: manual("ru-RU"), tracks: FOREIGN_LANGUAGE_TRACKS,
    load: () => import("./courses/ru.js").then((m) => m.default) },
  { id: "ja", name: "Japanisch", flag: "🇯🇵", speech: manual("ja-JP"),
    tracks: selfStudy(["Stufe 1 · Kana", "Stufe 2 · A1", "Stufe 3 · A1+", "Stufe 4 · A2"]),
    load: () => import("./courses/ja.js").then((m) => m.default) },
  { id: "ko", name: "Koreanisch", flag: "🇰🇷", speech: manual("ko-KR"),
    tracks: selfStudy(["Stufe 1 · Hangul", "Stufe 2 · A1", "Stufe 3 · A1+", "Stufe 4 · A2"]),
    load: () => import("./courses/ko.js").then((m) => m.default) },
  { id: "zh", name: "Chinesisch", flag: "🇨🇳", speech: manual("zh-CN"),
    tracks: selfStudy(["Stufe 1 · Pinyin", "Stufe 2 · A1", "Stufe 3 · A1+", "Stufe 4 · A2"]),
    load: () => import("./courses/zh.js").then((m) => m.default) },
];

export const courseById = (id) => COURSES.find((c) => c.id === id) || null;
export const trackFor = (answers) =>
  courseById(answers?.course)?.tracks.find((t) => t.id === answers?.track) || null;

// How a school year is named in the library and the plan.
export const yearLabel = (year) => (/^\d+$/.test(year) ? `Klasse ${year}` : year);
export function yearName(track, year) {
  const entry = track?.years.find(([y]) => y === year);
  return entry?.[2]?.label || yearLabel(year);
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

// The questions, in order. Titles and options are functions of the answers so
// far: which years you can be in depends on when you started, and a
// self-study course has levels rather than school years. A question whose
// answer is already forced is skipped (see applicable / withDefaults).
export const QUESTIONS = [
  {
    id: "course", title: () => "Which language do you want to learn?",
    options: () => COURSES.map((c) => ({ value: c.id, label: `${c.flag} ${c.name}` })),
  },
  {
    id: "track", title: () => "Since when do you learn it at school?",
    options: (a) => (courseById(a.course)?.tracks || []).map((t) => ({ value: t.id, label: t.label })),
    // Only once the language is known: before that the count of questions
    // would come out one short.
    skip: (a) => { const c = courseById(a.course); return !!c && c.tracks.length <= 1; },
  },
  {
    id: "year",
    title: (a) => (trackFor(a)?.self ? "Where do you want to start?" : "Which year are you in now?"),
    options: (a) => (trackFor(a)?.years || []).map(([y]) => ({ value: y, label: yearName(trackFor(a), y) })),
  },
  {
    id: "half", title: () => "Which half of the school year?",
    options: () => [
      { value: 1, label: "1st half (Aug–Jan)" },
      { value: 2, label: "2nd half (Feb–Jul)" },
    ],
    skip: (a) => trackFor(a)?.halves === false,
  },
  {
    id: "scope", title: () => "What should the plan include?",
    options: (a) => trackFor(a)?.self
      ? [
          { value: "now", label: "Just this level" },
          { value: "review", label: "This level, plus the ones before it" },
        ]
      : [
          { value: "now", label: "Just what we are doing now" },
          { value: "review", label: "Now, plus earlier years to catch up" },
        ],
  },
];

// Fills in what the course forces: its only track, and no half-years on a
// self-study track.
export function withDefaults(answers) {
  const a = { ...answers };
  const course = courseById(a.course);
  if (course && course.tracks.length === 1) a.track = course.tracks[0].id;
  if (trackFor(a)?.halves === false) a.half = 1;
  return a;
}

export const applicable = (answers) => QUESTIONS.filter((q) => !q.skip?.(answers));

// The half of the year a date falls in, for preselecting the question: the
// second half starts on 1 February, the new school year in August.
export const halfForDate = (date = new Date()) => {
  const m = date.getMonth();
  return m >= 1 && m <= 6 ? 2 : 1;
};

export const isComplete = (a) => {
  const track = trackFor(a);
  return !!(track && track.years.some(([y]) => y === a.year)
    && (a.half === 1 || a.half === 2) && (a.scope === "now" || a.scope === "review"));
};

// Splits a year's units into its two halves, vocabulary and grammar each
// split separately so both halves get some of both. A track without halves
// keeps everything in the first.
function halves(ids, split) {
  if (!split) return [ids, []];
  const vocab = ids.filter((id) => id.startsWith("v"));
  const grammar = ids.filter((id) => id.startsWith("g"));
  const cut = (list) => [list.slice(0, Math.ceil(list.length / 2)), list.slice(Math.ceil(list.length / 2))];
  const [v1, v2] = cut(vocab);
  const [g1, g2] = cut(grammar);
  return [[...v1, ...g1], [...v2, ...g2]];
}

// The whole plan for a set of answers: every school year of the track, each
// unit tagged with where it stands relative to "now". `blocks` comes from the
// course's content module.
//
//   status: "done"  — taught before now (offered as review)
//           "now"   — this half of this year
//           "next"  — the other half of this year, or a later year
//
// A review-only year (Q2 on the Klasse 6 track) never has "now" units of its
// own; its blocks were already met, so they count as review from the start.
export function buildPlan(answers, blocks) {
  const track = trackFor(answers);
  if (!track || !blocks) return null;
  const currentIndex = track.years.findIndex(([y]) => y === answers.year);
  const seen = new Set();
  const years = track.years.map(([year, blockIds, opts = {}], yearIndex) => {
    const ids = blockIds.flatMap((b) => blocks[b] || []).filter((id) => opts.review || !seen.has(id));
    const [first, second] = halves(ids, track.halves !== false);
    const statusFor = (half) => {
      if (opts.review) return yearIndex <= currentIndex ? "done" : "next";
      if (yearIndex < currentIndex) return "done";
      if (yearIndex > currentIndex) return "next";
      if (half === answers.half) return "now";
      return half < answers.half ? "done" : "next";
    };
    const units = [
      ...first.map((id) => ({ id, half: 1, status: statusFor(1) })),
      ...second.map((id) => ({ id, half: 2, status: statusFor(2) })),
    ];
    if (!opts.review) ids.forEach((id) => seen.add(id));
    return {
      year, label: yearName(track, year), review: !!opts.review,
      current: yearIndex === currentIndex, units,
    };
  });
  return { course: answers.course, track: track.id, halves: track.halves !== false, years };
}

// Which units the plan recommends adding: this half's, plus everything
// earlier when the student asked to catch up. Each id appears once even if a
// review year repeats it.
export function recommended(plan, scope) {
  if (!plan) return [];
  const want = scope === "review" ? new Set(["now", "done"]) : new Set(["now"]);
  const out = [];
  for (const y of plan.years) for (const u of y.units) {
    if (want.has(u.status) && !out.some((o) => o.id === u.id)) out.push({ ...u, year: y.year, label: y.label });
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
// (target language | German), "> " a line of a grammar explanation and "? " a
// cloze exercise. Blank lines and lines starting with "//" are ignored.

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

// The placement saved for each course the library already holds.
export function savedAnswers(subjects) {
  const out = {};
  for (const c of COURSES) {
    const a = courseSubject(subjects, c.id)?.course?.answers;
    if (isComplete(a)) out[c.id] = a;
  }
  return out;
}

// Files the chosen units under  Spanisch › Klasse 7 › La familia, creating
// whatever part of that path is missing, and returns the new tree plus the
// cards to add. Pure: the caller commits both in one go, so the sync engine
// sees one tree edit and one batch of cards rather than a burst.
//
// `units` are the parsed content units; `picks` the plan entries ({id, year,
// label}) to add; `answers` the placement, stored on the subject so the plan
// can be reopened where it was left — on every device, since the subject syncs.
export function addUnits({ subjects, course, units, picks, answers, newId }) {
  const byId = new Map(units.map((u) => [u.id, u]));
  const already = addedUnits(subjects, course.id);
  const track = trackFor(answers);
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
      yearNode = { id: newId(), name: pick.label || yearName(track, pick.year), children: [], course: { id: course.id, year: pick.year } };
      subject = { ...subject, children: sortYears(track, [...subject.children, yearNode]) };
    }
    const name = unit.kind === "grammar" ? `Grammatik · ${unit.title}` : unit.title;
    const unitNode = { id: newId(), name, children: [], course: { id: course.id, unit: unit.id } };
    subject = {
      ...subject,
      children: subject.children.map((n) => (n.id === yearNode.id ? { ...n, children: [...n.children, unitNode] } : n)),
    };
    cards.push(...unitCards(unit, unitNode.id, subject.id, newId, course));
    added.push(unit.id);
  }
  tree = tree.map((s) => (s.id === subject.id ? subject : s));
  return { subjects: tree, cards, added, subjectId: subject.id };
}

// Year folders stay in school order whatever order they were added in.
function sortYears(track, nodes) {
  const order = (track?.years || []).map(([y]) => y);
  const rank = (n) => (order.includes(n.course?.year) ? order.indexOf(n.course.year) : 99);
  return [...nodes].sort((a, b) => rank(a) - rank(b));
}

// The cards one unit makes. Vocabulary has the target language on the front;
// a grammar exercise is a cloze card whose answer is in the target language
// too, so it overrides the subject's German back-side voice.
export function unitCards(unit, nodeId, subjectId, newId, course) {
  const base = { nodeId, subjectId, manualOptions: [] };
  if (unit.kind === "vocab") {
    return unit.words.map((w) => ({ ...base, id: newId(), front: w.front, back: w.back }));
  }
  const lang = course?.speech?.frontLang || "es-ES";
  return unit.exercises.flatMap((source) =>
    cloze.expand(source).map((c) => ({
      ...base, ...c, id: newId(),
      speech: { backLang: lang, backLanguageMode: "manual" },
    })));
}
