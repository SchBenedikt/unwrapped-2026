"use client";

import { motion } from "framer-motion";
import { Counter } from "@/components/Counter";
import { formatPercent, formatCompact, plural } from "@/lib/format";
import type { WrappedData } from "@/lib/types";

export function LanguagesScene({ data }: { data: WrappedData }) {
  const languages = data.stats.topLanguages;
  const top = languages[0];
  if (!top) return null;

  return (
    <section className="scene scene--languages">
      <p className="kicker">04 — The vocabulary</p>

      <div className="langLayout">
        <div className="langHero">
          <p className="langHero__label">Native tongue</p>
          <p className="langHero__name" style={{ color: top.color }}>
            {top.name}
          </p>
          <p className="langHero__share">
            <b>
              <Counter value={top.share * 100} format={(value) => `${Math.round(value)}%`} />
            </b>{" "}
            of your repos speak it
          </p>
          <p className="langHero__note">
            {top.count} of {data.stats.reposAnalyzed} repos ·{" "}
            {formatCompact(top.stars)} stars in this language
          </p>
        </div>

        <div className="langList">
          {languages.map((language, index) => (
            <div className="langRow" key={language.name}>
              <div className="langRow__head">
                <span className="langRow__name">
                  <span className="langDot" style={{ background: language.color }} />
                  {language.name}
                </span>
                <span className="langRow__count">
                  {language.count} {plural(language.count, "repo")} ·{" "}
                  {formatPercent(language.share)}
                </span>
              </div>
              <div className="langRow__track">
                <motion.div
                  className="langRow__fill"
                  style={{
                    background: `linear-gradient(90deg, ${language.color}, ${language.color}99)`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(language.share * 100, 3)}%` }}
                  transition={{ delay: 0.25 + index * 0.07, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="scene__note">
        Based on {data.stats.reposAnalyzed} public{" "}
        {plural(data.stats.reposAnalyzed, "repo")} · {data.stats.languageCount}{" "}
        {plural(data.stats.languageCount, "language")} detected
      </p>
    </section>
  );
}
