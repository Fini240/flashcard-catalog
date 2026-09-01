import { describe, it, expect, vi, beforeEach } from "vitest";

const isNativePlatform = vi.fn(() => false);
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => isNativePlatform() } }));

const { APK_URL, APK_FILENAME, isOffered } = await import("./appDownload");

describe("the Android app download", () => {
  beforeEach(() => isNativePlatform.mockReturnValue(false));

  it("points at the rolling release, not at a version", () => {
    // A pinned tag would still resolve and would still download — it would
    // just quietly hand out an old build for ever, which is the one failure
    // this link cannot report.
    expect(APK_URL).toContain("/releases/download/latest/");
    expect(APK_URL.endsWith(APK_FILENAME)).toBe(true);
  });

  it("is a direct link to the file, not to a page about it", () => {
    expect(APK_URL).not.toContain("/releases/tag/");
  });

  it("is offered on the web", () => {
    expect(isOffered()).toBe(true);
  });

  it("is not offered inside the installed app", () => {
    isNativePlatform.mockReturnValue(true);
    expect(isOffered()).toBe(false);
  });
});
