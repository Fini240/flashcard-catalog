// ---------------------------------------------------------------------------
// The model's contribution to studying: better exercise content than string
// manipulation can manage, and a read on which drills suit this particular
// deck.
//
// Deliberately optional. drills.js can build every drill on its own, so this
// only ever *improves* a session — if there's no key, the call fails, or the
// reply is malformed, the study flow carries on with local content and the
// user is told the drills are untuned rather than being blocked.
// ---------------------------------------------------------------------------
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { getApiKey, getProvider, getProviderInfo } from "./aiImport";
import { DRILLS } from "./drills";

// Bounds one request. A deck of 400 cards would otherwise be a very slow, very
// expensive call; cards past this simply use local content, which the queue
// builder already falls back to per card.
const MAX_CARDS = 30;
const CACHE_KEY = "drill-content-v1";
const MAX_CACHED_DECKS = 12;

const SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          blurb: { type: "string" },
        },
        required: ["id", "blurb"],
        additionalProperties: false,
      },
    },
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          clozeText: { type: "string" },
          clozeAnswer: { type: "string" },
          distractors: { type: "array", items: { type: "string" } },
          falseClaim: { type: "string" },
        },
        required: ["id", "clozeText", "clozeAnswer", "distractors", "falseClaim"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions", "cards"],
  additionalProperties: false,
};

function buildPrompt(cards) {
  const catalog = DRILLS.map((d) => `- ${d.id}: ${d.label} — ${d.blurb}`).join("\n");
  const list = cards
    .map((c) => `id=${c.id}\nQ: ${String(c.front || "").slice(0, 300)}\nA: ${String(c.back || "").slice(0, 300)}`)
    .join("\n\n");
  return `You are helping someone study these flashcards. Reply with JSON only.

Two jobs.

FIRST, "suggestions": rank which of these drills suit this deck, best first, and
write a short blurb for each that refers to what is actually in the deck. Use
only these ids:
${catalog}
Return between 2 and 4 of them. A blurb is at most 8 words, sentence case, no
final full stop. Say something specific — "the muscle tissue terms", not "your
cards".

SECOND, "cards": for every card id below, provide:
- clozeText: the answer written as a sentence with ONE important word replaced
  by exactly "____". Keep it a real sentence that can be reasoned about; never
  blank the only word. If the answer is a single word, write a short sentence
  that uses it in context and blank it there.
- clozeAnswer: the word that "____" stands for, exactly as it appears.
- distractors: exactly 3 wrong answers to this card's question. They must be
  plainly wrong to someone who knows the material, but tempting to someone who
  half-remembers it — the same kind of thing, the same length and register as
  the real answer. Never a rephrasing of the real answer.
- falseClaim: the answer altered so it is now false, changing as little as
  possible — a swapped number, a neighbouring structure, an inverted relation.

Write everything in the language of the cards themselves.

CARDS:
${list}`;
}

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
    max_tokens: 8192,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: prompt }],
  });
  return response.content.find((b) => b.type === "text")?.text;
}

function parse(raw) {
  if (!raw) throw new Error("Empty reply");
  const text = String(raw).trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("Not an object");
  return data;
}

// A model that ignores an instruction is a normal outcome, not an exception:
// anything malformed is dropped here so the queue builder falls back to local
// content for that one card instead of the whole drill failing.
export function shapeContent(data, cards) {
  const byId = new Map(cards.map((c) => [String(c.id), c]));
  const content = {};
  (Array.isArray(data.cards) ? data.cards : []).forEach((row) => {
    const card = byId.get(String(row?.id));
    if (!card) return;
    const entry = {};
    const text = typeof row.clozeText === "string" ? row.clozeText : "";
    const answer = typeof row.clozeAnswer === "string" ? row.clozeAnswer.trim() : "";
    // The blank has to be there and has to stand for something, or the
    // exercise is unanswerable.
    if (text.includes("____") && answer) entry.cloze = { text, answer, prompt: card.front };
    const distractors = (Array.isArray(row.distractors) ? row.distractors : [])
      .filter((d) => typeof d === "string" && d.trim())
      .map((d) => d.trim())
      // A "wrong" answer identical to the right one makes the question
      // unanswerable, and models do occasionally hand one back.
      .filter((d) => d.toLowerCase() !== String(card.back || "").trim().toLowerCase());
    if (distractors.length) entry.distractors = [...new Set(distractors)].slice(0, 3);
    const falseClaim = typeof row.falseClaim === "string" ? row.falseClaim.trim() : "";
    if (falseClaim && falseClaim.toLowerCase() !== String(card.back || "").trim().toLowerCase()) {
      entry.falseClaim = falseClaim;
    }
    if (Object.keys(entry).length) content[card.id] = entry;
  });
  return content;
}

export function shapeSuggestions(data) {
  const valid = new Set(DRILLS.map((d) => d.id));
  const seen = new Set();
  return (Array.isArray(data.suggestions) ? data.suggestions : [])
    .filter((s) => s && valid.has(s.id) && !seen.has(s.id) && seen.add(s.id))
    .map((s) => ({ id: s.id, blurb: typeof s.blurb === "string" ? s.blurb.slice(0, 60) : "" }))
    .slice(0, 4);
}

// ---------- cache ----------

// Content is worth keeping between sittings — it costs a call to make and only
// goes stale when the card text itself changes, which the fingerprint catches.
export function deckFingerprint(cards) {
  const basis = cards
    .map((c) => `${c.id}:${String(c.front || "").length}:${String(c.back || "").length}:${String(c.back || "").slice(0, 24)}`)
    .sort()
    .join("|");
  let h = 5381;
  for (let i = 0; i < basis.length; i++) h = ((h << 5) + h + basis.charCodeAt(i)) >>> 0;
  return `${cards.length}-${h.toString(36)}`;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function cachedTuning(fingerprint) {
  const entry = readCache()[fingerprint];
  return entry && entry.content ? entry : null;
}

function writeCache(fingerprint, entry) {
  try {
    const all = readCache();
    all[fingerprint] = { ...entry, at: Date.now() };
    const keys = Object.keys(all).sort((a, b) => (all[b].at || 0) - (all[a].at || 0));
    const trimmed = {};
    keys.slice(0, MAX_CACHED_DECKS).forEach((k) => { trimmed[k] = all[k]; });
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // A full quota only costs us the cache, not the session.
  }
}

export function hasKey() {
  return !!getApiKey(getProvider());
}

// Returns { content, suggestions }. Throws only for a caller that wants to
// explain itself — every caller in the app treats a throw as "carry on
// untuned".
export async function tuneDeck(cards) {
  const subset = cards.filter((c) => c && c.back && !c.backImageId).slice(0, MAX_CARDS);
  if (!subset.length) throw new Error("NO_TEXT_CARDS");

  const fingerprint = deckFingerprint(subset);
  const hit = cachedTuning(fingerprint);
  if (hit) return { ...hit, cached: true };

  const prompt = buildPrompt(subset);
  const raw = getProvider() === "gemini" ? await callGemini(prompt) : await callAnthropic(prompt);
  const data = parse(raw);
  const result = { content: shapeContent(data, subset), suggestions: shapeSuggestions(data) };
  if (Object.keys(result.content).length) writeCache(fingerprint, result);
  return result;
}
