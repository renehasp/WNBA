# WNBA SyncCourt

A live WNBA game tracker and roster browser built with Next.js. Pulls live scores, play-by-play, box scores, team rosters, league leaderboards, and player news straight from ESPN's public API — no API keys required.

## Features

- **Live games dashboard** (`/`) — every WNBA game today with live scores, period/clock, and team-color theming.
- **Game page** (`/game/[id]`) — animated scoreboard, play-by-play feed with player avatars and team-logo background watermarks, live box score, shot chart, and a per-player "Today's Stats" modal with a foul indicator and headshot.
- **Spoiler veil** — broadcast delay slider that buffers plays so play-by-play can be replayed alongside a delayed TV feed.
- **Teams browser** (`/teams`) — every WNBA team as a color-themed card with a search dropdown that finds any player by first or last name.
- **Team page** (`/teams/[teamId]`) — team header with record + standing, full roster sorted MVP → bench by season PPG, with 🏆🥈🥉 podium emojis for the top 3 scorers and 🐣 / 🤕 markers for rookies and currently-injured players.
- **Player page** (`/teams/[teamId]/players/[playerId]`) — large headshot, position, team, health/injury status (with body part, side, and estimated return date when available), season averages with hover-to-reveal stat names, ESPN news section (with thumbnails, descriptions, source link, and relative timestamps).
- **League leaderboards** (`/leaders/[stat]`) — click any stat on a player page (PTS, REB, AST, FG%, etc.) to see the league-wide ranking with podium emojis for the top 3.

## Tech stack

- [Next.js 16](https://nextjs.org/) with the App Router
- React 19, TypeScript
- Tailwind CSS v4
- [TanStack Query](https://tanstack.com/query) for server state
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Zustand](https://github.com/pmndrs/zustand) for spoiler-veil state
- [Lucide](https://lucide.dev/) icons
- ESPN's public WNBA endpoints (no key required)

## Prerequisites

- **Node.js 20+** (the project was developed against Node 24)
- **npm** (or yarn / pnpm / bun — examples below use npm)

## Getting started

```bash
# 1. Clone
git clone https://github.com/renehasp/WNBA.git
cd WNBA

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the dev server hot-reloads on file changes.

> **Windows users:** there's also a `run.bat` in the project root that runs `npm run dev` if you'd rather double-click it.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000. |
| `npm run build` | Production build. |
| `npm run start` | Run the production build (after `npm run build`). |
| `npm run lint` | Run ESLint. |

## Configuration

No `.env` file is required for normal use — the app talks to ESPN's public APIs through proxy routes under `/api/wnba/*`.

The proxy routes cache responses (5–60 minutes depending on volatility) so a busy page (e.g. `/teams` with 14 roster fetches behind it) only hits ESPN once until the cache expires.

### Optional: refresh player headshots

The navbar has a small refresh button that calls `POST /api/wnba/headshots/refresh`. It downloads every WNBA player's headshot to `public/headshots/` so they can be served locally instead of hot-linking ESPN's CDN. The cache directory is gitignored. Missing-headshot URLs are short-circuited with a transparent 1×1 PNG cached for 24h, so dev-server logs stay clean.

## Project layout

```
app/
├─ page.tsx                         live games dashboard
├─ game/[id]/page.tsx               game detail page
├─ teams/page.tsx                   teams grid + player search
├─ teams/[teamId]/page.tsx          team detail + roster
├─ teams/[teamId]/players/[id]/page.tsx   player profile + season averages + news
├─ leaders/[stat]/page.tsx          league leaderboard for one stat
└─ api/wnba/                        ESPN proxy routes
   ├─ scoreboard, summary, headshot, headshots/refresh
   ├─ teams, teams/[id], teams/[id]/leaders
   ├─ athletes/[id], players (aggregated), injuries, leaders

components/
├─ Navbar, GameCard, ScoreboardHero, LiveBoxScore, PlayByPlayFeed
├─ ShotChart, PlayerModal, PlayerSearch, SpoilerVeilControls, Providers

hooks/        useLiveGames, useGameData, useSpoilerDelay
lib/          espn (types + fetchers), teams (color palette), spoiler-engine, utils
store/        useAppStore (Zustand) — spoiler/sync mode + delay
```

## Data source & attribution

All sports data and images come from [ESPN's public WNBA endpoints](https://www.espn.com/wnba/). News articles link back to the original ESPN article in a new tab. This project is unaffiliated with ESPN or the WNBA.

## License

This is a personal project — no license attached. If you fork or reuse it, please respect ESPN's terms of service for the underlying data.
