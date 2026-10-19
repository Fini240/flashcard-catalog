// The language-course screens: placement questions, the year-by-year plan,
// and the grammar explanation shown above a grammar folder's cards. Logic
// lives in courses.js; this file only draws it.
import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, BookOpen, Languages } from "lucide-react";
import { t } from "./i18n";
import { PrimaryButton, GhostButton } from "./cardUI";
import { Sheet } from "./featureUI";
import * as C from "./courses";
import { report } from "./report";

const caption = { fontSize: 12, color: "var(--on-shell-muted)", marginTop: 2 };

// Content is loaded on demand and kept for the session: opening the plan
// twice should not parse a thousand cards twice. Resolves to { units, blocks }.
const loaded = new Map();
export function useCourseContent(courseId) {
  const [content, setContent] = useState(() => loaded.get(courseId) || null);
  useEffect(() => {
    setContent(loaded.get(courseId) || null);
    if (!courseId || loaded.has(courseId)) return;
    let live = true;
    C.courseById(courseId)?.load().then((c) => {
      loaded.set(courseId, c);
      if (live) setContent(c);
    }, (e) => report("courses.load", e));
    return () => { live = false; };
  }, [courseId]);
  return content;
}

// `initialCourse` opens straight on that course's plan (the "Course plan"
// button inside a course folder); without it the sheet starts at the language
// question, where a language already in the library jumps to its saved plan.
export function CourseSheet({ subjects, initialCourse, onAdd, onClose }) {
  // The answers ride on the course subject, so a plan reopens as it was left
  // on every signed-in device.
  const saved = useMemo(() => C.savedAnswers(subjects), [subjects]);
  const [answers, setAnswers] = useState(() =>
    (initialCourse && saved[initialCourse]) || { course: initialCourse, half: C.halfForDate() });
  const [step, setStep] = useState(() => (initialCourse && saved[initialCourse] ? Infinity : 0));
  const questions = C.applicable(answers);
  const done = step >= questions.length;
  // A subject's topic question needs its content; start loading as soon as
  // the course is known so it is usually there by the time it's asked.
  const content = useCourseContent(answers.course);

  const pick = (value) => {
    const q = questions[step];
    if (q.id === "course" && saved[value]) {
      setAnswers(saved[value]);
      setStep(Infinity);
      return;
    }
    let next = { ...answers, [q.id]: value };
    if (q.id === "course") next = { course: value, half: answers.half || C.halfForDate() };
    // A different start changes which years exist; drop a year the new
    // track doesn't have rather than carry it along.
    if (q.id === "track" && !C.trackFor(next)?.years.some(([y]) => y === next.year)) delete next.year;
    next = C.withDefaults(next);
    setAnswers(next);
    // The skip rules depend on the answer just given, so find the next step
    // in the new list, not the old one.
    const list = C.applicable(next);
    setStep(list.findIndex((x) => x.id === q.id) + 1);
  };

  return (
    <Sheet title="Courses" onClose={onClose}>
      {/* Sheet sets no face of its own, and the shell's default is a serif. */}
      <div style={{ fontFamily: "Inter, sans-serif" }}>
      {done
        ? <CoursePlan answers={answers} subjects={subjects} onAdd={onAdd}
            onChange={() => setStep(C.applicable(answers).length > 1 ? 1 : 0)}
            onLanguages={() => setStep(0)} />
        : <Question
            question={questions[step]}
            index={step}
            count={questions.length}
            answers={answers}
            content={content}
            saved={saved}
            onBack={step > 0 ? () => setStep(step - 1) : null}
            onPick={pick}
          />}
      </div>
    </Sheet>
  );
}

