import { fetchContributions } from "./contributions";
import { languageColor } from "./languages";
import type {
  Activity,
  LanguageSlice,
  RepoInsight,
  RepoSummary,
  WrappedData,
} from "./types";

const API = "https://api.github.com";
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const ACTIVITY_WINDOW_DAYS = 90;
const MAX_REPO_PAGES = 2;

export type WrappedErrorCode = "invalid" | "not_found" | "rate_limit" | "unknown";

export class WrappedError extends Error {
  code: WrappedErrorCode;

  constructor(code: WrappedErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "WrappedError";
  }
}

type GhUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  location: string | null;
  company: string | null;
  blog: string | null;
  created_at: string;
  html_url: string;
};

type GhRepo = {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  fork: boolean;
  topics?: string[];
  pushed_at: string | null;
  created_at: string;
  size: number;
  open_issues_count: number;
  archived: boolean;
};

type GhEvent = {
  type: string;
  created_at: string;
  repo?: { name?: string };
  payload?: { size?: number; action?: string; commits?: unknown[] };
};

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "github-unwrapped",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function gh<T>(path: string, revalidate = 900): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: headers(),
    next: { revalidate },
  });

  if (res.status === 404) {
    throw new WrappedError("not_found", "That GitHub handle doesn’t exist.");
  }
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0" || res.status === 429) {
      throw new WrappedError("rate_limit", "GitHub is rate-limiting us right now.");
    }
  }
  if (!res.ok) {
    throw new WrappedError("unknown", `GitHub answered with ${res.status}.`);
  }
  return (await res.json()) as T;
}

function toRepoInsight(repo: GhRepo): RepoInsight {
  return {
    name: repo.name,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    sizeKb: repo.size,
    openIssues: repo.open_issues_count,
    created: repo.created_at,
    language: repo.language,
    languageColor: languageColor(repo.language),
    url: repo.html_url,
  };
}

function toRepoSummary(repo: GhRepo): RepoSummary {
  return {
    name: repo.name,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    languageColor: languageColor(repo.language),
    url: repo.html_url,
    topics: (repo.topics ?? []).slice(0, 4),
  };
}

function buildLanguages(repos: GhRepo[]): LanguageSlice[] {
  const counts = new Map<string, { count: number; stars: number }>();
  let total = 0;

  for (const repo of repos) {
    if (!repo.language) continue;
    const entry = counts.get(repo.language) ?? { count: 0, stars: 0 };
    entry.count += 1;
    entry.stars += repo.stargazers_count;
    counts.set(repo.language, entry);
    total += 1;
  }

  return [...counts.entries()]
    .map(([name, value]) => ({
      name,
      count: value.count,
      stars: value.stars,
      share: total ? value.count / total : 0,
      color: languageColor(name),
    }))
    .sort((a, b) => b.count - a.count || b.stars - a.stars)
    .slice(0, 7);
}

function buildActivity(events: GhEvent[]): Activity {
  const cutoff = Date.now() - ACTIVITY_WINDOW_DAYS * 86_400_000;
  const hours = new Array<number>(24).fill(0);
  const repos = new Set<string>();
  let commits = 0;
  let pullRequests = 0;
  let issues = 0;

  for (const event of events) {
    const at = new Date(event.created_at).getTime();
    if (!Number.isFinite(at) || at < cutoff) continue;
    if (event.repo?.name) repos.add(event.repo.name);
    hours[new Date(event.created_at).getUTCHours()] += 1;

    if (event.type === "PushEvent") {
      commits += event.payload?.size ?? event.payload?.commits?.length ?? 0;
    } else if (event.type === "PullRequestEvent" && event.payload?.action === "opened") {
      pullRequests += 1;
    } else if (event.type === "IssuesEvent" && event.payload?.action === "opened") {
      issues += 1;
    }
  }

  let peakHour: number | null = null;
  let peakCount = 0;
  hours.forEach((count, hour) => {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  });

  return {
    windowDays: ACTIVITY_WINDOW_DAYS,
    commits,
    pullRequests,
    issues,
    reposTouched: repos.size,
    peakHour,
  };
}

