# Publishing Flashcard Catalog to Google Play

Everything needed for the store listing. Sections marked **YOU** need your
Google account, your money, or a secret only you should hold — they can't be
done for you. Everything else is already done and committed.

---

## 1. Generate your upload keystore — **YOU**

This is the single most important step. If you lose this file or its password,
you can never publish an update to the app again; you'd have to publish a new
listing under a new package name and lose all your users and reviews.

Run this once, from the `android/` directory:

```bash
cd android && keytool -genkeypair -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

It asks for a password (twice) and some name/organisation details — the details
can be anything sensible, they're not shown in the store. Then create
`android/keystore.properties` from the template:

```bash
cp android/keystore.properties.example android/keystore.properties
```

…and fill in the password you just chose:

```properties
storeFile=upload-keystore.jks
storePassword=<the password you chose>
keyAlias=upload
keyPassword=<the same password, unless you set a different key password>
```

Both `upload-keystore.jks` and `keystore.properties` are already in
`.gitignore`, so they will never be committed. **Back both up somewhere safe
and private** — a password manager entry plus an offline copy is sensible. Not
in this repository, and not anywhere public.

> Until this file exists, `bundleRelease` still succeeds — it just produces an
> unsigned bundle, which Play won't accept. Nothing else breaks.

---

## 2. Build the signed bundle — **AUTOMATED**

Once the keystore is in place:

```bash
npm run build && npx cap sync android && cd android && ./gradlew bundleRelease
```

The uploadable file lands at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Play needs the `.aab`, not an APK. The APK in the GitHub release stays as the
direct-download build for yourself.

**Remember to bump `versionCode` in `android/app/build.gradle` before every
upload** — Play rejects a bundle whose `versionCode` it has already seen, even
if you're re-uploading after a rejection.

---

## 3. Create the Play Developer account — **YOU**

- Sign up at <https://play.google.com/console> — **one-time $25 fee**, needs a card.
- Google requires **identity verification** for new personal developer accounts
  (legal name, address, phone; sometimes a document). This can take a few days,
  so start it early rather than the night you want to launch.
- Personal accounts **created after 13 November 2023** must run a **closed test
  with at least 12 testers who stay opted in for 14 continuous days** before
  they're allowed to apply for production access. Organisation accounts are
  exempt. Plan for this — it's the step that surprises people, and it's two
  weeks of calendar time you can't compress. Invite testers by email address or
  a Google Group.
- Since April 2026 Google also rejects production applications where the
  testers never actually *used* the app, and where there are unresolved
  stability issues. So pick 12 people who will genuinely open it a few times,
  not 12 addresses that just accept the invite.

---

## 4. Store listing — **CONTENT READY, YOU UPLOAD**

All assets are in `play-assets/`, generated to Play's required sizes.

| Field | Value |
|---|---|
| App name | `Flashcard Catalog` |
| Short description (≤80) | `Make flashcards from photos and PDFs, then review them right on time.` |
| Category | Education |
| Contact email | der.finn.r@gmail.com |
| Privacy policy URL | `https://flashcard-catalog.web.app/privacy.html` |
| Website (optional) | `https://flashcard-catalog.web.app` |

**Full description** (paste as-is):

```
Flashcard Catalog is a study app built around one idea: you should review a
card just before you'd forget it, not whenever you happen to open the app.

ORGANISE LIKE A REAL CARD DRAWER
Sort cards into subjects and subcategories as deep as you like. Search every
card you own from the home screen and jump straight to editing it.

REVIEW ON A SCHEDULE THAT WORKS
Every card you answer moves through a spaced-repetition schedule. Get it right
and it comes back in 1, 3, 7, 14 then 30 days. Get it wrong and it stays due.
The home screen tells you exactly how many cards are ready for review.

THREE WAYS TO ANSWER
Flip the card, pick from multiple choice, or type the answer out — chosen per
card, so vocabulary and definitions can behave differently.

BUILD CARDS WITHOUT THE TYPING
Photograph a textbook page or your notes and the app turns it into cards. On
Android the text is read on your device first, so it's fast and works even
with no signal — plain vocabulary lists become cards with no internet at all.
PDFs, Word documents and pasted text work too, and the app files the new cards
under the right subject on its own.

YOURS, AND OPTIONAL EVERYTHING
Works completely offline with no account. Sign in with Google to sync cards
between your own devices and get ten AI imports a day at no cost — no API key,
no subscription. Bring your own free key if you want more. No ads, no tracking.
```

**Assets to upload:**

| Asset | File | Size |
|---|---|---|
| App icon | `play-assets/icon-512.png` | 512×512 |
| Feature graphic | `play-assets/feature-graphic-1024x500.png` | 1024×500 |
| Phone screenshots (need ≥2, these are 4) | `play-assets/screenshot-1-catalog.png`, `-2-subject`, `-3-study-setup`, `-4-session` | 824×1830 |

To regenerate the screenshots after UI changes: run `npm run dev` in one
terminal, then `node scripts/screenshots.mjs`.

---

## 5. Data safety form — **ANSWERS READY, YOU ENTER**

