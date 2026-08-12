import { describe, it, expect } from "vitest";
import { compareVersions, releasesSince, introFor, APP_VERSION, RELEASES, WALKTHROUGH } from "./whatsNew";

const RELS = [
  { version: "1.0.0", date: "2026-08-01", items: ["one"] },
  { version: "1.1.0", date: "2026-08-12", items: ["two"] },
  { version: "1.2.0", date: "2026-08-20", items: ["three"] },
];

describe("compareVersions", () => {
  it("orders by each part numerically, not as text", () => {
    expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
    expect(compareVersions("1.2.0", "1.10.0")).toBe(-1);
    expect(compareVersions("1.1.0", "1.1.0")).toBe(0);
  });

  it("treats a missing part as zero", () => {
    expect(compareVersions("1.1", "1.1.0")).toBe(0);
    expect(compareVersions("2", "1.9.9")).toBe(1);
  });

  // A corrupted or empty stored value must read as "very old" so the note is
  // shown; reading it as "newest" would swallow every future release.
  it("sorts an unparseable version oldest", () => {
    expect(compareVersions("", "1.0.0")).toBe(-1);
    expect(compareVersions(null, "1.0.0")).toBe(-1);
    expect(compareVersions("nonsense", "1.0.0")).toBe(-1);
  });
});

describe("releasesSince", () => {
  it("returns only newer releases, newest first", () => {
    expect(releasesSince("1.0.0", RELS).map((r) => r.version)).toEqual(["1.2.0", "1.1.0"]);
  });

  it("returns nothing when the device is current", () => {
    expect(releasesSince("1.2.0", RELS)).toEqual([]);
  });

  it("returns everything when nothing has been seen", () => {
    expect(releasesSince(null, RELS)).toHaveLength(3);
  });
});

describe("introFor", () => {
  it("gives a fresh install the walkthrough", () => {
    expect(introFor({ seenVersion: null, hasData: false, releases: RELS }).screen).toBe("walkthrough");
  });

  // The one that matters: someone who has been using the app since before
  // this feature existed has no stored version but does have cards. Teaching
  // them what a flashcard is would be insulting, and wrong.
  it("never gives an existing catalog the walkthrough", () => {
    const intro = introFor({ seenVersion: null, hasData: true, releases: RELS });
    expect(intro.screen).toBe("whatsNew");
    expect(intro.releases.map((r) => r.version)).toEqual(["1.2.0", "1.1.0", "1.0.0"]);
  });

  it("shows every release the device missed, not just the newest", () => {
    const intro = introFor({ seenVersion: "1.0.0", hasData: true, releases: RELS });
    expect(intro.releases.map((r) => r.version)).toEqual(["1.2.0", "1.1.0"]);
  });

  it("shows nothing on a device that is already current", () => {
    expect(introFor({ seenVersion: APP_VERSION, hasData: true, releases: RELS }).screen).toBe(null);
  });

  // A device ahead of this build — the web app is deployed continuously, the
  // APK is not, and a backup restored onto an older install can produce it.
  it("shows nothing on a device ahead of this build", () => {
    expect(introFor({ seenVersion: "9.0.0", hasData: true, releases: RELS }).screen).toBe(null);
  });

  it("stays silent when the version moved but nothing was written about it", () => {
    expect(introFor({ seenVersion: "1.2.0", hasData: true, releases: RELS }).screen).toBe(null);
    expect(introFor({ seenVersion: null, hasData: true, releases: [] }).screen).toBe(null);
  });
});

// The shipped content, not the machinery: a release note that names no
// version, or a version with no note at all, is silence where the user was
// promised a line.
describe("the shipped notes", () => {
  it("has a note for the current version", () => {
    expect(RELEASES.some((r) => r.version === APP_VERSION)).toBe(true);
  });

  it("gives every release a version, a date and at least one line", () => {
    RELEASES.forEach((r) => {
      expect(r.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.items.length).toBeGreaterThan(0);
    });
  });

  it("keeps the walkthrough short enough to be read", () => {
    expect(WALKTHROUGH.length).toBeLessThanOrEqual(6);
    WALKTHROUGH.forEach((s) => {
      expect(s.title).toBeTruthy();
      expect(s.text.length).toBeLessThan(200);
    });
  });
});
