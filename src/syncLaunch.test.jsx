// @vitest-environment jsdom
//
// The sync engine, driven end to end through the hook against a fake account.
//
// 2026-10-03, a real report: "I move the cards out of Cards without a folder
// into a folder, the folder deletes itself and the cards are back in Cards
// without a folder." The account showed it plainly — 28 cards refiled at
// 10:56 into a folder that was no longer in the subject tree by 11:45. The
// card move had synced (cards travel as their own documents); the folder had
// not survived, because the tree still rides the parent document whole.
//
// Every test here is a way for a device holding an older tree to write it
// back over a newer one without anybody editing a folder:
//   * opening the app (the save effect counted its own re-runs as edits)
//   * the day rolling over (a per-minute tick that fires at launch and on
//     resume — an edit to `game`, and the game used to carry the tree with it)
//   * studying (same: every grade pushed the whole subject tree)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@capacitor-firebase/firestore", () => ({ FirebaseFirestore: {} }));
vi.mock("@capacitor-firebase/authentication", () => ({ FirebaseAuthentication: {} }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => "web" },
  registerPlugin: () => ({}),
}));

// A one-document "Firestore". Listener delivery can be held back, which is
// how a resumed phone looks: its own edits run before the snapshot arrives.
const remote = { parent: null, cards: {}, listeners: [], hold: false, writes: [] };
const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
function emitParent() {
  for (const cb of remote.listeners) cb(clone(remote.parent));
}
// Another device's write: lands in the account, reaches us only on emit.
function otherDeviceWrites(fields, { merge = true } = {}) {
  remote.parent = merge ? { ...remote.parent, ...fields } : fields;
}

vi.mock("./firebaseSync", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(async () => null),
  onAuthStateChanged: vi.fn(async (cb) => {
    setTimeout(() => cb({ uid: "u1" }), 0);
    return { remove() {} };
  }),
  pullData: vi.fn(async () => clone(remote.parent)),
  pushData: vi.fn(async (uid, payload) => {
    remote.writes.push(clone(payload));
    remote.parent = clone(payload);
  }),
  pushParentData: vi.fn(async (uid, payload) => {
    remote.writes.push(clone(payload));
    remote.parent = { ...remote.parent, ...clone(payload) };
  }),
  listenToData: vi.fn(async (uid, cb) => {
    remote.listeners.push(cb);
    if (!remote.hold) setTimeout(() => cb(clone(remote.parent)), 0);
    return "parent-listener";
  }),
  stopListening: vi.fn(async () => { remote.listeners = []; }),
}));

vi.mock("./cardSync", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    fetchCardMap: vi.fn(async () => ({ ...remote.cards })),
    pushCards: vi.fn(async (uid, cards) => {
      for (const c of cards) remote.cards[c.id] = clone(c);
      return cards.map((c) => c.id);
    }),
    hardDeleteCards: vi.fn(async () => {}),
    listenToCards: vi.fn(async (uid, cb) => {
      setTimeout(() => cb({ ...remote.cards }), 0);
      return "cards-listener";
    }),
    migrateCardsToSubcollection: vi.fn(async () => ({ ...remote.cards })),
  };
});

const { useSyncEngine } = await import("./useSyncEngine");
const G = await import("./gamification");

const STALE_TREE = [{ id: "s1", name: "Biology", children: [] }];
const FRESH_TREE = [{ id: "s1", name: "Biology", children: [{ id: "f-new", name: "Cells", children: [] }] }];
const card = { id: "c1", front: "f", back: "b", nodeId: "f-new", subjectId: "s1", updatedAt: 2000 };
const today = () => G.dayKey();
const sameTree = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const flush = async (ms = 800) => {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
};

function mount() {
  const api = {};
  function Harness() {
    const [subjects, setSubjects] = useState([]);
    const [cards, setCards] = useState([]);
    const [game, setGame] = useState(G.emptyGame());
    const engine = useSyncEngine({
      subjects, cards, game, setSubjects, setCards, setGame,
      setError: () => {},
      migrate: { migrateSubjects: (s) => s, migrateCards: (c) => c },
    });
    Object.assign(api, { subjects, cards, game, setSubjects, setCards, setGame, engine });
    return null;
  }
  const root = createRoot(document.createElement("div"));
  act(() => { root.render(createElement(Harness)); });
  api.unmount = () => act(() => root.unmount());
  return api;
}

function seedDevice({ subjects, updatedAt, game = { ...G.emptyGame(), lastSeenDay: today() } }) {
  window.localStorage.setItem("flashcard-catalog-data", JSON.stringify({
    subjects, cards: [], game, updatedAt, ownerUid: "u1",
  }));
}

