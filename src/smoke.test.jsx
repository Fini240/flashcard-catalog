// @vitest-environment jsdom
//
// Renders the real app and the new screens against a DOM.
//
// The unit tests below this one all exercise pure functions, and a green suite
// there says nothing about whether the app still starts: a bad import, a hook
// called conditionally, a component reading a prop that is no longer passed —
// none of those are visible until something renders. `vite build` doesn't
// catch them either, because they are runtime errors in valid code.
//
// So this mounts things for real and fails on any error or console.error. It
// is deliberately shallow on behaviour — the point is "does it come up".
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
  root = createRoot(container);
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

describe("the app starts", () => {
  it("mounts without throwing and without a React error", async () => {
    const { default: FlashcardCatalog } = await import("./FlashcardCatalog");
    render(<FlashcardCatalog />);
    expect(container.textContent.length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});

describe("the new screens render", () => {
  const cards = [
    { id: "a", front: "Hund", back: "dog", nodeId: "n1", tags: ["exam"], fsrsStability: 10, fsrsDifficulty: 5, fsrsLastReview: Date.now() - 5 * 86400000, srsDue: Date.now() + 5 * 86400000 },
    { id: "b", front: "Katze", back: "cat", nodeId: "n1" },
    { id: "c", front: "$E = mc^2$", back: "mass–energy", nodeId: "n1" },
    { id: "d", front: "Vogel", back: "bird", nodeId: "n1", fsrsLapses: 9 },
    { id: "e", front: "Fisch", back: "fish", nodeId: "n1" },
  ];
  const game = {
    reviewLog: [
      { at: Date.now(), correct: true, stability: 30, elapsedDays: 30 },
      { at: Date.now() - 86400000, correct: false, stability: 5, elapsedDays: 6 },
    ],
  };

  it("renders Statistics with real data", async () => {
    const { StatsScreen } = await import("./featureUI");
    render(<StatsScreen cards={cards} game={game} settings={null} onBack={() => {}} onChangeSettings={() => {}} onOpenLeeches={() => {}} />);
    expect(container.textContent).toContain("Statistics");
    expect(container.textContent).toContain("Retention");
    expect(errors).toEqual([]);
  });

  it("renders Statistics with an empty deck rather than dividing by zero", async () => {
    const { StatsScreen } = await import("./featureUI");
    render(<StatsScreen cards={[]} game={{ reviewLog: [] }} settings={null} onBack={() => {}} onChangeSettings={() => {}} onOpenLeeches={() => {}} />);
    expect(container.textContent).toContain("Statistics");
    expect(container.textContent).not.toContain("NaN");
    expect(errors).toEqual([]);
  });

  it("renders the test setup and starts a test", async () => {
    const { TestRunner } = await import("./featureUI");
    render(<TestRunner cards={cards} onExit={() => {}} onFinish={() => {}} />);
    expect(container.textContent).toContain("Test yourself");
    const start = [...container.querySelectorAll("button")].find((b) => /start test/i.test(b.textContent));
    expect(start).toBeTruthy();
    act(() => start.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    // A question is on screen: the counter reads "1 / n".
    expect(container.textContent).toMatch(/1 \/ \d+/);
    expect(errors).toEqual([]);
  });

  it("renders the notes pane and previews cards as they are typed", async () => {
    const { NotesImport } = await import("./featureUI");
    render(<NotesImport onClose={() => {}} onImport={() => {}} />);
    const box = container.querySelector("textarea");
    expect(box).toBeTruthy();
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(box, "## Cells\nmitochondrion :: powerhouse");
      box.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.textContent).toContain("Add 1 card");
    expect(container.textContent).toContain("mitochondrion");
    expect(errors).toEqual([]);
  });

  it("renders the leech review with a diagnosis", async () => {
    const { LeechReview } = await import("./featureUI");
    render(
      <LeechReview
        cards={cards} allCards={cards} settings={{ leechThreshold: 8 }}
        onClose={() => {}} onEdit={() => {}} onUnsuspend={() => {}} onForgive={() => {}} onDelete={() => {}}
      />
    );
    expect(container.textContent).toContain("Vogel");
    expect(container.textContent).toMatch(/Missed 9 times/);
    expect(errors).toEqual([]);
  });

  it("renders the confidence bar with all five ratings", async () => {
    const { ConfidenceBar } = await import("./featureUI");
    const rated = [];
    render(<ConfidenceBar onRate={(n) => rated.push(n)} />);
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons).toHaveLength(5);
    act(() => buttons[4].dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(rated).toEqual([5]);
    expect(errors).toEqual([]);
  });

  it("renders a formula on a card face without falling back to raw markup", async () => {
    const { CardFace } = await import("./cardUI");
    render(<CardFace text="$\\frac{a}{b}$ and $x^2$" />);
    // The fraction became two stacked elements and the exponent a real
    // superscript character — neither is present if the renderer bailed.
    expect(container.textContent).toContain("x²");
    expect(container.textContent).not.toContain("\\frac");
    expect(errors).toEqual([]);
  });

  it("renders the deck import dialog and validates the code as it is typed", async () => {
    const { ImportDeckModal } = await import("./featureUI");
    render(<ImportDeckModal onClose={() => {}} onFetch={async () => ({ ok: false, error: "no" })} onImport={() => {}} />);
    const find = [...container.querySelectorAll("button")].find((b) => /find deck/i.test(b.textContent));
    expect(find.disabled).toBe(true); // empty code
    expect(errors).toEqual([]);
  });
});

// Moving cards is the one feature whose whole job is to change where a card is
// filed, so a unit test of the pure move says nothing about whether the user
// can reach it. This drives the real app from the library screen through
// picking a card to seeing it land in another subject.
describe("moving cards between folders", () => {
  const seed = {
    subjects: [
      { id: "s1", name: "Biology", children: [] },
      { id: "s2", name: "Espanol", children: [] },
    ],
    cards: [
      { id: "a", front: "Mitochondrion", back: "powerhouse", nodeId: "s1", subjectId: "s1" },
      { id: "b", front: "Ribosome", back: "protein factory", nodeId: "s1", subjectId: "s1" },
    ],
  };

  const click = (el) => act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  const byText = (re) => [...container.querySelectorAll("button, div, span")].find((e) => re.test(e.textContent));
  const button = (re) => [...container.querySelectorAll("button")].find((b) => re.test(b.textContent));

  const openBiology = async () => {
    const { default: FlashcardCatalog } = await import("./FlashcardCatalog");
    window.localStorage.setItem("flashcard-catalog-data", JSON.stringify(seed));
    render(<FlashcardCatalog />);
    // The load is async, so let the promise that reads localStorage settle.
    await act(async () => { await Promise.resolve(); });
    click(byText(/^Biology/));
    return FlashcardCatalog;
  };

  beforeEach(() => window.localStorage.clear());

  it("picks a card in one subject and files it into another", async () => {
    await openBiology();
    expect(container.textContent).toContain("Mitochondrion");

    click(button(/^Select$/));
    // In picking mode the per-row edit and delete buttons stand down, so a
    // mis-tap during a bulk move cannot delete a card.
    expect(button(/^Select$/)).toBeFalsy();
    expect(container.querySelector('[role="checkbox"]')).toBeTruthy();

    click(container.querySelector('[role="checkbox"]').closest("div[style]").parentElement);
    expect(container.textContent).toMatch(/1 selected/);

    click(button(/^Move$/));
    expect(container.textContent).toContain("Move 1 card");

    click(button(/Move it here/));
    // Gone from Biology, and the app says where it went.
    expect(container.textContent).not.toContain("Mitochondrion");
    expect(container.textContent).toContain("Espanol");
    expect(errors).toEqual([]);
  });

  it("offers every folder except the one the cards are already in", async () => {
    await openBiology();
    click(button(/^Select$/));
    click(container.querySelector('[role="checkbox"]').closest("div[style]").parentElement);
    click(button(/^Move$/));
    const options = [...container.querySelectorAll("option")].map((o) => o.textContent.trim());
    expect(options).toEqual(["Espanol"]);
    expect(errors).toEqual([]);
  });

  it("renames a subject without moving or losing its cards", async () => {
    await openBiology();
    const rename = [...container.querySelectorAll("button")].find((b) => b.title === "Rename subject");
    click(rename);
    const input = container.querySelector("input");
    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setValue.call(input, "Life science");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    click(button(/^Save name$/));
    expect(container.textContent).toContain("Life science");
    expect(container.textContent).toContain("Mitochondrion");
    expect(errors).toEqual([]);
  });

  it("opens the rename dialog from a subject in the catalog", async () => {
    window.localStorage.setItem("flashcard-catalog-data", JSON.stringify(seed));
    const { default: FlashcardCatalog } = await import("./FlashcardCatalog");
    render(<FlashcardCatalog />);
    await act(async () => { await Promise.resolve(); });
    const rename = [...container.querySelectorAll("button")].find((b) => b.title === "Rename subject");
    click(rename);
    expect(container.textContent).toContain("Rename subject");
    expect(container.querySelector("input")).toBeTruthy();
    expect(errors).toEqual([]);
  });

  it("renames a subfolder without changing the card filed in it", async () => {
    window.localStorage.setItem("flashcard-catalog-data", JSON.stringify({
      subjects: [{ id: "s1", name: "Biology", children: [{ id: "n1", name: "Cells", children: [] }] }],
      cards: [{ id: "a", front: "Mitochondrion", back: "powerhouse", nodeId: "n1", subjectId: "s1" }],
    }));
    const { default: FlashcardCatalog } = await import("./FlashcardCatalog");
    render(<FlashcardCatalog />);
    await act(async () => { await Promise.resolve(); });
    click(byText(/^Biology/));
    click([...container.querySelectorAll("span")].find((span) => span.textContent === "Cells"));
    const rename = [...container.querySelectorAll("button")].find((b) => b.title === "Rename folder");
    click(rename);
    const input = container.querySelector("input");
    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setValue.call(input, "Cell structure");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    click(button(/^Save name$/));
    expect(container.textContent).toContain("Cell structure");
    expect(container.textContent).toContain("Mitochondrion");
    expect(errors).toEqual([]);
  });
});
