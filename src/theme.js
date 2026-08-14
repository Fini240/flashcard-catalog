// ---------------------------------------------------------------------------
// Which colour scheme the app is in.
//
// Pure and separate from the component so the migration below is testable: the
// setting used to be a boolean, and anyone who had already chosen light or dark
// must keep what they chose rather than being quietly moved onto automatic.
// ---------------------------------------------------------------------------

export const THEME_KEY = "flashcard-catalog-dark-mode";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export const THEME_CHOICES = [
  { id: "system", label: "Automatic" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const IDS = new Set(THEME_CHOICES.map((c) => c.id));

// "1"/"0" are what the old on/off switch wrote. Anything unrecognised — never
// set, or corrupted — means no preference has been expressed, so follow the
// device.
export function readThemeChoice(raw) {
  if (raw === "1") return "dark";
  if (raw === "0") return "light";
  return IDS.has(raw) ? raw : "system";
}

export function resolveDarkMode(choice, systemDark) {
  if (choice === "dark") return true;
  if (choice === "light") return false;
  return !!systemDark;
}

export function getStoredTheme() {
  try {
    return readThemeChoice(localStorage.getItem(THEME_KEY));
  } catch (e) {
    return "system";
  }
}

export function setStoredTheme(value) {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch (e) {
    /* a full or blocked store costs the preference, not the session */
  }
}

export function systemPrefersDark() {
  try {
    return window.matchMedia(DARK_QUERY).matches;
  } catch (e) {
    return false;
  }
}
