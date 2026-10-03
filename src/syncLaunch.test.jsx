// @vitest-environment jsdom
//
// Opening the app is not an edit.
//
// 2026-10-03, a real report: "I move the cards out of Cards without a folder
// into a folder, the folder deletes itself and the cards are back in Cards
// without a folder." The account showed it plainly — 28 cards refiled at
// 10:56 into a folder that was no longer in the subject tree by 11:45. The
// card move had synced (cards travel as their own documents); the folder had
// not survived, because the tree still rides the parent document whole.
//
// What overwrote it was a device simply being opened. The save effect stamped
// `updatedAtRef = Date.now()` on every run, including the one that only
// hydrated localStorage and the one that only restored the Google session. A
// device holding yesterday's tree therefore looked newer than the cloud the
// moment it launched, declined the real tree as "older", and pushed its own
// over it. These tests pin the launch path end to end through the hook.
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

const remoteState = { parent: null, cards: {} };
const pushedParents = [];

vi.mock("./firebaseSync", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(async () => null),
  onAuthStateChanged: vi.fn(async (cb) => {
    setTimeout(() => cb({ uid: "u1" }), 0);
    return { remove() {} };
  }),
  pullData: vi.fn(async () => remoteState.parent && JSON.parse(JSON.stringify(remoteState.parent))),
  pushData: vi.fn(async (uid, payload) => { pushedParents.push(payload); remoteState.parent = payload; }),
  pushParentData: vi.fn(async (uid, payload) => {
    pushedParents.push(payload);
    remoteState.parent = { ...remoteState.parent, ...payload };
  }),
  listenToData: vi.fn(async (uid, cb) => {
    setTimeout(() => cb(remoteState.parent && JSON.parse(JSON.stringify(remoteState.parent))), 0);
    return "parent-listener";
  }),
  stopListening: vi.fn(async () => {}),
}));

vi.mock("./cardSync", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    fetchCardMap: vi.fn(async () => ({ ...remoteState.cards })),
    pushCards: vi.fn(async (uid, cards) => cards.map((c) => c.id)),
    hardDeleteCards: vi.fn(async () => {}),
    listenToCards: vi.fn(async (uid, cb) => {
      setTimeout(() => cb({ ...remoteState.cards }), 0);
      return "cards-listener";
    }),
    migrateCardsToSubcollection: vi.fn(async () => ({ ...remoteState.cards })),
  };
});

const { useSyncEngine } = await import("./useSyncEngine");
const G = await import("./gamification");

const STALE_TREE = [{ id: "s1", name: "Biology", children: [] }];
const FRESH_TREE = [{ id: "s1", name: "Biology", children: [{ id: "f-new", name: "Cells", children: [] }] }];
const card = { id: "c1", front: "f", back: "b", nodeId: "f-new", subjectId: "s1", updatedAt: 2000 };

const flush = async (ms) => {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
};

function mount() {
  const state = {};
  function Harness() {
    const [subjects, setSubjects] = useState([]);
    const [cards, setCards] = useState([]);
    const [game, setGame] = useState(G.emptyGame());
    useSyncEngine({
      subjects, cards, game, setSubjects, setCards, setGame,
      setError: () => {},
      migrate: { migrateSubjects: (s) => s, migrateCards: (c) => c },
    });
    state.subjects = subjects;
    state.cards = cards;
    return null;
  }
  const root = createRoot(document.createElement("div"));
  act(() => { root.render(createElement(Harness)); });
  return { state, root };
}

describe("launching a device that holds an older copy of the tree", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushedParents.length = 0;
    // This device last synced at t=1000, before the folder existed.
    window.localStorage.setItem("flashcard-catalog-data", JSON.stringify({
      subjects: STALE_TREE, cards: [], game: G.emptyGame(), updatedAt: 1000, ownerUid: "u1",
    }));
    // Another device has since created a folder and filed a card into it.
    remoteState.parent = {
      subjects: FRESH_TREE, cards: [], game: G.emptyGame(),
      updatedAt: 2000, ownerUid: "u1", cardsMigratedAt: 500,
    };
    remoteState.cards = { c1: card };
  });

  it("adopts the cloud's newer folder instead of pushing its own tree over it", async () => {
    const { state, root } = mount();
    await flush(800);

    expect(remoteState.parent.subjects).toEqual(FRESH_TREE);
    expect(pushedParents.every((p) => JSON.stringify(p.subjects) !== JSON.stringify(STALE_TREE))).toBe(true);
    expect(state.subjects).toEqual(FRESH_TREE);
    // And the card is in its folder, not "without a folder".
    expect(state.cards.map((c) => c.nodeId)).toEqual(["f-new"]);
    act(() => root.unmount());
  });

  it("still pushes a genuine edit made after launch", async () => {
    // The guard must be "was this an edit", not "never push": a folder added
    // on this device after it has caught up has to reach the cloud.
    let api;
    const { root } = (() => {
      const r = createRoot(document.createElement("div"));
      function Harness() {
        const [subjects, setSubjects] = useState([]);
        const [cards, setCards] = useState([]);
        const [game, setGame] = useState(G.emptyGame());
        useSyncEngine({
          subjects, cards, game, setSubjects, setCards, setGame,
          setError: () => {},
          migrate: { migrateSubjects: (s) => s, migrateCards: (c) => c },
        });
        api = { subjects, setSubjects };
        return null;
      }
      act(() => { r.render(createElement(Harness)); });
      return { root: r };
    })();
    await flush(800);

    const edited = [...api.subjects, { id: "s2", name: "History", children: [] }];
    act(() => { api.setSubjects(edited); });
    await flush(800);

    expect(remoteState.parent.subjects).toEqual(edited);
    expect(remoteState.parent.updatedAt).toBeGreaterThan(2000);
    act(() => root.unmount());
  });
});
