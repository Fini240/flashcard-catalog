// ---------------------------------------------------------------------------
// Friends & competition, on top of Firestore.
//
// The rule we hold to: nothing a user studies ever leaves their private
// `users/{uid}` document. The public `profiles/{uid}` document carries only a
// self-chosen username, an avatar emoji, a friend code and four scoreboard
// numbers. A friend can see that you did 240 XP this week; they can never see
// a card.
//
// The username is deliberately NOT the Google display name. Every signed-in
// user can read every profile, and the global board puts those profiles in
// front of strangers rather than just friends — so publishing `user.displayName`
// would be publishing people's real names. The rules reject a `name` key
// outright, which makes that mistake impossible to make again by accident
// rather than merely unlikely.
//
// Friending still works by short code, so a specific person can be added
// without being searchable by name.
// ---------------------------------------------------------------------------
import { FirebaseFirestore } from "@capacitor-firebase/firestore";
import { report } from "./report";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/L/O/0/1 — misread on paper

// Firestore reports a rules rejection differently depending on the layer that
// surfaces it: the native Android SDK says PERMISSION_DENIED, the JS SDK uses
// the code `permission-denied`, and both can arrive as the human-readable
// "Missing or insufficient permissions." Matching only one of those would send
// every ordinary "name is taken" into the error log and bury the real faults.
function isPermissionDenied(e) {
  if (!e) return false;
  const text = `${e.code || ""} ${e.message || e}`;
  return /permission[_-]denied|insufficient permissions/i.test(text);
}

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

// ---------- usernames ----------
// 3–16 characters, letters/digits/_/- only. Kept deliberately narrow: it has
// to survive being rendered in a leaderboard row on a 320px phone, and a tight
// character set keeps homoglyph impersonation ("Fïnn") off the table.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 16;
const USERNAME_RE = /^[A-Za-z0-9_-]{3,16}$/;

export function validateUsername(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Pick a username.";
  if (trimmed.length < USERNAME_MIN) return `At least ${USERNAME_MIN} characters.`;
  if (trimmed.length > USERNAME_MAX) return `At most ${USERNAME_MAX} characters.`;
  if (!USERNAME_RE.test(trimmed)) return "Letters, numbers, - and _ only.";
  return null;
}

// Reservations are keyed by the lowercased name so "Finn" and "finn" can't
// both be taken — case is preserved for display only.
export const usernameKey = (name) => (name || "").trim().toLowerCase();

// A suggestion that is already unique-ish, so the first-run dialog is one tap
// for anyone who doesn't care what they're called.
export function suggestUsername(uid) {
  return `learner-${codeForUid(uid).slice(0, 4).toLowerCase()}`;
}

// Claiming is a create, never a set: Firestore only applies `create` when the
// document does not exist, so two people racing for the same name resolve to
// one winner without a transaction. The old reservation is released after the
// new one is safely held — losing a name you already had would be worse than
// briefly holding two.
export async function claimUsername(uid, name, previous) {
  const err = validateUsername(name);
  if (err) return { ok: false, error: err };
  const key = usernameKey(name);
  if (previous && usernameKey(previous) === key) return { ok: false, error: "That's already your username." };

  try {
    await FirebaseFirestore.setDocument({
      reference: `usernames/${key}`,
      data: { uid },
      merge: false,
    });
  } catch (e) {
    // A denied write is the expected "name is taken" path — the create rule
    // only passes on a document that doesn't exist yet. Anything else
    // (offline, rules bug) produces the same user-facing error, so log it —
    // otherwise a broken rules deploy looks like "every name is taken".
    if (!isPermissionDenied(e)) report("social.claimUsername", e);
    return { ok: false, error: "That username is taken." };
  }

  if (previous && usernameKey(previous) !== key) {
    try {
      await FirebaseFirestore.deleteDocument({ reference: `usernames/${usernameKey(previous)}` });
    } catch (e) {
      // Never fail the claim over this — but do record it. The reservation is
      // now leaked: usernames/<oldname> still points at this uid, so that name
      // is globally unclaimable and nothing on screen would ever say why.
      report("social.releasePreviousUsername", e);
    }
  }
  return { ok: true, username: name.trim() };
}

