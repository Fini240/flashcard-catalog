// ---------------------------------------------------------------------------
// Text to speech.
//
// A vocabulary card without a pronunciation is half a card, and the app already
// claims language learning in its onboarding. This uses the platform's own
// speech synthesis — native TextToSpeech on Android and Web Speech in browsers
// — so there is no service to pay
// for, nothing to send anywhere, and it works offline once the system voice is
// installed.
//
// The language matters more than the voice: reading German with an English
// voice is worse than not reading it at all. pickVoice() therefore prefers an
// exact locale match, then the same language in any region, and gives up rather
// than falling back to whatever voice happens to be first.
// ---------------------------------------------------------------------------

import { report } from "./report";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { toPlainText } from "./richText";
import { automaticSpeechLanguage } from "./speechLanguage";

const synth = () => (typeof window !== "undefined" ? window.speechSynthesis : null);
const native = () => Capacitor.isNativePlatform();
let nativePlugin;
const android = () => Capacitor.getPlatform() === "android";
const nativeTts = async () => {
  nativePlugin ??= android() ? registerPlugin("CatalogSpeech")
    : (await import("@capacitor-community/text-to-speech")).TextToSpeech;
  // Capacitor proxies synthesize every property, including `then`. Returning
  // one directly from async makes Promise resolution call plugin.then forever.
  return { plugin: nativePlugin };
};

const nativeReason = error => ({ CANCELED: "canceled", NO_VOICE: "no-voice",
  ENGINE_UNAVAILABLE: "engine-unavailable", PLAYBACK_TIMEOUT: "timeout" }[error?.code] || "error");

export const canOpenVoiceSettings = () => native() && android();
export async function openVoiceSettings() {
  if (!canOpenVoiceSettings()) return false;
  try { const { plugin } = await nativeTts(); await plugin.openInstall(); return true; }
  catch (e) { report("tts.settings", e); return false; }
}

export const isSupported = () => native() || !!synth();

// Voices load asynchronously on most platforms and the first call routinely
// returns an empty list, so this waits for the event rather than reporting
// "no voices" to a user who has plenty.
let voicesCache = null;
export function voices() {
  if (native()) return nativeTts().then(({ plugin }) => plugin.getSupportedVoices()).then(r => r.voices || []).catch(e => {
    report("tts.voices", e);
    return [];
  });
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
      s.removeEventListener?.("voiceschanged", done);
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

let request = 0;
let cancelActive = null;
export const stop = () => {
  request++;
  cancelActive?.({ ok: false, reason: "canceled" });
  cancelActive = null;
  try {
    if (native()) return nativeTts().then(({ plugin }) => plugin.stop()).catch(e => report("tts.stop", e));
    synth()?.cancel();
  } catch {
    // Cancelling something that isn't speaking is not a failure.
  }
};

// Speaks `text` and resolves when it finishes. Resolves rather than rejects on
// an unavailable voice: a card whose audio didn't play must not break the
// review it belongs to.
export async function speak(text, opts = {}) {
  const s = synth();
  const body = toPlainText(String(text || "")).trim().slice(0, 500);
  if (!isSupported() || !body) return { ok: false, reason: "unsupported" };

  // Cancel first: queuing is the default, so tapping through four cards
  // quickly would otherwise read all four in a row over each other.
  const stopping = stop();
  const token = request;
  await stopping;
  const list = await voices();
  // Navigating away or tapping again while voices load cancels this request too.
  if (token !== request) return { ok: false, reason: "canceled" };
  const voice = pickVoice(list, opts.lang, opts.voiceName);
  const { plugin } = native() ? await nativeTts() : { plugin: null };
  if (native()) {
    try {
      const { supported } = await plugin.isLanguageSupported({ lang: opts.lang || "en-US" });
      if (token !== request) return { ok: false, reason: "canceled" };
      if (!supported) return { ok: false, reason: "no-voice" };
    } catch (e) {
      report("tts.language", e);
      return { ok: false, reason: nativeReason(e) };
    }
  } else if (opts.strict && opts.lang && !voice) {
    return { ok: false, reason: "no-voice" };
  }

  return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          if (cancelActive === finish) cancelActive = null;
          resolve(result);
        };
        // Some engines fail to emit an end/error event. Always release the UI.
        const timeout = setTimeout(() => finish({ ok: false, reason: "timeout" }), 60000);
        cancelActive = finish;
        const rate = Math.min(2, Math.max(0.5, opts.rate ?? 0.95));
        const pitch = Math.min(2, Math.max(0, opts.pitch ?? 1));
        if (native()) {
          plugin.speak({ text: body, lang: opts.lang || "en-US", rate, pitch,
            ...(android() ? { voiceName: opts.voiceName } : voice ? { voice: list.indexOf(voice) } : {}),
            volume: 1, queueStrategy: 0 })
            .then(() => finish({ ok: true })).catch(e => {
              report("tts.speak", e);
              finish({ ok: false, reason: nativeReason(e) });
            });
          return;
        }
        const utterance = new SpeechSynthesisUtterance(body);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else if (opts.lang) {
          // No installed voice for the language. Setting lang anyway lets the
          // platform substitute if it can, but a wrong-language reading is
          // worse than silence, so a strict caller can opt out.
          utterance.lang = opts.lang;
        }
        utterance.rate = rate;
        utterance.pitch = pitch;
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
      });
}

// Manual pronunciation does not require automatic answer reading to be enabled.
// Detect the spoken side, using nearby vocabulary for ambiguous short words.
// Existing language settings are hints unless the user explicitly overrides Auto.
export function pronunciationFor(card, subject, side, pool = []) {
  const text = side === "front" ? card?.front : card?.back;
  if (!text?.trim() || card?.[`${side}ImageId`]) return null;
  const cfg = { ...subject?.speech, ...card?.speech };
  const manual = cfg[`${side}LanguageMode`] === "manual" && !!cfg[`${side}Lang`];
  const lang = manual ? cfg[`${side}Lang`] : automaticSpeechLanguage(toPlainText(text), {
    card, subject, side, pool, preferred: cfg[`${side}Lang`],
  });
  return { text, lang, automatic: !manual, rate: cfg.rate ?? 0.85,
    voiceName: cfg[`${side}Voice`], strict: true };
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
export function speechFor(card, subject, side, pool = []) {
  const cfg = subject?.speech || null;
  if (!cfg || !cfg.enabled) return null;
  const speech = pronunciationFor(card, subject, side, pool);
  return speech ? { ...speech, rate: cfg.rate ?? 0.95 } : null;
}
