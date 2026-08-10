// ---------------------------------------------------------------------------
// Gamification UI — the streak bar, goal ring, quests, leaderboard, mastery
// pips and the session reward screen.
//
// Kept out of FlashcardCatalog.jsx on purpose: that file was already 2.3k
// lines and every feature landing in it made the app harder to change.
// ---------------------------------------------------------------------------
import { useState, useEffect } from "react";
import {
  Flame, Zap, Trophy, Target, Check, X, Snowflake, Users, Copy, UserPlus,
  ChevronRight, Sparkles,
} from "lucide-react";
import * as G from "./gamification";
import * as social from "./social";

// ---------- small shared primitives ----------

export function Ring({ value, size = 44, stroke = 5, color = "#F2C572", track = "rgba(255,255,255,0.14)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value || 0));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>{children}</div>
    </div>
  );
}

// Mastery is shown as filled pips *and* a colour *and* a word. Colour alone
// fails for the ~8% of men with a colour vision deficiency, and this app is
// full of red/green already.
export function MasteryPips({ card, showLabel, size = 5 }) {
  const m = G.masteryOf(card);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} style={{
            width: size, height: size, borderRadius: "50%",
            background: i < m.pips ? m.color : "var(--card-border)",
          }} />
        ))}
      </span>
      {showLabel && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: m.color, fontWeight: 600 }}>
          {m.short}
        </span>
      )}
    </span>
  );
}

// A horizontal bar split by mastery band — one glance tells you whether a deck
// is mostly untouched or mostly solid, which a single "12 cards" count never did.
export function MasteryBar({ cards, height = 7, showLegend }) {
  const bd = G.masteryBreakdown(cards);
  const total = cards.length || 1;
  return (
    <div>
      <div style={{ display: "flex", height, borderRadius: height / 2, overflow: "hidden", background: "var(--card-border)" }}>
        {bd.map(b => b.count > 0 && (
          <div key={b.id} title={`${b.count} ${b.label}`} style={{
            width: `${(b.count / total) * 100}%`,
            background: b.box === 0 ? "var(--card-border)" : b.color,
            transition: "width 0.4s",
          }} />
        ))}
      </div>
      {showLegend && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 10 }}>
          {bd.filter(b => b.count > 0).map(b => (
            <span key={b.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: b.box === 0 ? "var(--card-border)" : b.color }} />
              {b.count} {b.label.toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- the top status bar ----------

export function StatusBar({ game, onOpenStreak, onOpenFriends, nudgeCount }) {
  const lvl = G.levelBounds(game.xp);
  const wk = G.weekXp(game);
  const rank = G.rankForWeekXp(wk);
  const atRisk = G.streakAtRisk(game);
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <button onClick={onOpenStreak} style={{ ...chipStyle, flex: 1, borderColor: atRisk && game.streak > 0 ? "rgba(242,197,114,0.5)" : "rgba(255,255,255,0.12)" }}>
        <Flame size={16} color={game.streak > 0 ? "#F2874E" : "#5A6B8C"} fill={game.streak > 0 && !atRisk ? "#F2874E" : "none"} />
        <span style={chipValue}>{game.streak}</span>
        <span style={chipLabel}>day{game.streak !== 1 ? "s" : ""}</span>
      </button>
      <button onClick={onOpenStreak} style={{ ...chipStyle, flex: 1 }}>
        <Zap size={16} color="#F2C572" />
        <span style={chipValue}>{game.xp}</span>
        <span style={chipLabel}>lvl {lvl.level}</span>
      </button>
      <button onClick={onOpenFriends} style={{ ...chipStyle, flex: 1, position: "relative" }}>
        <Trophy size={16} color={rank.color} />
        <span style={chipValue}>{wk}</span>
        <span style={chipLabel}>{rank.name}</span>
        {nudgeCount > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 6, minWidth: 16, height: 16, borderRadius: 8,
            background: "#D97757", color: "#16233F", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
            fontFamily: "Inter, sans-serif",
          }}>{nudgeCount}</span>
        )}
      </button>
    </div>
  );
}
const chipStyle = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10, padding: "9px 8px", minHeight: 44,
  WebkitTapHighlightColor: "transparent", cursor: "pointer",
};
const chipValue = { fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, color: "#EDE6D3" };
const chipLabel = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8CA0C2", textTransform: "uppercase", letterSpacing: 0.4 };

