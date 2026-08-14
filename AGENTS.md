# Flashcard Catalog — agent context

Handoff distilled from the Claude Code session that built this app
(2026-07-10 → 2026-08-09). Read this before changing anything.

## What the app is

A study app: flashcards organised into subjects and arbitrarily deep
subcategories, reviewed on a spaced-repetition schedule (1 → 3 → 7 → 14 → 30
days; a wrong answer keeps the card due). How a card is asked is chosen when
you sit down to study — see the drills entry under "Decisions already made".
Cards can be created by hand, pasted as `Front | Back` lines, or generated from
a photo, PDF, Word file or pasted text.

Works fully offline with no account. Google sign-in is optional and adds
cross-device sync plus a free daily AI-import allowance.

Ships as an Android app (Capacitor) **and** a web app on Firebase Hosting.

## Stack

- **UI**: React 19 + Vite 8, `lucide-react` icons. No CSS framework — styles
  are inline/in-component.
- **Android**: Capacitor 8, appId `com.flashcardcatalog.app`, `webDir: dist`.
- **Web app**: <https://flashcard-catalog.web.app> (the project-id URL,
  `centering-timer-502020-h0.web.app`, is still served so old links keep working)
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
| `src/FlashcardCatalog.jsx` | ~130 KB — the UI and app state. Almost every feature change lands here. Sync no longer does: it moved to `useSyncEngine.js`. |
| `src/useSyncEngine.js` | **The sync engine.** Local persistence, the debounced push, the realtime listeners, ownership (`ownerUidRef`) and the timestamp guards. Extracted so this logic is reviewable on its own — treat changes here with the same care as `firebaseSync.js`. |
| `src/cardSync.js` | Per-card Firestore sync: `users/{uid}/cards/{cardId}`, tombstones, dirty-set batching, and the one-way migration off the parent doc's `cards` array. Merge helpers at the bottom are pure and unit-tested. |
| `src/srs.js` | The spaced-repetition scheduler (Leitner boxes), extracted from the component so it's testable. **`isDue(card, now)` takes two arguments — never pass it straight to `Array.filter`**, which would supply the index as `now`. |
| `src/backup.js` | JSON export/import of the whole catalog — the user-facing recovery path |
| `src/report.js` | Error reporting: console + a 20-entry ring buffer behind the Settings "Copy diagnostics" button. Every catch that would otherwise swallow a failure calls `report()`. |
| `src/*.test.js` | Vitest suites for the pure logic — SRS, gamification, per-card merge. `npm test`. |
| `src/aiImport.js` | AI card generation; owner-free-tier vs BYOK routing |
| `src/drills.js` | **How a deck gets studied.** The drill catalogue, which drills a given deck can sustain, offline generation of cloze blanks / distractors / false statements, and `buildQueue()`, which turns cards into the *steps* a session runs. Pure and unit-tested. |
| `src/aiDrills.js` | The model's version of the same content, plus deck-tuned drill suggestions. Strictly optional — every failure path falls back to `drills.js`, so no study flow may ever depend on it. Cached in `localStorage` against a fingerprint of the card text. |
| `src/drillUI.jsx` | The cloze, true/false and match-pairs exercises. Match grades a whole group of cards at once. |
| `src/cardUI.jsx` | The shared visual vocabulary — buttons, fields, the index card itself. Extracted from `FlashcardCatalog.jsx` so `drillUI.jsx` can use it without a circular import. |
| `src/ocr.js` | On-device ML Kit text recognition + fallback decision |
| `src/fileImport.js` | PDF / .docx / text extraction |
| `src/ankiImport.js` | Anki `.apkg` / `.colpkg` file import — unzip, zstd, SQLite, HTML and cloze cleanup. `buildDecks()` is shared by both import routes. |
| `src/ankiDroid.js` | Direct AnkiDroid import via its content provider (Android only) |
| `android/.../AnkiDroidPlugin.java` | The native half of that: queries `content://com.ichi2.anki.flashcards` |
| `src/firebaseSync.js` | Auth + Firestore sync (contains the Firebase client config) |
| `src/imageStore.js` | Local storage of card images (never uploaded) |
| `src/gamification.js` | XP, levels, weekly ranks, streaks, quests, achievements, heatmap |
| `src/gameUI.jsx` | The gamification surface: status bar, today card, quests, streak/goal/friends sheets |
| `src/social.js` | Friend codes, usernames, public `profiles/` docs, nudges, friends + global leaderboards |
| `src/reminders.js` | Daily study reminder — local notifications, scheduled on-device |
| `firestore.rules` | Security rules. **Deploy after editing** — `firebase deploy --only firestore` |
| `firestore.indexes.json` | Composite index behind the global board. Deployed by the same command. |
| `src/whatsNew.js` | `APP_VERSION`, the walkthrough copy and the release notes, plus the pure decision of which (if either) a launch owes the user. Unit-tested. |
| `src/onboarding.jsx` | How those two look: the first-run walkthrough and the update note. |
| `src/backHandler.js` | Android hardware/gesture back button → in-app navigation |
| `src/theme.js` | Light/dark choice — automatic (device), light or dark. Holds the migration off the old boolean switch; unit-tested. |
| `functions/index.js` | Cloud Function `generateFlashcards`; `DAILY_LIMIT` (per user) and `GLOBAL_DAILY_LIMIT` (whole project) live here |
| `scripts/screenshots.mjs` | Regenerates Play Store screenshots via puppeteer-core |
| `PLAY_STORE.md` | **The Play Store release runbook. Authoritative — read it before any release work.** |

