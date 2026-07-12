import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Pencil, ChevronRight, X, Check,
  Shuffle, Layers, BookOpen, ArrowLeft, RotateCcw, Circle, Cloud, CloudOff, LogIn, LogOut, Upload,
  FileUp, Camera, Sparkles, Key, Settings, ExternalLink, CreditCard, Image as ImageIcon, Type
} from "lucide-react";
import { Browser } from "@capacitor/browser";
import { App as CapacitorApp } from "@capacitor/app";
import * as firebaseSync from "./firebaseSync";
import * as aiImport from "./aiImport";
import { extractTextFromFile, fileToBase64, isTextFile } from "./fileImport";
import * as imageStore from "./imageStore";
import { pushBackHandler, consumeBack } from "./backHandler";

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
const STORAGE_KEY = "flashcard-catalog-data";
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
const MODES = [
  { id: "flip", label: "Flip card" },
  { id: "mcq", label: "Multiple choice" },
  { id: "write", label: "Write answer" },
];

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const normalize = (s) =>
  (s || "").trim().toLowerCase().replace(/[.,!?;:'"]/g, "").replace(/\s+/g, " ");

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

// ---------- storage (localStorage-backed, works standalone / in the APK) ----------
const storage = {
  async get(key) {
    try {
      const value = window.localStorage.getItem(key);
      return { value };
    } catch (e) {
      return { value: null };
    }
  },
  async set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  },
};

export default function FlashcardCatalog() {
  const [subjects, setSubjects] = useState([]);
  const [cards, setCards] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("library"); // library | study | session
  const [error, setError] = useState("");
  const [googleUser, setGoogleUser] = useState(null); // { email, name, accessToken }
  const [syncState, setSyncState] = useState("idle"); // idle | syncing | synced | error
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(getStoredDarkMode);
  const sessionQueueRef = useRef([]);
  const updatedAtRef = useRef(0);
  const skipNextPush = useRef(false);
  const currentDataRef = useRef({ subjects: [], cards: [] });
  // Which Google account the data currently in `subjects`/`cards` belongs to.
  // null means it has never been synced to any account yet.
  const ownerUidRef = useRef(null);
  useEffect(() => {
    currentDataRef.current = { subjects, cards };
  }, [subjects, cards]);

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
    if (view === "session") return pushBackHandler(() => setView("study"));
  }, [view]);

  // ---------- load ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setSubjects(migrateSubjects(parsed.subjects || []));
          setCards(migrateCards(parsed.cards || []));
          updatedAtRef.current = parsed.updatedAt || 0;
          ownerUidRef.current = parsed.ownerUid || null;
        }
      } catch (e) {
        // no existing data yet, that's fine
      }
      setLoaded(true);
    })();
  }, []);

  // ---------- restore Firebase session ----------
  useEffect(() => {
    firebaseSync.getCurrentUser().then((user) => {
      if (user) setGoogleUser(user);
    }).catch(() => {});
  }, []);

  // ---------- save (debounced) ----------
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const shouldPush = !skipNextPush.current;
    skipNextPush.current = false;
    saveTimer.current = setTimeout(async () => {
      updatedAtRef.current = Date.now();
      const payload = { subjects, cards, updatedAt: updatedAtRef.current, ownerUid: ownerUidRef.current };
      try {
        const result = await storage.set(STORAGE_KEY, JSON.stringify(payload));
        if (!result) setError("Couldn't save — your last change may not persist.");
        else setError("");
      } catch (e) {
        setError("Couldn't save — your last change may not persist.");
      }
      // Only push to Firestore if this data is actually attributed to the
      // signed-in account — otherwise a leftover local copy from a previous
      // account could get written into someone else's document.
      if (shouldPush && googleUser && ownerUidRef.current === googleUser.uid) {
        setSyncState("syncing");
        try {
          await safePush(googleUser.uid, payload);
          setSyncState("synced");
        } catch (e) {
          setSyncState("error");
        }
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [subjects, cards, loaded, googleUser]);

  const applyRemote = (remote) => {
    skipNextPush.current = true;
    setSubjects(migrateSubjects(remote.subjects || []));
    setCards(migrateCards(remote.cards || []));
    updatedAtRef.current = remote.updatedAt || Date.now();
  };

  // A remote payload with no subjects and no cards is either a legitimate "user
  // deleted everything" or a corrupted/half-written sync. We can't tell those
  // apart, so when local data isn't empty we treat it as suspicious: keep the
  // local data and push it back up instead of wiping the device.
  const isEmptyPayload = (p) => (!p.subjects || p.subjects.length === 0) && (!p.cards || p.cards.length === 0);

  const acceptRemoteIfNewer = (remote, user) => {
    if (!remote || (remote.updatedAt || 0) <= updatedAtRef.current) return;
    const local = currentDataRef.current;
    const localBelongsToThisUser = ownerUidRef.current === user.uid;
    const localHasData = local.subjects.length > 0 || local.cards.length > 0;
    if (isEmptyPayload(remote) && localHasData && localBelongsToThisUser) {
      firebaseSync.pushData(user.uid, { ...local, updatedAt: Date.now(), ownerUid: user.uid }).catch(() => {});
      return;
    }
    ownerUidRef.current = user.uid;
    applyRemote(remote);
  };

  // Re-reads the remote document immediately before writing so a write from
  // another concurrently-signed-in session (e.g. testing on two devices with
  // the same account) can't be silently clobbered by an older payload landing
  // a moment later. If the remote turns out to be newer than what we're about
  // to send, we adopt it instead of overwriting it.
  const safePush = async (uid, payload) => {
    const current = await firebaseSync.pullData(uid);
    if (current && (current.updatedAt || 0) > payload.updatedAt) {
      acceptRemoteIfNewer(current, { uid });
      return;
    }
    await firebaseSync.pushData(uid, payload);
  };

  // ---------- realtime listener: pick up changes made on other devices ----------
  // Gated on `loaded` too: until local storage has been read, updatedAtRef.current
  // is still its initial 0, so an empty/stale remote document would look "newer"
  // than local data that hasn't been read into the ref yet and wipe it out.
  useEffect(() => {
    if (!googleUser || !loaded) return;
    let callbackId;
    let cancelled = false;
    firebaseSync.listenToData(googleUser.uid, (remote) => {
      acceptRemoteIfNewer(remote, googleUser);
      setSyncState("synced");
    }).then((id) => {
      if (cancelled) firebaseSync.stopListening(id);
      else callbackId = id;
    }).catch(() => setSyncState("error"));
    return () => {
      cancelled = true;
      if (callbackId) firebaseSync.stopListening(callbackId);
    };
  }, [googleUser, loaded]);

  const handleSignIn = async () => {
    setSyncState("syncing");
    setError("");
    try {
      const user = await firebaseSync.signIn();
      setGoogleUser(user);
      const remote = await firebaseSync.pullData(user.uid);
      const switchingAccounts = ownerUidRef.current && ownerUidRef.current !== user.uid;

      if (switchingAccounts) {
        // The data currently on this device belongs to a different account —
        // never push it here. Adopt this account's own cloud data instead,
        // even if that means starting from an empty catalog.
        ownerUidRef.current = user.uid;
        if (remote) {
          applyRemote(remote);
        } else {
          skipNextPush.current = true;
          setSubjects([]);
          setCards([]);
          updatedAtRef.current = 0;
        }
      } else {
        ownerUidRef.current = user.uid;
        if (remote && (remote.updatedAt || 0) > updatedAtRef.current && !(isEmptyPayload(remote) && (subjects.length > 0 || cards.length > 0))) {
          applyRemote(remote);
        } else {
          await safePush(user.uid, { subjects, cards, updatedAt: updatedAtRef.current || Date.now(), ownerUid: user.uid });
        }
      }
      setSyncState("synced");
    } catch (e) {
      setSyncState("error");
      if (e && e.code !== "USER_CANCELLED") {
        setError(`Google sign-in failed: ${e && e.message ? e.message : e}`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSync.signOut();
    } catch (e) {
      // ignore
    }
    setGoogleUser(null);
    setSyncState("idle");
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
          goStudy={() => setView("study")}
          googleUser={googleUser}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      )}
      {view === "study" && (
        <StudySetup
          subjects={subjects} cards={cards}
          onBack={() => setView("library")}
          onStart={(queue) => { sessionQueueRef.current = queue; setView("session"); }}
        />
      )}
      {view === "session" && (
        <Session
          initialQueue={sessionQueueRef.current}
          allCards={cards}
          onExit={() => setView("study")}
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
      background: "#16233F",
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
        ::selection { background: #C98A2B; color: #16233F; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea, select { font-family: inherit; }
        .fc-scroll::-webkit-scrollbar { width: 8px; }
        .fc-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        @keyframes flipIn { from { transform: rotateY(90deg); opacity: 0.3; } to { transform: rotateY(0deg); opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
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
            fontSize: 26, color: "#F2C572", letterSpacing: 0.2, flexShrink: 0,
          }}>Catalog</span>
          <span className="fc-subtitle" style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8CA0C2",
            letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap",
          }}>Flashcard drawer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <SyncControl googleUser={googleUser} syncState={syncState} onSignIn={onSignIn} onSignOut={onSignOut} />
          <IconBtn title="Settings" onClick={onOpenSettings}><Settings size={18} color="#8CA0C2" /></IconBtn>
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
        color: syncState === "error" ? "#D97757" : "#8CA0C2",
      }}>
        <Icon size={14} /> <span className="fc-signin-label">{label}</span>
      </span>
      <button onClick={onSignOut} title={`Sign out of ${googleUser.email}`} style={{
        background: "transparent", border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 20, padding: "8px 12px", minHeight: 40, color: "#8CA0C2",
        fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 5, WebkitTapHighlightColor: "transparent",
      }}>
        <LogOut size={14} />
      </button>
    </div>
  );
}

