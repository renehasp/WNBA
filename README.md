# WNBA SyncCourt

A live WNBA game tracker and roster browser built with Next.js. Pulls live scores, play-by-play, box scores, team rosters, league leaderboards, and player news straight from ESPN's public API — no API keys required.

<img width="1077" height="1751" alt="image" src="https://github.com/user-attachments/assets/de642807-e366-41ca-98ee-964194ea3719" />

## What's New in v1.2

- **Team page popup menu** — on the individual team detail page (`/teams/[id]`), clicking the team name reveals a popup menu with quick links to the official WNBA team page, ESPN team page, and Wikipedia page for that team.
- **Fixed WNBA team links** — all WNBA team page links now use the correct URL format with team IDs (e.g. `https://www.wnba.com/team/1611661325/indiana-fever`), ensuring they resolve properly instead of returning "page not found."
- **Improved popup positioning** — the team info popup is intelligently positioned to the left of the team name to prevent clipping on smaller viewports or constrained container widths.

## What's New in v1.1

- **Box score team totals** — a bold Totals row at the bottom of each team's box score aggregates points, rebounds, assists, steals, blocks, turnovers, fouls, FG/3PT/FT fractions, and minutes.
- **Play-by-play filters** — filter the live play feed by individual player (dropdown) or by play type (multi-select chips: 3PT, Dunk, Steal, Block, etc.). A live count badge shows how many plays match; a Clear button resets everything.
- **Sticky mini scoreboard** — once you scroll past the main scoreboard on a game page, a compact score bar slides down and sticks to the top, showing team logos, current score, period, and clock. Dismiss it any time with the × button.
- **Full team names everywhere** — team cards and the scoreboard now show the full name (e.g. *Indiana Fever*) alongside the logo. Clicking the name opens the official WNBA team page in a new tab.
- **Richer player cards** — the quick-look player modal now includes a Career section: years of WNBA experience, college, hometown, height, and weight, pulled live from ESPN.
- **New app logo** — replaced the generic basketball icon with a custom SyncCourt mark; updated the PWA icon and navbar.

## Features

- **Live games dashboard** (`/`) — every WNBA game today with live scores, period/clock, and team-color theming. Cards involving your favorite team get a soft yellow accent.
- **Game page** (`/game/[id]`)
  - **Animated scoreboard** with team-color theming, large team-logo watermarks, and timeout dot trackers. The team-logo rings are clickable links to each team's page.
  - **Spoiler veil aware:** when broadcast delay or TV-sync mode is active, both the score and a second clock above the live one (yellow for delay, blue for TV-synced) display the **delayed** state. The live clock and live period stay visible underneath as a faded reference.
  - **Play-by-play feed** with player avatars, team-logo background watermarks, and a "Today's Stats" modal that opens when you tap an avatar.
  - **Live box score** with sortable columns (PTS / REB / AST / STL / BLK / TO / PF / FG / 3PT / FT / MIN) plus an Impact composite. Each player row's photo + name links to the full player page; clicking the stat cells opens the quick-look modal.
  - **Shot chart** — proper half-court SVG with WNBA geometry (16×19 ft lane, 22.15 ft uniform 3-pt arc), filled-dot makes / X-mark misses **color-coded by team**, per-team FG and 3PT summaries at the top, Team / Result / Period / **Player** filters, and a **time scrubber** with Q1/Q2/Q3/Q4/OT/Live tick markers (clickable to jump). Pinning the slider to the right keeps it on the live (veil-respecting) edge.
