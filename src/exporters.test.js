import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import initSqlJs from "sql.js";
import { createRequire } from "node:module";
import * as ex from "./exporters";
import * as occlusion from "./occlusion";

// The browser gets the WASM through Vite's `?url`; Node needs a real path.
const require = createRequire(import.meta.url);
const locateFile = (f) => require.resolve(`sql.js/dist/${f}`);

const card = (over = {}) => ({
  id: `c${Math.random().toString(36).slice(2, 8)}`,
  front: "front",
  back: "back",
  nodeId: "n1",
  ...over,
});

describe("CSV", () => {
  it("writes a header and one row per card", () => {
    const csv = ex.toCSV([card({ front: "a", back: "b" })]);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines[0].split(";")).toEqual(ex.CSV_COLUMNS);
    expect(lines[1].startsWith("a;b")).toBe(true);
  });

  it("starts with a BOM so Excel reads umlauts correctly", () => {
    expect(ex.toCSV([card({ front: "Übung", back: "größer" })].slice()).startsWith("﻿")).toBe(true);
  });

  it("quotes fields containing the delimiter, quotes or newlines", () => {
    const csv = ex.toCSV([card({ front: 'a;b', back: 'say "hi"\nplease' })]);
    expect(csv).toContain('"a;b"');
    expect(csv).toContain('"say ""hi""');
  });

  // A card starting with = is executed as a formula by Excel and Numbers.
  it("neutralises fields that a spreadsheet would run as a formula", () => {
    const csv = ex.toCSV([card({ front: "=1+1", back: "@SUM(A1)" })]);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'@SUM(A1)");
  });

  it("uses the folder path and tags the caller supplies", () => {
    const csv = ex.toCSV([card({ tags: ["exam", "optics"] })], { pathFor: () => "Physics/Optics" });
    expect(csv).toContain("Physics/Optics");
    expect(csv).toContain("exam optics");
  });

  it("writes cloze cards as their plain text", () => {
    const csv = ex.toCSV([card({ clozeSource: "The {{c1::heart}} pumps", clozeIndex: 1, front: "The […] pumps" })]);
    expect(csv).toContain("The heart pumps");
  });

  it("honours a comma delimiter when asked", () => {
    expect(ex.toCSV([card()], { delimiter: "," }).replace(/^﻿/, "").split("\r\n")[0]).toBe(
      ex.CSV_COLUMNS.join(",")
    );
  });
});

describe("Anki field checksum", () => {
  // Anki computes this as the first 8 hex digits of the field's SHA-1. These
  // are the reference values — a wrong checksum makes Anki's duplicate finder
  // silently useless on every imported deck.
  it("matches SHA-1 based reference values", () => {
    expect(ex.fieldChecksum("")).toBe(parseInt("da39a3ee", 16));
    expect(ex.fieldChecksum("abc")).toBe(parseInt("a9993e36", 16));
    expect(ex.fieldChecksum("The quick brown fox jumps over the lazy dog")).toBe(parseInt("2fd4e1c6", 16));
  });

  it("handles input long enough to need multiple blocks and a padding block", () => {
    // 56 bytes is the exact length where the length field no longer fits in the
    // final block — the classic off-by-one in a hand-written SHA-1.
    expect(ex.fieldChecksum("a".repeat(55))).not.toBe(ex.fieldChecksum("a".repeat(56)));
    expect(ex.fieldChecksum("a".repeat(56))).not.toBe(ex.fieldChecksum("a".repeat(57)));
    expect(ex.fieldChecksum("a".repeat(1000))).toBeGreaterThan(0);
  });
});

