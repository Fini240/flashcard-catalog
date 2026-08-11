import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus, Trash2, Pencil, ChevronRight, X, Check,
  Shuffle, Layers, BookOpen, ArrowLeft, RotateCcw, Circle, Cloud, CloudOff, LogIn, LogOut, Upload,
  FileUp, Camera, Sparkles, Key, Settings, ExternalLink, CreditCard, Image as ImageIcon, Type, Eye, EyeOff, Search, Download, ClipboardList,
  Zap, Flag
} from "lucide-react";
import { Browser } from "@capacitor/browser";
import { App as CapacitorApp } from "@capacitor/app";
import * as firebaseSync from "./firebaseSync";
import * as aiImport from "./aiImport";
import { extractTextFromFile, fileToBase64, isTextFile } from "./fileImport";
import * as ocr from "./ocr";
import * as ankiImport from "./ankiImport";
import * as ankiDroid from "./ankiDroid";
import * as imageStore from "./imageStore";
import {
  normalize, PrimaryButton, GhostButton, TextField, Label,
  IndexCardTab, CardShell, CardFace,
} from "./cardUI";
import { pushBackHandler, consumeBack } from "./backHandler";
import * as G from "./gamification";
import * as social from "./social";
import * as reminders from "./reminders";
import * as backup from "./backup";
import * as drillsLib from "./drills";
import * as aiDrills from "./aiDrills";
import { ClozeCard, TrueFalseCard, MatchCard } from "./drillUI";
import { applyGrade, isLevelUp, isDue } from "./srs";
import { report, diagnosticsText } from "./report";
import { useSyncEngine } from "./useSyncEngine";
import {
  StatusBar, TodayCard, QuestList, StreakModal, GoalModal, FriendsModal,
  SessionReward, RiskBanner, MasteryPips, MasteryBar, Ring, UsernameNotice,
} from "./gameUI";

function openExternal(url) {
  Browser.open({ url }).catch(() => window.open(url, "_blank"));
}

// ---------- constants ----------
const SUBJECT_COLORS = [
  { bg: "#2F6F6D", tab: "#255957" }, // teal
  { bg: "#C98A2B", tab: "#A66F1F" }, // ochre
  { bg: "#7B4B94", tab: "#623C78" }, // plum
  { bg: "#B5533C", tab: "#943F2C" }, // brick
  { bg: "#5C7A44", tab: "#496035" }, // moss
  { bg: "#A6435E", tab: "#87344A" }, // rose
];
const THEME_KEY = "flashcard-catalog-dark-mode";
const getStoredDarkMode = () => {
  try { return localStorage.getItem(THEME_KEY) === "1"; } catch (e) { return false; }
};
const setStoredDarkMode = (value) => {
  try { localStorage.setItem(THEME_KEY, value ? "1" : "0"); } catch (e) { /* ignore */ }
};
// The card/modal "paper" surface is themeable; the dark navy shell around it
// stays the same in both modes (it's already dark) — dark mode only changes
// how that paper surface itself looks.
const THEME_VARS = {
  light: {
    "--card-bg": "#FBF7EC",
    "--input-bg": "#F1EAD8",
    "--card-border": "#D8CDB3",
    "--card-border-light": "#EDE4CC",
    "--text-strong": "#2A241A",
    "--text-secondary": "#5A5140",
    "--text-muted": "#7A705C",
    "--text-faint": "#9A9078",
  },
  dark: {
    "--card-bg": "#212B45",
    "--input-bg": "#182036",
    "--card-border": "#3A4A68",
    "--card-border-light": "#2E3B57",
    "--text-strong": "#EDE6D3",
    "--text-secondary": "#C7BCA0",
    "--text-muted": "#8CA0C2",
    "--text-faint": "#6B7A99",
  },
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// ---------- spaced repetition (Leitner boxes) ----------
// The scheduler lives in ./srs (imported above) so it's unit-testable; the
// study/session code below uses applyGrade/isLevelUp/isDue unqualified.

// ---------- tree helpers (subjects/subcategories nest to any depth) ----------
function collectIds(node) {
  let ids = [node.id];
  (node.children || []).forEach(c => { ids = ids.concat(collectIds(c)); });
  return ids;
}
function findNodeById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNodeById(n.children || [], id);
    if (found) return found;
  }
  return null;
}
function findPathTo(nodes, id, acc = []) {
  for (const n of nodes) {
    if (n.id === id) return [...acc, n.id];
    const sub = findPathTo(n.children || [], id, [...acc, n.id]);
    if (sub) return sub;
  }
  return null;
}
function getTrail(subjects, path) {
  const trail = [];
  let list = subjects;
  for (const id of path) {
    const node = list.find(n => n.id === id);
    if (!node) break;
    trail.push(node);
    list = node.children || [];
  }
  return trail;
}
function mapTree(nodes, id, fn) {
  return nodes.map(n => {
    if (n.id === id) return fn(n);
    if (n.children && n.children.length) return { ...n, children: mapTree(n.children, id, fn) };
    return n;
  });
}
function filterTree(nodes, id) {
  return nodes
    .filter(n => n.id !== id)
    .map(n => (n.children ? { ...n, children: filterTree(n.children, id) } : n));
}
function flattenTree(subjects) {
  const out = [];
  const walk = (node, depth, subjectId) => {
    out.push({ id: node.id, name: node.name, depth, subjectId, ids: collectIds(node) });
    (node.children || []).forEach(c => walk(c, depth + 1, subjectId));
  };
  subjects.forEach(s => walk(s, 0, s.id));
  return out;
}
// migrate legacy one-level-deep "categories" shape into recursive "children"
function migrateSubjects(rawSubjects) {
  const migrateNode = (n) => ({
    id: n.id,
    name: n.name,
    children: (n.children || n.categories || []).map(migrateNode),
  });
  return (rawSubjects || []).map(migrateNode);
}
function migrateCards(rawCards) {
  return (rawCards || []).map(c => ({ ...c, nodeId: c.nodeId || c.categoryId || c.subjectId }));
}

