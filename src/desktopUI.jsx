import { t } from "./i18n";
import { BarChart3, BookOpen, Flame, Layers, Settings, Target, Trophy, Users, Zap } from "lucide-react";
import * as G from "./gamification";
import { QuestList, Ring } from "./gameUI";

export function DesktopNavigation({ view, onNavigate, onOpenFriends, onOpenSettings, nudgeCount = 0 }) {
  const items = [
    { id: "library", label: "Library", Icon: Layers, action: () => onNavigate("library") },
    { id: "study", label: "Study", Icon: BookOpen, action: () => onNavigate("study") },
    { id: "stats", label: "Statistics", Icon: BarChart3, action: () => onNavigate("stats") },
    { id: "friends", label: "Friends", Icon: Users, action: onOpenFriends },
    { id: "settings", label: "Settings", Icon: Settings, action: onOpenSettings },
  ];
  const focused = view === "session" || view === "test";
  return (
    <aside className="fc-sidebar">
      <div className="fc-desktop-brand">{t("Catalog")}<span>{t("Make it stick.")}</span></div>
      <nav aria-label={t("Main navigation")} className="fc-desktop-nav">
        {items.map(({ id, label, Icon, action }) => (
          <button key={id} type="button" onClick={action} disabled={focused}
            aria-current={view === id ? "page" : undefined}>
            <Icon size={21} aria-hidden="true" /><span>{t(label)}</span>
            {id === "friends" && nudgeCount > 0 && <span className="fc-nav-badge" aria-label={t("{0} new nudge{1}", [nudgeCount, nudgeCount !== 1 ? "s" : ""])}>{nudgeCount}</span>}
          </button>
        ))}
      </nav>
      <div className="fc-sidebar-footer">
        <BookOpen size={18} aria-hidden="true" />
        <p>{focused ? t("Finish or exit your session to navigate.") : t("A little recall, every day.")}</p>
      </div>
    </aside>
  );
}

export function DesktopProgress({ game, onOpenGoal, onOpenStreak, onOpenFriends }) {
  const today = G.todayStats(game);
  const weekXp = G.weekXp(game);
  const rank = G.rankForWeekXp(weekXp);
  const next = G.nextRank(weekXp);
  const goal = game.goalCards || G.DEFAULT_GOAL_CARDS;
  const complete = today.cards >= goal;
  const level = G.levelBounds(game.xp).level;
  return (
    <aside className="fc-progress-rail" aria-label={t("Your progress")}>
      <div className="fc-progress-summary">
        <button onClick={onOpenStreak} title={t("View your streak")}>
          <Flame size={20} color="var(--accent-warm)" aria-hidden="true" />
          <span><strong>{game.streak}</strong>{t(" day streak")}</span>
        </button>
        <div><Zap size={19} color="var(--accent)" aria-hidden="true" /><span><strong>{game.xp}</strong>{t(" XP · L{0}", [level])}</span></div>
      </div>
      <section className="fc-progress-panel">
        <div className="fc-panel-heading"><h2>{t("Daily goal")}</h2><Target size={18} aria-hidden="true" /></div>
        <div className="fc-goal-progress">
          <Ring value={today.cards / goal} size={66} stroke={6} color={complete ? "var(--success)" : "var(--accent)"}>
            <strong>{Math.round(Math.min(1, today.cards / goal) * 100)}<small>%</small></strong>
          </Ring>
          <div><strong>{t("{0} / {1} cards", [today.cards, goal])}</strong><p>{complete ? t("Goal complete. Nicely done.") : t("One card at a time.")}</p></div>
        </div>
        <button className="fc-rail-action" onClick={onOpenGoal}>{t("Adjust daily goal")}</button>
      </section>
      <section className="fc-progress-panel">
        <div className="fc-panel-heading"><h2>{t("This week")}</h2><Trophy size={18} color={rank.color} aria-hidden="true" /></div>
        <div className="fc-week-rank"><strong style={{ color: rank.color }}>{t(rank.name)}</strong><span>{t("{0} XP", [weekXp])}</span></div>
        <p className="fc-rail-copy">{next ? t("{0} XP to {1}.", [next.min - weekXp, t(next.name)]) : t("You've reached the highest weekly rank.")}</p>
        <button className="fc-rail-action" onClick={onOpenFriends}>{t("Friends & leaderboard")}</button>
      </section>
      <QuestList game={game} />
    </aside>
  );
}
