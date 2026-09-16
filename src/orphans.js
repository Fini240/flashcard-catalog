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

import { moveCards } from "./moveCards";

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

// Move a set of cards into an existing folder — this sheet's name for an
// ordinary move, and the same operation, so it shares the implementation in
// moveCards.js rather than keeping a second one here. `target` is a folder
// option from `moveCards.folderOptions`; passing a bare nodeId still works but
// leaves `subjectId` pointing at the subject the card came from, which for an
// orphan is a subject that no longer exists — see the header of moveCards.js
// for what that costs.
export function rehome(cards, orphanIds, target) {
  return moveCards(cards, orphanIds, target);
}
