import { describe, it, expect } from "vitest";
import { readThemeChoice, resolveDarkMode, THEME_CHOICES } from "./theme";

describe("readThemeChoice", () => {
  // The setting was a boolean switch before it was a three-way choice. Someone
  // who had turned dark mode on must stay dark, not be moved onto automatic
  // and get a light app the next sunny morning.
  it("keeps a preference expressed with the old on/off switch", () => {
    expect(readThemeChoice("1")).toBe("dark");
    expect(readThemeChoice("0")).toBe("light");
  });

  it("reads the new values back", () => {
    THEME_CHOICES.forEach((c) => expect(readThemeChoice(c.id)).toBe(c.id));
  });

  it("follows the device when nothing has ever been chosen", () => {
    expect(readThemeChoice(null)).toBe("system");
    expect(readThemeChoice(undefined)).toBe("system");
    expect(readThemeChoice("")).toBe("system");
  });

  it("follows the device rather than trusting a corrupted value", () => {
    expect(readThemeChoice("nonsense")).toBe("system");
    expect(readThemeChoice("2")).toBe("system");
    expect(readThemeChoice("{}")).toBe("system");
  });
});

describe("resolveDarkMode", () => {
  it("takes an explicit choice over the device", () => {
    expect(resolveDarkMode("dark", false)).toBe(true);
    expect(resolveDarkMode("light", true)).toBe(false);
  });

  it("follows the device on automatic", () => {
    expect(resolveDarkMode("system", true)).toBe(true);
    expect(resolveDarkMode("system", false)).toBe(false);
  });

  it("stays light when the device can't be asked", () => {
    expect(resolveDarkMode("system", undefined)).toBe(false);
  });
});
