import { useEffect, useSyncExternalStore } from "react";
import german from "./locales/de.json";

export const LANGUAGE_KEY = "flashcard-catalog-language";
export const LANGUAGE_CHOICES = [
  { id: "system", label: "Follow device language" },
  { id: "en", label: "English" },
  { id: "de", label: "Deutsch" },
];
const listeners = new Set();
let fallbackChoice = "system";
let sessionChoice = null;
export function readLanguageChoice(raw) {
  return LANGUAGE_CHOICES.some(c => c.id === raw) ? raw : "system";
}
export function getLanguageChoice() {
  if (sessionChoice !== null) return sessionChoice;
  try { return readLanguageChoice(localStorage.getItem(LANGUAGE_KEY)); }
  catch { return fallbackChoice; }
}
export function resolveLanguage(choice, deviceLanguage = globalThis.navigator?.language) {
  return choice === "de" || choice === "system" && /^de\b/i.test(deviceLanguage || "") ? "de" : "en";
}
export function appLanguage() { return resolveLanguage(getLanguageChoice()); }
export function appLocale() { return appLanguage() === "de" ? "de-DE" : "en-US"; }
function notify() { for (const listener of listeners) listener(); }
export function setAppLanguage(choice) {
  fallbackChoice = readLanguageChoice(choice);
  try { localStorage.setItem(LANGUAGE_KEY, fallbackChoice); sessionChoice = null; }
  catch { sessionChoice = fallbackChoice; }
  notify();
}
function subscribe(listener) {
  listeners.add(listener);
  const storage = e => { if (e.key === LANGUAGE_KEY || e.key === null) { sessionChoice = null; listener(); } };
  window.addEventListener("storage", storage);
  window.addEventListener("languagechange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storage);
    window.removeEventListener("languagechange", listener);
  };
}
function snapshot() { return `${getLanguageChoice()}:${appLanguage()}`; }
export function useAppLanguage() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "system:en");
  const [choice, language] = state.split(":");
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return { choice, language, setLanguage: setAppLanguage };
}

// Only app-owned copy goes through this function. Cards, names, notes, answer
// options, tags and model-generated explanations are rendered verbatim.
const messagePatterns = Object.keys(german).filter(key => /\{\d+\}/.test(key)).sort((a, b) => b.length - a.length).map(key => {
  const indices = [];
  const pattern = key.split(/(\{\d+\})/).map(part => {
    const match = part.match(/^\{(\d+)\}$/);
    if (match) { indices.push(Number(match[1])); return "(.*?)"; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
  return { key, indices, expression: new RegExp(`^${pattern}$`, "s") };
});
export function t(source, values = []) {
  if (typeof source !== "string") return source;
  let key = source.trim();
  if (!key) return source;
  const germanMode = appLanguage() === "de";
  // Completion/error messages can have been generated before a language
  // switch. Translate their known templates at display time as well.
  if (germanMode && german[key] === undefined && values.length === 0) {
    for (const pattern of messagePatterns) {
      const match = key.match(pattern.expression);
      if (!match) continue;
      values = [];
      pattern.indices.forEach((index, i) => { values[index] = match[i + 1]; });
      key = pattern.key;
      break;
    }
  }
  const translated = germanMode ? german[key] ?? key : key;
  const output = translated.replace(/\{(\d+)(?:\|([^{}|]+)\|([^{}|]+))?\}/g, (match, index, one, many) => {
    if (values[index] === undefined) return match;
    if (one !== undefined) return Number(values[index]) === 1 ? one : many;
    const value = values[index];
    return value == null || typeof value === "boolean" ? "" : String(value);
  });
  return (source.match(/^\s*/)?.[0] || "") + output + (source.match(/\s*$/)?.[0] || "");
}