// Signing in must never leave someone nameless. Without this, a fresh account
// publishes an empty username, which means no global board row and the word
// "Anonymous" on every friend's board — invisible, with nothing on screen
// explaining why. So a name is claimed automatically and the user is told they
// can change it, rather than being silently left out.
//
// The suggestion is derived from the uid and so is stable, but two accounts can
// still collide; a few numbered variants are tried before giving up, and the
// last resort is random rather than another guaranteed collision.
export function usernameCandidates(uid, rand = Math.random) {
  const stem = suggestUsername(uid);
  const out = [stem];
  for (let i = 2; i <= 5; i++) out.push(`${stem}${i}`.slice(0, USERNAME_MAX));
  out.push(`${stem.slice(0, 10)}${Math.floor(rand() * 9000 + 1000)}`.slice(0, USERNAME_MAX));
  return out.filter(c => !validateUsername(c));
}

export async function claimSuggestedUsername(uid, previous) {
  for (const candidate of usernameCandidates(uid)) {
    const res = await claimUsername(uid, candidate, previous);
    if (res.ok) return res;
  }
  return { ok: false, error: "Couldn't reserve a username." };
}

export async function isUsernameFree(name) {
  const key = usernameKey(name);
  if (!key) return false;
  try {
    const { snapshot } = await FirebaseFirestore.getDocument({ reference: `usernames/${key}` });
    return !(snapshot && snapshot.data);
  } catch (e) {
    // Offline read says "taken" — same user-facing answer, but log it so a
    // permissions/rules problem doesn't masquerade as "no names available".
    report("social.isUsernameFree", e);
    return false;
  }
}

