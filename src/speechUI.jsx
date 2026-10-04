import { useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { CardFace } from "./cardUI";
import * as tts from "./tts";

const commonLanguages = [
  ["es-ES", "Spanish"], ["de-DE", "German"], ["en-GB", "English"],
  ["fr-FR", "French"], ["it-IT", "Italian"], ["pt-PT", "Portuguese"],
];

export function PronounceFace({ card, subject, side = "front", size, onLanguage, inactive = false }) {
  const speech = tts.pronunciationFor(card, subject, side);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picking, setPicking] = useState(false);
  const [languages, setLanguages] = useState(commonLanguages);
  const picker = useRef(null);
  const mounted = useRef(true);
  const action = useRef(0);
  useEffect(() => {
    mounted.current = true;
    tts.availableLanguages().then(list => {
      if (!mounted.current) return;
      const extra = list.filter(l => !commonLanguages.some(([tag]) => tag === l.lang));
      setLanguages([...commonLanguages, ...extra.map(l => [l.lang, `${l.lang} — ${l.name}`])]);
    });
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => { if (picking) picker.current?.focus(); }, [picking]);

  const text = card?.[side];
  const imageId = card?.[`${side}ImageId`];
  if (!speech || !tts.isSupported()) return <CardFace text={text} imageId={imageId} size={size} />;

  const play = async (lang = speech.lang) => {
    const token = ++action.current;
    setError("");
    if (!lang) { setPicking(true); return; }
    setBusy(true);
    const result = await tts.speak(speech.text, { ...speech, lang });
    if (!mounted.current || token !== action.current) return;
    setBusy(false);
    if (!result.ok && !["canceled", "interrupted"].includes(result.reason)) {
      setError(result.reason === "no-voice"
        ? "No voice for this language. Install it in your device's text-to-speech settings."
        : "Couldn't play pronunciation. Check your device's voice settings and try again.");
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
    <div onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}
      style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
      <select ref={picker} aria-label={`${side === "front" ? "Front" : "Back"} pronunciation language`}
        tabIndex={inactive ? -1 : 0} value={speech.lang || ""}
        onChange={event => {
          const lang = event.target.value;
          onLanguage?.(side, lang);
          if (lang) { setPicking(false); void play(lang); }
        }}
        style={{ maxWidth: "100%", minHeight: 32, border: picking ? "1px solid var(--card-border)" : "none",
          borderRadius: 4, background: "var(--input-bg)", color: "var(--text-secondary)", fontSize: 12, padding: "4px 6px" }}>
        <option value="">Choose language</option>
        {speech.lang && !languages.some(([lang]) => lang === speech.lang) && <option value={speech.lang}>{speech.lang}</option>}
        {languages.map(([lang, label]) => <option key={lang} value={lang}>{label}</option>)}
      </select>
    </div>
    {error && <p role="status" style={{ fontSize: 12, color: "var(--text-secondary)", margin: "6px 0 0", fontFamily: "Inter, sans-serif" }}>{error}</p>}
  </div>;
}
