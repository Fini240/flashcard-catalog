import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import Anthropic from "@anthropic-ai/sdk";

const KEY_STORAGE = "anthropic-api-key";
const MODEL = "claude-opus-4-8";
const FUNCTION_URL = "https://us-central1-centering-timer-502020-h0.cloudfunctions.net/generateFlashcards";

export function getApiKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch (e) {
    return "";
  }
}

export function setApiKey(key) {
  try {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } catch (e) {
    // ignore
  }
}

export function hasApiKey() {
  return !!getApiKey();
}

function getClient() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_KEY");
  // Fallback for everyone besides the app owner: calls Anthropic straight from
  // this device with the customer's own key. The owner's account never hits
  // this — tryFreeFunction below succeeds first.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
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

function parseCardsResponse(response) {
  const block = response.content.find((b) => b.type === "text");
  if (!block) return { subject: "", subcategory: "", cards: [] };
  const parsed = JSON.parse(block.text);
  return {
    subject: parsed.subject || "",
    subcategory: parsed.subcategory || "",
    cards: (parsed.cards || []).filter((c) => c.front && c.back),
  };
}

// The app owner's own Google account gets flashcard extraction for free
// through a Cloud Function holding a server-side Anthropic key. The function
// rejects every other account with 401/403 — we treat that as "not
// available" and fall through to the customer's own key, not as an error.
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
    // Network failure, CORS block, or the function isn't deployed yet —
    // treat it the same as "not the owner" and let BYOK handle it.
    return { available: false };
  }
  if (res.status === 401 || res.status === 403 || res.status === 404) return { available: false };

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "AI import request failed.");
  return { available: true, subject: data.subject || "", subcategory: data.subcategory || "", cards: data.cards || [] };
}

export async function extractCardsFromImage(base64Data, mediaType, existingSubjects) {
  const free = await tryFreeFunction({ type: "image", imageBase64: base64Data, mediaType, existingSubjects });
  if (free.available) return { subject: free.subject, subcategory: free.subcategory, cards: free.cards };

  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { format: { type: "json_schema", schema: CARDS_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
          { type: "text", text: `This is a photo of a book page or study material. ${buildInstructions(existingSubjects)}` },
        ],
      },
    ],
  });
  return parseCardsResponse(response);
}

export async function extractCardsFromText(text, existingSubjects) {
  const free = await tryFreeFunction({ type: "text", text, existingSubjects });
  if (free.available) return { subject: free.subject, subcategory: free.subcategory, cards: free.cards };

  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { format: { type: "json_schema", schema: CARDS_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `${buildInstructions(existingSubjects)}\n\n---\n\n${text.slice(0, 50000)}`,
      },
    ],
  });
  return parseCardsResponse(response);
}
