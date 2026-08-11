// ---------------------------------------------------------------------------
// Importing an AnkiDroid deck (.apkg / .colpkg).
//
// An Anki package is a ZIP holding a whole SQLite collection, so this is a real
// database read rather than a text parse. Three things make it awkward, and all
// three are handled here:
//
//   1. Anki changed its schema. Before 2.1.28 the deck and note-type tables
//      live as JSON blobs inside a single `col` row; after it they are proper
//      tables. Both shapes are still in the wild — AnkiDroid's export dialog
//      has a "support older Anki versions" checkbox — so both are read.
//   2. Anki 2.1.50+ stores the database zstd-compressed as `collection.anki21b`
//      and keeps a decoy legacy file next to it for old clients.
//   3. Fields are HTML, not text. They carry markup, entities, media
//      references and cloze markers, none of which belong on a flashcard.
//
// What we deliberately do NOT do: import media. Images and audio stay behind,
// and a card that depended on them says so rather than arriving silently empty.
// ---------------------------------------------------------------------------
import JSZip from "jszip";
import * as fzstd from "fzstd";
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

// Loading a collection means holding the whole database in memory. Anki
// collections with years of media can be enormous; the cards themselves never
// are, so a refusal with a clear reason beats an out-of-memory crash.
const MAX_BYTES = 120 * 1024 * 1024;

const FIELD_SEP = "\x1f";

export function isAnkiFile(name) {
  const lower = (name || "").toLowerCase();
  return lower.endsWith(".apkg") || lower.endsWith(".colpkg");
}

let sqlPromise = null;
function loadSql() {
  // sql.js fetches its WASM lazily, so an app that never imports an Anki deck
  // never pays for it.
  if (!sqlPromise) sqlPromise = initSqlJs({ locateFile: () => wasmUrl });
  return sqlPromise;
}

// ---------- text cleanup ----------

const ENTITIES = {
  "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
  "&quot;": '"', "&#39;": "'", "&apos;": "'",
};

// Anki fields are HTML. Block-level markup is the author's line breaks, so it
// becomes newlines rather than vanishing into a run-on sentence.
export function htmlToText(html) {
  if (!html) return "";
  let s = String(html);
  s = s.replace(/<\s*(br|hr)\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\s*\/\s*(div|p|li|tr|h[1-6])\s*>/gi, "\n");
  s = s.replace(/<\s*li\s*[^>]*>/gi, "• ");
  s = s.replace(/<[^>]*>/g, "");
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  s = s.replace(/&[a-z]+;|&#\d+;/gi, (m) => (m in ENTITIES ? ENTITIES[m] : m));
  for (const [k, v] of Object.entries(ENTITIES)) s = s.split(k).join(v);
  s = s.replace(/ /g, " ");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.split("\n").map(l => l.trim()).join("\n").trim();
}

// Media can't come along, so it's stripped — but a field that was *only* an
// image would otherwise become an empty side, which is why the caller checks
// for that and drops the card with a count rather than importing a blank.
export function stripMedia(html) {
  if (!html) return { text: "", hadMedia: false };
  let hadMedia = false;
  let s = String(html);
  if (/\[sound:[^\]]*\]/i.test(s)) { hadMedia = true; s = s.replace(/\[sound:[^\]]*\]/gi, " "); }
  if (/<\s*img[^>]*>/i.test(s)) { hadMedia = true; s = s.replace(/<\s*img[^>]*>/gi, " "); }
  if (/<\s*(audio|video)[\s\S]*?<\s*\/\s*(audio|video)\s*>/i.test(s)) {
    hadMedia = true;
    s = s.replace(/<\s*(audio|video)[\s\S]*?<\s*\/\s*(audio|video)\s*>/gi, " ");
  }
  return { text: s, hadMedia };
}

export function cleanField(html) {
  const { text, hadMedia } = stripMedia(html);
  return { text: htmlToText(text), hadMedia };
}

// ---------- cloze ----------

const CLOZE_RE = /\{\{c(\d+)::([\s\S]*?)\}\}/g;

export function hasCloze(text) {
  CLOZE_RE.lastIndex = 0;
  return CLOZE_RE.test(String(text || ""));
}

