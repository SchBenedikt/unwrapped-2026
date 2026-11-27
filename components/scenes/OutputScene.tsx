"use client";

import { Counter } from "@/components/Counter";
import {
  formatNumber,
  joinedYear,
  plural,
  relativeTime,
  shortDate,
  yearsOnGithub,
} from "@/lib/format";
import type { WrappedData } from "@/lib/types";

export function OutputScene({ data }: { data: WrappedData }) {
  const { user, stats } = data;
  const since = joinedYear(user.createdAt);
  const years = yearsOnGithub(user.createdAt);
  const lastPush = relativeTime(stats.lastPushedAt);
  const oldest = stats.oldestRepo;
  const heaviest = stats.biggestRepo;

  const tiles = [
    {
      label: "Public repos",
      value: user.publicRepos,
      note: `${stats.ownRepos} original · ${stats.forkedRepos} forked`,
    },
    {
      label: "Forks of your work",
      value: stats.totalForks,
      note: "other people’s starting points",
    },
    { label: "Followers", value: user.followers, note: "watching, quietly" },
    { label: "Following", value: user.following, note: "your reading list" },
  ];

  return (
    <section className="scene scene--output">
      <p className="kicker">03 — The output</p>

      <div className="tileGrid">
        {tiles.map((tile) => (
          <div className="tile" key={tile.label}>
            <p className="tile__label">{tile.label}</p>
            <p className="tile__value">
              <Counter value={tile.value} />
            </p>
            <p className="tile__note">{tile.note}</p>
          </div>
        ))}

        <div className="tile tile--wide">
          <div>
            <p className="tile__label">On GitHub since</p>
            <p className="tile__value">{since}</p>
          </div>
          <p className="tile__note">
            {years} {plural(years, "year")} · {formatNumber(stats.accountDays)} days of repos,
            issues and side quests.
            {stats.lastPushedRepo ? (
              <>
                {" "}
                Latest push: <strong>{stats.lastPushedRepo}</strong>
                {lastPush ? `, ${lastPush}` : ""}.
              </>
            ) : null}
          </p>
        </div>

        {oldest || heaviest ? (
          <div className="tile tile--wide tile--facts">
            {oldest ? (
              <div className="fact">
                <p className="tile__label">Longest running</p>
                <p className="fact__value">{oldest.name}</p>
                <p className="fact__note">first pushed {shortDate(oldest.created.slice(0, 10))}</p>
              </div>
            ) : null}
            {heaviest ? (
              <div className="fact">
                <p className="tile__label">Heaviest repo</p>
                <p className="fact__value">{heaviest.name}</p>
                <p className="fact__note">{formatNumber(heaviest.sizeKb)} KB of code</p>
              </div>
            ) : null}
            <div className="fact">
              <p className="tile__label">Open issues</p>
              <p className="fact__value">{formatNumber(stats.openIssues)}</p>
              <p className="fact__note">
                across all repos
                {stats.archivedRepos > 0
                  ? ` · ${stats.archivedRepos} ${plural(stats.archivedRepos, "repo")} archived`
                  : ""}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
