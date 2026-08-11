import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GoogleGenAI } from "@google/genai";

initializeApp();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// The secret is created with this placeholder so the function can deploy
// before a real key exists. Until it's replaced, the free path reports itself
// as unavailable and every client quietly falls back to the user's own key —
// exactly how the app behaved before this path existed.
const PLACEHOLDER_KEY = "UNCONFIGURED";

// Every signed-in user gets this many AI imports a day on the shared key.
// Past it they're offered their own free Gemini key, which is unlimited from
// this app's point of view. This is what stops one user, or a bad actor with
// a script, from draining the whole project's daily quota.
const DAILY_LIMIT = 10;

// Per-user limits alone don't bound the project's exposure: the attacker's
// move is many accounts, not many requests from one. Google sign-in makes that
// expensive but not impossible, so this is the backstop — a ceiling across all
// users for the day, after which everyone is offered their own key (the same
// path an individual hits at DAILY_LIMIT, so no client change is needed).
//
// At DAILY_LIMIT = 10 this is ~200 fully-active users a day. Raise it as the
// user base grows; the cost of it being too low is a day of BYOK prompts, the
// cost of it being absent is the whole Gemini quota drained by a script.
//
// NOTE: this bounds the shared key only. The other half of the defence is that
// anonymous auth must stay DISABLED in the Firebase console — with it on, uids
// are free to mint and the per-user limit means nothing.
const GLOBAL_DAILY_LIMIT = 2000;

// Firebase uids are 28-char alphanumeric, so this can never collide with one.
const GLOBAL_DOC = "_global";

const MODELS = ["gemini-3.6-flash", "gemini-2.5-flash"];

const ALLOWED_ORIGINS = new Set([
  "https://centering-timer-502020-h0.web.app",
  "https://centering-timer-502020-h0.firebaseapp.com",
  // Capacitor serves the built app from these origins inside the native
  // WebView. Without them the Android build is blocked by CORS and silently
  // loses the free path.
  "https://localhost",
  "capacitor://localhost",
  "http://localhost",
]);

const CARDS_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string", description: "A short, general subject name for this material (e.g. 'Biology', 'Spanish'). Reuse one of the existing subjects given, exactly as spelled, if the content clearly fits it; otherwise invent a concise new one." },
    subcategory: { type: "string", description: "A short, more specific subcategory within the subject (e.g. 'Cell structure', 'Verb conjugation'). Reuse an existing subcategory of the matched subject if one fits." },
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string", description: "The question, prompt, or term" },
          back: { type: "string", description: "The answer or definition" },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
  },
  required: ["subject", "subcategory", "cards"],
  additionalProperties: false,
};

function buildInstructions(existingSubjects) {
  const base =
    "Extract flashcard-worthy question/answer or term/definition pairs from this " +
    "material. Use exact wording from the source where possible. Skip content that " +
    "isn't suited to a flashcard, such as page headers, chapter titles alone, or " +
    "page numbers. If nothing suitable is found, return an empty cards array. Also " +
    "decide which subject and subcategory this material belongs under.";
  if (!Array.isArray(existingSubjects) || existingSubjects.length === 0) return base;
  const list = existingSubjects
    .map((s) => `${s.name}${s.subcategories?.length ? " (subcategories: " + s.subcategories.join(", ") + ")" : ""}`)
    .join("; ");
  return `${base} Existing subjects: ${list}. Reuse one of these exactly (same spelling/case) if the content clearly matches; otherwise pick a sensible new subject and subcategory.`;
}

function parseCards(raw) {
  if (!raw) return { subject: "", subcategory: "", cards: [] };
  const parsed = JSON.parse(raw);
  return {
    subject: parsed.subject || "",
    subcategory: parsed.subcategory || "",
    cards: (parsed.cards || []).filter((c) => c && c.front && c.back),
  };
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.has(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Vary", "Origin");
}

const today = () => new Date().toISOString().slice(0, 10);

// Reserves one import against today's allowance — both the caller's own and
// the project-wide ceiling — resetting each counter when its day rolls over.
// Done in one transaction so two devices importing at once can't both slip
// past either limit. Firestore requires every read before any write, hence the
// two gets up front.
async function reserveQuota(uid) {
  const db = getFirestore();
  const ref = db.collection("aiUsage").doc(uid);
  const globalRef = db.collection("aiUsage").doc(GLOBAL_DOC);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const globalSnap = await tx.get(globalRef);

    const data = snap.exists ? snap.data() : null;
    const sameDay = data?.day === today();
    const used = sameDay ? data.count || 0 : 0;
    if (used >= DAILY_LIMIT) return { ok: false, remaining: 0, reason: "user" };

    const globalData = globalSnap.exists ? globalSnap.data() : null;
    const globalSameDay = globalData?.day === today();
    const globalUsed = globalSameDay ? globalData.count || 0 : 0;
    if (globalUsed >= GLOBAL_DAILY_LIMIT) return { ok: false, remaining: 0, reason: "global" };

    tx.set(ref, { day: today(), count: used + 1, updatedAt: FieldValue.serverTimestamp() });
    tx.set(globalRef, { day: today(), count: globalUsed + 1, updatedAt: FieldValue.serverTimestamp() });
    return { ok: true, remaining: DAILY_LIMIT - (used + 1), reason: null };
  });
}