- **Spoiler veil** — broadcast delay slider that buffers plays so play-by-play can be replayed alongside a delayed TV feed.
- **Teams browser** (`/teams`) — every WNBA team as a color-themed card with a search dropdown that finds any player by first or last name. Favorite team's card and favorite team's players in search results are tinted yellow.
- **Team page** (`/teams/[teamId]`) — team header with record + standing, full roster sorted MVP → bench by season PPG, with 🏆🥈🥉 podium emojis for the top 3 scorers and 🐣 / 🤕 markers for rookies and currently-injured players.
- **Player page** (`/teams/[teamId]/players/[playerId]`) — large headshot, position, team, health/injury status (with body part, side, and estimated return date when available), season averages with hover-to-reveal stat names, ESPN news section (with thumbnails, descriptions, source link, and relative timestamps).
- **League leaderboards** (`/leaders/[stat]`) — click any stat on a player page (PTS, REB, AST, FG%, etc.) to see the league-wide ranking with podium emojis for the top 3. Favorite team's players are tinted yellow.
- **Schedule** (`/schedule`) — upcoming games for the next 30 days, grouped by date in the user-selected time zone. Each card shows the visiting + home team logos, tip-off time, venue, city, and broadcast networks. Games involving your favorite team get a yellow accent.
- **Settings** (`/settings`) — accessed via the cog icon in the navbar:
  - **Font size** (85% – 150%) applied at the root html font-size; scales every rem-based UI element across every page. Persisted across reloads.
  - **Time zone** dropdown (Eastern / Central / Mountain / Pacific / etc., or device default). Drives all date/time displays on the schedule page.
  - **Favorite team** dropdown — picks one WNBA team for personalized highlights. The team and its players are tinted **light yellow** in lists across the app (teams grid, schedule, leaderboards, search, home page game cards).

## Tech stack

