// ---------------------------------------------------------------------------
// Friends & competition, on top of Firestore.
//
// The rule we hold to: nothing a user studies ever leaves their private
// `users/{uid}` document. The public `profiles/{uid}` document carries only a
// display name, an avatar emoji, a friend code and four scoreboard numbers.
// A friend can see that you did 240 XP this week; they can never see a card.
//
// Friending works by short code rather than by email or username search, so
// nobody can be found — or spammed — without being handed the code first.
// ---------------------------------------------------------------------------
import { FirebaseFirestore } from "@capacitor-firebase/firestore";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/L/O/0/1 — misread on paper

// Deterministic 6-character code derived from the uid: the same account always
// produces the same code, on every device, with no extra document to keep in
// sync and no collision bookkeeping at this scale. Two independent hashes are
// mixed so that uids sharing a prefix don't produce neighbouring codes.
export function codeForUid(uid) {
  const s = String(uid || "");
  let fnv = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    fnv ^= s.charCodeAt(i);
    fnv = Math.imul(fnv, 16777619) >>> 0;
  }
  let djb = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) {
    djb = ((Math.imul(djb, 33) >>> 0) ^ s.charCodeAt(i)) >>> 0;
  }
  let x = (fnv ^ djb) >>> 0;
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[x % CODE_ALPHABET.length];
    x = Math.floor(x / CODE_ALPHABET.length);
    // Re-stir so later characters don't collapse once x gets small.
    x = (x ^ Math.imul(x + i + 1, 2654435761)) >>> 0;
  }
  return out;
}

export function normalizeCode(input) {
  return (input || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

const profileRef = (uid) => `profiles/${uid}`;

// Push the user's scoreboard numbers. Called after every session and on sign
// in — cheap (one small document write) and it keeps friends' boards live.
export async function publishProfile(uid, profile) {
  await FirebaseFirestore.setDocument({
    reference: profileRef(uid),
    data: {
      uid,
      name: profile.name || "Anonymous",
      emoji: profile.emoji || "🦉",
      code: codeForUid(uid),
      xp: profile.xp || 0,
      weekXp: profile.weekXp || 0,
      weekKey: profile.weekKey || "",
      streak: profile.streak || 0,
      level: profile.level || 1,
      rank: profile.rank || "bronze",
      cardsTotal: profile.cardsTotal || 0,
      updatedAt: Date.now(),
    },
    merge: true,
  });
}

export async function fetchProfile(uid) {
  const { snapshot } = await FirebaseFirestore.getDocument({ reference: profileRef(uid) });
  return snapshot && snapshot.data ? snapshot.data : null;
}

export async function fetchProfiles(uids) {
  const out = [];
  for (const uid of uids) {
    try {
      const p = await fetchProfile(uid);
      if (p) out.push(p);
    } catch (e) {
      // A friend who deleted their profile shouldn't break the board.
    }
  }
  return out;
}

// Look a friend up by their code. Equality on a single field is auto-indexed
// by Firestore, so this needs no index deployment.
export async function findByCode(code) {
  const clean = normalizeCode(code);
  if (clean.length !== 6) return null;
  const { snapshots } = await FirebaseFirestore.getCollection({
    reference: "profiles",
    compositeFilter: {
      type: "and",
      queryConstraints: [{ type: "where", fieldPath: "code", opStr: "==", value: clean }],
    },
    queryConstraints: [{ type: "limit", limit: 1 }],
  });
  if (!snapshots || !snapshots.length) return null;
  return snapshots[0].data;
}

// A nudge is a single tap that lands in the friend's app as "Anna poked you —
// your streak is at risk". Duolingo's own numbers say a shared commitment is
// the strongest social lever there is; this is the cheapest version of it.
export async function sendNudge(toUid, from) {
  await FirebaseFirestore.addDocument({
    reference: `profiles/${toUid}/nudges`,
    data: { from: from.uid, name: from.name || "A friend", emoji: from.emoji || "🦉", at: Date.now() },
  });
}

export async function fetchNudges(uid) {
  const { snapshots } = await FirebaseFirestore.getCollection({
    reference: `profiles/${uid}/nudges`,
    queryConstraints: [{ type: "limit", limit: 20 }],
  });
  return (snapshots || []).map(s => ({ id: s.id, ...s.data }));
}

export async function clearNudges(uid, ids) {
  for (const id of ids) {
    try {
      await FirebaseFirestore.deleteDocument({ reference: `profiles/${uid}/nudges/${id}` });
    } catch (e) {
      // best effort — a nudge that fails to clear will just show once more
    }
  }
}

// Builds the weekly board: the user plus everyone they've added, sorted by XP
// earned this week. The user's own row is always present even offline, so the
// board never looks broken when a friend fetch fails.
export function buildBoard(me, friendProfiles, weekKey) {
  const rows = [
    { ...me, isMe: true },
    ...friendProfiles.map(p => ({
      uid: p.uid,
      name: p.name,
      emoji: p.emoji,
      // A stale week's XP would otherwise sit at the top of the new week's
      // board until that friend next opens the app.
      weekXp: p.weekKey === weekKey ? p.weekXp || 0 : 0,
      streak: p.streak || 0,
      level: p.level || 1,
      isMe: false,
    })),
  ];
  rows.sort((a, b) => (b.weekXp - a.weekXp) || (b.streak - a.streak) || a.name.localeCompare(b.name));
  return rows.map((r, i) => ({ ...r, position: i + 1 }));
}