// ---------- today's goal + the single most important button in the app ----------

export function TodayCard({ game, dueCount, totalCards, onStudyNow, onOpenGoal }) {
  const t = G.todayStats(game);
  const pct = Math.min(1, t.cards / game.goalCards);
  const done = t.cards >= game.goalCards;
  const remaining = Math.max(0, game.goalCards - t.cards);

  const headline = done
    ? "Daily goal done"
    : t.cards > 0
      ? `${remaining} more card${remaining !== 1 ? "s" : ""} to go`
      : dueCount > 0
        ? `${dueCount} card${dueCount !== 1 ? "s" : ""} ready for you`
        : "Ready when you are";

  const sub = done
    ? game.streak > 0 ? `${game.streak}-day streak secured 🔥` : "Streak secured 🔥"
    : dueCount > 0
      ? "These are the ones your memory is about to drop."
      : totalCards > 0
        ? "Nothing due — a quick practice round still earns XP."
        : "Add a few cards and your streak starts today.";

  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: 12, padding: 16, marginBottom: 16,
      boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onOpenGoal} title="Change your daily goal" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <Ring value={pct} size={56} stroke={6} color={done ? "#5C7A44" : "#F2C572"} track="var(--card-border)">
            {done
              ? <Check size={22} color="#5C7A44" />
              : <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-strong)" }}>
                  {t.cards}<span style={{ fontSize: 10, color: "var(--text-faint)" }}>/{game.goalCards}</span>
                </span>}
          </Ring>
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15.5, fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>
            {headline}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-secondary)", margin: "3px 0 0", lineHeight: 1.35 }}>
            {sub}
          </p>
        </div>
      </div>
      {totalCards > 0 && (
        <button onClick={onStudyNow} style={{
          width: "100%", marginTop: 14, background: "#F2C572", color: "#16233F", border: "none",
          borderRadius: 10, padding: "15px 20px", minHeight: 52, fontFamily: "Inter, sans-serif",
          fontWeight: 700, fontSize: 16.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          WebkitTapHighlightColor: "transparent", boxShadow: "0 2px 10px rgba(242,197,114,0.25)",
        }}>
          <Sparkles size={18} /> {dueCount > 0 ? `Study ${Math.min(dueCount, 20)} cards` : "Practice now"}
        </button>
      )}
    </div>
  );
}

// ---------- daily quests ----------

