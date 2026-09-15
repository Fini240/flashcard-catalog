// Error reporting, deliberately framework-free. Every catch that used to
// swallow a failure now lands here: console for development, and a small
// ring buffer on `window` so the "Copy diagnostics" button in Settings can
// turn a phone screenshot of "it looks wrong" into an actual bug report.
//
// Kept tiny on purpose — if this module ever needs configuration, it has
// already grown past its job.

import { PREFIX as IMAGE_PREFIX } from "./imageStore";

const MAX_ENTRIES = 20;

export function report(where, err) {
  // eslint-disable-next-line no-console
  console.error(`[${where}]`, err);
  try {
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
      return;
    }
    window.__lastErrors = [...prev.slice(-(MAX_ENTRIES - 1)), entry];
  } catch (e) {
    // Reporting must never itself throw — a full/quirky window object is
    // not worth breaking the feature that was already failing.
  }
}

export function recentErrors() {
  try {
    return window.__lastErrors || [];
  } catch (e) {
    return [];
  }
}

// Everything the diagnostics dump knows about, as plain text for pasting
// into a bug report.
function safe(fn) {
  try { return String(fn()); } catch (e) { return "unavailable"; }
}

// How much of the per-origin store is in use, and how much of that is card
// pictures — they are far the largest thing in it, so the split is what says
// whether the fix is "delete some photos" or "you have too many cards".
export function storageUsage() {
  const ls = window.localStorage;
  let total = 0;
  let images = 0;
  let imageCount = 0;
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    const size = key.length + (ls.getItem(key) || "").length;
    total += size;
    if (key.startsWith(IMAGE_PREFIX)) { images += size; imageCount++; }
  }
  const k = (n) => `${Math.round(n / 1024)}k chars`;
  return `${k(total)} used (${imageCount} pictures, ${k(images)})`;
}

export function diagnosticsText(extra = {}) {
  const lines = [
    `Flashcard Catalog diagnostics — ${new Date().toISOString()}`,
    `platform: ${navigator.userAgent}`,
    // Which origin this is matters: local data lives per-origin, so the same
    // account on two addresses is two different local stores.
    `origin: ${safe(() => window.location.origin)}`,
    `online: ${safe(() => navigator.onLine)}`,
    // The first question to ask about missing cards. localStorage is a fixed
    // per-origin budget (~5.2M characters in Chromium) shared between the
    // catalog and every card picture, and when it is full the save fails, the
    // app carries on looking correct, and the work is gone at the next launch.
    // A dump that doesn't say how full the store is can't tell that apart from
    // a sync fault.
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