export default function FlashcardCatalog() {
  const [subjects, setSubjects] = useState([]);
  const [cards, setCards] = useState([]);
  const [game, setGame] = useState(G.emptyGame);
  const [view, setView] = useState("library"); // library | study | session
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(getStoredDarkMode);
  // Which gamification sheet is open, if any: streak | goal | friends
  const [sheet, setSheet] = useState(null);
  const [nudges, setNudges] = useState([]);
  // The auto-assigned username, shown once so it isn't a surprise.
  const [usernameNotice, setUsernameNotice] = useState(null);
  // Which folder the study screen should open on — set when Study is tapped
  // from inside a folder, so you land on that deck instead of "All subjects".
  const [studyNodeId, setStudyNodeId] = useState("all");
  const sessionQueueRef = useRef([]);
  const sessionDrillRef = useRef({ drill: null, content: {} }); // how this session asks
  const sessionOriginRef = useRef("study"); // where Exit/back leads from a session

  // Local persistence + cloud sync + sign-in all live in the sync engine —
  // extracted so the conflict/ownership logic is reviewable on its own.
  const {
    loaded, googleUser, syncState,
    currentDataRef, ownerUidRef, updatedAtRef, skipNextPush,
    signIn: handleSignIn, signOut: handleSignOut,
  } = useSyncEngine({
    subjects, cards, game,
    setSubjects, setCards, setGame, setError,
    migrate: { migrateSubjects, migrateCards },
  });

  // ---------- hardware/gesture back button (Android) ----------
  // Whatever's on top of the backHandler stack (a modal, a drilled-down
  // folder) gets first refusal; only when nothing is registered do we let
  // the OS back out of the app, by minimizing rather than killing it —
  // matching how the system back gesture behaves everywhere else on Android.
  useEffect(() => {
    let handle;
    CapacitorApp.addListener("backButton", () => {
      if (!consumeBack()) CapacitorApp.minimizeApp();
    }).then((h) => { handle = h; });
    return () => { handle && handle.remove(); };
  }, []);

  // Study and session screens each have an obvious "up" level; mirror it so
  // the hardware back button behaves like the on-screen back/exit buttons.
  useEffect(() => {
    if (view === "study") return pushBackHandler(() => setView("library"));
    if (view === "session") return pushBackHandler(() => setView(sessionOriginRef.current));
  }, [view]);

  // A bottom sheet is the topmost thing on screen, so back closes it first.
  // The goal sheet is opened from the streak sheet, so back steps back to it
  // rather than dumping the user all the way out to the library.
  useEffect(() => {
    if (sheet === "goal") return pushBackHandler(() => setSheet("streak"));
    if (sheet) return pushBackHandler(() => setSheet(null));
  }, [sheet]);

  // An app left open across midnight would otherwise keep showing yesterday's
  // goal ring and yesterday's quests. Checked once a minute — cheap, and it
  // also catches a phone whose clock jumped after a timezone change.
  useEffect(() => {
    if (!loaded) return;
    const tick = () => {
      setGame(g => {
        const rolled = G.ensureQuests(G.rollOver(g));
        return rolled === g ? g : rolled;
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [loaded]);

  // ---------- backup (export / import) ----------
  // The one-file escape hatch. Export is best-effort — worst case the user
  // gets an error message and nothing changes. Import *replaces* the current
  // catalog (after a confirm in the settings sheet) and re-runs the normal
  // migrations so old files keep working.
  //
  // A restore is attributed to whoever is signed in right now, which is what
  // makes it actually stick. Left unattributed, the push gate in useSyncEngine
  // (ownerUidRef === googleUser.uid) would never fire, so the restored catalog
  // would sit on the device unsynced until the next remote snapshot replaced
  // it with the cloud copy the user was trying to recover from.
  const exportCatalog = async () => {
    try {
      const payload = backup.buildBackupPayload(currentDataRef.current);
      await backup.exportBackup(payload);
      return "";
    } catch (e) {
      return `Export failed: ${e && e.message ? e.message : e}`;
    }
  };

  const importCatalog = async (file) => {
    try {
      const text = await file.text();
      const parsed = backup.parseBackup(text);
      if (!parsed.ok) return parsed.error;
      const now = Date.now();
      // A restore must always push. If a remote snapshot happened to land in
      // the moment between the user confirming and this running, skipNextPush
      // would still be set and the restore would be saved locally but never
      // sent — leaving the device and the cloud disagreeing until the next
      // unrelated edit.
      skipNextPush.current = false;
      setSubjects(migrateSubjects(parsed.backup.subjects));
      // Re-stamp every restored card as edited *now*. The card in the backup
      // carries whatever updatedAt it had when exported, which per-card merge
      // would treat as older than the copy already on the server — the restore
      // would show on screen and then be merged away. Restoring is an explicit
      // "this file wins" action, so it has to win the timestamp comparison too.
      setCards(migrateCards(parsed.backup.cards).map(c => ({ ...c, updatedAt: now })));
      if (parsed.backup.game) setGame(G.rollOver(G.normalizeGame(parsed.backup.game)));
      updatedAtRef.current = now;
      ownerUidRef.current = googleUser ? googleUser.uid : null;
      return "";
    } catch (e) {
      return `Import failed: ${e && e.message ? e.message : e}`;
    }
  };

  // A session runs a queue of steps, not of cards: one step is one thing put on
  // screen, and which exercise that is comes from the drill. The quick paths in
  // and out of the library don't stop to choose one, so they get the classic
  // flip — the behaviour they've always had.
  const startSession = (cards, origin, drill, content) => {
    const chosen = drill || drillsLib.drillById("classic");
    sessionDrillRef.current = { drill: chosen, content: content || {} };
    sessionQueueRef.current = drillsLib.buildQueue(chosen, cards, content || {}, currentDataRef.current.cards);
    sessionOriginRef.current = origin;
    setView("session");
  };

  // Retry rounds and "study again" rebuild their queue through the same drill,
  // so a re-run of the missed cards is asked the same way the first pass was.
  const rebuildQueue = (cards) => {
    const { drill, content } = sessionDrillRef.current;
    return drillsLib.buildQueue(drill, cards, content, currentDataRef.current.cards);
  };

  // A card's first answer in a session moves it through the Leitner boxes;
  // the updated cards flow through the normal debounced save + cloud sync.
  const gradeCard = (cardId, correct) => {
    setCards(cs => cs.map(c => (c.id === cardId ? applyGrade(c, correct) : c)));
  };

  // ---------- gamification ----------
  // Everything a finished session is worth is computed in one place, from the
  // answer log the Session screen hands back. The award object it returns is
  // what the reward screen renders — no second source of truth.
  const finishSession = (result) => {
    const { game: nextGame, award } = G.recordSession(currentDataRef.current.game, currentDataRef.current.cards, result);
    setGame(nextGame);
    publishProfile(nextGame);
    // Today is done, so today's reminder should stop being pending.
    reminders.sync(nextGame, nextGame.reminder, currentDataRef.current.cards)
      .catch((e) => report("reminders.syncAfterSession", e));
    return award;
  };

  // The public scoreboard document. Best-effort: a failed write just means a
  // friend sees a slightly stale number, never a broken app.
  //
  // Note what is *not* sent: the Google display name. The published identity is
  // the self-chosen username and nothing else — see the header of social.js.
  const publishProfile = (g) => {
    if (!googleUser) return;
    social.publishProfile(googleUser.uid, {
      username: g.username || "",
      listed: g.listed !== false,
      emoji: g.profileEmoji || "🦉",
      xp: g.xp,
      weekXp: G.weekXp(g),
      weekKey: G.weekStartKey(),
      streak: g.streak,
      level: G.levelForXp(g.xp),
      rank: G.rankForWeekXp(G.weekXp(g)).id,
      cardsTotal: G.lifetimeTotals(g).cards,
    }).catch((e) => report("social.publishProfile", e));
  };

  // Publish once on sign-in too, so a friend who adds your code sees a real
  // row rather than an empty one until your next session.
  //
  // Anyone without a username gets one first. Publishing an empty username
  // means `listed: false` and the word "Anonymous" on a friend's board — an
  // account that is signed in but invisible, with nothing on screen saying why.
  // Claiming a name up front makes the working state the default; the note that
  // follows tells the user what they're called and that they can change it.
  useEffect(() => {
    if (!googleUser || !loaded) return;
    let cancelled = false;
    (async () => {
      const current = currentDataRef.current.game;
      if (current.username) { publishProfile(current); return; }

      const res = await social.claimSuggestedUsername(googleUser.uid, null);
      if (cancelled) return;
      if (!res.ok) {
        // Offline, or every candidate taken. Publish what we have so the rest
        // of the profile is fresh, and try again on the next launch.
        publishProfile(currentDataRef.current.game);
        return;
      }
      const next = { ...currentDataRef.current.game, username: res.username };
      setGame(next);
      publishProfile(next);
      if (!next.usernamePrompted) setUsernameNotice(res.username);
    })();
    return () => { cancelled = true; };
  }, [googleUser, loaded]);

  // Pull any nudges friends left. Polled on open rather than with a live
  // listener — a nudge is not worth an always-on socket.
  useEffect(() => {
    if (!googleUser) { setNudges([]); return; }
    let cancelled = false;
    social.fetchNudges(googleUser.uid)
      .then(n => { if (!cancelled) setNudges(n); })
      .catch((e) => report("social.fetchNudges", e));
    return () => { cancelled = true; };
  }, [googleUser]);

  const clearNudges = () => {
    if (googleUser) social.clearNudges(googleUser.uid, nudges.map(n => n.id))
      .catch((e) => report("social.clearNudges", e));
    setNudges([]);
  };

  // Adding is mutual, but it can't be mutual *instantly*: the other person's
  // friend list is in their private document, which nobody else may write. So
  // we add locally and leave a marker in their public space; their app folds it
  // in on next launch. Until then the board is one-sided, which is the honest
  // state of things rather than a bug.
  const addFriend = (uid) => {
    setGame(g => {
      const friends = [...new Set([...(g.friends || []), uid])];
      const next = { ...g, friends };
      next.achievements = G.evaluateAchievements(next, currentDataRef.current.cards);
      return next;
    });
    if (googleUser) social.announceFriend(uid, googleUser.uid)
      .catch((e) => report("social.announceFriend", e));
  };

  // The receiving half: anyone who added us since we last looked joins our own
  // list. Merging is a union, so a marker that fails to clear costs nothing but
  // a repeated no-op next launch.
  useEffect(() => {
    if (!googleUser || !loaded) return;
    let cancelled = false;
    social.fetchFriendAdds(googleUser.uid)
      .then(adds => {
        if (cancelled || !adds.length) return;
        setGame(g => {
          const friends = social.mergeFriendAdds(g.friends, adds, googleUser.uid);
          if (friends.length === (g.friends || []).length) return g;
          const next = { ...g, friends };
          next.achievements = G.evaluateAchievements(next, currentDataRef.current.cards);
          return next;
        });
        social.clearFriendAdds(googleUser.uid, adds.map(a => a.id))
          .catch((e) => report("social.clearFriendAdds", e));
      })
      .catch((e) => report("social.fetchFriendAdds", e));
    return () => { cancelled = true; };
  }, [googleUser, loaded]);
  const removeFriend = (uid) => {
    setGame(g => ({ ...g, friends: (g.friends || []).filter(f => f !== uid) }));
  };

  // Claiming has to win in Firestore before it lands in local state — a name
  // stored locally that someone else owns would show a leaderboard row that
  // doesn't match what anyone else sees.
  const setUsername = async (name) => {
    if (!googleUser) return { ok: false, error: "Sign in first." };
    const current = currentDataRef.current.game;
    const res = await social.claimUsername(googleUser.uid, name, current.username);
    if (!res.ok) return res;
    const next = { ...current, username: res.username };
    setGame(next);
    publishProfile(next);
    return { ok: true };
  };

  // Marking it shown is what keeps this a one-time note rather than a greeting
  // on every launch.
  const dismissUsernameNotice = () => {
    setUsernameNotice(null);
    setGame(g => (g.usernamePrompted ? g : { ...g, usernamePrompted: true }));
  };

  const setListed = (listed) => {
    setGame(g => {
      const next = { ...g, listed };
      publishProfile(next);
      return next;
    });
  };

  // Returns a short note for the settings sheet when something needs saying —
  // a denied permission is the one case the user has to act on themselves.
  const setReminder = async (reminder) => {
    const current = currentDataRef.current.game;
    const next = { ...current, reminder };
    setGame(next);
    if (!reminder.enabled) {
      await reminders.disable();
      return "";
    }
    const res = await reminders.enable(next, reminder, currentDataRef.current.cards);
    if (!res.ok && res.reason === "denied") {
      setGame({ ...next, reminder: { ...reminder, enabled: false } });
      return "Notifications are blocked for this app. Turn them on in Android settings, then try again.";
    }
    return "";
  };

  // Keep the pending queue honest across app launches: the horizon rolls
  // forward, and a day studied on another device shouldn't still be pending.
  useEffect(() => {
    if (!loaded) return;
    const g = currentDataRef.current.game;
    if (!g.reminder || !g.reminder.enabled) return;
    reminders.sync(g, g.reminder, currentDataRef.current.cards)
      .catch((e) => report("reminders.sync", e));
  }, [loaded]);
  const setGoal = (cardsPerDay) => {
    setGame(g => ({ ...g, goalCards: cardsPerDay }));
    setSheet("streak");
  };

  // "Study now" — the one-tap path. Builds the best queue it can without
  // asking the user a single question: due cards first, weakest cards next,
  // capped at the daily goal so a session always feels finishable.
  const quickStudy = () => {
    const due = shuffle(cards.filter(c => isDue(c)));
    let queue = due;
    if (queue.length === 0) {
      // Nothing due: practise the shakiest cards instead of a random grab bag.
      queue = [...cards].sort((a, b) => (a.srsBox || 0) - (b.srsBox || 0)).slice(0, 30);
      queue = shuffle(queue);
    }
    const remaining = Math.max(5, game.goalCards - G.todayStats(game).cards);
    startSession(queue.slice(0, Math.max(remaining, 10)), "library");
  };

  const toggleDarkMode = () => {
    setDarkMode((d) => {
      const next = !d;
      setStoredDarkMode(next);
      return next;
    });
  };

  if (!loaded) {
    return (
      <Shell darkMode={darkMode}>
        <div style={{ padding: 48, textAlign: "center", color: "#EDE6D3", fontFamily: "Inter, sans-serif" }}>
          Opening the catalog…
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      googleUser={googleUser} syncState={syncState}
      onSignIn={handleSignIn} onSignOut={handleSignOut}
      onOpenSettings={() => setSettingsOpen(true)}
      darkMode={darkMode}
    >
      {error && (
        <div style={bannerStyle}>{error}</div>
      )}
      {view === "library" && (
        <Library
          subjects={subjects} setSubjects={setSubjects}
          cards={cards} setCards={setCards}
          game={game}
          nudgeCount={nudges.length}
          onOpenSheet={setSheet}
          onQuickStudy={quickStudy}
          goStudy={(nodeId) => { setStudyNodeId(nodeId || "all"); setView("study"); }}
          startReview={(queue) => startSession(queue, "library")}
          googleUser={googleUser}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {sheet === "streak" && (
        <StreakModal
          game={game} cards={cards}
          onClose={() => setSheet(null)}
          onOpenGoal={() => setSheet("goal")}
        />
      )}
      {sheet === "goal" && (
        <GoalModal game={game} onClose={() => setSheet(null)} onPick={setGoal} />
      )}
      {sheet === "friends" && (
        <FriendsModal
          game={game} googleUser={googleUser}
          nudges={nudges} onClearNudges={clearNudges}
          onAddFriend={addFriend} onRemoveFriend={removeFriend}
          onSetUsername={setUsername}
          onClose={() => setSheet(null)}
        />
      )}
      {usernameNotice && (
        <UsernameNotice
          username={usernameNotice}
          onChange={() => { dismissUsernameNotice(); setSheet("friends"); }}
          onKeep={dismissUsernameNotice}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          game={game}
          onSetReminder={setReminder}
          onSetListed={setListed}
          onExport={exportCatalog}
          onImport={importCatalog}
          diagInfo={{
            // uid, not email — this text is built to be pasted into a bug
            // report, and the uid is both the thing you'd look up in Firestore
            // and the thing that doesn't identify anyone outside the console.
            signedIn: googleUser ? `yes (${googleUser.uid})` : "no",
            syncState,
            cards: cards.length,
            subjects: subjects.length,
          }}
        />
      )}
      {view === "study" && (
        <StudySetup
          subjects={subjects} cards={cards}
          initialNodeId={studyNodeId}
          onBack={() => setView("library")}
          onStart={({ drill, content, pool, count }) => startSession(drillsLib.selectCards(drill, pool, count), "study", drill, content)}
        />
      )}
      {view === "session" && (
        <Session
          initialQueue={sessionQueueRef.current}
          rebuildQueue={rebuildQueue}
          game={game}
          onGrade={gradeCard}
          onFinish={finishSession}
          onExit={() => setView(sessionOriginRef.current)}
        />
      )}
    </Shell>
  );
}

const bannerStyle = {
  background: "#943F2C",
  color: "#FBF7EC",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 13,
  padding: "8px 16px",
  textAlign: "center",
};

const addMenuItemStyle = {
  display: "flex", alignItems: "center", gap: 8,
  background: "transparent", border: "none", borderRadius: 6,
  padding: "10px 10px", minHeight: 40, width: "100%", textAlign: "left",
  color: "var(--text-strong)", fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 500,
  WebkitTapHighlightColor: "transparent", cursor: "pointer",
};

// ---------- shell / theme ----------
function Shell({ children, googleUser, syncState, onSignIn, onSignOut, onOpenSettings, darkMode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--shell-bg)",
      backgroundImage:
        "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.03), transparent 40%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.025), transparent 40%)",
      display: "flex",
      flexDirection: "column",
      ...(darkMode ? THEME_VARS.dark : THEME_VARS.light),
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,500&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::selection { background: var(--highlight); color: #16233F; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea, select { font-family: inherit; }
        .fc-scroll::-webkit-scrollbar { width: 8px; }
        .fc-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        /* Two-sided card flip — the whole card turns, paper and all, so each
           face is a complete card. Both faces sit in the same grid cell, so the
           container is already as tall as the taller one and nothing below the
           card relayouts mid-turn, which is what made this stutter before.
           Perspective tracks the card's own width: a fixed value distorts a
           360px phone card and a 1200px desktop card by wildly different
           amounts. */
        .fc-flip {
          perspective: clamp(900px, 140vw, 2200px);
          /* Android paints a blue wash over whatever you tap, and a quick
             second tap starts selecting the question text — both flash blue
             over the card on every flip. */
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .fc-flip-inner {
          display: grid;
          width: 100%;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transition: transform 0.42s cubic-bezier(0.2, 0.75, 0.3, 1);
          will-change: transform;
        }
        .fc-flip-face {
          grid-area: 1 / 1;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: rotateY(0deg);
        }
        .fc-flip-face-back { transform: rotateY(180deg); }
        @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes sheetUp { from { transform: translateY(24px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        @media (max-width: 480px) {
          .fc-subtitle { display: none; }
          .fc-signin-label { display: none; }
        }
      `}</style>
      <header style={{
        padding: "22px 20px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "nowrap",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0, overflow: "hidden" }}>
          <span style={{
            fontFamily: "Fraunces, serif", fontWeight: 700, fontStyle: "italic",
            fontSize: 26, color: "var(--accent)", letterSpacing: 0.2, flexShrink: 0,
          }}>Catalog</span>
          <span className="fc-subtitle" style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--on-shell-muted)",
            letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap",
          }}>Flashcard drawer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <SyncControl googleUser={googleUser} syncState={syncState} onSignIn={onSignIn} onSignOut={onSignOut} />
          <IconBtn title="Settings" onClick={onOpenSettings}><Settings size={18} color="var(--on-shell-muted)" /></IconBtn>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: "16px 16px 40px" }}>
        {children}
      </main>
    </div>
  );
}

function SyncControl({ googleUser, syncState, onSignIn, onSignOut }) {
  if (!googleUser) {
    const signingIn = syncState === "syncing";
    return (
      <button onClick={onSignIn} disabled={signingIn} style={{
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 20, padding: "8px 14px", minHeight: 40, color: "#EDE6D3",
        fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 6, WebkitTapHighlightColor: "transparent",
        opacity: signingIn ? 0.6 : 1,
      }}>
        <LogIn size={14} /> <span className="fc-signin-label">{signingIn ? "Signing in…" : "Sign in with Google"}</span>
      </button>
    );
  }
  const label = syncState === "syncing" ? "Syncing…" : syncState === "error" ? "Sync failed" : "Synced";
  const Icon = syncState === "error" ? CloudOff : Cloud;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span title={googleUser.email} style={{
        display: "flex", alignItems: "center", gap: 5,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
        color: syncState === "error" ? "var(--danger)" : "var(--on-shell-muted)",
      }}>
        <Icon size={14} /> <span className="fc-signin-label">{label}</span>
      </span>
      <button onClick={onSignOut} title={`Sign out of ${googleUser.email}`} style={{
        background: "transparent", border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 20, padding: "8px 12px", minHeight: 40, color: "var(--on-shell-muted)",
        fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 5, WebkitTapHighlightColor: "transparent",
      }}>
        <LogOut size={14} />
      </button>
    </div>
  );
}



function IconBtn({ onClick, title, children, danger }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: "transparent", border: "none", padding: 10, borderRadius: 8,
      color: danger ? "var(--danger)" : "var(--on-shell-muted)", display: "flex", alignItems: "center",
      justifyContent: "center", minWidth: 44, minHeight: 44,
      transition: "background 0.15s", WebkitTapHighlightColor: "transparent",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >{children}</button>
  );
}



// ---------- LIBRARY ----------
function Library({ subjects, setSubjects, cards, setCards, game, nudgeCount, onOpenSheet, onQuickStudy, goStudy, startReview, googleUser, onOpenSettings }) {
  const [path, setPath] = useState([]); // node ids from root subject down
  const [searchQuery, setSearchQuery] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [cardForm, setCardForm] = useState(null); // {nodeId, editingId?}
  const [importOpen, setImportOpen] = useState(null); // null | { mode: "paste"|"file"|"photo" }
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // Hardware back button pops one folder level at a time, same as tapping
  // the parent breadcrumb. Only registered while actually inside a folder —
  // at the root there's nothing here to intercept, so it falls through.
  useEffect(() => {
    if (path.length > 0) return pushBackHandler(() => setPath(path.slice(0, -1)));
  }, [path]);

  const trail = getTrail(subjects, path);
  const currentNode = trail[trail.length - 1] || null;
  const rootSubjectId = path[0];
  const rootColorIdx = Math.max(0, subjects.findIndex(s => s.id === rootSubjectId));
  const rootColor = SUBJECT_COLORS[rootColorIdx % SUBJECT_COLORS.length];

  const addSubject = () => {
    if (!newSubjectName.trim()) return;
    setSubjects([...subjects, { id: uid(), name: newSubjectName.trim(), children: [] }]);
    setNewSubjectName(""); setAddingSubject(false);
  };
  const addSubcategory = () => {
    if (!newSubcategoryName.trim() || !currentNode) return;
    setSubjects(mapTree(subjects, currentNode.id, n => ({
      ...n, children: [...(n.children || []), { id: uid(), name: newSubcategoryName.trim(), children: [] }],
    })));
    setNewSubcategoryName(""); setAddingSubcategory(false);
  };
  const deleteNode = (id) => {
    const node = findNodeById(subjects, id);
    const idsToRemove = node ? collectIds(node) : [id];
    setSubjects(filterTree(subjects, id));
    cards.forEach(c => {
      if (idsToRemove.includes(c.nodeId)) {
        imageStore.removeImage(c.frontImageId);
        imageStore.removeImage(c.backImageId);
      }
    });
    setCards(cards.filter(c => !idsToRemove.includes(c.nodeId)));
    const idx = path.indexOf(id);
    if (idx !== -1) setPath(path.slice(0, idx));
  };
  const deleteCard = (id) => {
    const card = cards.find(c => c.id === id);
    if (card) {
      imageStore.removeImage(card.frontImageId);
      imageStore.removeImage(card.backImageId);
    }
    setCards(cards.filter(c => c.id !== id));
  };

  // Accepts either raw `text` (parsed as "Front | Back" lines) or a pre-parsed
  // `cardPairs` array of {front, back} (from file/photo AI extraction).
  const importCards = ({ subjectName, categoryName, text, cardPairs }) => {
    const trimmedSubject = subjectName.trim();
    const trimmedCategory = categoryName.trim();
    if (!trimmedSubject || !trimmedCategory) return 0;

    let subject = subjects.find(s => s.name.toLowerCase() === trimmedSubject.toLowerCase());
    let nextSubjects = subjects;
    if (!subject) {
      subject = { id: uid(), name: trimmedSubject, children: [] };
      nextSubjects = [...subjects, subject];
    }

    let category = subject.children.find(c => c.name.toLowerCase() === trimmedCategory.toLowerCase());
    if (!category) {
      category = { id: uid(), name: trimmedCategory, children: [] };
      subject = { ...subject, children: [...subject.children, category] };
      nextSubjects = nextSubjects.map(s => s.id === subject.id ? subject : s);
    }

    const pairs = cardPairs || text.split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const sep = line.indexOf("|");
        if (sep === -1) return null;
        const front = line.slice(0, sep).trim();
        const back = line.slice(sep + 1).trim();
        if (!front || !back) return null;
        return { front, back };
      })
      .filter(Boolean);

    const newCards = pairs.map(p => ({
      id: uid(), subjectId: subject.id, nodeId: category.id,
      front: p.front, back: p.back, manualOptions: [],
    }));

    if (newCards.length === 0) return 0;
    setSubjects(nextSubjects);
    setCards([...cards, ...newCards]);
    return newCards.length;
  };

  // An Anki export carries its own deck tree, so it can't go through
  // importCards — that handles exactly one subject, and calling it in a loop
  // would read a stale `subjects` from the closure on every pass after the
  // first. Everything is therefore built up locally and committed once.
  const importAnkiDecks = (allDecks) => {
    // Drop anything already in the catalog before creating any folders, so a
    // re-import doesn't leave an empty subject behind either.
    const { decks, skipped } = ankiImport.dropDuplicateCards(allDecks, cards);
    let nextSubjects = subjects;
    const newCards = [];

    const findOrAdd = (name, category) => {
      const wanted = name.trim();
      let subject = nextSubjects.find(s => s.name.toLowerCase() === wanted.toLowerCase());
      if (!subject) {
        subject = { id: uid(), name: wanted, children: [] };
        nextSubjects = [...nextSubjects, subject];
      }
      // The app's model always puts cards in a subcategory; a flat Anki deck
      // has none, so its provenance becomes the name.
      const catName = (category || "Imported").trim();
      let node = subject.children.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (!node) {
        node = { id: uid(), name: catName, children: [] };
        const updated = { ...subject, children: [...subject.children, node] };
        nextSubjects = nextSubjects.map(s => (s.id === subject.id ? updated : s));
        subject = updated;
      }
      return { subjectId: subject.id, nodeId: node.id };
    };

    for (const deck of decks) {
      if (!deck.cards || !deck.cards.length) continue;
      const { subjectId, nodeId } = findOrAdd(deck.subject, deck.category);
      for (const c of deck.cards) {
        newCards.push({
          id: uid(), subjectId, nodeId,
          front: c.front, back: c.back, manualOptions: [],
        });
      }
    }

    if (!newCards.length) return { added: 0, skipped };
    setSubjects(nextSubjects);
    setCards([...cards, ...newCards]);
    return { added: newCards.length, skipped };
  };

  const totalCards = cards.length;

  // ---------- top level: list of subjects ----------
  if (path.length === 0) {
    const dueCards = cards.filter(c => isDue(c));
    const query = searchQuery.trim().toLowerCase();
    const searchResults = query
      ? cards.filter(c =>
          (c.front || "").toLowerCase().includes(query) ||
          (c.back || "").toLowerCase().includes(query)
        ).slice(0, 50)
      : [];
    const openSearchResult = (card) => {
      const p = findPathTo(subjects, card.nodeId);
      if (!p) return;
      setSearchQuery("");
      setPath(p);
      setCardForm({ nodeId: card.nodeId, editingId: card.id });
    };

    return (
      <div>
        <StatusBar
          game={game}
          nudgeCount={nudgeCount}
          onOpenStreak={() => onOpenSheet("streak")}
          onOpenFriends={() => onOpenSheet("friends")}
        />
        <RiskBanner game={game} onStudyNow={onQuickStudy} />

        {totalCards > 0 && (
          <TodayCard
            game={game}
            dueCount={dueCards.length}
            totalCards={totalCards}
            onStudyNow={onQuickStudy}
            onOpenGoal={() => onOpenSheet("goal")}
          />
        )}

        {totalCards > 0 && <QuestList game={game} />}

        {totalCards > 0 && (
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Search size={15} color="var(--on-shell-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <TextField
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search all cards…"
              style={{ paddingLeft: 36 }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} title="Clear search" style={{
                position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", padding: 10, minHeight: 40,
                display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent", cursor: "pointer",
              }}><X size={15} color="var(--on-shell-muted)" /></button>
            )}
          </div>
        )}

        {query ? (
          searchResults.length === 0 ? (
            <p style={{ color: "var(--on-shell-muted)", fontFamily: "Inter, sans-serif", fontSize: 13.5 }}>
              No cards match "{searchQuery.trim()}".
            </p>
          ) : (
            <div style={{ background: "var(--card-bg)", borderRadius: 10, padding: "4px 16px", boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }}>
              {searchResults.map(c => {
                const p = findPathTo(subjects, c.nodeId) || [];
                const folderNames = getTrail(subjects, p).map(n => n.name).join(" › ");
                return (
                  <button key={c.id} onClick={() => openSearchResult(c)} style={{
                    display: "block", width: "100%", textAlign: "left", background: "none", border: "none",
                    borderBottom: "1px solid var(--card-border)", padding: "12px 0", minHeight: 48,
                    WebkitTapHighlightColor: "transparent", cursor: "pointer",
                  }}>
                    <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)" }}>
                      {c.front || "(picture)"}
                    </span>
                    <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                      {c.back || "(picture)"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                      <MasteryPips card={c} showLabel />
                      {folderNames && (
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--on-shell-muted)" }}>
                          {folderNames}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : (
        <>
        {subjects.length === 0 && !addingSubject && (
          <EmptyState onAdd={() => setAddingSubject(true)} onImport={() => setImportOpen({ mode: "paste" })} />
        )}

        {subjects.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 10px" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--on-shell-muted)", letterSpacing: 0.8, textTransform: "uppercase" }}>
              Your subjects
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <SmallButton onClick={() => setImportOpen({ mode: "paste" })}><Upload size={14} /> Import</SmallButton>
              <SmallButton onClick={() => setAddingSubject(true)}><Plus size={14} /> New</SmallButton>
            </div>
          </div>
        )}

        {subjects.map((s, i) => {
          const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
          const ids = collectIds(s);
          const subjectCards = cards.filter(c => ids.includes(c.nodeId));
          return (
            <NodeRow key={s.id} name={s.name} cards={subjectCards} color={color.bg} tabColor={color.tab}
              onOpen={() => setPath([s.id])}
              onDelete={() => deleteNode(s.id)}
              deleteTitle="Delete subject"
              onStudy={subjectCards.length ? () => goStudy(s.id) : null}
            />
          );
        })}

        <div style={{ marginTop: 20 }}>
          {addingSubject && (
            <div style={{ display: "flex", gap: 8 }}>
              <TextField value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)}
                placeholder="Subject name (e.g. Biology)" autoFocus
                onKeyDown={e => { if (e.key === "Enter") addSubject(); if (e.key === "Escape") setAddingSubject(false); }} />
              <IconBtn title="Save" onClick={addSubject}><Check size={18} color="var(--success)" /></IconBtn>
              <IconBtn title="Cancel" onClick={() => setAddingSubject(false)}><X size={18} color="#B5533C" /></IconBtn>
            </div>
          )}
        </div>
        </>
        )}

        {importOpen && (
          <ImportModal
            subjects={subjects}
            initialMode={importOpen.mode}
            onClose={() => setImportOpen(null)}
            onImport={importCards} onImportAnki={importAnkiDecks}
            googleUser={googleUser}
            onOpenSettings={onOpenSettings}
          />
        )}
      </div>
    );
  }

  // ---------- inside a subject / subcategory ----------
  const currentChildren = currentNode.children || [];
  const nodeCards = cards.filter(c => c.nodeId === currentNode.id);
  // Everything filed under this folder, including its subcategories — what
  // Study here covers, as opposed to nodeCards (this folder's own cards).
  const folderCardIds = collectIds(currentNode);
  const folderCards = cards.filter(c => folderCardIds.includes(c.nodeId));
  const folderDue = folderCards.filter(c => isDue(c)).length;

  return (
    <div>
      <Breadcrumb trail={trail} onJump={(depth) => setPath(path.slice(0, depth))} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 18px" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontStyle: "italic", fontSize: 22, color: "var(--accent)", margin: 0 }}>
          {currentNode.name}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <div style={{ position: "relative" }}>
            <IconBtn title="Add" onClick={() => setAddMenuOpen(v => !v)}>
              <Plus size={16} color="#EDE6D3" />
            </IconBtn>
            {addMenuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 39 }} onClick={() => setAddMenuOpen(false)} />
                <div style={{
                  position: "absolute", top: "100%", right: 0, marginTop: 6, zIndex: 40,
                  background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)", padding: 6, minWidth: 190,
                  display: "flex", flexDirection: "column", gap: 2,
                }}>
                  <button onClick={() => { setAddingSubcategory(true); setAddMenuOpen(false); }} style={addMenuItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--input-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Layers size={15} /> Add subcategory
                  </button>
                  <button onClick={() => { setCardForm({ nodeId: currentNode.id }); setAddMenuOpen(false); }} style={addMenuItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--input-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Plus size={15} /> Add card
                  </button>
                  <div style={{ height: 1, background: "var(--card-border)", margin: "2px 0" }} />
                  <button onClick={() => { setImportOpen({ mode: "file" }); setAddMenuOpen(false); }} style={addMenuItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--input-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <FileUp size={15} /> Import file
                  </button>
                  <button onClick={() => { setImportOpen({ mode: "photo" }); setAddMenuOpen(false); }} style={addMenuItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--input-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Camera size={15} /> Import photo
                  </button>
                </div>
              </>
            )}
          </div>
          <IconBtn title="Delete this folder" danger onClick={() => deleteNode(currentNode.id)}>
            <Trash2 size={16} color="var(--danger)" />
          </IconBtn>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <p style={{ color: "var(--on-shell-muted)", fontFamily: "Inter, sans-serif", fontSize: 13, margin: 0 }}>
          {folderCards.length} card{folderCards.length !== 1 ? "s" : ""}
          {folderDue > 0 && ` · ${folderDue} due`}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <GhostButton onClick={() => setImportOpen({ mode: "paste" })}>
            <Upload size={16} /> Import
          </GhostButton>
          <PrimaryButton onClick={() => goStudy(currentNode.id)} disabled={folderCards.length === 0}>
            <BookOpen size={16} /> Study
          </PrimaryButton>
        </div>
      </div>

      {currentChildren.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {currentChildren.map(child => {
            const childIds = collectIds(child);
            const childCards = cards.filter(c => childIds.includes(c.nodeId));
            return (
              <NodeRow key={child.id} name={child.name} cards={childCards} color={rootColor.bg} tabColor={rootColor.tab}
                onOpen={() => setPath([...path, child.id])}
                onDelete={() => deleteNode(child.id)}
                deleteTitle="Delete subcategory"
                onStudy={childCards.length ? () => goStudy(child.id) : null}
                compact
              />
            );
          })}
        </div>
      )}

      {addingSubcategory && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <TextField value={newSubcategoryName} onChange={e => setNewSubcategoryName(e.target.value)} placeholder="Subcategory name" />
          <IconBtn title="Save" onClick={addSubcategory}><Check size={18} color="var(--success)" /></IconBtn>
          <IconBtn title="Cancel" onClick={() => setAddingSubcategory(false)}><X size={18} color="#B5533C" /></IconBtn>
        </div>
      )}

      <div style={{ margin: "4px 0 10px" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "var(--on-shell-muted)", letterSpacing: 0.5, textTransform: "uppercase" }}>
          Cards in this folder ({nodeCards.length})
        </span>
      </div>

      {nodeCards.length === 0 ? (
        <p style={{ color: "var(--on-shell-muted)", fontFamily: "Inter, sans-serif", fontSize: 13.5 }}>
          No cards here yet. Add one, or drop into a subcategory.
        </p>
      ) : (
        <div style={{ background: "var(--card-bg)", borderRadius: 10, padding: "4px 16px", boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }}>
          {nodeCards.map(c => (
            <CardRow key={c.id} card={c}
              onDelete={() => deleteCard(c.id)}
              onEdit={() => setCardForm({ nodeId: currentNode.id, editingId: c.id })}
            />
          ))}
        </div>
      )}

      {cardForm && (
        <CardFormModal
          trail={trail}
          form={cardForm}
          existingCard={cardForm.editingId ? cards.find(c => c.id === cardForm.editingId) : null}
          onClose={() => setCardForm(null)}
          onSave={(cardData) => {
            if (cardForm.editingId) {
              setCards(cards.map(c => c.id === cardForm.editingId ? { ...c, ...cardData } : c));
            } else {
              setCards([...cards, { id: uid(), subjectId: rootSubjectId, ...cardData }]);
            }
            setCardForm(null);
          }}
        />
      )}

      {importOpen && (
        <ImportModal
          subjects={subjects}
          initialMode={importOpen.mode}
          initialSubjectName={trail[0].name}
          initialCategoryName={currentNode.id !== trail[0].id ? currentNode.name : ""}
          onClose={() => setImportOpen(null)}
          onImport={importCards} onImportAnki={importAnkiDecks}
          googleUser={googleUser}
          onOpenSettings={onOpenSettings}
        />
      )}
    </div>
  );
}

// A folder row now carries its own strength ring and a mastery bar, so the
// library reads as "how solid is this deck" instead of just "how many cards".
// The Study button sits on the row itself — one tap from the list into a
// session, rather than opening the folder and hunting for a button.
function NodeRow({ name, cards, color, tabColor, onOpen, onDelete, deleteTitle, compact, onStudy }) {
  const list = cards || [];
  const count = list.length;
  const strength = G.deckStrength(list);
  const due = list.filter(c => isDue(c)).length;
  return (
    <div style={{ position: "relative", marginTop: compact ? 10 : 26 }}>
      <div
        onClick={onOpen}
        style={{
          background: "var(--card-bg)", borderRadius: compact ? 8 : "2px 10px 10px 10px",
          boxShadow: compact ? "0 2px 8px rgba(0,0,0,0.18)" : "0 4px 14px rgba(0,0,0,0.25)",
          padding: compact ? "12px 14px" : "16px 16px 14px 18px",
          cursor: "pointer", borderLeft: compact ? `3px solid ${color}` : "none",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0, flex: 1 }}>
            {count > 0 && (
              <Ring value={strength} size={compact ? 30 : 38} stroke={compact ? 3.5 : 4} color={color} track="var(--card-border)">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: compact ? 9 : 10.5, fontWeight: 600, color: "var(--text-secondary)" }}>
                  {Math.round(strength * 100)}
                </span>
              </Ring>
            )}
            <div style={{ minWidth: 0 }}>
              <span style={{
                display: "block",
                fontFamily: compact ? "'IBM Plex Mono', monospace" : "Fraunces, serif",
                fontWeight: 600,
                fontSize: compact ? 13.5 : 19,
                color: "var(--text-strong)",
                letterSpacing: compact ? 0.3 : 0,
                textTransform: compact ? "uppercase" : "none",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{name}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)" }}>
                {count} card{count !== 1 ? "s" : ""}{due > 0 ? ` · ${due} due` : ""}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {onStudy && (
              <button onClick={onStudy} title={`Study ${name}`} style={{
                background: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: 8,
                padding: "8px 12px", minHeight: 40, display: "flex", alignItems: "center", gap: 5,
                fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: "var(--text-strong)",
                cursor: "pointer", WebkitTapHighlightColor: "transparent",
              }}><BookOpen size={13} /> Study</button>
            )}
            <IconBtn title={deleteTitle} danger onClick={onDelete}><Trash2 size={14} color="#B5533C" /></IconBtn>
          </div>
        </div>
        {count > 0 && (
          <div style={{ marginTop: 10 }}>
            <MasteryBar cards={list} height={compact ? 5 : 6} />
          </div>
        )}
      </div>
      {!compact && <IndexCardTab color={tabColor} label="Tap to open" />}
    </div>
  );
}

function SmallButton({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 8, padding: "8px 12px", minHeight: 40, color: "#EDE6D3",
      fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
      WebkitTapHighlightColor: "transparent",
    }}>{children}</button>
  );
}

function Breadcrumb({ trail, onJump }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
      <button onClick={() => onJump(0)} style={crumbStyle}>
        <Layers size={13} /> All subjects
      </button>
      {trail.map((n, i) => (
        <span key={n.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ChevronRight size={12} color="#5A6E92" />
          <button onClick={() => onJump(i + 1)} style={{
            ...crumbStyle,
            color: i === trail.length - 1 ? "var(--accent)" : "var(--on-shell-muted)",
            fontWeight: i === trail.length - 1 ? 600 : 500,
          }}>{n.name}</button>
        </span>
      ))}
    </div>
  );
}
const crumbStyle = {
  background: "none", border: "none", fontFamily: "Inter, sans-serif", color: "var(--on-shell-muted)",
  fontSize: 13, padding: "8px 4px", minHeight: 36, display: "flex", alignItems: "center", gap: 4,
  WebkitTapHighlightColor: "transparent",
};

function EmptyState({ onAdd, onImport }) {
  return (
    <div style={{
      border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, padding: "32px 20px",
      textAlign: "center", marginTop: 12,
    }}>
      <p style={{ color: "#EDE6D3", fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 19, margin: "0 0 6px" }}>
        Let's get your first cards in.
      </p>
      <p style={{ color: "var(--on-shell-muted)", fontFamily: "Inter, sans-serif", fontSize: 13, margin: "0 0 18px", lineHeight: 1.5 }}>
        Snap a photo of a vocabulary list, drop in a PDF, or type a few by hand.
        Your streak starts the day you answer your first card.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 260, margin: "0 auto" }}>
        <PrimaryButton onClick={onImport}><Sparkles size={16} /> Import cards</PrimaryButton>
        <GhostButton onClick={onAdd}><Plus size={16} /> Start a subject by hand</GhostButton>
      </div>
    </div>
  );
}

// A card row now leads with its strength: pips, the state word, and when it's
// coming back. That's the information that tells a student what to do next —
// the answer mode never did.
function CardRow({ card, onEdit, onDelete }) {
  const frontThumb = card.frontImageId ? imageStore.getImage(card.frontImageId) : null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid var(--card-border-light)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {card.frontImageId && (
          frontThumb
            ? <img src={frontThumb} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--card-border-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ImageIcon size={14} color="var(--text-faint)" />
              </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-strong)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {card.frontImageId ? (frontThumb ? "Picture card" : "Picture (not on this device)") : card.front}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <MasteryPips card={card} showLabel />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--text-faint)" }}>
              {G.describeDue(card)}
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        <IconBtn title="Edit" onClick={onEdit}><Pencil size={13.5} color="var(--text-secondary)" /></IconBtn>
        <IconBtn title="Delete" danger onClick={onDelete}><Trash2 size={13.5} color="#B5533C" /></IconBtn>
      </div>
    </div>
  );
}

function CardFormModal({ trail, form, existingCard, onClose, onSave }) {
  const [frontType, setFrontType] = useState(existingCard?.frontImageId ? "image" : "text");
  const [backType, setBackType] = useState(existingCard?.backImageId ? "image" : "text");
  const [front, setFront] = useState(existingCard?.front || "");
  const [back, setBack] = useState(existingCard?.back || "");
  const [frontImageId, setFrontImageId] = useState(existingCard?.frontImageId || null);
  const [backImageId, setBackImageId] = useState(existingCard?.backImageId || null);
  const [manualOptions, setManualOptions] = useState(existingCard?.manualOptions?.join(", ") || "");
  const [imageError, setImageError] = useState("");

  useEffect(() => pushBackHandler(onClose), []);

  const pickImage = async (file, current, setId) => {
    try {
      const id = await imageStore.saveImage(file);
      if (current) imageStore.removeImage(current);
      setId(id);
      setImageError("");
    } catch (e) {
      setImageError(e.message || "Couldn't save that picture.");
    }
  };
  const removeImage = (current, setId) => {
    if (current) imageStore.removeImage(current);
    setId(null);
  };

  const frontValid = frontType === "image" ? !!frontImageId : !!front.trim();
  const backValid = backType === "image" ? !!backImageId : !!back.trim();

  const save = () => {
    if (!frontValid || !backValid) return;
    // Dropped back to text after starting from a picture (or vice versa) —
    // don't leave the old picture orphaned in device storage.
    if (frontType === "text" && existingCard?.frontImageId && existingCard.frontImageId !== frontImageId) {
      imageStore.removeImage(existingCard.frontImageId);
    }
    if (backType === "text" && existingCard?.backImageId && existingCard.backImageId !== backImageId) {
      imageStore.removeImage(existingCard.backImageId);
    }
    onSave({
      nodeId: form.nodeId,
      front: front.trim(),
      back: back.trim(),
      frontImageId: frontType === "image" ? frontImageId : null,
      backImageId: backType === "image" ? backImageId : null,
      manualOptions: backType === "text" && manualOptions.trim()
        ? manualOptions.split(",").map(s => s.trim()).filter(Boolean)
        : [],
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,16,30,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--card-bg)", borderRadius: 12, width: "100%", maxWidth: 440,
        padding: 22, animation: "popIn 0.15s ease-out", maxHeight: "88vh", overflowY: "auto",
      }} className="fc-scroll">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, color: "var(--text-strong)", margin: 0 }}>
            {existingCard ? "Edit card" : "New card"}
          </h3>
          <IconBtn onClick={onClose}><X size={18} color="var(--text-secondary)" /></IconBtn>
        </div>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {trail.map(n => n.name).join(" / ")}
        </p>

        <Label>Front (question / prompt)</Label>
        <TypeToggle value={frontType} onChange={setFrontType} />
        {frontType === "text" ? (
          <TextField value={front} onChange={e => setFront(e.target.value)} placeholder="e.g. What is the powerhouse of the cell?" area
            style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 12 }} />
        ) : (
          <ImagePicker imageId={frontImageId} label="the front"
            onPick={file => pickImage(file, frontImageId, setFrontImageId)}
            onRemove={() => removeImage(frontImageId, setFrontImageId)} />
        )}

        <Label>Back (answer)</Label>
        <TypeToggle value={backType} onChange={setBackType} />
        {backType === "text" ? (
          <TextField value={back} onChange={e => setBack(e.target.value)} placeholder="e.g. The mitochondria" area
            style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 12 }} />
        ) : (
          <ImagePicker imageId={backImageId} label="the back"
            onPick={file => pickImage(file, backImageId, setBackImageId)}
            onRemove={() => removeImage(backImageId, setBackImageId)} />
        )}

        {imageError && (
          <p style={{ fontSize: 12.5, color: "#B5533C", fontFamily: "Inter, sans-serif", margin: "-6px 0 12px", fontWeight: 600 }}>
            {imageError}
          </p>
        )}

        {backType === "image" && (
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "4px 0 12px" }}>
            A picture answer can only be flipped — the drills that check what you typed need a text answer to compare against.
          </p>
        )}

        {backType === "text" && (
          <>
            <Label>Extra wrong options (optional, comma-separated)</Label>
            <TextField value={manualOptions} onChange={e => setManualOptions(e.target.value)}
              placeholder="e.g. Ribosome, Golgi apparatus, Nucleus"
              style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 4 }} />
            <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "4px 0 12px" }}>
              Used as the wrong answers whenever a drill asks you to choose. Leave it blank and they're drawn from your other cards, or written for you by {"AI"}.
            </p>
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <PrimaryButton onClick={save} style={{ flex: 1 }} disabled={!frontValid || !backValid}>
            <Check size={16} /> Save card
          </PrimaryButton>
          <GhostButton onClick={onClose} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>Cancel</GhostButton>
        </div>
      </div>
    </div>
  );
}

function TypeToggle({ value, onChange }) {
  const options = [
    { id: "text", label: "Text", icon: Type },
    { id: "image", label: "Picture", icon: ImageIcon },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
      {options.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          padding: "7px 12px", minHeight: 36, borderRadius: 16, fontSize: 12.5, fontFamily: "Inter, sans-serif", fontWeight: 600,
          border: value === id ? "1px solid var(--brand)" : "1px solid var(--card-border)",
          background: value === id ? "var(--brand)" : "transparent",
          color: value === id ? "#FBF7EC" : "var(--text-secondary)",
          display: "flex", alignItems: "center", gap: 5, WebkitTapHighlightColor: "transparent",
        }}><Icon size={13} /> {label}</button>
      ))}
    </div>
  );
}

function ImagePicker({ imageId, onPick, onRemove, label }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const src = imageId ? imageStore.getImage(imageId) : null;

  const handleChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      await onPick(file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} />
      {src ? (
        <div>
          <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, display: "block" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <GhostButton onClick={() => inputRef.current?.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", fontSize: 13, padding: "9px 14px", minHeight: 38 }}>
              <ImageIcon size={14} /> {busy ? "Saving…" : "Replace"}
            </GhostButton>
            <GhostButton onClick={onRemove} style={{ color: "#B5533C", borderColor: "#B5533C", fontSize: 13, padding: "9px 14px", minHeight: 38 }}>
              <X size={14} /> Remove
            </GhostButton>
          </div>
        </div>
      ) : (
        <GhostButton onClick={() => inputRef.current?.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", width: "100%" }}>
          <ImageIcon size={16} /> {busy ? "Saving picture…" : `Choose picture for ${label}`}
        </GhostButton>
      )}
    </div>
  );
}


const IMPORT_MODES = [
  { id: "paste", label: "Paste text", icon: Upload },
  { id: "file", label: "Upload file", icon: FileUp },
  { id: "photo", label: "Photo", icon: Camera },
];

// Anthropic's API only accepts these formats. Filtering the picker to them
// heads off HEIC/HEIF photos (common on Android's high-efficiency photo
// storage) from ever being selectable, rather than failing after upload.
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const SUPPORTED_IMAGE_ACCEPT = SUPPORTED_IMAGE_TYPES.join(",");
// On Android the photo is read on-device first, and ML Kit decodes whatever
// the camera produced — including the HEIC that Anthropic rejects. Only the
// web build, which has to send the image itself, needs the narrower filter.
const PHOTO_ACCEPT = ocr.isAvailable() ? "image/*" : SUPPORTED_IMAGE_ACCEPT;
// Below this, whatever ML Kit returned is a few stray characters off a blurry
// or handwritten page rather than a readable page — worth spending Claude's
// vision on the actual image instead.
const MIN_OCR_CHARS = 40;

function ImportModal({ subjects, onClose, onImport, onImportAnki, googleUser, onOpenSettings, initialMode, initialSubjectName, initialCategoryName }) {
  const [importMode, setImportMode] = useState(initialMode || "paste");
  const [subjectName, setSubjectName] = useState(initialSubjectName || "");
  const [categoryName, setCategoryName] = useState(initialCategoryName || "");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [pendingCards, setPendingCards] = useState(null);
  // A parsed Anki package, and which of its decks the user wants.
  const [anki, setAnki] = useState(null);
  const [ankiChosen, setAnkiChosen] = useState(new Set());
  // The direct AnkiDroid route: whether it's usable here, and the deck list
  // once the user has asked for it.
  const [adStatus, setAdStatus] = useState(null);
  const [adDecks, setAdDecks] = useState(null);
  const [adChosen, setAdChosen] = useState(new Set());
  const [adBusy, setAdBusy] = useState("");

  useEffect(() => {
    let cancelled = false;
    ankiDroid.status().then(s => { if (!cancelled) setAdStatus(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => pushBackHandler(onClose), []);

  const matchedSubject = subjects.find(s => s.name.toLowerCase() === subjectName.trim().toLowerCase());
  // Given to Claude so it can reuse an existing subject/subcategory name
  // instead of always inventing a new one, and to auto-fill Subject/
  // Subcategory below when the user hasn't already typed (or been given) one.
  const existingSubjects = subjects.map(s => ({ name: s.name, subcategories: (s.children || []).map(c => c.name) }));
  // Whichever service the user picked in Settings, so the copy and error
  // messages here never name the wrong one.
  const aiLabel = aiImport.getProviderInfo(aiImport.getProvider()).label;
  // Photo mode needs Claude only where the device can't read the page itself,
  // so on Android it's never gated upfront — on-device recognition plus the
  // local vocabulary-list split gets you cards with no key at all. File mode
  // isn't gated either: plain "Front | Back" text files parse for free, so it
  // only finds out it needs a key if local parsing comes up empty (handled in
  // handleFile below). Being signed in isn't itself sufficient — it's only a
  // proxy for "might be the app owner, who gets a free server-side path" — so
  // a signed-in customer with no key of their own still gets caught by the
  // NO_KEY check inside the actual request and routed to the same prompt.
  const needsApiKeyUpfront = importMode === "photo" && !ocr.isAvailable() && !googleUser && !aiImport.hasApiKey();

  const switchMode = (id) => {
    setImportMode(id);
    setError(""); setResult(""); setPendingCards(null);
  };

  const doPasteImport = () => {
    const count = onImport({ subjectName, categoryName, text });
    if (count > 0) {
      setResult(`Imported ${count} card${count !== 1 ? "s" : ""}. Paste more or close this dialog.`);
      setText("");
    } else {
      setResult("No valid cards found. Use one line per card: Front | Back");
    }
  };

  const parseDelimitedPairs = (raw) => raw.split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const sep = line.indexOf("|");
      if (sep === -1) return null;
      const front = line.slice(0, sep).trim();
      const back = line.slice(sep + 1).trim();
      return front && back ? { front, back } : null;
    })
    .filter(Boolean);

  const handleFile = async (file) => {
    setError(""); setResult(""); setPendingCards(null); setAnki(null); setBusy(true);
    try {
      // An Anki package is a database, not text — it has its own deck tree and
      // its own review step, so it never touches the text/AI path below.
      if (ankiImport.isAnkiFile(file.name)) {
        const parsed = await ankiImport.parseApkg(file);
        if (!parsed.totals.cards) {
          throw new Error("No importable cards in that deck. Cards that are only images or audio can't come along.");
        }
        setAnki(parsed);
        setAnkiChosen(new Set(parsed.decks.map(d => d.name)));
        return;
      }
      const raw = await extractTextFromFile(file);
      const localPairs = isTextFile(file.name) ? parseDelimitedPairs(raw) : [];
      if (localPairs.length > 0) {
        setPendingCards(localPairs);
      } else if (!googleUser && !aiImport.hasApiKey()) {
        setError("NEEDS_KEY");
      } else {
        const { subject, subcategory, cards: aiPairs } = await aiImport.extractCardsFromText(raw, existingSubjects);
        if (aiPairs.length === 0) throw new Error(`${aiLabel} couldn't find any flashcard-worthy content in this file.`);
        setPendingCards(aiPairs);
        if (!subjectName.trim() && subject) setSubjectName(subject);
        if (!categoryName.trim() && subcategory) setCategoryName(subcategory);
      }
    } catch (e) {
      setError(e.message === "NO_KEY" ? "NEEDS_KEY" : (e.message || "Couldn't read that file."));
    } finally {
      setBusy(false);
    }
  };

  const applyPending = (pairs, subject, subcategory) => {
    setPendingCards(pairs);
    if (!subjectName.trim() && subject) setSubjectName(subject);
    if (!categoryName.trim() && subcategory) setCategoryName(subcategory);
  };

  // Last resort once the text is already off the photo: split it into cards
  // locally if it's a vocabulary list, otherwise hand the text to the paste
  // box so the reading isn't wasted just because Claude was unreachable.
  const keepTextLocally = (ocrText, reason) => {
    const guessed = ocr.guessCardPairs(ocrText);
    if (guessed.length > 0) {
      setPendingCards(guessed);
      setResult(`Read on your device — ${reason} Check these before importing.`);
    } else {
      setImportMode("paste");
      setText(ocrText);
      setResult(`Read on your device — ${reason} Put each card on its own line as Front | Back, then import.`);
    }
  };

  const handlePhoto = async (file) => {
    setError(""); setResult(""); setPendingCards(null); setBusy(true);
    try {
      // Android reads the page itself first. Sending Claude that text instead
      // of the photo is quicker and cheaper, and means an unsupported image
      // format never reaches the API at all.
      let ocrText = "";
      if (ocr.isAvailable()) {
        setOcrRunning(true);
        try {
          ocrText = await ocr.recognizeText(file);
        } catch {
          ocrText = ""; // Scan failed — the photo path below still works.
        } finally {
          setOcrRunning(false);
        }
      }

      if (ocrText.trim().length >= MIN_OCR_CHARS) {
        if (googleUser || aiImport.hasApiKey()) {
          try {
            const { subject, subcategory, cards: pairs } =
              await aiImport.extractCardsFromText(ocrText, existingSubjects);
            if (pairs.length > 0) {
              applyPending(pairs, subject, subcategory);
              return;
            }
            keepTextLocally(ocrText, `${aiLabel} didn't find clear cards in it.`);
          } catch (e) {
            if (e.message === "NO_KEY") keepTextLocally(ocrText, "no API key set, so nothing was sent.");
            else keepTextLocally(ocrText, `${aiLabel} couldn't be reached.`);
          }
        } else {
          keepTextLocally(ocrText, "no API key set, so nothing was sent.");
        }
        return;
      }

      // No on-device reader (web), or it couldn't make out the page — send the
      // image to Claude, which handles handwriting and diagrams far better.
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("That photo's format isn't supported — please use a JPEG, PNG, GIF, or WEBP image.");
      }
      const base64 = await fileToBase64(file);
      const { subject, subcategory, cards: pairs } = await aiImport.extractCardsFromImage(base64, file.type, existingSubjects);
      if (pairs.length === 0) throw new Error(`${aiLabel} couldn't find any flashcard-worthy content in that photo.`);
      applyPending(pairs, subject, subcategory);
    } catch (e) {
      setError(e.message === "NO_KEY" ? "NEEDS_KEY" : (e.message || "Couldn't analyze that photo."));
    } finally {
      setBusy(false);
    }
  };

  const removePendingCard = (idx) => setPendingCards(pendingCards.filter((_, i) => i !== idx));

  const confirmPendingImport = () => {
    const count = onImport({ subjectName, categoryName, cardPairs: pendingCards });
    setResult(`Imported ${count} card${count !== 1 ? "s" : ""}.`);
    setPendingCards(null);
  };

  // Ask for the permission only when the user actually reaches for their decks;
  // a prompt on opening the import sheet would be asking for something they
  // may never use.
  const openAnkiDroid = async () => {
    setError(""); setResult(""); setAdBusy("Opening AnkiDroid…");
    try {
      if (!adStatus?.granted) {
        const granted = await ankiDroid.requestPermission();
        setAdStatus({ installed: true, granted });
        if (!granted) {
          setError("Without permission to read AnkiDroid, importing has to go through an exported .apkg file instead.");
          return;
        }
      }
      const decks = await ankiDroid.listDecks();
      if (!decks.length) {
        setError("AnkiDroid has no decks to import yet.");
        return;
      }
      setAdDecks(decks);
      setAdChosen(new Set(decks));
    } catch (e) {
      setError(e.message || "Couldn't reach AnkiDroid.");
    } finally {
      setAdBusy("");
    }
  };

  const toggleAdDeck = (name) => setAdChosen(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  // Reading the notes is the slow part, so it happens only for the decks that
  // were actually ticked, and lands in the same review step the file import
  // uses — from here on the two routes are indistinguishable.
  const loadAnkiDroidDecks = async () => {
    setError(""); setAdBusy("Reading decks…");
    try {
      const chosen = adDecks.filter(d => adChosen.has(d));
      const parsed = await ankiDroid.importDecks(chosen, (done, total) => {
        setAdBusy(`Reading deck ${done} of ${total}…`);
      });
      if (!parsed.totals.cards) {
        setError("Nothing importable in those decks. Cards that are only images or audio can't come along.");
        return;
      }
      setAnki(parsed);
      setAnkiChosen(new Set(parsed.decks.map(d => d.name)));
      setAdDecks(null);
    } catch (e) {
      setError(e.message || "Couldn't read those decks.");
    } finally {
      setAdBusy("");
    }
  };

  const toggleDeck = (name) => setAnkiChosen(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const ankiSelection = anki ? anki.decks.filter(d => ankiChosen.has(d.name)) : [];
  const ankiSelectedCards = ankiSelection.reduce((n, d) => n + d.cards.length, 0);

  const confirmAnkiImport = () => {
    const { added, skipped } = onImportAnki(ankiSelection);
    const subjects = new Set(ankiSelection.map(d => d.subject)).size;
    // Say so when nothing came in, rather than reporting a cheerful "0 cards".
    // Re-importing a deck you already have is a normal thing to do by accident.
    const dupes = skipped ? ` ${skipped} duplicate${skipped !== 1 ? "s" : ""} skipped.` : "";
    setResult(
      added === 0 && skipped
        ? `Nothing new — you already have all ${skipped} of those cards.`
        : `Imported ${added} card${added !== 1 ? "s" : ""} into ${subjects} subject${subjects !== 1 ? "s" : ""}.${dupes}`
    );
    setAnki(null);
    setAnkiChosen(new Set());
  };

  const photoBusyLabel = ocrRunning ? "Reading photo…" : "Analyzing…";
  // Only meaningful right after an import that actually went through the
  // shared allowance — a user on their own key never sees a count.
  const freeLeft = pendingCards ? aiImport.getQuotaState().remaining : null;
  const canPasteImport = subjectName.trim() && categoryName.trim() && text.trim();
  const canUpload = subjectName.trim() && categoryName.trim() && !busy;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,16,30,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--card-bg)", borderRadius: 12, width: "100%", maxWidth: 440,
        padding: 22, animation: "popIn 0.15s ease-out", maxHeight: "88vh", overflowY: "auto",
      }} className="fc-scroll">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, color: "var(--text-strong)", margin: 0 }}>
            Import cards
          </h3>
          <IconBtn onClick={onClose}><X size={18} color="var(--text-secondary)" /></IconBtn>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {IMPORT_MODES.map(m => (
            <button key={m.id} onClick={() => switchMode(m.id)} style={{
              flex: 1, padding: "10px 8px", minHeight: 44, borderRadius: 10, fontSize: 12.5,
              fontFamily: "Inter, sans-serif", fontWeight: 600,
              border: importMode === m.id ? "1px solid var(--brand)" : "1px solid var(--card-border)",
              background: importMode === m.id ? "var(--brand)" : "transparent",
              color: importMode === m.id ? "#FBF7EC" : "var(--text-secondary)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              WebkitTapHighlightColor: "transparent",
            }}><m.icon size={16} />{m.label}</button>
          ))}
        </div>

        {/* An Anki package names its own subjects and subcategories, so asking
            for one here would be asking the user to overrule their own decks. */}
        {!anki && (
          <>
            <Label>Subject</Label>
            <TextField value={subjectName} onChange={e => setSubjectName(e.target.value)}
              placeholder="e.g. Biology (existing or new)" list="import-subjects"
              style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 12 }} />
            <datalist id="import-subjects">
              {subjects.map(s => <option key={s.id} value={s.name} />)}
            </datalist>

            <Label>Subcategory</Label>
            <TextField value={categoryName} onChange={e => setCategoryName(e.target.value)}
              placeholder="e.g. Cell structure (existing or new)" list="import-categories"
              style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 12 }} />
            <datalist id="import-categories">
              {(matchedSubject?.children || []).map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </>
        )}

        {importMode === "paste" && (
          <>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 10px" }}>
              Paste flashcards generated elsewhere. One card per line, front and back separated by a <strong>|</strong>.
            </p>
            <Label>Cards</Label>
            <TextField value={text} onChange={e => setText(e.target.value)} area
              placeholder={"What is the powerhouse of the cell? | The mitochondria\nWhat pigment makes plants green? | Chlorophyll"}
              style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 4, minHeight: 160 }} />
          </>
        )}

        {importMode === "file" && !pendingCards && !anki && !adDecks && (
          <>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={13} color="var(--highlight)" /> AnkiDroid decks (.apkg) and .txt/.csv/.md files with "Front | Back" lines import instantly, no key needed. PDFs, Word docs, and anything else get read by {aiLabel}.
            </p>
            {/* The trailing catch-all is load-bearing on Android: the WebView maps
                these extensions to MIME types through
                MimeTypeMap, and .apkg/.colpkg aren't registered there — without a
                catch-all the system picker greys out the very file the user came
                to choose. A picker showing too much beats one that can't show it. */}
            <input ref={fileInputRef} type="file" accept=".apkg,.colpkg,.txt,.csv,.tsv,.md,.pdf,.docx,*/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = ""; }} />
            <GhostButton onClick={() => fileInputRef.current?.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", width: "100%" }} >
              <FileUp size={16} /> {busy ? "Reading file…" : "Choose file"}
            </GhostButton>

            {adStatus?.installed && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--text-faint)", letterSpacing: 0.5 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 10px", lineHeight: 1.45 }}>
                  AnkiDroid is on this phone — take the decks straight from it, no
                  export needed.
                </p>
                <PrimaryButton onClick={openAnkiDroid} disabled={!!adBusy} style={{ width: "100%" }}>
                  <Sparkles size={16} /> {adBusy || "Import from AnkiDroid"}
                </PrimaryButton>
              </>
            )}
          </>
        )}

        {adDecks && (
          <>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
              textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px",
            }}>Your AnkiDroid decks</p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 12px", lineHeight: 1.45 }}>
              Pick what to bring over. Only the ticked decks are read.
            </p>
            <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 12 }} className="fc-scroll">
              {adDecks.map(name => {
                const on = adChosen.has(name);
                const { subject, category } = ankiImport.splitDeckName(name);
                return (
                  <button key={name} onClick={() => toggleAdDeck(name)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                    background: on ? "rgba(242,197,114,0.12)" : "transparent",
                    border: `1px solid ${on ? "rgba(242,197,114,0.4)" : "var(--card-border)"}`,
                    borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer", minHeight: 52,
                  }}>
                    <span style={{
                      width: 20, height: 20, flexShrink: 0, borderRadius: 5,
                      border: `1.5px solid ${on ? "#C98A2B" : "var(--card-border)"}`,
                      background: on ? "#F2C572" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{on && <Check size={13} color="#16233F" />}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: "block", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
                        color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{subject}</span>
                      {category && (
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "var(--text-faint)" }}>{category}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {anki && (
          <>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
              textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px",
            }}>Decks found</p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 12px", lineHeight: 1.45 }}>
              Each deck becomes a subject, and a nested deck becomes a subcategory
              inside it. Untick anything you don't want.
            </p>
            <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12 }} className="fc-scroll">
              {anki.decks.map(deck => {
                const on = ankiChosen.has(deck.name);
                return (
                  <button key={deck.name} onClick={() => toggleDeck(deck.name)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                    background: on ? "rgba(242,197,114,0.12)" : "transparent",
                    border: `1px solid ${on ? "rgba(242,197,114,0.4)" : "var(--card-border)"}`,
                    borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer", minHeight: 52,
                  }}>
                    <span style={{
                      width: 20, height: 20, flexShrink: 0, borderRadius: 5,
                      border: `1.5px solid ${on ? "var(--highlight)" : "var(--card-border)"}`,
                      background: on ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{on && <Check size={13} color="var(--shell-bg)" />}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: "block", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
                        color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{deck.subject}</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "var(--text-faint)" }}>
                        {deck.category ? `${deck.category} · ` : ""}{deck.cards.length} card{deck.cards.length !== 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {anki.warnings.map((w, i) => (
              <p key={i} style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "0 0 6px", lineHeight: 1.45 }}>
                {w}
              </p>
            ))}
          </>
        )}

        {importMode === "photo" && !pendingCards && (
          <>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={13} color="var(--highlight)" /> {ocr.isAvailable()
                ? `Take or choose a photo of a book page or your notes. Your phone reads the text itself, then ${aiLabel} turns it into cards — offline you still get the text, and plain word lists become cards on their own.`
                : `Take or choose a photo of a book page or your notes — ${aiLabel} reads it and builds the cards.`}
            </p>
            {needsApiKeyUpfront ? (
              <ApiKeyPrompt onOpenSettings={onOpenSettings} googleUser={googleUser} />
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={photoInputRef} type="file" accept={PHOTO_ACCEPT} capture="environment" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files[0]; if (f) handlePhoto(f); e.target.value = ""; }} />
                <GhostButton onClick={() => photoInputRef.current?.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", flex: 1 }}>
                  <Camera size={16} /> {busy ? photoBusyLabel : "Take photo"}
                </GhostButton>
                <input ref={galleryInputRef} type="file" accept={PHOTO_ACCEPT} style={{ display: "none" }}
                  onChange={e => { const f = e.target.files[0]; if (f) handlePhoto(f); e.target.value = ""; }} />
                <GhostButton onClick={() => galleryInputRef.current?.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", flex: 1 }}>
                  <ImageIcon size={16} /> {busy ? photoBusyLabel : "From gallery"}
                </GhostButton>
              </div>
            )}
          </>
        )}

        {pendingCards && (
          <>
            <Label>
              Review ({pendingCards.length} card{pendingCards.length !== 1 ? "s" : ""})
              {freeLeft != null && ` · ${freeLeft} free import${freeLeft !== 1 ? "s" : ""} left today`}
            </Label>
            <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 10 }} className="fc-scroll">
              {pendingCards.map((c, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 10px", background: "var(--input-bg)", borderRadius: 8, marginBottom: 6, gap: 8,
                }}>
                  <div style={{ minWidth: 0, fontSize: 12.5, fontFamily: "Inter, sans-serif", color: "var(--text-strong)" }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.front}</div>
                    <div style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.back}</div>
                  </div>
                  <IconBtn title="Remove" onClick={() => removePendingCard(i)}><X size={14} color="#B5533C" /></IconBtn>
                </div>
              ))}
              {pendingCards.length === 0 && (
                <p style={{ fontSize: 12.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif" }}>All cards removed.</p>
              )}
            </div>
          </>
        )}

        {error === "NEEDS_KEY" && <ApiKeyPrompt onOpenSettings={onOpenSettings} googleUser={googleUser} />}
        {error && error !== "NEEDS_KEY" && (
          <p style={{ fontSize: 12.5, color: "#B5533C", fontFamily: "Inter, sans-serif", margin: "8px 0 4px", fontWeight: 600 }}>
            {error}
          </p>
        )}
        {result && (
          <p style={{ fontSize: 12.5, color: "var(--success)", fontFamily: "Inter, sans-serif", margin: "8px 0 4px", fontWeight: 600 }}>
            {result}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {importMode === "paste" && (
            <PrimaryButton onClick={doPasteImport} style={{ flex: 1 }} disabled={!canPasteImport}>
              <Upload size={16} /> Import cards
            </PrimaryButton>
          )}
          {(importMode === "file" || importMode === "photo") && pendingCards && (
            <PrimaryButton onClick={confirmPendingImport} style={{ flex: 1 }} disabled={!canUpload || pendingCards.length === 0}>
              <Check size={16} /> Import {pendingCards.length} card{pendingCards.length !== 1 ? "s" : ""}
            </PrimaryButton>
          )}
          {anki && (
            <PrimaryButton onClick={confirmAnkiImport} style={{ flex: 1 }} disabled={ankiSelectedCards === 0}>
              <Check size={16} /> Import {ankiSelectedCards} card{ankiSelectedCards !== 1 ? "s" : ""}
            </PrimaryButton>
          )}
          {adDecks && (
            <PrimaryButton onClick={loadAnkiDroidDecks} style={{ flex: 1 }} disabled={adChosen.size === 0 || !!adBusy}>
              <Check size={16} /> {adBusy || `Read ${adChosen.size} deck${adChosen.size !== 1 ? "s" : ""}`}
            </PrimaryButton>
          )}
          <GhostButton onClick={onClose} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>Done</GhostButton>
        </div>
      </div>
    </div>
  );
}

