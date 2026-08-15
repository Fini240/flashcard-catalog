// ---------------------------------------------------------------------------
// Drills — the ways a deck can be studied.
//
// A card used to carry a fixed answer format, chosen at import time, and the
// session just rendered whatever each card said. That put the decision in the
// wrong place: the format that suits a card depends on what you're trying to
// do right now, not on what you happened to pick the day you imported it. So a
// card is now just a front and a back, and the *drill* — picked when you sit
// down to study — decides how it gets asked.
//
// Everything here is deterministic and offline. aiDrills.js layers better
// content on top when a key is set, but every drill has to be playable without
// one, so nothing in the study flow can depend on a network call.
// ---------------------------------------------------------------------------

export const EXERCISES = {
  FLIP: "flip",
  MCQ: "mcq",
  WRITE: "write",
  CLOZE: "cloze",
  TRUEFALSE: "truefalse",
  MATCH: "match",
};

// How many cards one match round pairs up at a time.
export const MATCH_GROUP = 5;

// Rough seconds per exercise, for the "about 3 min" line on each drill. Based
// on nothing more scientific than how long these take to answer.
const SECONDS = {
  [EXERCISES.FLIP]: 7,
  [EXERCISES.MCQ]: 6,
  [EXERCISES.TRUEFALSE]: 4,
  [EXERCISES.CLOZE]: 12,
  [EXERCISES.WRITE]: 15,
  [EXERCISES.MATCH]: 30, // per group of MATCH_GROUP
};

export const DRILLS = [
  {
    id: "speed",
    label: "Speed round",
    icon: "zap",
    blurb: "Tap the right answer, fast",
    types: [EXERCISES.MCQ, EXERCISES.TRUEFALSE],
    minCards: 4,
  },
  {
    id: "gaps",
    label: "Fill the gaps",
    icon: "pencil",
    blurb: "Type the word that's missing",
    types: [EXERCISES.CLOZE],
    minCards: 1,
    needsText: true,
  },
  {
    id: "pairs",
    label: "Match the pairs",
    icon: "shuffle",
    blurb: "Pair each term with its meaning",
    types: [EXERCISES.MATCH],
    minCards: MATCH_GROUP,
    needsText: true,
  },
  {
    id: "weak",
    label: "Weak spots",
    icon: "flag",
    blurb: "Your shakiest cards, every which way",
    types: [EXERCISES.MCQ, EXERCISES.CLOZE, EXERCISES.WRITE, EXERCISES.FLIP],
    minCards: 4,
    select: "weak",
  },
  {
    id: "classic",
    label: "Classic flip",
    icon: "layers",
    blurb: "Front, then back, at your own pace",
    types: [EXERCISES.FLIP],
    minCards: 1,
  },
];

export function drillById(id) {
  return DRILLS.find((d) => d.id === id) || DRILLS[DRILLS.length - 1];
}

const hasText = (c) => !!(c && typeof c.back === "string" && c.back.trim() && !c.backImageId);

