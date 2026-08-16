// ---------------------------------------------------------------------------
// Sharing a deck.
//
// The cold-start problem: every card in this app has to be written by the
// person studying it. Quizlet, Knowt and AnkiWeb all lean on libraries of
// ready-made decks, and a new user there is studying within a minute.
//
// This is the cheap half of that, and it is cheap because the social layer
// already exists — friends, friend codes, a global board. A shared deck is one
// Firestore document holding a snapshot of the cards, addressed by a short code
// the owner can read out loud.
//
// Deliberately a *copy*, not a subscription. The recipient gets their own cards
// with their own scheduling, and later edits by the author do not reach back
// into a deck someone is halfway through learning. Live-updating shared decks
// are a much larger feature (conflict handling, deletions, moderation) and the
// copy is what people actually want when they say "send me your vocab list".
//
// What is NOT shared: images (they live only on the owner's device via
// imageStore), scheduling state, and anything identifying beyond the chosen
// username. See sanitizeCard.
// ---------------------------------------------------------------------------

import { FirebaseFirestore } from "@capacitor-firebase/firestore";
import { report } from "./report";
import * as tags from "./tags";

// Ambiguous characters are left out: a code is meant to be read aloud or typed
// off a screen, and 0/O and 1/I/L are where that goes wrong.
//
// L has to go as well as I, not just look like it should: normalizeCode maps a
// typed L onto 1 and then drops it as invalid, so a generated code containing
// an L could never be typed back in — the generator and the reader have to
// agree on the alphabet or sharing silently fails for 1 code in 6.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 6;
export const MAX_CARDS_PER_DECK = 2000;
// A Firestore document is capped at 1MiB; this keeps the snapshot clear of it
// with room for the metadata.
export const MAX_DECK_BYTES = 700 * 1024;

export function generateCode(rand = Math.random) {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return out;
}

// People type what they see, including the O they meant as a zero.
export function normalizeCode(input) {
  return String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    // Then map back into the alphabet: 0 and 1 aren't in it, so anything that
    // arrives as one was a misread 2..9 letter. Keeping them out entirely is
    // simpler than guessing, so they are simply dropped as invalid.
    .replace(/[01]/g, "")
    .slice(0, CODE_LENGTH);
}

export const isValidCode = (code) =>
  typeof code === "string" &&
  code.length === CODE_LENGTH &&
  [...code].every((ch) => CODE_ALPHABET.includes(ch));

// Strips a card down to what can be published. Everything personal — the
// schedule, the review history, the leech marks, the device-local image ids —
// is dropped rather than filtered later, so there is no path by which it can
// leak into a shared document.
export function sanitizeCard(card) {
  const out = {
    front: String(card?.front ?? "").slice(0, 2000),
    back: String(card?.back ?? "").slice(0, 2000),
  };
  if (card?.clozeSource) out.clozeSource = String(card.clozeSource).slice(0, 2000);
  if (card?.clozeIndex != null) out.clozeIndex = card.clozeIndex;
  if (Array.isArray(card?.manualOptions) && card.manualOptions.length) {
    out.manualOptions = card.manualOptions.slice(0, 8).map((o) => String(o).slice(0, 200));
  }
  const t = tags.cardTags(card);
  if (t.length) out.tags = t;
  return out;
}

// Cards that can't be shared, with the reason — shown before publishing rather
// than silently dropped, because "why are 12 of my 60 cards missing" is a
// question the recipient will ask the owner.
export function unshareable(cards) {
  return (cards || [])
    .filter((c) => c && !c.deletedAt)
    .map((c) => {
      if (c.frontImageId || c.backImageId) return { card: c, reason: "image" };
      if (c.occlusionMaskId) return { card: c, reason: "occlusion" };
      if (!String(c.front || c.clozeSource || "").trim()) return { card: c, reason: "empty" };
      return null;
    })
    .filter(Boolean);
}

