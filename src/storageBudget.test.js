// @vitest-environment jsdom
//
// The budget tests. Every other suite in this app asks whether the data is
// *correct*; these ask whether it still *fits*, which is the other way the
// user loses cards — and the quieter one, because a catalog that was never
// written is still on screen, still right, and gone at the next launch.
//
// Two fixed ceilings bound this app, and neither of them announces itself:
//
//   * localStorage is one per-origin budget — about 5.2 million characters in
//     Chromium, measured against keys and values together — shared by the
//     whole catalog payload and every card picture.
//   * a Firestore document is hard-capped at 1 MiB, and `game` (review log
//     and all) rides the parent document.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@capacitor-firebase/firestore", () => ({ FirebaseFirestore: {} }));
vi.mock("@capacitor-firebase/authentication", () => ({ FirebaseAuthentication: {} }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => "web" },
  registerPlugin: () => ({}),
}));

const { storage, shedForQuota, SHED_LEVELS } = await import("./useSyncEngine");
const { MAX_REVIEW_LOG, appendReviewLog, emptyGame } = await import("./gamification");
const { recentErrors, storageUsage } = await import("./report");

const logEntry = (i) => ({ at: 1789475565578 + i, correct: true, stability: 12.3456789, elapsedDays: 7.25, ms: 3421 });
const fullLog = () => Array.from({ length: MAX_REVIEW_LOG }, (_, i) => logEntry(i));

describe("the review log fits in the document it is synced inside", () => {
  it("stays under Firestore's 1 MiB document cap at the cap", () => {
    // Not a style preference: at 20,000 entries this array was ~1.4 MB, so
    // every parent-doc write a heavy user made would have been rejected
    // outright — taking the subject tree and the game with it, and naming
    // nothing that would have pointed here. JSON is the pessimistic measure —
    // Firestore stores a number in 8 bytes rather than 17 characters — so a
    // JSON figure comfortably under the cap is a real one.
    const bytes = new TextEncoder().encode(JSON.stringify(fullLog())).length;
    expect(bytes).toBeLessThan(0.6 * 1024 * 1024);
  });

  it("keeps the newest answers when it overflows", () => {
    let game = { ...emptyGame(), reviewLog: fullLog() };
    game = { ...game, reviewLog: appendReviewLog(game, { at: 999, correct: false }) };
    expect(game.reviewLog).toHaveLength(MAX_REVIEW_LOG);
    expect(game.reviewLog[game.reviewLog.length - 1].at).toBe(999);
  });
});

describe("shedForQuota — what gets sacrificed when the payload will not fit", () => {
  const payload = () => ({
    subjects: [{ id: "s1", name: "Biology", children: [] }],
    cards: [{ id: "c1", front: "f", back: "b" }],
    cardTombstones: { gone: { id: "gone", deletedAt: 200 } },
    game: { ...emptyGame(), xp: 3034, reviewLog: fullLog() },
    updatedAt: 500,
  });

  it("never sheds the catalog, at any level", () => {
    for (let level = 0; level < SHED_LEVELS; level++) {
      const shed = shedForQuota(payload(), level);
      expect(shed.subjects).toHaveLength(1);
      expect(shed.cards).toHaveLength(1);
      expect(shed.game.xp).toBe(3034);
      expect(shed.updatedAt).toBe(500);
    }
  });

  it("gives up the review log before the tombstones, and both before the cards", () => {
    expect(shedForQuota(payload(), 0).game.reviewLog).toHaveLength(MAX_REVIEW_LOG);
    expect(shedForQuota(payload(), 1).game.reviewLog).toHaveLength(2000);
    expect(shedForQuota(payload(), 2).game.reviewLog).toHaveLength(500);
    expect(shedForQuota(payload(), 1).cardTombstones.gone).toBeTruthy();
    expect(shedForQuota(payload(), 3).game.reviewLog).toHaveLength(0);
    expect(shedForQuota(payload(), 3).cardTombstones).toEqual({});
  });

  it("gets meaningfully smaller each time — a level that saves nothing is a wasted retry", () => {
    const size = (level) => JSON.stringify(shedForQuota(payload(), level)).length;
    expect(size(1)).toBeLessThan(size(0) / 2);
    expect(size(2)).toBeLessThan(size(1));
    expect(size(3)).toBeLessThan(size(2));
  });

  it("survives a payload with no game at all", () => {
    expect(() => shedForQuota({ subjects: [], cards: [] }, 3)).not.toThrow();
  });
});