- [Next.js 16](https://nextjs.org/) with the App Router
- React 19, TypeScript
- Tailwind CSS v4
- [TanStack Query](https://tanstack.com/query) for server state
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Zustand](https://github.com/pmndrs/zustand) for spoiler-veil state
- [Lucide](https://lucide.dev/) icons
- ESPN's public WNBA endpoints (no key required)

<img width="1062" height="1731" alt="image" src="https://github.com/user-attachments/assets/e110b0f8-df6b-4ec9-b8a1-b77d55d05d4e" />


## Prerequisites

- **Node.js 20+** (the project was developed against Node 24)
- **npm** (or yarn / pnpm / bun — examples below use npm)

## Getting started

```bash

# 1. Install OpenJS
  winget install OpenJS.NodeJS.LTS
  open a new terminal window after it finishes

# 2. Clone
git clone https://github.com/renehasp/WNBA.git
CHANGE DIRECTORY TO WNBA-SyncCourt

# 3. Install dependencies
winget install OpenJS.NodeJS.LTS
  open a new terminal window after it finishes
  npm install
  npm audit fix --force

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the dev server hot-reloads on file changes.

> **Windows users:** there's also a `run.bat` in the project root that runs `npm run dev` if you'd rather double-click it.

## Docker

The project includes a `docker-compose.yml` for both development and production environments.

> **Note:** These commands use `docker compose` (the newer built-in syntax). If you have an older Docker version, use `docker-compose` instead, or install it with `apt install docker-compose` on Ubuntu/Debian or via your package manager.



### Development with Docker

Run the dev server with hot reload inside a container:

```bash
docker compose up app-dev
```

The dev server will start on [http://localhost:3000](http://localhost:3000) and automatically reload when you change files (volumes are mounted for live editing).

### Production with Docker

Production pull latest with Docker in ubuntu
```bash
git pull origin main && docker compose --profile prod up --build app-prod
From https://github.com/renehasp/WNBA-SyncCourt
```


Build and run the optimized production image:

```bash
docker compose --profile prod up app-prod
```

The production server will be available at [http://localhost:1997](http://localhost:1997).

To rebuild the production image after changes:

```bash
docker compose --profile prod up --build app-prod
```

### Stopping Docker containers

```bash
# Stop dev server
docker compose down

# Stop production server
docker compose --profile prod down
```

### Using docker-compose (legacy command)

If your system has the older `docker-compose` command instead of `docker compose`, simply replace `docker compose` with `docker-compose` in any of the commands above:

```bash
# Examples
docker-compose up app-dev
docker-compose --profile prod up app-prod
docker-compose down
```

## Run on your phone (LAN access)

You can browse the dev server from any phone or tablet on the same Wi-Fi.

1. **Find your PC's local IP** (`ipconfig` on Windows, `ifconfig` / `ip a` on macOS / Linux). Look for an `IPv4 Address` on your Wi-Fi adapter, e.g. `192.168.1.42`.
2. **Start the dev server bound to all interfaces:**
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
3. **Allow port 3000 through your firewall.** Windows usually pops a prompt the first time. If you missed it, run this once as admin:
   ```cmd
   netsh advfirewall firewall add rule name="Next dev 3000" dir=in action=allow protocol=TCP localport=3000
   ```
4. **On your phone**, open `http://192.168.1.42:3000` (your actual IP). HMR works — edit on the PC, the phone refreshes.

`next.config.ts` already lists `192.168.*.*` and `100.64.*.*` (Tailscale CGNAT) under `allowedDevOrigins`, which is required by Next.js 15+ for cross-origin dev resources. Add your own subnet there if needed.

### Install as a PWA on Android

The app ships with a basic web app manifest (`public/manifest.json`) and an SVG icon (`public/icon.svg`).

- Open the app in Chrome on Android.
- Tap **⋮ menu → Install app** (or **Add to Home screen**).
- It launches like a standalone app, full-screen, no browser chrome.

For real public-internet access, deploy to [Vercel](https://vercel.com/new) — push `main` and import the repo, no config needed. Vercel gives you a free HTTPS URL accessible anywhere.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000. |
| `npm run dev -- -H 0.0.0.0` | Same, but listening on all network interfaces (for phone / LAN access). |
| `npm run build` | Production build. |
| `npm run start` | Run the production build (after `npm run build`). |
| `npm run lint` | Run ESLint. |

## Configuration

No `.env` file is required for normal use — the app talks to ESPN's public APIs through proxy routes under `/api/wnba/*`.

The proxy routes cache responses (5–60 minutes depending on volatility) so a busy page (e.g. `/teams` with 14 roster fetches behind it) only hits ESPN once until the cache expires.

### Optional: refresh player headshots

The navbar has a small refresh button that calls `POST /api/wnba/headshots/refresh`. It downloads every WNBA player's headshot to `public/headshots/` so they can be served locally instead of hot-linking ESPN's CDN. The cache directory is gitignored. Missing-headshot URLs are short-circuited with a transparent 1×1 PNG cached for 24h, so dev-server logs stay clean.

### Allowing more LAN devices

If your phone is on a non-standard subnet (a guest network, a VPN, etc.), you'll see a **"Blocked cross-origin request to Next.js dev resource"** warning on first load. Add the host to `next.config.ts`:

```ts
allowedDevOrigins: [
  "192.168.1.244",
  "192.168.*.*",
  "100.64.*.*",     // Tailscale / CGNAT
  "10.0.0.*",       // common alternate home subnet
],
```

Wildcards work; CIDR ranges (`/24`, etc.) do not — use `*` instead.

## Project layout

```
app/
├─ page.tsx                         live games dashboard
├─ game/[id]/page.tsx               game detail page (scoreboard, plays, box, shot chart)
├─ teams/page.tsx                   teams grid + player search
├─ teams/[teamId]/page.tsx          team detail + roster
├─ teams/[teamId]/players/[id]/page.tsx   player profile + season averages + news
├─ leaders/[stat]/page.tsx          league leaderboard for one stat
├─ schedule/page.tsx                upcoming games (TZ-aware, grouped by date)
├─ settings/page.tsx                font size, time zone, favorite team
└─ api/wnba/                        ESPN proxy routes
   ├─ scoreboard, summary, schedule, headshot, headshots/refresh
   ├─ teams, teams/[id], teams/[id]/leaders
   ├─ athletes/[id], players (aggregated), injuries, leaders

components/
├─ Navbar, GameCard, ScoreboardHero, LiveBoxScore, PlayByPlayFeed
├─ ShotChart (half-court + scrubber + player filter), PlayerModal, PlayerSearch
├─ SpoilerVeilControls, Providers (with FontScaleApplier)

hooks/        useLiveGames, useGameData, useSpoilerDelay
lib/          espn (types + fetchers), teams (color palette), spoiler-engine, utils
store/        useAppStore (Zustand) — spoiler/sync mode + delay + fontScale +
              timeZone + favoriteTeamId, all persisted to localStorage
public/       icon.svg (PWA), manifest.json
```

## Data source & attribution
<img width="1073" height="1281" alt="image" src="https://github.com/user-attachments/assets/d5204def-f2bd-46d9-b4c2-1d8d1e72f555" />

All sports data and images come from [ESPN's public WNBA endpoints](https://www.espn.com/wnba/). News articles link back to the original ESPN article in a new tab. This project is unaffiliated with ESPN or the WNBA.

Copyright 2026 NBA Media Ventures, LLC. All rights reserved. No portion of WNBA.com may be duplicated, redistributed or manipulated in any form.

## License

This is a personal project — no license attached. If you fork or reuse it, please respect ESPN's terms of service for the underlying data.
