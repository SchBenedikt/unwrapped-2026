"use client";

import { useEffect } from "react";
import { isThemeId, setTheme, unlockSecret } from "@/lib/theme";
import { toast } from "@/lib/toast";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

function spinBrand() {
  document.querySelectorAll<HTMLElement>(".brand__mark").forEach((mark) => {
    mark.classList.remove("is-spin");
    // restart the animation even if it was already running
    void mark.offsetWidth;
    mark.classList.add("is-spin");
    window.setTimeout(() => mark.classList.remove("is-spin"), 1300);
  });
}

function partyMode() {
  const root = document.documentElement;
  root.classList.remove("is-party");
  void root.offsetWidth;
  root.classList.add("is-party");
  window.setTimeout(() => root.classList.remove("is-party"), 6200);
}

const TYPED_EGGS: { word: string; run: () => void }[] = [
  {
    word: "git",
    run: () => {
      spinBrand();
      toast("git init", "A fresh repository of vibes. Try the theme switch.");
    },
  },
  {
    word: "sudo",
    run: () => toast("sudo: permission denied", "Root is not a personality. Try ↑ ↑ ↓ ↓ ← → ← → B A."),
  },
  {
    word: "lgtm",
    run: () => toast("LGTM", "Approved without reading the diff. Bold."),
  },
  {
    word: "42",
    run: () => toast("42", "The answer to life, the universe and merge conflicts."),
  },
  {
    word: "octocat",
    run: () =>
      toast(
        "Mona stopped by",
        "   /\\_/\\\n  ( o.o )  \"ship it\"\n   > ^ <",
      ),
  },
  {
    word: "party",
    run: () => {
      partyMode();
      toast("Party mode", "Six seconds of questionable hue rotation.");
    },
  },
  {
    word: "help",
    run: () =>
      toast(
        "Secret menu",
        "git · sudo · lgtm · 42 · octocat · party · ↑ ↑ ↓ ↓ ← → ← → B A · five taps on the ✳",
      ),
  },
  {
    word: "eggs",
    run: () =>
      toast(
        "Secret menu",
        "git · sudo · lgtm · 42 · octocat · party · ↑ ↑ ↓ ↓ ← → ← → B A · five taps on the ✳",
      ),
  },
];

export function EasterEggs() {
  useEffect(() => {
    // ?theme=neon — shareable theme links
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    if (isThemeId(fromUrl)) setTheme(fromUrl);

    console.log("%c✳ GitHub Unwrapped 2026", "font-size:14px;font-weight:700;color:#c8f751");
    console.log(
      "%cpsst — ↑ ↑ ↓ ↓ ← → ← → B A unlocks a theme, and typing “help” lists the rest.",
      "color:#a78bfa",
    );
    console.log("%c…and “git”, “sudo”, “lgtm”, “42”, “octocat” and “party” all do something.", "color:#6ee7f0");

    let progress = 0;
    let typed = "";
    let brandTaps = 0;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const inField =
        target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      // Konami only on the landing page, where arrows do not navigate scenes.
      if (!document.querySelector(".story")) {
        if (event.key === KONAMI[progress] || event.key.toLowerCase() === KONAMI[progress]) {
          progress += 1;
          if (progress === KONAMI.length) {
            progress = 0;
            unlockSecret();
            setTheme("vaporwave");
            window.dispatchEvent(new Event("unwrapped:unlock"));
            toast("Password accepted", "Welcome back to 1985 — vaporwave is now in your theme switch.");
          }
        } else {
          progress = event.key === KONAMI[0] ? 1 : 0;
        }
      }

      if (inField || event.key.length !== 1) return;

      typed = (typed + event.key.toLowerCase()).slice(-10);
      const egg = TYPED_EGGS.find((entry) => typed.endsWith(entry.word));
      if (!egg) return;
      typed = "";
      egg.run();
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".brand, .story__brand")) return;
      brandTaps += 1;
      if (brandTaps < 5) return;
      brandTaps = 0;
      spinBrand();
      toast("You found the mark", "✳ likes being tapped. Try typing “help” too.");
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  return null;
}