function Question({ question: q, index, count, answers, content, saved, onPick, onBack }) {
  if (q.needsContent && !content) return <div style={caption}>{t("Loading the course…")}</div>;
  const options = q.options(answers, content);
  return (
    <div>
      <div style={{ ...caption, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>
        {t("Question {0} of {1}", [index + 1, count])}
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, color: "var(--on-shell-strong)", margin: "6px 0 14px" }}>{t(q.title(answers))}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((o, i) => {
          const chosen = answers[q.id] === o.value;
          const mine = q.id === "course" && saved[o.value];
          const heading = o.group && o.group !== options[i - 1]?.group;
          return (
            <React.Fragment key={String(o.value)}>
            {heading && (
              <div style={{ ...caption, marginTop: i ? 10 : 0, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>
                {t(o.group)}
              </div>
            )}
            <button onClick={() => onPick(o.value)} style={{
              textAlign: "left", padding: "14px 16px", minHeight: 52, borderRadius: 12, cursor: "pointer",
              background: chosen ? "var(--accent)" : "var(--shell-raised)",
              color: chosen ? "#fff" : "var(--on-shell-strong)",
              border: "1px solid " + (chosen ? "var(--accent)" : "transparent"),
              fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}>
              <span style={{ flex: 1 }}>{t(o.label)}</span>
              {mine && <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{t("Your plan")}</span>}
              {chosen ? <Check size={18} /> : <ChevronRight size={18} color="var(--on-shell-muted)" />}
            </button>
            </React.Fragment>
          );
        })}
      </div>
      {q.id === "track" && (
        <div style={{ ...caption, marginTop: 12, lineHeight: 1.5 }}>
          {t("The plan follows the NRW curriculum. The words are our own, so they won't match your textbook word for word, but they cover the same topics in the same year.")}
        </div>
      )}
      {q.id === "topic" && (
        <div style={{ ...caption, marginTop: 12, lineHeight: 1.5 }}>
          {t("The topics follow the NRW curriculum for this stage. Each school picks its own order, so choose the one your class is on now.")}
        </div>
      )}
      {onBack && <GhostButton onClick={onBack} style={{ marginTop: 14 }}>{t("Previous question")}</GhostButton>}
    </div>
  );
}

const STATUS = {
  now: { label: "This half", color: "var(--accent)" },
  phase: { label: "This stage", color: "#8A7FB0" },
  done: { label: "To review", color: "#6E8B5E" },
  next: { label: "Later", color: "var(--on-shell-muted)" },
};

function CoursePlan(props) {
  const content = useCourseContent(props.answers.course);
  if (!content) return <div style={caption}>{t("Loading the course…")}</div>;
  return <PlanBody {...props} content={content} />;
}

function PlanBody({ answers, subjects, onAdd, onChange, onLanguages, content }) {
  const course = C.courseById(answers.course);
  const track = C.trackFor(answers);
  const plan = useMemo(() => C.buildPlan(answers, content.blocks, content), [answers, content]);
  const added = useMemo(() => C.addedUnits(subjects, answers.course), [subjects, answers.course]);
  const byId = useMemo(() => new Map(content.units.map((u) => [u.id, u])), [content]);
  const [open, setOpen] = useState(() => new Set(plan.years.filter((y) => y.current).map((y) => y.year)));
  const [preview, setPreview] = useState(null);

  const recommended = C.recommended(plan, answers.scope).filter((u) => !added.has(u.id));
  const cards = recommended.reduce((n, u) => n + C.cardCount(byId.get(u.id)), 0);
  const add = (picks) => onAdd({ course, units: content.units, picks, answers });
  const topicName = answers.topic === "*" ? t("whole stage") : byId.get(answers.topic)?.title;
  const where = track.subject
    ? t("Now {0}{1} · {2}", [C.yearLabel(answers.year), answers.level ? ` (${answers.level})` : "", topicName || ""])
    : track.self
    ? t("Self-study · {0}", [C.yearName(track, answers.year)])
    : t("Since {0} · now {1}, {2}. half", [t(track.label), C.yearName(track, answers.year), answers.half]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>{course.flag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "var(--on-shell-strong)" }}>{course.name}</div>
          <div style={caption}>{where}</div>
        </div>
        <GhostButton onClick={onChange}>{t("Change")}</GhostButton>
      </div>

      <PrimaryButton onClick={() => add(recommended)} disabled={!recommended.length} style={{ width: "100%", marginTop: 14 }}>
        {recommended.length
          ? t("Add what I need now ({0} topics, {1} cards)", [recommended.length, cards])
          : t("Everything for now is in your library")}
      </PrimaryButton>
      <div style={{ ...caption, marginTop: 6 }}>
        {track.subject
          ? (answers.scope === "review"
            ? t("Your topic, plus everything from earlier years as review. Other topics of this stage are below.")
            : t("Just your topic. The other topics of this stage, and earlier ones, are below."))
          : track.self
          ? (answers.scope === "review" ? t("This level, plus the ones before it.") : t("Just this level. Earlier levels are below if you want them."))
          : (answers.scope === "review"
            ? t("This half of the year, plus everything from before it as review.")
            : t("Just this half of the year. Add earlier topics below whenever you want to catch up."))}
      </div>

      {plan.years.map((y) => {
        const isOpen = open.has(y.year);
        const toggle = () => setOpen((s) => { const n = new Set(s); n.has(y.year) ? n.delete(y.year) : n.add(y.year); return n; });
        const missing = y.units.filter((u) => !added.has(u.id));
        return (
          <div key={y.year} style={{ marginTop: 16 }}>
            <button onClick={toggle} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none",
              padding: "8px 0", minHeight: 44, cursor: "pointer", color: "var(--on-shell-strong)",
            }}>
              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span style={{ fontSize: 15, fontWeight: 600, flex: 1, textAlign: "left" }}>
                {y.label}{y.review ? ` · ${t("Abitur review")}` : ""}
              </span>
              {y.current && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>{t("YOU ARE HERE")}</span>}
              <span style={caption}>{t("{0}/{1} added", [y.units.length - missing.length, y.units.length])}</span>
            </button>
            {isOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {y.units.map((u) => {
                  const unit = byId.get(u.id);
                  if (!unit) return null;
                  return (
                    <UnitRow key={u.id} unit={unit} status={u.status} half={plan.halves ? u.half : null} self={track.self} lk={u.lk}
                      added={added.has(u.id)}
                      open={preview === u.id} onToggle={() => setPreview(preview === u.id ? null : u.id)}
                      onAdd={() => add([{ ...u, year: y.year, label: y.label }])} />
                  );
                })}
                {missing.length > 1 && (
                  <GhostButton onClick={() => add(missing.map((u) => ({ ...u, year: y.year, label: y.label })))}>
                    {t("Add all of {0}", [y.label])}
                  </GhostButton>
                )}
              </div>
            )}
          </div>
        );
      })}

      <GhostButton onClick={onLanguages} style={{ marginTop: 18, width: "100%" }}>{t("Another language")}</GhostButton>
    </div>
  );
}