describe("Anki package", () => {
  // Read the package back with the same library Anki uses. This is the real
  // test: anything that makes the file unopenable shows up here rather than on
  // a phone.
  async function readBack(blob) {
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const bytes = await zip.file("collection.anki2").async("uint8array");
    const SQL = await initSqlJs({ locateFile });
    const db = new SQL.Database(bytes);
    const rows = (sql) => {
      const r = db.exec(sql);
      return r.length ? r[0].values : [];
    };
    const cols = db.exec("SELECT models, decks, crt FROM col")[0].values[0];
    return {
      db,
      rows,
      models: JSON.parse(cols[0]),
      decks: JSON.parse(cols[1]),
      crt: cols[2],
      notes: rows("SELECT id, guid, mid, tags, flds, sfld, csum FROM notes"),
      cards: rows("SELECT id, nid, did, ord, type, queue, due, ivl, reps, lapses FROM cards"),
    };
  }

  it("produces a zip Anki can open, with the files it requires", async () => {
    const blob = await ex.toAnkiPackage([card()], { locateFile });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(zip.file("collection.anki2")).toBeTruthy();
    expect(zip.file("media")).toBeTruthy();
    expect(await zip.file("media").async("string")).toBe("{}");
  });

  it("writes one note and one card for a basic card", async () => {
    const out = await readBack(await ex.toAnkiPackage([card({ front: "Hund", back: "dog" })], { locateFile }));
    expect(out.notes).toHaveLength(1);
    expect(out.cards).toHaveLength(1);
    expect(out.notes[0][4]).toBe("Hund\x1fdog"); // flds, unit-separator delimited
    expect(out.notes[0][5]).toBe("Hund"); // sort field
  });

  it("escapes HTML so a card containing < renders as text", async () => {
    const out = await readBack(await ex.toAnkiPackage([card({ front: "a < b", back: "x & y" })], { locateFile }));
    expect(out.notes[0][4]).toBe("a &lt; b\x1fx &amp; y");
  });

  it("maps the folder tree onto Anki's :: deck names", async () => {
    const cards = [card({ id: "a" }), card({ id: "b" })];
    const paths = { a: ["Biology", "Cells"], b: ["Biology", "Genetics"] };
    const out = await readBack(
      await ex.toAnkiPackage(cards, { locateFile, pathFor: (c) => paths[c.id] })
    );
    const names = Object.values(out.decks).map((d) => d.name);
    expect(names).toContain("Biology::Cells");
    expect(names).toContain("Biology::Genetics");
    // Two cards in two different decks.
    expect(new Set(out.cards.map((c) => c[2])).size).toBe(2);
  });

  it("carries scheduling across as a review card, and leaves new cards new", async () => {
    const now = Date.now();
    const scheduled = card({ id: "s", fsrsStability: 21.4, fsrsDifficulty: 5, fsrsReps: 9, fsrsLapses: 2, srsDue: now + 10 * 86400000 });
    const fresh = card({ id: "f" });
    const out = await readBack(await ex.toAnkiPackage([scheduled, fresh], { locateFile, now }));
    const byNid = Object.fromEntries(out.notes.map((n, i) => [n[0], out.cards.find((c) => c[1] === n[0])]));
    const rows = out.cards;
    const review = rows.find((r) => r[4] === 2);
    const brandNew = rows.find((r) => r[4] === 0);
    expect(review).toBeTruthy();
    expect(review[7]).toBe(21); // ivl, rounded from stability
    expect(review[8]).toBe(9); // reps
    expect(review[9]).toBe(2); // lapses
    expect(brandNew).toBeTruthy();
    expect(brandNew[7]).toBe(0);
  });

  it("expresses due dates as days from the collection's creation day", async () => {
    const now = Date.now();
    const out = await readBack(
      await ex.toAnkiPackage([card({ fsrsStability: 5, srsDue: now + 7 * 86400000 })], { locateFile, now })
    );
    const due = out.cards[0][6];
    // Anki's day rolls at 4am, so the exact figure depends on the time of day
    // this runs; a week out must land within a day of seven.
    expect(due).toBeGreaterThanOrEqual(6);
    expect(due).toBeLessThanOrEqual(8);
  });

  it("writes a cloze note once and lets Anki generate its cards", async () => {
    const source = "The {{c1::heart}} pumps {{c2::blood}}.";
    const cards = [
      card({ id: "z1", clozeSource: source, clozeIndex: 1, front: "The […] pumps blood." }),
      card({ id: "z2", clozeSource: source, clozeIndex: 2, front: "The heart pumps […]." }),
    ];
    const out = await readBack(await ex.toAnkiPackage(cards, { locateFile }));
    // One note carrying the markup...
    expect(out.notes).toHaveLength(1);
    expect(out.notes[0][4].startsWith("The {{c1::heart}} pumps {{c2::blood}}.")).toBe(true);
    // ...and one card per deletion, which is how Anki models cloze.
    expect(out.cards).toHaveLength(2);
    expect(out.cards.map((c) => c[3]).sort()).toEqual([0, 1]);
  });

  it("uses the card id as the note guid so re-import updates instead of duplicating", async () => {
    const out = await readBack(await ex.toAnkiPackage([card({ id: "stable-id" })], { locateFile }));
    expect(out.notes[0][1]).toBe("stable-id");
  });

  it("writes tags in the space-padded form Anki searches on", async () => {
    const out = await readBack(await ex.toAnkiPackage([card({ tags: ["exam", "optics"] })], { locateFile }));
    expect(out.notes[0][3]).toBe(" exam optics ");
  });

  it("declares both note types with matching ids", async () => {
    const out = await readBack(await ex.toAnkiPackage([card()], { locateFile }));
    const models = Object.values(out.models);
    expect(models).toHaveLength(2);
    for (const m of models) expect(String(m.id)).toBe(String(Object.keys(out.models).find((k) => out.models[k] === m)));
    expect(models.find((m) => m.type === 1)).toBeTruthy(); // a cloze model exists
  });

  it("refuses an empty export rather than writing a broken package", async () => {
    await expect(ex.toAnkiPackage([], { locateFile })).rejects.toThrow(/nothing to export/i);
    await expect(ex.toAnkiPackage([{ deletedAt: Date.now(), front: "x" }], { locateFile })).rejects.toThrow();
  });
});

