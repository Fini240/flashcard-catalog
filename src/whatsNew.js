// ---------------------------------------------------------------------------
// What the app tells you about itself: the first-run walkthrough and the
// short "what's new" note after an update.
//
// The decision of *which* of the two to show is pure and unit-tested, because
// it is easy to get wrong in a way nobody notices: an existing user who
// updates must never be handed the beginner's walkthrough, and a brand-new
// user must never be handed release notes for features they have never seen
// the old version of. Both fall out of one stored value — the app version
// this device last acknowledged.
//
// It is stored per device, next to the theme, and deliberately not synced:
// "have I read this?" is a property of the install, not of the account. The
// web app updates on every deploy and the APK only when it is installed, so
// the same account genuinely is at two different versions at once.
// ---------------------------------------------------------------------------

// Bump this with every user-visible release and add a RELEASES entry to
// match, or the update note stays silent. Keep it in step with versionName
// in android/app/build.gradle.
export const APP_VERSION = "1.2.4";

export const SEEN_VERSION_KEY = "flashcard-catalog-seen-version";

// The walkthrough. Six screens, one idea each — this is the whole tour, so
// anything that needs a paragraph doesn't belong here.
export const WALKTHROUGH = [
  {
    icon: "book",
    title: "Your card drawer",
    text: "Cards live in subjects, and in folders inside those, as deep as you want them. Everything works offline, with no account.",
  },
  {
    icon: "import",
    title: "Getting cards in",
    text: "Type them, paste “Front | Back” lines, photograph a vocabulary list, or drop in a PDF, a Word file or an Anki deck. Photos are read on this device.",
  },
  {
    icon: "clock",
    title: "Answered once isn't learned",
    text: "A card you get right comes back a day later, then after three days, a week, a fortnight, a month. Miss it and it steps back down.",
  },
  {
    icon: "drills",
    title: "Six ways to be asked",
    text: "Flip, multiple choice, typing, fill the blank, true or false, match the pairs. You pick when you sit down — the same deck, a different kind of hard.",
  },
  {
    icon: "flame",
    title: "Turning up daily",
    text: "A daily goal, a streak, XP and quests. Reminders start gently at midday and stop the moment you hit the goal.",
  },
  {
    icon: "users",
    title: "Optional: sign in",
    text: "Signing in with Google syncs your cards across devices and puts you on the board with friends. Only a username you choose is ever public.",
  },
];

