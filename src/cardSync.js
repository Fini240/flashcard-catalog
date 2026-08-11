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

// Sync bookkeeping rather than the card itself — a change to one of these is
// not a reason to call the card edited.
const BOOKKEEPING = new Set(["updatedAt", "deletedAt"]);

export function sameCardContent(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a).filter((k) => !BOOKKEEPING.has(k));
  const kb = Object.keys(b).filter((k) => !BOOKKEEPING.has(k));
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    const va = a[k];
    const vb = b[k];
    if (va === vb) continue;
    // manualOptions is the only array a card carries.
    if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length && va.every((x, i) => x === vb[i])) continue;
    return false;
  }
  return true;
}

// Folds the app's current cards into the sync map, stamping whatever actually
// changed. This is where "every card gets an updatedAt the moment it changes
// locally" is enforced — and it has to be enforced somewhere, because the
// card objects themselves are built by ordinary reducers (applyGrade and the
// card editor) that know nothing about sync.
//
// Without it a studied card keeps the timestamp it was downloaded with, which
// makes it invisible to diffDirty — so the progress is never uploaded — and a
// loser in mergeCardMaps, whose ties go to the remote copy. The next load then
// replaces the studied card with the version it was derived from, and the
// session's work is gone.
export function applyLocalEdits(map, cards, { now = Date.now(), perCardMode = false } = {}) {
  const out = { ...map };
  const inState = new Set();
  for (const c of cards) {
    inState.add(c.id);
    const existing = out[c.id];
    let next;
    if (!existing || existing.deletedAt) {
      // Unknown here, or known only as a tombstone. Supply a stamp if the card
      // has none, but don't mint a fresh one — that would resurrect a deletion
      // that another device is still propagating.
      next = c.updatedAt ? c : { ...c, updatedAt: now };
    } else if (sameCardContent(existing, c)) {
      next = existing;
    } else {
      next = { ...c, updatedAt: now };
    }
    if (!existing || (next.updatedAt || 0) >= (existing.deletedAt || existing.updatedAt || 0)) {
      out[c.id] = next;
    }
  }
  if (perCardMode) {
    // Tombstone whatever vanished from state — but only in per-card mode. In
    // legacy mode deletions ride the whole-doc push, and pre-migration we
    // can't tell "deleted" from "not loaded yet".
    for (const id of Object.keys(out)) {
      if (!inState.has(id) && !out[id].deletedAt) out[id] = { ...out[id], deletedAt: now };
    }
  } else {
    for (const id of Object.keys(out)) {
      if (!inState.has(id)) delete out[id];
    }
  }
  return out;
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
    if (rT > lT) out[id] = remote;
    else if (lT > rT) out[id] = local;
    else out[id] = studiedFurther(local, remote) ? local : remote;
  }
  return out;
}

// An exact tie means neither side can prove it is newer, and the card used to
// go to the remote copy on that basis alone. That is how progress made before
// local edits were stamped got thrown away: the studied card and the cloud's
// stale copy carried the same timestamp, so the stale one won.
//
// Study history only ever moves forward, so the deeper card is the one that
// has actually been used. Only reachable on a tie, which after stamping means
// a card nobody has touched since it was downloaded — or one studied back when
// local edits went unstamped, which is exactly the case worth rescuing.
function studiedFurther(a, b) {
  const peak = (c) => c.srsPeak || c.srsBox || 0;
  if (peak(a) !== peak(b)) return peak(a) > peak(b);
  if ((a.srsBox || 0) !== (b.srsBox || 0)) return (a.srsBox || 0) > (b.srsBox || 0);
  return (a.srsDue || 0) > (b.srsDue || 0);
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

// Which of `merged` the subcollection doesn't already hold in at least this
// state. On a repeat migration this is usually empty — that's the point: a
// re-run must be a no-op, not a rewrite that rolls newer cards backwards.
export function cardsNeedingWrite(merged, existing) {
  return Object.values(merged).filter((c) => {
    const e = existing[c.id];
    if (!e) return true;
    return (c.deletedAt || c.updatedAt || 0) > (e.deletedAt || e.updatedAt || 0);
  });
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
// Re-running this is not hypothetical. A client on a pre-per-card build still
// writes the whole parent document without merging, which silently drops
// `cardsMigratedAt` — and the next new client to sign in then sees an
// unmigrated account and starts over. So the migration must never assume the
// subcollection is empty: it merges against what is already there and writes
// only the cards that are genuinely missing or older, or a second run would
// roll every card back to its pre-migration state and resurrect deletions.
export async function migrateCardsToSubcollection(uid, parentData, now = Date.now()) {
  const cards = (parentData && parentData.cards) || [];
  const stamped = cards.map(c => ({ ...c, updatedAt: c.updatedAt || now }));

  const existing = await fetchCardMap(uid);
  const merged = mergeCardMaps(toCardMap(stamped), existing);
  const toWrite = cardsNeedingWrite(merged, existing);
  if (toWrite.length) await pushCards(uid, toWrite);

  await FirebaseFirestore.setDocument({
    reference: userRef(uid),
    data: { cardsMigratedAt: now },
    merge: true,
  });
  return merged;
}