// Push the user's scoreboard numbers. Called after every session and on sign
// in — cheap (one small document write) and it keeps friends' boards live.
//
// `listed` drives the global board. A user without a username is never listed:
// there is nothing safe to show for them yet.
export async function publishProfile(uid, profile) {
  const username = (profile.username || "").trim();
  await FirebaseFirestore.setDocument({
    reference: profileRef(uid),
    data: {
      uid,
      username: username || "",
      emoji: profile.emoji || "🦉",
      code: codeForUid(uid),
      xp: profile.xp || 0,
      weekXp: profile.weekXp || 0,
      weekKey: profile.weekKey || "",
      streak: profile.streak || 0,
      level: profile.level || 1,
      rank: profile.rank || "bronze",
      cardsTotal: profile.cardsTotal || 0,
      listed: !!username && profile.listed !== false,
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
      // A friend who deleted their profile shouldn't break the board — but a
      // permissions failure or a dropped connection lands here too, and then a
      // friend silently disappears from the leaderboard. Same behaviour either
      // way; log it so "my friends vanished" is diagnosable.
      report("social.fetchProfiles", e);
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

// ---------- making a friendship mutual ----------
// A friend list lives in the user's own private `users/{uid}` document, which
// nobody else can write to — so adding someone can only ever be one-sided at
// the moment it happens. This is the other half: the adder drops a marker in
// the target's public space, and the target folds it into their own list the
// next time they open the app.
//
// The document id is the sender's uid, which makes the whole thing idempotent —
// adding the same person twice leaves one marker, not a growing pile — and
// means the rules can check the sender by looking at the path.
export async function announceFriend(toUid, fromUid) {
  await FirebaseFirestore.setDocument({
    reference: `profiles/${toUid}/friendAdds/${fromUid}`,
    data: { from: fromUid, at: Date.now() },
    merge: true,
  });
}

export async function fetchFriendAdds(uid) {
  const { snapshots } = await FirebaseFirestore.getCollection({
    reference: `profiles/${uid}/friendAdds`,
    queryConstraints: [{ type: "limit", limit: 50 }],
  });
  return (snapshots || []).map(s => ({ id: s.id, ...s.data }));
}

export async function clearFriendAdds(uid, ids) {
  for (const id of ids) {
    try {
      await FirebaseFirestore.deleteDocument({ reference: `profiles/${uid}/friendAdds/${id}` });
    } catch (e) {
      // A marker that fails to clear is merged again next launch — harmless,
      // because merging is a set union rather than an append.
      report("social.clearFriendAdds", e);
    }
  }
}

// Folds incoming markers into an existing friend list. A union, so re-merging
// the same marker is a no-op, and self-references (which shouldn't happen, but
// would be ugly if they did) are dropped.
export function mergeFriendAdds(friends, adds, myUid) {
  const out = new Set(friends || []);
  for (const a of adds || []) {
    const uid = a && (a.from || a.id);
    if (uid && uid !== myUid) out.add(uid);
  }
  return [...out];
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
      report("social.clearNudges", e);
    }
  }
}

// ---------- global board ----------
// Everyone who has picked a username and hasn't opted out, ranked by XP earned
// this week. Filtering on `weekKey` server-side is what keeps last week's
// leaders from sitting on top of Monday's empty board — the alternative,
// fetching and filtering client-side, would drop live players off the end of
// the limit. Needs the composite index in firestore.indexes.json.
export async function globalBoard(weekKey, max = 50) {
  const { snapshots } = await FirebaseFirestore.getCollection({
    reference: "profiles",
    compositeFilter: {
      type: "and",
      queryConstraints: [
        { type: "where", fieldPath: "listed", opStr: "==", value: true },
        { type: "where", fieldPath: "weekKey", opStr: "==", value: weekKey },
      ],
    },
    queryConstraints: [
      { type: "orderBy", fieldPath: "weekXp", directionStr: "desc" },
      { type: "limit", limit: max },
    ],
  });
  return (snapshots || []).map(s => s.data).filter(Boolean);
}

// Ranks the global rows and marks the caller's own. Kept separate from the
// fetch so it can be tested without Firestore, and so the caller's row can be
// merged in from local state — a player whose last publish failed should still
// see themselves on their own board.
export function buildGlobalBoard(rows, myUid, me) {
  const seen = new Set();
  const clean = [];
  for (const r of rows || []) {
    if (!r || !r.username || seen.has(r.uid)) continue;
    seen.add(r.uid);
    clean.push({
      uid: r.uid,
      username: r.username,
      emoji: r.emoji || "🦉",
      weekXp: r.weekXp || 0,
      streak: r.streak || 0,
      level: r.level || 1,
      isMe: r.uid === myUid,
    });
  }
  if (me && me.username && !seen.has(myUid)) {
    clean.push({
      uid: myUid,
      username: me.username,
      emoji: me.emoji || "🦉",
      weekXp: me.weekXp || 0,
      streak: me.streak || 0,
      level: me.level || 1,
      isMe: true,
    });
  }
  clean.sort((a, b) => (b.weekXp - a.weekXp) || (b.streak - a.streak) || a.username.localeCompare(b.username));
  return clean.map((r, i) => ({ ...r, position: i + 1 }));
}

// Builds the weekly board: the user plus everyone they've added, sorted by XP
// earned this week. The user's own row is always present even offline, so the
// board never looks broken when a friend fetch fails.
export function buildBoard(me, friendProfiles, weekKey) {
  const rows = [
    { ...me, isMe: true },
    ...friendProfiles.map(p => ({
      uid: p.uid,
      // A friend who hasn't picked a username yet still belongs on the board.
      username: p.username || "Anonymous",
      emoji: p.emoji,
      // A stale week's XP would otherwise sit at the top of the new week's
      // board until that friend next opens the app.
      weekXp: p.weekKey === weekKey ? p.weekXp || 0 : 0,
      streak: p.streak || 0,
      level: p.level || 1,
      isMe: false,
    })),
  ];
  rows.sort((a, b) => (b.weekXp - a.weekXp) || (b.streak - a.streak) || (a.username || "").localeCompare(b.username || ""));
  return rows.map((r, i) => ({ ...r, position: i + 1 }));
}
