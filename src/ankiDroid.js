// ---------------------------------------------------------------------------
// Importing straight out of AnkiDroid, with no file in between.
//
// AnkiDroid publishes a content provider, so an app on the same phone can list
// the user's decks and read their notes after a single permission grant. That
// replaces the whole export-save-pick dance the .apkg reader needs — that path
// stays for the web version and for decks arriving from a desktop.
//
// The native side deliberately returns raw note fields and nothing else: the
// cleanup lives in ankiImport.buildDecks, shared with the file reader, so both
// routes produce identical cards and only one of them has to be tested.
// ---------------------------------------------------------------------------
import { registerPlugin, Capacitor } from "@capacitor/core";
import { buildDecks } from "./ankiImport";

const AnkiDroid = registerPlugin("AnkiDroid");

// Only the installed Android app has a content provider to talk to. The web
// build answers "no" here and falls back to the .apkg file import.
export function isSupported() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

/** @returns {{installed: boolean, granted: boolean}} */
export async function status() {
  if (!isSupported()) return { installed: false, granted: false };
  try {
    return await AnkiDroid.isAvailable();
  } catch {
    return { installed: false, granted: false };
  }
}

export async function requestPermission() {
  const res = await AnkiDroid.requestAnkiPermission();
  return !!(res && res.granted);
}

/** Deck names, as AnkiDroid spells them ("Spanish::Verbs"). */
export async function listDecks() {
  const res = await AnkiDroid.listDecks();
  return (res && res.decks) || [];
}

// Reads the chosen decks and returns exactly what parseApkg returns, so the
// review UI doesn't care which route the cards arrived by.
//
// A deck is read one at a time rather than all at once: AnkiDroid answers per
// deck, and a single failure shouldn't cost the user every other deck they
// picked. Anything that fails is reported rather than silently missing.
export async function importDecks(deckNames, onProgress) {
  const entries = [];
  const failed = [];
  let done = 0;

  // `deck:"Name"` matches subdecks too — that is Anki's own search semantics,
  // not a quirk of the plugin — so reading a parent returns everything filed
  // beneath it as well. Every listed deck starts ticked, so parent and child
  // were normally both selected and each note came back twice. buildDecks
  // credits a note to the deck it was first seen under and sorts decks by card
  // count, so the parent swallowed the lot and every subdeck ended up empty
  // and dropped — the .apkg route, which resolves each note's real deck id,
  // never had this problem, which is what made the two routes disagree.
  //
  // Reading most-specific-first and keeping the first attribution files each
  // note under the deepest selected deck that actually holds it.
  const ordered = [...deckNames].sort(
    (a, b) => b.split("::").length - a.split("::").length || b.length - a.length
  );
  const seen = new Set();

  for (const name of ordered) {
    try {
      const res = await AnkiDroid.readDeck({ deck: name });
      for (const note of (res && res.notes) || []) {
        const key = note.id != null ? String(note.id) : JSON.stringify(note.flds);
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push({ flds: note.flds, deckName: name });
      }
    } catch (e) {
      failed.push(name);
    }
    done++;
    if (onProgress) onProgress(done, ordered.length);
  }

  const built = buildDecks(entries);
  if (failed.length) {
    built.warnings = [
      `Couldn't read ${failed.length} deck${failed.length === 1 ? "" : "s"}: ${failed.join(", ")}.`,
      ...built.warnings,
    ];
  }
  return built;
}