`README.md` is now a real, human-facing description of the app (what it does,
install links, dev commands, privacy). `AGENTS.md` — this file — remains the
authoritative context for how and why.

## The ship sequence (standing instruction — do it every time, don't ask)

After any completed and verified change, and **before** building: if the
change is user-visible, bump `APP_VERSION` in `src/whatsNew.js`, add a
`RELEASES` entry with one line per change, and set `versionName` in
`android/app/build.gradle` to match (`versionCode` goes up regardless). A
user-visible change shipped without that entry is a silent update — the whole
point of the note is that nothing lands unannounced. Then:

```bash
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
```

then, all of these — the user treats them as one unit:

1. Copy the rebuilt APK to `~/Downloads/flashcard-catalog.apk`
2. Deploy the web app: `firebase deploy --only hosting --project centering-timer-502020-h0`
   (the global CLI at `/opt/homebrew/bin/firebase` — `firebase-tools` is *not* a
   local dependency, so `npx firebase` fails with "could not determine
   executable to run". It fails loudly, but a piped `grep` for the success line
   will swallow it and look like a no-op, so check the exit status.)
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

- **A card has no answer format; a drill does.** Cards used to carry a `mode`
  (flip / mcq / write) chosen at import time and never revisited, which put the
  decision months away from the moment it mattered. Both pickers are gone, the
  field is ignored on read (old cards still carry it harmlessly), and *how* you
  are asked is now chosen when you sit down to study. `drills.js` owns that.
- **Drills degrade, they don't fail.** Every drill is fully playable offline
  with locally generated content. `aiDrills.js` only ever improves one. No
  study path may block on a network call, a key, or a well-formed reply — a
  malformed row is dropped per card, not per session.
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
- **The free AI tier checks the sign-in provider, not just the token.**
  `DAILY_LIMIT` is per uid, so it only means something if a uid costs something
  to obtain; anonymous sign-in would make them free and the limit decorative.
  Anonymous auth is disabled in the console (verified 2026-08-11 — Identity
  Toolkit answers `ADMIN_ONLY_OPERATION`), but a console toggle is one click
  away and nothing in the repo would notice, so `ALLOWED_PROVIDERS` in
  `functions/index.js` enforces it server-side as well. **Adding any sign-in
  provider means adding it there too**, or the free tier returns
  `PROVIDER_NOT_ALLOWED` for those users (the client treats that as "free path
  unavailable" and offers BYOK, so it degrades rather than breaks).
- **Anki import reads the real database, not an export text file.** An `.apkg`
  is a ZIP holding a SQLite collection, zstd-compressed since Anki 2.1.50. Both
  schema generations are supported (decks as JSON in `col` vs a `decks` table),
  because AnkiDroid can still export either. `sql.js` pulls in a 660 KB WASM
  blob, loaded lazily so only an actual Anki import pays for it.
- **There are two Anki import routes, and they share their cleanup.** On
  Android with AnkiDroid installed, decks are read live from its content
  provider — no export, no file. Everywhere else (and for decks from a desktop)
  the `.apkg` reader handles it. Both funnel into `ankiImport.buildDecks()`, so
  a fix to field handling lands on both and they cannot drift apart.
- **The `<queries>` block in AndroidManifest.xml is load-bearing.** Since
  Android 11 another app's content provider is invisible without it, and
  `resolveContentProvider` returns null — the import would claim AnkiDroid
  isn't installed on a phone where it obviously is.
- **Anki media is deliberately not imported.** Images and audio stay behind and
  a card whose side was only media is skipped with a count, rather than
  arriving blank. Cloze notes become one fill-in-the-blank card per marker.
- **Friending is mutual, but not instant.** A friend list lives in the private
  `users/{uid}` document, so the adder cannot write to the other person's list.
  Instead they leave a marker at `profiles/{them}/friendAdds/{me}` — document id
  is the sender's uid, which makes it idempotent and caps one sender to one
  marker — and the receiving app folds it in on next launch, then deletes it.
  Removing a friend is deliberately one-sided: you drop them from your board,
  they keep you on theirs.
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

- **The app explains itself once, in the walkthrough — not in Settings.**
  Settings used to carry a paragraph of prose under every control. It now
  keeps only what a tour can't: live state (which mode "Automatic" resolves
  to, the reminder times, an error) and the two disclosures a user is entitled
  to see at the moment they act on them — that Google's free tier may train on
  what you import, and that an API key never leaves the device. Don't put the
  explanations back; add a walkthrough slide instead, and keep it to six.
