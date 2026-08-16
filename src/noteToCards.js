// ---------------------------------------------------------------------------
// Notes → cards. RemNote's `::` idea: write notes normally, and any line that
// contains a separator is also a card.
//
// The point is that nobody sits down to "make flashcards". They take notes,
// and the cards are a by-product. A notes pane that quietly yields cards gets
// used; a card editor that demands front and back fields gets used twice.
//
// Recognised on a line:
//
//   term :: definition           an ordinary card
//   term ::: definition          a two-way card (also asks definition → term)
//   - term — definition          bullet + em dash, which is how people already
//   * term - definition          write vocabulary lists
//   Q: ...  /  A: ...            a question and answer on consecutive lines
//   any line containing {{c1::}}  a cloze card (see cloze.js)
//
// Indentation is kept as hierarchy: a `::` line indented under a heading is
// filed under that heading's subcategory. That is what makes this better than
// pasting into the bulk importer, which flattens everything.
// ---------------------------------------------------------------------------

import * as cloze from "./cloze";
import * as tags from "./tags";

const TWO_WAY = ":::";
const ONE_WAY = "::";

// Dash forms only count with spaces around the dash: "e-mail — electronic mail"
// must split on the em dash and not on the hyphen inside the word.
const DASH_RE = /^\s*(?:[-*•]\s+)?(.+?)\s+[—–]\s+(.+?)\s*$/;
const HYPHEN_RE = /^\s*(?:[-*•]\s+)?(.+?)\s+-\s+(.+?)\s*$/;
const Q_RE = /^\s*(?:Q|Question)\s*[:.]\s*(.+?)\s*$/i;
const A_RE = /^\s*(?:A|Answer)\s*[:.]\s*(.+?)\s*$/i;
const HEADING_RE = /^\s*(#{1,6})\s+(.+?)\s*$/;
const INLINE_TAG_RE = /(?:^|\s)#([a-z0-9][a-z0-9\-_/]*)/gi;

const indentOf = (line) => {
  const m = line.match(/^[ \t]*/);
  // A tab is worth four spaces here only so mixed indentation still nests in
  // the order the writer saw on screen.
  return m ? m[0].replace(/\t/g, "    ").length : 0;
};

// Pulls #tags out of a piece of text and returns it without them, so a tag
// written mid-line doesn't end up inside the answer.
function extractTags(text) {
  const found = [];
  INLINE_TAG_RE.lastIndex = 0;
  const stripped = String(text || "").replace(INLINE_TAG_RE, (whole, tag) => {
    found.push(tag);
    return whole.startsWith(" ") ? " " : "";
  });
  return { text: stripped.trim(), tags: tags.parseTags(found) };
}

// Parses a whole note into card drafts plus the heading structure they sit
// under. Returns drafts, not cards: the caller decides node ids and card ids.
export function parse(note, opts = {}) {
  const lines = String(note || "").split(/\r?\n/);
  const drafts = [];
  const headings = [];
  // Heading levels ("## Optics") and indentation both nest, and a document
  // usually uses one or the other. Tracking them in one stack means either
  // works and a document that mixes them still nests sensibly.
  let stack = [];
  let pendingQuestion = null;

  const pathNow = () => stack.map((s) => s.title);

  const push = (front, back, extra = {}) => {
    const f = extractTags(front);
    const b = extractTags(back);
    if (!f.text && !extra.clozeSource) return;
    drafts.push({
      front: f.text,
      back: b.text,
      path: pathNow(),
      tags: tags.parseTags([...f.tags, ...b.tags, ...(opts.tags || [])]),
      ...extra,
    });
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      // A blank line ends a dangling "Q:" — otherwise a question with no answer
      // would silently swallow the next unrelated line.
      pendingQuestion = null;
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      const level = heading[1].length;
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      const title = extractTags(heading[2]).text;
      stack.push({ level, title, indent: indentOf(raw) });
      headings.push({ level, title, path: pathNow() });
      pendingQuestion = null;
      continue;
    }

    // Indentation only pops heading frames that were themselves introduced by
    // indentation, never a "## Heading" frame — otherwise an unindented line
    // after a heading would leave the heading.
    const indent = indentOf(raw);
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top.level === 0 && indent <= top.indent) stack.pop();
      else break;
    }

    if (cloze.hasCloze(line)) {
      const { text, tags: t } = extractTags(line.trim());
      drafts.push({
        front: cloze.plainText(text),
        back: "",
        clozeSource: text,
        path: pathNow(),
        tags: tags.parseTags([...t, ...(opts.tags || [])]),
      });
      pendingQuestion = null;
      continue;
    }

    const answer = line.match(A_RE);
    if (answer && pendingQuestion) {
      push(pendingQuestion, answer[1]);
      pendingQuestion = null;
      continue;
    }
    const question = line.match(Q_RE);
    if (question) {
      pendingQuestion = question[1];
      continue;
    }

    // ::: before :: — the longer separator has to win, or a two-way card parses
    // as a one-way card whose answer starts with a colon.
    const twoWay = line.indexOf(TWO_WAY);
    if (twoWay > 0) {
      push(line.slice(0, twoWay), line.slice(twoWay + TWO_WAY.length), { reversible: true });
      continue;
    }
    const oneWay = line.indexOf(ONE_WAY);
    if (oneWay > 0) {
      push(line.slice(0, oneWay), line.slice(oneWay + ONE_WAY.length));
      continue;
    }

    const dash = line.match(DASH_RE) || line.match(HYPHEN_RE);
    if (dash && opts.dashes !== false) {
      push(dash[1], dash[2]);
      continue;
    }
    // Anything else is prose, and prose is not a card.
  }

  return { drafts: drafts.filter((d) => d.back || d.clozeSource), headings };
}

// Expands the drafts into final cards, including both directions of a `:::`
// line and one card per cloze number.
export function toCards(note, opts = {}) {
  const { drafts, headings } = parse(note, opts);
  const out = [];
  for (const d of drafts) {
    if (d.clozeSource) {
      for (const c of cloze.expand(d.clozeSource, { base: { path: d.path, tags: d.tags } })) {
        out.push(c);
      }
      continue;
    }
    out.push({ front: d.front, back: d.back, path: d.path, tags: d.tags });
    if (d.reversible) out.push({ front: d.back, back: d.front, path: d.path, tags: d.tags, reversed: true });
  }
  return { cards: out, headings };
}

// A count for the live preview under the notes box, without building the cards.
export const countCards = (note, opts) => toCards(note, opts).cards.length;
