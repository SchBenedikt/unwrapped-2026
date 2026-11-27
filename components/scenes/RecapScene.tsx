"use client";

import { useEffect, useRef, useState } from "react";
import { buildPersona, displayName } from "@/lib/archetype";
import { copyText } from "@/lib/clipboard";
import { ExportDialog } from "@/components/ExportDialog";
import { formatCompact, formatNumber, joinedYear, plural } from "@/lib/format";
import type { WrappedData } from "@/lib/types";

export function RecapScene({ data, onRestart }: { data: WrappedData; onRestart: () => void }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const [shareUrl, setShareUrl] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const manualInput = useRef<HTMLInputElement | null>(null);
  const persona = buildPersona(data);
  const name = displayName(data);
  const contributions = data.contributions;
  const topLanguage = data.stats.topLanguages[0];

  const items = [
    { label: "Stars", value: formatCompact(data.stats.totalStars) },
    { label: "Public repos", value: formatNumber(data.user.publicRepos) },
    { label: "Followers", value: formatCompact(data.user.followers) },
    {
      label: contributions ? "Contributions" : "Commits (90d)",
      value: contributions ? formatCompact(contributions.total) : formatNumber(data.activity.commits),
    },
    {
      label: "Longest streak",
      value: contributions ? `${contributions.longestStreak}d` : `${data.activity.reposTouched}`,
    },
    { label: "Languages", value: String(data.stats.languageCount) },
  ];

  useEffect(() => {
    if (copyState === "manual" && manualInput.current) {
      manualInput.current.focus();
      manualInput.current.select();
    }
  }, [copyState]);

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?u=${encodeURIComponent(
      data.user.login,
    )}`;
    setShareUrl(url);

    const copied = await copyText(url);
    setCopyState(copied ? "copied" : "manual");
    if (copied) window.setTimeout(() => setCopyState("idle"), 2400);
  }

  return (
    <section className="scene scene--recap">
      <p className="kicker">08 — The recap</p>

      <div className="recap">
        <div className="recapCard">
          <header className="recapCard__head">
            <img
              className="recapCard__avatar"
              src={data.user.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="recapCard__name">{name}</p>
              <p className="recapCard__handle">@{data.user.login}</p>
            </div>
            <span
              className="recapCard__pill"
              style={{ color: persona.accent, borderColor: persona.accent }}
            >
              {persona.title}
            </span>
          </header>

          <div className="recapGrid">
            {items.map((item) => (
              <div className="recapGrid__item" key={item.label}>
                <span className="recapGrid__value">{item.value}</span>
                <span className="recapGrid__label">{item.label}</span>
              </div>
            ))}
          </div>

          <footer className="recapCard__foot">
            <span>
              {topLanguage
                ? `${topLanguage.name} · ${formatNumber(topLanguage.count)} ${plural(
                    topLanguage.count,
                    "repo",
                  )}`
                : "No language detected yet"}
            </span>
            <span>
              github.com/{data.user.login} · since {joinedYear(data.user.createdAt)}
            </span>
          </footer>
        </div>

        <div className="recap__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setExportOpen(true)}
          >
            Save as image <span aria-hidden>⇩</span>
          </button>
          <a
            className="btn btn--ghost"
            href={data.user.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            Open profile <span aria-hidden>↗</span>
          </a>
          <button type="button" className="btn btn--ghost" onClick={copyLink}>
            {copyState === "copied" ? "Link copied ✓" : "Copy share link"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onRestart}>
            Read another
          </button>
        </div>

        <span className="srOnly" role="status">
          {copyState === "copied" ? "Recap link copied to clipboard" : ""}
        </span>

        {copyState === "manual" ? (
          <div className="copyHint">
            <input
              ref={manualInput}
              className="copyHint__input"
              value={shareUrl}
              readOnly
              aria-label="Recap link"
              onFocus={(event) => event.currentTarget.select()}
            />
            <p className="copyHint__text">
              Clipboard blocked — the link is selected, press ⌘C / Ctrl+C
            </p>
          </div>
        ) : null}

        <p className="scene__note recap__note">
          Generated live from public GitHub data · nothing stored · not affiliated with GitHub
        </p>
      </div>

      {exportOpen ? <ExportDialog data={data} onClose={() => setExportOpen(false)} /> : null}
    </section>
  );
}
