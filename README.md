# Flashcard Catalog

A study app: flashcards organised into subjects and arbitrarily deep
subcategories, reviewed on an **FSRS** schedule that models how you personally
forget rather than moving every card along one fixed ladder. Three answer modes
per card — flip, multiple choice, typed — plus fill-in-the-blank (cloze) cards
you write yourself and cards that hide part of a picture.

Cards can be created by hand, written as notes (any line with `::` becomes a
card), pasted as `Front | Back` lines, or generated from a photo, PDF, Word
file or pasted text. On-device OCR (ML Kit) runs before any network call, so
plain vocabulary lists become cards with no API key and no internet at all.
Decks go back out as a real Anki `.apkg` or as CSV, and a folder can be shared
with anyone through a six-character code.

Works fully offline with no account. Google sign-in is optional and adds
cross-device sync plus a free daily AI-import allowance.

A six-screen walkthrough opens on a fresh install, and a short note after an
update says what changed. The walkthrough can be reopened from Settings.

XP, streaks, daily quests, achievements and a friends + global leaderboard
keep the habit alive. Daily study reminders escalate through the day and stop
the moment your goal is met. A Statistics screen answers the other question —
whether it is working: what falls due over the next month, how much you
actually recall against how much you asked to, a year of study history, and the
cards you keep missing, set aside with a guess at why.

Cards can be read aloud in a language per side, formulas and code render
properly (`$x^2$`, `\alpha`, fractions, roots), tags cut across the folder
tree, and a graded test mode measures without quietly rewriting what it
measures.

## Install

- **Android APK** (latest stable):
  <https://github.com/Fini240/flashcard-catalog/releases/download/latest/flashcard-catalog.apk>
  — or from the web app itself: Settings → Android app.
- **Web app**: <https://flashcard-catalog.web.app>

## Built with

React 19 + Vite 8, Capacitor 8 (Android), Firebase (Auth, Firestore,
Hosting, Cloud Functions), ML Kit text recognition, Gemini/Claude for
AI-powered import.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (spaced repetition + gamification logic)
npm run build      # production build → dist/
npx cap sync android
cd android && ./gradlew assembleDebug
```

Build environment needs JDK 21 and the Android SDK. `AGENTS.md` carries the
full project context (architecture, decisions, release runbook) — read it
before changing anything.

## Privacy

Cards, subjects and progress live in a private Firestore document only you
can read. The public leaderboard shows a self-chosen username, an emoji and
scoreboard numbers — never your Google name, never a card. Card images never
leave your device.
