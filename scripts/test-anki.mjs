// Tests for the AnkiDroid (.apkg) importer.
//
// The field cleanup is tested directly, and the database read is tested against
// real SQLite collections built here in both of Anki's schema generations —
// the legacy one that keeps decks as JSON inside `col`, and the modern one with
// a proper `decks` table. That's the part most likely to break on a real
// export, so it's tested against a real database rather than a mock.
//
// Run: node scripts/test-anki.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const initSqlJs = require("sql.js");

// ankiImport.js imports a Vite-specific `?url` asset that can't resolve in bare
// Node, so the pure logic and the extraction are evaluated out of the source —
// the approach the other suites in here use.
const src = readFileSync(new URL("../src/ankiImport.js", import.meta.url), "utf8");
function slice(from, to) {
  const a = src.indexOf(from);
  const b = to ? src.indexOf(to, a) : src.length;
  if (a < 0 || b < 0) throw new Error(`could not slice ${from}`);
  return src.slice(a, b).replace(/export /g, "");
}
const pure = [
  'const FIELD_SEP = "\\x1f";',
  slice("const ENTITIES = {", "// ---------- cloze ----------"),
  slice("const CLOZE_RE", "// ---------- deck names ----------"),
  slice("export function splitDeckName", "// ---------- database ----------"),
  slice("function firstResult", null),
].join("\n");
const M = new Function(`${pure}; return { htmlToText, stripMedia, cleanField, hasCloze, expandCloze, splitDeckName, extract };`)();
const { htmlToText, stripMedia, cleanField, hasCloze, expandCloze, splitDeckName, extract } = M;

let failures = 0;
const ok = (n, c, x) => { if (c) console.log("  ✓", n); else { failures++; console.log("  ✗", n, x === undefined ? "" : JSON.stringify(x)); } };
const SQL = await initSqlJs();
const SEP = "\x1f";

console.log("field cleanup");
ok("plain text survives", htmlToText("Bonjour") === "Bonjour");
ok("tags are stripped", htmlToText("<b>bold</b> text") === "bold text");
ok("br becomes a newline", htmlToText("a<br>b") === "a\nb");
ok("self-closing br too", htmlToText("a<br />b") === "a\nb");
ok("div close becomes a newline", htmlToText("<div>a</div><div>b</div>") === "a\nb");
ok("list items get bullets", htmlToText("<ul><li>one</li><li>two</li></ul>") === "• one\n• two", htmlToText("<ul><li>one</li><li>two</li></ul>"));
ok("nbsp becomes a space", htmlToText("a&nbsp;b") === "a b");
ok("ampersand entity", htmlToText("Tom &amp; Jerry") === "Tom & Jerry");
ok("angle entities", htmlToText("&lt;tag&gt;") === "<tag>");
ok("numeric entity", htmlToText("caf&#233;") === "café", htmlToText("caf&#233;"));
ok("runaway blank lines collapse", htmlToText("a<br><br><br><br>b") === "a\n\nb");
ok("whitespace is trimmed", htmlToText("  <div> spaced </div>  ") === "spaced");
ok("empty in, empty out", htmlToText("") === "");
ok("null-safe", htmlToText(null) === "");
ok("style tags don't leak content markers", htmlToText('<span style="color:red">red</span>') === "red");

console.log("media");
ok("sound tag detected", stripMedia("[sound:hello.mp3]").hadMedia === true);
ok("sound tag removed", cleanField("hola [sound:hello.mp3]").text === "hola");
ok("img detected", stripMedia('<img src="a.png">').hadMedia === true);
ok("img removed", cleanField('bird <img src="a.png">').text === "bird");
ok("image-only field becomes empty", cleanField('<img src="a.png">').text === "");
ok("plain field reports no media", stripMedia("just text").hadMedia === false);

