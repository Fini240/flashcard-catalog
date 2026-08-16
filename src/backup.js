// Export / import of the whole catalog as one JSON file. This is the user's
// safety net: sync bugs, account mix-ups and "I deleted the wrong subject"
// all become recoverable the moment this file exists somewhere off-device.
//
// The file format is deliberately the same shape the app already persists
// ({ subjects, cards, game, updatedAt, ownerUid }) with a `format` tag so a
// future version can reject files it doesn't understand instead of importing
// garbage. Images are NOT included — they live in imageStore keyed by card id
// and never leave the device; cards referencing them keep their ids, so a
// re-import on the same device still finds its images.

import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

export const BACKUP_FORMAT = "flashcard-catalog-backup@1";

export function buildBackupPayload({ subjects, cards, game }) {
  return {
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    subjects: subjects || [],
    cards: cards || [],
    game: game || null,
    updatedAt: Date.now(),
    ownerUid: null, // a backup is nobody's sync data until the app adopts it
  };
}

export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: "That file doesn't look like a backup." };
  }
  // Accept both tagged backups and a raw persisted payload (no format field)
  // — the raw shape is what older exports and hand-made files will have.
  if (data.format && data.format !== BACKUP_FORMAT) {
    return { ok: false, error: `Unsupported backup format: ${data.format}` };
  }
  if (!Array.isArray(data.subjects) && !Array.isArray(data.cards)) {
    return { ok: false, error: "No subjects or cards found in that file." };
  }
  return {
    ok: true,
    backup: {
      subjects: Array.isArray(data.subjects) ? data.subjects : [],
      cards: Array.isArray(data.cards) ? data.cards : [],
      game: data.game || null,
      updatedAt: Date.now(),
      ownerUid: null,
    },
  };
}

// Writes the file and, on native, offers the share sheet so the user can
// actually move it off the device (Drive, mail, …). On web it downloads.
export async function exportBackup(payload) {
  const json = JSON.stringify(payload, null, 2);
  const day = new Date().toISOString().slice(0, 10);
  return deliver(json, `flashcard-catalog-backup-${day}.json`, "application/json");
}

// The delivery half of the above, split out so the CSV and .apkg exporters
// (exporters.js) reach the share sheet and the download by the same path
// rather than reimplementing it — including the two non-obvious fixes in the
// web branch below.
export async function deliver(text, fileName, mimeType = "application/json") {
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await offerShare(result.uri);
    return { ok: true, uri: result.uri };
  }
  return download(new Blob([text], { type: mimeType }), fileName);
}

// Binary payloads (.apkg is a zip) can't go through the UTF-8 path above:
// Filesystem.writeFile without an encoding expects base64, so the blob is
// converted rather than corrupted.
export async function deliverBlob(blob, fileName) {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });
    await offerShare(result.uri);
    return { ok: true, uri: result.uri };
  }
  return download(blob, fileName);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // The data: URL carries a "data:...;base64," prefix that Filesystem would
    // treat as part of the payload.
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("Could not read the file"));
    reader.readAsDataURL(blob);
  });
}

async function offerShare(uri) {
  try {
    await Share.share({ title: "Flashcard Catalog", url: uri, dialogTitle: "Save or send" });
  } catch (e) {
    // User dismissed the share sheet — the file still exists, that's fine.
  }
}

function download(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  // Both of these matter outside Chrome: a detached anchor's click is ignored
  // by Firefox, and revoking the object URL on the same tick can pull the blob
  // out from under a download that hasn't started reading it yet. Either way
  // the user got "Backup saved." and no file, which is the worst version of
  // this failure — it looks like their data is safe when nothing was written.
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
  return { ok: true, uri: null };
}
