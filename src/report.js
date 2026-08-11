// Error reporting, deliberately framework-free. Every catch that used to
// swallow a failure now lands here: console for development, and a small
// ring buffer on `window` so the "Copy diagnostics" button in Settings can
// turn a phone screenshot of "it looks wrong" into an actual bug report.
//
// Kept tiny on purpose — if this module ever needs configuration, it has
// already grown past its job.

const MAX_ENTRIES = 20;

export function report(where, err) {
  // eslint-disable-next-line no-console
  console.error(`[${where}]`, err);
  try {
    const entry = {
      where,
      err: err && err.message ? err.message : String(err),
      at: new Date().toISOString(),
    };
    window.__lastErrors = [...(window.__lastErrors || []).slice(-(MAX_ENTRIES - 1)), entry];
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
export function diagnosticsText(extra = {}) {
  const lines = [
    `Flashcard Catalog diagnostics — ${new Date().toISOString()}`,
    `platform: ${navigator.userAgent}`,
  ];
  for (const [k, v] of Object.entries(extra)) lines.push(`${k}: ${v}`);
  const errs = recentErrors();
  lines.push(`recent errors (${errs.length}):`);
  for (const e of errs) lines.push(`  ${e.at} [${e.where}] ${e.err}`);
  if (!errs.length) lines.push("  (none)");
  return lines.join("\n");
}
