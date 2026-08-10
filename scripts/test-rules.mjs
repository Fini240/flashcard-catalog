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
const RESERVATION = { uid: ME };

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

  tc("nudge a friend", "/profiles/userBBB/nudges/n1", "create", ME, NUDGE, "ALLOW"),
  tc("forged nudge sender blocked", "/profiles/userBBB/nudges/n1", "create", ME, { ...NUDGE, from: FRIEND }, "DENY"),
  tc("nudge with payload blocked", "/profiles/userBBB/nudges/n1", "create", ME, { ...NUDGE, blob: "x".repeat(50) }, "DENY"),
  tc("read own nudges", "/profiles/userAAA/nudges/n1", "get", ME, null, "ALLOW"),
  tc("read friend's nudges blocked", "/profiles/userBBB/nudges/n1", "get", ME, null, "DENY"),
  tc("delete own nudge", "/profiles/userAAA/nudges/n1", "delete", ME, null, "ALLOW"),
  tc("delete friend's nudge blocked", "/profiles/userBBB/nudges/n1", "delete", ME, null, "DENY"),
  tc("anon nudge blocked", "/profiles/userBBB/nudges/n1", "create", null, NUDGE, "DENY"),
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
