# GitHub Unwrapped 2026

Your year in code, told as a story. Type a GitHub handle and the app reads public profile data,
repositories, the contribution calendar and recent activity, then turns all of it into a
scrollable recap — no login, no database, nothing stored.

Beyond the usual recap it adds the parts the official wrap leaves out: weekday habits, the busiest
month, streaks with their exact dates, the longest quiet stretch, a transparent four-axis builder
signal, and a share card you can download as PNG, JPG or WebP.

Built with Next.js 16, React 19, TypeScript and Framer Motion. Deployed to Cloudflare Workers via
OpenNext.

---

## What you get

| # | Scene | What it shows |
|---|-------|---------------|
| 01 | **The human** | Avatar, name, handle, bio, location, followers, account age, last push |
| 02 | **The applause** | Stars and forks collected, star average, headliner repo plus runners-up |
| 03 | **The output** | Public repos (own vs. forked), followers/following, years on GitHub, oldest and heaviest repo, open issues |
| 04 | **The vocabulary** | Language split across your repos, with the dominant language up front |
| 05 | **The momentum** | Twelve-month contribution heatmap, active days, longest and current streak, peak hour |
| 06 | **The rhythm** | Weekday and month charts, busiest day, streak date ranges, longest pause, pace, builder signal |
| 07 | **The verdict** | A persona derived from stars, languages, commits, PRs, repos and consistency |
| 08 | **The recap** | A summary card with image export, a copyable deep link and a way to read another profile |

A profile without language data skips scene 04; a profile whose contribution calendar cannot be
read skips scene 06 and falls back to the event-based numbers. The story is built from a dynamic
scene list, so the counter and the progress bar follow along.

## Deep statistics

Scene 06 is computed from the parsed contribution calendar (`lib/stats.ts`), not from guesses:

- **Weekday habit** — contributions grouped Monday to Sunday, with the busiest day highlighted.
- **Month by month** — the whole calendar aggregated into months, busiest month marked.
- **Busiest day** — the single day with the most contributions, plus its weekday and date.
- **Streaks with dates** — the longest run and the current run, each with its start and end date.
- **Pace** — contributions per active day and per week, plus the share of the year that was active.
- **Longest pause** — the longest gap between two active days, with the actual date range.
- **Weekend share** — how much of the work landed on Saturday and Sunday.

The **builder signal** (`lib/signal.ts`) is an explicit, transparent formula on four axes — reach,
craft, consistency and range — each derived from the same public counts you can see in the app. It
is labelled as our own reading, never as an official GitHub metric.

## Themes

Seven palettes, switchable from the landing page and from the story header. A theme only swaps
design tokens (`html[data-theme="…"]`), never layout, and the choice persists in `localStorage`.

**Light mode** has its own button: the ☀ next to the theme menu switches to the Paper palette and
the ☾ switches back to whichever dark theme you used last (Midnight on a fresh visit). The choice
survives reloads and is what the share-card export renders, so a light recap card is one click
away.

| Theme | Mood |
|-------|------|
| **Midnight** | The default: near-black, lime accent, violet glow |
| **Paper** | Light mode: warm paper background, ink text, dark green accent |
| **Neon** | After hours: magenta and cyan on deep purple |
| **Terminal** | Green screen, amber highlights, monospace energy |
| **Sunset** | Golden hour: amber, coral and rose |
| **Blueprint** | Drafting table: deep blue with cyan lines |
| **Vaporwave** | 1985 called — unlocked through an easter egg, not listed until then |

Share a look directly with `?theme=neon` (or any other theme id). An inline script applies the
stored theme before first paint, so there is no flash of the wrong palette. The share card follows
whichever theme is active.

## Export a share card

The last scene has a **Save as image** button that renders a 1080 × 1350 card on the canvas:

- PNG, JPG and WebP, with a live preview before you download.
- The card uses the active theme's tokens, your avatar, persona, headline number, six key stats,
  longest streak, busiest day and your top languages.
- Rendering happens entirely in the browser (`lib/export.ts`); nothing is uploaded and no image
  service is involved. If the avatar cannot be drawn cross-origin, a gradient monogram is used
  instead, so the export never fails on a blocked image.

## Easter eggs

Spoilers, but you asked for them:

- **Konami code** on the landing page (`↑ ↑ ↓ ↓ ← → ← → B A`) unlocks Vaporwave and adds it to the theme menu.
- Typing **`git`** makes the brand mark spin and drops a toast.
- Typing **`sudo`** gets you a well-earned permission error.
- Typing **`lgtm`**, **`42`** or **`octocat`** each answer with their own toast.
- Typing **`party`** rotates the hue of the whole app for six seconds.
- Typing **`help`** (or **`eggs`**) prints the secret menu.
- **Five clicks on the brand mark** or on the avatar in scene 01 set off a spin or a halo burst.
- Open the **browser console** for a small note.

Typing eggs are ignored while an input is focused, and the Konami listener only reacts on the
landing page so arrow keys keep working as story navigation.

## Controls