Play Console → App content → Data safety. These answers match what the code
actually does; don't guess differently, since a mismatch is a policy violation.

**Does your app collect or share any of the required user data types?** → **Yes**

| Data type | Collected | Shared | Purpose | Required? |
|---|---|---|---|---|
| Personal info → Email address | Yes | No | App functionality (account sync) | Optional — only if the user signs in |
| Personal info → Name | Yes | No | App functionality (account sync) | Optional — only if the user signs in |
| App activity → Other user-generated content (flashcards) | Yes | **Yes** | App functionality | Optional |

Notes for the remaining questions:

- **Is data encrypted in transit?** → Yes (all traffic is HTTPS).
- **Can users request data deletion?** → Yes. Deletion is by email request; the
  privacy policy states this and gives the address.
- **Why "shared" for flashcard content:** when the user chooses to import a
  photo, PDF or text, that content is sent to an AI provider (Google Gemini, or
  Anthropic if they've selected it) to generate the cards — either through this
  app's server or directly with the user's own key. Either way it counts as
  sharing with a third party. Nothing is sent unless the user starts an import.
- **Do not** declare location, contacts, financial info, photos/videos, or
  device identifiers — the app collects none of them. Card pictures never leave
  the device.
- **No data is collected for analytics or advertising**, and there is no
  tracking SDK in the app.

---

## 6. Content rating & audience — **YOU (answers below)**

Play Console → App content → Content rating questionnaire.

- Category: **Reference, News, or Educational**
- Violence / sexual content / profanity / drugs / gambling: **No** to all
- User-generated content shared with others: **No** (cards sync only to the
  same user's own devices; nothing is public or user-to-user)
- Expected result: **Everyone / PEGI 3**

Target audience: **13+**. Do not select an under-13 age group — that opts you
into Families policy and additional requirements, and the app isn't designed
for children.

Other App content sections to complete: Ads → **No ads**; Data safety (above);
Government apps → No; Financial features → None; Health → None.

---

## 7. Before you hit publish — checklist

- [ ] Keystore generated and **backed up** (step 1)
- [ ] `versionCode` bumped
- [ ] Signed `.aab` built and uploaded
- [ ] Privacy policy URL live — verify it loads: <https://flashcard-catalog.web.app/privacy.html>
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Screenshots, icon, feature graphic uploaded
- [ ] Closed test with 12 testers for 14 days, if your account requires it
- [ ] Read the first-run warning below

---

## 8. Turn on the free AI allowance — **YOU (one command)**

Every signed-in user gets **10 AI imports a day** with no API key at all, served
by the Cloud Function. That's already built and deployed — it just needs a real
Gemini key, because one can only be created from your own Google account.

Until you do this, the function reports itself as unconfigured and every client
quietly falls back to "add your own key", exactly as the app behaved before.
Nothing is broken in the meantime.

1. Create a free key at <https://aistudio.google.com/apikey> (no card needed).
2. Store it as the function's secret and redeploy:

```bash
printf 'YOUR_GEMINI_KEY' | /opt/homebrew/bin/firebase functions:secrets:set GEMINI_API_KEY --data-file - --project centering-timer-502020-h0
```

```bash
/opt/homebrew/bin/firebase deploy --only functions --project centering-timer-502020-h0
```

The full path is deliberate: `firebase-tools` is installed globally via Homebrew
and is *not* a dependency of this repo, so `npx firebase` fails with "could not
determine executable to run". (`npx cap` elsewhere in this file is fine —
`@capacitor/cli` really is a local devDependency.)

The redeploy is required — functions pick up a new secret version only on
deploy. To confirm it worked, the endpoint should stop returning
`{"error":"NOT_CONFIGURED"}`:

```bash
curl -s -X POST https://us-central1-centering-timer-502020-h0.cloudfunctions.net/generateFlashcards -H "Content-Type: application/json" -d '{"type":"text","text":"hi"}'
```

Expect `{"error":"Missing ID token"}` once configured — that means it got past
the key check and is asking for a signed-in user, which is correct.

**Watch your usage** at <https://aistudio.google.com/rate-limit> for the first
few weeks. The daily allowance is shared across all users, so the per-user cap
is what protects you. To change it, edit `DAILY_LIMIT` in `functions/index.js`
and redeploy. If the shared pool runs dry, users are told so and offered their
own key — the app never simply fails.

---

## 9. Older note — resolved by section 8

**This is now solved** — kept here only to record the reasoning.

The free path used to be locked to a single Google account, which meant every
Play user was told to fetch their own API key before photo or PDF import
worked. Most people won't, and that's a realistic source of one-star reviews.

It's been replaced by the hybrid in section 8: 10 free imports a day per
signed-in user on the shared key, then an offer to add their own free key for
unlimited use. Your exposure is bounded by the per-user cap.

What works with no key at all, on any device, even signed out:
- Creating and editing cards by hand
- Pasting `Front | Back` text
- The entire study and spaced-repetition system
- On Android, reading a photo on-device — and vocabulary lists become cards
  automatically with no key and no internet

Option 2 of the three originally considered — a server-side key with per-user
quotas — is what shipped. See section 8 for the one command that activates it.