console.log("cloze");
ok("detects a cloze", hasCloze("The capital is {{c1::Paris}}"));
ok("plain text is not a cloze", !hasCloze("The capital is Paris"));
{
  const cards = expandCloze("The capital of France is {{c1::Paris}}");
  ok("one marker makes one card", cards.length === 1, cards);
  ok("the blank replaces the answer", cards[0].front === "The capital of France is […]", cards[0].front);
  ok("the answer is the back", cards[0].back === "Paris");
}
{
  const cards = expandCloze("{{c1::Alpha}} comes before {{c2::Beta}}");
  ok("two markers make two cards", cards.length === 2);
  ok("card 1 hides only c1", cards[0].front === "[…] comes before Beta", cards[0].front);
  ok("card 2 hides only c2", cards[1].front === "Alpha comes before […]", cards[1].front);
  ok("each has its own answer", cards[0].back === "Alpha" && cards[1].back === "Beta");
}
{
  const cards = expandCloze("The {{c1::mitochondrion::organelle}} makes ATP");
  ok("a hint labels the blank", cards[0].front === "The [organelle] makes ATP", cards[0].front);
  ok("the hint is not the answer", cards[0].back === "mitochondrion");
}
{
  const cards = expandCloze("{{c1::A}} and {{c1::B}} share an index");
  ok("a repeated index makes one card", cards.length === 1);
  ok("and both answers", cards[0].back === "A, B", cards[0].back);
}
ok("html inside a cloze is cleaned", expandCloze("Say {{c1::<b>hola</b>}}")[0].back === "hola");
ok("non-cloze text yields nothing", expandCloze("no markers here").length === 0);
ok("cloze indexes out of order still sort", expandCloze("{{c2::B}} {{c1::A}}")[0].back === "A");

console.log("deck names");
ok("a flat name is the subject", splitDeckName("Spanish").subject === "Spanish");
ok("a flat name has no category", splitDeckName("Spanish").category === null);
ok("legacy :: splits", splitDeckName("Spanish::Verbs").category === "Verbs");
ok("new-schema separator splits", splitDeckName("Spanish\x1fVerbs").subject === "Spanish");
ok("deep nesting folds into the category", splitDeckName("A::B::C").category === "B · C", splitDeckName("A::B::C").category);
ok("empty segments are dropped", splitDeckName("A::::B").category === "B");
ok("an empty name falls back", splitDeckName("").subject === "Anki import");
ok("null-safe", splitDeckName(null).subject === "Anki import");

// ---------------------------------------------------------------------------

function legacyDb({ decks, notes, cards }) {
  const db = new SQL.Database();
  db.run(`CREATE TABLE col (id integer primary key, crt integer, mod integer, scm integer,
    ver integer, dty integer, usn integer, ls integer, conf text, models text, decks text,
    dconf text, tags text);`);
  db.run(`CREATE TABLE notes (id integer primary key, guid text, mid integer, mod integer,
    usn integer, tags text, flds text, sfld integer, csum integer, flags integer, data text);`);
  db.run(`CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer,
    mod integer, usn integer, type integer, queue integer, due integer, ivl integer,
    factor integer, reps integer, lapses integer, left integer, odue integer, odid integer,
    flags integer, data text);`);
  db.run("INSERT INTO col VALUES (1,0,0,0,11,0,0,0,'{}','{}',?,'{}','')", [JSON.stringify(decks)]);
  for (const n of notes) {
    db.run("INSERT INTO notes VALUES (?,?,?,0,0,'',?,0,0,0,'')", [n.id, `g${n.id}`, n.mid || 1, n.flds]);
  }
  for (const c of cards) {
    db.run("INSERT INTO cards VALUES (?,?,?,?,0,0,0,0,0,0,0,0,0,0,0,0,0,'')", [c.id, c.nid, c.did, c.ord || 0]);
  }
  return db;
}

function modernDb({ decks, notes, cards }) {
  const db = new SQL.Database();
  db.run(`CREATE TABLE col (id integer primary key, crt integer, mod integer, scm integer,
    ver integer, dty integer, usn integer, ls integer, conf text, models text, decks text,
    dconf text, tags text);`);
  db.run(`CREATE TABLE decks (id integer primary key, name text, mtime_secs integer,
    usn integer, common blob, kind blob);`);
  db.run(`CREATE TABLE notes (id integer primary key, guid text, mid integer, mod integer,
    usn integer, tags text, flds text, sfld integer, csum integer, flags integer, data text);`);
  db.run(`CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer,
    mod integer, usn integer, type integer, queue integer, due integer, ivl integer,
    factor integer, reps integer, lapses integer, left integer, odue integer, odid integer,
    flags integer, data text);`);
  // The modern schema empties the legacy JSON columns.
  db.run("INSERT INTO col VALUES (1,0,0,0,18,0,0,0,'{}','','','','')");
  for (const [id, name] of Object.entries(decks)) {
    db.run("INSERT INTO decks VALUES (?,?,0,0,NULL,NULL)", [Number(id), name]);
  }
  for (const n of notes) {
    db.run("INSERT INTO notes VALUES (?,?,?,0,0,'',?,0,0,0,'')", [n.id, `g${n.id}`, n.mid || 1, n.flds]);
  }
  for (const c of cards) {
    db.run("INSERT INTO cards VALUES (?,?,?,?,0,0,0,0,0,0,0,0,0,0,0,0,0,'')", [c.id, c.nid, c.did, c.ord || 0]);
  }
  return db;
}

