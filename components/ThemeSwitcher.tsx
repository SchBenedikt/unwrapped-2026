"use client";

import { useEffect, useRef, useState } from "react";
import {
  LIGHT_THEME,
  THEMES,
  THEME_EVENT,
  isLightTheme,
  isSecretUnlocked,
  lastDarkTheme,
  readTheme,
  rememberDarkTheme,
  setTheme,
  type ThemeId,
} from "@/lib/theme";
import { toast } from "@/lib/toast";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ThemeId>("midnight");
  const [unlocked, setUnlocked] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(readTheme());
    setUnlocked(isSecretUnlocked());

    function onTheme(event: Event) {
      const detail = (event as CustomEvent<ThemeId>).detail;
      if (detail) setActive(detail);
      setUnlocked(isSecretUnlocked());
    }
    function onUnlock() {
      setUnlocked(isSecretUnlocked());
    }

    window.addEventListener(THEME_EVENT, onTheme);
    window.addEventListener("unwrapped:unlock", onUnlock);
    return () => {
      window.removeEventListener(THEME_EVENT, onTheme);
      window.removeEventListener("unwrapped:unlock", onUnlock);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // Close the popover without letting the story handle the same Escape.
      event.stopPropagation();
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const current = THEMES.find((theme) => theme.id === active) ?? THEMES[0];
  const options = THEMES.filter((theme) => !theme.secret || unlocked);
  const light = isLightTheme(active);

  function toggleLight() {
    if (light) {
      setTheme(lastDarkTheme());
      return;
    }
    rememberDarkTheme(active);
    setTheme(LIGHT_THEME);
  }

  return (
    <div className="themeTools">
      <button
        type="button"
        className="lightToggle"
        onClick={toggleLight}
        aria-pressed={light}
        aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
        title={light ? "Switch to dark mode" : "Switch to light mode"}
      >
        <span aria-hidden>{light ? "☾" : "☀"}</span>
      </button>

      <div className="themeSwitch" ref={box}>
        <button
          type="button"
          className="themeSwitch__btn"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Theme: ${current.label}`}
        >
          <span className="themeSwitch__dots" aria-hidden>
            {current.dots.map((dot) => (
              <i key={dot} className="themeSwitch__dot" style={{ background: dot }} />
            ))}
          </span>
          <span className="themeSwitch__label">{current.label}</span>
        </button>

        {open ? (
          <div className="themeSwitch__menu" role="menu" aria-label="Theme">
            {options.map((theme) => (
              <button
                key={theme.id}
                type="button"
                role="menuitemradio"
                aria-checked={theme.id === active}
                className="themeSwitch__opt"
                onClick={() => {
                  setTheme(theme.id);
                  setOpen(false);
                }}
              >
                <span className="themeSwitch__dots" aria-hidden>
                  {theme.dots.map((dot) => (
                    <i key={dot} className="themeSwitch__dot" style={{ background: dot }} />
                  ))}
                </span>
                <span className="themeSwitch__name">
                  {theme.label}
                  <small>{theme.note}</small>
                </span>
                {theme.id === active ? (
                  <span className="themeSwitch__check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            ))}

            {unlocked ? null : (
              <button
                type="button"
                className="themeSwitch__opt themeSwitch__opt--locked"
                onClick={() => {
                  toast("Locked theme", "Some passwords look like ↑ ↑ ↓ ↓ ← → ← → B A.");
                  setOpen(false);
                }}
              >
                <span className="themeSwitch__dots" aria-hidden>
                  <i className="themeSwitch__dot" />
                  <i className="themeSwitch__dot" />
                  <i className="themeSwitch__dot" />
                </span>
                <span className="themeSwitch__name">
                  ???
                  <small>secret</small>
                </span>
                <span className="themeSwitch__lock" aria-hidden>
                  locked
                </span>
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
