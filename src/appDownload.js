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