// ---------- shared bits ----------
function IndexCardTab({ color, label }) {
  return (
    <div style={{
      position: "absolute", top: -10, left: 18,
      background: color, color: "#FBF7EC",
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600,
      padding: "3px 10px", borderRadius: "3px 3px 0 0",
      letterSpacing: 0.6, textTransform: "uppercase",
      boxShadow: "0 -1px 3px rgba(0,0,0,0.15)",
    }}>{label}</div>
  );
}

function PunchHole() {
  return (
    <div style={{
      position: "absolute", left: 14, bottom: 14, width: 10, height: 10,
      borderRadius: "50%", background: "#16233F",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
    }} />
  );
}

function IconBtn({ onClick, title, children, danger }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: "transparent", border: "none", padding: 10, borderRadius: 8,
      color: danger ? "#D97757" : "#8CA0C2", display: "flex", alignItems: "center",
      justifyContent: "center", minWidth: 44, minHeight: 44,
      transition: "background 0.15s", WebkitTapHighlightColor: "transparent",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >{children}</button>
  );
}

function PrimaryButton({ onClick, children, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#3A4A68" : "#F2C572", color: disabled ? "#8CA0C2" : "#16233F",
      border: "none", borderRadius: 10, padding: "14px 22px", minHeight: 48,
      fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15.5,
      display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
      opacity: disabled ? 0.6 : 1, WebkitTapHighlightColor: "transparent", ...style,
    }}>{children}</button>
  );
}
function GhostButton({ onClick, children, style }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", color: "#EDE6D3", border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: 10, padding: "13px 20px", minHeight: 48, fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15.5,
      display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
      WebkitTapHighlightColor: "transparent", ...style,
    }}>{children}</button>
  );
}