// A failed generation shouldn't cost the user one of their ten — nor should it
// eat into the project-wide ceiling, since no Gemini call was actually spent.
async function refundQuota(uid) {
  const db = getFirestore();
  const ref = db.collection("aiUsage").doc(uid);
  const globalRef = db.collection("aiUsage").doc(GLOBAL_DOC);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const globalSnap = await tx.get(globalRef);
      const data = snap.exists ? snap.data() : null;
      const globalData = globalSnap.exists ? globalSnap.data() : null;
      if (data?.day === today() && data.count) {
        tx.set(ref, { day: today(), count: Math.max(0, data.count - 1) }, { merge: true });
      }
      if (globalData?.day === today() && globalData.count) {
        tx.set(globalRef, { day: today(), count: Math.max(0, globalData.count - 1) }, { merge: true });
      }
    });
  } catch {
    // Best effort — losing one credit is far better than failing the request.
  }
}

export const generateFlashcards = onRequest(
  { secrets: [GEMINI_API_KEY], cors: false, memory: "512MiB", timeoutSeconds: 120 },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey || apiKey === PLACEHOLDER_KEY) {
      return res.status(503).json({ error: "NOT_CONFIGURED" });
    }

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "Missing ID token" });

    let uid;
    try {
      ({ uid } = await getAuth().verifyIdToken(idToken));
    } catch {
      return res.status(401).json({ error: "Invalid ID token" });
    }

    const { type, text, imageBase64, mediaType, existingSubjects } = req.body || {};
    if (type !== "text" && type !== "image") {
      return res.status(400).json({ error: "type must be 'text' or 'image'" });
    }

    const quota = await reserveQuota(uid);
    if (!quota.ok) {
      // Both cases send the client down the same "offer your own key" path;
      // the distinct code is so the UI can say "you've used today's ten"
      // rather than "the app has used today's allowance", and so the two are
      // told apart in logs — a spike in `global` is the signal worth watching.
      const shared = quota.reason === "global";
      return res.status(429).json({
        error: shared ? "SHARED_QUOTA_EXCEEDED" : "QUOTA_EXCEEDED",
        remaining: 0,
        dailyLimit: DAILY_LIMIT,
      });
    }

    const instructions = buildInstructions(existingSubjects);
    const parts = type === "image"
      ? [
          { inlineData: { mimeType: mediaType, data: imageBase64 } },
          { text: `This is a photo of a book page or study material. ${instructions}` },
        ]
      : [{ text: `${instructions}\n\n---\n\n${String(text).slice(0, 50000)}` }];

    const ai = new GoogleGenAI({ apiKey });
    const isUnknownModel = (e) =>
      /NOT_FOUND|is not found|not supported|unsupported model|\b404\b/i.test(String(e?.message || e));

    let response, lastError;
    for (const model of MODELS) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: { responseMimeType: "application/json", responseJsonSchema: CARDS_SCHEMA },
        });
        break;
      } catch (e) {
        lastError = e;
        if (!isUnknownModel(e)) break;
      }
    }

    if (!response) {
      await refundQuota(uid);
      console.error(lastError);
      // Out of shared quota for the day, or Gemini refused. Either way the
      // client should offer the user their own key rather than just fail.
      const exhausted = /RESOURCE_EXHAUSTED|429|quota/i.test(String(lastError?.message || ""));
      return res.status(exhausted ? 429 : 502).json({
        error: exhausted ? "SHARED_QUOTA_EXCEEDED" : "GENERATION_FAILED",
      });
    }

    try {
      return res.status(200).json({ ...parseCards(response.text), remaining: quota.remaining });
    } catch (e) {
      await refundQuota(uid);
      console.error(e);
      return res.status(502).json({ error: "GENERATION_FAILED" });
    }
  }
);
