// ---------------------------------------------------------------------------
// Test mode — a graded exam, as opposed to the practice drills.
//
// The five drills are practice: they grade each answer, feed the scheduler and
// move on. A test is a different thing and has to behave differently, or it is
// just practice with a score bolted on:
//
//   - fixed set, chosen up front, so the result means something
//   - mixed question types, so you can't settle into one recognition habit
//   - no feedback until the end, because being told mid-test converts the rest
//     into a study session
//   - a score, a pass mark, and a per-question review afterwards
//
// The scheduler question is the one that matters most. A test is a measurement,
// and measuring should not silently rewrite what it measures — but a genuine
// recall failure is real evidence and throwing it away wastes it. The
// compromise: test answers are applied to the schedule *after* grading, at the
// end, and only failures count. A correct answer under exam conditions doesn't
// stretch the interval (you may have guessed from four options), a wrong one
// brings the card back (you didn't know it). See applyResults().
// ---------------------------------------------------------------------------

import { normalize } from "./cardUI";
import * as cloze from "./cloze";

export const QUESTION_TYPES = ["typed", "choice", "trueFalse"];
export const DEFAULT_PASS_MARK = 0.7;

const shuffled = (list, rand = Math.random) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const usable = (c) => c && typeof c.back === "string" && c.back.trim() && !c.backImageId;

// Distractors for a multiple-choice question: other cards' answers, preferring
// ones from the same folder because a plausible wrong answer is what makes the
// question a test rather than a giveaway.
function distractorsFor(card, pool, count, rand) {
  const answer = normalize(card.back);
  const sameNode = pool.filter((c) => c.id !== card.id && c.nodeId === card.nodeId && usable(c));
  const others = pool.filter((c) => c.id !== card.id && c.nodeId !== card.nodeId && usable(c));
  const seen = new Set([answer]);
  const out = [];
  for (const c of [...shuffled(sameNode, rand), ...shuffled(others, rand)]) {
    const n = normalize(c.back);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(c.back);
    if (out.length >= count) break;
  }
  return out;
}

// Builds the paper. Deterministic when given a seeded `rand`, which is what
// makes the tests below meaningful and lets a test be retaken identically.
export function buildTest(cards, opts = {}) {
  const rand = opts.rand || Math.random;
  const count = Math.max(1, Math.min(opts.count || 20, (cards || []).length));
  const types = opts.types?.length ? opts.types : QUESTION_TYPES;
  const pool = (cards || []).filter(usable);
  const chosen = shuffled(pool, rand).slice(0, count);

  const questions = chosen.map((card, i) => {
    // Cycle the types rather than picking at random so a 6-question test can't
    // come out as six of the same kind.
    let type = types[i % types.length];
    const options = type === "choice" ? distractorsFor(card, pool, 3, rand) : [];
    // Not enough distinct answers in the deck for a fair multiple choice —
    // fall back rather than showing two options, one of which is obviously it.
    if (type === "choice" && options.length < 2) type = "typed";

    const isCloze = !!card.clozeSource;
    const prompt = isCloze ? cloze.render(card.clozeSource, card.clozeIndex).question : card.front;

    if (type === "trueFalse") {
      // Half the true/false questions must be false, or "true" scores 100%.
      const claimTrue = rand() < 0.5;
      const wrong = claimTrue ? null : distractorsFor(card, pool, 1, rand)[0];
      if (!claimTrue && !wrong) {
        return { id: card.id, card, type: "typed", prompt, answer: card.back };
      }
      return {
        id: card.id,
        card,
        type: "trueFalse",
        prompt,
        claim: claimTrue ? card.back : wrong,
        expected: claimTrue,
      };
    }

    if (type === "choice") {
      return {
        id: card.id,
        card,
        type: "choice",
        prompt,
        options: shuffled([card.back, ...options], rand),
        answer: card.back,
      };
    }
    return { id: card.id, card, type: "typed", prompt, answer: card.back };
  });

  return {
    id: `test-${Date.now()}`,
    createdAt: opts.now || Date.now(),
    passMark: opts.passMark ?? DEFAULT_PASS_MARK,
    questions,
  };
}

// Grades one answer. Typed answers use the same normaliser the drills grade
// with, so "Mitochondria." and "mitochondria" are the same answer here too.
export function gradeAnswer(question, response) {
  if (!question) return false;
  if (question.type === "trueFalse") return response === question.expected;
  if (question.type === "choice") return normalize(response) === normalize(question.answer);
  const given = normalize(response);
  if (!given) return false;
  if (given === normalize(question.answer)) return true;
  // A cloze card with several blanks under one number is right only if every
  // blank is right — but they may be typed in any order.
  //
  // Split the raw response, not the normalised one: normalize() strips commas
  // and semicolons, so splitting afterwards finds no separators left and the
  // whole answer arrives as a single part that matches nothing.
  if (question.card?.clozeSource) {
    const expected = cloze.answersFor(question.card.clozeSource, question.card.clozeIndex).map(normalize);
    if (expected.length > 1) {
      const parts = String(response || "")
        .split(/[,;/]|\band\b|\bund\b/i)
        .map((s) => normalize(s))
        .filter(Boolean);
      return expected.length === parts.length && expected.every((e) => parts.includes(e));
    }
  }
  return false;
}

export function score(test, responses) {
  const rows = (test?.questions || []).map((q) => {
    const response = responses?.[q.id];
    const correct = gradeAnswer(q, response);
    return { question: q, response, correct };
  });
  const right = rows.filter((r) => r.correct).length;
  const total = rows.length || 1;
  const ratio = right / total;
  return {
    rows,
    correct: right,
    total: rows.length,
    ratio,
    percent: Math.round(ratio * 100),
    passed: ratio >= (test?.passMark ?? DEFAULT_PASS_MARK),
    wrong: rows.filter((r) => !r.correct).map((r) => r.question.card),
  };
}

// What the test feeds back into the schedule. Only failures — see the header.
// Returned as instructions rather than applied here, so the caller owns the
// card update and this module stays pure.
export function scheduleUpdates(result) {
  return (result?.rows || [])
    .filter((r) => !r.correct)
    .map((r) => ({ cardId: r.question.card.id, correct: false }));
}

// A one-line verdict. Bands rather than a bare percentage because "68%" does
// not tell a 17-year-old whether to restudy tonight or move on.
export function verdict(result) {
  const p = result?.percent ?? 0;
  if (p >= 90) return { band: "excellent", text: "You know this material." };
  if (p >= 70) return { band: "good", text: "Solid — worth one more pass over the misses." };
  if (p >= 50) return { band: "shaky", text: "Half there. Study the misses before testing again." };
  return { band: "weak", text: "This needs studying rather than testing." };
}