function TextField({ value, onChange, placeholder, area, style, ...rest }) {
  const common = {
    width: "100%", background: "#0F1A30", border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 8, color: "#FBF7EC", padding: "13px 14px", fontFamily: "Inter, sans-serif",
    fontSize: 16, outline: "none", ...style,
  };
  return area
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} style={{ ...common, resize: "vertical" }} {...rest} />
    : <input value={value} onChange={onChange} placeholder={placeholder} style={common} {...rest} />;
}

// ---------- LIBRARY ----------
function Library({ subjects, setSubjects, cards, setCards, goStudy, googleUser, onOpenSettings }) {
  const [path, setPath] = useState([]); // node ids from root subject down
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
  const importCards = ({ subjectName, categoryName, mode, text, cardPairs }) => {
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
      front: p.front, back: p.back, mode, manualOptions: [],
    }));

    if (newCards.length === 0) return 0;
    setSubjects(nextSubjects);
    setCards([...cards, ...newCards]);
    return newCards.length;
  };

  const totalCards = cards.length;

  // ---------- top level: list of subjects ----------
  if (path.length === 0) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <p style={{ color: "#8CA0C2", fontFamily: "Inter, sans-serif", fontSize: 13, margin: 0 }}>
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} · {totalCards} card{totalCards !== 1 ? "s" : ""}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostButton onClick={() => setImportOpen({ mode: "paste" })}>
              <Upload size={16} /> Import
            </GhostButton>
            <PrimaryButton onClick={goStudy} disabled={totalCards === 0}>
              <BookOpen size={16} /> Study
            </PrimaryButton>
          </div>
        </div>

        {subjects.length === 0 && !addingSubject && (
          <EmptyState onAdd={() => setAddingSubject(true)} />
        )}

        {subjects.map((s, i) => {
          const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
          const count = cards.filter(c => collectIds(s).includes(c.nodeId)).length;
          return (
            <NodeRow key={s.id} name={s.name} count={count} color={color.bg} tabColor={color.tab}
              onOpen={() => setPath([s.id])}
              onDelete={() => deleteNode(s.id)}
              deleteTitle="Delete subject"
            />
          );
        })}

        <div style={{ marginTop: 24 }}>
          {addingSubject ? (
            <div style={{ display: "flex", gap: 8 }}>
              <TextField value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="Subject name (e.g. Biology)" />
              <IconBtn title="Save" onClick={addSubject}><Check size={18} color="#5C7A44" /></IconBtn>
              <IconBtn title="Cancel" onClick={() => setAddingSubject(false)}><X size={18} color="#B5533C" /></IconBtn>
            </div>
          ) : subjects.length > 0 && (
            <GhostButton onClick={() => setAddingSubject(true)}><Plus size={16} /> New subject</GhostButton>
          )}
        </div>

        {importOpen && (
          <ImportModal
            subjects={subjects}
            initialMode={importOpen.mode}
            onClose={() => setImportOpen(null)}
            onImport={importCards}
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

  return (
    <div>
      <Breadcrumb trail={trail} onJump={(depth) => setPath(path.slice(0, depth))} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 18px" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontStyle: "italic", fontSize: 22, color: "#F2C572", margin: 0 }}>
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
            <Trash2 size={16} color="#D97757" />
          </IconBtn>
        </div>
      </div>

      {currentChildren.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {currentChildren.map(child => {
            const count = cards.filter(c => collectIds(child).includes(c.nodeId)).length;
            return (
              <NodeRow key={child.id} name={child.name} count={count} color={rootColor.bg} tabColor={rootColor.tab}
                onOpen={() => setPath([...path, child.id])}
                onDelete={() => deleteNode(child.id)}
                deleteTitle="Delete subcategory"
                compact
              />
            );
          })}
        </div>
      )}

      {addingSubcategory && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <TextField value={newSubcategoryName} onChange={e => setNewSubcategoryName(e.target.value)} placeholder="Subcategory name" />
          <IconBtn title="Save" onClick={addSubcategory}><Check size={18} color="#5C7A44" /></IconBtn>
          <IconBtn title="Cancel" onClick={() => setAddingSubcategory(false)}><X size={18} color="#B5533C" /></IconBtn>
        </div>
      )}

      <div style={{ margin: "4px 0 10px" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#8CA0C2", letterSpacing: 0.5, textTransform: "uppercase" }}>
          Cards in this folder ({nodeCards.length})
        </span>
      </div>

      {nodeCards.length === 0 ? (
        <p style={{ color: "#8CA0C2", fontFamily: "Inter, sans-serif", fontSize: 13.5 }}>
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
          onImport={importCards}
          googleUser={googleUser}
          onOpenSettings={onOpenSettings}
        />
      )}
    </div>
  );
}

function NodeRow({ name, count, color, tabColor, onOpen, onDelete, deleteTitle, compact }) {
  return (
    <div style={{ position: "relative", marginTop: compact ? 10 : 26 }}>
      <div
        onClick={onOpen}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--card-bg)", borderRadius: compact ? 8 : "2px 10px 10px 10px",
          boxShadow: compact ? "0 2px 8px rgba(0,0,0,0.18)" : "0 4px 14px rgba(0,0,0,0.25)",
          padding: compact ? "13px 14px" : "16px 16px 14px 18px",
          cursor: "pointer", borderLeft: compact ? `3px solid ${color}` : "none",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{
            fontFamily: compact ? "'IBM Plex Mono', monospace" : "Fraunces, serif",
            fontWeight: 600,
            fontSize: compact ? 13.5 : 19,
            color: compact ? "var(--text-strong)" : "var(--text-strong)",
            letterSpacing: compact ? 0.3 : 0,
            textTransform: compact ? "uppercase" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{name}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", flexShrink: 0 }}>
            {count} card{count !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <IconBtn title={deleteTitle} danger onClick={onDelete}><Trash2 size={14} color="#B5533C" /></IconBtn>
          <ChevronRight size={16} color="var(--text-faint)" />
        </div>
      </div>
      {!compact && <IndexCardTab color={tabColor} label="Tap to open" />}
    </div>
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
            color: i === trail.length - 1 ? "#F2C572" : "#8CA0C2",
            fontWeight: i === trail.length - 1 ? 600 : 500,
          }}>{n.name}</button>
        </span>
      ))}
    </div>
  );
}
const crumbStyle = {
  background: "none", border: "none", fontFamily: "Inter, sans-serif", color: "#8CA0C2",
  fontSize: 13, padding: "8px 4px", minHeight: 36, display: "flex", alignItems: "center", gap: 4,
  WebkitTapHighlightColor: "transparent",
};

