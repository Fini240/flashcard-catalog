// ---------------------------------------------------------------------------
// "There is a newer version of this app."
//
// The APK is sideloaded from a GitHub release, so it never updates itself.
// Whatever a user installed is what they keep — for months, if nothing tells
// them otherwise — and that is not a cosmetic problem: every data-loss fix this
// app has shipped only reaches a phone when someone goes and fetches the new
// build. The account that had been quietly un-migrating itself for weeks
// (AGENTS.md, 2026-09-15) was on an old APK, and the fix for it was useless
// until the user was told to install one.
//
// So the app asks. `version.json` is emitted into the bundle at build time
// from APP_VERSION (see vite.config.js) and served from hosting, which the ship
// sequence redeploys with every release — no extra step, and nothing to keep in
// step by hand.
//
// Two audiences, two buttons, and the difference matters:
//
//   * The installed app can only be updated by downloading the new APK, so it
//     gets Download, pointing at the same rolling release link Settings uses.
//   * The web app is already the new version the moment hosting is deployed —
//     but a tab left open for a week is still running the old bundle, and no
//     amount of syncing changes that. It gets Reload.
//
// Everything here degrades to "say nothing". An update check that fails is an
// app with no internet, which is the normal way this app is used and not a
// fault worth a banner or a diagnostics entry.
// ---------------------------------------------------------------------------

import { Capacitor } from "@capacitor/core";
import { APP_VERSION, compareVersions } from "./whatsNew";
import { report } from "./report";

// Absolute, not relative: inside the APK the origin is https://localhost, where
// a relative path resolves to nothing. Hosting sends
// Access-Control-Allow-Origin on this one file so that fetch is allowed —
// see firebase.json, and note it is the only cross-origin request the app makes
// besides Firebase's own.
export const MANIFEST_URL = "https://flashcard-catalog.web.app/version.json";
export const DISMISSED_KEY = "flashcard-catalog-update-dismissed";

// The decision, separated from the three facts it needs so it can be tested
// without a network or a platform to have them on.
//
// `dismissed` is the version the user last turned down, not a boolean. Turning
// down 1.3.0 hides 1.3.0 and nothing else: the next release asks again, which
// is the difference between an app that respects "not now" and one that has
// been permanently silenced by a single tap two months ago.
export function updateOffer({ latest, current = APP_VERSION, native, dismissed }) {
  if (!latest || typeof latest !== "string") return null;
  if (compareVersions(latest, current) <= 0) return null;
  if (dismissed && compareVersions(dismissed, latest) >= 0) return null;
  return { version: latest, action: native ? "download" : "reload" };
}

export async function fetchLatestVersion(url = MANIFEST_URL) {
  let res;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e) {
    return null; // offline, or hosting unreachable. Both mean "don't nag".
  }
  if (!res.ok) return null;
  try {
    const data = await res.json();
    return typeof data.version === "string" ? data.version : null;
  } catch (e) {
    // Reachable and unreadable is different: that is a broken deploy, and the
    // only place it would ever be noticed is here.
    report("updateCheck.manifest", e);
    return null;
  }
}

export function dismissedVersion() {
  try {
    return localStorage.getItem(DISMISSED_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function dismissUpdate(version) {
  try {
    localStorage.setItem(DISMISSED_KEY, version);
  } catch (e) {
    /* a blocked store costs the memory of being dismissed, not the dismissal */
  }
}

// What the app calls: the whole check, or null if there is nothing to say.
export async function check() {
  const latest = await fetchLatestVersion();
  return updateOffer({
    latest,
    current: APP_VERSION,
    native: Capacitor.isNativePlatform(),
    dismissed: dismissedVersion(),
  });
}
