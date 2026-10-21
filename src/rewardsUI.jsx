import { t, appLocale } from "./i18n";
// ---------------------------------------------------------------------------
// Rewards UI — the gem chip, chests, their opening, challenges and the shop.
// The rules live in rewards.js; nothing here decides what anything is worth.
// ---------------------------------------------------------------------------
import { useState, useEffect, useRef } from "react";
import { Gem, Gift } from "lucide-react";
import * as G from "./gamification";
import * as R from "./rewards";
import { ModalShell, SectionLabel } from "./gameUI";
import "./rewards.css";

// Drawn in code: four tints of one chest, so a new tier is a colour, not art.
export function ChestIcon({ tier = "wood", size = 56, open = false }) {
  const c = R.TIERS[tier] || R.TIERS.wood;
  return (
    <svg className={`fc-chest-svg${open ? " is-open" : ""}`} width={size} height={size * 0.875} viewBox="0 0 64 56" aria-hidden="true">
      <ellipse cx="32" cy="53" rx="24" ry="3" fill="rgba(0,0,0,0.25)" />
      <rect x="8" y="26" width="48" height="26" rx="3" fill={c.color} />
      <rect x="8" y="26" width="48" height="5" fill="rgba(0,0,0,0.18)" />
      <rect x="12" y="26" width="5" height="26" fill={c.band} opacity="0.85" />
      <rect x="47" y="26" width="5" height="26" fill={c.band} opacity="0.85" />
      {open && <rect x="11" y="23" width="42" height="6" rx="2" fill="#FFE9A8" opacity="0.9" />}
      <g className="fc-chest-lid">
        <path d="M8 30 V18 Q8 8 20 8 H44 Q56 8 56 18 V30 Z" fill={c.lid} />
        <path d="M12 30 V17 Q12 10 18 9 H17 V30 Z" fill={c.band} opacity="0.85" />
        <path d="M52 30 V17 Q52 10 46 9 H47 V30 Z" fill={c.band} opacity="0.85" />
        <path d="M14 13 Q20 10 30 10" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="27" y="24" width="10" height="12" rx="2" fill={c.band} />
        <circle cx="32" cy="29" r="1.8" fill={c.lid} />
      </g>
    </svg>
  );
}

// ---------- status-bar chip ----------
export function GemChip({ game, onOpen, style, valueStyle, labelStyle }) {
  const r = R.normalizeRewards(game);
  const unopened = r.chests.length;
  return (
    <button onClick={onOpen} style={{ ...style, position: "relative" }} aria-label={t("Gems and chests")}>
      <Gem size={16} color="#5FC5D8" />
      <span style={valueStyle}>{r.gems}</span>
      {labelStyle && <span className="fc-chip-label" style={labelStyle}>{t("gems")}</span>}
      {unopened > 0 && (
        <span style={{
          position: "absolute", top: 4, right: 6, minWidth: 16, height: 16, borderRadius: 8,
          background: "var(--accent-warm)", color: "var(--shell-bg)", fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
          fontFamily: "Inter, sans-serif",
        }}>{unopened}</span>
      )}
    </button>
  );
}

// ---------- the chest under today's quests ----------
export function QuestChestRow({ game, onOpen }) {
  const today = G.dayKey();
  const state = R.dailyChestState(game, today);
  const r = R.normalizeRewards(game);
  const claimed = !!r.claims[`daily:${today}`];
  const waiting = r.chests.find(c => c.id === `daily:${today}`);
  return (
    <button onClick={onOpen} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "9px 0 0",
      marginTop: 4, background: "none", border: "none", borderTop: "1px solid var(--card-border-light)",
      cursor: "pointer", textAlign: "left",
    }}>
      <div style={{ width: 26, flexShrink: 0, opacity: claimed && !waiting ? 0.5 : 1 }}><ChestIcon tier="silver" size={26} open={claimed && !waiting} /></div>
      <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: 13, color: waiting ? "var(--accent)" : "var(--text-secondary)", fontWeight: waiting ? 700 : 500 }}>
        {waiting ? t("Daily chest earned — tap to open") : claimed ? t("Daily chest opened") : t("Finish all {0} quests for a daily chest", [state.total || 3])}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)" }}>{state.count}/{state.total || 3}</span>
    </button>
  );
}