// The single definition of "these two answers are the same string", used both
// when filtering distractors here and when grading the pick in the UI. It used
// to be two: this side trimmed and lowercased, the grading side (cardUI's
// `normalize`) also stripped punctuation. A distractor differing from the
// answer only in a full stop therefore survived the filter and was then graded
// as correct — "Mitochondria" offered against a back of "Mitochondria.", both
// buttons turning green. cardUI re-exports this, so there is one rule and the
// two sides cannot drift apart again. This module stays import-free, which is
// why the definition lives here rather than in the .jsx.
export const normalizeAnswer = (s) =>
  String(s || "").trim().toLowerCase().replace(/[.,!?;:'"]/g, "").replace(/\s+/g, " ");

const normalizeish = normalizeAnswer;

// A drill is offered only if the deck can actually sustain it: multiple choice
// needs wrong answers to draw from, matching needs a full group, and anything
// that reads the answer as words is meaningless for picture cards.
export function availableDrills(cards, pool) {
  const usable = cards || [];
  // Relevance is judged against everything the user has, not just this
  // sitting — a neighbour that makes a good wrong answer counts whether or
  // not it happens to be in tonight's slice.
  const candidatePool = pool && pool.length ? pool : usable;
  return DRILLS.filter((d) => {
    if (usable.length < d.minCards) return false;
    if (d.id === "pairs") return usable.filter(hasText).length >= MATCH_GROUP;
    // Flipping asks nothing of a card, so a drill made only of it always
    // works. For the rest, count the cards that can actually carry one of the
    // drill's formats — otherwise a deck of picture answers would be offered
    // a "speed round" that quietly degrades to flipping, which is the classic
    // drill wearing a different name.
    const meaty = d.types.filter((t) => t !== EXERCISES.FLIP);
    if (!meaty.length) return true;
    const playable = usable.filter((c) => meaty.some((t) => supports(t, c, candidatePool)));
    return playable.length >= d.minCards;
  });
}

export function estimateSeconds(drill, cardCount) {
  if (drill.types.includes(EXERCISES.MATCH)) {
    return Math.ceil(cardCount / MATCH_GROUP) * SECONDS[EXERCISES.MATCH];
  }
  const avg = drill.types.reduce((sum, t) => sum + (SECONDS[t] || 8), 0) / drill.types.length;
  return Math.round(cardCount * avg);
}

export function formatDuration(seconds) {
  if (seconds < 60) return "under a min";
  return `${Math.round(seconds / 60)} min`;
}

// ---------- picking which cards ----------

// Weakest first, read from the only history a card actually keeps: its Leitner
// box, and the highest box it has ever held (srs.js). A low box means it keeps
// needing review; a box below its own peak means it was strong and slipped,
// which is the sharper signal of the two. A card that has never been answered
// sits in the middle — unknown, not weak.
//
// This previously read card.box, card.correctCount and card.wrongCount, none
// of which exist. Every card scored the same, so "weak spots" was an arbitrary
// order wearing a useful name.
function weakness(card) {
  const box = typeof card.srsBox === "number" ? card.srsBox : null;
  if (box === null) return 0.5;
  const capped = Math.min(Math.max(box, 0), 5);
  const peak = Math.min(Math.max(card.srsPeak || capped, capped), 5);
  const strength = capped / 5;
  const lapsed = (peak - capped) / 5;
  return Math.min(1, (1 - strength) * 0.75 + lapsed * 0.25);
}

export function selectCards(drill, cards, limit) {
  const pool = drill.needsText ? cards.filter(hasText) : [...cards];
  const ordered = drill.select === "weak"
    ? [...pool].sort((a, b) => weakness(b) - weakness(a))
    : shuffled(pool);
  return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- offline exercise content ----------

// Words too common to be worth blanking out — removing "the" teaches nothing.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "was", "were", "it", "its",
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines",
  "und", "oder", "von", "zu", "im", "in", "ist", "sind", "war", "waren", "sich", "als", "auf",
  "für", "mit", "bei", "dass", "daß", "man", "wird", "werden", "durch", "aus", "nicht",
]);

// Blank out the most contentful word in the answer: the longest one that isn't
// furniture. Crude next to what a model picks, but it never fails and it never
// waits on the network.
export function localCloze(card) {
  const back = (card.back || "").trim();
  if (!back) return null;
  const words = back.split(/\s+/);
  let bestIndex = -1;
  let bestLen = 0;
  words.forEach((w, i) => {
    const bare = w.replace(/[^\p{L}\p{N}-]/gu, "");
    if (!bare || STOPWORDS.has(bare.toLowerCase())) return;
    if (bare.length > bestLen) { bestLen = bare.length; bestIndex = i; }
  });
  if (bestIndex === -1) return null;
  const answer = words[bestIndex].replace(/[^\p{L}\p{N}-]/gu, "");
  const text = words.map((w, i) => (i === bestIndex ? w.replace(answer, "____") : w)).join(" ");
  // A single-word answer would blank the whole thing away, leaving no sentence
  // to reason from — that is just the write-answer exercise with extra steps.
  return { text, answer, prompt: card.front, whole: words.length === 1 };
}

// A wrong answer is only worth offering if it could be mistaken for the right
// one. "Die Patatas bravas" against a question about muscle fibres isn't a
// distractor — it's a giveaway, and it makes the question answerable without
// knowing anything. So candidates come from the same subcategory first, then
// the same subject, and never from another subject at all.
function tierOf(card, other) {
  if (card.nodeId && other.nodeId && card.nodeId === other.nodeId) return 0;
  if (card.subjectId && other.subjectId) return card.subjectId === other.subjectId ? 1 : 2;
  if (card.nodeId && other.nodeId) return 2;
  // Cards old enough to predate the subject/category fields can't be shown to
  // be unrelated, and dropping them would leave those decks with no wrong
  // answers at all. Unknown is treated as near, not far.
  return 1;
}

function relevantCandidates(card, pool) {
  return pool
    .filter((c) => c.id !== card.id && hasText(c) && normalizeish(c.back) !== normalizeish(card.back))
    .map((c) => ({ text: c.back.trim(), tier: tierOf(card, c) }))
    .filter((c) => c.tier < 2);
}

// Among equally relevant answers, the ones shaped like the real one are the
// ones worth second-guessing: same sort of length, same use of numbers, some
// shared vocabulary. A one-word answer next to a full sentence gives itself
// away.
function shapeScore(answer, candidate) {
  const a = String(answer || "");
  const b = String(candidate || "");
  if (!b) return -1;
  const lengthFit = Math.min(a.length, b.length) / Math.max(a.length, b.length, 1);
  const keyWords = new Set(normalizeish(a).split(/\s+/).filter((w) => w.length > 3));
  const shared = normalizeish(b).split(/\s+/).filter((w) => keyWords.has(w)).length;
  const overlap = keyWords.size ? Math.min(shared / keyWords.size, 0.5) : 0;
  const numbersAgree = /\d/.test(a) === /\d/.test(b) ? 0.1 : 0;
  return lengthFit * 0.6 + overlap * 0.6 + numbersAgree;
}

// Relevance is a rule, shape is a preference. The card's own subcategory is
// exhausted before the wider subject is touched; within one tier the
// best-shaped answers are shortlisted and then drawn from at random, so the
// same card doesn't come round with an identical set of wrong answers every
// time.
function bestCandidates(card, pool, count) {
  const all = relevantCandidates(card, pool).map((c) => ({ ...c, score: shapeScore(card.back, c.text) }));
  const picked = [];
  for (const tier of [0, 1]) {
    if (picked.length >= count) break;
    const need = count - picked.length;
    const ranked = [...new Map(all.filter((c) => c.tier === tier).map((c) => [c.text, c])).values()]
      .sort((x, y) => y.score - x.score);
    if (!ranked.length) continue;
    // Everything close to the best fit is a fair alternative; a much worse fit
    // — a bare "Ja." against a full sentence — is not, and would only ever
    // narrow the question down for free.
    const cutoff = ranked[0].score * 0.75;
    const shortlist = ranked.filter((c) => c.score >= cutoff);
    while (shortlist.length < need && shortlist.length < ranked.length) shortlist.push(ranked[shortlist.length]);
    picked.push(...shuffled(shortlist).slice(0, need).map((c) => c.text));
  }
  return [...new Set(picked)].slice(0, count);
}

export function localDistractors(card, pool, count = 3) {
  return bestCandidates(card, pool, count);
}

// A false statement built by pairing this card's question with a *neighbouring*
// card's answer — plausible enough that you have to know the material to reject
// it, which an answer from another subject never is.
export function localTrueFalse(card, pool) {
  const others = bestCandidates(card, pool, 4);
  const makeTrue = Math.random() < 0.5 || others.length === 0;
  return {
    prompt: card.front,
    claim: makeTrue ? card.back : others[0],
    isTrue: makeTrue,
    // Carried so a false claim can be corrected on screen. Being told you were
    // right that "sobre" doesn't mean "als" teaches nothing on its own — the
    // point of the exercise is to leave knowing it means "über".
    answer: card.back,
  };
}

// ---------- building the queue ----------

// A step is one thing the session puts on screen. Most cover a single card;
// a match step covers a whole group, and grades every card in it.
function step(type, cards, payload) {
  return { key: `${type}:${cards.map((c) => c.id).join(",")}:${Math.random().toString(36).slice(2, 7)}`, type, cards, payload };
}

// `content` is the AI's work when it ran: { [cardId]: { cloze, distractors,
// trueFalse } }. Anything missing falls back to the local versions above, so a
// half-finished generation still produces a complete, playable drill.
export function buildQueue(drill, cards, content = {}, allCards) {
  const pool = allCards && allCards.length ? allCards : cards;
  if (drill.types.includes(EXERCISES.MATCH)) return buildMatchQueue(cards);

  const steps = [];
  cards.forEach((card, i) => {
    // Rotate through the drill's formats so a mixed drill actually mixes,
    // rather than leaving it to chance whether you see all of them.
    const types = drill.types.filter((t) => supports(t, card, pool));
    const type = types.length ? types[i % types.length] : EXERCISES.FLIP;
    steps.push(step(type, [card], payloadFor(type, card, pool, content[card.id])));
  });
  return steps;
}

function buildMatchQueue(cards) {
  const usable = cards.filter(hasText);
  const steps = [];
  for (let i = 0; i < usable.length; i += MATCH_GROUP) {
    const group = usable.slice(i, i + MATCH_GROUP);
    // A trailing group of one has nothing to pair against, so fold it back
    // into the previous round rather than showing a one-item match.
    if (group.length < 2) {
      if (steps.length) steps[steps.length - 1].cards.push(...group);
      break;
    }
    steps.push(step(EXERCISES.MATCH, group, null));
  }
  return steps.map((s) => ({ ...s, payload: { pairs: shuffled(s.cards.map((c) => ({ id: c.id, term: c.front, meaning: c.back }))) } }));
}

function supports(type, card, pool) {
  // A picture answer can only be flipped — every other format has to compare
  // what you said against a text answer, and there isn't one. This is the same
  // rule the card editor has always enforced.
  if (card.backImageId || card.frontImageId) return type === EXERCISES.FLIP;
  switch (type) {
    case EXERCISES.CLOZE: return !!localCloze(card);
    case EXERCISES.MCQ: {
      // Three options at minimum, all of them believable. A card with only one
      // credible wrong answer is better asked some other way than padded out
      // with something from an unrelated deck.
      const manual = (card.manualOptions || []).filter((o) => normalizeish(o) !== normalizeish(card.back));
      return manual.length + relevantCandidates(card, pool).length >= 2;
    }
    // Without a neighbouring answer to corrupt, every statement would be true.
    case EXERCISES.TRUEFALSE: return hasText(card) && relevantCandidates(card, pool).length > 0;
    default: return true;
  }
}

function payloadFor(type, card, pool, aiContent) {
  const ai = aiContent || {};
  switch (type) {
    case EXERCISES.CLOZE: {
      const cloze = ai.cloze && ai.cloze.text && ai.cloze.answer ? ai.cloze : localCloze(card);
      return cloze;
    }
    case EXERCISES.MCQ: {
      // Wrong answers the user wrote themselves outrank both the model and the
      // rest of the deck — they took the trouble to say what this card is
      // confusable with.
      const manual = (card.manualOptions || []).filter((o) => normalizeish(o) !== normalizeish(card.back));
      const distractors = [...manual, ...(ai.distractors || []).filter(Boolean)].slice(0, 3);
      const filled = distractors.length >= 3
        ? distractors
        : [...distractors, ...localDistractors(card, pool, 3 - distractors.length)];
      return { options: shuffled([...new Set([card.back, ...filled])]) };
    }
    case EXERCISES.TRUEFALSE: {
      // The model writes a wrong-but-believable version of the answer; whether
      // you're shown that or the real one is decided here, so replaying the
      // same deck doesn't replay the same answers.
      if (ai.falseClaim) {
        return Math.random() < 0.5
          ? { prompt: card.front, claim: card.back, isTrue: true, answer: card.back }
          : { prompt: card.front, claim: ai.falseClaim, isTrue: false, answer: card.back };
      }
      return localTrueFalse(card, pool);
    }
    default:
      return null;
  }
}
