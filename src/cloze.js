// ---------------------------------------------------------------------------
// Cloze deletions — the user chooses what gets hidden.
//
// The "gaps" drill already blanks words automatically, but it picks them, it
// picks differently each time, and the result is one card however many blanks
// there are. That is a good exercise and a poor card: for a definition or a
// formula, *which* part is hidden is the entire question, and each hidden part
// deserves its own place in the schedule.
//
// Syntax is Anki's, so material pasted from anywhere works and cards exported
// from here import there:
//
//   The {{c1::mitochondrion}} is the powerhouse of the {{c2::cell}}.
//   {{c1::Paris::capital}} is the capital of France.     ← ::hint
//
// One source text with c1 and c2 produces two cards. Card c1 hides the
// mitochondrion and shows the cell; card c2 does the reverse. Reusing the same
// number twice hides both at once, which is how you ask for a pair that only
// makes sense together.
//
// The cards are ordinary cards — they carry clozeSource and clozeIndex and are
// scheduled, graded and synced like everything else. Nothing downstream needs
// to know they came from one string.
// ---------------------------------------------------------------------------

// Nested braces are not supported (Anki's own parser doesn't either) and the
// lazy inner group keeps a malformed `{{c1::a` from eating the rest of the text.
const CLOZE_RE = /\{\{c(\d+)::(.*?)\}\}/g;
export const BLANK = "[…]";

export const hasCloze = (text) => {
  CLOZE_RE.lastIndex = 0;
  return CLOZE_RE.test(String(text || ""));
};

// Every distinct cloze number in the text, ascending. c3 without c1 or c2 is
// allowed — people renumber while editing, and refusing it would mean losing
// work mid-sentence.
export function clozeNumbers(text) {
  const out = new Set();
  const s = String(text || "");
  CLOZE_RE.lastIndex = 0;
  let m;
  while ((m = CLOZE_RE.exec(s))) out.add(Number(m[1]));
  return [...out].sort((a, b) => a - b);
}

// Splits `answer::hint` — the hint is optional and shown in place of the blank.
function splitHint(body) {
  const at = body.indexOf("::");
  if (at === -1) return { answer: body, hint: null };
  return { answer: body.slice(0, at), hint: body.slice(at + 2) || null };
}

// Renders one card's question and answer for cloze number `index`.
//
// The deletions that are NOT this card's number are rendered as their plain
// answers, not left as markup: the sentence has to read as a sentence, and
// showing the other blanks would ask two questions at once.
export function render(text, index) {
  const s = String(text || "");
  let question = "";
  let answer = "";
  let last = 0;
  CLOZE_RE.lastIndex = 0;
  let m;
  while ((m = CLOZE_RE.exec(s))) {
    const plain = s.slice(last, m.index);
    question += plain;
    answer += plain;
    const { answer: body, hint } = splitHint(m[2]);
    if (Number(m[1]) === index) {
      question += hint ? `[${hint}]` : BLANK;
      answer += body;
    } else {
      question += body;
      answer += body;
    }
    last = m.index + m[0].length;
  }
  question += s.slice(last);
  answer += s.slice(last);
  return { question, answer };
}

// The text with all markup removed — for previews, search and the card list.
export const plainText = (text) =>
  String(text || "").replace(CLOZE_RE, (_, __, body) => splitHint(body).answer);

// Just the hidden answers for one card, in order. This is what gets graded:
// a card hiding two things is right only if both are right.
export function answersFor(text, index) {
  const out = [];
  const s = String(text || "");
  CLOZE_RE.lastIndex = 0;
  let m;
  while ((m = CLOZE_RE.exec(s))) {
    if (Number(m[1]) === index) out.push(splitHint(m[2]).answer);
  }
  return out;
}

// Expands one source text into card drafts — one per cloze number.
//
// `existing` lets an edit keep the scheduling of cards that survived it: the
// card for c1 keeps its id, stability and history when the user fixes a typo
// in c2. Rebuilding all of them from scratch would silently reset a deck's
// progress on every edit, which is the failure mode that makes cloze editing
// feel unsafe in other apps.
export function expand(source, opts = {}) {
  const text = String(source || "");
  const numbers = clozeNumbers(text);
  if (!numbers.length) return [];
  const existing = opts.existing || [];
  const byIndex = new Map(existing.map((c) => [c.clozeIndex, c]));

  return numbers.map((n) => {
    const { question, answer } = render(text, n);
    const prior = byIndex.get(n);
    return {
      ...(prior || {}),
      ...(opts.base || {}),
      // Identity and schedule belong to the prior card when there is one.
      ...(prior ? { id: prior.id } : {}),
      front: question,
      back: answer,
      clozeSource: text,
      clozeIndex: n,
      clozeTotal: numbers.length,
    };
  });
}

// Cards from an earlier version of this source whose number no longer exists —
// the caller deletes these. Returned rather than deleted here so the caller can
// tombstone them through cardSync instead of dropping them on the floor.
export function orphaned(source, existing) {
  const live = new Set(clozeNumbers(source));
  return (existing || []).filter((c) => c.clozeIndex != null && !live.has(c.clozeIndex));
}

// Wraps a selection in the next free cloze number — what the "hide this" button
// in the editor calls. Returns the new text and where the cursor should land.
export function wrapSelection(text, start, end, opts = {}) {
  const s = String(text || "");
  if (start == null || end == null || start >= end) return { text: s, cursor: start ?? s.length };
  const used = clozeNumbers(s);
  // Same number as the previous deletion when asked ("hide with the last one"),
  // otherwise the next free one.
  const n = opts.sameAsLast && used.length ? used[used.length - 1] : (used.length ? Math.max(...used) : 0) + 1;
  const inner = s.slice(start, end);
  const wrapped = `{{c${n}::${inner}}}`;
  return { text: s.slice(0, start) + wrapped + s.slice(end), cursor: start + wrapped.length, number: n };
}
