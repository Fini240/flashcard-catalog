import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import Anthropic from "@anthropic-ai/sdk";

initializeApp();

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

// This app is for one person, not a public multi-tenant service — gate the
// (billed) AI endpoint to that one Google account so a leaked hosting URL
// can't run up someone else's Anthropic bill.
const ALLOWED_EMAIL = "der.finn.r@gmail.com";

const ALLOWED_ORIGINS = new Set([
  "https://centering-timer-502020-h0.web.app",
  "https://centering-timer-502020-h0.firebaseapp.com",
]);

const MODEL = "claude-opus-4-8";

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

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.has(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export const generateFlashcards = onRequest(
  { secrets: [ANTHROPIC_API_KEY], cors: false, memory: "512MiB", timeoutSeconds: 120 },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "Missing ID token" });

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: "Invalid ID token" });
    }
    if (decoded.email !== ALLOWED_EMAIL) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { type, text, imageBase64, mediaType, existingSubjects } = req.body || {};
    if (type !== "text" && type !== "image") {
      return res.status(400).json({ error: "type must be 'text' or 'image'" });
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    const instructions = buildInstructions(existingSubjects);

    try {
      const content =
        type === "image"
          ? [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              { type: "text", text: `This is a photo of a book page or study material. ${instructions}` },
            ]
          : `${instructions}\n\n---\n\n${String(text).slice(0, 50000)}`;

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        output_config: { format: { type: "json_schema", schema: CARDS_SCHEMA } },
        messages: [{ role: "user", content }],
      });

      return res.status(200).json(parseCardsResponse(response));
    } catch (e) {
      console.error(e);
      return res.status(502).json({ error: "Claude request failed" });
    }
  }
);
