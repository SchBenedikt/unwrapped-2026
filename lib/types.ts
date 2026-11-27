export type LanguageSlice = {
  name: string;
  count: number;
  share: number;
  stars: number;
  color: string;
};

export type RepoSummary = {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  languageColor: string;
  url: string;
  topics: string[];
};

export type RepoInsight = {
  name: string;
  stars: number;
  forks: number;
  sizeKb: number;
  openIssues: number;
  created: string;
  language: string | null;
  languageColor: string;
  url: string;
};

export type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

export type Contributions = {
  total: number;
  days: ContributionDay[];
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  bestDay: ContributionDay | null;
  rangeStart: string;
  rangeEnd: string;
};

export type Activity = {
  windowDays: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reposTouched: number;
  peakHour: number | null;
};

export type WrappedData = {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    followers: number;
    following: number;
    publicRepos: number;
    location: string | null;
    company: string | null;
    website: string | null;
    createdAt: string;
    url: string;
  };
  stats: {
    reposAnalyzed: number;
    totalPublicRepos: number;
    ownRepos: number;
    forkedRepos: number;
    totalStars: number;
    totalForks: number;
    averageStars: number;
    accountDays: number;
    languageCount: number;
    topLanguages: LanguageSlice[];
    topRepo: RepoSummary | null;
    topRepos: RepoSummary[];
    topics: string[];
    lastPushedAt: string | null;
    lastPushedRepo: string | null;
    oldestRepo: RepoInsight | null;
    newestRepo: RepoInsight | null;
    biggestRepo: RepoInsight | null;
    archivedRepos: number;
    openIssues: number;
    repoSizeKb: number;
  };
  activity: Activity;
  contributions: Contributions | null;
  meta: {
    fetchedAt: string;
    partialRepos: boolean;
  };
};