function EmptyState({ onAdd }) {
  return (
    <div style={{
      border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, padding: "36px 20px",
      textAlign: "center", marginTop: 20,
    }}>
      <p style={{ color: "#EDE6D3", fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 18, margin: "0 0 6px" }}>
        The drawer is empty.
      </p>
      <p style={{ color: "#8CA0C2", fontFamily: "Inter, sans-serif", fontSize: 13, margin: "0 0 16px" }}>
        Add your first subject to start building decks.
      </p>
      <PrimaryButton onClick={onAdd} style={{ margin: "0 auto" }}><Plus size={16} /> New subject</PrimaryButton>
    </div>
  );
}

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
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
            {MODES.find(m => m.id === card.mode)?.label}
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
  const [mode, setMode] = useState(existingCard?.mode || "flip");
  const [manualOptions, setManualOptions] = useState(existingCard?.manualOptions?.join(", ") || "");
  const [imageError, setImageError] = useState("");

  useEffect(() => pushBackHandler(onClose), []);

  // Picture answers can't be compared as text, so multiple-choice and
  // write-answer modes don't make sense once the back is a picture.
  useEffect(() => {
    if (backType === "image" && mode !== "flip") setMode("flip");
  }, [backType, mode]);

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
      mode,
      manualOptions: mode === "mcq" && backType === "text" && manualOptions.trim()
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

        <Label>How should you answer this card?</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          {(backType === "image" ? MODES.filter(m => m.id === "flip") : MODES).map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              padding: "11px 16px", minHeight: 44, borderRadius: 20, fontSize: 13.5, fontFamily: "Inter, sans-serif", fontWeight: 600,
              border: mode === m.id ? "1px solid #2F6F6D" : "1px solid var(--card-border)",
              background: mode === m.id ? "#2F6F6D" : "transparent",
              color: mode === m.id ? "#FBF7EC" : "var(--text-secondary)",
              WebkitTapHighlightColor: "transparent",
            }}>{m.label}</button>
          ))}
        </div>
        {backType === "image" && (
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "4px 0 12px" }}>
            A picture answer can only use flip cards — multiple choice and write-answer need a text answer to check against.
          </p>
        )}

        {mode === "mcq" && backType === "text" && (
          <>
            <Label>Extra wrong options (optional, comma-separated)</Label>
            <TextField value={manualOptions} onChange={e => setManualOptions(e.target.value)}
              placeholder="e.g. Ribosome, Golgi apparatus, Nucleus"
              style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 4 }} />
            <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "4px 0 12px" }}>
              If you leave this blank, we'll pull wrong answers from other cards in this deck.
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
          border: value === id ? "1px solid #2F6F6D" : "1px solid var(--card-border)",
          background: value === id ? "#2F6F6D" : "transparent",
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