// Builds the publishable payload. Pure, so the size and content rules are
// testable without touching Firestore.
export function buildPayload(deck, cards, owner) {
  const skipped = unshareable(cards);
  const skippedIds = new Set(skipped.map((s) => s.card.id));
  const usable = (cards || []).filter((c) => c && !c.deletedAt && !skippedIds.has(c.id));
  if (!usable.length) return { ok: false, error: "Nothing in this folder can be shared yet." };
  if (usable.length > MAX_CARDS_PER_DECK) {
    return { ok: false, error: `Decks are limited to ${MAX_CARDS_PER_DECK} cards.` };
  }

  const payload = {
    name: String(deck?.name || "Shared deck").slice(0, 60),
    description: String(deck?.description || "").slice(0, 200),
    cards: usable.map(sanitizeCard),
    cardCount: usable.length,
    // The username, never the Google display name — the same rule the public
    // profile follows.
    byUsername: String(owner?.username || "").slice(0, 16),
    byUid: owner?.uid || null,
    createdAt: Date.now(),
    version: 1,
  };

  const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (bytes > MAX_DECK_BYTES) {
    return { ok: false, error: "This folder is too large to share. Try sharing a subfolder." };
  }
  return { ok: true, payload, skipped, bytes };
}

// ---------- Firestore ----------

const deckRef = (code) => `sharedDecks/${code}`;

// Publishes and returns the code. Retries on collision: `create` only succeeds
// on a document that does not exist, so a taken code fails rather than
// overwriting somebody else's deck — the same trick the username reservation
// uses.
export async function publish(deck, cards, owner, opts = {}) {
  const built = buildPayload(deck, cards, owner);
  if (!built.ok) return built;

  const rand = opts.rand || Math.random;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode(rand);
    try {
      await FirebaseFirestore.setDocument({
        reference: deckRef(code),
        data: { ...built.payload, code },
        merge: false,
      });
      return { ok: true, code, skipped: built.skipped, cardCount: built.payload.cardCount };
    } catch (e) {
      // A denied write here is the "code already taken" path. Anything else
      // (offline, rules) is worth recording, and the loop will give up.
      report("deckShare.publish", e);
    }
  }
  return { ok: false, error: "Couldn't publish the deck. Check your connection and try again." };
}

export async function fetchDeck(code) {
  const clean = normalizeCode(code);
  if (!isValidCode(clean)) return { ok: false, error: "That code doesn't look right." };
  try {
    const { snapshot } = await FirebaseFirestore.getDocument({ reference: deckRef(clean) });
    const data = snapshot?.data;
    if (!data || !Array.isArray(data.cards)) {
      return { ok: false, error: "No deck with that code." };
    }
    return { ok: true, deck: data };
  } catch (e) {
    report("deckShare.fetch", e);
    return { ok: false, error: "Couldn't fetch that deck." };
  }
}

export async function unpublish(code) {
  try {
    await FirebaseFirestore.deleteDocument({ reference: deckRef(normalizeCode(code)) });
    return { ok: true };
  } catch (e) {
    report("deckShare.unpublish", e);
    return { ok: false };
  }
}

// Turns a fetched deck into cards for this user: new ids, no schedule, filed
// under the node the caller chose. `existing` suppresses cards the user already
// has, so importing the same deck twice doesn't double it.
export function toCards(deck, nodeId, opts = {}) {
  const seen = new Set(
    (opts.existing || []).map((c) => `${String(c.front || "").trim().toLowerCase()}\x00${String(c.back || "").trim().toLowerCase()}`)
  );
  const newId = opts.newId || (() => `s${Math.random().toString(36).slice(2, 11)}`);
  const out = [];
  let duplicates = 0;
  for (const c of deck?.cards || []) {
    const key = `${String(c.front || "").trim().toLowerCase()}\x00${String(c.back || "").trim().toLowerCase()}`;
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    out.push({
      id: newId(),
      nodeId,
      front: c.front || "",
      back: c.back || "",
      manualOptions: c.manualOptions || [],
      ...(c.clozeSource ? { clozeSource: c.clozeSource, clozeIndex: c.clozeIndex } : {}),
      ...(c.tags?.length ? { tags: tags.parseTags(c.tags) } : {}),
      // No scheduling fields at all: a shared deck arrives unlearned, because
      // the sender's memory of it is not the recipient's.
    });
  }
  return { cards: out, duplicates };
}