function ApiKeyPrompt({ onOpenSettings, googleUser }) {
  const info = aiImport.getProviderInfo(aiImport.getProvider());
  const quota = aiImport.getQuotaState();
  // Being told to fetch an API key out of nowhere reads like a paywall. If the
  // reason is a spent daily allowance, say so — it's a very different message.
  const message = quota.exhausted
    ? (quota.shared
        ? "Today's free imports have all been used up across everyone using the app. Add your own free Gemini key to keep going — it's unlimited and takes a minute."
        : `You've used all ${quota.dailyLimit || 10} of today's free imports. They reset tomorrow, or you can add your own free Gemini key for unlimited use.`)
    : !googleUser
      ? "Sign in with Google for free imports every day — or add your own free Gemini key instead."
      : info.id === "gemini"
        ? "This needs a Google Gemini API key — they're free and take a minute to set up."
        : "This needs an Anthropic API key so Claude can read it.";
  return (
    <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: 16, textAlign: "center" }}>
      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", margin: "0 0 10px" }}>
        {message}
      </p>
      <GhostButton onClick={onOpenSettings} style={{ color: "var(--brand)", borderColor: "var(--brand)", margin: "0 auto" }}>
        <Key size={15} /> Add API key in Settings
      </GhostButton>
    </div>
  );
}