function Label({ children }) {
  return <p style={{
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px",
  }}>{children}</p>;
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

function ImportModal({ subjects, onClose, onImport, googleUser, onOpenSettings, initialMode, initialSubjectName, initialCategoryName }) {
  const [importMode, setImportMode] = useState(initialMode || "paste");
  const [subjectName, setSubjectName] = useState(initialSubjectName || "");
  const [categoryName, setCategoryName] = useState(initialCategoryName || "");
  const [mode, setMode] = useState("flip");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingCards, setPendingCards] = useState(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => pushBackHandler(onClose), []);

  const matchedSubject = subjects.find(s => s.name.toLowerCase() === subjectName.trim().toLowerCase());
  // Given to Claude so it can reuse an existing subject/subcategory name
  // instead of always inventing a new one, and to auto-fill Subject/
  // Subcategory below when the user hasn't already typed (or been given) one.
  const existingSubjects = subjects.map(s => ({ name: s.name, subcategories: (s.children || []).map(c => c.name) }));
  // Photo mode always needs Claude, so gate it upfront. File mode doesn't —
  // plain "Front | Back" text files parse for free — so it only finds out it
  // needs a key if local parsing comes up empty (handled in handleFile below).
  // Being signed in isn't itself sufficient — it's only a proxy for "might be
  // the app owner, who gets a free server-side path" — so a signed-in customer
  // with no key of their own still gets caught by the NO_KEY check inside the
  // actual request and routed to the same prompt afterward.
  const needsApiKeyUpfront = importMode === "photo" && !googleUser && !aiImport.hasApiKey();

  const switchMode = (id) => {
    setImportMode(id);
    setError(""); setResult(""); setPendingCards(null);
  };

  const doPasteImport = () => {
    const count = onImport({ subjectName, categoryName, mode, text });
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
    setError(""); setResult(""); setPendingCards(null); setBusy(true);
    try {
      const raw = await extractTextFromFile(file);
      const localPairs = isTextFile(file.name) ? parseDelimitedPairs(raw) : [];
      if (localPairs.length > 0) {
        setPendingCards(localPairs);
      } else if (!googleUser && !aiImport.hasApiKey()) {
        setError("NEEDS_KEY");
      } else {
        const { subject, subcategory, cards: aiPairs } = await aiImport.extractCardsFromText(raw, existingSubjects);
        if (aiPairs.length === 0) throw new Error("Claude couldn't find any flashcard-worthy content in this file.");
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

  const handlePhoto = async (file) => {
    setError(""); setResult(""); setPendingCards(null); setBusy(true);
    try {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("That photo's format isn't supported — please use a JPEG, PNG, GIF, or WEBP image.");
      }
      const base64 = await fileToBase64(file);
      const { subject, subcategory, cards: pairs } = await aiImport.extractCardsFromImage(base64, file.type, existingSubjects);
      if (pairs.length === 0) throw new Error("Claude couldn't find any flashcard-worthy content in that photo.");
      setPendingCards(pairs);
      if (!subjectName.trim() && subject) setSubjectName(subject);
      if (!categoryName.trim() && subcategory) setCategoryName(subcategory);
    } catch (e) {
      setError(e.message === "NO_KEY" ? "NEEDS_KEY" : (e.message || "Couldn't analyze that photo."));
    } finally {
      setBusy(false);
    }
  };

  const removePendingCard = (idx) => setPendingCards(pendingCards.filter((_, i) => i !== idx));

  const confirmPendingImport = () => {
    const count = onImport({ subjectName, categoryName, mode, cardPairs: pendingCards });
    setResult(`Imported ${count} card${count !== 1 ? "s" : ""}.`);
    setPendingCards(null);
  };

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
              border: importMode === m.id ? "1px solid #2F6F6D" : "1px solid var(--card-border)",
              background: importMode === m.id ? "#2F6F6D" : "transparent",
              color: importMode === m.id ? "#FBF7EC" : "var(--text-secondary)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              WebkitTapHighlightColor: "transparent",
            }}><m.icon size={16} />{m.label}</button>
          ))}
        </div>

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

        <Label>How should you answer these cards?</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              padding: "11px 16px", minHeight: 44, borderRadius: 20, fontSize: 13.5, fontFamily: "Inter, sans-serif", fontWeight: 600,
              border: mode === m.id ? "1px solid #2F6F6D" : "1px solid var(--card-border)",
              background: mode === m.id ? "#2F6F6D" : "transparent",
              color: mode === m.id ? "#FBF7EC" : "var(--text-secondary)",
              WebkitTapHighlightColor: "transparent",
            }}>{m.label}</button>
          ))}
        </div>

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

        {importMode === "file" && !pendingCards && (
          <>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={13} color="#C98A2B" /> .txt/.csv/.md files with "Front | Back" lines import instantly. PDFs, Word docs, and anything else get read by Claude.
            </p>
            <input ref={fileInputRef} type="file" accept=".txt,.csv,.tsv,.md,.pdf,.docx" style={{ display: "none" }}
              onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = ""; }} />
            <GhostButton onClick={() => fileInputRef.current?.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", width: "100%" }} >
              <FileUp size={16} /> {busy ? "Reading file…" : "Choose file"}
            </GhostButton>
          </>
        )}

        {importMode === "photo" && !pendingCards && (
          <>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={13} color="#C98A2B" /> Take or choose a photo of a book page or your notes — Claude reads it and builds the cards.
            </p>
            {needsApiKeyUpfront ? (
              <ApiKeyPrompt onOpenSettings={onOpenSettings} />
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={photoInputRef} type="file" accept={SUPPORTED_IMAGE_ACCEPT} capture="environment" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files[0]; if (f) handlePhoto(f); e.target.value = ""; }} />
                <GhostButton onClick={() => photoInputRef.current?.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", flex: 1 }}>
                  <Camera size={16} /> {busy ? "Analyzing…" : "Take photo"}
                </GhostButton>
                <input ref={galleryInputRef} type="file" accept={SUPPORTED_IMAGE_ACCEPT} style={{ display: "none" }}
                  onChange={e => { const f = e.target.files[0]; if (f) handlePhoto(f); e.target.value = ""; }} />
                <GhostButton onClick={() => galleryInputRef.current?.click()} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)", flex: 1 }}>
                  <ImageIcon size={16} /> {busy ? "Analyzing…" : "From gallery"}
                </GhostButton>
              </div>
            )}
          </>
        )}

        {pendingCards && (
          <>
            <Label>Review ({pendingCards.length} card{pendingCards.length !== 1 ? "s" : ""})</Label>
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

        {error === "NEEDS_KEY" && <ApiKeyPrompt onOpenSettings={onOpenSettings} />}
        {error && error !== "NEEDS_KEY" && (
          <p style={{ fontSize: 12.5, color: "#B5533C", fontFamily: "Inter, sans-serif", margin: "8px 0 4px", fontWeight: 600 }}>
            {error}
          </p>
        )}
        {result && (
          <p style={{ fontSize: 12.5, color: "#5C7A44", fontFamily: "Inter, sans-serif", margin: "8px 0 4px", fontWeight: 600 }}>
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
          <GhostButton onClick={onClose} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>Done</GhostButton>
        </div>
      </div>
    </div>
  );
}

function ApiKeyPrompt({ onOpenSettings }) {
  return (
    <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: 16, textAlign: "center" }}>
      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", margin: "0 0 10px" }}>
        This needs an Anthropic API key so Claude can read it.
      </p>
      <GhostButton onClick={onOpenSettings} style={{ color: "#2F6F6D", borderColor: "#2F6F6D", margin: "0 auto" }}>
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
      background: checked ? "#2F6F6D" : "var(--card-border)",
      display: "flex", alignItems: "center", justifyContent: checked ? "flex-end" : "flex-start",
      transition: "background 0.15s", WebkitTapHighlightColor: "transparent", cursor: "pointer", flexShrink: 0,
    }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FBF7EC", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function SettingsModal({ onClose, darkMode, onToggleDarkMode }) {
  const [apiKey, setApiKeyState] = useState(aiImport.getApiKey());

  useEffect(() => pushBackHandler(onClose), []);

  const updateApiKey = (value) => {
    setApiKeyState(value);
    aiImport.setApiKey(value);
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
        }}>AI-powered import</p>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", margin: "0 0 14px" }}>
          Pasting your own "Front | Back" text is always free. Reading PDFs, Word docs, and photos with Claude needs your own Anthropic API key.
        </p>

        <Label><Key size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Anthropic API key</Label>
        <TextField value={apiKey} onChange={e => updateApiKey(e.target.value)}
          placeholder="sk-ant-..." type="password"
          style={{ background: "var(--input-bg)", color: "var(--text-strong)", border: "1px solid var(--card-border)", marginBottom: 4 }} />
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "4px 0 18px" }}>
          Stored only on this device — never synced to your account.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
          <GhostButton onClick={() => openExternal("https://console.anthropic.com/settings/keys")} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
            <ExternalLink size={16} /> Get an API key
          </GhostButton>
          <GhostButton onClick={() => openExternal("https://console.anthropic.com/settings/billing")} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
            <CreditCard size={16} /> Add credits / billing
          </GhostButton>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "Inter, sans-serif", margin: "10px 0 0" }}>
          Both open Anthropic's console in your browser. Sign up, add a card, generate a key, then paste it above — usage is billed by Anthropic directly, a few cents per file or photo.
        </p>
      </div>
    </div>
  );
}

