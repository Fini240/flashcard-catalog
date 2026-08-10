// Leaderboard assembly test — the pure buildBoard function, extracted from
// social.js the same way test-social.mjs extracts the code generator.
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/social.js", import.meta.url), "utf8");
const start = src.indexOf("export function buildBoard");
const pure = src.slice(start).replace(/export /g, "");
const { buildBoard } = new Function(`${pure}; return { buildBoard };`)();

let failures = 0;
const ok = (n, c, x) => { if (c) console.log("  ✓", n); else { failures++; console.log("  ✗", n, x === undefined ? "" : JSON.stringify(x)); } };
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), { got: a, want: b });

const WK = "2026-08-10";
const me = { uid: "me", name: "You", emoji: "🦉", weekXp: 100, streak: 5, level: 3 };
const p = (uid, name, weekXp, streak = 0, weekKey = WK, level = 1) =>
  ({ uid, name, emoji: "🐱", weekXp, streak, weekKey, level });

console.log("leaderboard");
{
  const b = buildBoard(me, [], WK);
  eq("solo board has one row", b.length, 1);
  ok("that row is me", b[0].isMe && b[0].position === 1);
}
{
  const b = buildBoard(me, [p("a", "Anna", 250), p("b", "Ben", 40)], WK);
  eq("sorted by weekly XP", b.map(r => r.name), ["Anna", "You", "Ben"]);
  eq("positions are 1..n", b.map(r => r.position), [1, 2, 3]);
  eq("exactly one isMe", b.filter(r => r.isMe).length, 1);
}
{
  // The bug this guards: a friend who hasn't opened the app since last week
  // still has last week's weekXp on their profile document.
  const b = buildBoard(me, [p("a", "StaleAnna", 9999, 3, "2026-08-03")], WK);
  eq("stale week XP is zeroed", b.find(r => r.name === "StaleAnna").weekXp, 0);
  eq("so I lead the board", b[0].name, "You");
}
{
  const b = buildBoard(me, [p("a", "Anna", 100, 9), p("b", "Ben", 100, 1)], WK);
  eq("XP ties broken by streak", b.map(r => r.name), ["Anna", "You", "Ben"]);
}
{
  const tie = { ...me, weekXp: 50, streak: 2 };
  const b = buildBoard(tie, [p("a", "Anna", 50, 2), p("b", "Bob", 50, 2)], WK);
  eq("full ties fall back to name order", b.map(r => r.name), ["Anna", "Bob", "You"]);
  ok("still stable on re-run", JSON.stringify(b) === JSON.stringify(buildBoard(tie, [p("a", "Anna", 50, 2), p("b", "Bob", 50, 2)], WK)));
}
{
  const b = buildBoard(me, [{ uid: "x", name: "Broken", emoji: "🐱", weekKey: WK }], WK);
  eq("missing weekXp treated as 0", b.find(r => r.name === "Broken").weekXp, 0);
  eq("missing streak treated as 0", b.find(r => r.name === "Broken").streak, 0);
  eq("missing level defaults to 1", b.find(r => r.name === "Broken").level, 1);
}
{
  const many = Array.from({ length: 30 }, (_, i) => p(`u${i}`, `User${String(i).padStart(2, "0")}`, i * 10, i));
  const b = buildBoard(me, many, WK);
  eq("30 friends + me", b.length, 31);
  ok("descending XP throughout", b.every((r, i) => i === 0 || b[i - 1].weekXp >= r.weekXp));
  ok("my row is present", b.some(r => r.isMe));
}

console.log("");
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log("all leaderboard tests passed");
