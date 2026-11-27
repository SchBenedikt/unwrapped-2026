import type { WrappedData } from "./types";

export type SignalAxis = {
  key: string;
  label: string;
  value: number;
  note: string;
};

export type Signal = {
  score: number;
  label: string;
  axes: SignalAxis[];
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** Logarithmic 0–100 so one runaway number cannot own the whole score. */
function scale(value: number, ceiling: number): number {
  if (value <= 0) return 0;
  return Math.round(clamp(Math.log1p(value) / Math.log1p(ceiling)) * 100);
}

function tier(score: number): string {
  if (score >= 82) return "rare signal";
  if (score >= 64) return "strong signal";
  if (score >= 44) return "steady signal";
  if (score >= 24) return "warming up";
  return "first light";
}

/**
 * A transparent, locally computed summary of four independent axes. This is
 * not a GitHub metric — it is our own read on the same public numbers, kept
 * deliberately simple so every bar can be explained by the raw counts.
 */
export function buildSignal(data: WrappedData): Signal {
  const { stats, activity, user } = data;
  const contributions = data.contributions;

  const stars = scale(stats.totalStars, 2000);
  const followers = scale(user.followers, 5000);
  const reach = Math.round(stars * 0.7 + followers * 0.3);

  const craft = Math.min(
    100,
    Math.round(
      scale(stats.totalForks, 500) * 0.3 +
        scale(stats.averageStars * 10, 400) * 0.4 +
        scale(stats.ownRepos, 80) * 0.3,
    ),
  );

  const activeDays = contributions?.activeDays ?? 0;
  const consistency = contributions
    ? Math.round((activeDays / Math.max(contributions.days.length, 1)) * 100)
    : scale(activity.commits, 600);

  const range = Math.min(
    100,
    Math.round(
      scale(stats.languageCount, 10) * 0.55 + scale(stats.topics.length, 10) * 0.45,
    ),
  );

  const score = Math.round(reach * 0.3 + craft * 0.25 + consistency * 0.3 + range * 0.15);

  return {
    score,
    label: tier(score),
    axes: [
      {
        key: "reach",
        label: "Reach",
        value: reach,
        note: `${stars}★ stars · ${followers} followers`,
      },
      {
        key: "craft",
        label: "Craft",
        value: craft,
        note: `${stats.ownRepos} original repos · ${stats.averageStars}★ average`,
      },
      {
        key: "consistency",
        label: "Consistency",
        value: consistency,
        note: contributions
          ? `${activeDays} active days of ${contributions.days.length}`
          : `${activity.commits} commits in ${activity.windowDays} days`,
      },
      {
        key: "range",
        label: "Range",
        value: range,
        note: `${stats.languageCount} languages · ${stats.topics.length} topics`,
      },
    ],
  };
}