describe("a full store is reported, not swallowed", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.__lastErrors = [];
  });

  it("reports the failed write, its size and what is using the store", async () => {
    // The failure that produced "my cards keep vanishing": setItem throws,
    // the app carries on with the catalog correct in memory, and the next
    // launch reads the last write that succeeded. It left no trace at all in
    // Copy diagnostics, so it could not be told apart from a sync fault.
    window.localStorage.setItem("fc-img-abc", "x".repeat(2048));
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const e = new Error("exceeded the quota");
      e.name = "QuotaExceededError";
      throw e;
    });
    const ok = await storage.set("flashcard-catalog-data", "y".repeat(5000));
    spy.mockRestore();

    expect(ok).toBe(false);
    const entry = recentErrors().find((e) => e.where === "storage.set");
    expect(entry).toBeTruthy();
    expect(entry.err).toContain("QuotaExceededError");
    expect(entry.err).toContain("5000 chars");
    expect(entry.err).toContain("1 un-migrated picture");
  });

  it("counts the pictures separately, because they are what fills the store", () => {
    window.localStorage.setItem("fc-img-a", "x".repeat(1024 * 100));
    window.localStorage.setItem("fc-img-b", "x".repeat(1024 * 100));
    window.localStorage.setItem("flashcard-catalog-data", "x".repeat(1024 * 10));
    expect(storageUsage()).toContain("2 un-migrated pictures");
  });
});

describe("the diagnostics buffer survives an error that repeats", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.__lastErrors = [];
  });

  it("collapses a repeat instead of flushing the buffer", async () => {
    const { report } = await import("./report");
    report("sync.signIn", new Error("something worth keeping"));
    for (let i = 0; i < 50; i++) report("storage.set", new Error("QuotaExceededError"));
    const errs = recentErrors();
    expect(errs).toHaveLength(2);
    expect(errs[0].where).toBe("sync.signIn");
    expect(errs[1].count).toBe(50);
  });

  it("keeps separate errors separate", async () => {
    const { report } = await import("./report");
    report("a", new Error("one"));
    report("b", new Error("two"));
    report("a", new Error("one"));
    expect(recentErrors().map((e) => e.where)).toEqual(["a", "b", "a"]);
  });
});

describe("the diagnostics buffer outlives the launch that filled it", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.__lastErrors = [];
  });

  it("is still there after a restart", async () => {
    // A real report came back "recent errors (0): (none)" from a device whose
    // cards had been going missing for days — because the user opened the app
    // fresh to fetch it. An in-memory buffer cannot describe a fault that
    // happens at launch, which is most of this app's worst ones.
    const { report } = await import("./report");
    report("sync.push", new Error("permission-denied"));
    await Promise.resolve();
    await Promise.resolve();

    // The restart: memory gone, storage intact.
    delete window.__lastErrors;
    vi.resetModules();
    const fresh = await import("./report");

    const errs = fresh.recentErrors();
    expect(errs).toHaveLength(1);
    expect(errs[0].where).toBe("sync.push");
    expect(fresh.diagnosticsText()).toContain("permission-denied");
  });

  it("costs one write for a burst, not one per error", async () => {
    const { report } = await import("./report");
    const spy = vi.spyOn(Storage.prototype, "setItem");
    for (let i = 0; i < 10; i++) report("sync.push", new Error("attempt " + i));
    await Promise.resolve();
    await Promise.resolve();
    expect(spy.mock.calls.filter((c) => c[0] === "flashcard-catalog-errors")).toHaveLength(1);
    spy.mockRestore();
  });

  it("stays within its cap, so it can never be what fills the store", async () => {
    const { report, recentErrors: recent } = await import("./report");
    for (let i = 0; i < 200; i++) report("where" + i, new Error("e" + i));
    await Promise.resolve();
    await Promise.resolve();
    expect(recent().length).toBeLessThanOrEqual(20);
    expect((window.localStorage.getItem("flashcard-catalog-errors") || "").length).toBeLessThan(20 * 300);
  });

  it("can be cleared, for a second dump after a fix", async () => {
    const { report, clearErrors, recentErrors: recent } = await import("./report");
    report("a", new Error("one"));
    await Promise.resolve();
    clearErrors();
    expect(recent()).toEqual([]);
    expect(window.localStorage.getItem("flashcard-catalog-errors")).toBeNull();
  });
});
