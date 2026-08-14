// ---------------------------------------------------------------------------
// The exercises a drill is made of, beyond the original three.
//
// Each one reports a single verdict per card and nothing else — the session
// owns scoring, the spaced-repetition schedule and the XP. Match is the odd
// one out: it covers a group of cards, so it reports a verdict for each.
// ---------------------------------------------------------------------------
import { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { CardShell, CardFace, PrimaryButton, GhostButton, TextField, normalize } from "./cardUI";

const captionStyle = {
  textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
  color: "var(--text-faint)", margin: "14px 0 0",
};

// The word being asked about. It was set at 13.5 to read as a caption, but
// it's the thing you're actually being tested on — in a vocabulary deck it's
// half the question — so it carries a little more weight than a label.
const promptStyle = {
  fontFamily: "Inter, sans-serif", fontSize: 16.5, fontWeight: 500,
  color: "var(--text-secondary)", margin: "0 0 16px", textAlign: "center",
};

// Instructions, as opposed to content: these stay quiet.
const hintStyle = {
  fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "var(--text-muted)",
  margin: "0 0 14px", textAlign: "center",
};

// ---------- fill in the blank ----------

export function ClozeCard({ card, payload, onResult }) {
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState(null); // null | "right" | "wrong"
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const check = () => {
    if (verdict) return;
    setVerdict(normalize(value) === normalize(payload.answer) ? "right" : "wrong");
  };

  const [before, after] = splitOnBlank(payload.text);

  return (
    <>
      <CardShell tabLabel="Fill the gap" tabColor="#7B4B94">
        <p style={promptStyle}>{payload.prompt || card.front}</p>
        <div style={{
          fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 20, color: "var(--text-strong)",
          lineHeight: 1.5, textAlign: "center", margin: "0 0 18px",
        }}>
          {before}
          <span style={{
            display: "inline-block", minWidth: 90, padding: "0 8px", margin: "0 2px",
            borderBottom: `2px solid ${verdict === "right" ? "var(--success)" : verdict === "wrong" ? "#B5533C" : "var(--accent)"}`,
            color: verdict === "wrong" ? "#B5533C" : "var(--accent)",
          }}>
            {verdict ? (verdict === "right" ? value : payload.answer) : value || " "}
          </span>
          {after}
        </div>

        {!verdict && (
          <TextField
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") check(); }}
            placeholder="The missing word"
            style={{ textAlign: "center" }}
          />
        )}

        {verdict === "wrong" && (
          <p style={{ ...captionStyle, color: "#B5533C", margin: "4px 0 0" }}>
            You wrote "{value.trim() || "nothing"}"
          </p>
        )}
        {verdict === "right" && (
          <p style={{ ...captionStyle, color: "var(--success)", margin: "4px 0 0" }}>That's the word</p>
        )}
      </CardShell>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {verdict
          ? <PrimaryButton onClick={() => onResult(verdict === "right")} style={{ flex: 1 }}>Next</PrimaryButton>
          : (
            <>
              <GhostButton onClick={() => setVerdict("wrong")} style={{ flex: 1, color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
                Show me
              </GhostButton>
              <PrimaryButton onClick={check} disabled={!value.trim()} style={{ flex: 1 }}>Check</PrimaryButton>
            </>
          )}
      </div>
    </>
  );
}

// The blank is always exactly "____" — drills.js and the model both guarantee
// it, and anything that reached here without one was dropped upstream.
function splitOnBlank(text) {
  const i = (text || "").indexOf("____");
  if (i === -1) return [text || "", ""];
  return [text.slice(0, i), text.slice(i + 4)];
}

// ---------- true or false ----------

export function TrueFalseCard({ payload, onResult }) {
  const [picked, setPicked] = useState(null);
  const answered = picked !== null;
  const wasRight = picked === payload.isTrue;

  return (
    <>
      <CardShell tabLabel="True or false" tabColor="var(--highlight)">
        <p style={promptStyle}>{payload.prompt}</p>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 90, textAlign: "center",
        }}>
          <p style={{
            fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 21,
            color: "var(--text-strong)", margin: 0, lineHeight: 1.4,
          }}>{payload.claim}</p>
        </div>
        {answered && (
          <p style={{ ...captionStyle, color: wasRight ? "var(--success)" : "#B5533C" }}>
            {wasRight
              ? (payload.isTrue ? "Right — that's the answer" : "Right — that's not it")
              : (payload.isTrue ? "It was true" : "It was false")}
          </p>
        )}

        {/* Knowing a claim was false leaves you no better off than before, so
            the real answer is shown either way once you've committed. */}
        {answered && !payload.isTrue && payload.answer && (
          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--card-border)", textAlign: "center",
          }}>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: 0.6,
              textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 6px",
            }}>The right answer</p>
            <p style={{
              fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19,
              color: "var(--success)", margin: 0, lineHeight: 1.35,
            }}>{payload.answer}</p>
          </div>
        )}
      </CardShell>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {answered ? (
          <PrimaryButton onClick={() => onResult(wasRight)} style={{ flex: 1 }}>Next</PrimaryButton>
        ) : (
          <>
            <GhostButton onClick={() => setPicked(false)} style={{ flex: 1, color: "#B5533C", borderColor: "#B5533C" }}>
              <X size={16} /> False
            </GhostButton>
            <PrimaryButton onClick={() => setPicked(true)} style={{ flex: 1, background: "var(--success)", color: "#FBF7EC" }}>
              <Check size={16} /> True
            </PrimaryButton>
          </>
        )}
      </div>
    </>
  );
}