function UnitRow({ unit, status, half, self, lk, added, open, onToggle, onAdd }) {
  const s = status === "now" && self ? { ...STATUS.now, label: "This level" } : STATUS[status];
  const grammar = unit.kind === "grammar";
  // A topic previews like grammar: its key facts are what tells you whether
  // it's the topic your class is on.
  const explained = grammar || unit.kind === "topic";
  return (
    <div style={{ background: "var(--card-bg)", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onToggle} style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {explained ? <BookOpen size={14} color="var(--text-muted)" /> : <Languages size={14} color="var(--text-muted)" />}
            <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)" }}>{unit.title}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {lk && <span style={{ fontWeight: 700, color: "#8A7FB0" }}>LK · </span>}
            {unit.kind === "topic" ? t("Topic") : grammar ? t("Grammar") : t("Vocabulary")} · {t("{0} cards", [C.cardCount(unit)])}{half ? ` · ${t("{0}. half", [half])}` : ""}
            {" · "}<span style={{ color: s.color, fontWeight: 600 }}>{t(s.label)}</span>
          </div>
        </button>
        {added
          ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--success)" }}><Check size={15} />{t("Added")}</span>
          : <GhostButton onClick={onAdd} style={{ color: "var(--text-strong)" }}>{t("Add")}</GhostButton>}
      </div>
      {open && (
        <div style={{ marginTop: 8, borderTop: "1px solid var(--card-border)", paddingTop: 8 }}>
          {unit.subtitle && <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 6 }}>{unit.subtitle}</div>}
          {explained
            ? <Explanation lines={unit.explain} formulas={unit.kind === "topic"} />
            : unit.words.slice(0, 8).map((w, i) => (
                <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>
                  <span style={{ color: "var(--text-strong)", fontWeight: 500 }}>{w.front}</span> – {w.back}
                </div>
              ))}
          {!explained && unit.words.length > 8 && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{t("… and {0} more", [unit.words.length - 8])}</div>
          )}
        </div>
      )}
    </div>
  );
}

