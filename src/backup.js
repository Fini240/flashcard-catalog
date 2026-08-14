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
  const fileName = `flashcard-catalog-backup-${day}.json`;

  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({
        title: "Flashcard Catalog backup",
        text: "Flashcard Catalog backup",
        url: result.uri,
        dialogTitle: "Save your backup",
      });
    } catch (e) {
      // User dismissed the share sheet — the file still exists, that's fine.
    }
    return { ok: true, uri: result.uri };
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true, uri: null };
}