// ---------- on the session reward screen ----------
export function SessionChests({ award, onOpen }) {
  const chests = award.chests || [];
  if (!chests.length) return null;
  const best = [...chests].sort((a, b) => tierRank(b) - tierRank(a))[0];
  return (
    <button onClick={onOpen} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 12, marginTop: 14,
      background: "var(--input-bg)", border: "1px solid var(--accent)", borderRadius: 12,
      padding: "10px 14px", minHeight: 56, cursor: "pointer", textAlign: "left", animation: "popIn 0.3s ease-out",
    }}>
      <ChestIcon tier={R.CHEST_KINDS[best.kind].tier} size={40} />
      <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>
        {chests.length === 1 ? t(R.CHEST_KINDS[best.kind].name) + " " + t("earned!") : t("{0} chests earned!", [chests.length])}
      </span>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{t("Open")}</span>
    </button>
  );
}
const TIER_ORDER = ["wood", "silver", "gold", "epic"];
function tierRank(chest) { return TIER_ORDER.indexOf(R.CHEST_KINDS[chest.kind]?.tier); }

function chestLabel(chest) {
  const base = t(R.CHEST_KINDS[chest.kind].name);
  return chest.kind === "streak" ? t("{0}-day streak", [chest.milestone]) : base;
}

// ---------- opening one ----------
// Shake → lid → gems. Opened in the state up front (so closing mid-animation
// can't lose the chest or pay it twice); the animation only reveals it.
function ChestStage({ chest, opened, onDone }) {
  const [stage, setStage] = useState("shake");
  const [shown, setShown] = useState(0);
  const reduce = useRef(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const id = setTimeout(() => setStage("open"), reduce.current ? 0 : 800);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (stage !== "open") return;
    if (reduce.current) { setShown(opened.gems); return; }
    const start = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min(1, (now - start) / 700);
      setShown(Math.round(opened.gems * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [stage, opened.gems]);
  const tier = R.CHEST_KINDS[chest.kind].tier;
  const sparks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: Math.cos(a) * (70 + (i % 3) * 18), y: Math.sin(a) * 60 - 70, r: (i * 47) % 90 - 45, d: (i % 4) * 0.05 };
  });
  return (
    <div className={`fc-chest-stage is-${stage === "shake" ? "shaking" : "open"}`} onClick={stage === "open" ? onDone : undefined} role="dialog" aria-label={chestLabel(chest)}>
      <p className="fc-chest-title">{chestLabel(chest)}</p>
      <div className="fc-chest-wrap">
        <div className="fc-chest-glow" />
        <ChestIcon tier={tier} size={150} open={stage === "open"} />
        {stage === "open" && sparks.map((s, i) => (
          <span key={i} className="fc-gem-spark" style={{ "--x": `${s.x}px`, "--y": `${s.y}px`, "--r": `${s.r}deg`, "--d": `${s.d}s` }}>💎</span>
        ))}
      </div>
      <p className="fc-chest-amount" aria-live="polite">{stage === "open" ? `+${shown} 💎` : ""}</p>
      {stage === "open" && opened.jackpot && <span className="fc-chest-jackpot">{t("Jackpot — triple gems")}</span>}
      {stage === "open" && (
        <button onClick={onDone} style={{
          marginTop: 10, background: "var(--accent)", color: "var(--shell-bg)", border: "none", borderRadius: 10,
          padding: "13px 28px", minHeight: 48, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}>{t("Collect")}</button>
      )}
    </div>
  );
}