const FIXTURE = {
  notes: [
    { id: 1, flds: `hola${SEP}hello` },
    { id: 2, flds: `adiós${SEP}goodbye` },
    { id: 3, flds: `The capital of France is {{c1::Paris}}` },
    { id: 4, flds: `<b>gato</b>${SEP}cat<br>feline` },
    { id: 5, flds: `${SEP}` },                                  // empty both sides
    { id: 6, flds: `<img src="x.png">${SEP}an image` },          // media-only front
    { id: 7, flds: `perro${SEP}dog${SEP}noun` },                  // three fields
  ],
  cards: [
    { id: 11, nid: 1, did: 100 }, { id: 12, nid: 2, did: 100 },
    { id: 13, nid: 3, did: 200 }, { id: 14, nid: 4, did: 100 },
    { id: 15, nid: 5, did: 100 }, { id: 16, nid: 6, did: 100 },
    { id: 17, nid: 7, did: 100 },
  ],
};

for (const [label, build, decks] of [
  ["legacy schema", legacyDb, { 100: { name: "Spanish::Basics" }, 200: { name: "Geography" } }],
  ["modern schema", modernDb, { 100: `Spanish${SEP}Basics`, 200: "Geography" }],
]) {
  console.log(label);
  const built = build({ decks, ...FIXTURE });
  // Round-trip through bytes, the way a real import arrives.
  const db = new SQL.Database(built.export());
  built.close();
  const out = extract(db);
  const byName = Object.fromEntries(out.decks.map(d => [d.subject, d]));

  ok("both decks found", out.decks.length === 2, out.decks.map(d => d.name));
  ok("nested deck splits into subject", !!byName.Spanish, Object.keys(byName));
  ok("and a subcategory", byName.Spanish && byName.Spanish.category === "Basics");
  ok("flat deck has no subcategory", byName.Geography && byName.Geography.category === null);
  ok("cards land in the right deck", byName.Spanish.cards.length === 4, byName.Spanish.cards.length);
  ok("simple pair imported", byName.Spanish.cards.some(c => c.front === "hola" && c.back === "hello"));
  ok("html is cleaned on the way in", byName.Spanish.cards.some(c => c.front === "gato" && c.back === "cat\nfeline"));
  ok("extra fields join the back", byName.Spanish.cards.some(c => c.front === "perro" && c.back === "dog\nnoun"), byName.Spanish.cards);
  ok("cloze became a card", byName.Geography.cards.some(c => c.back === "Paris"));
  ok("empty note skipped", !byName.Spanish.cards.some(c => !c.front || !c.back));
  ok("image-only front skipped", !byName.Spanish.cards.some(c => c.back === "an image"));
  ok("total counted", out.totals.cards === 5, out.totals);
  ok("media skip is reported", out.warnings.some(w => /image or audio/.test(w)), out.warnings);
  ok("empty skip is reported", out.warnings.some(w => /empty side/.test(w)));
  ok("cloze conversion is reported", out.warnings.some(w => /cloze/.test(w)));
  db.close();
}

