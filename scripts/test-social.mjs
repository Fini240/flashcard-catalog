// Friend-code smoke test: uniqueness, stability, character distribution.
// Run: node scripts/test-social.mjs
import { readFileSync } from "node:fs";

// social.js imports a Capacitor plugin that can't load in bare Node, so we
// evaluate just the pure functions out of the source rather than importing it.
const src = readFileSync(new URL("../src/social.js", import.meta.url), "utf8");
const start = src.indexOf("const CODE_ALPHABET");
const end = src.indexOf("const profileRef");
const pure = src.slice(start, end).replace(/export /g, "");
const mod = new Function(`${pure}; return { codeForUid, normalizeCode };`)();
const { codeForUid, normalizeCode } = mod;

let failures = 0;
const ok = (n, c, x) => { if (c) console.log("  ✓", n); else { failures++; console.log("  ✗", n, x === undefined ? "" : JSON.stringify(x)); } };

// Firebase uids are 28 chars of [A-Za-z0-9]
const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function fakeUid(i) {
  let s = "", x = i * 2654435761 % 4294967296;
  for (let k = 0; k < 28; k++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    s += ALPHA[x % ALPHA.length];
  }
  return s;
}

const N = 200000;
const seen = new Map();
let collisions = 0;
const charCounts = {};
for (let i = 0; i < N; i++) {
  const uid = fakeUid(i);
  const code = codeForUid(uid);
  if (code.length !== 6) { failures++; console.log("  ✗ bad length", code); break; }
  for (const ch of code) charCounts[ch] = (charCounts[ch] || 0) + 1;
  if (seen.has(code)) collisions++;
  else seen.set(code, uid);
}
const space = Math.pow(31, 6);
const expected = (N * (N - 1)) / (2 * space);
console.log("friend codes");
ok(`${N} uids → ${seen.size} distinct codes, ${collisions} collisions (birthday expectation ≈ ${expected.toFixed(1)})`,
   collisions <= expected * 4, { collisions, expected });

const used = Object.keys(charCounts).length;
ok(`uses ${used}/31 alphabet characters`, used >= 28, charCounts);
const counts = Object.values(charCounts);
const min = Math.min(...counts), max = Math.max(...counts);
ok(`character distribution is even (min ${min}, max ${max})`, max / min < 1.6, { min, max });

ok("stable across calls", codeForUid("abc123") === codeForUid("abc123"));
ok("similar uids differ", codeForUid("aaaaaaaaaaaa1") !== codeForUid("aaaaaaaaaaaa2"));
ok("prefix-sharing uids differ", codeForUid("uEjTk9xQzPl0aaaa") !== codeForUid("uEjTk9xQzPl0aaab"));
ok("no ambiguous characters", /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(codeForUid("someUserId")));
ok("empty uid doesn't crash", codeForUid("").length === 6);
ok("undefined uid doesn't crash", codeForUid(undefined).length === 6);

console.log("code normalisation");
ok("lowercases and strips", normalizeCode(" ab-3d 9f ") === "AB3D9F");
ok("truncates to 6", normalizeCode("ABCDEFGHIJ") === "ABCDEF");
ok("empty in, empty out", normalizeCode("") === "");
ok("null-safe", normalizeCode(null) === "");

console.log("");
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log("all social tests passed");