// Newest first. Keep each line to one sentence — this is a note, not a
// changelog, and a user who skimmed it should still know what changed.
export const RELEASES = [
  {
    version: "1.2.4",
    date: "2026-09-01",
    items: [
      "The home-screen widget has been redrawn beside the one it was modelled on. The animal now sits next to the numbers at about a third of the card instead of being sliced through by its edge, and the card runs from deep colour behind the text to bright colour behind the animal \u2014 so the writing stays readable while the card still lifts.",
      "The five-day strip reads at a glance now: bigger marks, days you met joined into one capsule rather than separate ticks, and a day with nothing on it sunk into the card instead of glowing on top of it.",
    ],
  },
  {
    version: "1.2.3",
    date: "2026-08-31",
    items: [
      "A home-screen widget: your streak, what's left of today's goal, the last five days at a glance, and an animal watching over all of it. Long-press your home screen \u2192 Widgets to add it.",
      "Pick which animal \u2014 owl, cat, fox, bunny or panda \u2014 in Settings. It's asleep in the morning, watchful by the afternoon, worried by the evening if your streak is on the line, and delighted the moment you finish. The whole widget changes colour with it, so you can read the day off it without looking properly.",
    ],
  },
  {
    version: "1.2.2",
    date: "2026-08-28",
    items: [
      "A photographed page of notes now becomes cards on the device itself. Your phone could already read the page, but only a two-column list turned into cards — a page written with :: or Q:/A: was read correctly and then handed back as plain text.",
      "When an import can't use the AI, the app now says which reason applies — signed out, allowance spent, or the service unreachable — instead of always blaming a missing API key.",
    ],
  },
  {
    version: "1.2.1",
    date: "2026-08-26",
    items: [
      "Flip cards are graded with “Missed it” and “Got it” again. The 1-5 “how well did you know it?” dial told the scheduler more, but it turned the quickest drill in the app into a five-way decision on every card.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-08-16",
    items: [
      "Reviews are now scheduled by FSRS, which learns how *you* forget instead of moving every card along the same 1/3/7/14/30 ladder — the same schedule Anki switched to, and about 15% fewer reviews for the same recall. Your existing cards keep their place.",
      "A Statistics screen: what's due over the next month, how much you actually recall, a year of study history, and a dial for how much you want to remember.",
      "Cards you keep missing are set aside rather than asked forever, with a guess at what makes each one unanswerable.",
      "Fill-in-the-blank cards you write yourself, and cards that hide part of a picture — for diagrams, anatomy and maps.",
      "Tags, so you can pull together everything marked #exam across every subject.",
      "Write notes and get cards out of them: any line with :: becomes a card, headings become folders.",
      "Test yourself: a fixed set of mixed questions with a score at the end, and only the ones you got wrong touch your schedule.",
      "Cards can be read aloud, in a language per side — so a vocabulary card finally has its pronunciation.",
      "Share a folder with a six-character code, and add decks other people share with you.",
      "Export to a real Anki deck or a spreadsheet, not just this app's own backup.",
      "The tutor explains why an answer is right, what you confused it with, or gives a hint that doesn't give it away.",
      "Formulas and code render properly on cards — $x^2$, \\alpha, fractions and roots.",
    ],
  },
  {
    version: "1.1.2",
    date: "2026-08-12",
    items: [
      "Fixed, properly this time: a device holding an empty catalog can no longer publish that emptiness over your subjects and XP — not by signing in, and not on a later sync either.",
      "A device that was emptied by the earlier bug now heals itself: if it is holding nothing and your account has a catalog, it takes the catalog.",
      "The server refuses the same write independently, so no future bug in the app can do this again. Deleting your own subjects still works — the app says when a delete is really yours.",
      "Your cards were never affected by any of this.",
    ],
  },
  {
    version: "1.1.1",
    date: "2026-08-12",
    items: [
      "Fixed: signing in on a device that had never held your catalog could replace the subjects and XP on your account with that device's empty ones.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-08-12",
    items: [
      "How a deck is studied is now chosen when you sit down — flip, multiple choice, typing, cloze, true/false or match pairs — instead of being fixed per card.",
      "Cards turn over in 3D, and can be graded before you flip them.",
      "A big deck is served in sittings rather than as one endless queue.",
      "Anki decks import from a .apkg file or straight from AnkiDroid, skipping cards you already have.",
      "The app follows your phone's light or dark setting.",
      "A missed card steps down one box instead of starting over, and a session survives a reload.",
      "This walkthrough, and this note after every update.",
    ],
  },
];

// Numeric, part by part, so "1.10.0" sorts above "1.9.0". Missing parts count
// as 0, and anything unparseable sorts oldest — a corrupted stored value then
// reads as "very old", which shows the note rather than swallowing it.
export function compareVersions(a, b) {
  const parts = (v) => String(v || "").split(".").map((n) => parseInt(n, 10) || 0);
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

// Every release newer than what this device has acknowledged, newest first.
export function releasesSince(seenVersion, releases = RELEASES) {
  return releases
    .filter((r) => compareVersions(r.version, seenVersion) > 0)
    .sort((a, b) => compareVersions(b.version, a.version));
}

// What to show on launch, if anything.
//
// `hasData` is the one that stops an existing user being taught what a
// flashcard is: someone who has been using the app since before this feature
// existed has no stored version, but they do have a catalog. They get the
// update note if there is one, and nothing if there isn't — never the tour.
export function introFor({ seenVersion, hasData, releases = RELEASES }) {
  if (!seenVersion) {
    if (!hasData) return { screen: "walkthrough", releases: [] };
    const since = releasesSince(null, releases);
    return since.length ? { screen: "whatsNew", releases: since } : { screen: null, releases: [] };
  }
  if (compareVersions(seenVersion, APP_VERSION) >= 0) return { screen: null, releases: [] };
  const since = releasesSince(seenVersion, releases);
  return since.length ? { screen: "whatsNew", releases: since } : { screen: null, releases: [] };
}

export function getSeenVersion() {
  try {
    return localStorage.getItem(SEEN_VERSION_KEY) || null;
  } catch (e) {
    // A blocked store means we can't remember; showing the tour twice is a
    // better failure than crashing the launch.
    return null;
  }
}

export function setSeenVersion(version = APP_VERSION) {
  try {
    localStorage.setItem(SEEN_VERSION_KEY, version);
  } catch (e) {
    /* costs the acknowledgement, not the session */
  }
}
