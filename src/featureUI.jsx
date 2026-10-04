import { t } from "./i18n";
// ---------------------------------------------------------------------------
// Screens and controls for the 1.2.0 features.
//
// These live here rather than in FlashcardCatalog.jsx, which is already 3300
// lines and is the file every other change has to touch. Each export is
// self-contained and takes plain data, so it can be dropped into the main
// component with a one-line render and nothing else.
//
// Styling follows cardUI.jsx: theme tokens (var(--…)) rather than literal
// colours, so everything works in both themes without a second definition.
// ---------------------------------------------------------------------------

import React, { useState, useMemo, useEffect, useRef } from "react";
import { PrimaryButton, GhostButton, TextField, Label, normalize, useCardImage } from "./cardUI";
import { RichText, isRich } from "./richText";
import * as statsLib from "./stats";
import * as testModeLib from "./testMode";
import * as tagsLib from "./tags";
import * as clozeLib from "./cloze";
import * as occlusionLib from "./occlusion";
import * as ttsLib from "./tts";
import * as tutorLib from "./tutor";
import * as leechLib from "./leech";
import * as deckShareLib from "./deckShare";
import * as noteToCards from "./noteToCards";
import { normalizeSettings } from "./srs";

const panel = {
  background: "var(--card-bg)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
};

const sectionTitle = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 12,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: 10,
};

const bigNumber = { fontSize: 26, fontWeight: 600, color: "var(--text-strong)", lineHeight: 1.1 };
const caption = { fontSize: 12, color: "var(--text-muted)", marginTop: 2 };

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

