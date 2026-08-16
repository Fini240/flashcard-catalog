// ---------------------------------------------------------------------------
// Text to speech.
//
// A vocabulary card without a pronunciation is half a card, and the app already
// claims language learning in its onboarding. This uses the platform's own
// speech synthesis — the Web Speech API, which Capacitor's WebView exposes on
// Android and every target browser supports — so there is no service to pay
// for, nothing to send anywhere, and it works offline once the system voice is
// installed.
//
// The language matters more than the voice: reading German with an English
// voice is worse than not reading it at all. pickVoice() therefore prefers an
// exact locale match, then the same language in any region, and gives up rather
// than falling back to whatever voice happens to be first.
// ---------------------------------------------------------------------------

import { report } from "./report";

const synth = () => (typeof window !== "undefined" ? window.speechSynthesis : null);

export const isSupported = () => !!synth();

// Voices load asynchronously on most platforms and the first call routinely
// returns an empty list, so this waits for the event rather than reporting
// "no voices" to a user who has plenty.
let voicesCache = null;
export function voices() {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now && now.length) {
    voicesCache = now;
    return Promise.resolve(now);
  }
  if (voicesCache) return Promise.resolve(voicesCache);
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      voicesCache = s.getVoices() || [];
      resolve(voicesCache);
    };
    s.addEventListener?.("voiceschanged", done, { once: true });
    // Some WebViews never fire the event when the list is genuinely empty.
    setTimeout(done, 1000);
  });
}

// BCP-47 tags compare case-insensitively and Android reports "de_DE" where the
// web reports "de-DE".
const canon = (tag) => String(tag || "").toLowerCase().replace(/_/g, "-");
const langOf = (tag) => canon(tag).split("-")[0];

export function pickVoice(list, lang, preferredName) {
  if (!lang) return null;
  const want = canon(lang);
  const base = langOf(lang);
  const named = preferredName && list.find((v) => v.name === preferredName);
  if (named && langOf(named.lang) === base) return named;
  return (
    list.find((v) => canon(v.lang) === want) ||
    list.find((v) => langOf(v.lang) === base) ||
    null
  );
}

export const stop = () => {
  try {
    synth()?.cancel();
  } catch {
    // Cancelling something that isn't speaking is not a failure.
  }
};

// Speaks `text` and resolves when it finishes. Resolves rather than rejects on
// an unavailable voice: a card whose audio didn't play must not break the
// review it belongs to.
export function speak(text, opts = {}) {
  const s = synth();
  const body = String(text || "").trim();
  if (!s || !body) return Promise.resolve({ ok: false, reason: "unsupported" });

  // Cancel first: queuing is the default, so tapping through four cards
  // quickly would otherwise read all four in a row over each other.
  stop();

  return voices().then(
    (list) =>
      new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(body.slice(0, 500));
        const voice = pickVoice(list, opts.lang, opts.voiceName);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else if (opts.lang) {
          // No installed voice for the language. Setting lang anyway lets the
          // platform substitute if it can, but a wrong-language reading is
          // worse than silence, so a strict caller can opt out.
          if (opts.strict) return resolve({ ok: false, reason: "no-voice" });
          utterance.lang = opts.lang;
        }
        utterance.rate = Math.min(2, Math.max(0.5, opts.rate ?? 0.95));
        utterance.pitch = Math.min(2, Math.max(0, opts.pitch ?? 1));

        let settled = false;
        const finish = (result) => {
          if (settled) return;
          settled = true;
          resolve(result);
        };
        utterance.onend = () => finish({ ok: true });
        utterance.onerror = (e) => {
          // "interrupted" is what cancel() produces and is not worth reporting.
          if (e?.error && e.error !== "interrupted" && e.error !== "canceled") {
            report("tts.speak", new Error(String(e.error)));
          }
          finish({ ok: false, reason: e?.error || "error" });
        };
        try {
          s.speak(utterance);
        } catch (e) {
          report("tts.speak", e);
          finish({ ok: false, reason: "throw" });
        }
      })
  );
}

// Languages the device can actually speak, for the per-subject language picker.
// Deduplicated by base language with the region kept, so the list reads
// "Deutsch (DE)" rather than five near-identical rows.
export async function availableLanguages() {
  const list = await voices();
  const seen = new Map();
  for (const v of list) {
    const key = canon(v.lang);
    if (!seen.has(key)) seen.set(key, { lang: v.lang, name: v.name, base: langOf(v.lang) });
  }
  return [...seen.values()].sort((a, b) => a.lang.localeCompare(b.lang));
}

// Which side of a card to read, and in which language. A vocabulary subject is
// typically native on one side and target on the other, so one language for the
// whole card would read half of it wrong.
export function speechFor(card, subject, side) {
  const cfg = subject?.speech || null;
  if (!cfg || !cfg.enabled) return null;
  const lang = side === "front" ? cfg.frontLang : cfg.backLang;
  if (!lang) return null;
  const text = side === "front" ? card?.front : card?.back;
  if (!text || (side === "front" && card?.frontImageId)) return null;
  return { text, lang, rate: cfg.rate ?? 0.95, voiceName: side === "front" ? cfg.frontVoice : cfg.backVoice };
}