console.log("awkward collections");
{
  // Notes with no matching card row at all — should still import, under the
  // fallback deck rather than vanishing.
  const built = legacyDb({ decks: {}, notes: [{ id: 1, flds: `a${SEP}b` }], cards: [] });
  const out = extract(new SQL.Database(built.export()));
  built.close();
  ok("orphan notes still import", out.totals.cards === 1, out.totals);
  ok("under the fallback subject", out.decks[0].subject === "Anki import", out.decks[0]);
}
{
  const built = legacyDb({ decks: {}, notes: [], cards: [] });
  const out = extract(new SQL.Database(built.export()));
  built.close();
  ok("an empty collection is not an error", out.totals.cards === 0);
  ok("and reports no decks", out.decks.length === 0);
}
{
  // Unreadable deck JSON must not sink the import.
  const db = new SQL.Database();
  db.run(`CREATE TABLE col (id integer primary key, decks text);`);
  db.run(`CREATE TABLE notes (id integer primary key, mid integer, flds text);`);
  db.run(`CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer);`);
  db.run("INSERT INTO col VALUES (1,'{not json')");
  db.run("INSERT INTO notes VALUES (1,1,?)", [`x${SEP}y`]);
  db.run("INSERT INTO cards VALUES (1,1,100,0)");
  const out = extract(new SQL.Database(db.export()));
  db.close();
  ok("broken deck JSON still imports the notes", out.totals.cards === 1, out.totals);
}
{
  // A note whose first card is in a later deck: ord ordering decides.
  const built = legacyDb({
    decks: { 100: { name: "First" }, 200: { name: "Second" } },
    notes: [{ id: 1, flds: `q${SEP}a` }],
    cards: [{ id: 2, nid: 1, did: 200, ord: 1 }, { id: 1, nid: 1, did: 100, ord: 0 }],
  });
  const out = extract(new SQL.Database(built.export()));
  built.close();
  ok("the first card's deck wins", out.decks[0].subject === "First", out.decks[0].subject);
}

// ---------------------------------------------------------------------------
// The archive layer, against real .apkg files built here — including the
// zstd-compressed shape that Anki 2.1.50+ and current AnkiDroid produce.
console.log("the .apkg archive itself");
const JSZip = require("jszip");
const fzstd = require("fzstd");
const { zstdCompressSync } = require("node:zlib");
const collectionBytes = new Function("JSZip", "fzstd", `${slice("export async function collectionBytes", "export async function parseApkg")}; return collectionBytes;`)(JSZip, fzstd);

const sampleDb = legacyDb({
  decks: { 100: { name: "Zip test" } },
  notes: [{ id: 1, flds: `q${SEP}a` }],
  cards: [{ id: 1, nid: 1, did: 100 }],
});
const dbBytes = sampleDb.export();
sampleDb.close();

async function pack(entries) {
  const zip = new JSZip();
  for (const [name, data] of Object.entries(entries)) zip.file(name, data);
  return zip.generateAsync({ type: "arraybuffer" });
}
const readsBack = async (buf) => {
  const out = await collectionBytes(buf, { JSZip, fzstd });
  const db = new SQL.Database(out);
  const r = extract(db);
  db.close();
  return r.totals.cards;
};

ok("plain collection.anki2", await readsBack(await pack({ "collection.anki2": dbBytes, media: "{}" })) === 1);
ok("collection.anki21", await readsBack(await pack({ "collection.anki21": dbBytes, media: "{}" })) === 1);
ok("zstd collection.anki21b", await readsBack(await pack({
  "collection.anki21b": zstdCompressSync(Buffer.from(dbBytes)), media: "{}",
})) === 1);

// The modern export ships a deliberately useless legacy file alongside the real
// one; picking the wrong entry yields an empty import rather than an error, so
// this is worth pinning down.
{
  const decoy = legacyDb({ decks: {}, notes: [], cards: [] });
  const decoyBytes = decoy.export();
  decoy.close();
  const buf = await pack({
    "collection.anki2": decoyBytes,
    "collection.anki21b": zstdCompressSync(Buffer.from(dbBytes)),
    media: "{}",
  });
  ok("the zstd entry wins over the legacy decoy", await readsBack(buf) === 1);
}

const rejects = async (buf, match) => {
  try { await collectionBytes(buf, { JSZip, fzstd }); return false; }
  catch (e) { return match.test(e.message); }
};
ok("a non-zip is refused clearly", await rejects(new TextEncoder().encode("not a zip at all").buffer, /isn't a readable Anki package/));
ok("a zip without a collection is refused clearly", await rejects(await pack({ "readme.txt": "hello" }), /No Anki collection/));
ok("undecompressable zstd names the export checkbox", await rejects(await pack({ "collection.anki21b": new Uint8Array([1, 2, 3, 4]) }), /Support older Anki versions/));

console.log("");
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log("all anki import tests passed");
