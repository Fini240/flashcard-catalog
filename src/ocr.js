import { Capacitor } from "@capacitor/core";
import { TextRecognition } from "@capacitor-mlkit/text-recognition";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { fileToBase64 } from "./fileImport";

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
