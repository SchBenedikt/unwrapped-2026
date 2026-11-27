"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { WrappedData } from "@/lib/types";
import { IdentityScene } from "./scenes/IdentityScene";
import { StarsScene } from "./scenes/StarsScene";
import { OutputScene } from "./scenes/OutputScene";
import { LanguagesScene } from "./scenes/LanguagesScene";
import { MomentumScene } from "./scenes/MomentumScene";
import { RhythmScene } from "./scenes/RhythmScene";
import { PersonaScene } from "./scenes/PersonaScene";
import { RecapScene } from "./scenes/RecapScene";
import { ThemeSwitcher } from "./ThemeSwitcher";

const variants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 70 : -70,
  }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -70 : 70,
  }),
};

type Scene = {
  key: string;
  label: string;
  node: React.ReactNode;
};

export function Story({ data, onRestart }: { data: WrappedData; onRestart: () => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const scenes = useMemo<Scene[]>(() => {
    const list: Scene[] = [
      { key: "identity", label: "You", node: <IdentityScene data={data} /> },
      { key: "stars", label: "Applause", node: <StarsScene data={data} /> },
      { key: "output", label: "Output", node: <OutputScene data={data} /> },
    ];

    if (data.stats.topLanguages.length > 0) {
      list.push({ key: "languages", label: "Vocabulary", node: <LanguagesScene data={data} /> });
    }

    list.push(
      { key: "momentum", label: "Momentum", node: <MomentumScene data={data} /> },
    );

    if (data.contributions && data.contributions.total > 0) {
      list.push({ key: "rhythm", label: "Rhythm", node: <RhythmScene data={data} /> });
    }

    list.push(
      { key: "persona", label: "Verdict", node: <PersonaScene data={data} /> },
      { key: "recap", label: "Recap", node: <RecapScene data={data} onRestart={onRestart} /> },
    );

    return list;
  }, [data, onRestart]);

  const total = scenes.length;
  const current = scenes[Math.min(index, total - 1)];

  const go = useCallback(
    (next: number) => {
      setIndex((currentIndex) => {
        const target = Math.max(0, Math.min(total - 1, next));
        setDirection(target >= currentIndex ? 1 : -1);
        return target;
      });
    },
    [total],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      // The export dialog is modal and the theme menu is a popover: while either
      // is open it owns Escape, otherwise dismissing it would also leave the story.
      if (document.querySelector(".exportDialog, .themeSwitch__menu")) return;

      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        go(index + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        go(index - 1);
      } else if (event.key === "Escape") {
        onRestart();
      } else if (event.key === "Home") {
        go(0);
      } else if (event.key === "End") {
        go(total - 1);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, total, onRestart]);

  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="story" data-scene={current.key}>
      <header className="story__top">
        <div className="story__brand">
          <span className="brand__mark" aria-hidden>
            ✳
          </span>
          <span>Unwrapped 2026</span>
        </div>

        <div className="story__progress">
          {scenes.map((scene, sceneIndex) => (
            <button
              key={scene.key}
              type="button"
              className={[
                "segment",
                sceneIndex < index ? "is-done" : "",
                sceneIndex === index ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => go(sceneIndex)}
              aria-label={`Go to scene ${sceneIndex + 1}: ${scene.label}`}
              aria-current={sceneIndex === index}
            />
          ))}
        </div>

        <ThemeSwitcher />

        <button type="button" className="story__exit" onClick={onRestart}>
          Exit
        </button>
      </header>

      <main className="story__stage">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current.key}
            className="story__scene"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -450) go(index + 1);
              else if (info.offset.x > 70 || info.velocity.x > 450) go(index - 1);
            }}
          >
            {current.node}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="story__bottom">
        <div className="story__index">
          <b>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </b>
          <span>{current.label}</span>
        </div>

        <span className="story__hint">← → or swipe</span>

        <div className="story__nav">
          <button
            type="button"
            className="navBtn"
            onClick={() => go(index - 1)}
            disabled={isFirst}
            aria-label="Previous scene"
          >
            ←
          </button>
          <button
            type="button"
            className="navBtn navBtn--primary"
            onClick={() => go(index + 1)}
            disabled={isLast}
          >
            {isLast ? "That’s it" : index === total - 2 ? "See recap" : "Next"}
            <span aria-hidden>→</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
