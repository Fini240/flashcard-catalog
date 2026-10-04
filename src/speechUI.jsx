import { useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { CardFace } from "./cardUI";
import * as tts from "./tts";

const commonLanguages = [
  ["es-ES", "Spanish"], ["de-DE", "German"], ["en-GB", "English"],
  ["fr-FR", "French"], ["it-IT", "Italian"], ["pt-PT", "Portuguese"],
];

export function PronounceFace({ card, subject, speechCards, side = "front", size, inactive = false }) {
  const speech = tts.pronunciationFor(card, subject, side, speechCards);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const action = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const text = card?.[side];
  const imageId = card?.[`${side}ImageId`];
  if (!speech || !tts.isSupported()) return <CardFace text={text} imageId={imageId} size={size} />;

  const play = async (lang = speech.lang) => {
    const token = ++action.current;
    setError("");
    if (!lang) { setError("Couldn't determine the language. Set it in the card editor."); return; }
    setBusy(true);
    const result = await tts.speak(speech.text, { ...speech, lang });
    if (!mounted.current || token !== action.current) return;
    setBusy(false);
    if (!result.ok && !["canceled", "interrupted"].includes(result.reason)) {
      setError(result.reason === "no-voice"
        ? "No voice for this language. Install it in your device's text-to-speech settings."
        : result.reason === "engine-unavailable"
          ? "Android's speech engine isn't ready. Check your text-to-speech settings and try again."
          : "Couldn't play pronunciation. Check your media volume and voice settings, then try again.");
    }
  };
  const activate = event => {
    event.stopPropagation();
    if (busy) { action.current++; tts.stop(); setBusy(false); }
    else void play();
  };
  const Icon = busy ? Square : Volume2;
  return <div className="fc-pronunciation">
    <div style={{ display: "flex", alignItems: "center", gap: 4, maxWidth: "100%", color: "var(--text-strong)", textAlign: "inherit" }}>
      <div style={{ minWidth: 0, overflowWrap: "anywhere" }}><CardFace text={text} size={size} /></div>
      <button type="button" tabIndex={inactive ? -1 : 0}
        aria-label={`${busy ? "Stop pronunciation" : "Read aloud"}: ${speech.text}`}
        title={busy ? "Stop pronunciation" : "Read aloud"} onClick={activate}
        onKeyDown={event => event.stopPropagation()}
        style={{ display: "grid", placeItems: "center", width: 48, height: 48, flexShrink: 0,
          border: "none", borderRadius: 8, background: "transparent", cursor: "pointer",
          color: busy ? "var(--text-strong)" : "var(--text-secondary)" }}>
        <Icon aria-hidden="true" size={19} />
      </button>
    </div>
    {error && <p role="status" style={{ fontSize: 12, color: "var(--text-secondary)", margin: "6px 0 0", fontFamily: "Inter, sans-serif" }}>{error}</p>}
    {error && tts.canOpenVoiceSettings() && <button type="button" tabIndex={inactive ? -1 : 0}
      onClick={async event => {
        event.stopPropagation();
        if (!await tts.openVoiceSettings()) setError("Open Android Settings and search for text-to-speech.");
      }} onKeyDown={event => event.stopPropagation()}
      style={{ border: "1px solid var(--card-border)", borderRadius: 6, background: "transparent",
        color: "var(--text-secondary)", minHeight: 44, marginTop: 6, padding: "6px 10px", cursor: "pointer" }}>
      Voice settings
    </button>}
  </div>;
}

// Keep corrections with the card, away from the study controls.
export function CardSpeechFields({ value, onChange, sides = ["front", "back"] }) {
  const [languages, setLanguages] = useState(commonLanguages);
  useEffect(() => {
    let active = true;
    tts.availableLanguages().then(list => {
      if (active) setLanguages([...commonLanguages, ...list
        .filter(l => !commonLanguages.some(([tag]) => tag === l.lang))
        .map(l => [l.lang, `${l.lang} — ${l.name}`])]);
    });
    return () => { active = false; };
  }, []);
  if (!sides.length) return null;
  return <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px", minWidth: 0 }}>
    <legend style={{ color: "var(--text-strong)", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Pronunciation</legend>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {sides.map(side => {
        const label = side === "front" ? "Front" : "Back";
        const lang = value?.[`${side}LanguageMode`] === "manual" ? value?.[`${side}Lang`] || "" : "";
        return <label key={side} style={{ flex: "1 1 130px", minWidth: 0, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", fontSize: 12 }}>
          {label} language
          <select aria-label={`${label} pronunciation language`} value={lang}
            onChange={event => onChange({ ...value, [`${side}Lang`]: event.target.value || null,
              [`${side}LanguageMode`]: event.target.value ? "manual" : "auto" })}
            style={{ display: "block", width: "100%", minHeight: 44, marginTop: 5, borderRadius: 8,
              border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--text-strong)", padding: "8px 10px", fontSize: 13 }}>
            <option value="">Automatic</option>
            {lang && !languages.some(([tag]) => tag === lang) && <option value={lang}>{lang}</option>}
            {languages.map(([tag, name]) => <option key={tag} value={tag}>{name}</option>)}
          </select>
        </label>;
      })}
    </div>
    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "var(--text-secondary)", margin: "6px 0 0" }}>Detects the language automatically. Choose one only to correct it for this card.</p>
  </fieldset>;
}
