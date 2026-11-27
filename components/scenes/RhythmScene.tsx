"use client";

import { buildSignal } from "@/lib/signal";
import { buildRhythm, weekdayName } from "@/lib/stats";
import { formatNumber, shortDate } from "@/lib/format";
import type { WrappedData } from "@/lib/types";

function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function RhythmScene({ data }: { data: WrappedData }) {
  const contributions = data.contributions;
  if (!contributions) return null;

  const rhythm = buildRhythm(contributions);
  const signal = buildSignal(data);
  const weekdayMax = Math.max(...rhythm.weekday.map((day) => day.count), 1);
  const monthMax = Math.max(...rhythm.months.map((month) => month.count), 1);

  const tiles = [
    {
      label: "Busiest day",
      value: rhythm.bestDay ? formatNumber(rhythm.bestDay.count) : "—",
      note: rhythm.bestDay
        ? `${weekdayName(rhythm.bestDay.date)}, ${shortDate(rhythm.bestDay.date)}`
        : "no calendar data",
    },
    {
      label: "Longest streak",
      value: rhythm.longestStreak ? `${rhythm.longestStreak.length}d` : "—",
      note: rhythm.longestStreak
        ? `${shortDate(rhythm.longestStreak.start)} → ${shortDate(rhythm.longestStreak.end)}`
        : "no run yet",
    },
    {
      label: "Current streak",
      value: rhythm.currentStreak ? `${rhythm.currentStreak.length}d` : "0d",
      note: rhythm.currentStreak ? "still alive" : "restart it today",
    },
    {
      label: "Active days",
      value: percent(rhythm.consistency),
      note: `${rhythm.activeDays} of ${rhythm.totalDays} days`,
    },
    {
      label: "Pace",
      value: rhythm.averagePerActiveDay.toFixed(1),
      note: "contributions per active day",
    },
    {
      label: "Longest pause",
      value: rhythm.longestGap ? `${rhythm.longestGap.days}d` : "0d",
      note: rhythm.longestGap
        ? `${shortDate(rhythm.longestGap.start)} → ${shortDate(rhythm.longestGap.end)}`
        : "never went quiet",
    },
  ];

  return (
    <section className="scene scene--rhythm">
      <p className="kicker">06 — The rhythm</p>

      <div className="rhythm">
        <div className="rhythm__charts">
          <div className="chartCard">
            <div className="chartCard__head">
              <span className="chartCard__title">Weekday habit</span>
              <span className="chartCard__aside">
                peak · {rhythm.busiestWeekday.label.slice(0, 3)}
              </span>
            </div>
            <div
              className="weekdayChart"
              role="img"
              aria-label={`Contributions per weekday, busiest on ${rhythm.busiestWeekday.label} with ${rhythm.busiestWeekday.count}`}
            >
              {rhythm.weekday.map((day) => (
                <div className="weekdayBar" key={day.short}>
                  <span className="weekdayBar__value">{formatNumber(day.count)}</span>
                  <div className="weekdayBar__track">
                    <span
                      className="weekdayBar__fill"
                      data-peak={day.short === rhythm.busiestWeekday.short ? "true" : undefined}
                      style={{ height: `${Math.max(3, (day.count / weekdayMax) * 100)}%` }}
                    />
                  </div>
                  <span className="weekdayBar__label">{day.short}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chartCard">
            <div className="chartCard__head">
              <span className="chartCard__title">Month by month</span>
              <span className="chartCard__aside">
                peak · {rhythm.busiestMonth?.label ?? "—"}
              </span>
            </div>
            <div
              className="monthChart"
              role="img"
              aria-label={`Contributions per month, busiest in ${rhythm.busiestMonth?.label ?? "unknown"}`}
            >
              {rhythm.months.map((month) => (
                <div
                  className="monthBar"
                  key={month.key}
                  title={`${month.label} · ${formatNumber(month.count)} contributions`}
                >
                  <div className="monthBar__track">
                    <span
                      className="monthBar__fill"
                      data-peak={month.key === rhythm.busiestMonth?.key ? "true" : undefined}
                      style={{ height: `${Math.max(2, (month.count / monthMax) * 100)}%` }}
                    />
                  </div>
                  <span className="monthBar__label">{month.short}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="statGrid">
          {tiles.map((tile) => (
            <div className="statTile" key={tile.label}>
              <span className="statTile__label">{tile.label}</span>
              <span className="statTile__value">{tile.value}</span>
              <span className="statTile__note">{tile.note}</span>
            </div>
          ))}
        </div>

        <div className="signal">
          <div className="signal__head">
            <div>
              <span className="signal__title">Builder signal</span>
              <span className="signal__label">{signal.label}</span>
            </div>
            <span className="signal__score">
              {signal.score}
              <small>/100</small>
            </span>
          </div>

          <div className="signal__axes">
            {signal.axes.map((axis) => (
              <div className="signalAxis" key={axis.key}>
                <div className="signalAxis__head">
                  <span>{axis.label}</span>
                  <span className="signalAxis__value">{axis.value}</span>
                </div>
                <div className="signalAxis__track">
                  <span className="signalAxis__fill" style={{ width: `${Math.max(2, axis.value)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="scene__note">
            Our own formula on public numbers — not a GitHub metric. {rhythm.weekendShare >= 0.18
              ? `${percent(rhythm.weekendShare)} of your contributions land on weekends.`
              : "Weekends stay mostly offline, which is its own kind of discipline."}{" "}
            {rhythm.quietestWeekday.count > 0
              ? `${rhythm.quietestWeekday.label} is your quietest day.`
              : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
