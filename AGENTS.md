# Flashcard Catalog — agent context

Handoff distilled from the Claude Code session that built this app
(2026-07-10 → 2026-08-09). Read this before changing anything.

## What the app is

A study app: flashcards organised into subjects and arbitrarily deep
subcategories, reviewed on a spaced-repetition schedule (1 → 3 → 7 → 14 → 30
days; a wrong answer keeps the card due). Three answer modes per card — flip,
multiple choice, typed. Cards can be created by hand, pasted as `Front | Back`
lines, or generated from a photo, PDF, Word file or pasted text.

Works fully offline with no account. Google sign-in is optional and adds
cross-device sync plus a free daily AI-import allowance.

Ships as an Android app (Capacitor) **and** a web app on Firebase Hosting.

## Stack

- **UI**: React 19 + Vite 8, `lucide-react` icons. No CSS framework — styles
  are inline/in-component.
- **Android**: Capacitor 8, appId `com.flashcardcatalog.app`, `webDir: dist`.
- **Backend**: Firebase project `centering-timer-502020-h0` — Auth (Google
  only), Firestore (sync), Hosting (web app + privacy policy), Cloud Functions
  (the free AI tier).
- **OCR**: `@capacitor-mlkit/text-recognition` — on-device, tried *first* on
  Android. Only falls back to an AI provider when on-device text extraction
  isn't enough.
- **AI**: `@google/genai` (Gemini, default) and `@anthropic-ai/sdk` (Claude,
  selectable). `pdfjs-dist` for PDFs, `mammoth` for .docx.

## Layout

| Path | What |
|---|---|
| `src/FlashcardCatalog.jsx` | ~106 KB — the entire UI and app state. Almost every feature change lands here. |
| `src/aiImport.js` | AI card generation; owner-free-tier vs BYOK routing |
| `src/ocr.js` | On-device ML Kit text recognition + fallback decision |
| `src/fileImport.js` | PDF / .docx / text extraction |
| `src/firebaseSync.js` | Auth + Firestore sync (contains the Firebase client config) |
| `src/imageStore.js` | Local storage of card images (never uploaded) |
| `src/gamification.js` | XP, levels, weekly ranks, streaks, quests, achievements, heatmap |
| `src/gameUI.jsx` | The gamification surface: status bar, today card, quests, streak/goal/friends sheets |
| `src/social.js` | Friend codes, usernames, public `profiles/` docs, nudges, friends + global leaderboards |
| `src/reminders.js` | Daily study reminder — local notifications, scheduled on-device |
| `firestore.rules` | Security rules. **Deploy after editing** — `firebase deploy --only firestore` |
| `firestore.indexes.json` | Composite index behind the global board. Deployed by the same command. |
| `src/backHandler.js` | Android hardware/gesture back button → in-app navigation |
| `functions/index.js` | Cloud Function `generateFlashcards`; `DAILY_LIMIT` lives here |
| `scripts/screenshots.mjs` | Regenerates Play Store screenshots via puppeteer-core |
| `PLAY_STORE.md` | **The Play Store release runbook. Authoritative — read it before any release work.** |

`README.md` is still the stock Vite template and carries no project
information; don't trust it.

## The ship sequence (standing instruction — do it every time, don't ask)

After any completed and verified change:

```bash
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
```

then, all of these — the user treats them as one unit:

1. Copy the rebuilt APK to `~/Downloads/flashcard-catalog.apk`
2. Deploy the web app: `npx firebase deploy --only hosting --project centering-timer-502020-h0`
3. `git add -A && git commit -m "…" && git push` (`origin/main`)
4. `gh release upload latest ~/Downloads/flashcard-catalog.apk --clobber`

The rolling `latest` release is the user's stable download link:
<https://github.com/Fini240/flashcard-catalog/releases/download/latest/flashcard-catalog.apk>

Repo: <https://github.com/Fini240/flashcard-catalog> (`gh` is already
authenticated as `Fini240` on this Mac).

