// ---------------------------------------------------------------------------
// Getting cards back out.
//
// The app has been good at taking decks in — .apkg, .colpkg, direct from
// AnkiDroid, CSV, PDF, photos — and offered exactly one way out: a JSON backup
// only this app can read. That asymmetry is a lock-in, whether or not it was
// meant as one, and it is what makes people hesitate before putting a term's
// work into a new app.
//
// Three formats, chosen for what they're each good at:
//
//   CSV   — opens in a spreadsheet, imports into nearly everything. Lossy by
//           nature: no scheduling, no images.
//   .apkg — a real Anki package, so a deck can move to Anki, AnkiDroid or
//           AnkiMobile with its scheduling intact. This is the round trip that
//           closes the loop with ankiImport.js.
//   JSON  — the existing full-fidelity backup (backup.js), unchanged and still
//           the right choice for moving between this app's own installs.
//
// sql.js and jszip are already dependencies — the Anki *import* path uses both
// — so the package writer costs no new download.
// ---------------------------------------------------------------------------

import JSZip from "jszip";
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import * as cloze from "./cloze";

// The WASM location is injectable for the same reason ankiImport takes its
// deps as a parameter: `?url` resolves to a browser path that Node cannot
// open, so without this the package writer could only ever be tested by hand.
let sqlPromise = null;
const loadSql = (locateFile) =>
  locateFile
    ? initSqlJs({ locateFile })
    : (sqlPromise ||= initSqlJs({ locateFile: () => wasmUrl }));

// ---------- CSV ----------

// Excel and Numbers both treat a field opening with = + - @ as a formula and
// will execute it. Prefixing with an apostrophe is the standard defence and
// survives the round trip back through a CSV reader.
const deFang = (s) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);

