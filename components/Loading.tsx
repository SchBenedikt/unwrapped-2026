"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const PHRASES = [
  "Cloning your public self…",
  "Counting stars, one repo at a time…",
  "Reading the contribution graph…",
  "Finding the pattern in your chaos…",
  "Almost there — cutting the recap…",
];

export function Loading({ handle }: { handle: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => Math.min(current + 1, PHRASES.length - 1));
    }, 780);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loader">
      <div className="loader__inner">
        <span className="loader__glyph" aria-hidden>
          ✳
        </span>
        <div className="loader__phrase">
          <AnimatePresence mode="wait">
            <motion.span
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32 }}
            >
              {PHRASES[step]}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className="loader__handle">@{handle}</span>
        <div className="loader__bar">
          <motion.div
            className="loader__fill"
            initial={{ width: "4%" }}
            animate={{ width: `${((step + 1) / PHRASES.length) * 96}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <span className="loader__hint">no login · no tracking · just data</span>
      </div>
    </div>
  );
}
