// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

const isNativePlatform = vi.fn(() => false);
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => isNativePlatform() } }));

const {
  APK_URL, APK_FILENAME, isOffered,
  BANNER_KEY, shouldOfferBanner, looksApple, bannerDismissed, dismissBanner, isBannerOffered,
} = await import("./appDownload");

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

describe("the download banner", () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(false);
    localStorage.clear();
  });

  it("is offered on a fresh web visit", () => {
    expect(shouldOfferBanner({ native: false, apple: false, dismissed: false })).toBe(true);
    expect(isBannerOffered()).toBe(true);
  });

  it("stays down once it has been turned down", () => {
    dismissBanner();
    expect(bannerDismissed()).toBe(true);
    expect(isBannerOffered()).toBe(false);
  });

  it("is never shown inside the installed app", () => {
    isNativePlatform.mockReturnValue(true);
    expect(isBannerOffered()).toBe(false);
  });

  it("is not shown where an APK cannot be installed", () => {
    expect(shouldOfferBanner({ native: false, apple: true, dismissed: false })).toBe(false);
    expect(looksApple("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    // An iPad pretending to be a desktop: a Mac that reports touch points.
    expect(looksApple("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
    expect(looksApple("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
    expect(looksApple("Mozilla/5.0 (Linux; Android 14; SM-S911B)")).toBe(false);
  });

  it("remembers under a key of its own, not the theme's", () => {
    expect(BANNER_KEY).toContain("flashcard-catalog");
  });
});
