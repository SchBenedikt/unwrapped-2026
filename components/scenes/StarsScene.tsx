"use client";

import { Counter } from "@/components/Counter";
import { formatCompact, formatNumber, plural } from "@/lib/format";
import type { WrappedData } from "@/lib/types";

function constellation(seed: number, count: number) {
  let state = (seed % 2147483646) || 1;
  const next = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };

  return Array.from({ length: count }, () => ({
    x: next() * 100,
    y: next() * 100,
    size: 1 + next() * 2.6,
    delay: next() * 5,
    bright: next() > 0.68,
  }));
}

export function StarsScene({ data }: { data: WrappedData }) {
  const { stats } = data;
  const topRepo = stats.topRepo;
  const seed = data.user.login.split("").reduce((sum, char) => sum + char.charCodeAt(0), 7);
  const dots = constellation(seed, 64);
  const hasStars = stats.totalStars > 0;

  return (
    <section className="scene scene--stars">
      <div className="constellation" aria-hidden>
        {dots.map((dot, index) => (
          <span
            key={index}
            className={dot.bright ? "constellation__dot is-bright" : "constellation__dot"}
            style={{
              // keep every dot fully inside the clipping box of the constellation
              left: `${1.5 + dot.x * 0.97}%`,
              top: `${2 + dot.y * 0.96}%`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              animationDelay: `${dot.delay}s`,
            }}
          />
        ))}
      </div>

      <p className="kicker">02 — The applause</p>

      <div className="starsGrid">
        <div className="bigStat">
          <div className="bigStat__value">
            <Counter value={stats.totalStars} delay={0.2} />
          </div>
          <p className="bigStat__label">
            {hasStars ? (
              <>
                stars collected across <strong>{stats.ownRepos}</strong>{" "}
                {plural(stats.ownRepos, "public repo")}
              </>
            ) : (
              <>
                stars so far. Your first one is still out there — it usually arrives after the
                README.
              </>
            )}
          </p>
          <p className="bigStat__note">
            {formatNumber(stats.totalForks)} forks · {stats.averageStars}★ average ·{" "}
            {stats.languageCount} {plural(stats.languageCount, "language")}
          </p>
        </div>

        {topRepo ? (
          <div className="showcase">
            <p className="showcase__label">
              {hasStars ? "Your headliner" : "Latest obsession"}
            </p>
            <a className="repoCard" href={topRepo.url} target="_blank" rel="noreferrer noopener">
              <span className="repoCard__top">
                <span className="repoCard__icon" aria-hidden>
                  ★
                </span>
                <span className="repoCard__name">{topRepo.name}</span>
              </span>
              <span className="repoCard__desc">
                {topRepo.description ?? "No description — mysterious. Respect."}
              </span>
              <span className="repoCard__meta">
                <span className="repoCard__stat">
                  <span className="langDot" style={{ background: topRepo.languageColor }} />
                  {topRepo.language ?? "Unknown"}
                </span>
                <span className="repoCard__stat">{formatCompact(topRepo.stars)} stars</span>
                <span className="repoCard__stat">{formatCompact(topRepo.forks)} forks</span>
              </span>
            </a>

            {stats.topRepos.length > 1 ? (
              <ul className="repoList">
                {stats.topRepos.slice(1).map((repo) => (
                  <li key={repo.name} className="repoRow">
                    <span className="repoRow__name">
                      <span className="langDot" style={{ background: repo.languageColor }} />
                      {repo.name}
                    </span>
                    <span className="repoRow__stars">{formatCompact(repo.stars)} ★</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
