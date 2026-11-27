import type { WrappedData } from "./types";

export type Persona = {
  title: string;
  tagline: string;
  description: string;
  glyph: string;
  accent: string;
  traits: string[];
};

function timeBand(hour: number | null): string | null {
  if (hour === null) return null;
  if (hour >= 0 && hour < 6) return `night owl · ${String(hour).padStart(2, "0")}:00 UTC`;
  if (hour < 11) return `early bird · ${String(hour).padStart(2, "0")}:00 UTC`;
  if (hour < 17) return `daylight builder · ${String(hour).padStart(2, "0")}:00 UTC`;
  if (hour < 22) return `evening committer · ${String(hour).padStart(2, "0")}:00 UTC`;
  return `night owl · ${String(hour).padStart(2, "0")}:00 UTC`;
}

export function buildPersona(data: WrappedData): Persona {
  const { stats, activity, user } = data;
  const stars = stats.totalStars;
  const repos = stats.ownRepos;
  const contributions = data.contributions?.total ?? 0;
  const activeDays = data.contributions?.activeDays ?? 0;

  const traits: string[] = [];
  if (stats.topLanguages[0]) {
    traits.push(`${stats.topLanguages[0].name} native`);
  }
  const band = timeBand(activity.peakHour);
  if (band) traits.push(band);
  if (stats.topics[0]) traits.push(`#${stats.topics[0]}`);
  if (traits.length < 3) traits.push(`${repos} public ${repos === 1 ? "repo" : "repos"}`);
  if (traits.length < 3 && stats.averageStars > 0) traits.push(`${stats.averageStars}★ average`);

  let persona: Omit<Persona, "traits">;

  if (stars >= 200 && stats.averageStars >= 15) {
    persona = {
      title: "The Star Magnet",
      tagline: "Gravity, but for repositories.",
      description: `People keep coming back to your work. ${stars.toLocaleString("en-US")} stars is not an accident — you build the thing other developers quietly put in their README.`,
      glyph: "✦",
      accent: "var(--lime)",
    };
  } else if (stats.languageCount >= 6) {
    persona = {
      title: "The Polyglot",
      tagline: "Seven syntaxes, one brain.",
      description: `You move between ${stats.languageCount} languages like other people switch browser tabs. Context switching isn't a weakness here — it's the entire toolkit.`,
      glyph: "◈",
      accent: "var(--violet)",
    };
  } else if (activity.commits >= 200) {
    persona = {
      title: "The Relentless Shipper",
      tagline: "Done beats perfect.",
      description: `${activity.commits.toLocaleString("en-US")} commits pushed in the last ${activity.windowDays} days. You don't wait for inspiration — you open the editor and let the diff decide.`,
      glyph: "➤",
      accent: "var(--coral)",
    };
  } else if (activity.pullRequests >= 15) {
    persona = {
      title: "The Collaborator",
      tagline: "Built in public, together.",
      description: `${activity.pullRequests} pull requests opened. You're the person who shows up in somebody else's repo with a fix, a test, and a kind review.`,
      glyph: "❖",
      accent: "var(--sky)",
    };
  } else if (repos >= 20) {
    persona = {
      title: "The Serial Builder",
      tagline: "Always one repo from the next idea.",
      description: `${repos} public repositories, each one a small bet on something you wanted to exist. Half experiment, half declaration.`,
      glyph: "◍",
      accent: "var(--violet)",
    };
  } else if (stars >= 20) {
    persona = {
      title: "The Crowd Favorite",
      tagline: "Quietly accumulating fans.",
      description: `${stars.toLocaleString("en-US")} stars across your repos — and most of them arrived without a single launch tweet. The work did the talking.`,
      glyph: "✺",
      accent: "var(--lime)",
    };
  } else if (activeDays >= 90 || contributions >= 400) {
    persona = {
      title: "The Quiet Craftsman",
      tagline: "Slow, deliberate, unreasonably consistent.",
      description: `${activeDays} active days this year. No sprint theatre, no streak flexing — just showing up, over and over, until the thing works.`,
      glyph: "◐",
      accent: "var(--coral)",
    };
  } else {
    persona = {
      title: "The Explorer",
      tagline: "New account energy, in the best way.",
      description:
        stars > 0
          ? `${stars.toLocaleString("en-US")} stars and ${repos} repos so far — the graph is still being written, and everything is still ahead of you.`
          : `${repos} public ${repos === 1 ? "repo" : "repos"} and a whole year ahead. The best GitHub profiles all started with an empty commit graph.`,
      glyph: "◇",
      accent: "var(--lime)",
    };
  }

  return { ...persona, traits: traits.slice(0, 3) };
}

export function displayName(data: WrappedData): string {
  return data.user.name?.trim() || data.user.login;
}
