// Error reporting, deliberately framework-free. Every catch that used to
// swallow a failure now lands here: console for development, and a small ring
// buffer the "Copy diagnostics" button in Settings can turn a phone screenshot
// of "it looks wrong" into an actual bug report.
//
// The buffer survives a restart, and that is not a nicety. It lived on
// `window` alone until a real report came back reading "recent errors (0):
// (none)" from a device whose cards had been disappearing for days — because
// the user had done the obvious thing and opened the app fresh to fetch the
// diagnostics, which is exactly the moment the buffer is empty. A record of
// faults that only covers the current launch cannot describe a fault that
// happens at launch, and nearly all of this app's worst ones do.
//
// So it is mirrored into localStorage: small, capped, and written on a
// microtask so a burst of failures costs one write. It is the first thing the
// dump prints and the only evidence anyone has of a bug that already happened.
//
// Kept tiny on purpose — if this module ever needs configuration, it has
// already grown past its job.

const MAX_ENTRIES = 20;
const PERSIST_KEY = "flashcard-catalog-errors";
// A whole entry is well under 300 characters; twenty of them is a rounding
// error against the catalog, which is the budget that matters. See
// storageBudget.test.js.
let flushQueued = false;

// The localStorage key prefix that card pictures were stored under before
// 1.2.8 moved them into IndexedDB. It is defined here, of all places, because
// this module must not import anything: storageUsage below measures the store,
// and imageStore calls report() to say when the store failed it, so the two
// importing each other would be a cycle. imageStore takes the constant from
// here instead.
export const LEGACY_IMAGE_PREFIX = "fc-img-";

// Written back on a microtask rather than on every call: a failing sync retries,
// and twenty synchronous localStorage writes in a burst would themselves be a
// performance fault inside the error path.
function queueFlush() {
  if (flushQueued) return;
  flushQueued = true;
  Promise.resolve().then(() => {
    flushQueued = false;
    try {
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(window.__lastErrors || []));
    } catch (e) {
      // A full store is one of the things being reported. Losing the record of
      // it is bad; throwing from inside the reporter would be worse.
    }
  });
}

// Read once, lazily, so a module that only ever calls report() doesn't pay for
// it and the tests can clear the buffer by clearing storage.
let restored = false;
function restore() {
  if (restored) return;
  restored = true;
  try {
    if (window.__lastErrors && window.__lastErrors.length) return;
    const saved = JSON.parse(window.localStorage.getItem(PERSIST_KEY) || "[]");
    if (Array.isArray(saved)) window.__lastErrors = saved.slice(-MAX_ENTRIES);
  } catch (e) {
    // Unreadable or absent: start clean rather than fail.
  }
}

export function report(where, err) {
  // eslint-disable-next-line no-console
  console.error(`[${where}]`, err);
  try {
    restore();
    // Firestore and the Capacitor plugins put the useful part in `code`
    // ("permission-denied", "unavailable", "failed-precondition"); the message
    // alone is often just "An internal error occurred".
    const code = err && err.code ? String(err.code) : "";
    const entry = {
      where,
      err: [code, err && err.message ? err.message : String(err)].filter(Boolean).join(" — "),
      at: new Date().toISOString(),
    };
    const prev = window.__lastErrors || [];
    const last = prev[prev.length - 1];
    // An error that recurs is one error, not twenty. The local-save failure
    // fires on every save for as long as the store is full, and appending each
    // one would push everything that explains it out of a 20-entry buffer —
    // leaving a dump that says only "this is still happening".
    if (last && last.where === entry.where && last.err === entry.err) {
      window.__lastErrors = [...prev.slice(0, -1), { ...entry, first: last.first || last.at, count: (last.count || 1) + 1 }];
      queueFlush();
      return;
    }
    window.__lastErrors = [...prev.slice(-(MAX_ENTRIES - 1)), entry];
    queueFlush();
  } catch (e) {
    // Reporting must never itself throw — a full/quirky window object is
    // not worth breaking the feature that was already failing.
  }
}

export function recentErrors() {
  try {
    restore();
    return window.__lastErrors || [];
  } catch (e) {
    return [];
  }
}

// For the tests, and for a user who has been asked for a second dump after a
// fix: the point of the buffer is what happened *since*, and a week-old entry
// that has already been chased is noise in the next report.
export function clearErrors() {
  try {
    window.__lastErrors = [];
    window.localStorage.removeItem(PERSIST_KEY);
  } catch (e) { /* nothing to clear */ }
}

// Everything the diagnostics dump knows about, as plain text for pasting
// into a bug report.
function safe(fn) {
  try { return String(fn()); } catch (e) { return "unavailable"; }
}

// How much of the per-origin store the catalog is working inside, and how much
// of it is still being held by pictures 1.2.8 hasn't moved out yet. Those are
// the characters the catalog can't have, and a non-zero count is the sign that
// the migration couldn't run on this device.
export function storageUsage() {
  const ls = window.localStorage;
  let total = 0;
  let images = 0;
  let imageCount = 0;
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    const size = key.length + (ls.getItem(key) || "").length;
    total += size;
    if (key.startsWith(LEGACY_IMAGE_PREFIX)) { images += size; imageCount++; }
  }
  const k = (n) => `${Math.round(n / 1024)}k chars`;
  // The picture figure is the pre-1.2.8 leftovers: pictures live in IndexedDB
  // now, and a non-zero count here means the migration hasn't finished (or
  // couldn't run), which is worth knowing because those are the characters the
  // catalog can't have.
  return `${k(total)} used, of which ${imageCount} un-migrated picture${imageCount === 1 ? "" : "s"} (${k(images)})`;
}

export function diagnosticsText(extra = {}) {
  const lines = [
    `Flashcard Catalog diagnostics — ${new Date().toISOString()}`,
    `platform: ${navigator.userAgent}`,
    // Which origin this is matters: local data lives per-origin, so the same
    // account on two addresses is two different local stores.
    `origin: ${safe(() => window.location.origin)}`,
    `online: ${safe(() => navigator.onLine)}`,
    // The first question to ask about missing cards. The whole catalog is
    // written into localStorage under one key, and localStorage is a fixed
    // per-origin budget (~5.2M characters in Chromium); when it is full the
    // save fails, the app carries on looking correct, and the work is gone at
    // the next launch. A dump that doesn't say how full the store is can't
    // tell that apart from a sync fault.
    `storage: ${safe(storageUsage)}`,
  ];
  for (const [k, v] of Object.entries(extra)) lines.push(`${k}: ${v}`);
  const errs = recentErrors();
  lines.push(`recent errors (${errs.length}):`);
  for (const e of errs) {
    const repeat = e.count > 1 ? ` (x${e.count}, since ${e.first})` : "";
    lines.push(`  ${e.at} [${e.where}] ${e.err}${repeat}`);
  }
  if (!errs.length) lines.push("  (none)");
  return lines.join("\n");
}
