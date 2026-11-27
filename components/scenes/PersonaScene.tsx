"use client";

import { motion } from "framer-motion";
import { buildPersona } from "@/lib/archetype";
import type { WrappedData } from "@/lib/types";

export function PersonaScene({ data }: { data: WrappedData }) {
  const persona = buildPersona(data);

  return (
    <section className="scene scene--persona">
      <p className="kicker">07 — The verdict</p>

      <div className="persona">
        <motion.div
          className="persona__emblem"
          style={{ ["--persona" as string]: persona.accent }}
          initial={{ scale: 0.8, opacity: 0, rotate: -14 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="persona__glyph" aria-hidden>
            {persona.glyph}
          </span>
        </motion.div>

        <div className="persona__body">
          <p className="persona__intro">This year, you were</p>
          <h2 className="persona__title" style={{ color: persona.accent }}>
            {persona.title}
          </h2>
          <p className="persona__tagline">{persona.tagline}</p>
          <p className="persona__desc">{persona.description}</p>
          <ul className="persona__traits">
            {persona.traits.map((trait) => (
              <li className="chip" key={trait}>
                {trait}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