## Build environment

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME="$HOME/Library/Android/sdk"
```

JDK 21 specifically — the default `openjdk` on this machine has caused Gradle
failures. Release builds keep **every ABI** (a previous single-ABI build was a
Play Store compatibility problem).

## Decisions already made — don't relitigate these

- **Sync is Firebase, not Google Drive.** Drive sync was built first and
  abandoned after persistent failures; the user explicitly chose Firebase.
- **AI import is hybrid.** Every signed-in user gets 10 free imports/day from
  the Cloud Function's shared Gemini key; beyond that they're offered their own
  free key (BYOK). Earlier designs — owner-only free key, per-user billing in
  the app — were considered and rejected. Rationale is in `PLAY_STORE.md` §9.
- **On-device OCR before any network call.** Driven by the user's ask to make
  photo import work for free and offline. Plain vocabulary lists become cards
  with no key and no internet at all.
- **API key entry lives in Settings, behind a confirm dialog** so it can't be
  changed by accident. Keys are stored in `localStorage` only, never in source.
- **Firebase client config in `src/firebaseSync.js` and `google-services.json`
  are committed on purpose** — Firebase client keys are not secrets; access is
  governed by Firestore security rules.
- **The Google display name is never published.** Public identity is a
  self-chosen username and nothing else. `profiles/` has no `name` field and
  the rules reject any write containing one, so this can't regress by accident.
  Usernames are reserved in `usernames/{lowercased}`, where `create` on a
  non-existent doc is what makes them unique without a transaction.
- **Reminders are local, not push.** No FCM, no server, no cost, works offline.
  The schedule is rebuilt from scratch on app open, after every session and on
  any settings change, which is what lets a finished day be skipped without a
  background job.
- **Reminders escalate through the day rather than firing once.** A fixed
  ladder (12:30 · 16:00 · 19:00 · 21:00, `LADDER` in `reminders.js`) with copy
  that gets more direct at each rung, all of it cancelled the moment the daily
  *goal* is met — not merely when one card has been answered. There is no
  user-facing time picker; the times are deliberately not a setting.

## Known hazards

- **Cross-device sync has bitten this app twice.** Local data once overwrote a
  freshly signed-in account's cards, and cards vanished from a logged-in
  account (~90 lost). Both are fixed (`3d65e77`), but *any* change touching
  `firebaseSync.js` or the sign-in/sign-out path needs deliberate testing with
  two accounts and two devices before shipping.
- **Bump `versionCode` in `android/app/build.gradle` before every Play
  upload** — Play permanently rejects a reused versionCode.
- `android/upload-keystore.jks` and `android/keystore.properties` are
  gitignored and **must never be committed**. Losing them means never being
  able to update the listing.

## Open items

- [ ] **The free AI tier is not live yet.** The endpoint still returns
      `{"error":"NOT_CONFIGURED"}` — it needs a real Gemini key set as the
      function secret and a redeploy. Exact commands: `PLAY_STORE.md` §8.
      Until then every client silently falls back to BYOK; nothing is broken.
- [ ] Play Store release is not started: upload keystore not generated, no
      Play Developer account ($25 + identity verification), and a personal
      account needs a **12-tester / 14-day closed test** before production.
      Full checklist in `PLAY_STORE.md`.
- [x] The GitHub `latest` APK asset matches `main` as of 2026-08-10 (the
      gamification release, `d571924`).
- [ ] **The friends/leaderboard feature has never run against two real
      accounts.** Rules and leaderboard maths are covered by tests, but adding
      a friend by code, nudging, and seeing a friend's weekly XP have only been
      exercised against stubs. Verify with a second Google account before
      treating it as done.
- [ ] **Reminders have not been seen firing on a physical device.** The
      scheduling decision is tested (`scripts/test-reminders.mjs`) and
      `POST_NOTIFICATIONS` is confirmed present in the built APK, but no one has
      watched a notification actually arrive. Check on a real phone, including
      after a reboot.
- [ ] **Existing accounts have no username**, so they publish `username: ""`
      and are not on the global board until they pick one. That's intended, but
      it means the board looks empty until people open the Friends sheet once.

## Working with this user

- Native German speaker writing in English with frequent typos — read for
  intent, don't get literal about spelling. German is fine in replies.
- Wants work carried through end to end: build it, verify it on the real
  device or in the browser, ship it, then report. Don't hand back instructions
  when the step could have been done.
- Bug reports usually arrive as phone screenshots — check them for the actual
  visual defect (contrast and layout issues have been a recurring theme).