beforeEach(() => {
  window.localStorage.clear();
  remote.listeners = [];
  remote.hold = false;
  remote.writes = [];
  remote.cards = { c1: card };
  remote.parent = {
    subjects: FRESH_TREE, cards: [], game: { ...G.emptyGame(), lastSeenDay: today() },
    updatedAt: 2000, ownerUid: "u1", cardsMigratedAt: 500,
  };
});

describe("launching a device that holds an older copy of the tree", () => {
  it("adopts the cloud's newer folder instead of pushing its own tree over it", async () => {
    seedDevice({ subjects: STALE_TREE, updatedAt: 1000 });
    const api = mount();
    await flush();

    expect(remote.parent.subjects).toEqual(FRESH_TREE);
    expect(remote.writes.some((w) => sameTree(w.subjects, STALE_TREE))).toBe(false);
    expect(api.subjects).toEqual(FRESH_TREE);
    // And the card is in its folder, not "without a folder".
    expect(api.cards.map((c) => c.nodeId)).toEqual(["f-new"]);
    api.unmount();
  });

  it("does not count the day rolling over as an edit", async () => {
    // The first launch of a day rolls `game` over (lastSeenDay, quests). That
    // used to be stamped "now" like any edit, which made a device asleep since
    // yesterday the newest word on everything it held — here, yesterday's XP
    // over the 50 another device earned this morning.
    const yesterday = { ...G.emptyGame(), lastSeenDay: "2026-01-01" };
    seedDevice({ subjects: STALE_TREE, updatedAt: 1000, game: { ...yesterday, xp: 0 } });
    remote.parent.game = { ...yesterday, xp: 50 };
    const api = mount();
    await flush();

    expect(remote.parent.game.xp).toBe(50);
    expect(api.game.xp).toBe(50);
    expect(api.game.lastSeenDay).toBe(today());
    expect(api.subjects).toEqual(FRESH_TREE);
    api.unmount();
  });

  it("still pushes a genuine edit made after launch", async () => {
    // The guard is "was this an edit", not "never push": a folder added on
    // this device after it has caught up has to reach the cloud.
    seedDevice({ subjects: STALE_TREE, updatedAt: 1000 });
    const api = mount();
    await flush();

    const edited = [...api.subjects, { id: "s2", name: "History", children: [] }];
    act(() => { api.setSubjects(edited); });
    await flush();

    expect(remote.parent.subjects).toEqual(edited);
    expect(remote.parent.updatedAt).toBeGreaterThan(2000);
    api.unmount();
  });
});

describe("a device that is behind on folders, studying", () => {
  it("never writes its tree when only the game changed", async () => {
    // The resumed phone: in sync as of yesterday, the web app has since made a
    // folder, and the phone grades a card before the snapshot reaches it.
    remote.parent.subjects = STALE_TREE;
    remote.parent.updatedAt = 1000;
    seedDevice({ subjects: STALE_TREE, updatedAt: 1000 });
    const api = mount();
    await flush();

    remote.hold = true;
    otherDeviceWrites({ subjects: FRESH_TREE, subjectsUpdatedAt: 2000, updatedAt: 2000, parentStamp: 2000 });
    // Graded a card: XP moves, the tree does not.
    act(() => { api.setGame((g) => ({ ...g, xp: (g.xp || 0) + 10 })); });
    await flush();

    expect(remote.parent.subjects).toEqual(FRESH_TREE);
    expect(remote.parent.game.xp).toBe(10);

    // The snapshot arrives late. It must still bring the folder in, even
    // though this device's own game write is now the newer one.
    act(() => emitParent());
    await flush(50);
    expect(api.subjects).toEqual(FRESH_TREE);
    expect(api.game.xp).toBe(10);
    api.unmount();
  });

  it("still takes a tree written by an older build that knows nothing of subjectsUpdatedAt", async () => {
    // A 1.7.0 client merges `subjects` and `updatedAt` but leaves this build's
    // subjectsUpdatedAt standing. parentStamp no longer matching updatedAt is
    // how the newer client tells the last writer was an older one.
    seedDevice({ subjects: STALE_TREE, updatedAt: 1000 });
    remote.parent = { ...remote.parent, subjects: STALE_TREE, updatedAt: 1000, subjectsUpdatedAt: 1000, parentStamp: 1000 };
    const api = mount();
    await flush();

    otherDeviceWrites({ subjects: FRESH_TREE, updatedAt: 5000 });
    act(() => emitParent());
    await flush(50);
    expect(api.subjects).toEqual(FRESH_TREE);
    api.unmount();
  });
});