export function normalizeUsername(input: string): string {
  const cleaned = input.trim().replace(/^@+/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/+$/, "");
  if (!cleaned || !USERNAME_RE.test(cleaned)) {
    throw new WrappedError("invalid", "That doesn’t look like a GitHub handle.");
  }
  return cleaned;
}

export async function getWrapped(input: string): Promise<WrappedData> {
  const login = normalizeUsername(input);

  const user = await gh<GhUser>(`/users/${login}`);

  const repos: GhRepo[] = [];
  let partialRepos = false;
  for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
    const batch = await gh<GhRepo[]>(
      `/users/${login}/repos?per_page=100&sort=pushed&type=owner&page=${page}`,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
    if (page === MAX_REPO_PAGES) partialRepos = true;
  }

  const [events, contributions] = await Promise.all([
    gh<GhEvent[]>(`/users/${login}/events/public?per_page=100`).catch(() => []),
    fetchContributions(user.login),
  ]);

  const own = repos.filter((repo) => !repo.fork);
  const totalStars = own.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = own.reduce((sum, repo) => sum + repo.forks_count, 0);

  const ranked = [...own].sort(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      b.forks_count - a.forks_count ||
      (b.pushed_at ?? "").localeCompare(a.pushed_at ?? ""),
  );

  const topRepos = ranked.filter((repo) => repo.stargazers_count > 0).slice(0, 3).map(toRepoSummary);
  const fallbackTop = ranked.slice(0, 1).map(toRepoSummary);
  const topRepo = topRepos[0] ?? fallbackTop[0] ?? null;

  const lastPushed = [...repos]
    .filter((repo) => repo.pushed_at)
    .sort((a, b) => (b.pushed_at ?? "").localeCompare(a.pushed_at ?? ""))[0];

  const topicCounts = new Map<string, number>();
  for (const repo of own) {
    for (const topic of repo.topics ?? []) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }
  const topics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic]) => topic);

  const byCreation = [...own]
    .filter((repo) => repo.created_at)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const oldestRepo = byCreation[0] ? toRepoInsight(byCreation[0]) : null;
  const newestRepo = byCreation.length
    ? toRepoInsight(byCreation[byCreation.length - 1])
    : null;
  const biggest = [...own].sort((a, b) => b.size - a.size)[0];

  const topLanguages = buildLanguages(own);
  const createdAt = new Date(user.created_at).getTime();
  const accountDays = Number.isFinite(createdAt)
    ? Math.max(1, Math.floor((Date.now() - createdAt) / 86_400_000))
    : 1;

  return {
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      location: user.location,
      company: user.company,
      website: user.blog,
      createdAt: user.created_at,
      url: user.html_url,
    },
    stats: {
      reposAnalyzed: repos.length,
      totalPublicRepos: user.public_repos,
      ownRepos: own.length,
      forkedRepos: repos.length - own.length,
      totalStars,
      totalForks,
      averageStars: own.length ? Math.round(totalStars / own.length) : 0,
      accountDays,
      languageCount: topLanguages.length,
      topLanguages,
      topRepo,
      topRepos: topRepos.length ? topRepos : fallbackTop,
      topics,
      lastPushedAt: lastPushed?.pushed_at ?? null,
      lastPushedRepo: lastPushed?.name ?? null,
      oldestRepo,
      newestRepo,
      biggestRepo: biggest ? toRepoInsight(biggest) : null,
      archivedRepos: own.filter((repo) => repo.archived).length,
      openIssues: own.reduce((sum, repo) => sum + repo.open_issues_count, 0),
      repoSizeKb: own.reduce((sum, repo) => sum + repo.size, 0),
    },
    activity: buildActivity(events),
    contributions,
    meta: {
      fetchedAt: new Date().toISOString(),
      partialRepos,
    },
  };
}