// ---------- SETTINGS ----------
function Switch({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} role="switch" aria-checked={checked} style={{
      width: 46, height: 26, borderRadius: 13, border: "none", padding: 3,
      background: checked ? "var(--brand)" : "var(--card-border)",
      display: "flex", alignItems: "center", justifyContent: checked ? "flex-end" : "flex-start",
      transition: "background 0.15s", WebkitTapHighlightColor: "transparent", cursor: "pointer", flexShrink: 0,
    }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FBF7EC", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function SettingsModal({ onClose, darkMode, onToggleDarkMode, game, onSetReminder, onSetListed, onExport, onImport, diagInfo }) {
  const [apiKeyEditorOpen, setApiKeyEditorOpen] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderNote, setReminderNote] = useState("");
  const [backupNote, setBackupNote] = useState("");
  const [diagNote, setDiagNote] = useState("");
  const [confirmImport, setConfirmImport] = useState(null); // File awaiting confirmation
  const importInputRef = useRef(null);
  const [provider, setProviderState] = useState(aiImport.getProvider());
  const [hasKey, setHasKey] = useState(aiImport.hasApiKey());
  const info = aiImport.getProviderInfo(provider);

  useEffect(() => pushBackHandler(onClose), []);

  const pickImportFile = (file) => {
    if (!file) return;
    setConfirmImport(file);
  };

  const runImport = async () => {
    const file = confirmImport;
    setConfirmImport(null);
    setBackupNote("Importing…");
    const err = await onImport(file);
    setBackupNote(err || "Backup imported.");
  };

  const chooseProvider = (id) => {
    aiImport.setProvider(id);
    setProviderState(id);
    setHasKey(aiImport.hasApiKey(id));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,16,30,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 60,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--card-bg)", borderRadius: 12, width: "100%", maxWidth: 440,
        padding: 22, animation: "popIn 0.15s ease-out", maxHeight: "88vh", overflowY: "auto",
      }} className="fc-scroll">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, color: "var(--text-strong)", margin: 0 }}>
            Settings
          </h3>
          <IconBtn onClick={onClose}><X size={18} color="var(--text-secondary)" /></IconBtn>
        </div>

        <p style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
          textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px",
        }}>Appearance</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 14, color: "var(--text-strong)", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
            Dark mode
          </span>
          <Switch checked={darkMode} onChange={onToggleDarkMode} />
        </div>
        <div style={{ height: 1, background: "var(--card-border)", margin: "0 0 18px" }} />

        <p style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
          textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px",
        }}>Studying</p>
        {reminders.isSupported() ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: "var(--text-strong)", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                Daily reminder
              </span>
              <Switch
                checked={!!game.reminder.enabled}
                onChange={async () => {
                  setReminderBusy(true);
                  const note = await onSetReminder({ ...game.reminder, enabled: !game.reminder.enabled });
                  setReminderNote(note || "");
                  setReminderBusy(false);
                }}
              />
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 10px", lineHeight: 1.45 }}>
              {reminderNote || "Starts gently at midday and gets more insistent as the evening closes in — and stops for the day the moment you hit your goal."}
            </p>
            {game.reminder.enabled && (
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--text-faint)",
                margin: "0 0 18px", letterSpacing: 0.5,
              }}>
                {reminders.ladderSummary()}
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 14px", lineHeight: 1.45 }}>
            Daily reminders need the installed Android app — the web version can't
            schedule notifications.
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 14, color: "var(--text-strong)", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
            Show me on the global board
          </span>
          <Switch checked={game.listed !== false} onChange={() => onSetListed(game.listed === false)} />
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 20px", lineHeight: 1.45 }}>
          Off hides you from everyone except the friends you've added. Either way
          people only ever see your username, streak, level and weekly XP.
        </p>
        <div style={{ height: 1, background: "var(--card-border)", margin: "0 0 18px" }} />

        <p style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
          textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px",
        }}>Backup</p>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 10px", lineHeight: 1.45 }}>
          One JSON file with every subject, card and stat. Keep one somewhere safe — it's the fallback if sync ever goes wrong.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <GhostButton onClick={async () => setBackupNote((await onExport()) || "Backup saved.")} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", flex: 1 }}>
            <Download size={16} /> Export
          </GhostButton>
          <GhostButton onClick={() => importInputRef.current && importInputRef.current.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", flex: 1 }}>
            <Upload size={16} /> Import
          </GhostButton>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => { pickImportFile(e.target.files && e.target.files[0]); e.target.value = ""; }}
          />
        </div>
        {backupNote && (
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "0 0 18px" }}>
            {backupNote}
          </p>
        )}
        {!backupNote && <div style={{ marginBottom: 18 }} />}

        <p style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
          textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px",
        }}>AI-powered import</p>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 12px" }}>
          Signed in, you get 10 AI imports a day with no key at all. Pasting your own "Front | Back" text is always free{ocr.isAvailable() ? ", and photos are read on this device without a key" : ""}. A key of your own lifts the daily limit — pick which service it's for:
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {aiImport.PROVIDERS.map(p => {
            const active = p.id === provider;
            return (
              <button key={p.id} onClick={() => chooseProvider(p.id)} style={{
                flex: 1, padding: "11px 10px", minHeight: 52, borderRadius: 10, textAlign: "left",
                border: `1px solid ${active ? "var(--brand)" : "var(--card-border)"}`,
                background: active ? "var(--brand)" : "transparent",
                color: active ? "#FBF7EC" : "var(--text-secondary)",
                fontFamily: "Inter, sans-serif", WebkitTapHighlightColor: "transparent", cursor: "pointer",
              }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{p.label}</span>
                <span style={{ display: "block", fontSize: 11, opacity: 0.85, marginTop: 2 }}>{p.note}</span>
              </button>
            );
          })}
        </div>

        {provider === aiImport.FREE_TIER_TRAINS_ON_DATA && (
          <p style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 14px", lineHeight: 1.5 }}>
            Google's free tier costs nothing and needs no credit card, but they may use what you send — the text and photos you import — to improve their models. Switch to Claude if you'd rather pay than share.
          </p>
        )}

        <Label><Key size={11} style={{ verticalAlign: -1, marginRight: 4 }} />{info.label} API key</Label>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: 8,
          padding: "12px 14px", marginBottom: 4,
        }}>
          <span style={{ fontSize: 14, color: hasKey ? "var(--text-strong)" : "var(--text-faint)", fontFamily: "'IBM Plex Mono', monospace" }}>
            {hasKey ? "••••••••••••••••" : "Not set"}
          </span>
          <GhostButton onClick={() => setApiKeyEditorOpen(true)} style={{
            color: "var(--text-secondary)", borderColor: "var(--card-border)",
            padding: "8px 14px", minHeight: 36, fontSize: 13,
          }}>
            {hasKey ? "View / change" : "Add key"}
          </GhostButton>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "4px 0 18px" }}>
          Stored only on this device — never synced to your account. Opens in its own window so you can check it without risking an accidental edit here.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
          <GhostButton onClick={() => openExternal(info.keyUrl)} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
            <ExternalLink size={16} /> {provider === "gemini" ? "Get a free Gemini key" : "Get a Claude key"}
          </GhostButton>
          {provider === "anthropic" && (
            <GhostButton onClick={() => openExternal("https://console.anthropic.com/settings/billing")} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
              <CreditCard size={16} /> Add credits / billing
            </GhostButton>
          )}
        </div>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "10px 0 0" }}>
          {provider === "gemini"
            ? `Opens ${info.keyUrlLabel} in your browser. Sign in with Google, tap "Create API key", then paste it above — no card, no charges.`
            : `Both open the ${info.keyUrlLabel} in your browser. Sign up, add a card, generate a key, then paste it above — usage is billed by Anthropic directly, a few cents per file or photo.`}
        </p>

        <div style={{ height: 1, background: "var(--card-border)", margin: "18px 0" }} />
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)",
          textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px",
        }}>Troubleshooting</p>
        <GhostButton
          onClick={async () => {
            const text = diagnosticsText(diagInfo || {});
            try {
              await navigator.clipboard.writeText(text);
              setBackupNote(""); // keep the two notes from colliding visually
              setDiagNote("Diagnostics copied — paste it into your bug report.");
            } catch (e) {
              setDiagNote(`Couldn't copy: ${e && e.message ? e.message : e}`);
            }
          }}
          style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}
        >
          <ClipboardList size={16} /> Copy diagnostics
        </GhostButton>
        {diagNote && (
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "8px 0 0" }}>
            {diagNote}
          </p>
        )}
      </div>

      {apiKeyEditorOpen && (
        <ApiKeyModal
          provider={provider}
          onClose={() => setApiKeyEditorOpen(false)}
          onSaved={() => setHasKey(aiImport.hasApiKey(provider))}
        />
      )}

      {confirmImport && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,16,30,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 70,
        }} onClick={() => setConfirmImport(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--card-bg)", borderRadius: 12, width: "100%", maxWidth: 400,
            padding: 22, animation: "popIn 0.15s ease-out",
          }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, color: "var(--text-strong)", margin: "0 0 10px" }}>
              Replace your catalog?
            </h3>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", lineHeight: 1.5, margin: "0 0 18px" }}>
              Importing <b>{confirmImport.name}</b> replaces everything currently in the app — subjects, cards and stats. If you're signed in, the imported catalog becomes the one that syncs.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <GhostButton onClick={() => setConfirmImport(null)} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
                Cancel
              </GhostButton>
              <GhostButton onClick={runImport} style={{ color: "#B5533C", borderColor: "#B5533C" }}>
                Import and replace
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApiKeyModal({ provider, onClose, onSaved }) {
  const info = aiImport.getProviderInfo(provider);
  const [value, setValue] = useState(aiImport.getApiKey(provider));
  const [visible, setVisible] = useState(false);

  useEffect(() => pushBackHandler(onClose), []);

  const save = () => {
    aiImport.setApiKey(provider, value);
    onSaved();
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,16,30,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 70,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--card-bg)", borderRadius: 12, width: "100%", maxWidth: 400,
        padding: 22, animation: "popIn 0.15s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, color: "var(--text-strong)", margin: 0 }}>
            {info.label} API key
          </h3>
          <IconBtn onClick={onClose}><X size={18} color="var(--text-secondary)" /></IconBtn>
        </div>

        <Label>Key</Label>
        <div style={{ position: "relative", marginBottom: 4 }}>
          <TextField value={value} onChange={e => setValue(e.target.value)}
            placeholder={provider === "gemini" ? "AIza..." : "sk-ant-..."} type={visible ? "text" : "password"}
            style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", paddingRight: 44 }} />
          <button onClick={() => setVisible(v => !v)} title={visible ? "Hide" : "Show"} style={{
            position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
            background: "transparent", border: "none", padding: 8, display: "flex",
            color: "var(--text-secondary)", cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}>
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "4px 0 18px" }}>
          Nothing here is saved until you tap Save — safe to look without changing anything.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <PrimaryButton onClick={save} style={{ flex: 1 }}>
            <Check size={16} /> Save
          </PrimaryButton>
          <GhostButton onClick={onClose} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>Cancel</GhostButton>
        </div>
      </div>
    </div>
  );
}