const csvCell = (value) => {
  const s = deFang(String(value ?? ""));
  return /["\n\r,;\t]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_COLUMNS = ["front", "back", "folder", "tags", "due", "stability", "difficulty", "lapses"];

// Semicolon by default: this app's users are German, Excel there reads
// semicolon-separated files as the native format, and a comma file opens as a
// single column per row. The delimiter is a parameter for everyone else.
export function toCSV(cards, opts = {}) {
  const sep = opts.delimiter || ";";
  const pathFor = opts.pathFor || (() => "");
  const rows = (cards || []).map((c) => {
    const front = c.clozeSource ? cloze.plainText(c.clozeSource) : c.front;
    return [
      front,
      c.back,
      pathFor(c),
      (c.tags || []).join(" "),
      c.srsDue ? new Date(c.srsDue).toISOString().slice(0, 10) : "",
      c.fsrsStability != null ? Number(c.fsrsStability).toFixed(2) : "",
      c.fsrsDifficulty != null ? Number(c.fsrsDifficulty).toFixed(2) : "",
      c.fsrsLapses || 0,
    ]
      .map(csvCell)
      .join(sep);
  });
  // A BOM, because without one Excel reads UTF-8 as Latin-1 and every umlaut in
  // a German deck arrives mangled.
  return "\uFEFF" + [CSV_COLUMNS.join(sep), ...rows].join("\r\n");
}

// ---------- Anki package ----------

// Anki's own ids are millisecond timestamps. Any stable numbers work, as long
// as the model, the notes and the cards agree on them.
const MODEL_BASIC = 1607392319000;
const MODEL_CLOZE = 1607392319001;
const DECK_BASE = 1607392319100;
const FIELD_SEP = "\x1f";

// Anki finds duplicates by checksumming the first field: the top 32 bits of its
// SHA-1, as an integer. Implemented here rather than pulled in — it is the only
// hash this file needs, and a dependency for forty lines is a poor trade.
function sha1Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const bitLength = bytes.length * 8;
  // Room for the 0x80 terminator and the 8-byte length, rounded up to a whole
  // number of 64-byte blocks.
  const padded = new Uint8Array((((bytes.length + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  // High word of the 64-bit length stays zero: a card longer than 512MB is not
  // a case worth carrying code for.
  view.setUint32(padded.length - 4, bitLength >>> 0, false);

  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);
  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = view.getUint32(i + j * 4, false);
    for (let j = 16; j < 80; j++) {
      const n = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
      w[j] = ((n << 1) | (n >>> 31)) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let j = 0; j < 80; j++) {
      let f, k;
      if (j < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (j < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) >>> 0;
      e = d; d = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = temp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map((h) => h.toString(16).padStart(8, "0")).join("");
}

export const fieldChecksum = (text) => parseInt(sha1Hex(text).slice(0, 8), 16);

// Anki fields are HTML, so "a < b" written raw would render as a broken tag.
const toAnkiField = (text) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

const CARD_CSS =
  ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }";

function buildModels(now) {
  const shared = {
    css: CARD_CSS,
    latexPre:
      "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
    latexPost: "\\end{document}",
    mod: Math.floor(now / 1000),
    usn: -1,
    vers: [],
    tags: [],
    sortf: 0,
    did: DECK_BASE,
    req: [[0, "any", [0]]],
  };
  return {
    [MODEL_BASIC]: {
      ...shared,
      id: MODEL_BASIC,
      name: "Basic (Flashcard Catalog)",
      type: 0,
      flds: [
        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
      ],
      tmpls: [
        {
          name: "Card 1",
          ord: 0,
          qfmt: "{{Front}}",
          afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
          bqfmt: "",
          bafmt: "",
          did: null,
        },
      ],
    },
    [MODEL_CLOZE]: {
      ...shared,
      id: MODEL_CLOZE,
      name: "Cloze (Flashcard Catalog)",
      type: 1,
      flds: [
        { name: "Text", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Extra", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
      ],
      tmpls: [
        {
          name: "Cloze",
          ord: 0,
          qfmt: "{{cloze:Text}}",
          afmt: "{{cloze:Text}}<br>\n{{Extra}}",
          bqfmt: "",
          bafmt: "",
          did: null,
        },
      ],
    },
  };
}

// Anki names nested decks with "::" — the folder path maps onto it directly,
// so the tree survives the trip instead of arriving as one flat deck.
const deckName = (path) =>
  (path && path.length ? path : ["Flashcard Catalog"])
    .map((p) => String(p).replace(/::/g, "-").trim() || "Untitled")
    .join("::");

// Anki schedules in whole days since the collection was created, not in
// timestamps. `crt` below is that origin; every card's due is expressed
// relative to it, which is why it has to be computed once and shared.
const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null,
  scm integer not null, ver integer not null, dty integer not null, usn integer not null,
  ls integer not null, conf text not null, models text not null, decks text not null,
  dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null,
  mod integer not null, usn integer not null, tags text not null, flds text not null,
  sfld integer not null, csum integer not null, flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null,
  ord integer not null, mod integer not null, usn integer not null, type integer not null,
  queue integer not null, due integer not null, ivl integer not null, factor integer not null,
  reps integer not null, lapses integer not null, left integer not null, odue integer not null,
  odid integer not null, flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null,
  ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null,
  time integer not null, type integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
`;

const DEFAULT_CONF = {
  nextPos: 1, estTimes: true, activeDecks: [1], sortType: "noteFld", timeLim: 0,
  sortBackwards: false, addToCur: true, curDeck: 1, newBury: true, newSpread: 0,
  dueCounts: true, curModel: String(MODEL_BASIC), collapseTime: 1200,
};

const deckConf = (now) => ({
  1: {
    id: 1, name: "Default", mod: Math.floor(now / 1000), usn: -1, maxTaken: 60, autoplay: true,
    timer: 0, replayq: true,
    new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20 },
    rev: { bury: true, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
    lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
    dyn: false,
  },
});

// Builds a .apkg. Returns a Blob, so the caller can hand it to the share sheet
// on Android or to a download on the web without knowing anything about zips.
//
// `pathFor(card)` returns the folder path as an array of names — that becomes
// the Anki deck name, so the tree survives.
export async function toAnkiPackage(cards, opts = {}) {
  const list = (cards || []).filter((c) => c && (c.front || c.clozeSource) && !c.deletedAt);
  if (!list.length) throw new Error("Nothing to export.");

  const SQL = await loadSql(opts.locateFile);
  const db = new SQL.Database();
  db.run(SCHEMA);

  const now = opts.now || Date.now();
  const pathFor = opts.pathFor || (() => []);
  // Anki's day boundary is 4am local, and `crt` must be that boundary or every
  // due date lands a day out.
  const crtDate = new Date(now);
  crtDate.setHours(4, 0, 0, 0);
  if (crtDate.getTime() > now) crtDate.setDate(crtDate.getDate() - 1);
  const crt = Math.floor(crtDate.getTime() / 1000);

  // One deck per distinct folder path.
  const decks = new Map();
  decks.set(1, { id: 1, name: "Default", mod: Math.floor(now / 1000), usn: -1, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0], conf: 1, desc: "", dyn: 0, collapsed: false, extendNew: 10, extendRev: 50 });
  const deckIdFor = (name) => {
    for (const [id, d] of decks) if (d.name === name) return id;
    const id = DECK_BASE + decks.size;
    decks.set(id, {
      id, name, mod: Math.floor(now / 1000), usn: -1, lrnToday: [0, 0], revToday: [0, 0],
      newToday: [0, 0], timeToday: [0, 0], conf: 1, desc: "", dyn: 0, collapsed: false,
      extendNew: 10, extendRev: 50,
    });
    return id;
  };

  const insertNote = db.prepare(
    "INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  );
  const insertCard = db.prepare(
    "INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  );

  // Ids must be unique and are conventionally millisecond timestamps; a
  // counter off `now` guarantees both without colliding inside one export.
  let nextId = now;
  const newId = () => nextId++;
  let newCardPosition = 1;

  for (const card of list) {
    const isCloze = !!card.clozeSource;
    const mid = isCloze ? MODEL_CLOZE : MODEL_BASIC;
    // A cloze card here is one card per deletion, but Anki generates those
    // itself from one note. Exporting each as its own note would duplicate the
    // text N times, so only the first is written and Anki rebuilds the rest.
    if (isCloze && card.clozeIndex !== cloze.clozeNumbers(card.clozeSource)[0]) continue;

    const front = isCloze ? card.clozeSource : card.front;
    const back = isCloze ? "" : card.back;
    const sortField = toAnkiField(isCloze ? cloze.plainText(card.clozeSource) : card.front);
    const flds = [toAnkiField(front), toAnkiField(back)].join(FIELD_SEP);
    const noteId = newId();
    const tags = (card.tags || []).length ? ` ${card.tags.join(" ")} ` : "";

    insertNote.run([
      noteId,
      // GUIDs must be stable across exports so re-importing updates rather than
      // duplicating. The card's own id is exactly that.
      String(card.id || noteId).slice(0, 32),
      mid,
      Math.floor(now / 1000),
      -1,
      tags,
      flds,
      sortField,
      fieldChecksum(sortField),
      0,
      "",
    ]);

    const did = deckIdFor(deckName(pathFor(card)));
    const ordinals = isCloze
      ? cloze.clozeNumbers(card.clozeSource).map((n) => n - 1)
      : [0];

    for (const ord of ordinals) {
      // A card with real scheduling becomes an Anki review card; one that has
      // never been studied stays new, in queue order.
      const scheduled = card.srsDue != null && card.fsrsStability != null;
      const ivl = scheduled ? Math.max(1, Math.round(card.fsrsStability)) : 0;
      const dueDays = scheduled
        ? Math.round((card.srsDue / 1000 - crt) / 86400)
        : newCardPosition++;
      insertCard.run([
        newId(),
        noteId,
        did,
        ord,
        Math.floor(now / 1000),
        -1,
        scheduled ? 2 : 0, // type: 2 review, 0 new
        scheduled ? 2 : 0, // queue: same
        dueDays,
        ivl,
        // Anki's ease factor is per-mille and clamped at 1300. FSRS difficulty
        // runs 1..10 the other way round, so this is the closest honest
        // translation — the receiving app reschedules from its own model anyway.
        scheduled ? Math.max(1300, Math.round(2500 - ((card.fsrsDifficulty || 5) - 5) * 150)) : 0,
        card.fsrsReps || 0,
        card.fsrsLapses || 0,
        0, 0, 0, 0, "",
      ]);
    }
  }
  insertNote.free();
  insertCard.free();

  const models = buildModels(now);
  db.run("INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", [
    1,
    crt,
    now,
    now,
    11, // schema version: the pre-2.1.28 JSON-blob layout, which every Anki reads
    0,
    -1,
    0,
    JSON.stringify(DEFAULT_CONF),
    JSON.stringify(models),
    JSON.stringify(Object.fromEntries(decks)),
    JSON.stringify(deckConf(now)),
    "{}",
  ]);

  const binary = db.export();
  db.close();

  const zip = new JSZip();
  zip.file("collection.anki2", binary);
  // Required even with no media; Anki refuses a package without it.
  zip.file("media", "{}");
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

// ---------- shared helpers ----------

export const csvBlob = (text) => new Blob([text], { type: "text/csv;charset=utf-8" });

export const suggestFilename = (base, ext) => {
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = String(base || "flashcards")
    .replace(/[^\w\-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "flashcards";
  return `${safe}-${stamp}.${ext}`;
};