// Anki turns one cloze note into one card per marker, and so do we: for c1 the
// c1 blanks are hidden and every other cloze is revealed, which is exactly what
// Anki shows. A hint ({{c1::answer::hint}}) becomes the blank's label, because
// that's what it is for.
export function expandCloze(html) {
  const { text: withoutMedia, hadMedia } = stripMedia(html);
  const raw = String(withoutMedia || "");
  const indexes = new Set();
  let m;
  CLOZE_RE.lastIndex = 0;
  while ((m = CLOZE_RE.exec(raw)) !== null) indexes.add(Number(m[1]));
  if (!indexes.size) return [];

  const out = [];
  for (const n of [...indexes].sort((a, b) => a - b)) {
    const answers = [];
    const front = raw.replace(CLOZE_RE, (_full, idx, body) => {
      const [answer, hint] = String(body).split("::");
      if (Number(idx) !== n) return answer;
      answers.push(htmlToText(answer));
      return hint ? `[${htmlToText(hint)}]` : "[…]";
    });
    const frontText = htmlToText(front);
    const backText = answers.filter(Boolean).join(", ");
    if (frontText && backText) out.push({ front: frontText, back: backText, hadMedia });
  }
  return out;
}

// ---------- deck names ----------

// Anki nests decks with "::" in the legacy schema and \x1f in the new one.
// Both collapse to the same shape here: a top-level subject and, at most, one
// subcategory — the app's own model — with any deeper levels folded into the
// subcategory name so nothing is silently lost.
export function splitDeckName(name) {
  const parts = String(name || "")
    // eslint-disable-next-line no-control-regex -- \x1f is Anki's own separator
    .split(/\x1f|::/)
    .map(p => p.trim())
    .filter(Boolean);
  if (!parts.length) return { subject: "Anki import", category: null };
  const subject = parts[0];
  const category = parts.length > 1 ? parts.slice(1).join(" · ") : null;
  return { subject, category };
}

// ---------- database ----------

function firstResult(db, sql) {
  try {
    const res = db.exec(sql);
    return res && res.length ? res[0] : null;
  } catch {
    return null;
  }
}

function rowsOf(result) {
  if (!result) return [];
  const { columns, values } = result;
  return values.map(v => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
}

function tableExists(db, name) {
  const r = firstResult(db, `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`);
  return !!(r && r.values && r.values.length);
}

// Deck id -> display name, across both schema generations.
function readDecks(db) {
  const map = new Map();
  if (tableExists(db, "decks")) {
    // Schema 18+. A legacy `decks` table also exists in some intermediate
    // versions, so the column list is checked rather than assumed.
    const r = firstResult(db, "SELECT * FROM decks");
    for (const row of rowsOf(r)) {
      if (row.id != null && typeof row.name === "string") map.set(String(row.id), row.name);
    }
  }
  if (!map.size) {
    const r = firstResult(db, "SELECT decks FROM col LIMIT 1");
    const raw = r && r.values && r.values[0] && r.values[0][0];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        for (const [id, deck] of Object.entries(parsed)) {
          if (deck && deck.name) map.set(String(id), deck.name);
        }
      } catch {
        // A collection with unreadable deck JSON still has usable notes; they
        // land under the fallback subject rather than failing the import.
      }
    }
  }
  return map;
}

// One deck per note: a note can generate cards in several decks, and the first
// card's deck is the one a user would call "where this note lives".
function readNoteDecks(db) {
  const map = new Map();
  const r = firstResult(db, "SELECT nid, did FROM cards ORDER BY ord ASC");
  for (const row of rowsOf(r)) {
    const nid = String(row.nid);
    if (!map.has(nid)) map.set(nid, String(row.did));
  }
  return map;
}

/**
 * Reads an .apkg/.colpkg into plain front/back pairs grouped by deck.
 * Returns { decks, totals, warnings } and never throws for a merely awkward
 * collection — only for one it genuinely cannot open.
 */
// Unwraps the package down to raw SQLite bytes. Split out from parseApkg so the
// archive handling — which is where the format's version quirks live — can be
// tested against real .apkg files without needing the WASM engine.
export async function collectionBytes(arrayBuffer, deps = { JSZip, fzstd }) {
  let zip;
  try {
    zip = await deps.JSZip.loadAsync(arrayBuffer);
  } catch {
    throw new Error("That file isn't a readable Anki package.");
  }

  // Newest first: 2.1.50+ writes both anki21b and a legacy decoy, and the
  // decoy deliberately contains nothing useful.
  const names = ["collection.anki21b", "collection.anki21", "collection.anki2"];
  const entryName = names.find(n => zip.file(n));
  if (!entryName) {
    throw new Error("No Anki collection inside that file. Export a deck from AnkiDroid as .apkg and try again.");
  }

  const raw = await zip.file(entryName).async("uint8array");
  if (!entryName.endsWith("b")) return raw;
  try {
    return deps.fzstd.decompress(raw);
  } catch {
    throw new Error("That collection is compressed in a way this app can't read. In AnkiDroid's export, tick \"Support older Anki versions\".");
  }
}

