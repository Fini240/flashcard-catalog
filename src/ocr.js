import { Capacitor } from "@capacitor/core";
import { TextRecognition } from "@capacitor-mlkit/text-recognition";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { fileToBase64 } from "./fileImport";
import * as noteToCards from "./noteToCards";

// ML Kit's text recognition runs natively with a model bundled into the APK,
// so it only exists in the Android build. The hosted web app has no equivalent
// worth shipping (browser OCR means a multi-megabyte WASM download that reads
// photos noticeably worse), so there we keep sending the photo to Claude.
export function isAvailable() {
  return Capacitor.isNativePlatform();
}

// ML Kit wants a real file on disk, but the photo pickers hand us an in-memory
// File. Stage it in the cache directory for the scan, then delete it — a photo
// of someone's notes shouldn't outlive the import that used it.
export async function recognizeText(file) {
  if (!isAvailable()) return "";
  const base64 = await fileToBase64(file);
  const name = `ocr-${Date.now()}.jpg`;
  try {
    const { uri } = await Filesystem.writeFile({
      path: name, data: base64, directory: Directory.Cache,
    });
    const { text } = await TextRecognition.processImage({ path: uri });
    return text || "";
  } finally {
    try {
      await Filesystem.deleteFile({ path: name, directory: Directory.Cache });
    } catch {
      // Nothing was written, or it's already gone — either way there's
      // nothing left to clean up.
    }
  }
}

// Ordered by how unambiguous each one is: a pipe or a tab in study material
// is almost always a deliberate column break, whereas a hyphen or colon can
// just be punctuation inside a sentence.
const SEPARATORS = ["|", "\t", " — ", " – ", " - ", ": "];

// Offline salvage for OCR output: study material photographed from a
// vocabulary list or glossary is already "term <separator> definition" per
// line, so it can become cards with no model involved at all.
export function guessCardPairs(text) {
  const lines = (text || "").split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  let best = [];
  for (const sep of SEPARATORS) {
    const pairs = [];
    for (const line of lines) {
      const idx = line.indexOf(sep);
      if (idx <= 0) continue;
      const front = line.slice(0, idx).trim();
      const back = line.slice(idx + sep.length).trim();
      if (front && back) pairs.push({ front, back });
    }
    // Require a separator to explain most of the page before trusting it.
    // Without this, one stray dash in a paragraph of prose would turn the
    // whole photo into a single nonsense card.
    const explainsPage = pairs.length >= 2 && pairs.length >= lines.length * 0.6;
    if (explainsPage && pairs.length > best.length) best = pairs;
  }
  return best;
}

// Lines that only the notes syntax can claim. `::`, a `Q:`/`A:` pair and a
// cloze marker are deliberate marks — nobody writes them by accident — whereas
// every separator `guessCardPairs` looks for is punctuation that merely
// happens to look like a column break.
const NOTES_MARKERS = [
  /::/,
  /^\s*(?:Q|A|Question|Answer)\s*[:.]\s+\S/i,
];

const hasNotesSyntax = (text) =>
  String(text || "").split(/\r?\n/).some((line) => NOTES_MARKERS.some((re) => re.test(line)));

const notesCards = (text) =>
  noteToCards
    .toCards(String(text || "")).cards
    .filter((c) => c.front && c.back)
    .map((c) => ({ front: String(c.front), back: String(c.back) }));

// Everything the device can make of a page on its own, with no key, no
// network and no model.
//
// Two parsers, and the order between them matters more than it looks.
// `guessCardPairs` asks "is this a two-column list?" and needs one separator
// to explain most of the lines, which is what stops a page of prose becoming
// nonsense cards. What it cannot read is the notes syntax the app already
// understands everywhere else — `::`, `:::`, `Q:`/`A:`, dash lists, headings
// — and that is most of what a photographed page of *notes* looks like.
// Without a second pass a correctly-read page could yield zero cards, which
// left the reading useless the moment the AI path was unavailable.
//
// The notes reading goes first whenever the page carries a mark only it can
// explain, because on that page the column reader isn't silent — it's wrong.
// `": "` is one of its separators, so `Mitochondrium :: erzeugt ATP` becomes a
// front of `Mitochondrium :`, and `Q: …` / `A: …` become two cards fronted
// literally `Q` and `A`. Four such lines out of six clear the 60% guard, so
// the bad reading looks confident.
//
// Folders and tags from the notes syntax are dropped deliberately: the photo
// import puts everything in the one subject/category its sheet is asking
// about, and the importer reads nothing but `front`/`back`.
export function salvageCards(text) {
  const notes = notesCards(text);
  if (notes.length > 0 && hasNotesSyntax(text)) return notes;

  const guessed = guessCardPairs(text);
  if (guessed.length > 0) return guessed;

  return notes;
}
