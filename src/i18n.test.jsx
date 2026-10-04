// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANGUAGE_KEY, appLanguage, appLocale, getLanguageChoice, readLanguageChoice,
  resolveLanguage, setAppLanguage, t } from "./i18n";

beforeEach(() => { localStorage.clear(); setAppLanguage("en"); });
afterEach(() => { vi.restoreAllMocks(); setAppLanguage("en"); });

describe("app language", () => {
  it("uses a supported device language, with English as the fallback", () => {
    expect(readLanguageChoice("obsolete")).toBe("system");
    expect(resolveLanguage("system", "de-AT")).toBe("de");
    expect(resolveLanguage("system", "es-ES")).toBe("en");
    expect(resolveLanguage("en", "de-DE")).toBe("en");
    expect(resolveLanguage("de", "en-US")).toBe("de");
  });
  it("saves the selected language separately from the catalog", () => {
    localStorage.setItem("flashcard-catalog-data", "untouched");
    setAppLanguage("de");
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe("de");
    expect(getLanguageChoice()).toBe("de");
    expect(appLanguage()).toBe("de");
    expect(appLocale()).toBe("de-DE");
    expect(localStorage.getItem("flashcard-catalog-data")).toBe("untouched");
  });
  it("applies the choice even when device storage refuses a write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    setAppLanguage("de");
    expect(appLanguage()).toBe("de");
    expect(t("Settings")).toBe("Einstellungen");
  });
  it("formats quantities and keeps interpolated card or folder text intact", () => {
    setAppLanguage("de");
    expect(t("{0} subject{1} · {2} card{3}", [1, "", 2, "s"]))
      .toBe("1 Fach · 2 Karten");
    expect(t("{0} subject{1} · {2} card{3}", [2, "s", 1, ""]))
      .toBe("2 Fächer · 1 Karte");
    expect(t("No cards match \"{0}\".", ["Settings"])).toBe("Keine Karten passen zu „Settings“.");
    expect(t("{0} familiar · {1} learning · {2} unseen{3}", [1, 0, 2, false])).not.toContain("false");
    expect(t(" · {0} due", [3])).toBe(" · 3 fällig");
    expect(t("Export failed: device is full")).toBe("Export fehlgeschlagen: device is full");
    setAppLanguage("en");
    expect(t("No cards match \"{0}\".", ["Settings"])).toBe('No cards match "Settings".');
  });
});
