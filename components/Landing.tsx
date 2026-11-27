"use client";

import { motion } from "framer-motion";
import { useId, useState, type FormEvent } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";

const SUGGESTIONS = ["torvalds", "sindresorhus", "gaearon", "yyx990803", "kentcdodds", "tj"];

const MARQUEE = [
  "Stars earned",
  "Languages spoken",
  "Streaks built",
  "Commits shipped",
  "Side quests finished",
  "Issues closed",
];

type LandingProps = {
  onSubmit: (username: string) => void;
  error: string | null;
};

export function Landing({ onSubmit, error }: LandingProps) {
  const [value, setValue] = useState("");
  const inputId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit(value);
  }

  return (
    <div className="landing">
      <header className="landing__top">
        <div className="brand">
          <span className="brand__mark" aria-hidden>
            ✳
          </span>
          <span>
            GitHub Unwrapped <span className="brand__year">2026</span>
          </span>
        </div>
        <div className="landing__tools">
          <ThemeSwitcher />
          <span className="landing__edition">vol. 01 — the developer edition</span>
        </div>
      </header>

      <main className="landing__main">
        <div className="landing__col">
          <p className="kicker">Your year in code</p>

          <h1 className="hero__title">
            <span className="hero__line">GitHub</span>
            <span className="hero__line hero__accent">
              <em>Unwrapped</em>
            </span>
          </h1>

          <p className="hero__sub">
            Drop a handle. We turn a year of commits, stars and questionable side projects into a
            scrollable story worth looking at.
          </p>

          <form className="handleForm" onSubmit={submit} noValidate>
            <span className="handleForm__at" aria-hidden>
              @
            </span>
            <label className="srOnly" htmlFor={inputId}>
              GitHub username
            </label>
            <input
              id={inputId}
              className="handleForm__input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="octocat"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(error)}
            />
            <motion.button
              className="handleForm__button"
              type="submit"
              disabled={!value.trim()}
              whileTap={{ scale: 0.97 }}
            >
              Unwrap
              <span aria-hidden>→</span>
            </motion.button>
          </form>

          <p className="formError" role="alert" aria-live="polite">
            {error ?? ""}
          </p>

          <div className="suggest">
            <span className="suggest__label">Try</span>
            {SUGGESTIONS.map((handle) => (
              <button
                key={handle}
                type="button"
                className="suggest__chip"
                onClick={() => {
                  setValue(handle);
                  onSubmit(handle);
                }}
              >
                {handle}
              </button>
            ))}
          </div>
        </div>

        <aside className="teaser" aria-hidden>
          <div className="teaser__stack">
            <div className="teaserCard teaserCard--back" />
            <div className="teaserCard teaserCard--mid" />
            <div className="teaserCard teaserCard--front">
              <div className="teaserCard__head">
                <span className="teaserCard__avatar" />
                <div>
                  <p className="teaserCard__id">@your-handle</p>
                  <p className="teaserCard__meta">the 2026 edition</p>
                </div>
                <span className="teaserCard__tag">specimen</span>
              </div>
              <p className="teaserCard__big">128,904</p>
              <p className="teaserCard__label">stars · commits · side quests</p>
              <div className="teaserCard__bars">
                <span style={{ width: "86%", background: "var(--lime)" }} />
                <span style={{ width: "57%", background: "var(--violet)" }} />
                <span style={{ width: "33%", background: "var(--coral)" }} />
              </div>
              <div className="teaserCard__foot">
                <span>TypeScript native</span>
                <span>27-day streak</span>
              </div>
            </div>
          </div>
          <p className="teaser__caption">Your year, summarized</p>
        </aside>
      </main>

      <div className="marquee" aria-hidden>
        <div className="marquee__track">
          {[0, 1].map((copy) => (
            <div className="marquee__group" key={copy}>
              {MARQUEE.map((item) => (
                <span key={`${copy}-${item}`}>
                  {item}
                  <b>✦</b>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="landing__footer">
        <span>Read straight from the public GitHub API · nothing stored</span>
        <span>Not affiliated with GitHub</span>
      </footer>
    </div>
  );
}
