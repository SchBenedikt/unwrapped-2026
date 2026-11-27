import type { ContributionDay, Contributions } from "./types";

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type DayBucket = {
  label: string;
  short: string;
  count: number;
  activeDays: number;
};

export type MonthBucket = DayBucket & { key: string };

export type StreakRange = {
  length: number;
  start: string;
  end: string;
};

export type GapRange = {
  days: number;
  start: string;
  end: string;
};

export type Rhythm = {
  total: number;
  activeDays: number;
  totalDays: number;
  consistency: number;
  averagePerActiveDay: number;
  averagePerWeek: number;
  weekday: DayBucket[];
  busiestWeekday: DayBucket;
  quietestWeekday: DayBucket;
  months: MonthBucket[];
  busiestMonth: MonthBucket;
  quietestMonth: MonthBucket | null;
  longestStreak: StreakRange | null;
  currentStreak: StreakRange | null;
  bestDay: ContributionDay | null;
  longestGap: GapRange | null;
  weekendShare: number;
  firstDay: string;
  lastDay: string;
};

/** Monday-first weekday index for an ISO date (`YYYY-MM-DD`). */
export function weekdayIndex(date: string): number {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return 0;
  return (parsed.getUTCDay() + 6) % 7;
}

export function weekdayName(date: string): string {
  return WEEKDAYS_LONG[weekdayIndex(date)];
}

function dayBucket(index: number, count: number, activeDays: number): DayBucket {
  return {
    label: WEEKDAYS_LONG[index],
    short: WEEKDAYS_SHORT[index],
    count,
    activeDays,
  };
}

function computeStreaks(days: ContributionDay[]): {
  longest: StreakRange | null;
  current: StreakRange | null;
} {
  let longest: StreakRange | null = null;
  let runStart: string | null = null;
  let run = 0;

  for (const day of days) {
    if (day.count > 0) {
      if (run === 0) runStart = day.date;
      run += 1;
      if (!longest || run > longest.length) {
        longest = { length: run, start: runStart ?? day.date, end: day.date };
      }
    } else {
      run = 0;
      runStart = null;
    }
  }

  // Today may not have started yet, so a single trailing quiet day is skipped.
  let index = days.length - 1;
  if (index >= 0 && days[index].count === 0) index -= 1;
  const end = index >= 0 ? days[index].date : null;

  let current: StreakRange | null = null;
  let currentRun = 0;
  let currentStart: string | null = null;
  for (; index >= 0; index -= 1) {
    if (days[index].count === 0) break;
    currentRun += 1;
    currentStart = days[index].date;
  }
  if (currentRun > 0 && currentStart && end) {
    current = { length: currentRun, start: currentStart, end };
  }

  return { longest, current };
}

function computeLongestGap(days: ContributionDay[]): GapRange | null {
  let gap: GapRange | null = null;
  let seenActive = false;
  let run = 0;
  let runStart: string | null = null;

  for (const day of days) {
    if (day.count > 0) {
      seenActive = true;
      run = 0;
      runStart = null;
      continue;
    }
    if (!seenActive) continue;
    if (run === 0) runStart = day.date;
    run += 1;
    if (!gap || run > gap.days) {
      gap = { days: run, start: runStart ?? day.date, end: day.date };
    }
  }

  return gap;
}

/**
 * Turns the contribution calendar into the numbers a recap usually hides:
 * weekday habit, month-by-month pace, streaks with their actual date range,
 * quiet stretches and how much of the year was actually active.
 */
export function buildRhythm(contributions: Contributions): Rhythm {
  const days = contributions.days;
  const totalDays = Math.max(days.length, 1);

  const weekdayCounts = new Array<number>(7).fill(0);
  const weekdayActive = new Array<number>(7).fill(0);
  const months = new Map<string, MonthBucket>();

  let total = 0;
  let activeDays = 0;
  let weekend = 0;
  let bestDay: ContributionDay | null = null;

  for (const day of days) {
    const index = weekdayIndex(day.date);
    weekdayCounts[index] += day.count;
    total += day.count;
    if (day.count > 0) {
      weekdayActive[index] += 1;
      activeDays += 1;
      if (index >= 5) weekend += day.count;
    }
    if (!bestDay || day.count > bestDay.count) bestDay = day;

    const monthIndex = Number(day.date.slice(5, 7)) - 1;
    const year = day.date.slice(0, 4);
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const bucket = months.get(key) ?? {
      key,
      label: `${MONTHS_SHORT[monthIndex] ?? day.date.slice(5, 7)} ${year}`,
      short: MONTHS_SHORT[monthIndex] ?? day.date.slice(5, 7),
      count: 0,
      activeDays: 0,
    };
    bucket.count += day.count;
    if (day.count > 0) bucket.activeDays += 1;
    months.set(key, bucket);
  }

  const weekday = WEEKDAYS_SHORT.map((_, index) =>
    dayBucket(index, weekdayCounts[index], weekdayActive[index]),
  );
  const ordered = [...weekday].sort((a, b) => b.count - a.count);
  const monthList = [...months.values()].sort((a, b) => a.key.localeCompare(b.key));
  const rankedMonths = [...monthList].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  const { longest, current } = computeStreaks(days);

  return {
    total,
    activeDays,
    totalDays,
    consistency: activeDays / totalDays,
    averagePerActiveDay: activeDays ? total / activeDays : 0,
    averagePerWeek: total / (totalDays / 7),
    weekday,
    busiestWeekday: ordered[0],
    quietestWeekday: ordered[ordered.length - 1],
    months: monthList,
    busiestMonth: rankedMonths[0],
    quietestMonth: rankedMonths.length > 1 ? rankedMonths[rankedMonths.length - 1] : null,
    longestStreak: longest,
    currentStreak: current,
    bestDay: bestDay && bestDay.count > 0 ? bestDay : null,
    longestGap: computeLongestGap(days),
    weekendShare: total ? weekend / total : 0,
    firstDay: days[0]?.date ?? "",
    lastDay: days[days.length - 1]?.date ?? "",
  };
}
