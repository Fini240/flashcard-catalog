// @vitest-environment jsdom
// Regression coverage for the 2026-10-04 editor/import/export audit.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

// React refuses to run act() outside a test environment that says it is one,
// and warns through console.error — which these tests treat as a failure, so
// without this every assertion on `errors` fails for a reason that has nothing
// to do with the app.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Capacitor's plugins expect a native bridge; without these the module-level
// imports throw before any component is reached.
vi.mock("@capacitor-firebase/firestore", () => ({ FirebaseFirestore: {} }));
// Enough of the auth plugin to survive a session restore. An empty object is
// fine while nothing awaits the restore, but any test that lets a microtask run
// reaches `addListener` and reports a TypeError that has nothing to do with
// what is being tested.
vi.mock("@capacitor-firebase/authentication", () => ({
  FirebaseAuthentication: {
    addListener: async () => ({ remove() {} }),
    getCurrentUser: async () => ({ user: null }),
  },
}));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: {} }));
vi.mock("@capacitor-mlkit/text-recognition", () => ({ TextRecognition: {} }));
vi.mock("@capacitor/filesystem", () => ({ Filesystem: {}, Directory: {}, Encoding: {} }));
vi.mock("@capacitor/share", () => ({ Share: {} }));
vi.mock("@capacitor/browser", () => ({ Browser: {} }));
vi.mock("@capacitor/app", () => ({ App: { addListener: () => Promise.resolve({ remove() {} }) } }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => "web" },
  registerPlugin: () => ({}),
}));
// pdf.js touches DOMMatrix at import time, which jsdom does not implement.
// That is a gap in the test DOM rather than a problem with the app — the real
// browser has it — so the module is stubbed to keep the mount reachable.
vi.mock("./fileImport", () => ({
  isSupportedFile: () => false,
  extractText: async () => "",
  SUPPORTED_EXTENSIONS: [],
}));

let container;
let root;
let errors;

