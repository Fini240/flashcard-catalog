// ---------------------------------------------------------------------------
// The tutor — explaining, as opposed to generating.
//
// The AI in this app writes cards (aiImport) and tunes drills (aiDrills). Both
// produce *material*. What Quizlet's Q-Chat, Brainscape's Copilot and RemNote's
// tutor do instead is answer the question a person actually has at the moment
// they get something wrong: why is that the answer, and what did I confuse it
// with. That is the gap this closes, and the infrastructure for it already
// exists — same providers, same key handling, same graceful degradation.
//
// Three things it does, all triggered by the user rather than automatically:
//
//   explain(card)          — why this answer, in two or three sentences
//   whyWrong(card, given)  — what the given answer actually is, and how to tell
//                            them apart. The highest-value one: a wrong answer
//                            names the specific confusion to correct.
//   hint(card)             — a nudge that doesn't give it away, for a card the
//                            user is stuck on but wants to get themselves
//
// Explanations are cached by card and question, because the same card explained
// twice should not cost twice — and on the free tier it would fail the second
// time rather than being slower.
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { getApiKey, getProvider, getProviderInfo } from "./aiImport";
import { report } from "./report";
import * as cloze from "./cloze";

const CACHE_KEY = "tutor-cache-v1";
const MAX_CACHED = 200;
// Explanations are meant to be read on a phone between two cards. A long one
// is a worse answer, not a more thorough one.
const MAX_TOKENS = 700;

const SCHEMA = {
  type: "object",
  properties: {
    explanation: { type: "string", description: "Two or three sentences, plain language, no preamble." },
    // Optional and often absent — a model that invents a mnemonic for every
    // card produces noise, so the prompt asks for one only when it is genuinely
    // useful.
    memoryAid: { type: "string", description: "A short mnemonic, or an empty string if none is genuinely useful." },
    confusedWith: { type: "string", description: "What the user's wrong answer actually refers to, or an empty string." },
  },
  required: ["explanation", "memoryAid", "confusedWith"],
  additionalProperties: false,
};

// ---------- cache ----------

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCache = (cache) => {
  try {
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHED) {
      // Drop the oldest half rather than one at a time, so this trim runs
      // rarely instead of on every single write once the cap is reached.
      const sorted = keys.sort((a, b) => (cache[a].at || 0) - (cache[b].at || 0));
      for (const k of sorted.slice(0, Math.floor(keys.length / 2))) delete cache[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A full quota is not a reason to fail the explanation the user can already
    // see on screen.
  }
};

const cacheKey = (kind, card, extra) =>
  [kind, card?.id || "", String(card?.front || "").slice(0, 40), String(extra || "").slice(0, 40)].join("|");

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* nothing to clear */
  }
}

// ---------- prompts ----------

const cardText = (card) => {
  const front = card?.clozeSource
    ? cloze.render(card.clozeSource, card.clozeIndex).question
    : card?.front;
  const back = card?.clozeSource
    ? cloze.answersFor(card.clozeSource, card.clozeIndex).join(", ")
    : card?.back;
  return { front: String(front || "").slice(0, 600), back: String(back || "").slice(0, 600) };
};

// Context matters more than it looks: "Paris" as an answer means something
// different in a French vocabulary deck than in a geography deck, and the
// subject name is usually enough to tell them apart.
const context = (subject) => (subject ? ` The card is from a deck about "${String(subject).slice(0, 60)}".` : "");

function explainPrompt(card, subject) {
  const { front, back } = cardText(card);
  return `A student is studying flashcards and asked why this is the answer.${context(subject)}

Question: ${front}
Answer: ${back}

Explain in two or three plain sentences why that is the answer — the underlying fact or reasoning, not a restatement of the card. Write for a secondary-school student. Do not begin with "This card" or "The answer is". If a short mnemonic would genuinely help, give one in memoryAid; otherwise leave memoryAid empty. Leave confusedWith empty.

Answer in the language the card is written in.`;
}

function whyWrongPrompt(card, given, subject) {
  const { front, back } = cardText(card);
  return `A student answered a flashcard incorrectly and asked what went wrong.${context(subject)}

Question: ${front}
Correct answer: ${back}
What the student wrote: ${String(given || "").slice(0, 300)}

In confusedWith, say what the student's answer actually refers to — if it is a real thing that belongs to this subject, name it precisely. If their answer is simply wrong or empty rather than a confusion with something else, leave confusedWith empty.

In explanation, give two or three sentences telling the two apart in a way that will stick: the distinguishing feature, not a definition of each. If a mnemonic for the distinction would help, put it in memoryAid.

Answer in the language the card is written in.`;
}