describe("filenames", () => {
  it("makes a safe, dated filename", () => {
    expect(ex.suggestFilename("Biology / Cells", "apkg")).toMatch(/^Biology-Cells-\d{4}-\d{2}-\d{2}\.apkg$/);
    expect(ex.suggestFilename("", "csv")).toMatch(/^flashcards-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(ex.suggestFilename("???", "csv")).toMatch(/^flashcards-/);
  });
});

describe("image occlusion", () => {
  const masks = [
    { id: "m1", x: 0.1, y: 0.1, w: 0.2, h: 0.1, label: "Aorta" },
    { id: "m2", x: 0.5, y: 0.5, w: 0.2, h: 0.1, label: "Ventricle" },
  ];

  it("normalises a drag made in any direction", () => {
    const m = occlusion.normalizeMask({ x: 0.5, y: 0.6, w: -0.2, h: -0.1 });
    expect(m.x).toBeCloseTo(0.3, 6);
    expect(m.y).toBeCloseTo(0.5, 6);
    expect(m.w).toBeCloseTo(0.2, 6);
    expect(m.h).toBeCloseTo(0.1, 6);
  });

  it("clamps a drag that ran off the edge of the image", () => {
    const m = occlusion.normalizeMask({ x: 0.9, y: 0.9, w: 0.5, h: 0.5 });
    expect(m.x + m.w).toBeLessThanOrEqual(1);
    expect(m.y + m.h).toBeLessThanOrEqual(1);
  });

  it("discards a stray tap that is too small to be a deliberate box", () => {
    expect(occlusion.normalizeMasks([{ x: 0.5, y: 0.5, w: 0.0001, h: 0.0001 }])).toHaveLength(0);
  });

  it("makes one card per mask", () => {
    const cards = occlusion.expand("img1", masks);
    expect(cards).toHaveLength(2);
    expect(cards[0].back).toBe("Aorta");
    expect(cards[0].frontImageId).toBe("img1");
    expect(cards[0].occlusionTotal).toBe(2);
  });

  // Adding a twentieth label must not reset the nineteen already being learned.
  it("keeps the schedule of masks that survive an edit", () => {
    const existing = [{ id: "keep", occlusionMaskId: "m1", fsrsStability: 40, srsBox: 5 }];
    const cards = occlusion.expand("img1", [...masks, { id: "m3", x: 0.8, y: 0.1, w: 0.1, h: 0.1 }], { existing });
    const kept = cards.find((c) => c.occlusionMaskId === "m1");
    expect(kept.id).toBe("keep");
    expect(kept.fsrsStability).toBe(40);
    expect(cards).toHaveLength(3);
  });

  it("reports cards whose mask was deleted", () => {
    const existing = [{ id: "a", occlusionMaskId: "m1" }, { id: "b", occlusionMaskId: "gone" }];
    expect(occlusion.orphaned(masks, existing).map((c) => c.id)).toEqual(["b"]);
  });

  it("hides everything in hide-all and only its own in hide-one", () => {
    const [c1] = occlusion.expand("img1", masks, { mode: occlusion.HIDE_ALL });
    expect(occlusion.visibleMasks(c1, false)).toHaveLength(2);
    // Answering lifts this card's mask but leaves the others covered, so the
    // eye isn't pulled to labels that aren't the answer.
    expect(occlusion.visibleMasks(c1, true).map((m) => m.id)).toEqual(["m2"]);

    const [d1] = occlusion.expand("img1", masks, { mode: occlusion.HIDE_ONE });
    expect(occlusion.visibleMasks(d1, false).map((m) => m.id)).toEqual(["m1"]);
    expect(occlusion.visibleMasks(d1, true)).toHaveLength(0);
  });

  it("converts between screen pixels and stored fractions", () => {
    const displayed = { width: 400, height: 200 };
    const m = occlusion.maskFromRect({ x: 100, y: 50, w: 80, h: 40 }, displayed);
    expect(m.x).toBeCloseTo(0.25, 6);
    expect(m.h).toBeCloseTo(0.2, 6);
    const back = occlusion.maskToRect(m, displayed);
    expect(back.x).toBeCloseTo(100, 6);
    expect(back.h).toBeCloseTo(40, 6);
  });

  it("flags masks that overlap enough to make two cards with one answer", () => {
    const overlapping = [
      { id: "a", x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
      { id: "b", x: 0.12, y: 0.12, w: 0.2, h: 0.2 },
      { id: "c", x: 0.7, y: 0.7, w: 0.1, h: 0.1 },
    ];
    const pairs = occlusion.overlapping(overlapping);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].sort()).toEqual(["a", "b"]);
  });
});
