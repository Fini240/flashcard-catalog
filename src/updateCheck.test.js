// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => "web" },
  registerPlugin: () => ({}),
}));

const { updateOffer, fetchLatestVersion, dismissedVersion, dismissUpdate, MANIFEST_URL } =
  await import("./updateCheck");
const { recentErrors } = await import("./report");

describe("updateOffer — who gets told, and what button they get", () => {
  it("offers a newer version", () => {
    expect(updateOffer({ latest: "1.3.0", current: "1.2.9", native: true }))
      .toEqual({ version: "1.3.0", action: "download" });
  });

  it("says nothing when the app is current or ahead", () => {
    expect(updateOffer({ latest: "1.2.9", current: "1.2.9", native: true })).toBeNull();
    // Ahead happens for real: a dev build, or a user who installed an APK
    // before the hosting deploy that follows it in the ship sequence.
    expect(updateOffer({ latest: "1.2.9", current: "1.3.0", native: true })).toBeNull();
  });

  it("compares versions properly, not as strings", () => {
    // "1.2.10" < "1.2.9" alphabetically, and that would strand every user on
    // the release where the patch number reaches double figures.
    expect(updateOffer({ latest: "1.2.10", current: "1.2.9", native: true })).toBeTruthy();
    expect(updateOffer({ latest: "1.10.0", current: "1.9.0", native: true })).toBeTruthy();
  });

  it("gives the installed app Download and the web app Reload", () => {
    // The APK cannot update itself; the web app is already new on the server
    // and only a stale tab needs anything at all.
    expect(updateOffer({ latest: "1.3.0", current: "1.2.9", native: true }).action).toBe("download");
    expect(updateOffer({ latest: "1.3.0", current: "1.2.9", native: false }).action).toBe("reload");
  });

  it("respects a dismissal for that version only", () => {
    expect(updateOffer({ latest: "1.3.0", current: "1.2.9", native: true, dismissed: "1.3.0" })).toBeNull();
    // ...and asks again at the next release, which is the whole point of
    // storing a version rather than a boolean: one tap in January must not
    // silence every fix for the rest of the year.
    expect(updateOffer({ latest: "1.3.1", current: "1.2.9", native: true, dismissed: "1.3.0" })).toBeTruthy();
  });

  it("says nothing when the manifest gave it nothing usable", () => {
    for (const latest of [null, undefined, "", 130, {}]) {
      expect(updateOffer({ latest, current: "1.2.9", native: true })).toBeNull();
    }
  });
});

describe("fetchLatestVersion", () => {
  beforeEach(() => { window.__lastErrors = []; window.localStorage.clear(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("reads the version out of the manifest", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      expect(url).toBe(MANIFEST_URL);
      return { ok: true, json: async () => ({ version: "1.3.0", builtAt: "2026-09-15T18:00:00.000Z" }) };
    }));
    expect(await fetchLatestVersion()).toBe("1.3.0");
  });

  it("is silent when there is no network — which is how this app is often used", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    expect(await fetchLatestVersion()).toBeNull();
    expect(recentErrors()).toHaveLength(0);
  });

  it("is silent on a 404 too", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));
    expect(await fetchLatestVersion()).toBeNull();
    expect(recentErrors()).toHaveLength(0);
  });

  it("but reports a manifest it could reach and could not read", async () => {
    // Reachable and unreadable means a broken deploy, and this is the only
    // place in the world it would be noticed.
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => { throw new SyntaxError("Unexpected token <"); } })));
    expect(await fetchLatestVersion()).toBeNull();
    expect(recentErrors().map((e) => e.where)).toContain("updateCheck.manifest");
  });
});

describe("remembering a dismissal", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips, and survives a store that refuses to play", () => {
    expect(dismissedVersion()).toBeNull();
    dismissUpdate("1.3.0");
    expect(dismissedVersion()).toBe("1.3.0");

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("nope"); });
    expect(() => dismissUpdate("1.3.1")).not.toThrow();
    spy.mockRestore();
  });
});
