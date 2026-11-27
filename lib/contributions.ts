import type { ContributionDay, Contributions } from "./types";

const MAX_DAYS = 400;

/**
 * GitHub has no public contributions API, so we read the public calendar HTML
 * that powers github.com/<user>. This is best-effort: any failure returns null
 * and the UI falls back to event-based activity.
 */
export async function fetchContributions(login: string): Promise<Contributions | null> {
  try {
    const res = await fetch(
      `https://github.com/users/${encodeURIComponent(login)}/contributions`,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    return parseCalendar(await res.text());
  } catch {
    return null;
  }
}

function parseCalendar(html: string): Contributions | null {
  const cells = new Map<string, ContributionDay>();

  for (const match of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = match[0];
    if (!tag.includes("ContributionCalendar-day")) continue;
    const id = /\bid="([^"]+)"/.exec(tag)?.[1];
    const date = /\bdata-date="([^"]+)"/.exec(tag)?.[1];
    if (!id || !date) continue;
    const level = Number(/\bdata-level="([^"]*)"/.exec(tag)?.[1] ?? 0);
    cells.set(id, { date, count: 0, level: Number.isFinite(level) ? level : 0 });
  }

  if (cells.size < 40) return null;

  for (const match of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
    const cell = cells.get(match[1]);
    if (!cell) continue;
    const text = match[2].replace(/<[^>]*>/g, " ");
    const count = /([\d,]+)\s+contribution/i.exec(text)?.[1];
    if (count) cell.count = Number(count.replace(/,/g, ""));
  }

  const unique = new Map<string, ContributionDay>();
  for (const cell of cells.values()) {
    const existing = unique.get(cell.date);
    if (!existing || cell.count > existing.count) unique.set(cell.date, cell);
  }

  const days = [...unique.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_DAYS);

  if (!days.length) return null;

  let total = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let running = 0;
  let bestDay: ContributionDay | null = null;

  for (const day of days) {
    total += day.count;
    if (day.count > 0) {
      activeDays += 1;
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
    if (!bestDay || day.count > bestDay.count) bestDay = day;
  }

  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (day.count > 0) currentStreak += 1;
    else if (i === days.length - 1) continue; // today may simply not have started yet
    else break;
  }

  return {
    total,
    days,
    activeDays,
    longestStreak,
    currentStreak,
    bestDay: bestDay && bestDay.count > 0 ? bestDay : null,
    rangeStart: days[0].date,
    rangeEnd: days[days.length - 1].date,
  };
}
