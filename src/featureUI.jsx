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
import { PrimaryButton, GhostButton, TextField, Label, normalize } from "./cardUI";
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
import * as imageStore from "./imageStore";
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
  if (!data.length) return <div style={caption}>{emptyText}</div>;
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
              title={`${d.date}: ${d.count} reviews`}
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
        <GhostButton onClick={onBack}>← Back</GhostButton>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-strong)" }}>Statistics</div>
      </div>

      <div style={panel}>
        <div style={sectionTitle}>Deck</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {[
            ["New", data.maturity.new],
            ["Learning", data.maturity.learning],
            ["Young", data.maturity.young],
            ["Mature", data.maturity.mature],
          ].map(([label, n]) => (
            <div key={label}>
              <div style={bigNumber}>{n}</div>
              <div style={caption}>{label}</div>
            </div>
          ))}
        </div>
        {data.maturity.suspended > 0 && (
          <button onClick={onOpenLeeches} style={{ ...caption, marginTop: 10, background: "none", border: "none", padding: 0, textDecoration: "underline", cursor: "pointer", color: "var(--text-muted)" }}>
            {data.maturity.suspended} card{data.maturity.suspended === 1 ? "" : "s"} set aside — review them
          </button>
        )}
      </div>

      <div style={panel}>
        <div style={sectionTitle}>Due over the next 30 days</div>
        <Bars
          data={data.forecast}
          valueOf={(d) => d.due}
          labelOf={(d) => d.date}
          colorOf={(d) => (d.overdue > 0 ? "var(--brand)" : "var(--accent)")}
          emptyText="Nothing scheduled yet."
        />
        <div style={caption}>
          About {data.dailyLoad < 1 ? data.dailyLoad.toFixed(1) : Math.round(data.dailyLoad)} reviews a day once this
          deck settles. {data.forecast[0].overdue > 0 && `${data.forecast[0].overdue} overdue.`}
        </div>
      </div>

      <div style={panel}>
        <div style={sectionTitle}>Retention</div>
        {data.retention ? (
          <>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div>
                <div style={bigNumber}>{pct(data.retention.overall)}</div>
                <div style={caption}>last 30 days</div>
              </div>
              <div>
                <div style={bigNumber}>{pct(data.retention.mature)}</div>
                <div style={caption}>mature cards</div>
              </div>
              <div>
                <div style={bigNumber}>{pct(data.retention.young)}</div>
                <div style={caption}>young cards</div>
              </div>
            </div>
            {/* The comparison that makes the number actionable: if what you
                actually recall is far from what you asked for, the schedule is
                miscalibrated and the dial below is the fix. */}
            <div style={{ ...caption, marginTop: 8 }}>
              You asked for {pct(s.desiredRetention)}.{" "}
              {data.retention.mature != null &&
                (Math.abs(data.retention.mature - s.desiredRetention) < 0.05
                  ? "The schedule is well calibrated."
                  : data.retention.mature < s.desiredRetention
                    ? "Reviews are coming too late — raise the target."
                    : "You recall more than you asked for — you could lower the target and study less.")}
            </div>
          </>
        ) : (
          <div style={caption}>Not enough reviews yet. This fills in after a few days of studying.</div>
        )}
      </div>

      <div style={panel}>
        <div style={sectionTitle}>Study history</div>
        <Heatmap data={data.heatmap} />
        <div style={caption}>
          {data.streak.current} day streak · best {data.streak.best} · {data.streak.daysStudied} days studied
        </div>
      </div>

      <div style={panel}>
        <div style={sectionTitle}>Schedule</div>
        <Label>Target retention — {pct(s.desiredRetention)}</Label>
        <input
          type="range"
          min={70}
          max={97}
          step={1}
          value={Math.round(s.desiredRetention * 100)}
          onChange={(e) => onChangeSettings({ ...s, desiredRetention: Number(e.target.value) / 100 })}
          style={{ width: "100%", accentColor: "var(--accent)" }}
        />
        <div style={caption}>
          Higher means you forget less and review more. 90% is the usual choice; below 80% you will forget
          noticeably more, above 95% the workload climbs steeply.
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <Label>New cards/day</Label>
            <TextField
              value={String(s.newPerDay)}
              onChange={(v) => onChangeSettings({ ...s, newPerDay: Number(v.replace(/\D/g, "")) || 0 })}
              inputMode="numeric"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Reviews/day</Label>
            <TextField
              value={String(s.reviewsPerDay)}
              onChange={(v) => onChangeSettings({ ...s, reviewsPerDay: Number(v.replace(/\D/g, "")) || 0 })}
              inputMode="numeric"
            />
          </div>
        </div>
        <div style={caption}>0 means no limit.</div>
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
    <Sheet title="Cards you keep missing" onClose={onClose}>
      {!list.length && <div style={caption}>Nothing here — no card has failed often enough to be set aside.</div>}
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
            <div style={{ ...caption, marginTop: 8 }}>
              Missed {c.fsrsLapses} times. {why.message}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <GhostButton onClick={() => onEdit(c)}>Edit card</GhostButton>
              {leechLib.isSuspended(c) ? (
                <GhostButton onClick={() => onUnsuspend(c)}>Bring it back</GhostButton>
              ) : (
                <GhostButton onClick={() => onForgive(c)}>Reset its history</GhostButton>
              )}
              <GhostButton onClick={() => onDelete(c)}>Delete</GhostButton>
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
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-strong)" }}>{title}</div>
          <GhostButton onClick={onClose}>Close</GhostButton>
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
      <Label>Tags</Label>
      <TextField value={text} onChange={commit} placeholder="#exam #formulas" />
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
        <button onClick={() => onChange([])} style={{ ...chipStyle(false), textDecoration: "underline" }}>
          clear
        </button>
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
      title="Read aloud"
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
    return <div style={caption}>This device has no speech synthesis available.</div>;
  }
  if (!languages.length) {
    return <div style={caption}>No voices are installed on this device yet. Android: Settings → Accessibility → Text-to-speech.</div>;
  }

  const picker = (side) => (
    <div style={{ flex: 1 }}>
      <Label>{side === "front" ? "Front" : "Back"}</Label>
      <select
        value={cfg[`${side}Lang`] || ""}
        onChange={(e) => set({ [`${side}Lang`]: e.target.value || null })}
        style={{
          width: "100%", padding: "9px 10px", borderRadius: 8, minHeight: 40,
          background: "var(--shell-raised)", color: "var(--text-strong)",
          border: "1px solid var(--shell-raised)", fontSize: 14,
        }}
      >
        <option value="">Don't read</option>
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
        <span style={{ color: "var(--text-strong)", fontSize: 14 }}>Read cards aloud</span>
      </label>
      {cfg.enabled && (
        <>
          <div style={{ display: "flex", gap: 10 }}>
            {picker("front")}
            {picker("back")}
          </div>
          <div style={{ marginTop: 10 }}>
            <Label>Speed — {(cfg.rate ?? 0.95).toFixed(2)}×</Label>
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
          >
            Test
          </GhostButton>
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
      <div style={{ ...caption, textAlign: "center", marginBottom: 8 }}>How well did you know it?</div>
      <div style={{ display: "flex", gap: 6 }}>
        {CONFIDENCE_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => onRate(i + 1)}
            style={{
              flex: 1, minHeight: 52, borderRadius: 10, border: "none", cursor: "pointer",
              background: "var(--shell-raised)", color: "var(--text-strong)",
              fontSize: 11.5, fontFamily: "Inter, sans-serif", padding: "6px 2px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600 }}>{i + 1}</span>
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
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
          {mode === "why" ? "Why that's wrong" : mode === "hint" ? "Hint" : "Explanation"}
        </div>
        <GhostButton onClick={onClose}>Close</GhostButton>
      </div>
      {message ? (
        <div style={caption}>{message}</div>
      ) : (
        <>
          {state.confusedWith && (
            <div style={{ fontSize: 13.5, color: "var(--text-strong)", marginBottom: 6 }}>
              You wrote something that means: <strong>{state.confusedWith}</strong>
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
      <Label>Text (select a word, then hide it)</Label>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="The {{c1::mitochondrion}} is the powerhouse of the cell."
        style={{
          width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
          background: "var(--shell-raised)", color: "var(--text-strong)",
          border: "1px solid var(--shell-raised)", fontSize: 14, fontFamily: "Inter, sans-serif",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <GhostButton onClick={() => wrap(false)}>Hide selection</GhostButton>
        {numbers.length > 0 && <GhostButton onClick={() => wrap(true)}>Hide with previous</GhostButton>}
      </div>
      {numbers.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={caption}>
            {numbers.length} card{numbers.length === 1 ? "" : "s"} from this text:
          </div>
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
  const src = imageStore.getImage(imageId);
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

  if (!src) return <div style={caption}>Pick an image first.</div>;

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
              title={m.label ? `${m.label} — tap to remove` : "Tap to remove"}
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

      <div style={{ ...caption, marginTop: 8 }}>
        Drag across the picture to cover something. Tap a box to remove it.
        {clashes.length > 0 && " Boxes shown in red overlap — they may produce cards with the same answer."}
      </div>

      {list.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={caption}>{list.length} card{list.length === 1 ? "" : "s"} · label them so the answers mean something:</div>
          {list.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <span style={{ ...caption, width: 18 }}>{i + 1}</span>
              <TextField
                value={m.label || ""}
                onChange={(v) => onChange(list.map((x) => (x.id === m.id ? { ...x, label: v } : x)))}
                placeholder="What's under this box?"
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
            {label}
          </button>
        ))}
      </div>
      <div style={caption}>
        {mode === occlusionLib.HIDE_ONE
          ? "Only the asked box is covered — easier, good for learning a diagram."
          : "Every box is covered, so the others give nothing away."}
      </div>
    </div>
  );
}

// The study-time renderer for an occlusion card.
export function OcclusionCard({ card, revealed }) {
  const src = imageStore.getImage(card.frontImageId);
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

  if (!src) return <div style={caption}>This picture isn't on this device.</div>;
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
      title="Write notes, get cards"
      onClose={onClose}
      footer={
        <PrimaryButton
          onClick={() => onImport(preview.cards)}
          disabled={!preview.cards.length}
          style={{ width: "100%" }}
        >
          {preview.cards.length ? `Add ${preview.cards.length} card${preview.cards.length === 1 ? "" : "s"}` : "Nothing to add yet"}
        </PrimaryButton>
      }
    >
      <div style={caption}>
        Type or paste notes. Any line with <code>::</code> becomes a card; <code>:::</code> makes one in each
        direction. Headings (<code>## Cells</code>) become folders, <code>#tags</code> become tags, and{" "}
        <code>{"{{c1::hidden}}"}</code> makes a fill-in-the-blank. Prose is left alone.
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder={`## Cells
mitochondrion :: powerhouse of the cell
ribosome :: makes proteins #exam

## Vocabulary
der Hund ::: the dog

The heart pumps {{c1::blood}} around the body.`}
        style={{
          width: "100%", boxSizing: "border-box", marginTop: 10, padding: "10px 12px", borderRadius: 8,
          background: "var(--shell-raised)", color: "var(--text-strong)",
          border: "1px solid var(--shell-raised)", fontSize: 14,
          fontFamily: "ui-monospace, Menlo, monospace", resize: "vertical",
        }}
      />
      {preview.cards.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={sectionTitle}>Preview</div>
          {preview.cards.slice(0, 8).map((c, i) => (
            <div key={i} style={{ fontSize: 13, marginTop: 5, color: "var(--text-muted)" }}>
              {c.path?.length > 0 && <span style={{ color: "var(--text-faint)" }}>{c.path.join(" › ")} · </span>}
              <span style={{ color: "var(--text-strong)" }}><RichText text={c.front} /></span> → <RichText text={c.back} />
            </div>
          ))}
          {preview.cards.length > 8 && <div style={caption}>…and {preview.cards.length - 8} more</div>}
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
    <Sheet title="Share this folder" onClose={onClose}>
      {!owner?.username && (
        <div style={caption}>Pick a username first (Friends → your profile) — it's what the deck is credited to.</div>
      )}
      {!preview.ok && <div style={caption}>{preview.error}</div>}

      {preview.ok && state.phase !== "done" && (
        <>
          <div style={{ ...bigNumber, marginBottom: 2 }}>{preview.payload.cardCount}</div>
          <div style={caption}>cards will be shared, credited to {owner?.username || "you"}.</div>
          {preview.skipped.length > 0 && (
            <div style={{ ...caption, marginTop: 8 }}>
              {preview.skipped.length} card{preview.skipped.length === 1 ? "" : "s"} can't be shared
              {preview.skipped.some((s) => s.reason === "image") && " (pictures stay on your device)"}.
            </div>
          )}
          <div style={{ ...caption, marginTop: 8 }}>
            Anyone with the code can add a copy. Your progress isn't shared, and later edits won't reach
            the copies people already have.
          </div>
          <PrimaryButton
            onClick={publish}
            disabled={state.phase === "working" || !owner?.username}
            style={{ width: "100%", marginTop: 14 }}
          >
            {state.phase === "working" ? "Publishing…" : "Publish"}
          </PrimaryButton>
        </>
      )}

      {state.phase === "done" && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={caption}>Share this code:</div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 5, color: "var(--text-strong)", fontFamily: "'IBM Plex Mono', monospace", margin: "8px 0" }}>
            {state.code}
          </div>
          <GhostButton onClick={() => navigator.clipboard?.writeText(state.code)}>Copy code</GhostButton>
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
    <Sheet title="Add a shared deck" onClose={onClose}>
      {state.phase !== "found" && (
        <>
          <Label>Deck code</Label>
          <TextField
            value={code}
            onChange={setCode}
            placeholder="ABC234"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, letterSpacing: 3, textTransform: "uppercase" }}
          />
          <PrimaryButton
            onClick={look}
            disabled={!deckShareLib.isValidCode(clean) || state.phase === "working"}
            style={{ width: "100%", marginTop: 12 }}
          >
            {state.phase === "working" ? "Looking…" : "Find deck"}
          </PrimaryButton>
          {state.phase === "error" && <div style={{ ...caption, marginTop: 8 }}>{state.error}</div>}
        </>
      )}

      {state.phase === "found" && (
        <>
          <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-strong)" }}>{state.deck.name}</div>
          <div style={caption}>
            {state.deck.cardCount} cards{state.deck.byUsername ? ` · by ${state.deck.byUsername}` : ""}
          </div>
          <div style={{ marginTop: 10 }}>
            {state.deck.cards.slice(0, 5).map((c, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                <span style={{ color: "var(--text-strong)" }}>{c.front}</span> → {c.back}
              </div>
            ))}
          </div>
          <PrimaryButton onClick={() => onImport(state.deck)} style={{ width: "100%", marginTop: 14 }}>
            Add these cards
          </PrimaryButton>
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
          <GhostButton onClick={onExit}>← Back</GhostButton>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-strong)" }}>Test yourself</div>
        </div>
        <div style={panel}>
          <div style={caption}>
            A fixed set of questions, mixed types, no feedback until the end — a measurement rather than
            practice. Only the ones you get wrong are fed back into your schedule.
          </div>
          <div style={{ marginTop: 12 }}>
            <Label>Questions — {count}</Label>
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
          >
            Start test
          </PrimaryButton>
          {cards.length < 4 && <div style={caption}>You need at least four cards to build a test.</div>}
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
          <div style={caption}>{result.correct} of {result.total} correct</div>
          <div style={{ marginTop: 8, color: "var(--text-strong)", fontSize: 14 }}>{v.text}</div>
        </div>
        <div style={sectionTitle}>Every question</div>
        {result.rows.map((row, i) => (
          <div key={i} style={{ ...panel, marginBottom: 8, borderLeft: `3px solid ${row.correct ? "var(--accent)" : "var(--brand)"}` }}>
            <div style={{ color: "var(--text-strong)", fontSize: 14 }}><RichText text={row.question.prompt} /></div>
            {!row.correct && (
              <div style={{ ...caption, marginTop: 4 }}>
                You said: {String(row.response ?? "—") || "—"}
              </div>
            )}
            <div style={{ ...caption, marginTop: 2 }}>
              Answer: <RichText text={row.question.type === "trueFalse" ? (row.question.expected ? "True" : "False") : row.question.answer} />
            </div>
          </div>
        ))}
        <PrimaryButton onClick={() => onFinish(result)} style={{ width: "100%", marginTop: 8 }}>
          Done
        </PrimaryButton>
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
        <GhostButton onClick={onExit}>Give up</GhostButton>
        <div style={caption}>{index + 1} / {test.questions.length}</div>
      </div>
      <div style={{ ...panel, minHeight: 120 }}>
        <div style={{ fontSize: 17, color: "var(--text-strong)", lineHeight: 1.45 }}>
          <RichText text={q.prompt} />
        </div>
        {q.type === "trueFalse" && (
          <div style={{ marginTop: 14, fontSize: 15, color: "var(--text-muted)" }}>
            Claim: <RichText text={q.claim} />
          </div>
        )}
      </div>

      {q.type === "typed" && (
        <>
          <TextField value={draft} onChange={setDraft} placeholder="Your answer" />
          <PrimaryButton onClick={() => answer(draft)} style={{ width: "100%", marginTop: 10 }}>
            {last ? "Finish" : "Next"}
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
          <PrimaryButton onClick={() => answer(true)} style={{ flex: 1 }}>True</PrimaryButton>
          <PrimaryButton onClick={() => answer(false)} style={{ flex: 1 }}>False</PrimaryButton>
        </div>
      )}
    </div>
  );
}