function hintPrompt(card, subject) {
  const { front, back } = cardText(card);
  return `A student is stuck on a flashcard and wants a hint, not the answer.${context(subject)}

Question: ${front}
Answer (do NOT reveal this): ${back}

In explanation, give one sentence that points toward the answer — a category, a first letter, a related fact, an association. It must not contain the answer or any part of it, and must not be so vague that it helps with nothing. Leave memoryAid and confusedWith empty.

Answer in the language the card is written in.`;
}

// ---------- provider calls ----------

const isUnknownModel = (e) =>
  /NOT_FOUND|is not found|not supported|unsupported model|\b404\b/i.test(String(e?.message || e || ""));

async function callGemini(prompt) {
  const apiKey = getApiKey("gemini");
  if (!apiKey) throw new Error("NO_KEY");
  const ai = new GoogleGenAI({ apiKey });
  let response, lastError;
  for (const model of getProviderInfo("gemini").models) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json", responseJsonSchema: SCHEMA },
      });
      break;
    } catch (e) {
      lastError = e;
      if (!isUnknownModel(e)) throw e;
    }
  }
  if (!response) throw lastError || new Error("Gemini did not answer");
  return response.text;
}

async function callAnthropic(prompt) {
  const apiKey = getApiKey("anthropic");
  if (!apiKey) throw new Error("NO_KEY");
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const response = await client.messages.create({
    model: getProviderInfo("anthropic").model,
    max_tokens: MAX_TOKENS,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: prompt }],
  });
  return response.content.find((b) => b.type === "text")?.text;
}

export function parse(raw) {
  if (!raw) throw new Error("Empty reply");
  const text = String(raw).trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("Not an object");
  return {
    explanation: String(data.explanation || "").trim(),
    memoryAid: String(data.memoryAid || "").trim(),
    confusedWith: String(data.confusedWith || "").trim(),
  };
}

// A hint that contains the answer is not a hint. The model is asked not to, and
// this is what happens when it does anyway — the request is treated as failed
// rather than showing the user the answer they were trying not to see.
export function hintLeaksAnswer(hint, answer) {
  const a = String(answer || "").trim().toLowerCase();
  const h = String(hint || "").toLowerCase();
  if (!a || !h) return false;
  if (a.length >= 4 && h.includes(a)) return true;
  // Also catch the case where the answer is several words and the hint gives
  // away the distinctive one. Short words are skipped: "the" appearing in both
  // is not a leak.
  const words = a.split(/\s+/).filter((w) => w.length >= 5);
  return words.length > 0 && words.every((w) => h.includes(w));
}

async function ask(prompt) {
  const provider = getProvider();
  const raw = provider === "anthropic" ? await callAnthropic(prompt) : await callGemini(prompt);
  return parse(raw);
}

// ---------- the public API ----------

// All three return { ok, ... } rather than throwing: a tutor that fails must
// leave the review it was called from untouched, the same rule aiDrills follows.
async function cached(kind, key, prompt) {
  const cache = readCache();
  if (cache[key]) return { ok: true, ...cache[key].value, cached: true };
  try {
    const value = await ask(prompt);
    if (!value.explanation) return { ok: false, error: "EMPTY" };
    cache[key] = { at: Date.now(), value };
    writeCache(cache);
    return { ok: true, ...value, cached: false };
  } catch (e) {
    if (String(e?.message) === "NO_KEY") return { ok: false, error: "NO_KEY" };
    report(`tutor.${kind}`, e);
    return { ok: false, error: "FAILED" };
  }
}

export const explain = (card, opts = {}) =>
  cached("explain", cacheKey("explain", card), explainPrompt(card, opts.subject));

export const whyWrong = (card, given, opts = {}) =>
  cached("whyWrong", cacheKey("why", card, given), whyWrongPrompt(card, given, opts.subject));

export async function hint(card, opts = {}) {
  const result = await cached("hint", cacheKey("hint", card), hintPrompt(card, opts.subject));
  if (!result.ok) return result;
  const { back } = cardText(card);
  if (hintLeaksAnswer(result.explanation, back)) {
    // Don't cache a leaked hint — a retry may well produce a usable one.
    const cache = readCache();
    delete cache[cacheKey("hint", card)];
    writeCache(cache);
    return { ok: false, error: "LEAKED" };
  }
  return result;
}

export const isAvailable = () => !!getApiKey();
