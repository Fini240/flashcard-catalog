// ---------------------------------------------------------------------------
// Per-card sync — the fix for whole-document last-writer-wins.
//
// Layout in Firestore:
//
//   users/{uid}                → { subjects, game, updatedAt, cardsMigratedAt }
//   users/{uid}/cards/{cardId} → { front, back, nodeId, srsBox, srsDue, …,
//                                  updatedAt, deletedAt }
//
// Why this fixes the 90-card loss: two devices editing *different* cards are
// now two independent document writes that both survive — no timestamp
// comparison, no read-before-write, no TOCTOU window. Concurrent edits to the
// *same* card are still last-writer-wins, but that loses one field on one
// card, not a catalog.
//
// Three rules the whole design hangs on:
//
//   1. Tombstones, not deletes. A deleted card is written with
//      deletedAt: now and filtered on read. Without this, a phone that was
//      offline when you deleted 20 cards resurrects all 20 on reconnect.
//      Tombstones older than TOMBSTONE_MAX_AGE_MS are swept on app open.
//
//   2. Dirty-set pushes. Only cards changed since the last successful push
//      are written (in batches of ≤500). Grading one card no longer rewrites
//      the whole catalog.
//
//   3. Cards and "everything else" travel separately. Subjects and game state
//      stay on the parent doc — they're small and rarely edited concurrently.
//      A parent-doc conflict is still whole-doc, but it no longer carries
//      cards, so it can't eat anyone's study progress.
//
// Migration: the first run after this ships finds the cards array still on
// the parent doc, batch-writes every card into the subcollection, then sets
// cardsMigratedAt on the parent. The array is left in place, untouched, as
// the rollback path. Once cardsMigratedAt is set the array is never read
// again.
//
// The merge logic (mergeCardMaps, diffDirty) is pure and lives at the bottom
// of this file with no Firestore imports, so the tests can feed it divergent
// card sets directly — the test that would have caught the 90-card loss.
// ---------------------------------------------------------------------------

import { FirebaseFirestore } from "@capacitor-firebase/firestore";
import { report } from "./report";

const cardsRef = (uid) => `users/${uid}/cards`;
const userRef = (uid) => `users/${uid}`;
export const TOMBSTONE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const BATCH_LIMIT = 450; // Firestore caps a batch at 500 writes; leave headroom

// Every card gets an updatedAt stamped on it the moment it changes locally.
// Remote cards carry their own; merging is per-card max(updatedAt), so a card
// only ever moves forward.
export function stampCard(card, now = Date.now()) {
  return { ...card, updatedAt: now };
}

// ---------- merge (pure) ----------
// Two maps of id → card. A card survives if either side has it live; a
// tombstone wins over a live card only when it's *newer* — an old tombstone
// must not kill a card the other device has been actively studying.
export function mergeCardMaps(localMap, remoteMap) {
  const out = { ...localMap };
  for (const [id, remote] of Object.entries(remoteMap)) {
    const local = out[id];
    if (!local) { out[id] = remote; continue; }
    const lT = local.deletedAt || local.updatedAt || 0;
    const rT = remote.deletedAt || remote.updatedAt || 0;
    out[id] = rT >= lT ? remote : local;
  }
  return out;
}

// Which local cards need to go up: newer than their last-pushed timestamp.
// pushedMap is id → updatedAt/deletedAt at the time of the last successful push.
export function diffDirty(localMap, pushedMap) {
  const dirty = [];
  for (const [id, card] of Object.entries(localMap)) {
    const t = card.deletedAt || card.updatedAt || 0;
    if (t > (pushedMap[id] || 0)) dirty.push(card);
  }
  return dirty;
}

// Live cards only, as the array the rest of the app expects.
export function liveCards(cardMap) {
  return Object.values(cardMap).filter(c => !c.deletedAt);
}

export function toCardMap(cards) {
  const map = {};
  for (const c of cards || []) map[c.id] = c;
  return map;
}

// Drop tombstones old enough that every device that could still hold the card
// has certainly synced since. Returns { map, swept } — swept ids also get
// hard-deleted remotely on the next push.
export function sweepTombstones(cardMap, now = Date.now()) {
  const map = {};
  const swept = [];
  for (const [id, card] of Object.entries(cardMap)) {
    if (card.deletedAt && now - card.deletedAt > TOMBSTONE_MAX_AGE_MS) swept.push(id);
    else map[id] = card;
  }
  return { map, swept };
}

// ---------- Firestore driver ----------
export async function fetchCardMap(uid) {
  const { snapshots } = await FirebaseFirestore.getCollection({ reference: cardsRef(uid) });
  const map = {};
  for (const s of snapshots || []) map[s.id] = { id: s.id, ...s.data };
  return map;
}

// Write a set of cards (live or tombstoned) in batches. Returns the ids that
// were successfully written so the caller can advance its pushed-timestamp map.
export async function pushCards(uid, cards) {
  const written = [];
  for (let i = 0; i < cards.length; i += BATCH_LIMIT) {
    const slice = cards.slice(i, i + BATCH_LIMIT);
    // @capacitor-firebase/firestore's writeBatch takes an array of operations.
    await FirebaseFirestore.writeBatch({
      operations: slice.map(card => ({
        type: "set",
        reference: `${cardsRef(uid)}/${card.id}`,
        data: card,
      })),
    });
    written.push(...slice.map(c => c.id));
  }
  return written;
}

export async function hardDeleteCards(uid, ids) {
  for (let i = 0; i < ids.length; i += BATCH_LIMIT) {
    const slice = ids.slice(i, i + BATCH_LIMIT);
    await FirebaseFirestore.writeBatch({
      operations: slice.map(id => ({ type: "delete", reference: `${cardsRef(uid)}/${id}` })),
    });
  }
}

export function listenToCards(uid, callback) {
  return FirebaseFirestore.addCollectionSnapshotListener(
    { reference: cardsRef(uid) },
    (event, error) => {
      if (error) { callback(null, error); return; }
      const map = {};
      for (const s of (event && event.snapshots) || []) map[s.id] = { id: s.id, ...s.data };
      callback(map, null);
    }
  );
}

// ---------- migration ----------
// One-way, idempotent: cards array on the parent doc → subcollection docs,
// then a marker on the parent. Safe to re-run after a crash: writes are
// sets with the card id as the document id, so a second run just overwrites
// what the first wrote.
export async function migrateCardsToSubcollection(uid, parentData, now = Date.now()) {
  const cards = (parentData && parentData.cards) || [];
  const stamped = cards.map(c => ({ ...c, updatedAt: c.updatedAt || now }));
  if (stamped.length) await pushCards(uid, stamped);
  await FirebaseFirestore.setDocument({
    reference: userRef(uid),
    data: { cardsMigratedAt: now },
    merge: true,
  });
  return toCardMap(stamped);
}
