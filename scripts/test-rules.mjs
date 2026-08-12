// Firestore security-rules test suite. Runs against the real Firebase Rules
// evaluation API (no emulator needed), using the firebase-tools login token.
//
//   node scripts/test-rules.mjs
//
// It checks the two things that actually matter for this app: a user's cards
// are unreachable by anyone else, and the public profile can never be used to
// smuggle card content or an email address into a world-readable document.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT = "centering-timer-502020-h0";
const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");

let token;
try {
  const cfg = JSON.parse(readFileSync(join(homedir(), ".config/configstore/firebase-tools.json"), "utf8"));
  token = cfg.tokens.access_token;
} catch {
  console.error("No firebase-tools credentials found. Run: firebase login");
  process.exit(1);
}

const ME = "userAAA", FRIEND = "userBBB";
const PROFILE = {
  uid: ME, username: "finn", emoji: "O", code: "AB3D9F", xp: 100, weekXp: 40,
  weekKey: "2026-08-10", streak: 3, level: 2, rank: "bronze", cardsTotal: 50,
  listed: true, updatedAt: 1,
};
const NUDGE = { from: ME, name: "finn", emoji: "O", at: 1 };
const SUBJECT = { id: "s1", name: "Biology", children: [] };
const CARD = { id: "k1", front: "a", back: "b" };
const RESERVATION = { uid: ME };
const ADD = { from: ME, at: 1 };

const tc = (name, path, method, uid, data, expect) => {
  const request = { path: `/databases/(default)/documents${path}`, method };
  if (uid) request.auth = { uid, token: { sub: uid } };
  if (data !== null && data !== undefined) request.resource = { data };
  return { name, expect, request };
};

// Rules that branch on `resource.data` (the document as it already exists) need
// that state supplied via the test case's own `resource`, or the expression
// evaluates against nothing. Taking a username someone else holds is exactly
// such a rule, and it decides whether identities can be stolen — so it gets
// tested properly rather than by reading the rule and nodding.
const tcExisting = (name, path, method, uid, data, existing, expect) => ({
  ...tc(name, path, method, uid, data, expect),
  resource: { data: existing },
});

