// Username rules and global-leaderboard ordering.
//
// The board is the part strangers see, so the things tested here are the ones
// that would be embarrassing in public: a name that renders badly or
// impersonates someone, a duplicate row, or last week's champion squatting on
// top of a fresh board.
//
// Run: node scripts/test-global.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/social.js", import.meta.url), "utf8");
function slice(from, to) {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`could not slice ${from}`);
  return src.slice(a, b).replace(/export /g, "");
}
const pure = [
  slice("const CODE_ALPHABET", "const profileRef"),
  slice("export const USERNAME_MIN", "// Claiming is a create"),
  slice("export function usernameCandidates", "export async function claimSuggestedUsername"),
  slice("export function mergeFriendAdds", "// A nudge is a single tap"),
  slice("export function buildGlobalBoard", "// Builds the weekly board"),
].join("\n");
const M = new Function(`${pure}; return { validateUsername, usernameKey, suggestUsername, usernameCandidates, buildGlobalBoard, mergeFriendAdds, codeForUid };`)();
const { validateUsername, usernameKey, suggestUsername, usernameCandidates, buildGlobalBoard, mergeFriendAdds } = M;

let failures = 0;
const ok = (n, c, x) => { if (c) console.log("  ✓", n); else { failures++; console.log("  ✗", n, x === undefined ? "" : JSON.stringify(x)); } };

console.log("username validation");
ok("plain name accepted", validateUsername("finn") === null);
ok("digits accepted", validateUsername("finn2026") === null);
ok("dash and underscore accepted", validateUsername("f-i_n") === null);
ok("exactly 3 accepted", validateUsername("abc") === null);
ok("exactly 16 accepted", validateUsername("x".repeat(16)) === null);
ok("empty rejected", validateUsername("") !== null);
ok("whitespace-only rejected", validateUsername("   ") !== null);
ok("too short rejected", validateUsername("ab") !== null);
ok("too long rejected", validateUsername("x".repeat(17)) !== null);
ok("spaces inside rejected", validateUsername("fi nn") !== null);
ok("null-safe", validateUsername(null) !== null);
ok("undefined-safe", validateUsername(undefined) !== null);
// The narrow character set is what stops "Fïnn" being passed off as "Finn".
ok("accented homoglyph rejected", validateUsername("Fïnn") !== null);
ok("cyrillic homoglyph rejected", validateUsername("Аnna") !== null);
ok("emoji rejected", validateUsername("finn🐱") !== null);
ok("surrounding space is trimmed, not rejected", validateUsername("  finn  ") === null);

console.log("reservation keys");
ok("case folds", usernameKey("Finn") === usernameKey("finn"));
ok("trims", usernameKey("  finn ") === "finn");
ok("Finn and finn collide", usernameKey("FINN") === "finn");
ok("null-safe", usernameKey(null) === "");
ok("suggestion is valid", validateUsername(suggestUsername("someUid000000000000000000")) === null);
ok("suggestion is stable", suggestUsername("abc") === suggestUsername("abc"));
ok("suggestion is lowercase", suggestUsername("abc") === suggestUsername("abc").toLowerCase());

console.log("global board");
const rows = [
  { uid: "u1", username: "anna", emoji: "🐱", weekXp: 410, streak: 23, level: 8 },
  { uid: "u2", username: "ben", emoji: "🦊", weekXp: 60, streak: 4, level: 4 },
  { uid: "me", username: "finn", emoji: "🦉", weekXp: 190, streak: 10, level: 5 },
];
const board = buildGlobalBoard(rows, "me", null);
ok("everyone is listed", board.length === 3, board.length);
ok("sorted by weekly XP", board.map(r => r.username).join(",") === "anna,finn,ben", board.map(r => r.username));
ok("positions are 1..n", board.every((r, i) => r.position === i + 1));
ok("my row is marked", board.filter(r => r.isMe).length === 1);
ok("the marked row is mine", board.find(r => r.isMe).uid === "me");

const dupes = buildGlobalBoard([...rows, { uid: "u1", username: "anna", weekXp: 410 }], "me", null);
ok("a repeated uid appears once", dupes.length === 3, dupes.length);

const nameless = buildGlobalBoard([...rows, { uid: "u9", username: "", weekXp: 9999 }], "me", null);
ok("a profile without a username is never shown", !nameless.some(r => r.uid === "u9"));

const missing = buildGlobalBoard([{ uid: "u5", username: "zoe" }], "me", null);
ok("missing weekXp counts as 0", missing[0].weekXp === 0);
ok("missing streak counts as 0", missing[0].streak === 0);
ok("missing level defaults to 1", missing[0].level === 1);
ok("missing emoji gets a default", missing[0].emoji === "🦉");

