export type ThemeId =
  | "midnight"
  | "paper"
  | "neon"
  | "terminal"
  | "sunset"
  | "blueprint"
  | "vaporwave";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  note: string;
  dots: [string, string, string];
  secret?: boolean;
};

export const THEMES: ThemeMeta[] = [
  { id: "midnight", label: "Midnight", note: "the default", dots: ["#08080b", "#c8f751", "#a78bfa"] },
  { id: "paper", label: "Paper", note: "light mode", dots: ["#f3eee2", "#335f08", "#5838be"] },
  { id: "neon", label: "Neon", note: "after hours", dots: ["#07000f", "#ff2ed1", "#3cf0ff"] },
  { id: "terminal", label: "Terminal", note: "green screen", dots: ["#020a05", "#4ade80", "#ffb04a"] },
  { id: "sunset", label: "Sunset", note: "golden hour", dots: ["#150708", "#ffb347", "#ff5e57"] },
  { id: "blueprint", label: "Blueprint", note: "drafting table", dots: ["#04122b", "#60d6ff", "#9eadff"] },
  {
    id: "vaporwave",
    label: "Vaporwave",
    note: "1985 called",
    dots: ["#150034", "#ff71ce", "#01cdfe"],
    secret: true,
  },
];

export const THEME_KEY = "unwrapped.theme";
export const LAST_DARK_KEY = "unwrapped.theme.dark";
export const SECRET_KEY = "unwrapped.vaporwave";
export const THEME_EVENT = "unwrapped:theme";

export const LIGHT_THEME: ThemeId = "paper";

export function isLightTheme(id: ThemeId): boolean {
  return id === LIGHT_THEME;
}

/** The dark theme to return to when light mode is switched off again. */
export function lastDarkTheme(): ThemeId {
  if (typeof window === "undefined") return "midnight";
  try {
    const stored = window.localStorage.getItem(LAST_DARK_KEY);
    return isThemeId(stored) && !isLightTheme(stored) ? stored : "midnight";
  } catch {
    return "midnight";
  }
}

export function rememberDarkTheme(id: ThemeId) {
  if (isLightTheme(id)) return;
  try {
    window.localStorage.setItem(LAST_DARK_KEY, id);
  } catch {
    /* private mode — the preference simply does not persist */
  }
}

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function readTheme(): ThemeId {
  if (typeof window === "undefined") return "midnight";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isThemeId(stored) ? stored : "midnight";
  } catch {
    return "midnight";
  }
}

export function applyTheme(id: ThemeId) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (id === "midnight") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = id;
  }
  root.style.colorScheme = id === "paper" ? "light" : "dark";
  window.dispatchEvent(new CustomEvent<ThemeId>(THEME_EVENT, { detail: id }));
}

export function setTheme(id: ThemeId) {
  try {
    window.localStorage.setItem(THEME_KEY, id);
  } catch {
    /* private mode — theme simply does not persist */
  }
  applyTheme(id);
}

export function isSecretUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SECRET_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockSecret() {
  try {
    window.localStorage.setItem(SECRET_KEY, "1");
  } catch {
    /* ignore */
  }
}