// ---------- match the pairs ----------

// Tap a term, then tap its meaning. Two taps rather than a drag: dragging
// inside a scrolling page on a phone fights the scroll, and there is no
// gesture here that a tap can't express.
export function MatchCard({ payload, onResult }) {
  const pairs = payload.pairs;
  const [meanings] = useState(() => shuffleOnce(pairs));
  const [pickedTerm, setPickedTerm] = useState(null);
  const [solved, setSolved] = useState({});   // id -> true
  const [wrongFlash, setWrongFlash] = useState(null);
  // A card is only "got it" if it was paired correctly the first time it was
  // tried, which is what makes this a test rather than a process of
  // elimination.
  const missed = useRef(new Set());

  const done = Object.keys(solved).length === pairs.length;

  const tapMeaning = (meaningId) => {
    if (!pickedTerm || solved[meaningId]) return;
    if (pickedTerm === meaningId) {
      setSolved((s) => ({ ...s, [meaningId]: true }));
      setPickedTerm(null);
    } else {
      missed.current.add(pickedTerm);
      missed.current.add(meaningId);
      setWrongFlash(meaningId);
      setTimeout(() => setWrongFlash(null), 400);
      setPickedTerm(null);
    }
  };

  const finish = () => {
    onResult(pairs.map((p) => ({ cardId: p.id, correct: !missed.current.has(p.id) })));
  };

  return (
    <>
      <CardShell tabLabel="Match the pairs" tabColor="var(--brand)">
        <p style={hintStyle}>Tap a term, then tap what it means</p>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {pairs.map((p) => (
              <PairButton
                key={p.id}
                label={p.term}
                state={solved[p.id] ? "solved" : pickedTerm === p.id ? "picked" : "idle"}
                onClick={() => !solved[p.id] && setPickedTerm(pickedTerm === p.id ? null : p.id)}
              />
            ))}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {meanings.map((p) => (
              <PairButton
                key={p.id}
                label={p.meaning}
                state={solved[p.id] ? "solved" : wrongFlash === p.id ? "wrong" : "idle"}
                dimmed={!pickedTerm && !solved[p.id]}
                onClick={() => tapMeaning(p.id)}
              />
            ))}
          </div>
        </div>
      </CardShell>

      <div style={{ marginTop: 16 }}>
        <PrimaryButton onClick={finish} disabled={!done} style={{ width: "100%" }}>
          {done ? "Next" : `${Object.keys(solved).length} of ${pairs.length} paired`}
        </PrimaryButton>
      </div>
    </>
  );
}

function PairButton({ label, state, dimmed, onClick }) {
  const colors = {
    idle: { bg: "var(--input-bg)", border: "var(--card-border)", color: "var(--text-strong)" },
    picked: { bg: "rgba(242,197,114,0.16)", border: "var(--accent)", color: "var(--accent)" },
    solved: { bg: "rgba(78,133,119,0.18)", border: "var(--success)", color: "var(--success)" },
    wrong: { bg: "rgba(181,83,60,0.18)", border: "#B5533C", color: "#B5533C" },
  }[state];
  return (
    <button
      onClick={onClick}
      disabled={state === "solved"}
      style={{
        textAlign: "left", padding: "10px 12px", minHeight: 52, borderRadius: 9,
        border: `1px solid ${colors.border}`, background: colors.bg, color: colors.color,
        fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 500, lineHeight: 1.35,
        opacity: dimmed ? 0.75 : 1,
        transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
        WebkitTapHighlightColor: "transparent",
      }}>
      {label}
    </button>
  );
}

function shuffleOnce(pairs) {
  const a = [...pairs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // A meaning column in the same order as the terms is not a puzzle.
  if (a.length > 1 && a.every((p, i) => p.id === pairs[i].id)) a.push(a.shift());
  return a;
}

// Re-exported so the session can render every exercise from one import.
export { CardFace };
