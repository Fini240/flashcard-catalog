import { detectAll } from "tinyld/light";

const locales = {
  de: "de-DE", en: "en-GB", es: "es-ES", fr: "fr-FR", it: "it-IT", pt: "pt-PT",
  nl: "nl-NL", da: "da-DK", no: "nb-NO", sv: "sv-SE", fi: "fi-FI", pl: "pl-PL",
  cs: "cs-CZ", sk: "sk-SK", hu: "hu-HU", ro: "ro-RO", tr: "tr-TR", el: "el-GR",
  ru: "ru-RU", uk: "uk-UA", ar: "ar-SA", he: "he-IL", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN",
};
const base = tag => String(tag || "").replace(/_/g, "-").split("-")[0].toLowerCase();
const namedLanguages = [
  [/\b(spanish|spanisch|español|adelante)\b/i, "es"],
  [/\b(german|deutsch)\b/i, "de"], [/\b(english|englisch)\b/i, "en"],
  [/\b(french|französisch|français)\b/i, "fr"], [/\b(italian|italienisch|italiano)\b/i, "it"],
  [/\b(portuguese|portugiesisch|português)\b/i, "pt"],
];
const clean = text => String(text || "").replace(/\{\{c\d+::(.*?)(?:::[^}]*?)?\}\}/g, "$1")
  .replace(/https?:\/\/\S+/g, " ").trim().slice(0, 500);
const letters = text => (text.match(/\p{L}/gu) || []).length;

function evidence(text) {
  // Function words are especially useful on vocabulary cards, where a model
  // has only a handful of character sequences to compare.
  const markers = [
    [/\b(?:das|der|die|sich|ist|wohnen|befinden)\b|ß/i, "de"],
    [/\b(?:el|los|las)\b|[¿¡ñ]/i, "es"],
    [/\b(?:the|to|and|is|are|this)\b/i, "en"],
    [/\b(?:le|les|une|bonjour)\b/i, "fr"],
  ];
  const hits = markers.filter(([re]) => re.test(text));
  const strong = hits.length === 1 && (text.split(/\s+/).length >= 2 || /[ß¿¡ñ]/i.test(text)) ? hits[0][1] : null;
  // "la" is not a Portuguese article; a statistical near-tie for "la casa"
  // must not turn Spanish into Portuguese simply because both use "casa".
  const list = detectAll(text).filter(row => locales[row.lang] &&
    !(row.lang === "pt" && /^la\s/i.test(text)));
  const first = list[0], second = list[1];
  const margin = first ? (first.accuracy - (second?.accuracy || 0)) / first.accuracy : 0;
  return { lang: strong || first?.lang || null,
    clear: !!strong || !!first && letters(text) >= 4 &&
      (first.accuracy >= 0.6 || first.accuracy >= 0.08 && margin >= 0.4), list };
}

// Reuse the sample analysis across renders and cards in a folder. A changed
// catalog array starts a new cache, so edits/imports cannot leave stale results.
const contextCache = new WeakMap();
function contextFor(pool, card, subject, side) {
  if (!pool?.length) return null;
  let cached = contextCache.get(pool);
  if (!cached) { cached = new Map(); contextCache.set(pool, cached); }
  const key = JSON.stringify([subject?.id, card?.nodeId, side]);
  if (cached.has(key)) return cached.get(key);
  const ids = new Set();
  const walk = node => { if (!node) return; ids.add(node.id); node.children?.forEach(walk); };
  walk(subject);
  const collect = folderOnly => {
    const samples = [];
    for (const candidate of pool) {
      if (candidate.deletedAt || candidate[`${side}ImageId`]) continue;
      const belongs = subject?.id ? candidate.subjectId === subject.id || ids.has(candidate.nodeId)
        : card?.nodeId && candidate.nodeId === card.nodeId;
      if (!belongs || folderOnly && candidate.nodeId !== card?.nodeId) continue;
      const value = clean(candidate[side]);
      if (letters(value) >= 2) samples.push(value.slice(0, 150));
      if (samples.length === 64) break;
    }
    return samples;
  };
  let samples = collect(true);
  if (samples.length < 3) samples = collect(false);
  const joined = samples.join("\n");
  const result = samples.length >= 2 && letters(joined) >= 24 ? evidence(joined) : null;
  cached.set(key, result);
  return result;
}

export function automaticSpeechLanguage(text, { card, subject, side = "front", pool = [], preferred, deviceLang } = {}) {
  const content = evidence(clean(text));
  const context = contextFor(pool, card, subject, side);
  const named = side === "front" ? namedLanguages.find(([re]) => re.test(subject?.name || ""))?.[1] : null;
  const hint = base(preferred) || named;
  const shortWord = /^\p{Script=Latin}{1,5}$/u.test(clean(text));
  let language;
  if (shortWord && context?.lang) language = context.lang;
  else if (shortWord && hint) language = hint;
  else if (content.clear) language = content.lang;
  else if (context?.lang) language = context.lang;
  else if (hint) language = hint;
  else language = content.lang;
  // An almost-equal statistical result should defer to a named language
  // subject, while clear German on a Spanish deck's front still stays German.
  if (!content.clear && !context?.clear && named && content.list.some(row => row.lang === named &&
    row.accuracy >= (content.list[0]?.accuracy || 0) * 0.6)) language = named;
  if (!language) return deviceLang || (typeof navigator !== "undefined" ? navigator.language : null) || "en-GB";
  return base(preferred) === language ? preferred : locales[language] || language;
}