| Input | Action |
|-------|--------|
| `→`, `Space`, `PageDown` | Next scene |
| `←`, `PageUp` | Previous scene |
| `Home` / `End` | First / last scene |
| `Esc` | Close the theme menu or export dialog; otherwise back to the landing page |
| Swipe or drag | Next / previous scene |
| Progress segments | Jump to any scene |
| ☀ / ☾ button | Switch between light mode (Paper) and your last dark theme |

## How the data is gathered

Everything comes from public sources, server-side, inside one API route
(`app/api/wrapped/route.ts`):

- **GitHub REST API** — profile, repositories (up to two pages of 100, newest push first, forks
  excluded from star and language maths), public events (last 90 days) for commits, PRs and issues.
- **Contribution calendar** — GitHub has no public contributions API, so the calendar HTML behind
  `github.com/<user>` is parsed best-effort. If that fails, scene 05 and 06 fall back to
  event-based activity and the story keeps working.
- **Caching** — responses are cached for 30 minutes (`s-maxage=1800`) with stale-while-revalidate;
  user data is never persisted anywhere.

Set `GITHUB_TOKEN` in the environment to raise GitHub's rate limit. Without it the app still works,
it just hits the anonymous limit sooner.

## Run it locally

Requires Node.js 20.9 or newer (Next.js 16 minimum).

```bash
npm ci
npm run dev      # http://localhost:3000
```

Optional, for a higher GitHub rate limit:

```bash
export GITHUB_TOKEN=ghp_…   # never commit this
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3000 |
| `npm run typecheck` | `tsc --noEmit` |

## Deployment

Production runs on Freebuff Sites as a Cloudflare Worker built with `@opennextjs/cloudflare`:

**https://github-unwrapped-2026-nddgp3.freebuff.site**

The Worker serves the prerendered pages and static assets, and forwards `/api/wrapped` to the Next
server bundle, where the GitHub fetches happen. `GITHUB_TOKEN` can be set as a site secret to raise
the rate limit; the public deployment works without it.

Set `NEXT_PUBLIC_SITE_URL` if the app is hosted under a different origin — it is used as
`metadataBase` so Open Graph image URLs stay absolute.

## API

`GET /api/wrapped?username=<handle>`

```jsonc
// 200
{ "data": { "user": { … }, "stats": { … }, "activity": { … }, "contributions": { … }, "meta": { … } } }

// 400 | 404 | 429 | 502
{ "error": { "code": "invalid | not_found | rate_limit | unknown", "message": "…" } }
```

`stats` also carries the repo insights used by scene 03: `oldestRepo`, `newestRepo`,
`biggestRepo`, `archivedRepos`, `openIssues` and `repoSizeKb`. Derived statistics (weekdays,
months, streaks, gaps, signal) are computed in the browser from the contribution calendar, so the
payload stays small.

Accepts a bare handle, an `@handle`, or a full `https://github.com/<handle>` URL. Responses are
cached publicly for 30 minutes; error responses are `no-store`.

## Project layout

```
app/
  layout.tsx            metadata and the pre-paint theme script
  page.tsx              landing → loading → story state machine, ?u= deep link
  globals.css           design tokens, themes, every component style
  icon.svg              favicon
  opengraph-image.png   1200 × 630 social preview
  api/wrapped/route.ts  the only server endpoint
components/
  Landing.tsx           handle form, suggestions, teaser card
  Loading.tsx           the 1.9 s minimum-wait reveal
  Story.tsx             scene list, navigation, keyboard and swipe handling
  Backdrop.tsx          the animated background
  Counter.tsx           the animated number ticker
  ThemeSwitcher.tsx     theme menu with the locked secret entry
  EasterEggs.tsx        konami, typed words, brand taps, ?theme= deep links, console notes
  ExportDialog.tsx      share-card preview, format switch and download
  Toaster.tsx           toast rendering
  scenes/               the story scenes (01–08)
lib/
  github.ts             GitHub fetching, normalisation, repo insights, error mapping
  contributions.ts      contribution calendar parsing with graceful fallback
  stats.ts              weekday/month buckets, streak ranges, gaps, consistency
  signal.ts             the transparent four-axis builder signal
  export.ts             canvas rendering of the 1080 × 1350 share card
  languages.ts          language aggregation and ordering
  archetype.ts          persona rules and display helpers
  theme.ts              theme ids, persistence, unlock state
  toast.ts              toast events
  clipboard.ts          copy-to-clipboard helper
  format.ts             number and date formatting
  types.ts              shared payload types
```

## Notes and limits

- Only public data is read. Private repositories, private contributions and organisation-only work
  are invisible to the app.
- Star and language figures ignore forks; the repo scan stops after 200 repositories and flags the
  response as `partialRepos` when it hits that ceiling.
- GitHub's anonymous rate limit is low; set `GITHUB_TOKEN` if you plan to share the app.
- The contribution calendar is scraped HTML, so it can break without notice — the story degrades
  to the event-based fallback instead of failing.
- The builder signal is a local heuristic, not a GitHub metric.
- Not affiliated with GitHub.
