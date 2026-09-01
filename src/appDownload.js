// Where the installed Android app comes from.
//
// It is not on Play, so the build a user actually installs is the APK attached
// to the rolling `latest` GitHub release — re-uploaded by the ship sequence
// every time anything ships (AGENTS.md). The tag never moves, which is the
// whole point: this URL is a permanent link to whatever the newest build is,
// so nothing here has to be bumped, and it is a direct download rather than a
// page about one.
import { Capacitor } from "@capacitor/core";

export const APK_URL =
  "https://github.com/Fini240/flashcard-catalog/releases/download/latest/flashcard-catalog.apk";

// GitHub serves release assets with Content-Disposition: attachment, so a
// plain link downloads the file and leaves the page where it is. The download
// attribute is ignored cross-origin — it is here for the filename hint on the
// browsers that do honour it, not as the thing that makes this work.
export const APK_FILENAME = "flashcard-catalog.apk";

// Only the web build offers it. Inside the installed app the link would hand
// you the app you are already holding — and a Capacitor WebView downloading an
// APK to nowhere in particular is a worse answer than not asking.
export function isOffered() {
  return !Capacitor.isNativePlatform();
}

// ---------- the banner ----------
// Tucked in Settings, the download was findable and nothing more: the people
// who most need the installed app are exactly the ones who never open
// Settings. So the library screen offers it once, up front, and remembers
// being turned down.

export const BANNER_KEY = "flashcard-catalog-apk-banner-dismissed";

// The decision, apart from the three facts it needs, so it can be tested
// without a browser to have them in.
export function shouldOfferBanner({ native, apple, dismissed }) {
  if (native) return false;    // it is a link to the app you are already in
  if (apple) return false;     // an APK cannot be installed there at all, and
                               // an offer you can't take is just noise
  return !dismissed;
}

// iPhones and iPads say so; an iPad in "request desktop site" mode claims to
// be a Mac, and is the only Mac with a touchscreen.
export function looksApple(ua = "", touchPoints = 0) {
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && touchPoints > 1;
}

export function bannerDismissed() {
  try {
    return localStorage.getItem(BANNER_KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function dismissBanner() {
  try {
    localStorage.setItem(BANNER_KEY, "1");
  } catch (e) {
    /* a blocked store costs the memory of being dismissed, not the dismissal */
  }
}

export function isBannerOffered() {
  const nav = typeof navigator === "undefined" ? {} : navigator;
  return shouldOfferBanner({
    native: Capacitor.isNativePlatform(),
    apple: looksApple(nav.userAgent || "", nav.maxTouchPoints || 0),
    dismissed: bannerDismissed(),
  });
}
