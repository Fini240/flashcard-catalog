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
  required: ["cards"],
  additionalProperties: false,
};

const EXTRACTION_INSTRUCTIONS =
  "Extract flashcard-worthy question/answer or term/definition pairs from this " +
  "material. Use exact wording from the source where possible. Skip content that " +
  "isn't suited to a flashcard, such as page headers, chapter titles alone, or " +
  "page numbers. If nothing suitable is found, return an empty cards array.";

function parseCardsResponse(response) {
  const block = response.content.find((b) => b.type === "text");
  if (!block) return [];
  const parsed = JSON.parse(block.text);
  return (parsed.cards || []).filter((c) => c.front && c.back);
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
  return { available: true, cards: data.cards || [] };
}

export async function extractCardsFromImage(base64Data, mediaType) {
  const free = await tryFreeFunction({ type: "image", imageBase64: base64Data, mediaType });
  if (free.available) return free.cards;

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
          { type: "text", text: `This is a photo of a book page or study material. ${EXTRACTION_INSTRUCTIONS}` },
        ],
      },
    ],
  });
  return parseCardsResponse(response);
}

export async function extractCardsFromText(text) {
  const free = await tryFreeFunction({ type: "text", text });
  if (free.available) return free.cards;

  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { format: { type: "json_schema", schema: CARDS_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_INSTRUCTIONS}\n\n---\n\n${text.slice(0, 50000)}`,
      },
    ],
  });
  return parseCardsResponse(response);
}