export async function parseApkg(file) {
  if (file.size > MAX_BYTES) {
    throw new Error("That collection is larger than 120 MB. Export a single deck from AnkiDroid instead of the whole collection.");
  }

  const bytes = await collectionBytes(await file.arrayBuffer());

  const SQL = await loadSql();
  let db;
  try {
    db = new SQL.Database(bytes);
  } catch {
    throw new Error("The collection inside that file is damaged.");
  }

  try {
    return extract(db);
  } finally {
    try { db.close(); } catch { /* already gone */ }
  }
}

function extract(db) {
  // A query returning no rows and a query against a missing table both come
  // back empty, so the table is checked separately — an empty deck is a valid
  // collection and must not be reported as a broken file.
  if (!tableExists(db, "notes")) {
    throw new Error("That collection has no notes table — it may not be an Anki file.");
  }
  const notesResult = firstResult(db, "SELECT id, mid, flds FROM notes");
  const deckNames = readDecks(db);
  const noteDecks = readNoteDecks(db);

  return buildDecks(rowsOf(notesResult).map(note => {
    const deckId = noteDecks.get(String(note.id));
    return { flds: note.flds, deckName: (deckId && deckNames.get(deckId)) || "Anki import" };
  }));
}

/**
 * Turns raw Anki notes into the app's decks-and-cards shape.
 *
 * Both import routes end here — the .apkg file reader above, and the direct
 * AnkiDroid content-provider read in ankiDroid.js. Keeping the field cleanup,
 * cloze expansion and deck-name splitting in one place is the point: the two
 * routes differ only in where the notes come from, so a fix to how a field is
 * read benefits both, and neither can drift into cleaning things differently.
 *
 * @param {{flds: string, deckName: string}[]} entries
 */
export function buildDecks(entries) {
  const byDeck = new Map();
  const warnings = [];
  let skippedEmpty = 0;
  let mediaOnly = 0;
  let clozeCards = 0;
  let total = 0;

  for (const note of entries || []) {
    const fields = String(note.flds == null ? "" : note.flds).split(FIELD_SEP);
    const deckName = note.deckName || "Anki import";

    let made = [];
    if (hasCloze(fields[0])) {
      made = expandCloze(fields[0]);
      clozeCards += made.length;
    } else {
      const front = cleanField(fields[0]);
      // Most note types put the answer in field 2; some split it across
      // several. Joining the rest keeps an answer whole instead of truncating
      // it at the first field boundary.
      const restRaw = fields.slice(1).filter(f => f && f.trim()).join("<br>");
      const back = cleanField(restRaw);
      if (front.text && back.text) {
        made = [{ front: front.text, back: back.text, hadMedia: front.hadMedia || back.hadMedia }];
      } else if ((front.hadMedia || back.hadMedia) && !(front.text && back.text)) {
        mediaOnly++;
      } else {
        skippedEmpty++;
      }
    }

    if (!made.length) continue;
    if (!byDeck.has(deckName)) byDeck.set(deckName, []);
    const bucket = byDeck.get(deckName);
    for (const c of made) {
      bucket.push({ front: c.front, back: c.back });
      total++;
    }
  }

  if (mediaOnly) {
    warnings.push(`${mediaOnly} card${mediaOnly === 1 ? "" : "s"} skipped — the front or back was only an image or audio, which can't come along.`);
  }
  if (skippedEmpty) {
    warnings.push(`${skippedEmpty} note${skippedEmpty === 1 ? "" : "s"} skipped for having an empty side.`);
  }
  if (clozeCards) {
    warnings.push(`${clozeCards} cloze deletion${clozeCards === 1 ? "" : "s"} turned into fill-in-the-blank cards.`);
  }

  const decks = [...byDeck.entries()]
    .map(([name, cards]) => ({ name, ...splitDeckName(name), cards }))
    .filter(d => d.cards.length)
    .sort((a, b) => b.cards.length - a.cards.length);

  return { decks, totals: { cards: total, decks: decks.length }, warnings };
}