console.log("my own row");
const me = { username: "finn", emoji: "🦉", weekXp: 190, streak: 10, level: 5 };
const merged = buildGlobalBoard([rows[0], rows[1]], "me", me);
ok("I'm added when the server hasn't got me yet", merged.some(r => r.isMe), merged.map(r => r.username));
ok("and placed by XP", merged.map(r => r.username).join(",") === "anna,finn,ben");
ok("still exactly one of me", merged.filter(r => r.isMe).length === 1);
const noDup = buildGlobalBoard(rows, "me", me);
ok("no duplicate when the server already has me", noDup.filter(r => r.uid === "me").length === 1);
ok("a nameless me is not forced on", !buildGlobalBoard([rows[0]], "me", { username: "" }).some(r => r.isMe));

console.log("ties and edges");
const tied = buildGlobalBoard([
  { uid: "a", username: "zoe", weekXp: 100, streak: 2, level: 3 },
  { uid: "b", username: "amy", weekXp: 100, streak: 9, level: 3 },
  { uid: "c", username: "bob", weekXp: 100, streak: 2, level: 3 },
], "me", null);
ok("XP ties broken by streak", tied[0].username === "amy", tied.map(r => r.username));
ok("full ties fall back to name order", tied.map(r => r.username).join(",") === "amy,bob,zoe");
ok("empty input gives an empty board", buildGlobalBoard([], "me", null).length === 0);
ok("null input doesn't crash", buildGlobalBoard(null, "me", null).length === 0);
ok("junk rows are skipped", buildGlobalBoard([null, undefined, { uid: "x" }], "me", null).length === 0);

console.log("nobody is left nameless");
// Signing in used to publish an empty username, which meant no board row and
// "Anonymous" to friends. A name is now claimed automatically, so every
// candidate it might land on has to be a legal one.
const cands = usernameCandidates("someUid000000000000000000", () => 0.5);
ok("offers several fallbacks", cands.length >= 5, cands.length);
ok("every candidate is valid", cands.every(c => validateUsername(c) === null), cands.filter(c => validateUsername(c)));
ok("all are within the length limit", cands.every(c => c.length <= 16), cands.filter(c => c.length > 16));
ok("all are distinct", new Set(cands).size === cands.length, cands);
ok("the first is the plain suggestion", cands[0] === suggestUsername("someUid000000000000000000"));
ok("candidates are stable for a uid", usernameCandidates("abc", () => 0.5).join() === usernameCandidates("abc", () => 0.5).join());
ok("different uids get different stems", usernameCandidates("abc", () => 0.5)[0] !== usernameCandidates("xyz", () => 0.5)[0]);
// A random last resort must stay legal at both ends of its range.
for (const r of [0, 0.999999]) {
  const c = usernameCandidates("someUid000000000000000000", () => r);
  ok(`random fallback at ${r} is valid`, validateUsername(c[c.length - 1]) === null, c[c.length - 1]);
}
// The 16-char ceiling is the thing most likely to break a generated name.
const longStem = usernameCandidates("z".repeat(40), () => 0.5);
ok("a long uid still yields legal names", longStem.every(c => validateUsername(c) === null), longStem);

console.log("mutual friending");
const add = (uid) => ({ id: uid, from: uid, at: 1 });
ok("an incoming add joins the list", mergeFriendAdds(["a"], [add("b")], "me").sort().join(",") === "a,b");
ok("merging is a union, not an append", mergeFriendAdds(["a", "b"], [add("b")], "me").length === 2);
ok("re-merging the same marker is a no-op", mergeFriendAdds(mergeFriendAdds([], [add("b")], "me"), [add("b")], "me").length === 1);
ok("several adds at once", mergeFriendAdds([], [add("a"), add("b"), add("c")], "me").length === 3);
ok("my own uid is never added", !mergeFriendAdds([], [add("me")], "me").includes("me"));
ok("existing friends are kept", mergeFriendAdds(["x", "y"], [], "me").sort().join(",") === "x,y");
ok("no adds leaves the list alone", mergeFriendAdds(["x"], [], "me").length === 1);
ok("null friends list survives", mergeFriendAdds(null, [add("b")], "me").join(",") === "b");
ok("null adds survive", mergeFriendAdds(["a"], null, "me").join(",") === "a");
ok("junk markers are skipped", mergeFriendAdds(["a"], [null, {}, add("b")], "me").sort().join(",") === "a,b");
// The doc id is the sender's uid, so a marker missing its `from` still works.
ok("falls back to the document id", mergeFriendAdds([], [{ id: "b", at: 1 }], "me").join(",") === "b");

console.log("");
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log("all global board tests passed");
