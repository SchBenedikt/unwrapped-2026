"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { displayName } from "@/lib/archetype";
import { formatNumber, joinedYear, relativeTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { WrappedData } from "@/lib/types";

export function IdentityScene({ data }: { data: WrappedData }) {
  const name = displayName(data);
  const repos = data.stats.ownRepos;
  const lastPush = relativeTime(data.stats.lastPushedAt);
  const [taps, setTaps] = useState(0);
  const [burst, setBurst] = useState(false);

  function poke() {
    const next = taps + 1;
    if (next < 5) {
      setTaps(next);
      return;
    }
    setTaps(0);
    setBurst(true);
    toast("That is you.", "100% human, 0% generated. Nice to meet you.");
    window.setTimeout(() => setBurst(false), 950);
  }

  return (
    <section className="scene scene--identity">
      <span className="watermark" aria-hidden>
        2026
      </span>

      <p className="kicker">01 — The human</p>

      <div className="identity">
        <motion.div
          className={`identity__portrait${burst ? " is-burst" : ""}`}
          onClick={poke}
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="identity__halo" aria-hidden />
          <img
            className="identity__img"
            src={data.user.avatarUrl}
            alt={`${name} on GitHub`}
            referrerPolicy="no-referrer"
          />
          <span className="identity__badge">
            {repos} public {repos === 1 ? "repo" : "repos"}
          </span>
        </motion.div>

        <div className="identity__body">
          <p className="identity__greet">Presenting</p>
          <h2 className="identity__name">{name}</h2>
          <p className="identity__handle">@{data.user.login}</p>
          <p className="identity__bio">
            {data.user.bio?.trim() || "No bio. Let the commit history do the talking."}
          </p>
          <ul className="identity__meta">
            <li>on GitHub since {joinedYear(data.user.createdAt)}</li>
            {data.user.location ? <li>{data.user.location}</li> : null}
            <li>{formatNumber(data.user.followers)} followers</li>
            {lastPush ? <li>last push {lastPush}</li> : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