export function QuestList({ game }) {
  const quests = (game.quests || []).map(q => ({ q, def: G.questDef(q.id) })).filter(x => x.def);
  if (!quests.length) return null;
  return (
    <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>
        Today's quests
      </p>
      {quests.map(({ q, def }, i) => {
        const pct = Math.min(1, q.progress / def.target);
        const done = q.progress >= def.target;
        return (
          <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderTop: i ? "1px solid var(--card-border-light)" : "none" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 13, flexShrink: 0,
              background: done ? "#5C7A44" : "var(--input-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {done ? <Check size={14} color="#FBF7EC" /> : <Target size={13} color="var(--text-faint)" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 500,
                  color: done ? "var(--text-faint)" : "var(--text-strong)",
                  textDecoration: done ? "line-through" : "none",
                }}>{def.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: done ? "#5C7A44" : "var(--text-faint)", flexShrink: 0 }}>
                  +{def.xp} XP
                </span>
              </div>
              <div style={{ height: 4, background: "var(--card-border)", borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct * 100}%`, background: done ? "#5C7A44" : "#F2C572", transition: "width 0.4s" }} />
              </div>
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", flexShrink: 0, minWidth: 34, textAlign: "right" }}>
              {Math.min(q.progress, def.target)}/{def.target}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- modals ----------

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(10,16,30,0.72)", zIndex: 60,
      display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0,
    }}>
      <div onClick={e => e.stopPropagation()} className="fc-scroll" style={{
        background: "var(--card-bg)", borderRadius: "16px 16px 0 0", width: "100%",
        maxWidth: wide ? 640 : 520, maxHeight: "88vh", overflowY: "auto",
        padding: "18px 18px 28px", animation: "sheetUp 0.22s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 600, fontSize: 21, color: "var(--text-strong)", margin: 0 }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", padding: 10, minWidth: 44, minHeight: 44,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}><X size={18} color="var(--text-secondary)" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StreakModal({ game, cards, onClose, onOpenGoal }) {
  const days = G.weekDays(game);
  const lvl = G.levelBounds(game.xp);
  const totals = G.lifetimeTotals(game);
  const weeks = G.heatmapWeeks(game, 18);
  const earned = ACHIEVEMENTS_SORTED(game);

  return (
    <ModalShell title="Your progress" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <Flame size={34} color={game.streak > 0 ? "#F2874E" : "#8CA0C2"} fill={game.streak > 0 ? "#F2874E" : "none"} />
        </div>
        <div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text-strong)", margin: 0, lineHeight: 1 }}>
            {game.streak} day{game.streak !== 1 ? "s" : ""}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Best: {game.bestStreak || 0} · {game.freezes} freeze{game.freezes !== 1 ? "s" : ""} banked
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {days.map((d, i) => (
          <div key={d.key} style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              height: 34, borderRadius: 8,
              background: d.goalMet ? "#F2874E" : d.frozen ? "#4E7FA8" : d.future ? "var(--card-border-light)" : "var(--input-bg)",
              border: d.today ? "2px solid #F2C572" : "1px solid var(--card-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {d.goalMet && <Flame size={14} color="#FBF7EC" fill="#FBF7EC" />}
              {d.frozen && !d.goalMet && <Snowflake size={13} color="#FBF7EC" />}
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "var(--text-faint)" }}>
              {["M", "T", "W", "T", "F", "S", "S"][i]}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "var(--text-faint)", margin: "0 0 18px" }}>
        Miss a day and a banked freeze covers it automatically — you earn one every 7 streak days.
      </p>

      <SectionLabel>Level {lvl.level}</SectionLabel>
      <div style={{ height: 8, background: "var(--card-border)", borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
        <div style={{ height: "100%", width: `${(lvl.into / lvl.span) * 100}%`, background: "#F2C572", transition: "width 0.5s" }} />
      </div>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", margin: "0 0 18px" }}>
        {lvl.into} / {lvl.span} XP to level {lvl.level + 1}
      </p>

      <SectionLabel>Daily goal</SectionLabel>
      <button onClick={onOpenGoal} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: 10,
        padding: "13px 14px", minHeight: 48, marginBottom: 18, cursor: "pointer",
      }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-strong)" }}>
          {game.goalCards} cards a day
        </span>
        <ChevronRight size={16} color="var(--text-faint)" />
      </button>

      <SectionLabel>Last 18 weeks</SectionLabel>
      <div style={{ display: "flex", gap: 3, marginBottom: 6, overflowX: "auto" }} className="fc-scroll">
        {weeks.map((col, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {col.map(d => (
              <div key={d.key} title={`${d.key}: ${d.cards} cards`} style={{
                width: 11, height: 11, borderRadius: 2,
                background: d.future ? "transparent"
                  : d.frozen ? "#4E7FA8"
                  : d.cards === 0 ? "var(--card-border-light)"
                  : d.goalMet ? "#F2874E"
                  : d.cards > 5 ? "rgba(242,135,78,0.55)" : "rgba(242,135,78,0.28)",
              }} />
            ))}
          </div>
        ))}
      </div>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "var(--text-faint)", margin: "0 0 18px" }}>
        {totals.cards} cards answered over {totals.days} day{totals.days !== 1 ? "s" : ""} · {totals.accuracy}% correct
      </p>

      <SectionLabel>Collection strength</SectionLabel>
      <div style={{ marginBottom: 18 }}>
        <MasteryBar cards={cards} height={9} showLegend />
      </div>

      <SectionLabel>Achievements ({earned.filter(a => a.earned).length}/{G.ACHIEVEMENTS.length})</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8 }}>
        {earned.map(a => (
          <div key={a.id} title={a.blurb} style={{
            background: a.earned ? "var(--input-bg)" : "transparent",
            border: `1px solid ${a.earned ? "var(--card-border)" : "var(--card-border-light)"}`,
            borderRadius: 10, padding: "10px 6px", textAlign: "center", opacity: a.earned ? 1 : 0.4,
          }}>
            <div style={{ fontSize: 20, filter: a.earned ? "none" : "grayscale(1)" }}>{a.icon}</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10.5, fontWeight: 600, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.2 }}>
              {a.name}
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
function ACHIEVEMENTS_SORTED(game) {
  return G.ACHIEVEMENTS
    .map(a => ({ ...a, earned: !!game.achievements[a.id] }))
    .sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0));
}
function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
      textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 8px",
    }}>{children}</p>
  );
}

export function GoalModal({ game, onClose, onPick }) {
  return (
    <ModalShell title="Daily goal" onClose={onClose}>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.45 }}>
        Hit this many cards in a day and your streak is safe. Pick something you'd
        still manage on a bad day — a goal you keep beats a goal you admire.
      </p>
      {G.DAILY_GOALS.map(g => {
        const active = g.cards === game.goalCards;
        return (
          <button key={g.id} onClick={() => onPick(g.cards)} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            background: active ? "rgba(242,197,114,0.14)" : "var(--input-bg)",
            border: `1px solid ${active ? "#F2C572" : "var(--card-border)"}`,
            borderRadius: 10, padding: "14px 16px", minHeight: 56, marginBottom: 8, cursor: "pointer",
          }}>
            <span style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: active ? "#F2C572" : "var(--text-strong)" }}>
                {g.label}
              </span>
              <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                {g.blurb}
              </span>
            </span>
            {active && <Check size={18} color="#F2C572" />}
          </button>
        );
      })}
    </ModalShell>
  );
}

// ---------- friends & the weekly board ----------

// One row of either board. Extracted once the global board arrived so the two
// can never drift apart visually.
function BoardRow({ row, onRemove }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
      borderRadius: 8, marginBottom: 4,
      background: row.isMe ? "rgba(242,197,114,0.12)" : "transparent",
      border: `1px solid ${row.isMe ? "rgba(242,197,114,0.3)" : "transparent"}`,
    }}>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, fontWeight: 700,
        color: row.position === 1 ? "#F2C572" : "var(--text-faint)", minWidth: 20,
      }}>{row.position}</span>
      <span style={{ fontSize: 18 }}>{row.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: "block", fontFamily: "Inter, sans-serif", fontSize: 14,
          fontWeight: row.isMe ? 700 : 500, color: "var(--text-strong)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{row.isMe ? "You" : row.username}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--text-faint)" }}>
          🔥 {row.streak} · lvl {row.level}
        </span>
      </div>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>
        {row.weekXp}
      </span>
      {onRemove && !row.isMe && (
        <button onClick={() => onRemove(row.uid)} title="Remove friend" style={{
          background: "none", border: "none", padding: 8, minWidth: 36, minHeight: 36,
          display: "flex", alignItems: "center", cursor: "pointer",
        }}><X size={14} color="var(--text-faint)" /></button>
      )}
    </div>
  );
}

// The username is the only name anyone else ever sees, so this sits at the top
// of the sheet rather than buried in Settings — someone who dislikes what
// they're called should not have to hunt for the fix.
function UsernameRow({ username, editing, onEdit, onCancel, onSave, suggestion }) {
  const [value, setValue] = useState(username || suggestion || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const local = social.validateUsername(value);
    if (local) { setError(local); return; }
    setSaving(true); setError("");
    const res = await onSave(value.trim());
    setSaving(false);
    if (!res.ok) setError(res.error || "Couldn't save that name.");
  };

  if (!editing) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10, background: "var(--input-bg)",
        border: "1px solid var(--card-border)", borderRadius: 10,
        padding: "12px 14px", marginBottom: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: 10.5, letterSpacing: 1.2,
            textTransform: "uppercase", color: "var(--text-faint)", margin: 0,
          }}>Your username</p>
          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600,
            color: username ? "var(--text-strong)" : "var(--text-faint)", margin: "2px 0 0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{username || "Not set — tap Choose"}</p>
        </div>
        <button onClick={onEdit} style={{
          background: username ? "transparent" : "#F2C572",
          color: username ? "var(--text-secondary)" : "#16233F",
          border: username ? "1px solid var(--card-border)" : "none",
          borderRadius: 8, padding: "0 14px", minHeight: 40, flexShrink: 0,
          fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>{username ? "Change" : "Choose"}</button>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--input-bg)", border: "1px solid var(--card-border)",
      borderRadius: 10, padding: "12px 14px", marginBottom: 12,
    }}>
      <p style={{
        fontFamily: "Inter, sans-serif", fontSize: 10.5, letterSpacing: 1.2,
        textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 8px",
      }}>Your username</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={value}
          onChange={e => { setValue(e.target.value); setError(""); }}
          placeholder="e.g. finn"
          maxLength={social.USERNAME_MAX}
          autoCapitalize="none"
          autoCorrect="off"
          style={{
            flex: 1, minWidth: 0, background: "var(--card-bg)", border: "1px solid var(--card-border)",
            borderRadius: 8, color: "var(--text-strong)", padding: "12px 12px", minHeight: 46,
            fontFamily: "Inter, sans-serif", fontSize: 15, outline: "none",
          }}
        />
        <button onClick={save} disabled={saving} style={{
          background: "#F2C572", color: "#16233F", border: "none", borderRadius: 8,
          padding: "0 16px", minHeight: 46, flexShrink: 0, whiteSpace: "nowrap",
          fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
          cursor: "pointer", opacity: saving ? 0.6 : 1,
        }}>{saving ? "…" : "Save"}</button>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={{
          background: "none", border: "none", padding: "2px 0", cursor: "pointer", flexShrink: 0,
          fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-secondary)",
        }}>Cancel</button>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: error ? "#B4553F" : "var(--text-faint)", margin: 0, lineHeight: 1.4 }}>
          {error || `${social.USERNAME_MIN}–${social.USERNAME_MAX} characters. This replaces your real name everywhere.`}
        </p>
      </div>
    </div>
  );
}

export function FriendsModal({ game, googleUser, onClose, onAddFriend, onRemoveFriend, nudges, onClearNudges, onSetUsername }) {
  const [tab, setTab] = useState("friends");
  const [board, setBoard] = useState(null);
  const [global, setGlobal] = useState(null);
  const [globalError, setGlobalError] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const myCode = googleUser ? social.codeForUid(googleUser.uid) : null;
  const wk = G.weekXp(game);
  const rank = G.rankForWeekXp(wk);
  const next = G.nextRank(wk);
  const username = game.username || null;

  const me = {
    uid: googleUser ? googleUser.uid : "me",
    username: username || "You",
    emoji: game.profileEmoji || "🦉",
    weekXp: wk,
    streak: game.streak,
    level: G.levelForXp(game.xp),
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!googleUser || !(game.friends || []).length) {
        setBoard(social.buildBoard(me, [], G.weekStartKey()));
        return;
      }
      try {
        const profiles = await social.fetchProfiles(game.friends);
        if (!cancelled) setBoard(social.buildBoard(me, profiles, G.weekStartKey()));
      } catch (e) {
        if (!cancelled) setBoard(social.buildBoard(me, [], G.weekStartKey()));
      }
    })();
    return () => { cancelled = true; };
  }, [googleUser, (game.friends || []).join(","), wk]);

  // The global board is fetched lazily: it costs a query against every listed
  // player, and most opens of this sheet are about friends.
  useEffect(() => {
    if (tab !== "global" || !googleUser) return;
    let cancelled = false;
    setGlobalError(false);
    (async () => {
      try {
        const rows = await social.globalBoard(G.weekStartKey());
        if (!cancelled) setGlobal(social.buildGlobalBoard(rows, googleUser.uid, username ? me : null));
      } catch (e) {
        if (!cancelled) { setGlobal([]); setGlobalError(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [tab, googleUser, wk, username]);

  const add = async () => {
    const clean = social.normalizeCode(codeInput);
    if (clean.length !== 6) { setStatus("A friend code is 6 characters."); return; }
    if (clean === myCode) { setStatus("That's your own code."); return; }
    setBusy(true); setStatus("");
    try {
      const found = await social.findByCode(clean);
      const who = found && (found.username || "That player");
      if (!found) setStatus("No one found with that code. Codes are case-insensitive.");
      else if ((game.friends || []).includes(found.uid)) setStatus(`${who} is already on your board.`);
      else { onAddFriend(found.uid); setCodeInput(""); setStatus(`Added ${who} — you're on each other's board.`); }
    } catch (e) {
      setStatus("Couldn't reach the leaderboard. Check your connection.");
    }
    setBusy(false);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) { /* clipboard blocked — the code is on screen anyway */ }
  };

  if (!googleUser) {
    return (
      <ModalShell title="Compete with friends" onClose={onClose}>
        <div style={{ textAlign: "center", padding: "20px 8px" }}>
          <Users size={34} color="var(--text-faint)" />
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14.5, color: "var(--text-strong)", margin: "12px 0 6px", fontWeight: 600 }}>
            Sign in to add friends
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            A weekly leaderboard needs an account to hang your score on. Your cards
            stay private — friends only ever see your XP, streak and level.
          </p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="This week" onClose={onClose}>
      {nudges && nudges.length > 0 && (
        <div style={{
          background: "rgba(242,197,114,0.14)", border: "1px solid rgba(242,197,114,0.4)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 14,
        }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "var(--text-strong)", margin: 0, fontWeight: 600 }}>
            {nudges.length === 1
              ? `${nudges[0].emoji} ${nudges[0].name} nudged you`
              : `${nudges.length} friends nudged you`}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-secondary)", margin: "3px 0 8px" }}>
            They're waiting for you to keep the board honest.
          </p>
          <button onClick={onClearNudges} style={{
            background: "transparent", border: "1px solid var(--card-border)", borderRadius: 8,
            padding: "8px 12px", minHeight: 40, fontFamily: "Inter, sans-serif", fontSize: 12.5,
            color: "var(--text-secondary)", cursor: "pointer",
          }}>Got it</button>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 10, background: "var(--input-bg)",
        border: "1px solid var(--card-border)", borderRadius: 10, padding: "12px 14px", marginBottom: 14,
      }}>
        <Trophy size={20} color={rank.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>
            {rank.name} · {wk} XP
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            {next ? `${next.min - wk} XP to ${next.name}` : "Top rank — hold it to Sunday."}
          </p>
        </div>
      </div>

      <UsernameRow
        username={username}
        editing={editingName}
        onEdit={() => setEditingName(true)}
        onCancel={() => setEditingName(false)}
        onSave={async (name) => {
          const res = await onSetUsername(name);
          if (res.ok) setEditingName(false);
          return res;
        }}
        suggestion={googleUser ? social.suggestUsername(googleUser.uid) : ""}
      />

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["friends", "Friends"], ["global", "Everyone"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, minHeight: 40, borderRadius: 8, cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 600,
            background: tab === id ? "rgba(242,197,114,0.16)" : "transparent",
            border: `1px solid ${tab === id ? "rgba(242,197,114,0.45)" : "var(--card-border)"}`,
            color: tab === id ? "var(--text-strong)" : "var(--text-secondary)",
          }}>{label}</button>
        ))}
      </div>

      {tab === "friends" ? (
        board === null ? (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-faint)" }}>Loading…</p>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {board.map(row => <BoardRow key={row.uid} row={row} onRemove={onRemoveFriend} />)}
            {board.length === 1 && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-faint)", margin: "6px 0 0", lineHeight: 1.45 }}>
                It's quiet in here. Send someone your code and the board comes alive —
                people who study with a friend show up far more often than people who don't.
              </p>
            )}
          </div>
        )
      ) : (
        <div style={{ marginBottom: 16 }}>
          {global === null ? (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-faint)" }}>Loading…</p>
          ) : globalError ? (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.45 }}>
              Couldn't load the global board. Check your connection and try again.
            </p>
          ) : !username ? (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.45 }}>
              Pick a username above to join the global board. Until then you can look,
              but nobody can see you.
            </p>
          ) : global.length === 0 ? (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.45 }}>
              Nobody has scored yet this week. Do a session and you're top of the board.
            </p>
          ) : (
            <>
              {global.map(row => <BoardRow key={row.uid} row={row} />)}
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "var(--text-faint)", margin: "8px 0 0", lineHeight: 1.45 }}>
                Top {global.length} this week, resets Monday. You can hide yourself in
                Settings — your friends board keeps working either way.
              </p>
            </>
          )}
        </div>
      )}

      <SectionLabel>Your friend code</SectionLabel>
      <button onClick={copyCode} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--input-bg)", border: "1px dashed var(--card-border)", borderRadius: 10,
        padding: "14px 16px", minHeight: 52, marginBottom: 14, cursor: "pointer",
      }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 600, letterSpacing: 3, color: "var(--text-strong)" }}>
          {myCode}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "Inter, sans-serif", fontSize: 12.5, color: copied ? "#5C7A44" : "var(--text-secondary)" }}>
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </span>
      </button>

      <SectionLabel>Add a friend</SectionLabel>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={codeInput}
          onChange={e => setCodeInput(social.normalizeCode(e.target.value))}
          placeholder="ABC123"
          autoCapitalize="characters"
          style={{
            // minWidth 0 or the input's intrinsic width keeps it from shrinking
            // and shoves Add off the edge on a 320px phone.
            flex: 1, minWidth: 0, background: "var(--input-bg)", border: "1px solid var(--card-border)",
            borderRadius: 8, color: "var(--text-strong)", padding: "13px 14px", minHeight: 48,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, letterSpacing: 2, outline: "none",
          }}
        />
        <button onClick={add} disabled={busy} style={{
          background: "#F2C572", color: "#16233F", border: "none", borderRadius: 8,
          padding: "0 18px", minHeight: 48, fontFamily: "Inter, sans-serif", fontWeight: 600,
          fontSize: 14.5, display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
          flexShrink: 0, whiteSpace: "nowrap", opacity: busy ? 0.6 : 1,
        }}><UserPlus size={16} /> Add</button>
      </div>
      {status && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-secondary)", margin: "8px 0 0" }}>
          {status}
        </p>
      )}
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "var(--text-faint)", margin: "12px 0 0", lineHeight: 1.5 }}>
        Adding someone puts you on each other's board — they'll see you once they
        next open the app. Friends see your username, streak, level and weekly XP,
        never your cards, your subjects or your email. Removing someone takes them
        off your board only.
      </p>
    </ModalShell>
  );
}

// ---------- the reward screen after a session ----------

// Shown once, right after a name has been claimed on the user's behalf. The
// point is that nobody discovers weeks later that they've been sitting on the
// leaderboard under a generated name — or, worse, that they were invisible and
// never knew.
export function UsernameNotice({ username, onChange, onKeep }) {
  return (
    <ModalShell title="You're on the board" onClose={onKeep}>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
        Other players see you as
      </p>
      <div style={{
        background: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: 10,
        padding: "14px 16px", marginBottom: 14,
      }}>
        <span style={{
          fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-strong)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
        }}>{username}</span>
      </div>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-faint)", margin: "0 0 16px", lineHeight: 1.5 }}>
        Your real name is never shown — this is the only name anyone sees. Change
        it whenever you like.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onChange} style={{
          flex: 1, background: "#F2C572", color: "#16233F", border: "none", borderRadius: 8,
          minHeight: 48, fontFamily: "Inter, sans-serif", fontSize: 14.5, fontWeight: 600, cursor: "pointer",
        }}>Pick my own</button>
        <button onClick={onKeep} style={{
          flex: 1, background: "transparent", color: "var(--text-secondary)",
          border: "1px solid var(--card-border)", borderRadius: 8, minHeight: 48,
          fontFamily: "Inter, sans-serif", fontSize: 14.5, fontWeight: 600, cursor: "pointer",
        }}>Keep this</button>
      </div>
    </ModalShell>
  );
}

export function SessionReward({ award, game, onDone, onExtra }) {
  const lvl = G.levelBounds(game.xp);
  const rows = [
    { label: `${award.correct}/${award.answered} recalled`, xp: award.base },
    award.levelUps > 0 && { label: `${award.levelUps} card${award.levelUps !== 1 ? "s" : ""} strengthened`, xp: 0, note: true },
    { label: award.perfect ? "Perfect session" : "Session finished", xp: award.bonus },
    award.goalBonus > 0 && { label: "Daily goal reached", xp: award.goalBonus },
    award.questXp > 0 && { label: `${award.questsDone.length} quest${award.questsDone.length !== 1 ? "s" : ""} completed`, xp: award.questXp },
  ].filter(Boolean);

  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: 14, padding: 26, textAlign: "center",
      boxShadow: "0 6px 20px rgba(0,0,0,0.3)", animation: "popIn 0.25s ease-out",
    }}>
      <div style={{ fontSize: 40, marginBottom: 4 }}>
        {award.levelUp ? "🎉" : award.perfect ? "🎯" : award.goalMet ? "🔥" : "✅"}
      </div>
      <p style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 600, fontSize: 23, color: "var(--text-strong)", margin: "0 0 2px" }}>
        {award.levelUp ? `Level ${award.levelUp}!` : award.streakUp ? `${award.streak}-day streak!` : award.perfect ? "Flawless" : "Nice work"}
      </p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 30, fontWeight: 800, color: "#F2C572", margin: "8px 0 2px" }}>
        +{award.total} XP
      </p>

      <div style={{ textAlign: "left", margin: "18px 0 6px" }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "7px 0", borderTop: i ? "1px solid var(--card-border-light)" : "none",
          }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "var(--text-secondary)" }}>{r.label}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: r.xp ? "var(--text-strong)" : "var(--text-faint)" }}>
              {r.xp ? `+${r.xp}` : "✓"}
            </span>
          </div>
        ))}
      </div>

      <div style={{ margin: "16px 0 4px" }}>
        <div style={{ height: 8, background: "var(--card-border)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(lvl.into / lvl.span) * 100}%`, background: "#F2C572", transition: "width 0.8s ease-out" }} />
        </div>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", margin: "5px 0 0" }}>
          Level {lvl.level} · {lvl.span - lvl.into} XP to go
        </p>
      </div>

      {!award.goalMet && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-secondary)", margin: "12px 0 0" }}>
          {award.goalCards - award.cardsToday} more card{award.goalCards - award.cardsToday !== 1 ? "s" : ""} today keeps your streak alive.
        </p>
      )}
      {award.freezeEarned && (
        <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#4E7FA8", margin: "10px 0 0" }}>
          <Snowflake size={14} /> Streak freeze earned — one missed day is covered.
        </p>
      )}
      {award.newAchievements.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {award.newAchievements.map(a => (
            <div key={a.id} style={{
              display: "flex", alignItems: "center", gap: 6, background: "var(--input-bg)",
              border: "1px solid var(--card-border)", borderRadius: 20, padding: "7px 12px",
            }}>
              <span style={{ fontSize: 15 }}>{a.icon}</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: "var(--text-strong)" }}>{a.name}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        {onExtra && (
          <button onClick={onExtra} style={{
            flex: 1, background: "transparent", color: "var(--text-secondary)",
            border: "1px solid var(--card-border)", borderRadius: 10, padding: "13px 16px",
            minHeight: 48, fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15, cursor: "pointer",
          }}>Keep going</button>
        )}
        <button onClick={onDone} style={{
          flex: 1, background: "#F2C572", color: "#16233F", border: "none", borderRadius: 10,
          padding: "13px 16px", minHeight: 48, fontFamily: "Inter, sans-serif", fontWeight: 600,
          fontSize: 15, cursor: "pointer",
        }}>Done</button>
      </div>
    </div>
  );
}

// ---------- streak-at-risk nudge banner ----------

export function RiskBanner({ game, onStudyNow }) {
  if (!G.streakAtRisk(game)) return null;
  const hoursLeft = 24 - new Date().getHours();
  if (hoursLeft > 7) return null; // only start pressing in the evening
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(242,135,78,0.14)", border: "1px solid rgba(242,135,78,0.4)",
      borderRadius: 10, padding: "12px 14px", marginBottom: 14,
    }}>
      <Flame size={18} color="#F2874E" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 600, color: "#EDE6D3", margin: 0 }}>
          Your {game.streak}-day streak ends tonight
        </p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#B8C6DC", margin: "2px 0 0" }}>
          {game.goalCards - G.todayStats(game).cards} cards saves it.
        </p>
      </div>
      <button onClick={onStudyNow} style={{
        background: "#F2874E", color: "#16233F", border: "none", borderRadius: 8,
        padding: "9px 14px", minHeight: 40, fontFamily: "Inter, sans-serif",
        fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0,
      }}>Save it</button>
    </div>
  );
}
