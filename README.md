# Flashcard Catalog

A study app: flashcards organised into subjects and arbitrarily deep
subcategories, reviewed on a spaced-repetition schedule (1 → 3 → 7 → 14 → 30
days; a wrong answer keeps the card due). Three answer modes per card — flip,
multiple choice, typed.

Cards can be created by hand, pasted as `Front | Back` lines, or generated
from a photo, PDF, Word file or pasted text. On-device OCR (ML Kit) runs
before any network call, so plain vocabulary lists become cards with no API
key and no internet at all.

Works fully offline with no account. Google sign-in is optional and adds
cross-device sync plus a free daily AI-import allowance.

A six-screen walkthrough opens on a fresh install, and a short note after an
update says what changed. The walkthrough can be reopened from Settings.

XP, streaks, daily quests, achievements and a friends + global leaderboard
keep the habit alive. Daily study reminders escalate through the day and stop
the moment your goal is met.

## Install

- **Android APK** (latest stable):
  <https://github.com/Fini240/flashcard-catalog/releases/download/latest/flashcard-catalog.apk>
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
