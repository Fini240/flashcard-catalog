import Anthropic from "@anthropic-ai/sdk";

const KEY_STORAGE = "anthropic-api-key";
const MODEL = "claude-opus-4-8";

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
  if (!apiKey) throw new Error("No Anthropic API key set.");
  // Direct browser access: the key lives on this device and calls Anthropic
  // straight from the WebView/browser. Fine for a single-user personal app;
  // don't reuse this pattern for anything with untrusted users.
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

export async function extractCardsFromImage(base64Data, mediaType) {
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