beforeEach(() => {
  errors = [];
  vi.spyOn(console, "error").mockImplementation((...args) => errors.push(args.join(" ")));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container, { onUncaughtError: e => errors.push(e.message) });
  window.matchMedia = window.matchMedia || ((q) => ({
    matches: false, media: q, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  }));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

const render = (el) => {
  act(() => root.render(el));
  return container;
};


const clone = x => JSON.parse(JSON.stringify(x));
const cloud = vi.hoisted(() => ({ parent: null, cards: {}, writes: [], signedIn: false }));
vi.mock("./firebaseSync", () => ({
  onAuthStateChanged: async cb => { setTimeout(() => cb(cloud.signedIn ? { uid: "audit" } : null), 0); return { remove() {} }; },
  pullData: async () => clone(cloud.parent),
  pushParentData: async (_uid, data) => { cloud.writes.push(clone(data)); cloud.parent = { ...cloud.parent, ...clone(data) }; },
  pushData: async (_uid, data) => { cloud.parent = clone(data); },
  listenToData: async (_uid, cb) => { setTimeout(() => cb(clone(cloud.parent)), 0); return "parent"; },
  stopListening: async () => {},
  signIn: async () => ({ uid: "audit" }), signOut: async () => {},
}));
vi.mock("./cardSync", async original => ({
  ...await original(),
  fetchCardMap: async () => clone(cloud.cards),
  pushCards: async (_uid, cards) => { for (const c of cards) cloud.cards[c.id] = clone(c); return cards.map(c => c.id); },
  listenToCards: async (_uid, cb) => { setTimeout(() => cb(clone(cloud.cards)), 0); return "cards"; },
  migrateCardsToSubcollection: async () => clone(cloud.cards),
  hardDeleteCards: async () => {},
}));
const wait = async (ms = 30) => act(async () => { await new Promise(r => setTimeout(r, ms)); });
const click = el => { expect(el, "UI control exists").toBeTruthy(); act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true }))); };
const button = re => [...container.querySelectorAll("button")].find(b => re.test(b.textContent.trim()));
const titled = title => [...container.querySelectorAll("button")].find(b => b.title === title);
const type = (el, text) => act(() => {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, text);
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
const base = {
  subjects: [{ id: "s1", name: "Biology", children: [] }],
  cards: [{ id: "c1", nodeId: "s1", subjectId: "s1", front: "Question", back: "Answer", updatedAt: 1000 }],
};
async function start(data = base, signedIn = false) {
  const { APP_VERSION } = await import("./whatsNew");
  const G = await import("./gamification");
  const payload = { ...clone(data), game: { ...G.emptyGame(), username: "audit", lastSeenDay: G.dayKey() }, updatedAt: 1000, subjectsUpdatedAt: 1000, ownerUid: signedIn ? "audit" : null };
  localStorage.clear();
  localStorage.setItem("flashcard-catalog-seen-version", APP_VERSION);
  localStorage.setItem("flashcard-catalog-apk-banner-dismissed", "1");
  localStorage.setItem("flashcard-catalog-data", JSON.stringify(payload));
  cloud.parent = { ...clone(payload), cardsMigratedAt: 500, parentStamp: 1000 };
  cloud.cards = Object.fromEntries(payload.cards.map(c => [c.id, c]));
  cloud.writes = []; cloud.signedIn = signedIn;
  URL.createObjectURL = () => "blob:audit"; URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const { default: App } = await import("./FlashcardCatalog");
  render(<App />); await wait(80); await wait(500);
}
const openBiology = () => click([...container.querySelectorAll(".fc-node-open span")].find(e => e.textContent === "Biology")?.closest("button"));

describe("catalog data integrity", () => {
  it("correcting a basic card typo preserves its learned schedule", async () => {
    const learned = { ...base.cards[0], srsBox: 4, srsPeak: 4, srsDue: Date.now() + 86400000 * 10, fsrsStability: 15, fsrsDifficulty: 4, fsrsReps: 12, fsrsLapses: 1, fsrsLastReview: Date.now() - 86400000 };
    await start({ ...base, cards: [learned] }); openBiology(); click(titled("Edit"));
    type(container.querySelector("textarea"), "Question corrected"); click(button(/^Save card$/)); await wait(500);
    const saved = JSON.parse(localStorage.getItem("flashcard-catalog-data")).cards[0];
    expect(saved.front).toBe("Question corrected");
    expect(saved.srsDue).toBe(learned.srsDue);
    expect(saved.srsBox).toBe(4);
    expect(saved.fsrsReps).toBe(12);
  });

  it("rejecting a malformed backup leaves the current catalog intact", async () => {
    await start(base, true); click(titled("Settings"));
    const input = container.querySelector('input[type="file"][accept="application/json,.json"]');
    const file = { name: "malformed.json", text: async () => JSON.stringify({ subjects: [], cards: [null] }) };
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    act(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    click(button(/^Import and replace$/)); await wait(650);
    expect(container.textContent).toContain("invalid card");
    await wait(500);
    const saved = JSON.parse(localStorage.getItem("flashcard-catalog-data"));
    expect.soft(saved.subjects).toEqual(base.subjects);
    expect.soft(cloud.parent.subjects).toEqual(base.subjects);
    expect(saved.cards.map(c => c.id)).toEqual(["c1"]);
  });

  it("CSV export leaves the settings screen usable", async () => {
    await start(); click(titled("Settings")); click(button(/^Export CSV$/)); await wait();
    expect(errors).toEqual([]);
    expect(container.textContent).toContain("Export CSV");
  });
  it("notes importing a new folder below an existing subject publishes that folder", async () => {
    await start(base, true); cloud.writes = [];
    openBiology(); click(titled("Add")); click(button(/^Write notes$/));
    type(container.querySelector("textarea"), "# Biology\n## New chapter\nTerm :: Definition");
    click(button(/^Add 1 card$/)); await wait(650); await wait(100);
    const saved = JSON.parse(localStorage.getItem("flashcard-catalog-data"));
    expect(saved.subjects[0].children.map(c => c.name)).toContain("New chapter");
    const added = Object.values(cloud.cards).find(c => c.front === "Term");
    expect(added).toBeTruthy();
    expect(added.subjectId).toBe("s1");
    expect(cloud.parent.subjects[0].children.map(c => c.name)).toContain("New chapter");
  });
  it("canceling image removal keeps the original card picture", async () => {
    const data = { ...base, cards: [{ ...base.cards[0], front: "", frontImageId: "cancel-image" }] };
    await start(data); localStorage.setItem("fc-img-cancel-image", "data:image/png;base64,AAAA");
    openBiology(); click(titled("Edit")); click(button(/^Remove$/)); click(button(/^Cancel$/)); await wait();
    const store = await import("./imageStore");
    await wait(500);
    expect(JSON.parse(localStorage.getItem("flashcard-catalog-data")).cards[0].frontImageId).toBe("cancel-image");
    expect(await store.getImage("cancel-image")).toBe("data:image/png;base64,AAAA");
  });
  it("deleting one occlusion card keeps the shared diagram for its sibling", async () => {
    const masks = [{ id: "m1", x: 0, y: 0, w: .2, h: .2, label: "Heart" }, { id: "m2", x: .4, y: .4, w: .2, h: .2, label: "Lung" }];
    const { expand } = await import("./occlusion"); let id = 0;
    const cards = expand("shared-diagram", masks, { base: { nodeId: "s1", subjectId: "s1" } }).map(c => ({ ...c, id: `mask-${++id}` }));
    await start({ ...base, cards }); localStorage.setItem("fc-img-shared-diagram", "data:image/png;base64,BBBB");
    openBiology(); click(titled("Delete")); await wait(500);
    const saved = JSON.parse(localStorage.getItem("flashcard-catalog-data"));
    expect(saved.cards).toHaveLength(1);
    const store = await import("./imageStore");
    expect(await store.getImage(saved.cards[0].frontImageId)).toBe("data:image/png;base64,BBBB");
  });
  it("Anki export shows a success message instead of rendering its delivery object", async () => {
    const exporters = await import("./exporters");
    vi.spyOn(exporters, "toAnkiPackage").mockResolvedValue(new Blob(["package"]));
    await start(); click(titled("Settings")); click(button(/^Export to Anki$/)); await wait();
    expect(container.textContent).toContain("Anki deck saved.");
    expect(errors).toEqual([]);
  });
  async function pictureCard(id) {
    await start({ ...base, cards: [{ ...base.cards[0], front: "", frontImageId: id }] });
    localStorage.setItem("fc-img-" + id, "data:image/png;base64,ORIGINAL");
    openBiology(); click(titled("Edit"));
  }
  async function replacePicture(id) {
    const store = await import("./imageStore");
    vi.spyOn(store, "saveImage").mockImplementation(async () => {
      localStorage.setItem("fc-img-" + id, "data:image/png;base64,REPLACEMENT"); return id;
    });
    const input = container.querySelector('input[type="file"][accept="image/*"]');
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["image"], "diagram.png", { type: "image/png" })] });
    act(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    await wait();
    return store;
  }
  it("canceling a picture replacement keeps the original and cleans up the unused replacement", async () => {
    await pictureCard("replace-cancel-original");
    const store = await replacePicture("replace-cancel-new"); click(button(/^Cancel$/)); await wait();
    expect(await store.getImage("replace-cancel-original")).toBe("data:image/png;base64,ORIGINAL");
    expect(await store.getImage("replace-cancel-new")).toBeNull();
  });
  it("saving a picture replacement keeps the new image and releases the unreferenced original", async () => {
    await pictureCard("replace-save-original");
    const store = await replacePicture("replace-save-new"); click(button(/^Save card$/)); await wait(500);
    const saved = JSON.parse(localStorage.getItem("flashcard-catalog-data")).cards[0];
    expect(saved.frontImageId).toBe("replace-save-new");
    expect(await store.getImage("replace-save-new")).toBe("data:image/png;base64,REPLACEMENT");
    expect(await store.getImage("replace-save-original")).toBeNull();
  });
  it("replacing an occlusion diagram preserves both mask identities and their schedules", async () => {
    const { expand } = await import("./occlusion");
    const masks = [{ id: "m1", x: 0, y: 0, w: .2, h: .2, label: "Heart" }, { id: "m2", x: .4, y: .4, w: .2, h: .2, label: "Lung" }];
    const cards = expand("mask-original", masks, { base: { nodeId: "s1", subjectId: "s1" } }).map((c, i) => ({ ...c, id: "mask-"+i, srsDue: 123456 + i, fsrsReps: 9 + i }));
    await start({ ...base, cards }); localStorage.setItem("fc-img-mask-original", "data:image/png;base64,ORIGINAL");
    openBiology(); click(titled("Edit")); const store = await replacePicture("mask-new");
    click(button(/^Save card$/)); await wait(500);
    const saved = JSON.parse(localStorage.getItem("flashcard-catalog-data")).cards;
    expect(saved.map(c => [c.id, c.srsDue, c.fsrsReps])).toEqual(cards.map(c => [c.id, c.srsDue, c.fsrsReps]));
    expect(saved.every(c => c.frontImageId === "mask-new")).toBe(true);
    expect(await store.getImage("mask-original")).toBeNull();
    expect(await store.getImage("mask-new")).toBe("data:image/png;base64,REPLACEMENT");
  });
  it("deleting the last card using an image releases that image", async () => {
    await start({ ...base, cards: [{ ...base.cards[0], frontImageId: "last-image" }] });
    localStorage.setItem("fc-img-last-image", "data:image/png;base64,LAST"); openBiology(); click(titled("Delete")); await wait(500);
    const store = await import("./imageStore");
    expect(await store.getImage("last-image")).toBeNull();
  });
  it("pasting cards into an existing subject uses the latest catalog reference", async () => {
    await start(); click(button(/^Import$/));
    // The bulk importer is owned by Library, which must receive the sync
    // engine's current-data reference explicitly.
    const inputs = [...container.querySelectorAll("input")];
    const subject = inputs.find(i => i.placeholder === "e.g. Biology (existing or new)");
    const category = inputs.find(i => i.placeholder === "e.g. Cell structure (existing or new)");
    type(subject, "Biology"); type(category, "Imported");
    type(container.querySelector("textarea"), "New term | New definition");
    click(button(/^Import cards$/)); await wait(500);
    const saved = JSON.parse(localStorage.getItem("flashcard-catalog-data"));
    expect(saved.cards.map(c => c.front)).toContain("New term");
    expect(saved.cards.map(c => c.front)).toContain("Question");
  });

  it("canceling while a picture is still being stored discards only the late replacement", async () => {
    await pictureCard("late-original");
    const store = await import("./imageStore"); let resolveImage;
    vi.spyOn(store, "saveImage").mockImplementation(() => new Promise(resolve => { resolveImage = resolve; }));
    const input = container.querySelector('input[type="file"][accept="image/*"]');
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["image"], "diagram.png", { type: "image/png" })] });
    act(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    click(button(/^Cancel$/));
    localStorage.setItem("fc-img-late-new", "data:image/png;base64,LATE");
    await act(async () => { resolveImage("late-new"); await Promise.resolve(); });
    expect(await store.getImage("late-new")).toBeNull();
    expect(await store.getImage("late-original")).toBe("data:image/png;base64,ORIGINAL");
  });

});
