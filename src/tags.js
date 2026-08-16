// ---------------------------------------------------------------------------
// Tags — labels that cut across the folder tree.
//
// The tree answers "where does this card live", and a card lives in exactly one
// place. Tags answer the questions the tree can't: everything marked #exam
// across four subjects, every formula, everything a teacher flagged. A card has
// one node and any number of tags.
//
// Stored on the card as a plain string array, lowercase, so sync, export and
// search all treat them as ordinary data. Normalisation is strict on purpose —
// "Exam", "#exam" and " exam " must be the same tag or the feature is just a
// second way to make typos.
// ---------------------------------------------------------------------------

export const MAX_TAG_LENGTH = 24;
export const MAX_TAGS_PER_CARD = 12;

// Spaces become hyphens rather than splitting into two tags: a person typing
// "past paper" means one label, and silently making it two is worse than
// either honouring it or refusing it.
export function normalizeTag(raw) {
  const t = String(raw || "")
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_/]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
  return t.slice(0, MAX_TAG_LENGTH);
}

// Accepts what people actually type: "#exam, formulas  physics/optics".
export function parseTags(input) {
  if (Array.isArray(input)) return dedupe(input.map(normalizeTag).filter(Boolean));
  return dedupe(
    String(input || "")
      .split(/[,\n]|\s+/)
      .map(normalizeTag)
      .filter(Boolean)
  );
}

const dedupe = (list) => [...new Set(list)].slice(0, MAX_TAGS_PER_CARD);

export const formatTags = (tags) => (tags || []).map((t) => `#${t}`).join(" ");

export const cardTags = (card) => (Array.isArray(card?.tags) ? card.tags : []);

export const hasTag = (card, tag) => cardTags(card).includes(normalizeTag(tag));

export function addTag(card, tag) {
  const t = normalizeTag(tag);
  if (!t || hasTag(card, t)) return card;
  return { ...card, tags: dedupe([...cardTags(card), t]) };
}

export function removeTag(card, tag) {
  const t = normalizeTag(tag);
  if (!hasTag(card, t)) return card;
  return { ...card, tags: cardTags(card).filter((x) => x !== t) };
}

// Every tag in use, most-used first — what the filter bar and the editor's
// suggestions read. Ties break alphabetically so the order is stable between
// renders rather than depending on card order.
export function tagCounts(cards) {
  const counts = new Map();
  for (const c of cards || []) {
    for (const t of cardTags(c)) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

// Filters by tags. AND by default — picking #exam and #optics means cards that
// are both, which is what a person narrowing a search expects. `mode: "any"`
// gives the union for the cases where that is what's wanted.
export function filterByTags(cards, tags, mode = "all") {
  const wanted = (tags || []).map(normalizeTag).filter(Boolean);
  if (!wanted.length) return cards || [];
  return (cards || []).filter((c) => {
    const have = cardTags(c);
    return mode === "any" ? wanted.some((t) => have.includes(t)) : wanted.every((t) => have.includes(t));
  });
}

// Hierarchical tags: "physics/optics" implies "physics". Anki does this, and
// it is what makes a tag list stay navigable past about thirty tags.
export function expandHierarchy(tags) {
  const out = new Set();
  for (const t of tags || []) {
    const parts = t.split("/").filter(Boolean);
    for (let i = 1; i <= parts.length; i++) out.add(parts.slice(0, i).join("/"));
  }
  return [...out];
}

export const matchesHierarchical = (card, tag) => {
  const t = normalizeTag(tag);
  return expandHierarchy(cardTags(card)).includes(t);
};

// Renames a tag everywhere, including under any hierarchy that sits beneath it.
// Returns only the cards that changed, so the caller can write just those.
export function renameTag(cards, from, to) {
  const a = normalizeTag(from);
  const b = normalizeTag(to);
  if (!a || !b || a === b) return [];
  const changed = [];
  for (const c of cards || []) {
    const tags = cardTags(c);
    if (!tags.some((t) => t === a || t.startsWith(`${a}/`))) continue;
    const next = dedupe(tags.map((t) => (t === a ? b : t.startsWith(`${a}/`) ? b + t.slice(a.length) : t)));
    changed.push({ ...c, tags: next });
  }
  return changed;
}

export function deleteTag(cards, tag) {
  const t = normalizeTag(tag);
  if (!t) return [];
  const changed = [];
  for (const c of cards || []) {
    const tags = cardTags(c);
    if (!tags.some((x) => x === t || x.startsWith(`${t}/`))) continue;
    changed.push({ ...c, tags: tags.filter((x) => x !== t && !x.startsWith(`${t}/`)) });
  }
  return changed;
}