// ---------- STUDY SETUP ----------
// How many cards one sitting should be. A freshly imported deck is entirely
// due, so without a cap "Start session" hands over every card in it — 2,877 of
// them after an Anki import, which is not a session, it's a wall.
//
// Because a graded card leaves the due pool, taking a slice off the top of the
// shuffled pool works through the deck on its own: each sitting draws from
// what's left. No cursor to store, and the spaced-repetition schedule stays in
// charge of what comes back and when.
const SESSION_SIZES = [10, 20, 30, 50];
const SESSION_SIZE_KEY = "flashcard-session-size";

const readSessionSize = () => {
  try {
    const raw = window.localStorage.getItem(SESSION_SIZE_KEY);
    if (raw === "all") return "all";
    const n = parseInt(raw, 10);
    return SESSION_SIZES.includes(n) ? n : 30;
  } catch {
    return 30;
  }
};

function StudySetup({ subjects, cards, initialNodeId, onBack, onStart }) {
  const [nodeId, setNodeId] = useState(() =>
    initialNodeId && flattenTree(subjects).some(f => f.id === initialNodeId) ? initialNodeId : "all"
  );
  const [scope, setScope] = useState("due"); // due | all
  const [sessionSize, setSessionSize] = useState(readSessionSize);

  const chooseSize = (size) => {
    setSessionSize(size);
    try { window.localStorage.setItem(SESSION_SIZE_KEY, String(size)); } catch { /* not worth failing over */ }
  };
  const flat = flattenTree(subjects);
  const selected = flat.find(f => f.id === nodeId);
  const pool = nodeId === "all" ? cards : cards.filter(c => selected && selected.ids.includes(c.nodeId));
  const duePool = pool.filter(c => isDue(c));
  const useDue = scope === "due" && duePool.length > 0;
  const startPool = useDue ? duePool : pool;
  const strength = G.deckStrength(pool);
  const sessionCount = sessionSize === "all" ? startPool.length : Math.min(sessionSize, startPool.length);
  // Only worth explaining when a slice is actually being taken.
  const isSlice = sessionCount < startPool.length;

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "var(--on-shell-muted)", display: "flex", alignItems: "center",
        gap: 6, fontFamily: "Inter, sans-serif", fontSize: 14, padding: "10px 4px", minHeight: 44, marginBottom: 14, WebkitTapHighlightColor: "transparent",
      }}><ArrowLeft size={15} /> Back to catalog</button>

      <h2 style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 600, fontSize: 24, color: "var(--accent)", margin: "0 0 18px" }}>
        Pick your deck
      </h2>

      <Label>Subject / subcategory</Label>
      <select value={nodeId} onChange={e => setNodeId(e.target.value)} style={selectStyle}>
        <option value="all">All subjects</option>
        {flat.map(f => (
          <option key={f.id} value={f.id}>{"—".repeat(f.depth)}{f.depth > 0 ? " " : ""}{f.name}</option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {[
          { id: "due", label: `Due now (${duePool.length})` },
          { id: "all", label: `All cards (${pool.length})` },
        ].map(opt => {
          const active = opt.id === "due" ? useDue : !useDue;
          return (
            <button key={opt.id} onClick={() => setScope(opt.id)}
              disabled={opt.id === "due" && duePool.length === 0}
              style={{
                flex: 1, padding: "12px 10px", minHeight: 46, borderRadius: 8,
                border: `1px solid ${active ? "var(--accent)" : "rgba(255,255,255,0.14)"}`,
                background: active ? "rgba(242,197,114,0.12)" : "transparent",
                color: active ? "var(--accent)" : opt.id === "due" && duePool.length === 0 ? "var(--on-shell-faint)" : "#EDE6D3",
                fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
                WebkitTapHighlightColor: "transparent",
              }}>{opt.label}</button>
          );
        })}
      </div>

      <div style={{
        marginTop: 14, padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)", fontFamily: "Inter, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Ring value={strength} size={44} stroke={5} color="var(--accent)" track="rgba(255,255,255,0.14)">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, color: "#EDE6D3" }}>
              {Math.round(strength * 100)}
            </span>
          </Ring>
          <div>
            <p style={{ color: "#EDE6D3", fontSize: 14, fontWeight: 600, margin: 0 }}>
              {Math.round(strength * 100)}% deck strength
            </p>
            <p style={{ color: "var(--on-shell-muted)", fontSize: 12.5, margin: "2px 0 0" }}>
              {duePool.length} due now · {pool.length} card{pool.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
        <MasteryBar cards={pool} height={8} showLegend />
      </div>

      <Label style={{ marginTop: 18 }}>How many this sitting?</Label>
      <div style={{ display: "flex", gap: 8 }}>
        {[...SESSION_SIZES, "all"].map(size => {
          const active = sessionSize === size;
          return (
            <button key={size} onClick={() => chooseSize(size)} style={{
              flex: 1, padding: "12px 4px", minHeight: 46, borderRadius: 8,
              border: `1px solid ${active ? "var(--accent)" : "rgba(255,255,255,0.14)"}`,
              background: active ? "rgba(242,197,114,0.12)" : "transparent",
              color: active ? "var(--accent)" : "#EDE6D3",
              fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
              WebkitTapHighlightColor: "transparent",
            }}>{size === "all" ? "All" : size}</button>
          );
        })}
      </div>
      {isSlice && (
        <p style={{
          fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--on-shell-muted)",
          margin: "8px 2px 0", lineHeight: 1.45,
        }}>
          {sessionCount} of the {startPool.length} waiting. Cards you get right move on,
          so the next sitting picks up where this one left off.
        </p>
      )}

      <DrillPicker
        pool={startPool}
        allCards={cards}
        sessionCount={sessionCount}
        onStart={(drill, content) => onStart({ drill, content, pool: startPool, count: sessionCount })}
      />
    </div>
  );
}

