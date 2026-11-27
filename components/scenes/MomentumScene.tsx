"use client";

import { useMemo } from "react";
import { Counter } from "@/components/Counter";
import { formatNumber, shortDate } from "@/lib/format";
import type { ContributionDay, WrappedData } from "@/lib/types";

function toWeeks(days: ContributionDay[]): (ContributionDay | null)[][] {
  if (!days.length) return [];
  const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const padded: (ContributionDay | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];

  const weeks: (ContributionDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
  return weeks;
}

export function MomentumScene({ data }: { data: WrappedData }) {
  const contributions = data.contributions;
  const weeks = useMemo(() => toWeeks(contributions?.days ?? []), [contributions]);
  const activity = data.activity;

  return (
    <section className="scene scene--momentum">
      <p className="kicker">05 — The momentum</p>

      {contributions ? (
        <>
          <div className="momentum__head">
            <div className="bigStat">
              <div className="bigStat__value">
                <Counter value={contributions.total} />
              </div>
              <p className="bigStat__label">
                contributions in the last twelve months
                {contributions.currentStreak > 1 ? (
                  <> · {contributions.currentStreak}-day streak still alive</>
                ) : null}
              </p>
            </div>

            <div className="momentum__stats">
              <div className="miniStat">
                <span className="miniStat__value">
                  <Counter value={contributions.activeDays} />
                </span>
                <span className="miniStat__label">active days</span>
              </div>
              <div className="miniStat">
                <span className="miniStat__value">
                  <Counter value={contributions.longestStreak} />
                </span>
                <span className="miniStat__label">longest streak</span>
              </div>
              <div className="miniStat">
                <span className="miniStat__value">{contributions.bestDay?.count ?? 0}</span>
                <span className="miniStat__label">
                  {contributions.bestDay
                    ? `best day · ${shortDate(contributions.bestDay.date)}`
                    : "best day"}
                </span>
              </div>
            </div>
          </div>

          <div className="heatmapWrap">
            <div className="heatmap" role="img" aria-label="Contribution calendar for the last year">
              {weeks.map((week, weekIndex) => (
                <div className="heatmap__week" key={weekIndex}>
                  {week.map((day, dayIndex) =>
                    day ? (
                      <span
                        key={day.date}
                        className="heatmap__cell"
                        data-level={day.level}
                        title={`${formatNumber(day.count)} on ${day.date}`}
                      />
                    ) : (
                      <span key={`empty-${weekIndex}-${dayIndex}`} className="heatmap__cell is-empty" />
                    ),
                  )}
                </div>
              ))}
            </div>
            <div className="heatmap__legend">
              <span>less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <i key={level} data-level={level} />
              ))}
              <span>more</span>
            </div>
          </div>

          <p className="scene__note">
            Every square is a day of the last year —{" "}
            {formatNumber(contributions.total)} contributions in total.
            {activity.peakHour !== null
              ? ` Usual kick-off: ${String(activity.peakHour).padStart(2, "0")}:00 UTC.`
              : ""}
          </p>
        </>
      ) : (
        <>
          <div className="momentum__head">
            <div className="bigStat">
              <div className="bigStat__value">
                <Counter value={activity.commits} />
              </div>
              <p className="bigStat__label">
                commits pushed in the last {activity.windowDays} days
              </p>
            </div>

            <div className="momentum__stats">
              <div className="miniStat">
                <span className="miniStat__value">
                  <Counter value={activity.pullRequests} />
                </span>
                <span className="miniStat__label">PRs opened</span>
              </div>
              <div className="miniStat">
                <span className="miniStat__value">
                  <Counter value={activity.issues} />
                </span>
                <span className="miniStat__label">issues opened</span>
              </div>
              <div className="miniStat">
                <span className="miniStat__value">
                  <Counter value={activity.reposTouched} />
                </span>
                <span className="miniStat__label">repos touched</span>
              </div>
            </div>
          </div>

          <p className="scene__note">
            Built from your public event stream — GitHub only shares the full contribution
            calendar for accounts it can render.
            {activity.peakHour !== null
              ? ` Usual kick-off: ${String(activity.peakHour).padStart(2, "0")}:00 UTC.`
              : ""}
          </p>
        </>
      )}
    </section>
  );
}