// A bar chart drawn with divs. A charting library would be the twelfth
// dependency and 80KB for six bars; flex and a height percentage are enough.
function Bars({ data, valueOf, labelOf, colorOf, height = 90, emptyText }) {
  const max = Math.max(1, ...data.map(valueOf));
  if (!data.length) return <div style={caption}>{t(emptyText)}</div>;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height, overflowX: "auto" }}>
      {data.map((d, i) => {
        const v = valueOf(d);
        return (
          <div key={i} style={{ flex: "1 0 6px", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }} title={`${labelOf(d)}: ${v}`}>
            <div
              style={{
                height: `${(v / max) * 100}%`,
                // Zero still gets a hairline, so an empty day reads as "nothing
                // here" rather than as a gap in the chart.
                minHeight: v > 0 ? 2 : 1,
                background: v > 0 ? (colorOf ? colorOf(d) : "var(--accent)") : "var(--shell-raised)",
                borderRadius: 2,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Heatmap({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  // 53 columns of 7 days, the shape everyone recognises from GitHub.
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));
  return (
    <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 4 }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {week.map((d) => (
            <div
              key={d.date}
              title={t("{0}: {1} reviews", [d.date, d.count])}
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                background: d.count === 0 ? "var(--shell-raised)" : "var(--accent)",
                opacity: d.count === 0 ? 1 : 0.35 + 0.65 * Math.min(1, d.count / max),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsScreen({ cards, game, settings, onBack, onChangeSettings, onOpenLeeches }) {
  const s = normalizeSettings(settings);
  const log = game?.reviewLog || [];
  const data = useMemo(() => statsLib.summary(cards, log, s), [cards, log, s]);
  const pct = (n) => (n == null ? "—" : `${Math.round(n * 100)}%`);
  const leeches = useMemo(() => leechLib.leeches(cards, s.leechThreshold), [cards, s.leechThreshold]);

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <GhostButton onClick={onBack}>{t("← Back")}</GhostButton>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-strong)" }}>{t("Statistics")}</div>
      </div>

      <div style={panel}>
        <div style={sectionTitle}>{t("Deck")}</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {[
            ["New", data.maturity.new],
            ["Learning", data.maturity.learning],
            ["Young", data.maturity.young],
            ["Mature", data.maturity.mature],
          ].map(([label, n]) => (
            <div key={label}>
              <div style={bigNumber}>{n}</div>
              <div style={caption}>{t(label)}</div>
            </div>
          ))}
        </div>
        {data.maturity.suspended > 0 && (
          <button onClick={onOpenLeeches} style={{ ...caption, marginTop: 10, background: "none", border: "none", padding: 0, textDecoration: "underline", cursor: "pointer", color: "var(--text-muted)" }}>{t("{0} card{1} set aside — review them", [data.maturity.suspended, data.maturity.suspended === 1 ? "" : "s"])}</button>
        )}
      </div>

      <div style={panel}>
        <div style={sectionTitle}>{t("Due over the next 30 days")}</div>
        <Bars
          data={data.forecast}
          valueOf={(d) => d.due}
          labelOf={(d) => d.date}
          colorOf={(d) => (d.overdue > 0 ? "var(--brand)" : "var(--accent)")}
          emptyText={t("Nothing scheduled yet.")}
        />
        <div style={caption}>{t("About {0} reviews a day once this deck settles. {1}", [data.dailyLoad < 1 ? data.dailyLoad.toFixed(1) : Math.round(data.dailyLoad), data.forecast[0].overdue > 0 && t("{0} overdue.", [data.forecast[0].overdue])])}</div>
      </div>

      <div style={panel}>
        <div style={sectionTitle}>{t("Retention")}</div>
        {data.retention ? (
          <>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div>
                <div style={bigNumber}>{pct(data.retention.overall)}</div>
                <div style={caption}>{t("last 30 days")}</div>
              </div>
              <div>
                <div style={bigNumber}>{pct(data.retention.mature)}</div>
                <div style={caption}>{t("mature cards")}</div>
              </div>
              <div>
                <div style={bigNumber}>{pct(data.retention.young)}</div>
                <div style={caption}>{t("young cards")}</div>
              </div>
            </div>
            {/* The comparison that makes the number actionable: if what you
                actually recall is far from what you asked for, the schedule is
                miscalibrated and the dial below is the fix. */}
            <div style={{ ...caption, marginTop: 8 }}>{t("You asked for {0}.{1}{2}", [pct(s.desiredRetention), " ", data.retention.mature != null &&
                (Math.abs(data.retention.mature - s.desiredRetention) < 0.05
                  ? t("The schedule is well calibrated.")
                  : data.retention.mature < s.desiredRetention
                    ? t("Reviews are coming too late — raise the target.")
                    : t("You recall more than you asked for — you could lower the target and study less."))])}</div>
          </>
        ) : (
          <div style={caption}>{t("Not enough reviews yet. This fills in after a few days of studying.")}</div>
        )}
      </div>

      <div style={panel}>
        <div style={sectionTitle}>{t("Study history")}</div>
        <Heatmap data={data.heatmap} />
        <div style={caption}>{t("{0} day streak · best {1} · {2} days studied", [data.streak.current, data.streak.best, data.streak.daysStudied])}</div>
      </div>

      <div style={panel}>
        <div style={sectionTitle}>{t("Schedule")}</div>
        <Label>{t("Target retention — {0}", [pct(s.desiredRetention)])}</Label>
        <input
          type="range"
          min={70}
          max={97}
          step={1}
          value={Math.round(s.desiredRetention * 100)}
          onChange={(e) => onChangeSettings({ ...s, desiredRetention: Number(e.target.value) / 100 })}
          style={{ width: "100%", accentColor: "var(--accent)" }}
        />
        <div style={caption}>{t("Higher means you forget less and review more. 90% is the usual choice; below 80% you will forget noticeably more, above 95% the workload climbs steeply.")}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <Label>{t("New cards/day")}</Label>
            <TextField
              value={String(s.newPerDay)}
              onChange={(v) => onChangeSettings({ ...s, newPerDay: Number(v.replace(/\D/g, "")) || 0 })}
              inputMode="numeric"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label>{t("Reviews/day")}</Label>
            <TextField
              value={String(s.reviewsPerDay)}
              onChange={(v) => onChangeSettings({ ...s, reviewsPerDay: Number(v.replace(/\D/g, "")) || 0 })}
              inputMode="numeric"
            />
          </div>
        </div>
        <div style={caption}>{t("0 means no limit.")}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leech review
// ---------------------------------------------------------------------------

export function LeechReview({ cards, allCards, settings, onClose, onEdit, onUnsuspend, onForgive, onDelete }) {
  const s = normalizeSettings(settings);
  const list = leechLib.leeches(cards, s.leechThreshold);
  return (
    <Sheet title={t("Cards you keep missing")} onClose={onClose}>
      {!list.length && <div style={caption}>{t("Nothing here — no card has failed often enough to be set aside.")}</div>}
      {list.map((c) => {
        const why = leechLib.diagnose(c, allCards);
        return (
          <div key={c.id} style={{ ...panel, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, color: "var(--text-strong)" }}>
              <RichText text={c.front} />
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
              <RichText text={c.back} />
            </div>
            <div style={{ ...caption, marginTop: 8 }}>{t("Missed {0} times. {1}", [c.fsrsLapses, why.message])}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <GhostButton onClick={() => onEdit(c)}>{t("Edit card")}</GhostButton>
              {leechLib.isSuspended(c) ? (
                <GhostButton onClick={() => onUnsuspend(c)}>{t("Bring it back")}</GhostButton>
              ) : (
                <GhostButton onClick={() => onForgive(c)}>{t("Reset its history")}</GhostButton>
              )}
              <GhostButton onClick={() => onDelete(c)}>{t("Delete")}</GhostButton>
            </div>
          </div>
        );
      })}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

export function Sheet({ title, children, onClose, footer }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--shell-bg)", width: "100%", maxWidth: 560,
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          maxHeight: "88vh", display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ padding: "14px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--on-shell-strong)" }}>{t(title)}</div>
          <GhostButton onClick={onClose}>{t("Close")}</GhostButton>
        </div>
        <div style={{ padding: "0 16px 16px", overflowY: "auto" }}>{children}</div>
        {footer && <div style={{ padding: 16, borderTop: "1px solid var(--shell-raised)" }}>{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function TagField({ value, onChange, suggestions = [] }) {
  const [text, setText] = useState(tagsLib.formatTags(value));
  useEffect(() => setText(tagsLib.formatTags(value)), [value?.join(",")]);
  const commit = (raw) => {
    setText(raw);
    onChange(tagsLib.parseTags(raw));
  };
  const unused = suggestions.filter((s) => !(value || []).includes(s.tag)).slice(0, 6);
  return (
    <div>
      <Label>{t("Tags")}</Label>
      <TextField value={text} onChange={commit} placeholder={t("#exam #formulas")} />
      {unused.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {unused.map((s) => (
            <button
              key={s.tag}
              onClick={() => commit(`${text} #${s.tag}`)}
              style={chipStyle(false)}
            >
              #{s.tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const chipStyle = (active) => ({
  background: active ? "var(--accent)" : "var(--shell-raised)",
  color: active ? "var(--shell-bg)" : "var(--text-muted)",
  border: "none",
  borderRadius: 999,
  padding: "5px 11px",
  fontSize: 12.5,
  fontFamily: "Inter, sans-serif",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
});

export function TagFilter({ cards, selected, onChange }) {
  const counts = useMemo(() => tagsLib.tagCounts(cards), [cards]);
  if (!counts.length) return null;
  const toggle = (tag) =>
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
      {counts.slice(0, 12).map(({ tag, count }) => (
        <button key={tag} onClick={() => toggle(tag)} style={chipStyle(selected.includes(tag))}>
          #{tag} {count}
        </button>
      ))}
      {selected.length > 0 && (
        <button onClick={() => onChange([])} style={{ ...chipStyle(false), textDecoration: "underline" }}>{t("clear")}</button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speech
// ---------------------------------------------------------------------------

export function SpeakButton({ text, lang, rate, voiceName, style }) {
  const [busy, setBusy] = useState(false);
  if (!ttsLib.isSupported() || !text || !lang) return null;
  return (
    <button
      title={t("Read aloud")}
      onClick={(e) => {
        e.stopPropagation();
        setBusy(true);
        ttsLib.speak(text, { lang, rate, voiceName }).finally(() => setBusy(false));
      }}
      style={{
        background: "transparent", border: "none", cursor: "pointer",
        color: busy ? "var(--accent)" : "var(--text-faint)", fontSize: 17, padding: 4,
        WebkitTapHighlightColor: "transparent", ...style,
      }}
    >
      🔊
    </button>
  );
}

export function SpeechSettings({ subject, onChange }) {
  const [languages, setLanguages] = useState([]);
  useEffect(() => {
    ttsLib.availableLanguages().then(setLanguages);
  }, []);
  const cfg = subject?.speech || {};
  const set = (patch) => onChange({ ...cfg, ...patch });

  if (!ttsLib.isSupported()) {
    return <div style={caption}>{t("This device has no speech synthesis available.")}</div>;
  }
  if (!languages.length) {
    return <div style={caption}>{t("No voices are installed on this device yet. Android: Settings → Accessibility → Text-to-speech.")}</div>;
  }

  const picker = (side) => (
    <div style={{ flex: 1 }}>
      <Label>{side === "front" ? t("Front") : t("Back")}</Label>
      <select
        value={cfg[`${side}LanguageMode`] === "manual" ? cfg[`${side}Lang`] || "" : ""}
        onChange={(e) => set({ [`${side}Lang`]: e.target.value || null,
          [`${side}LanguageMode`]: e.target.value ? "manual" : "auto" })}
        style={{
          width: "100%", padding: "9px 10px", borderRadius: 8, minHeight: 40,
          background: "var(--shell-raised)", color: "var(--on-shell-strong)",
          border: "1px solid var(--shell-raised)", fontSize: 14,
        }}
      >
        <option value="">{t("Automatic")}</option>
        {languages.map((l) => (
          <option key={l.lang} value={l.lang}>{l.lang} — {l.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <input type="checkbox" checked={!!cfg.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        <span style={{ color: "var(--on-shell-strong)", fontSize: 14 }}>{t("Read cards aloud")}</span>
      </label>
      {cfg.enabled && (
        <>
          <div style={{ display: "flex", gap: 10 }}>
            {picker("front")}
            {picker("back")}
          </div>
          <div style={{ marginTop: 10 }}>
            <Label>{t("Speed — {0}×", [(cfg.rate ?? 0.95).toFixed(2)])}</Label>
            <input
              type="range" min={50} max={150} step={5}
              value={Math.round((cfg.rate ?? 0.95) * 100)}
              onChange={(e) => set({ rate: Number(e.target.value) / 100 })}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
          </div>
          <GhostButton
            onClick={() => ttsLib.speak("Hallo — hello — bonjour", { lang: cfg.frontLang || cfg.backLang, rate: cfg.rate })}
            style={{ marginTop: 8 }}
          >{t("Test")}</GhostButton>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confidence rating
// ---------------------------------------------------------------------------

// Brainscape's dial. Offered instead of right/wrong in the flip drill, where
// the app has no way to check the answer anyway and a self-report is strictly
// more information than a binary.
const CONFIDENCE_LABELS = ["No idea", "Barely", "Shaky", "Solid", "Instant"];

export function ConfidenceBar({ onRate }) {
  return (
    <div>
      <div style={{ ...caption, textAlign: "center", marginBottom: 8 }}>{t("How well did you know it?")}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {CONFIDENCE_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => onRate(i + 1)}
            style={{
              flex: 1, minHeight: 52, borderRadius: 10, border: "none", cursor: "pointer",
              background: "var(--shell-raised)", color: "var(--on-shell-strong)",
              fontSize: 11.5, fontFamily: "Inter, sans-serif", padding: "6px 2px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600 }}>{i + 1}</span>
            <span style={{ color: "var(--text-muted)" }}>{t(label)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tutor
// ---------------------------------------------------------------------------

export function TutorPanel({ card, given, subject, mode = "explain", onClose }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let alive = true;
    const call =
      mode === "why" ? tutorLib.whyWrong(card, given, { subject })
      : mode === "hint" ? tutorLib.hint(card, { subject })
      : tutorLib.explain(card, { subject });
    call.then((r) => alive && setState({ loading: false, ...r }));
    return () => { alive = false; };
  }, [card?.id, mode, given]);

  const message =
    state.loading ? "Thinking…"
    : state.ok ? null
    : state.error === "NO_KEY" ? "Add an AI key in Settings to use the tutor."
    : state.error === "LEAKED" ? "Couldn't produce a hint that doesn't give it away. Try Explain instead."
    : "Couldn't reach the tutor. Check your connection.";

  return (
    <div style={{ ...panel, marginTop: 12, background: "var(--shell-raised)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={sectionTitle}>
          {mode === "why" ? t("Why that's wrong") : mode === "hint" ? t("Hint") : t("Explanation")}
        </div>
        <GhostButton onClick={onClose}>{t("Close")}</GhostButton>
      </div>
      {message ? (
        <div style={caption}>{t(message)}</div>
      ) : (
        <>
          {state.confusedWith && (
            <div style={{ fontSize: 13.5, color: "var(--text-strong)", marginBottom: 6 }}>{t("You wrote something that means: ")}<strong>{state.confusedWith}</strong>
            </div>
          )}
          <div style={{ fontSize: 14, color: "var(--text-strong)", lineHeight: 1.5 }}>
            <RichText text={state.explanation} />
          </div>
          {state.memoryAid && (
            <div style={{ ...caption, marginTop: 8, fontStyle: "italic" }}>💡 {state.memoryAid}</div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cloze helper for the card editor
// ---------------------------------------------------------------------------

export function ClozeEditor({ value, onChange }) {
  const ref = useRef(null);
  const numbers = clozeLib.clozeNumbers(value);
  const wrap = (sameAsLast) => {
    const el = ref.current;
    if (!el) return;
    const out = clozeLib.wrapSelection(value, el.selectionStart, el.selectionEnd, { sameAsLast });
    onChange(out.text);
    // Put the caret after the inserted markup rather than losing it to the
    // re-render, which would otherwise send it to position 0.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(out.cursor, out.cursor);
    });
  };

  return (
    <div>
      <Label>{t("Text (select a word, then hide it)")}</Label>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={t("The {{c1::mitochondrion}} is the powerhouse of the cell.")}
        style={{
          width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
          background: "var(--shell-raised)", color: "var(--on-shell-strong)",
          border: "1px solid var(--shell-raised)", fontSize: 14, fontFamily: "Inter, sans-serif",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <GhostButton onClick={() => wrap(false)}>{t("Hide selection")}</GhostButton>
        {numbers.length > 0 && <GhostButton onClick={() => wrap(true)}>{t("Hide with previous")}</GhostButton>}
      </div>
      {numbers.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={caption}>{t("{0} card{1} from this text:", [numbers.length, numbers.length === 1 ? "" : "s"])}</div>
          {numbers.map((n) => (
            <div key={n} style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              {n}. <RichText text={clozeLib.render(value, n).question} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image occlusion editor
// ---------------------------------------------------------------------------

export function OcclusionEditor({ imageId, masks, mode, onChange, onChangeMode }) {
  // undefined while the picture is being read out of IndexedDB — the editor
  // draws around an <img> that isn't there yet, which it already had to cope
  // with for a picture this device doesn't hold.
  const src = useCardImage(imageId);
  const boxRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const list = occlusionLib.normalizeMasks(masks);
  const clashes = occlusionLib.overlapping(list);

  const measure = () => {
    const el = boxRef.current;
    if (el) setSize({ width: el.clientWidth, height: el.clientHeight });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [src]);

  const pointFrom = (e) => {
    const rect = boxRef.current.getBoundingClientRect();
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => {
    // preventDefault stops the browser starting an image drag or a scroll,
    // either of which cancels the gesture halfway through on a phone.
    e.preventDefault();
    const p = pointFrom(e);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const move = (e) => {
    if (!drag) return;
    e.preventDefault();
    const p = pointFrom(e);
    setDrag((d) => ({ ...d, x1: p.x, y1: p.y }));
  };
  const end = () => {
    if (!drag) return;
    const rect = {
      x: Math.min(drag.x0, drag.x1),
      y: Math.min(drag.y0, drag.y1),
      w: Math.abs(drag.x1 - drag.x0),
      h: Math.abs(drag.y1 - drag.y0),
    };
    setDrag(null);
    const mask = occlusionLib.maskFromRect(rect, size);
    if (occlusionLib.isUsableMask(mask)) onChange([...list, mask]);
  };

  if (!src) return <div style={caption}>{t("Pick an image first.")}</div>;

  return (
    <div>
      <div
        ref={boxRef}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        style={{ position: "relative", userSelect: "none", touchAction: "none", cursor: "crosshair" }}
      >
        <img src={src} alt="" onLoad={measure} style={{ width: "100%", display: "block", borderRadius: 8 }} draggable={false} />
        {list.map((m) => {
          const r = occlusionLib.maskToRect(m, size);
          const clashing = clashes.some(([a, b]) => a === m.id || b === m.id);
          return (
            <div
              key={m.id}
              onClick={(e) => { e.stopPropagation(); onChange(list.filter((x) => x.id !== m.id)); }}
              title={m.label ? t("{0} — tap to remove", [m.label]) : t("Tap to remove")}
              style={{
                position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h,
                background: clashing ? "rgba(148,63,44,0.75)" : "var(--accent)",
                opacity: 0.85, borderRadius: 3, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--shell-bg)", fontSize: 11, overflow: "hidden",
              }}
            >
              {m.label}
            </div>
          );
        })}
        {drag && (
          <div
            style={{
              position: "absolute",
              left: Math.min(drag.x0, drag.x1),
              top: Math.min(drag.y0, drag.y1),
              width: Math.abs(drag.x1 - drag.x0),
              height: Math.abs(drag.y1 - drag.y0),
              border: "2px dashed var(--accent)",
              background: "rgba(0,0,0,0.15)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      <div style={{ ...caption, marginTop: 8 }}>{t("Drag across the picture to cover something. Tap a box to remove it.{0}", [clashes.length > 0 && t(" Boxes shown in red overlap — they may produce cards with the same answer.")])}</div>

      {list.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={caption}>{t("{0} card{1} · label them so the answers mean something:", [list.length, list.length === 1 ? "" : "s"])}</div>
          {list.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <span style={{ ...caption, width: 18 }}>{i + 1}</span>
              <TextField
                value={m.label || ""}
                onChange={(v) => onChange(list.map((x) => (x.id === m.id ? { ...x, label: v } : x)))}
                placeholder={t("What's under this box?")}
                style={{ flex: 1 }}
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {[
          [occlusionLib.HIDE_ALL, "Hide all"],
          [occlusionLib.HIDE_ONE, "Hide one"],
        ].map(([value, label]) => (
          <button key={value} onClick={() => onChangeMode(value)} style={chipStyle(mode === value)}>
            {t(label)}
          </button>
        ))}
      </div>
      <div style={caption}>
        {mode === occlusionLib.HIDE_ONE
          ? t("Only the asked box is covered — easier, good for learning a diagram.")
          : t("Every box is covered, so the others give nothing away.")}
      </div>
    </div>
  );
}

// The study-time renderer for an occlusion card.
export function OcclusionCard({ card, revealed }) {
  const src = useCardImage(card.frontImageId);
  const boxRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const measure = () => {
    const el = boxRef.current;
    if (el) setSize({ width: el.clientWidth, height: el.clientHeight });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [src]);

  // Only once the read has actually come back: saying the picture isn't here
  // while it is still being fetched would put that message on every card.
  if (src === undefined) return null;
  if (!src) return <div style={caption}>{t("This picture isn't on this device.")}</div>;
  const hidden = occlusionLib.visibleMasks(card, revealed);
  const active = occlusionLib.activeMask(card);

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <img src={src} alt="" onLoad={measure} style={{ width: "100%", display: "block", borderRadius: 8 }} />
      {hidden.map((m) => {
        const r = occlusionLib.maskToRect(m, size);
        return (
          <div key={m.id} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: "var(--accent)", borderRadius: 3 }} />
        );
      })}
      {active && (
        // Always outlined, revealed or not: on a diagram with twenty boxes,
        // "which one is the question" must never be a guess.
        <div
          style={{
            position: "absolute",
            ...(() => { const r = occlusionLib.maskToRect(active, size); return { left: r.x, top: r.y, width: r.w, height: r.h }; })(),
            border: "2px solid var(--brand)",
            borderRadius: 3,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes → cards
// ---------------------------------------------------------------------------

export function NotesImport({ onClose, onImport }) {
  const [text, setText] = useState("");
  const preview = useMemo(() => noteToCards.toCards(text), [text]);

  return (
    <Sheet
      title={t("Write notes, get cards")}
      onClose={onClose}
      footer={
        <PrimaryButton
          onClick={() => onImport(preview.cards)}
          disabled={!preview.cards.length}
          style={{ width: "100%" }}
        >
          {preview.cards.length ? t("Add {0} card{1}", [preview.cards.length, preview.cards.length === 1 ? "" : "s"]) : t("Nothing to add yet")}
        </PrimaryButton>
      }
    >
      <div style={caption}>{t("Type or paste notes. Any line with ")}<code>::</code>{t(" becomes a card; ")}<code>:::</code>{t(" makes one in each direction. Headings (")}<code>{t("## Cells")}</code>{t(") become folders, ")}<code>{t("#tags")}</code>{t(" become tags, and{0}", [" "])}<code>{t("{{c1::hidden}}")}</code>{t(" makes a fill-in-the-blank. Prose is left alone.")}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder={t("## Cells\nmitochondrion :: powerhouse of the cell\nribosome :: makes proteins #exam\n\n## Vocabulary\nder Hund ::: the dog\n\nThe heart pumps {{c1::blood}} around the body.", [])}
        style={{
          width: "100%", boxSizing: "border-box", marginTop: 10, padding: "10px 12px", borderRadius: 8,
          background: "var(--shell-raised)", color: "var(--on-shell-strong)",
          border: "1px solid var(--shell-raised)", fontSize: 14,
          fontFamily: "ui-monospace, Menlo, monospace", resize: "vertical",
        }}
      />
      {preview.cards.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={sectionTitle}>{t("Preview")}</div>
          {preview.cards.slice(0, 8).map((c, i) => (
            <div key={i} style={{ fontSize: 13, marginTop: 5, color: "var(--text-muted)" }}>
              {c.path?.length > 0 && <span style={{ color: "var(--text-faint)" }}>{c.path.join(" › ")} · </span>}
              <span style={{ color: "var(--on-shell-strong)" }}><RichText text={c.front} /></span> → <RichText text={c.back} />
            </div>
          ))}
          {preview.cards.length > 8 && <div style={caption}>{t("…and {0} more", [preview.cards.length - 8])}</div>}
        </div>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Deck sharing
// ---------------------------------------------------------------------------

export function ShareDeckModal({ deckName, cards, owner, onClose, onPublish }) {
  const [state, setState] = useState({ phase: "idle" });
  const preview = useMemo(() => deckShareLib.buildPayload({ name: deckName }, cards, owner), [deckName, cards, owner]);

  const publish = async () => {
    setState({ phase: "working" });
    const result = await onPublish();
    setState({ phase: result.ok ? "done" : "error", ...result });
  };

  return (
    <Sheet title={t("Share this folder")} onClose={onClose}>
      {!owner?.username && (
        <div style={caption}>{t("Pick a username first (Friends → your profile) — it's what the deck is credited to.")}</div>
      )}
      {!preview.ok && <div style={caption}>{preview.error}</div>}

      {preview.ok && state.phase !== "done" && (
        <>
          {/* bigNumber is painted for the paper card it is used on in
              Statistics; this one is on the navy sheet, where --text-strong is
              near-black and the count simply was not there. */}
          <div style={{ ...bigNumber, color: "var(--on-shell-strong)", marginBottom: 2 }}>{preview.payload.cardCount}</div>
          <div style={caption}>{t("cards will be shared, credited to {0}.", [owner?.username || "you"])}</div>
          {preview.skipped.length > 0 && (
            <div style={{ ...caption, marginTop: 8 }}>{t("{0} card{1} can't be shared{2}.", [preview.skipped.length, preview.skipped.length === 1 ? "" : "s", preview.skipped.some((s) => s.reason === "image") && t(" (pictures stay on your device)")])}</div>
          )}
          <div style={{ ...caption, marginTop: 8 }}>{t("Anyone with the code can add a copy. Your progress isn't shared, and later edits won't reach the copies people already have.")}</div>
          <PrimaryButton
            onClick={publish}
            disabled={state.phase === "working" || !owner?.username}
            style={{ width: "100%", marginTop: 14 }}
          >
            {state.phase === "working" ? t("Publishing…") : t("Publish")}
          </PrimaryButton>
        </>
      )}

      {state.phase === "done" && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={caption}>{t("Share this code:")}</div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 5, color: "var(--on-shell-strong)", fontFamily: "'IBM Plex Mono', monospace", margin: "8px 0" }}>
            {state.code}
          </div>
          <GhostButton onClick={() => navigator.clipboard?.writeText(state.code)}>{t("Copy code")}</GhostButton>
        </div>
      )}
      {state.phase === "error" && <div style={caption}>{state.error}</div>}
    </Sheet>
  );
}

export function ImportDeckModal({ onClose, onFetch, onImport }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState({ phase: "idle" });
  const clean = deckShareLib.normalizeCode(code);

  const look = async () => {
    setState({ phase: "working" });
    const result = await onFetch(clean);
    setState(result.ok ? { phase: "found", deck: result.deck } : { phase: "error", error: result.error });
  };

  return (
    <Sheet title={t("Add a shared deck")} onClose={onClose}>
      {state.phase !== "found" && (
        <>
          <Label>{t("Deck code")}</Label>
          <TextField
            value={code}
            onChange={setCode}
            placeholder={t("ABC234")}
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, letterSpacing: 3, textTransform: "uppercase" }}
          />
          <PrimaryButton
            onClick={look}
            disabled={!deckShareLib.isValidCode(clean) || state.phase === "working"}
            style={{ width: "100%", marginTop: 12 }}
          >
            {state.phase === "working" ? t("Looking…") : t("Find deck")}
          </PrimaryButton>
          {state.phase === "error" && <div style={{ ...caption, marginTop: 8 }}>{state.error}</div>}
        </>
      )}

      {state.phase === "found" && (
        <>
          <div style={{ fontSize: 17, fontWeight: 600, color: "var(--on-shell-strong)" }}>{state.deck.name}</div>
          <div style={caption}>{t("{0} cards{1}", [state.deck.cardCount, state.deck.byUsername ? ` · by ${state.deck.byUsername}` : ""])}</div>
          <div style={{ marginTop: 10 }}>
            {state.deck.cards.slice(0, 5).map((c, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                <span style={{ color: "var(--on-shell-strong)" }}>{c.front}</span> → {c.back}
              </div>
            ))}
          </div>
          <PrimaryButton onClick={() => onImport(state.deck)} style={{ width: "100%", marginTop: 14 }}>{t("Add these cards")}</PrimaryButton>
        </>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Test mode
// ---------------------------------------------------------------------------

export function TestRunner({ cards, onExit, onFinish }) {
  const [test, setTest] = useState(null);
  const [count, setCount] = useState(Math.min(20, cards.length));
  const [responses, setResponses] = useState({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [draft, setDraft] = useState("");

  if (!test) {
    return (
      <div style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <GhostButton onClick={onExit}>{t("← Back")}</GhostButton>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-strong)" }}>{t("Test yourself")}</div>
        </div>
        <div style={panel}>
          <div style={caption}>{t("A fixed set of questions, mixed types, no feedback until the end — a measurement rather than practice. Only the ones you get wrong are fed back into your schedule.")}</div>
          <div style={{ marginTop: 12 }}>
            <Label>{t("Questions — {0}", [count])}</Label>
            <input
              type="range" min={5} max={Math.max(5, Math.min(50, cards.length))} step={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
          </div>
          <PrimaryButton
            onClick={() => setTest(testModeLib.buildTest(cards, { count }))}
            disabled={cards.length < 4}
            style={{ width: "100%", marginTop: 12 }}
          >{t("Start test")}</PrimaryButton>
          {cards.length < 4 && <div style={caption}>{t("You need at least four cards to build a test.")}</div>}
        </div>
      </div>
    );
  }

  if (result) {
    const v = testModeLib.verdict(result);
    return (
      <div style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
        <div style={{ ...panel, textAlign: "center" }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: "var(--text-strong)" }}>{result.percent}%</div>
          <div style={caption}>{t("{0} of {1} correct", [result.correct, result.total])}</div>
          <div style={{ marginTop: 8, color: "var(--text-strong)", fontSize: 14 }}>{v.text}</div>
        </div>
        <div style={sectionTitle}>{t("Every question")}</div>
        {result.rows.map((row, i) => (
          <div key={i} style={{ ...panel, marginBottom: 8, borderLeft: `3px solid ${row.correct ? "var(--accent)" : "var(--brand)"}` }}>
            <div style={{ color: "var(--text-strong)", fontSize: 14 }}><RichText text={row.question.prompt} /></div>
            {!row.correct && (
              <div style={{ ...caption, marginTop: 4 }}>{t("You said: {0}", [String(row.response ?? "—") || "—"])}</div>
            )}
            <div style={{ ...caption, marginTop: 2 }}>{t("Answer: ")}<RichText text={row.question.type === "trueFalse" ? (row.question.expected ? "True" : "False") : row.question.answer} />
            </div>
          </div>
        ))}
        <PrimaryButton onClick={() => onFinish(result)} style={{ width: "100%", marginTop: 8 }}>{t("Done")}</PrimaryButton>
      </div>
    );
  }

  const q = test.questions[index];
  const last = index === test.questions.length - 1;
  const answer = (value) => {
    const next = { ...responses, [q.id]: value };
    setResponses(next);
    setDraft("");
    if (last) setResult(testModeLib.score(test, next));
    else setIndex(index + 1);
  };

  return (
    <div style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <GhostButton onClick={onExit}>{t("Give up")}</GhostButton>
        <div style={caption}>{index + 1} / {test.questions.length}</div>
      </div>
      <div style={{ ...panel, minHeight: 120 }}>
        <div style={{ fontSize: 17, color: "var(--text-strong)", lineHeight: 1.45 }}>
          <RichText text={q.prompt} />
        </div>
        {q.type === "trueFalse" && (
          <div style={{ marginTop: 14, fontSize: 15, color: "var(--text-muted)" }}>{t("Claim: ")}<RichText text={q.claim} />
          </div>
        )}
      </div>

      {q.type === "typed" && (
        <>
          <TextField value={draft} onChange={setDraft} placeholder={t("Your answer")} />
          <PrimaryButton onClick={() => answer(draft)} style={{ width: "100%", marginTop: 10 }}>
            {last ? t("Finish") : t("Next")}
          </PrimaryButton>
        </>
      )}

      {q.type === "choice" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => answer(opt)}
              style={{
                background: "var(--card-bg)", border: "none", borderRadius: 10, padding: "14px 16px",
                minHeight: 48, textAlign: "left", color: "var(--text-strong)", fontSize: 15,
                cursor: "pointer", fontFamily: "Inter, sans-serif", WebkitTapHighlightColor: "transparent",
              }}
            >
              <RichText text={opt} />
            </button>
          ))}
        </div>
      )}

      {q.type === "trueFalse" && (
        <div style={{ display: "flex", gap: 10 }}>
          <PrimaryButton onClick={() => answer(true)} style={{ flex: 1 }}>{t("True")}</PrimaryButton>
          <PrimaryButton onClick={() => answer(false)} style={{ flex: 1 }}>{t("False")}</PrimaryButton>
        </div>
      )}
    </div>
  );
}