// ---------- STUDY SETUP ----------
function StudySetup({ subjects, cards, onBack, onStart }) {
  const [nodeId, setNodeId] = useState("all");
  const flat = flattenTree(subjects);
  const selected = flat.find(f => f.id === nodeId);
  const pool = nodeId === "all" ? cards : cards.filter(c => selected && selected.ids.includes(c.nodeId));

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "#8CA0C2", display: "flex", alignItems: "center",
        gap: 6, fontFamily: "Inter, sans-serif", fontSize: 14, padding: "10px 4px", minHeight: 44, marginBottom: 14, WebkitTapHighlightColor: "transparent",
      }}><ArrowLeft size={15} /> Back to catalog</button>

      <h2 style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 600, fontSize: 24, color: "#F2C572", margin: "0 0 18px" }}>
        Pick your deck
      </h2>

      <Label>Subject / subcategory</Label>
      <select value={nodeId} onChange={e => setNodeId(e.target.value)} style={selectStyle}>
        <option value="all">All subjects</option>
        {flat.map(f => (
          <option key={f.id} value={f.id}>{"—".repeat(f.depth)}{f.depth > 0 ? " " : ""}{f.name}</option>
        ))}
      </select>

      <div style={{
        marginTop: 22, padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)", fontFamily: "Inter, sans-serif",
      }}>
        <p style={{ color: "#EDE6D3", fontSize: 14, margin: 0 }}>
          {pool.length} card{pool.length !== 1 ? "s" : ""} ready to study
        </p>
      </div>

      <PrimaryButton onClick={() => onStart(shuffle(pool))} disabled={pool.length === 0} style={{ marginTop: 18, width: "100%" }}>
        <Shuffle size={16} /> Start session
      </PrimaryButton>
    </div>
  );
}
const selectStyle = {
  width: "100%", background: "#0F1A30", border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8, color: "#FBF7EC", padding: "13px 14px", minHeight: 48, fontFamily: "Inter, sans-serif", fontSize: 16,
};