const cases = [
  tc("own catalog read", "/users/userAAA", "get", ME, null, "ALLOW"),
  tc("own catalog write", "/users/userAAA", "create", ME, { cards: [], game: { xp: 1 } }, "ALLOW"),
  tc("OTHER catalog read blocked", "/users/userBBB", "get", ME, null, "DENY"),
  tc("OTHER catalog write blocked", "/users/userBBB", "create", ME, { cards: [] }, "DENY"),
  tc("anon catalog read blocked", "/users/userAAA", "get", null, null, "DENY"),

  tc("read friend profile", "/profiles/userBBB", "get", ME, null, "ALLOW"),
  tc("anon profile read blocked", "/profiles/userAAA", "get", null, null, "DENY"),
  tc("write own profile", "/profiles/userAAA", "create", ME, PROFILE, "ALLOW"),
  tc("update own profile", "/profiles/userAAA", "update", ME, PROFILE, "ALLOW"),
  tc("write OTHER profile blocked", "/profiles/userBBB", "create", ME, { ...PROFILE, uid: FRIEND }, "DENY"),
  tc("profile leaking cards blocked", "/profiles/userAAA", "create", ME, { ...PROFILE, cards: ["secret"] }, "DENY"),
  tc("profile leaking email blocked", "/profiles/userAAA", "create", ME, { ...PROFILE, email: "a@b.c" }, "DENY"),
  tc("anon profile write blocked", "/profiles/userAAA", "create", null, PROFILE, "DENY"),

  // The whole point of dropping `name`: the Google display name must not have
  // a field to travel in, even if a future client tries to send one.
  tc("profile carrying real name blocked", "/profiles/userAAA", "create", ME, { ...PROFILE, name: "Finn Lütke" }, "DENY"),
  tc("profile with oversized username blocked", "/profiles/userAAA", "create", ME, { ...PROFILE, username: "x".repeat(17) }, "DENY"),
  tc("profile with non-string username blocked", "/profiles/userAAA", "create", ME, { ...PROFILE, username: 42 }, "DENY"),

  tc("claim a free username", "/usernames/finn", "create", ME, RESERVATION, "ALLOW"),
  tc("claim for someone else blocked", "/usernames/finn", "create", ME, { uid: FRIEND }, "DENY"),
  tc("claim with extra payload blocked", "/usernames/finn", "create", ME, { uid: ME, note: "x" }, "DENY"),
  tc("anon claim blocked", "/usernames/finn", "create", null, RESERVATION, "DENY"),
  tc("too-short username blocked", "/usernames/ab", "create", ME, RESERVATION, "DENY"),
  tc("too-long username blocked", "/usernames/" + "x".repeat(17), "create", ME, RESERVATION, "DENY"),
  tc("uppercase reservation blocked", "/usernames/Finn", "create", ME, RESERVATION, "DENY"),
  tc("username with spaces blocked", "/usernames/fi nn", "create", ME, RESERVATION, "DENY"),
  tc("read reservations", "/usernames/finn", "get", ME, null, "ALLOW"),
  tc("anon reservation read blocked", "/usernames/finn", "get", null, null, "DENY"),

  // The identity-theft cases: the reservation already exists and belongs to ME.
  tcExisting("stealing a held username blocked", "/usernames/finn", "update", FRIEND, { uid: FRIEND }, RESERVATION, "DENY"),
  tcExisting("deleting someone else's reservation blocked", "/usernames/finn", "delete", FRIEND, null, RESERVATION, "DENY"),
  tcExisting("re-claiming your own username", "/usernames/finn", "update", ME, RESERVATION, RESERVATION, "ALLOW"),
  tcExisting("releasing your own reservation", "/usernames/finn", "delete", ME, null, RESERVATION, "ALLOW"),

  // Mutual friending: the marker's document id must be the sender's own uid,
  // which is what stops one person filling someone's inbox with many docs.
  tc("announce yourself to a friend", "/profiles/userBBB/friendAdds/userAAA", "create", ME, ADD, "ALLOW"),
  tc("re-announcing is allowed", "/profiles/userBBB/friendAdds/userAAA", "update", ME, ADD, "ALLOW"),
  tc("announcing under someone else's id blocked", "/profiles/userBBB/friendAdds/userCCC", "create", ME, { from: "userCCC", at: 1 }, "DENY"),
  tc("forged sender blocked", "/profiles/userBBB/friendAdds/userAAA", "create", ME, { from: FRIEND, at: 1 }, "DENY"),
  tc("marker with payload blocked", "/profiles/userBBB/friendAdds/userAAA", "create", ME, { ...ADD, blob: "x".repeat(50) }, "DENY"),
  tc("anon announce blocked", "/profiles/userBBB/friendAdds/userAAA", "create", null, ADD, "DENY"),
  tc("read my own markers", "/profiles/userAAA/friendAdds/userBBB", "get", ME, null, "ALLOW"),
  tc("reading someone else's markers blocked", "/profiles/userBBB/friendAdds/userAAA", "get", ME, null, "DENY"),
  tc("clear my own marker", "/profiles/userAAA/friendAdds/userBBB", "delete", ME, null, "ALLOW"),
  tc("deleting someone else's marker blocked", "/profiles/userBBB/friendAdds/userAAA", "delete", ME, null, "DENY"),

  tc("nudge a friend", "/profiles/userBBB/nudges/n1", "create", ME, NUDGE, "ALLOW"),
  tc("forged nudge sender blocked", "/profiles/userBBB/nudges/n1", "create", ME, { ...NUDGE, from: FRIEND }, "DENY"),
  tc("nudge with payload blocked", "/profiles/userBBB/nudges/n1", "create", ME, { ...NUDGE, blob: "x".repeat(50) }, "DENY"),
  tc("read own nudges", "/profiles/userAAA/nudges/n1", "get", ME, null, "ALLOW"),
  tc("read friend's nudges blocked", "/profiles/userBBB/nudges/n1", "get", ME, null, "DENY"),
  tc("delete own nudge", "/profiles/userAAA/nudges/n1", "delete", ME, null, "ALLOW"),
  tc("delete friend's nudge blocked", "/profiles/userBBB/nudges/n1", "delete", ME, null, "DENY"),
  tc("anon nudge blocked", "/profiles/userBBB/nudges/n1", "create", null, NUDGE, "DENY"),
  // ---- the wipe guard on users/{uid} ----
  // 2026-08-12: a client holding an empty catalog wrote it over a real one,
  // twice in one day. The rule refuses to be the last link in that chain.
  tcExisting("emptying a real catalog blocked", "/users/userAAA", "update", ME,
    { subjects: [], cards: [], game: { xp: 0 }, updatedAt: 200 },
    { subjects: [SUBJECT], cards: [CARD], game: { xp: 3034 }, updatedAt: 100 }, "DENY"),
  tcExisting("emptying it with a fresh timestamp still blocked", "/users/userAAA", "update", ME,
    { subjects: [], cards: [CARD], game: { xp: 0 }, updatedAt: 999999 },
    { subjects: [SUBJECT], cards: [CARD], game: { xp: 3034 }, updatedAt: 100 }, "DENY"),
  tcExisting("dropping the cards array blocked", "/users/userAAA", "update", ME,
    { subjects: [SUBJECT], cards: [], updatedAt: 200 },
    { subjects: [SUBJECT], cards: [CARD], updatedAt: 100 }, "DENY"),

  // A deliberate delete says so, and the flag is only good for the write it
  // is stamped on.
  tcExisting("a declared delete goes through", "/users/userAAA", "update", ME,
    { subjects: [], cards: [], updatedAt: 200, clearedOnPurpose: 200 },
    { subjects: [SUBJECT], cards: [CARD], updatedAt: 100 }, "ALLOW"),
  tcExisting("a stale declaration doesn't authorise the next write", "/users/userAAA", "update", ME,
    { subjects: [], cards: [], updatedAt: 300, clearedOnPurpose: 200 },
    { subjects: [SUBJECT], cards: [CARD], updatedAt: 100 }, "DENY"),

  // Everything the app does normally must still work.
  tcExisting("ordinary catalog update", "/users/userAAA", "update", ME,
    { subjects: [SUBJECT, SUBJECT], cards: [CARD], game: { xp: 3100 }, updatedAt: 200 },
    { subjects: [SUBJECT], cards: [CARD], game: { xp: 3034 }, updatedAt: 100 }, "ALLOW"),
  tcExisting("per-card parent write, which omits cards entirely", "/users/userAAA", "update", ME,
    { subjects: [SUBJECT], game: { xp: 3100 }, updatedAt: 200, cards: [CARD] },
    { subjects: [SUBJECT], cards: [CARD], updatedAt: 100 }, "ALLOW"),
  tcExisting("stamping cardsMigratedAt on the way into per-card mode", "/users/userAAA", "update", ME,
    { subjects: [SUBJECT], cards: [CARD], cardsMigratedAt: 5 },
    { subjects: [SUBJECT], cards: [CARD] }, "ALLOW"),
  tcExisting("an account that was already empty", "/users/userAAA", "update", ME,
    { subjects: [], cards: [], updatedAt: 200 },
    { subjects: [], cards: [], updatedAt: 100 }, "ALLOW"),
  tcExisting("an account with no subjects field at all", "/users/userAAA", "update", ME,
    { cards: [CARD], updatedAt: 200 },
    { cards: [CARD], updatedAt: 100 }, "ALLOW"),
  tc("first write of a brand-new account", "/users/userAAA", "create", ME,
    { subjects: [], cards: [], game: { xp: 0 }, updatedAt: 1 }, "ALLOW"),
  tcExisting("someone else may still not touch it", "/users/userBBB", "update", ME,
    { subjects: [SUBJECT], updatedAt: 200 }, { subjects: [SUBJECT], updatedAt: 100 }, "DENY"),

  // The cards subcollection lost its {document=**} wildcard; it needs its own
  // match block, and per-card sync is dead without it.
  tc("own card read", "/users/userAAA/cards/k1", "get", ME, null, "ALLOW"),
  tc("own card write", "/users/userAAA/cards/k1", "create", ME, { front: "a", back: "b" }, "ALLOW"),
  tc("own card update", "/users/userAAA/cards/k1", "update", ME, { front: "a", back: "c" }, "ALLOW"),
  tc("own card delete", "/users/userAAA/cards/k1", "delete", ME, null, "ALLOW"),
  tc("OTHER card read blocked", "/users/userBBB/cards/k1", "get", ME, null, "DENY"),
  tc("OTHER card write blocked", "/users/userBBB/cards/k1", "create", ME, { front: "a" }, "DENY"),
  tc("anon card read blocked", "/users/userAAA/cards/k1", "get", null, null, "DENY"),

  tc("unknown collection blocked", "/whatever/doc1", "create", ME, { a: 1 }, "DENY"),
];

const res = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}:test`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    source: { files: [{ name: "firestore.rules", content: rules }] },
    testSuite: {
      testCases: cases.map(c => ({
        expectation: c.expect,
        request: c.request,
        ...(c.resource ? { resource: c.resource } : {}),
      })),
    },
  }),
});
if (res.status === 401) {
  // The cached firebase-tools token expires; without this hint an expired
  // credential reads exactly like a rules regression.
  console.error("Auth expired, not a rules failure. Refresh it with:\n  firebase projects:list\nthen run this again.");
  process.exit(1);
}
if (!res.ok) { console.error("API error", res.status, await res.text()); process.exit(1); }
const { testResults = [] } = await res.json();

let failures = 0;
cases.forEach((c, i) => {
  const state = testResults[i] && testResults[i].state;
  const ok = state === "SUCCESS";
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${c.name} [${c.expect}]${ok ? "" : ` -> ${state}`}`);
  if (!ok && testResults[i] && testResults[i].debugMessages) {
    console.log("     ", testResults[i].debugMessages[0]);
  }
});
console.log("");
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log(`all ${cases.length} firestore rules tests passed`);
