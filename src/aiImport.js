import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

const PROVIDER_STORAGE = "ai-provider";
const FUNCTION_URL = "https://us-central1-centering-timer-502020-h0.cloudfunctions.net/generateFlashcards";

// Gemini's free tier needs no credit card and allows hundreds of imports a
// day, far more than this app will ever use — so it's the default. Claude
// stays available for anyone who'd rather pay than have their notes used for
// model training (see FREE_TIER_TRAINS_ON_DATA below).
export const PROVIDERS = [
  {
    id: "gemini",
    label: "Gemini",
    note: "Free — no credit card needed",
    keyStorage: "gemini-api-key",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlLabel: "Google AI Studio",
    // Tried in order. Which models a free-tier key may call has changed with
    // each Gemini generation, so fall back to the previous one rather than
    // failing the import outright if the newest isn't available to this key.
    models: ["gemini-3.6-flash", "gemini-2.5-flash"],
  },
  {
    id: "anthropic",
    label: "Claude",
    note: "Paid — billed to your Anthropic account",
    keyStorage: "anthropic-api-key",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "Anthropic Console",
    model: "claude-opus-4-8",
  },
];

// Google is explicit that free-tier prompts and responses may be used to
// improve their models. Surfaced in Settings so the choice is an informed one.
export const FREE_TIER_TRAINS_ON_DATA = "gemini";

export function getProviderInfo(id) {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
}

function read(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch (e) {
    return "";
  }
}

export function getProvider() {
  const stored = read(PROVIDER_STORAGE);
  if (PROVIDERS.some((p) => p.id === stored)) return stored;
  // Nothing chosen yet: prefer whichever provider is actually set up, so an
  // existing install keeps working untouched, and send new installs to the
  // free one.
  if (getApiKey("gemini")) return "gemini";
  if (getApiKey("anthropic")) return "anthropic";
  return "gemini";
}

export function setProvider(id) {
  try {
    localStorage.setItem(PROVIDER_STORAGE, id);
  } catch (e) {
    // Storage unavailable — the default still applies for this session.
  }
}

export function getApiKey(provider = getProvider()) {
  return read(getProviderInfo(provider).keyStorage);
}

export function setApiKey(provider, key) {
  try {
    localStorage.setItem(getProviderInfo(provider).keyStorage, key.trim());
  } catch (e) {
    // ignore
  }
}

export function hasApiKey(provider = getProvider()) {
  return !!getApiKey(provider);
}

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

function normalizeCards(parsed) {
  return {
    subject: parsed?.subject || "",
    subcategory: parsed?.subcategory || "",
    cards: (parsed?.cards || []).filter((c) => c && c.front && c.back),
  };
}

function parseJsonCards(raw) {
  if (!raw) return { subject: "", subcategory: "", cards: [] };
  try {
    return normalizeCards(JSON.parse(raw));
  } catch (e) {
    throw new Error("The model didn't return usable flashcards. Please try again.");
  }
}

// ---------- free server-side path (any signed-in user) ----------
// Signed-in users get a daily allowance of imports through a Cloud Function
// holding a shared key, so nobody needs an API key to get started. Anything
// that makes that path unavailable — not signed in, allowance spent, function
// not configured, offline — returns `available: false`, and the caller falls
// back to the user's own key rather than failing.
let lastQuotaState = { exhausted: false, remaining: null, dailyLimit: null };

export function getQuotaState() {
  return lastQuotaState;
}

async function tryFreeFunction(payload) {
  let token;
  try {
    ({ token } = await FirebaseAuthentication.getIdToken());
  } catch (e) {
    return { available: false };
  }
  if (!token) return { available: false };

  let res;
  try {
    res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Network failure, CORS block, or the function isn't deployed yet.
    return { available: false };
  }

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    // Remember this so the UI can explain *why* it's asking for a key, rather
    // than the request appearing to fail for no reason.
    lastQuotaState = {
      exhausted: true,
      remaining: 0,
      dailyLimit: data.dailyLimit ?? null,
      shared: data.error === "SHARED_QUOTA_EXCEEDED",
    };
    return { available: false };
  }
  if (!res.ok) return { available: false };

  const data = await res.json().catch(() => ({}));
  lastQuotaState = { exhausted: false, remaining: data.remaining ?? null, dailyLimit: null };
  return { available: true, ...normalizeCards(data) };
}

// ---------- Gemini ----------
function geminiError(e) {
  const message = String(e?.message || e || "");
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(message)) {
    return new Error("You've used up today's free Gemini requests. Try again tomorrow, or switch provider in Settings.");
  }
  if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|\b401\b|\b403\b/i.test(message)) {
    return new Error("That Gemini API key was rejected. Check it in Settings.");
  }
  return new Error("Gemini couldn't process that. Please try again.");
}

// A key that isn't cleared for the newest model reports it as missing rather
// than as a quota or auth problem, which is the one case worth retrying.
const isUnknownModel = (e) =>
  /NOT_FOUND|is not found|not supported|unsupported model|\b404\b/i.test(String(e?.message || e || ""));

async function geminiExtract(parts) {
  const apiKey = getApiKey("gemini");
  if (!apiKey) throw new Error("NO_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const models = getProviderInfo("gemini").models;

  // Only the request is retried — parsing happens afterwards so a malformed
  // reply reports itself rather than being mistaken for a bad model name.
  let response, lastError;
  for (const model of models) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { responseMimeType: "application/json", responseJsonSchema: CARDS_SCHEMA },
      });
      break;
    } catch (e) {
      lastError = e;
      if (!isUnknownModel(e)) throw geminiError(e);
    }
  }
  if (!response) throw geminiError(lastError);
  return parseJsonCards(response.text);
}

// ---------- Anthropic ----------
async function anthropicExtract(content) {
  const apiKey = getApiKey("anthropic");
  if (!apiKey) throw new Error("NO_KEY");
  // Calls Anthropic straight from this device with the user's own key. The
  // owner's account never gets here — tryFreeFunction above succeeds first.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const response = await client.messages.create({
    model: getProviderInfo("anthropic").model,
    max_tokens: 4096,
    output_config: { format: { type: "json_schema", schema: CARDS_SCHEMA } },
    messages: [{ role: "user", content }],
  });
  const block = response.content.find((b) => b.type === "text");
  return parseJsonCards(block?.text);
}

export async function extractCardsFromImage(base64Data, mediaType, existingSubjects) {
  const free = await tryFreeFunction({ type: "image", imageBase64: base64Data, mediaType, existingSubjects });
  if (free.available) return normalizeCards(free);

  const prompt = `This is a photo of a book page or study material. ${buildInstructions(existingSubjects)}`;
  if (getProvider() === "gemini") {
    return geminiExtract([
      { inlineData: { mimeType: mediaType, data: base64Data } },
      { text: prompt },
    ]);
  }
  return anthropicExtract([
    { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
    { type: "text", text: prompt },
  ]);
}

export async function extractCardsFromText(text, existingSubjects) {
  const free = await tryFreeFunction({ type: "text", text, existingSubjects });
  if (free.available) return normalizeCards(free);

  const prompt = `${buildInstructions(existingSubjects)}\n\n---\n\n${text.slice(0, 50000)}`;
  if (getProvider() === "gemini") return geminiExtract([{ text: prompt }]);
  return anthropicExtract(prompt);
}
