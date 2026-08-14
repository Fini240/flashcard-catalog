// ---------------------------------------------------------------------------
// The two screens that explain the app to its user: the walkthrough a fresh
// install opens on, and the short note after an update.
//
// Kept out of FlashcardCatalog.jsx for the same reason gameUI.jsx is — that
// file is already 3k lines. The content lives in whatsNew.js; this file is
// only how it looks.
// ---------------------------------------------------------------------------
import { useState, useEffect, useRef } from "react";
import { BookOpen, Sparkles, Clock, Shuffle, Flame, Users, X, Check } from "lucide-react";
import { PrimaryButton, GhostButton } from "./cardUI";
import { pushBackHandler } from "./backHandler";
import { WALKTHROUGH } from "./whatsNew";

const ICONS = {
  book: BookOpen,
  import: Sparkles,
  clock: Clock,
  drills: Shuffle,
  flame: Flame,
  users: Users,
};

// How far a finger has to travel before it counts as a swipe rather than a
// tap that wandered. Below this, nothing moves — the buttons are the reliable
// path and the swipe is a shortcut for people who expect one.
const SWIPE_PX = 48;

export function Walkthrough({ onDone }) {
  const [i, setI] = useState(0);
  const startX = useRef(null);
  const slide = WALKTHROUGH[i];
  const last = i === WALKTHROUGH.length - 1;
  const Icon = ICONS[slide.icon] || BookOpen;

  // Back steps back through the tour and only leaves from the first screen,
  // so the Android gesture matches the on-screen Back button.
  useEffect(() => pushBackHandler(() => (i === 0 ? onDone() : setI((n) => n - 1))), [i, onDone]);

  const go = (n) => setI(Math.max(0, Math.min(WALKTHROUGH.length - 1, n)));

  return (
    <div
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (startX.current === null) return;
        const dx = e.changedTouches[0].clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? i + 1 : i - 1);
      }}
      style={{
        position: "fixed", inset: 0, zIndex: 80, background: "var(--shell-bg)",
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.05), transparent 45%), radial-gradient(circle at 90% 85%, rgba(255,255,255,0.04), transparent 45%)",
        display: "flex", flexDirection: "column", padding: "18px 22px 28px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onDone} style={{
          background: "none", border: "none", padding: "10px 6px", minHeight: 44,
          fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--on-shell-muted)",
          WebkitTapHighlightColor: "transparent",
        }}>
          {last ? "" : "Skip"}
        </button>
      </div>

      {/* key restarts the entrance animation on every step, so a slide change
          reads as a new card rather than swapped-out text */}
      <div key={i} style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", textAlign: "center", maxWidth: 440, margin: "0 auto",
        animation: "popIn 0.22s ease-out",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, marginBottom: 22,
          background: "var(--shell-raised)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={32} color="var(--accent)" />
        </div>
        <h2 style={{
          fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 600, fontSize: 27,
          color: "#FBF7EC", margin: "0 0 12px", lineHeight: 1.2,
        }}>
          {slide.title}
        </h2>
        <p style={{
          fontFamily: "Inter, sans-serif", fontSize: 15.5, lineHeight: 1.55,
          color: "#EDE6D3", opacity: 0.82, margin: 0,
        }}>
          {slide.text}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 7, margin: "0 0 20px" }}>
        {WALKTHROUGH.map((s, n) => (
          <button key={s.title} onClick={() => go(n)} aria-label={`Step ${n + 1}`} style={{
            background: "none", border: "none", padding: 8, WebkitTapHighlightColor: "transparent",
            display: "flex", alignItems: "center",
          }}>
            <span style={{
              width: n === i ? 20 : 7, height: 7, borderRadius: 4,
              background: n === i ? "var(--accent)" : "rgba(255,255,255,0.22)",
              transition: "width 0.2s ease-out, background 0.2s ease-out",
            }} />
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, maxWidth: 440, width: "100%", margin: "0 auto" }}>
        {i > 0 && (
          <GhostButton onClick={() => go(i - 1)} style={{ flex: "0 0 auto", paddingLeft: 24, paddingRight: 24 }}>
            Back
          </GhostButton>
        )}
        <PrimaryButton onClick={() => (last ? onDone() : go(i + 1))} style={{ flex: 1 }}>
          {last ? <><Check size={17} /> Start studying</> : "Next"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function WhatsNew({ releases, onClose }) {
  useEffect(() => pushBackHandler(onClose), [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(10,16,30,0.72)", zIndex: 70,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} className="fc-scroll" style={{
        background: "var(--card-bg)", borderRadius: "16px 16px 0 0", width: "100%",
        maxWidth: 520, maxHeight: "88vh", overflowY: "auto",
        padding: "18px 18px 28px", animation: "sheetUp 0.22s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{
            fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 600, fontSize: 21,
            color: "var(--text-strong)", margin: 0,
          }}>
            What's new
          </h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", padding: 10, minWidth: 44, minHeight: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><X size={18} color="var(--text-secondary)" /></button>
        </div>

        {releases.map((r) => (
          <div key={r.version} style={{ marginBottom: 14 }}>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
              textTransform: "uppercase", letterSpacing: 0.5, margin: "10px 0 8px",
            }}>
              Version {r.version} · {r.date}
            </p>
            {r.items.map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, marginBottom: 9 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
                  flexShrink: 0, marginTop: 7,
                }} />
                <p style={{
                  fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.5,
                  color: "var(--text-secondary)", margin: 0,
                }}>{item}</p>
              </div>
            ))}
          </div>
        ))}

        <PrimaryButton onClick={onClose} style={{ width: "100%", marginTop: 6 }}>
          Got it
        </PrimaryButton>
      </div>
    </div>
  );
}
