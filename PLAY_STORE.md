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
| Privacy policy URL | `https://centering-timer-502020-h0.web.app/privacy.html` |
| Website (optional) | `https://centering-timer-502020-h0.web.app` |

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
Works completely offline with no account. Sign in with Google only if you want
your cards synced between your own devices. AI import is optional and uses a
free API key you control. No ads, no subscription, no tracking.
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
  photo, PDF or text, that content is sent to their selected AI provider
  (Google Gemini or Anthropic) to generate the cards. That counts as sharing
  with a third party even though it happens on the user's own API key.
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
- [ ] Privacy policy URL live — verify it loads: <https://centering-timer-502020-h0.web.app/privacy.html>
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Screenshots, icon, feature graphic uploaded
- [ ] Closed test with 12 testers for 14 days, if your account requires it
- [ ] Read the first-run warning below

---

## 8. Known issue to decide on before launch — **PRODUCT DECISION**

The free server-side AI path is locked to a single Google account
(`ALLOWED_EMAIL` in `functions/index.js`) so that strangers can't run up your
Anthropic bill. That's correct for cost, but it means **every Play user who
taps Import → Photo or PDF is told to go and fetch their own API key.**

Most people won't. That's a realistic source of one-star reviews.

What already works with no key at all, on any device:
- Creating and editing cards by hand
- Pasting `Front | Back` text
- The entire study and spaced-repetition system
- On Android, reading a photo on-device — and vocabulary lists become cards
  automatically with no key and no internet

Options, roughly in order of effort:

1. **Reframe the listing and onboarding** so manual + on-device import are the
   headline, and AI import is clearly a power-user extra. Cheapest, honest, no
   backend work.
2. **Ship a server-side Gemini key with per-user quotas** (e.g. 20 imports per
   account per day) in the existing Cloud Function. Gemini's free tier could
   absorb a modest user base at no cost, but you'd need to watch it and it
   becomes your bill if the app takes off.
3. **Leave as-is** and accept that AI import is a bring-your-own-key feature.

This one needs your call, not mine — it's a decision about what you're willing
to pay for.