// The old flow shuffled the deck and went. Now the last thing you choose is
// *how* to be asked — the part that used to be decided months earlier, at
// import time, and then never revisited.
function DrillPicker({ pool, allCards, sessionCount, onStart }) {
  const [tuning, setTuning] = useState(null);   // null | "loading" | "done" | "off"
  const [suggestions, setSuggestions] = useState([]);
  const [content, setContent] = useState({});
  const [note, setNote] = useState("");

  // A representative sitting, used to work out which drills this deck can
  // actually sustain — matching needs five cards in the sitting, not five in
  // the library.
  const cards = useMemo(() => shuffle(pool).slice(0, sessionCount), [pool, sessionCount]);
  const drills = useMemo(() => drillsLib.availableDrills(cards, allCards), [cards, allCards]);

  // What gets sent for tuning. Each drill picks its own cards once chosen, and
  // "weak spots" deliberately picks different ones from the rest, so tuning
  // only the random sitting would leave that drill entirely untuned. Sending
  // both candidate sets means whichever drill is picked is mostly covered, and
  // any card that isn't just falls back to local content.
  const tuneSet = useMemo(() => {
    const weakest = drillsLib.selectCards(drillsLib.drillById("weak"), pool, sessionCount);
    const seen = new Set();
    return [...cards, ...weakest].filter((c) => !seen.has(c.id) && seen.add(c.id)).slice(0, 30);
  }, [cards, pool, sessionCount]);

  // Asking the model costs a call, so it happens once per deck when the
  // options come into view, not per drill. Its answer is cached against the
  // card text, so coming back to the same deck is instant and free.
  useEffect(() => {
    let live = true;
    if (!aiDrills.hasKey() || tuneSet.length === 0) { setTuning("off"); return; }
    setTuning("loading");
    aiDrills.tuneDeck(tuneSet)
      .then((res) => {
        if (!live) return;
        setContent(res.content || {});
        setSuggestions(res.suggestions || []);
        setTuning("done");
      })
      .catch((e) => {
        if (!live) return;
        setTuning("off");
        // Worth naming: a rejected key or an exhausted quota is something the
        // user can act on, and the drills silently getting worse is not.
        setNote(String(e?.message || "").includes("NO_KEY") ? "" : "Couldn't reach the AI — these are the standard drills.");
      });
    return () => { live = false; };
  }, [tuneSet]);

  // The model's ranking wins where it has an opinion; anything it didn't
  // mention keeps its place underneath, so every playable drill stays offered.
  const ordered = useMemo(() => {
    const rank = new Map(suggestions.map((s, i) => [s.id, i]));
    const blurbs = new Map(suggestions.map((s) => [s.id, s.blurb]));
    return [...drills]
      .sort((a, b) => (rank.has(a.id) ? rank.get(a.id) : 99) - (rank.has(b.id) ? rank.get(b.id) : 99))
      .map((d) => ({ ...d, tuned: blurbs.get(d.id) || "" }));
  }, [drills, suggestions]);

  if (!pool.length) {
    return (
      <PrimaryButton disabled style={{ marginTop: 18, width: "100%" }}>
        <Shuffle size={16} /> Nothing to study here
      </PrimaryButton>
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 22 }}>
        <Label style={{ margin: 0 }}>Pick your drill</Label>
        {tuning === "loading" && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--on-shell-muted)" }}>
            tuning to this deck…
          </span>
        )}
        {tuning === "done" && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--accent)" }}>
            <Sparkles size={11} /> tuned to this deck
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {ordered.map((d) => (
          <button key={d.id} onClick={() => onStart(d, content)} style={{
            display: "flex", alignItems: "center", gap: 12, textAlign: "left",
            padding: "14px 16px", minHeight: 64, borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)",
            WebkitTapHighlightColor: "transparent",
          }}>
            <DrillIcon id={d.icon} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                display: "block", fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: "#EDE6D3",
              }}>{d.label}</span>
              <span style={{
                display: "block", fontFamily: "Inter, sans-serif", fontSize: 12.5,
                color: d.tuned ? "var(--accent)" : "var(--on-shell-muted)", marginTop: 2,
              }}>{d.tuned || d.blurb}</span>
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--on-shell-faint)", whiteSpace: "nowrap" }}>
              {drillsLib.formatDuration(drillsLib.estimateSeconds(d, Math.min(sessionCount, cards.length)))}
            </span>
          </button>
        ))}
      </div>

      {(note || tuning === "off") && (
        <p style={{
          fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--on-shell-muted)",
          margin: "10px 2px 0", lineHeight: 1.45,
        }}>
          {note || <>Add an AI key in Settings and the drills get written around your own cards — real gaps to fill, wrong answers worth second-guessing.</>}
        </p>
      )}
    </>
  );
}