// **bold** is the only inline markup the content uses.
function Inline({ text }) {
  return String(text).split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ color: "var(--text-strong)" }}>{part.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>);
}

// The explanation format: "## " a heading, "- " a bullet, anything else a
// paragraph. Forms (a run with "·" or "→") are set in the monospace face so
// the endings line up as a reader scans them — only the forms: in
// "**tener**: tengo · tienes …" or "Die Person steht davor: me · te …" the
// part before the colon stays prose.
//
// A topic's key facts are prose that often uses "·" as a separator, so there
// (`formulas`) only a short run with "=" or "→" — "U = R · I" — counts.
export function Explanation({ lines, formulas }) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return <div key={i} style={{ fontWeight: 700, color: "var(--text-strong)", marginTop: i ? 10 : 0 }}>{line.slice(3)}</div>;
        }
        if (line.startsWith("- ")) {
          return <div key={i} style={{ paddingLeft: 14, textIndent: -10, marginTop: 2 }}>• <Inline text={line.slice(2)} /></div>;
        }
        const at = line.indexOf(": ");
        const lead = at === -1 ? "" : line.slice(0, at + 1);
        const forms = at === -1 ? line : line.slice(at + 2);
        const isForms = formulas ? /[=→]/.test(forms) && forms.length <= 48 : /[·→]/.test(line);
        if (!isForms) return <div key={i} style={{ marginTop: 4 }}><Inline text={line} /></div>;
        return (
          <div key={i} style={{ marginTop: 4 }}>
            {lead && <><Inline text={lead} /> </>}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: "var(--text-strong)" }}><Inline text={forms} /></span>
          </div>
        );
      })}
    </div>
  );
}

// Above a grammar folder's cards: the rule, folded away once read. Folded
// state is not saved; it is a reading aid, not a setting.
export function GrammarNote({ courseId, unitId }) {
  const content = useCourseContent(courseId);
  const unit = content?.units.find((u) => u.id === unitId);
  const [open, setOpen] = useState(true);
  if (!unit || !(unit.kind === "grammar" || unit.kind === "topic") || !unit.explain.length) return null;
  return (
    <div style={{ background: "var(--card-bg)", borderRadius: 10, padding: "12px 14px", marginBottom: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.25)", fontFamily: "Inter, sans-serif" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none",
        padding: 0, minHeight: 32, cursor: "pointer", textAlign: "left",
      }}>
        <BookOpen size={16} color="var(--accent)" />
        <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)" }}>{unit.kind === "topic" ? t("Key facts") : t("The rule")}</span>
        {open ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
      </button>
      {open && <div style={{ marginTop: 8 }}><Explanation lines={unit.explain} formulas={unit.kind === "topic"} /></div>}
    </div>
  );
}