- **"Have I seen this?" is per device, not per account.** The acknowledged
  version lives in `localStorage` next to the theme and is deliberately not
  synced: the web app updates on every deploy and the APK only when it's
  installed, so one account genuinely sits at two versions at once.
- **An existing user must never be shown the walkthrough.** Someone who has
  used the app since before this feature existed has no stored version but
  does have a catalog, so `introFor` decides on the presence of local data —
  which is also why it runs the moment local storage is read, before any cloud
  snapshot can arrive and change the answer.

## Known hazards

- **To exercise the Cloud Function locally, mount it on Express.** Cloud
  Functions serves an `onRequest` handler through Express, and that is what
  supplies `res.set` / `res.status` / `res.json` and the parsed `req.body` the
  handler uses. Calling the exported handler with a hand-rolled fake `res`
  fails (v7 waits on the response's `finish` event), and `http.createServer(fn)`
  fails on `res.set is not a function` — both are harness bugs that look
  convincingly like the function being broken. `express` is already present
  under `functions/node_modules`; `app.use(express.json())` then
  `app.all(/.*/, handler)` reproduces production closely enough to check
  status codes and CORS headers without deploying.
- **A card that changes locally must be stamped, and nothing in a reducer will
  do it for you.** Card objects come out of `applyGrade` and the card editor,
  neither of which knows about sync, so `cardSync.applyLocalEdits` is the one
  place that sets `updatedAt` — by comparing content against the sync map. It
  used to stamp only cards arriving with no timestamp at all, which meant
  studying a card (the commonest edit in the app) left its stamp untouched:
  `diffDirty` never saw it, so progress never went up, and `mergeCardMaps` gave
  the tie to the cloud, so the next load pulled the un-studied copy back down.
  A whole session's work disappeared on reload. If you add another path that
  mutates cards, route it through the same place.
- **Automatic light/dark needs a native opt-in, not just the media query.**
  The app follows the device via `prefers-color-scheme` (`src/theme.js`), but
  for apps targeting SDK 33+ Android's WebView reports that query as *light*
  regardless of the phone's setting unless `setAlgorithmicDarkeningAllowed` is
  on — set in `MainActivity`. The activity theme must also stay `DayNight`
  (`styles.xml`), and `src/index.css` must keep `color-scheme: light dark`, or
  the WebView decides the page is light-only and inverts the colours itself.
  Three separate pieces, and the failure is silent: the web build looks right
  while the APK is stuck in one mode.
- **A new hosting domain needs three things, not one.** Adding a site gets you
  the URL, but Google sign-in fails with `auth/unauthorized-domain` until the
  domain is added under Auth → Settings → Authorized domains (console only —
  there is no CLI command), and the free AI import fails CORS until the origin
  is added to `ALLOWED_ORIGINS` in `functions/index.js` *and* the function is
  redeployed. Both fail only on the web build, and only once signed in, so
  neither shows up in a quick check of the new URL. Current authorized domains
  can be read with:
  `curl -s "https://identitytoolkit.googleapis.com/v1/projects?key=<webApiKey>"`

- **2026-08-12: a fresh client signed in and pushed its emptiness up.** The
  fourth wipe, and the first to take the *subject tree and the game* rather
  than the cards. A phone opened the web app for the first time (empty
  localStorage), signed in, and 09:08:53Z the account went from 2 subjects
  and 3034 XP to none — while the 2889 cards, which travel separately,
  stayed. On screen: a full study queue, an empty library, level 1.
  The route in: `handleSignIn` calls `setGoogleUser` *before* awaiting its
  pull, which let the restore-a-session effect enter per-card mode during the
  sign-in. `handleSignIn` then hit `if (!perCardModeRef.current && …)`, found
  the mode already on, skipped `applyRemote`, and pushed the device's own
  empty `subjects`/`game` — with a fresh timestamp, courtesy of the quest
  rollover, so no timestamp guard fired. Fixed three ways: sign-in holds
  `signingInRef` so the effect stays out of it; adopting the parent doc no
  longer depends on the card-sync mode; and `syncGuards.js` refuses any push
  that replaces a non-empty subject tree with nothing from a session that has
  never read the account (`parentAdoptedRef`). Recovered from PITR.
- **The same day, 11:25Z: it happened again, to the fixed client.** The
  09:08 fix asked "has this session read the account yet?" — and the client
  that wiped it the second time *had*: correctly, days earlier, before this
  morning's bug left the empty catalog sitting in its own localStorage. Its
  clock kept ticking too, so its emptiness always carried the newer
  timestamp. **No timestamp comparison can separate a deliberate delete from
  a corrupted client; both are "local is newer".** The question that does is
  whether a person emptied the tree *in this session, on this device* —
  `emptiedSubjectsRef`, set on the >0 → 0 transition of a local edit and
  never on the state. Everything in `syncGuards.js` hangs off that, in both
  directions: a client holding nothing may not publish it, and a client
  holding nothing adopts the server's catalog regardless of timestamps
  (`shouldHealFromRemote`), which is how a device wiped earlier repairs
  itself.
- **The wipe invariant is enforced in `firestore.rules`, not just the
  client.** A write may not take a non-empty `subjects` (or `cards`) array to
  an empty one unless it carries `clearedOnPurpose` equal to that write's own
  `updatedAt` — one write's authorisation, not a switch that stays on. The
  client sets it only when `emptiedSubjectsRef` is true. Two client-side
  fixes failed in one day; this one cannot be defeated by a client bug, and
  an old build attempting the wipe now gets `PERMISSION_DENIED` and a sync
  error instead of destroying an account.
- **`match /users/{userId}/{document=**}` is gone, deliberately.** That
  wildcard matches the parent document as well as the subcollection, and
  rules are OR'd — leaving it in place would grant back exactly the
  unconditional write access the guard above withholds. The subcollection has
  its own `match /users/{userId}/cards/{cardId}` block, and per-card sync is
  dead without it, so **if you add another subcollection under `users/`, it
  needs its own match block too.** `node scripts/test-rules.mjs` covers all
  of this (68 assertions) and runs against the real Rules API.
- **PITR is on, with 7 days of retention.** Any document can be read as it
  was at any past instant: `GET …/documents/users/{uid}?readTime=2026-08-12T09:00:00Z`.
  This is the recovery path for anything sync destroys — check the history
  before concluding data is gone, and before writing anything else over it.
- **Cross-device sync has bitten this app three times.** Local data once
  overwrote a freshly signed-in account's cards; cards vanished from a
  logged-in account (~90 lost); and on 2026-08-11 a phone was wiped by the
  per-card migration (below). All three are fixed, but *any* change touching
  `firebaseSync.js`, `useSyncEngine.js` or `cardSync.js`, or the
  sign-in/sign-out path, needs deliberate testing with two accounts and two
  devices before shipping.
- **Old clients keep reading the parent doc's `cards` array — never empty it.**
  This is the 2026-08-11 wipe. The migration ran in a browser, moved 5,766
  cards into the subcollection, then pushed the parent document back with
  `cards: []`. The user's phone was on a pre-per-card build, read that array as
  the truth, and cleared itself. Nothing was lost server-side — the
  subcollection had everything — but the device looked empty.
  The rule that follows: **the parent-doc write in per-card mode merges and
  omits `cards`** (`pushParentData`), so the pre-migration array survives and
  an old client sees a stale-but-intact catalog rather than an empty one.
  `pushData` still overwrites without merging and is correct for the legacy
  whole-doc path — don't unify them.
  More generally: **the web app updates itself on every deploy, the APK only
  when the user installs it.** Assume a live account is being read by a client
  weeks behind, and never let a schema change hand that client a valid-looking
  empty state.
- **The two Anki routes name the same deck differently, so imports dedupe on
  content, not folder.** The AnkiDroid content provider reports a deck as it
  lists it (`Unidad 1`); an `.apkg` carries the full collection path
  (`¡Adelante 1!::Unidad 1::Primer paso`); a deck with no `::` lands in
  `Imported`. On 2026-08-11 three attempts at one 959-card deck produced three
  disjoint folder trees and 8,643 card documents, 5,754 of them orphaned when
  the parent-doc bugs ate the subject trees. `dropDuplicateCards` now keys on
  the two card sides — **don't "improve" it by including the folder**, which
  would restore the bug exactly.
- **Never learn who is signed in from a one-shot `getCurrentUser()`.** On the
  web it reads `auth.currentUser`, which is `null` until the Firebase JS SDK
  finishes restoring the persisted session — asynchronously, after mount. The
  app polled once on startup and rendered as signed out after *every* reload;
  since a signed-out client shows no cards, a fully synced catalog looked
  empty in the browser while the phone was fine. Subscribe to
  `firebaseSync.onAuthStateChanged` instead. **Native SDKs restore
  synchronously, so this class of bug is invisible on the phone** — when the
  web and the APK disagree about sync, suspect startup ordering in the browser
  before suspecting the data.
- **Per-card mode must be entered on session *restore*, not just sign-in.**
  `enterPerCardMode` was once reachable only from `handleSignIn`, so a page
  reload or app relaunch dropped the client back into legacy mode — no
  subcollection fetch, no cards listener, and the parent doc's dead `cards`
  array read as the catalog. Symptom: cards visible on the device that did the
  import, absent everywhere else. Two invariants hold the fix together:
  `applyRemote` ignores `remote.cards` whenever `cardsMigratedAt` is set, and a
  restored session adopts per-card mode for an already-migrated account.
- **A `useRef` flip does not re-run an effect.** `perCardModeRef` gating the
  cards listener meant that if the mode turned on after that effect had run,
  the subcollection went unwatched for the whole session. Mode now lives in
  state as well (`perCardMode`) and is in the effect's dependency list. Any
  future "am I in mode X" gate inside an effect needs the same treatment.
- **The migration can run more than once.** A legacy client's whole-doc write
  drops `cardsMigratedAt`, so the next new client migrates again. That's why
  `migrateCardsToSubcollection` merges against the existing subcollection and
  writes only what's missing or newer (`cardsNeedingWrite`) — a blind re-run
  would roll every card back to its pre-migration state and resurrect
  deletions. Covered by tests in `src/cardSync.test.js`.
- **Per-card sync has two deployment prerequisites.** Cards live in
  `users/{uid}/cards/{cardId}`, and Firestore rules **do not cascade into
  subcollections** — the grant is the recursive `match /users/{userId}/{document=**}`.
  Ship the rules *before* the client: `firebase deploy --only firestore:rules`.
  Without it every card read/write is `PERMISSION_DENIED`, sign-in fails for
  users who have cards, and accounts with none get marked migrated and then
  silently strand every card they add on-device.
  The parent doc keeps its pre-migration `cards` array as the rollback path, so
  in per-card mode nothing may adopt `remote.cards` — see
  `acceptRemoteParentIfNewer`. Breaking that invariant tombstones every card
  added since migration.
- **`isDue(card, now)` must never be passed bare to `Array.filter`.** `filter`
  supplies the index as the second argument, so `cards.filter(isDue)` compares
  every card against `now = 0` and reports the whole deck as not due. Write
  `cards.filter(c => isDue(c))`. This shipped once and silently emptied every
  study queue; `src/srs.test.js` documents it.
- **Bump `versionCode` in `android/app/build.gradle` before every Play
  upload** — Play permanently rejects a reused versionCode.
- `android/upload-keystore.jks` and `android/keystore.properties` are
  gitignored and **must never be committed**. Losing them means never being
  able to update the listing.

## Open items
- [ ] **The direct AnkiDroid import has never run against a real AnkiDroid.**
      The plugin compiles and is confirmed present in the packaged APK, and the
      permission and `<queries>` entries are in the merged manifest — but no one
      has watched a real deck come across the content provider. Test it on the
      phone that has AnkiDroid installed.

- [ ] **The free AI tier is not live yet, and no code change can close this.**
      The endpoint returns `{"error":"NOT_CONFIGURED"}` until a real Gemini key
      is set as the function secret and the functions are redeployed. Both
      steps need the owner's own Google account — exact commands in
      `PLAY_STORE.md` §8. Until then every client silently falls back to BYOK;
      nothing is broken, but the README's "free daily AI-import allowance" is
      a promise the app does not currently keep, so this is the one open item
      that is user-visible. The `ALLOWED_PROVIDERS` check is deployed
      (2026-08-11) but unreachable until then — the key check sits earlier in
      the handler, so nothing gets as far as the provider check while the
      function is unconfigured.
- [x] The functions ran on Node.js 20 (decommissioned 2026-10-30, which would
      have made `firebase deploy --only functions` fail outright and stranded
      any urgent fix). Moved to **Node.js 22 + firebase-functions 7.3.2** on
      2026-08-14 and deployed; the endpoint's behaviour is byte-identical
      across the upgrade. Next dates: deprecated 2027-04-30, decommissioned
      2028-10-31. `nodejs24` is also GA and decommissions on the *same* day,
      so it buys a longer un-deprecated window and nothing else; 22 was chosen
      to match this machine's local `node`, keeping local and production on one
      major and avoiding a mismatch warning on every deploy.

      **The runtime is pinned in two places** — `engines.node` in
      `functions/package.json` *and* `functions[].runtime` in `firebase.json`.
      Changing only the first silently leaves the deploy on the old runtime.

      v7's breaking changes were all inapplicable here: `functions.config()` was
      already replaced by `defineSecret`, there is no TypeScript, and the v1
      `Event` type is unused. v7.0.1 fixed a dual-package hazard for
      parameterized config in ESM projects, which is exactly this setup
      (`"type": "module"` + `defineSecret`) — so the upgrade removed a latent
      hazard rather than adding one.

      Note the CLI is installed via Homebrew at `/opt/homebrew/bin/firebase`;
      `npx firebase` does **not** work in this repo.

- [x] `firebase-admin` 13.x → **14.2.0** (2026-08-14), deployed. v14 requires
      Node >= 22, so it only became installable after the runtime bump, and it
      was kept to its own commit for that reason. None of v14's breaking
      changes reach this code: legacy namespace support was removed but the
      imports here are already modular (`firebase-admin/app` | `/auth` |
      `/firestore`), and the dropped Instance ID and legacy FCM types are
      unused. The v14 "error handling revamp" is the one to keep in mind if
      error handling here ever starts inspecting admin error codes — today
      nothing does; the only message-sniffing (`isUnknownModel`,
      `RESOURCE_EXHAUSTED`) is on `@google/genai` errors, not admin ones.

      **Caveat on how far this was verified:** while the function is
      unconfigured it returns `NOT_CONFIGURED` *before* reaching
      `verifyIdToken` or any Firestore transaction, so the admin SDK's real
      work is not exercised by any check available today. What is confirmed is
      that the module loads, `initializeApp()` succeeds, and the live endpoint
      is byte-identical before and after. The first real test of admin v14 will
      be the first successful AI import once the Gemini key is set — watch that
      import specifically.
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
      treating it as done. **The mutual-friending round trip especially** —
      49 rules assertions cover who may write a marker, but nobody has watched
      a marker actually make the return journey into the other person's list.
- [ ] **Reminders have not been seen firing on a physical device.** The
      scheduling decision is tested (`scripts/test-reminders.mjs`) and
      `POST_NOTIFICATIONS` is confirmed present in the built APK, but no one has
      watched a notification actually arrive. Check on a real phone, including
      after a reboot.
- [x] Accounts without a username used to publish `username: ""`, which meant
      no global board row and "Anonymous" on friends' boards — signed in but
      invisible, with nothing on screen explaining it. Fixed: a name is claimed
      automatically on sign-in and shown once in `UsernameNotice`. Existing
      nameless accounts repair themselves on next launch.

## Working with this user

- Native German speaker writing in English with frequent typos — read for
  intent, don't get literal about spelling. German is fine in replies.
- Wants work carried through end to end: build it, verify it on the real
  device or in the browser, ship it, then report. Don't hand back instructions
  when the step could have been done.
- Bug reports usually arrive as phone screenshots — check them for the actual
  visual defect (contrast and layout issues have been a recurring theme).