// ---------- SESSION ----------
function Session({ initialQueue, allCards, onExit }) {
  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [missed, setMissed] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [round, setRound] = useState(1);
  const current = queue[index];

  const handleResult = (wasCorrect) => {
    if (wasCorrect) setCorrectCount(n => n + 1);
    else setMissed(m => [...m, current]);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
    } else {
      setIndex(queue.length); // triggers summary
    }
  };

  const retryMissed = () => {
    setQueue(shuffle(missed));
    setMissed([]);
    setIndex(0);
    setCorrectCount(0);
    setRound(r => r + 1);
  };

  const studyAgain = () => {
    setQueue(shuffle(initialQueue));
    setMissed([]);
    setIndex(0);
    setCorrectCount(0);
    setRound(1);
  };

  if (index >= queue.length) {
    const perfect = missed.length === 0;
    return (
      <div>
        <button onClick={onExit} style={{
          background: "none", border: "none", color: "#8CA0C2", display: "flex", alignItems: "center",
          gap: 6, fontFamily: "Inter, sans-serif", fontSize: 14, padding: "10px 4px", minHeight: 44, marginBottom: 14, WebkitTapHighlightColor: "transparent",
        }}><ArrowLeft size={15} /> Change deck</button>
        <div style={{
          background: "var(--card-bg)", borderRadius: 12, padding: 28, textAlign: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)", animation: "popIn 0.2s ease-out",
        }}>
          <p style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 22, color: "var(--text-strong)", margin: "0 0 6px" }}>
            Round {round} complete
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "var(--text-secondary)", margin: "0 0 20px" }}>
            {correctCount} of {queue.length} correct
          </p>
          {perfect && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#5C7A44", fontWeight: 600, margin: "0 0 16px" }}>
              Perfect round! 🎉
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {!perfect && (
              <PrimaryButton onClick={retryMissed}>
                <RotateCcw size={16} /> Retry {missed.length} missed card{missed.length !== 1 ? "s" : ""}
              </PrimaryButton>
            )}
            {perfect ? (
              <PrimaryButton onClick={studyAgain}>
                <Shuffle size={16} /> Study again
              </PrimaryButton>
            ) : (
              <GhostButton onClick={studyAgain} style={{ color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
                <Shuffle size={16} /> Study again
              </GhostButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onExit} style={{
          background: "none", border: "none", color: "#8CA0C2", display: "flex", alignItems: "center",
          gap: 6, fontFamily: "Inter, sans-serif", fontSize: 14, padding: "10px 4px", minHeight: 44, WebkitTapHighlightColor: "transparent",
        }}><ArrowLeft size={15} /> Exit</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8CA0C2" }}>
          {index + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar value={(index) / queue.length} />
      <div style={{ height: 20 }} />
      {current.mode === "flip" && <FlipCard key={current.id} card={current} onResult={handleResult} />}
      {current.mode === "mcq" && <McqCard key={current.id} card={current} allCards={allCards} onResult={handleResult} />}
      {current.mode === "write" && <WriteCard key={current.id} card={current} onResult={handleResult} />}
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value * 100}%`, background: "#F2C572", transition: "width 0.3s" }} />
    </div>
  );
}

function CardShell({ children, tabLabel, tabColor }) {
  return (
    <div style={{ position: "relative", animation: "popIn 0.25s ease-out" }}>
      {tabLabel && <IndexCardTab color={tabColor || "#2F6F6D"} label={tabLabel} />}
      <div style={{
        background: "var(--card-bg)", borderRadius: "2px 12px 12px 12px", padding: "28px 22px 22px",
        minHeight: 220, boxShadow: "0 6px 20px rgba(0,0,0,0.3)", position: "relative",
      }}>
        {children}
        <PunchHole />
      </div>
    </div>
  );
}

function CardFace({ text, imageId, size }) {
  const src = imageId ? imageStore.getImage(imageId) : null;
  if (imageId) {
    return src
      ? <img src={src} alt={text || ""} style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, objectFit: "contain" }} />
      : <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "var(--text-faint)", margin: 0 }}>Picture not available on this device</p>;
  }
  return (
    <p style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: size || 21, color: "var(--text-strong)", margin: 0, lineHeight: 1.4 }}>
      {text}
    </p>
  );
}

function FlipCard({ card, onResult }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <CardShell tabLabel="Flip">
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          cursor: "pointer", minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center",
          textAlign: "center", animation: flipped ? "flipIn 0.25s ease-out" : "none",
        }}>
        {flipped
          ? <CardFace text={card.back} imageId={card.backImageId} />
          : <CardFace text={card.front} imageId={card.frontImageId} />}
      </div>
      <p style={{ textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", margin: "8px 0 18px" }}>
        {flipped ? "That's the answer" : "Tap the card to reveal the answer"}
      </p>
      {flipped ? (
        <div style={{ display: "flex", gap: 8 }}>
          <GhostButton onClick={() => onResult(false)} style={{ flex: 1, color: "#B5533C", borderColor: "#B5533C" }}>Missed it</GhostButton>
          <PrimaryButton onClick={() => onResult(true)} style={{ flex: 1, background: "#5C7A44", color: "#FBF7EC" }}>Got it</PrimaryButton>
        </div>
      ) : (
        <div style={{ height: 40 }} />
      )}
    </CardShell>
  );
}

function McqCard({ card, allCards, onResult }) {
  const [options, setOptions] = useState(null);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    const manual = card.manualOptions || [];
    let pool = manual.filter(o => normalize(o) !== normalize(card.back));
    if (pool.length < 3) {
      const sameCategory = allCards.filter(c => c.id !== card.id && c.nodeId === card.nodeId).map(c => c.back);
      const sameSubject = allCards.filter(c => c.id !== card.id && c.subjectId === card.subjectId).map(c => c.back);
      const others = allCards.filter(c => c.id !== card.id).map(c => c.back);
      const candidates = shuffle([...new Set([...sameCategory, ...sameSubject, ...others])])
        .filter(o => normalize(o) !== normalize(card.back) && !pool.includes(o));
      pool = [...pool, ...candidates].slice(0, 3);
    } else {
      pool = shuffle(pool).slice(0, 3);
    }
    setOptions(shuffle([card.back, ...pool]));
    setPicked(null);
  }, [card.id]);

  if (!options) return null;
  const answered = picked !== null;

  return (
    <CardShell tabLabel="Multiple choice" tabColor="#C98A2B">
      <div style={{ marginBottom: 18 }}>
        <CardFace text={card.front} imageId={card.frontImageId} size={19} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt, i) => {
          const isCorrect = normalize(opt) === normalize(card.back);
          let bg = "var(--input-bg)", border = "var(--card-border)", color = "var(--text-strong)";
          if (answered) {
            if (isCorrect) { bg = "#5C7A44"; border = "#5C7A44"; color = "#FBF7EC"; }
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
          background: isCorrect ? "#5C7A44" : "#B5533C", color: "#FBF7EC", fontFamily: "Inter, sans-serif", fontSize: 13.5,
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