// ---------- the sheet ----------
export function RewardsModal({ game, onClose, onOpenChest, onBuy, onBuyEmoji }) {
  const [opening, setOpening] = useState(null); // { chest, opened }
  const [message, setMessage] = useState("");
  const r = R.normalizeRewards(game);
  const today = G.dayKey();
  const week = R.weeklyChallenge(game, today);
  const month = R.monthlyChallenge(game, today);
  const nextMilestone = R.nextStreakMilestone(game.streak || 0);
  const repair = R.repairAvailable(game, today);
  const boostLeft = Math.max(0, Math.ceil((r.boostUntil - Date.now()) / 60000));
  const monthName = new Date(Number(month.month.slice(0, 4)), Number(month.month.slice(5)) - 1, 1)
    .toLocaleDateString(appLocale(), { month: "long" });

  const open = (chest) => {
    const opened = onOpenChest(chest.id);
    if (opened) setOpening({ chest, opened });
  };
  const buy = (id) => {
    const res = onBuy(id);
    const item = R.SHOP.find(i => i.id === id);
    setMessage(res.ok ? t("{0} bought.", [t(item.name)]) : "");
  };

  const reasonFor = (id) => {
    const c = R.canBuy(game, id, today);
    if (c.ok) return null;
    if (c.reason === "full") return t("Freeze bank full (5)");
    if (c.reason === "nothing") return t("No broken streak to repair");
    if (c.reason === "gems") return t("Not enough gems");
    return "";
  };

  return (
    <ModalShell title="Rewards" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Gem size={30} color="#5FC5D8" />
        <div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text-strong)", margin: 0, lineHeight: 1 }}>{r.gems}</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            {t("gems")}{boostLeft > 0 ? ` · ⚡ ${t("Double XP for {0} more min", [boostLeft])}` : ""}
          </p>
        </div>
      </div>

      <SectionLabel>{r.chests.length ? t("Chests to open ({0})", [r.chests.length]) : t("Chests")}</SectionLabel>
      {r.chests.length ? (
        <div className="fc-chest-grid">
          {r.chests.map(c => (
            <button key={c.id} className="fc-chest-tile" onClick={() => open(c)}>
              <ChestIcon tier={R.CHEST_KINDS[c.kind].tier} size={52} />
              <span>{chestLabel(c)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ display: "flex", gap: 8, alignItems: "flex-start", fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--text-faint)", margin: "0 0 18px", lineHeight: 1.4 }}>
          <Gift size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {t("Chests come from finishing all daily quests, streak milestones, the weekly and monthly challenges, and sometimes from a session — always from a flawless one.")}
        </p>
      )}

      <SectionLabel>{t("Challenges")}</SectionLabel>
      <Challenge
        title={t("This week: earn {0} XP", [week.target])}
        value={week.progress} target={week.target}
        note={week.claimed ? t("Weekly chest earned. A new one starts Monday.") : t("Gold chest when you get there.")}
      />
      <Challenge
        title={t("{0}: study on {1} days", [monthName, month.target])}
        value={month.progress} target={month.target}
        note={month.claimed ? t("Monthly badge and chest earned.") : month.reachable ? t("Epic chest and a badge for the month.") : t("Out of reach this month — next month starts fresh.")}
      >
        {Object.keys(r.badges).length > 0 && (
          <div className="fc-badges">
            {Object.keys(r.badges).sort().reverse().map(m => (
              <span key={m}>🏅 {new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1, 1).toLocaleDateString(appLocale(), { month: "short", year: "numeric" })}</span>
            ))}
          </div>
        )}
      </Challenge>
      {nextMilestone && (
        <Challenge
          title={t("Streak milestone: {0} days", [nextMilestone])}
          value={game.streak || 0} target={nextMilestone}
          note={t("Gold chest at every milestone.")}
        />
      )}

      <div style={{ height: 10 }} />
      <SectionLabel>{t("Shop")}</SectionLabel>
      {R.SHOP.filter(item => item.id !== "repair" || repair).map(item => {
        const reason = reasonFor(item.id);
        return (
          <div key={item.id} className="fc-shop-item">
            <span className="fc-shop-icon">{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{t(item.name)}</strong>
              <small>
                {item.id === "repair" && repair ? t("Get your {0}-day streak back.", [repair.streak]) : t(item.blurb)}
                {item.id === "freeze" ? ` ${t("Banked: {0}.", [game.freezes || 0])}` : ""}
                {reason && reason !== t("Not enough gems") ? ` ${reason}.` : ""}
              </small>
            </div>
            <button className="fc-shop-buy" disabled={!!reason} onClick={() => buy(item.id)} title={reason || undefined}>
              <Gem size={13} /> {item.price}
            </button>
          </div>
        );
      })}
      {message && <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--success)", margin: "2px 0 8px" }}>{message}</p>}

      <div style={{ height: 10 }} />
      <SectionLabel>{t("Leaderboard emoji")}</SectionLabel>
      <div className="fc-emoji-grid">
        {R.EMOJIS.map(e => {
          const owned = R.ownsEmoji(game, e.id);
          const on = (game.profileEmoji || "🦉") === e.id;
          return (
            <button key={e.id} className={on ? "is-on" : ""} disabled={!owned && r.gems < e.price}
              onClick={() => onBuyEmoji(e.id)} aria-label={owned ? t("Use {0}", [e.id]) : t("Buy {0} for {1} gems", [e.id, e.price])}>
              <span>{e.id}</span>
              {on ? t("in use") : owned ? t("owned") : `💎 ${e.price}`}
            </button>
          );
        })}
      </div>

      {opening && <ChestStage chest={opening.chest} opened={opening.opened} onDone={() => setOpening(null)} />}
    </ModalShell>
  );
}

function Challenge({ title, value, target, note, children }) {
  return (
    <div className="fc-challenge">
      <div className="fc-challenge-head"><span>{title}</span><span>{Math.min(value, target)}/{target}</span></div>
      <div className="fc-challenge-bar"><div style={{ width: `${Math.min(1, value / target) * 100}%` }} /></div>
      <p>{note}</p>
      {children}
    </div>
  );
}
