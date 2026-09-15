// ---------------------------------------------------------------------------
// Cards whose folder no longer exists.
//
// A card is filed by `nodeId`, and every screen in the library finds cards by
// walking the subject tree and asking which cards point at each node. A card
// pointing at a node that isn't in the tree is therefore invisible: it is in
// the catalog, it syncs, it is counted by "114 cards" in Settings, it even
// turns up in "study everything" — and there is no folder you can open to find
// it. To the person using the app, it has vanished.
//
// This is not hypothetical. On 2026-09-15 a real account had 24 of its 114
// cards pointing at five folders that a stale subject tree had overwritten out
// of existence — the cards survived because they travel as their own documents
// now, and the folders didn't because the tree still rides the parent document
// whole. The sync fault behind it is fixed in useSyncEngine; this file is the
// other half, and the more important half: whatever goes wrong upstream, a
// card must never be somewhere the user cannot look.
//
// Deliberately a *view*, not a repair. Nothing here moves a card unless the
// user asks, because the same state occurs for a moment during an ordinary
// sync — cards can arrive before the tree that explains them — and a client
// that rehomes on sight would scatter a synced catalog into a recovery folder
// every time the network was slow. Shown, it self-corrects the instant the
// real folder arrives. Moved, it would not.
// ---------------------------------------------------------------------------

export function nodeIdsIn(subjects) {
  const ids = new Set();
  const walk = (node) => {
    ids.add(node.id);
    (node.children || []).forEach(walk);
  };
  (subjects || []).forEach(walk);
  return ids;
}

// The live cards no folder in the tree can show.
export function findOrphans(cards, subjects) {
  const ids = nodeIdsIn(subjects);
  return (cards || []).filter((c) => c && !c.deletedAt && !ids.has(c.nodeId));
}

// Group them the way they were filed, so the user is offered "12 cards that
// were in one folder" rather than 24 loose ones. The folder's *name* is gone
// with the folder — that only ever lived in the tree — so the group is
// identified by how many cards it holds and when they were last touched.
export function groupOrphans(orphans) {
  const groups = new Map();
  for (const card of orphans) {
    const key = card.nodeId || "(none)";
    if (!groups.has(key)) groups.set(key, { nodeId: key, cards: [], lastEdited: 0 });
    const group = groups.get(key);
    group.cards.push(card);
    group.lastEdited = Math.max(group.lastEdited, card.updatedAt || 0);
  }
  return [...groups.values()].sort((a, b) => b.cards.length - a.cards.length);
}

// Move a set of cards into an existing folder. Returns the whole card array
// with those cards refiled — `updatedAt` deliberately untouched, because
// cardSync.applyLocalEdits is the one place allowed to stamp a card and it
// will notice the changed nodeId on its own. Stamping here would be a second
// place that does it, which is the hazard that cost a whole study session once.
export function rehome(cards, orphanIds, nodeId) {
  const moving = new Set(orphanIds);
  if (!nodeId || moving.size === 0) return cards;
  return (cards || []).map((c) => (moving.has(c.id) ? { ...c, nodeId } : c));
}