function DrillIcon({ id }) {
  const Icon = { zap: Zap, pencil: Pencil, shuffle: Shuffle, flag: Flag, layers: Layers }[id] || Layers;
  return (
    <span style={{
      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
      background: "rgba(242,197,114,0.14)", color: "var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={17} />
    </span>
  );
}
const selectStyle = {
  width: "100%", background: "var(--shell-bg-deep)", border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8, color: "#FBF7EC", padding: "13px 14px", minHeight: 48, fontFamily: "Inter, sans-serif", fontSize: 16,
};

// ---------- SESSION ----------
function Session({ initialQueue, rebuildQueue, game, onGrade, onFinish, onExit }) {
  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [missed, setMissed] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [round, setRound] = useState(1);
  // The reward screen needs one award object computed exactly once, when the
  // round ends. Recomputing it on every render would hand out XP repeatedly.
  const [award, setAward] = useState(null);
  // Only a card's FIRST answer this session moves it through the review
  // schedule — retry rounds are practice, not proof it'll stick tomorrow.
  const gradedIds = useRef(new Set());
  // Every answer of the round, in order, for the XP calculation.
  const answerLog = useRef([]);
  const current = queue[index];

  // One step can cover several cards — matching pairs grades a whole group at
  // once — so everything downstream works from a list of verdicts rather than
  // a single boolean.
  const gradeAll = (verdicts) => {
    let anyWrong = false;
    verdicts.forEach(({ card, correct }) => {
      const firstTime = !gradedIds.current.has(card.id);
      if (onGrade && firstTime) {
        gradedIds.current.add(card.id);
        onGrade(card.id, correct);
      }
      answerLog.current.push({
        correct,
        // A card climbing past its personal-best box is the only thing that
        // pays the "strengthened" bonus.
        levelUp: firstTime && isLevelUp(card, correct),
        repeat: !firstTime,
      });
      if (correct) setCorrectCount(n => n + 1);
      else { anyWrong = true; setMissed(m => [...m, card]); }
    });

    if (index + 1 < queue.length) {
      setIndex(index + 1);
    } else {
      // Round over: bank the XP once, then show what it was worth.
      const perfect = missed.length === 0 && !anyWrong;
      setAward(onFinish ? onFinish({ answers: answerLog.current, perfect }) : null);
      answerLog.current = [];
      setIndex(queue.length); // triggers summary
    }
  };

  // What the single-card exercises call: this step's one card, right or wrong.
  const handleResult = (wasCorrect) => gradeAll([{ card: current.cards[0], correct: wasCorrect }]);

  // What matching calls: a verdict per card in the group.
  const handleGroupResult = (results) => {
    const byId = new Map(current.cards.map(c => [c.id, c]));
    gradeAll(results.filter(r => byId.has(r.cardId)).map(r => ({ card: byId.get(r.cardId), correct: r.correct })));
  };

  const retryMissed = () => {
    setQueue(rebuildQueue ? rebuildQueue(missed) : shuffle(missed));
    setMissed([]);
    setIndex(0);
    setCorrectCount(0);
    setAward(null);
    answerLog.current = [];
    setRound(r => r + 1);
  };

  const studyAgain = () => {
    // Rebuilt rather than reshuffled, so a second pass asks the same cards
    // differently — new blanks, new wrong answers, new pairings.
    const cards = initialQueue.flatMap(s => s.cards);
    setQueue(rebuildQueue ? rebuildQueue(cards) : shuffle(initialQueue));
    setMissed([]);
    setIndex(0);
    setCorrectCount(0);
    setAward(null);
    answerLog.current = [];
    setRound(1);
  };

  if (index >= queue.length) {
    const perfect = missed.length === 0;
    return (
      <div>
        <button onClick={onExit} style={{
          background: "none", border: "none", color: "var(--on-shell-muted)", display: "flex", alignItems: "center",
          gap: 6, fontFamily: "Inter, sans-serif", fontSize: 14, padding: "10px 4px", minHeight: 44, marginBottom: 14, WebkitTapHighlightColor: "transparent",
        }}><ArrowLeft size={15} /> Change deck</button>

        {award ? (
          <SessionReward
            award={award} game={game}
            onDone={onExit}
            onExtra={perfect ? studyAgain : retryMissed}
          />
        ) : (
          <div style={{
            background: "var(--card-bg)", borderRadius: 12, padding: 28, textAlign: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)", animation: "popIn 0.2s ease-out",
          }}>
            <p style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 22, color: "var(--text-strong)", margin: "0 0 6px" }}>
              Round {round} complete
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "var(--text-secondary)", margin: "0 0 20px" }}>
              {correctCount} of {queue.reduce((n, s) => n + s.cards.length, 0)} correct
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {!perfect && (
                <PrimaryButton onClick={retryMissed}>
                  <RotateCcw size={16} /> Retry {missed.length} missed
                </PrimaryButton>
              )}
              <GhostButton onClick={studyAgain} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
                <Shuffle size={16} /> Study again
              </GhostButton>
            </div>
          </div>
        )}

        {award && !perfect && (
          <p style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "var(--on-shell-muted)", margin: "14px 0 0" }}>
            "Keep going" replays the {missed.length} card{missed.length !== 1 ? "s" : ""} you missed.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onExit} style={{
          background: "none", border: "none", color: "var(--on-shell-muted)", display: "flex", alignItems: "center",
          gap: 6, fontFamily: "Inter, sans-serif", fontSize: 14, padding: "10px 4px", minHeight: 44, WebkitTapHighlightColor: "transparent",
        }}><ArrowLeft size={15} /> Exit</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--on-shell-muted)" }}>
          {index + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar value={(index) / queue.length} />
      <div style={{ height: 20 }} />
      <Exercise
        key={current.key}
        step={current}
        onResult={handleResult}
        onGroupResult={handleGroupResult}
      />
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value * 100}%`, background: "var(--accent)", transition: "width 0.3s" }} />
    </div>
  );
}



function FlipCard({ card, onResult }) {
  const [flipped, setFlipped] = useState(false);
  // Both faces are stretched to the taller one (the answer side, which carries
  // the buttons), so the text and its caption are centred as a pair rather than
  // pinned top and bottom — otherwise the question side reads as half empty.
  const body = {
    flex: 1, minHeight: 140, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", textAlign: "center",
  };
  const caption = { textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", margin: "14px 0 0" };
  return (
    <>
      <div
        className="fc-flip"
        onClick={() => setFlipped(f => !f)}
        style={{ cursor: "pointer", animation: "popIn 0.25s ease-out" }}>
        <div className="fc-flip-inner" style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <div className="fc-flip-face" aria-hidden={flipped}>
            <CardShell fill tabLabel="Flip">
              <div style={body}>
                <CardFace text={card.front} imageId={card.frontImageId} />
                <p style={caption}>Tap the card to reveal the answer</p>
              </div>
            </CardShell>
          </div>
          <div className="fc-flip-face fc-flip-face-back" aria-hidden={!flipped}>
            <CardShell fill tabLabel="Answer" tabColor="var(--success)">
              <div style={body}>
                <CardFace text={card.back} imageId={card.backImageId} />
                <p style={caption}>That's the answer</p>
              </div>
            </CardShell>
          </div>
        </div>
      </div>
      {/* Deliberately outside the card: these stay put while it turns, so you
          can grade a card you already know without revealing it first. */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <GhostButton onClick={() => onResult(false)} style={{ flex: 1, color: "#B5533C", borderColor: "#B5533C" }}>Missed it</GhostButton>
        <PrimaryButton onClick={() => onResult(true)} style={{ flex: 1, background: "var(--success)", color: "#FBF7EC" }}>Got it</PrimaryButton>
      </div>
    </>
  );
}

// One step in, one exercise out. Everything a step needs was worked out when
// the queue was built, so nothing here has to know about drills or the model.
function Exercise({ step, onResult, onGroupResult }) {
  const card = step.cards[0];
  switch (step.type) {
    case drillsLib.EXERCISES.MCQ:
      return <McqCard card={card} options={step.payload.options} onResult={onResult} />;
    case drillsLib.EXERCISES.WRITE:
      return <WriteCard card={card} onResult={onResult} />;
    case drillsLib.EXERCISES.CLOZE:
      return <ClozeCard card={card} payload={step.payload} onResult={onResult} />;
    case drillsLib.EXERCISES.TRUEFALSE:
      return <TrueFalseCard payload={step.payload} onResult={onResult} />;
    case drillsLib.EXERCISES.MATCH:
      return <MatchCard payload={step.payload} onResult={onGroupResult} />;
    default:
      return <FlipCard card={card} onResult={onResult} />;
  }
}

// The options are built by the drill now — from the wrong answers you wrote,
// the ones the model wrote, and the rest of the deck, in that order — so this
// only has to draw them.
function McqCard({ card, options, onResult }) {
  const [picked, setPicked] = useState(null);
  const answered = picked !== null;

  return (
    <CardShell tabLabel="Multiple choice" tabColor="var(--highlight)">
      <div style={{ marginBottom: 18 }}>
        <CardFace text={card.front} imageId={card.frontImageId} size={19} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt, i) => {
          const isCorrect = normalize(opt) === normalize(card.back);
          let bg = "var(--input-bg)", border = "var(--card-border)", color = "var(--text-strong)";
          if (answered) {
            if (isCorrect) { bg = "var(--success)"; border = "var(--success)"; color = "#FBF7EC"; }
            else if (opt === picked) { bg = "#B5533C"; border = "#B5533C"; color = "#FBF7EC"; }
          }
          return (
            <button key={i} disabled={answered} onClick={() => setPicked(opt)} style={{
              textAlign: "left", padding: "15px 16px", minHeight: 48, borderRadius: 8, border: `1px solid ${border}`,
              background: bg, color, fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 500,
              WebkitTapHighlightColor: "transparent",
            }}>{opt}</button>
          );
        })}
      </div>
      {answered && (
        <PrimaryButton onClick={() => onResult(normalize(picked) === normalize(card.back))} style={{ width: "100%", marginTop: 16 }}>
          Continue
        </PrimaryButton>
      )}
    </CardShell>
  );
}

function WriteCard({ card, onResult }) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = normalize(value) === normalize(card.back);

  return (
    <CardShell tabLabel="Write answer" tabColor="#7B4B94">
      <div style={{ marginBottom: 16 }}>
        <CardFace text={card.front} imageId={card.frontImageId} size={19} />
      </div>
      <TextField value={value} onChange={e => setValue(e.target.value)} placeholder="Type your answer…"
        style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 12 }} />
      {checked && (
        <div style={{
          padding: "10px 12px", borderRadius: 8, marginBottom: 12,
          background: isCorrect ? "var(--success)" : "#B5533C", color: "#FBF7EC", fontFamily: "Inter, sans-serif", fontSize: 13.5,
        }}>
          {isCorrect ? "Correct!" : <>Not quite — the answer was <strong>{card.back}</strong></>}
        </div>
      )}
      {checked ? (
        <PrimaryButton onClick={() => onResult(isCorrect)} style={{ width: "100%" }}>Continue</PrimaryButton>
      ) : (
        <PrimaryButton onClick={() => setChecked(true)} disabled={!value.trim()} style={{ width: "100%" }}>Check answer</PrimaryButton>
      )}
    </CardShell>
  );
}
