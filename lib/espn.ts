// ESPN WNBA Public API — Types & Fetch Helpers

export interface ESPNTeam {
  id: string;
  uid?: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  name?: string;
  nickname?: string;
  slug?: string;
  location?: string;
  color?: string;
  alternateColor?: string;
  // Scoreboard / summary endpoints return a single string here.
  logo?: string;
  // Teams list / team detail endpoints return an array instead.
  logos?: Array<{ href: string; rel?: string[]; alt?: string; width?: number; height?: number }>;
  links?: unknown[];
}

export interface ESPNLeaderEntry {
  displayValue: string;
  value: number;
  athlete: {
    id: string;
    displayName: string;
    shortName?: string;
    headshot?: string;
  };
}

export interface ESPNLeader {
  name: string;
  displayName: string;
  shortDisplayName?: string;
  leaders: ESPNLeaderEntry[];
}

export interface ESPNCompetitor {
  id: string;
  uid?: string;
  type?: string;
  order?: number;
  homeAway: "home" | "away";
  winner?: boolean;
  team: ESPNTeam;
  score: string;
  linescores?: Array<{ value: number }>;
  leaders?: ESPNLeader[];
  records?: Array<{ name: string; summary: string }>;
}

export interface ESPNStatusType {
  id: string;
  name: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface ESPNStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: ESPNStatusType;
}

export interface ESPNVenue {
  id?: string;
  fullName: string;
  address?: { city: string; state?: string; country?: string };
  indoor?: boolean;
}

export interface ESPNBroadcast {
  market?: string;
  names: string[];
}

export interface ESPNCompetition {
  id: string;
  date: string;
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
  venue?: ESPNVenue;
  broadcasts?: ESPNBroadcast[];
  notes?: Array<{ type: string; headline: string }>;
  neutralSite?: boolean;
}

export interface ESPNEvent {
  id: string;
  uid?: string;
  date: string;
  name: string;
  shortName: string;
  season?: { year: number; type: number; slug: string };
  status: ESPNStatus;
  competitions: ESPNCompetition[];
  links?: unknown[];
}

export interface ESPNScoreboardResponse {
  events: ESPNEvent[];
  day?: { date: string };
  leagues?: unknown[];
}

// Summary types

export interface ESPNAthleteRef {
  id: string;
  displayName: string;
  shortName?: string;
  headshot?: string | { href: string; alt?: string };
  jersey?: string;
  position?: { abbreviation: string; displayName?: string };
  team?: { id: string; abbreviation?: string };
}

export interface ESPNPlay {
  id: string;
  sequenceNumber?: string;
  text: string;
  clock: { displayValue: string; value?: number };
  period: { number: number; displayValue?: string };
  scoringPlay?: boolean;
  homeScore?: string;
  awayScore?: string;
  scoreValue?: number;
  type?: { id: string; text: string };
  coordinate?: { x: number; y: number };
  // ESPN puts the acting team's ID directly on the play (this is the most
  // reliable side-of-the-court signal for the shot chart).
  team?: { id: string; abbreviation?: string };
  // Newer endpoints use `participants` instead of `athletes`.
  participants?: Array<{
    athlete: ESPNAthleteRef;
    type?: { text: string; name?: string };
    order?: number;
  }>;
  athletes?: Array<{
    athlete: ESPNAthleteRef;
    type?: { text: string; name?: string };
  }>;
  wallClock?: string;
  shootingPlay?: boolean;
  shotMade?: boolean;
}

export interface ESPNPlayerStats {
  athlete: ESPNAthleteRef;
  stats: string[];
  starter?: boolean;
  didNotPlay?: boolean;
  active?: boolean;
  ejected?: boolean;
  reason?: string;
}

export interface ESPNTeamStats {
  team: ESPNTeam;
  statistics: Array<{
    names?: string[];
    keys?: string[];
    labels?: string[];
    descriptions?: string[];
    athletes: ESPNPlayerStats[];
    totals?: string[];
  }>;
}

export interface ESPNBoxscore {
  teams?: Array<{ team: ESPNTeam; statistics?: Array<{ name: string; displayValue: string; label?: string }> }>;
  players?: ESPNTeamStats[];
}

export interface ESPNGameInfo {
  venue?: ESPNVenue;
  attendance?: number;
  officials?: Array<{ fullName: string; position?: { displayName: string } }>;
}

export interface ESPNSummaryResponse {
  plays?: ESPNPlay[];
  boxscore?: ESPNBoxscore;
  gameInfo?: ESPNGameInfo;
  header?: {
    id: string;
    uid?: string;
    season?: { year: number; type: number };
    timeValid?: boolean;
    competitions: ESPNCompetition[];
  };
}

// Fetch helpers — calls our Next.js proxy routes to avoid CORS

export async function fetchScoreboard(): Promise<ESPNScoreboardResponse> {
  const res = await fetch("/api/wnba/scoreboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`Scoreboard fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchGameSummary(eventId: string): Promise<ESPNSummaryResponse> {
  const res = await fetch(`/api/wnba/summary/${eventId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`);
  return res.json();
}

// Teams / Roster / Athlete endpoints — used by the /teams browser

export interface ESPNTeamRecordItem {
  name?: string;
  type?: string;
  summary?: string;
  stats?: Array<{ name: string; value: number }>;
}

export interface ESPNRosterAthlete {
  id: string;
  uid?: string;
  guid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName: string;
  shortName?: string;
  weight?: number;
  displayWeight?: string;
  height?: number;
  displayHeight?: string;
  age?: number;
  dateOfBirth?: string;
  birthPlace?: { city?: string; state?: string; country?: string };
  jersey?: string;
  experience?: { years?: number };
  college?: { name?: string };
  position?: { id?: string; name?: string; displayName?: string; abbreviation?: string };
  headshot?: { href?: string; alt?: string };
  status?: { id?: string; name?: string; type?: string };
  injuries?: Array<{ status?: string; date?: string }>;
}

export interface ESPNTeamsListResponse {
  sports?: Array<{
    leagues?: Array<{
      teams?: Array<{ team: ESPNTeam & { record?: { items?: ESPNTeamRecordItem[] } } }>;
    }>;
  }>;
}

export interface ESPNTeamWithRoster {
  team: ESPNTeam & { record?: { items?: ESPNTeamRecordItem[] }; standingSummary?: string };
  athletes: ESPNRosterAthlete[];
}

// ESPN's athlete stats shape varies; keep this loose and parse defensively.
export interface ESPNAthleteOverview {
  athlete?: ESPNRosterAthlete & {
    team?: ESPNTeam;
    displayHeight?: string;
    displayWeight?: string;
  };
  statistics?: {
    displayName?: string;
    labels?: string[];
    names?: string[];
    displayNames?: string[];
    splits?: Array<{ displayName?: string; stats?: string[] }>;
    season?: { year?: number; displayName?: string };
  };
  // Some endpoints nest under categories instead
  categories?: Array<{
    name?: string;
    displayName?: string;
    abbreviations?: string[];
    names?: string[];
    displayNames?: string[];
    averages?: string[];
    totals?: string[];
    stats?: Array<{ name?: string; abbreviation?: string; value?: number; displayValue?: string }>;
  }>;
  news?: ESPNNewsArticle[];
}

export interface ESPNNewsArticle {
  id?: number | string;
  headline?: string;
  description?: string;
  byline?: string;
  published?: string;
  lastModified?: string;
  type?: string;
  premium?: boolean;
  images?: Array<{ url?: string; width?: number; height?: number; caption?: string; alt?: string }>;
  links?: {
    web?: { href?: string; self?: { href?: string } };
    api?: { self?: { href?: string } };
    mobile?: { href?: string };
  };
  categories?: Array<{ type?: string; description?: string }>;
}

export async function fetchTeams(): Promise<ESPNTeamsListResponse> {
  const res = await fetch(`/api/wnba/teams`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Teams fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchTeam(teamId: string): Promise<ESPNTeamWithRoster> {
  const res = await fetch(`/api/wnba/teams/${teamId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Team fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAthleteOverview(athleteId: string): Promise<ESPNAthleteOverview> {
  const res = await fetch(`/api/wnba/athletes/${athleteId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Athlete fetch failed: ${res.status}`);
  return res.json();
}

// League-wide injury report. Per-team groups with rich detail (body part, side,
// expected return). Used to enrich the basic status string from the roster.
export interface ESPNInjuryEntry {
  id?: string;
  status?: string;
  date?: string;
  longComment?: string;
  shortComment?: string;
  athlete?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    links?: Array<{ rel?: string[]; href?: string }>;
  };
  details?: {
    type?: string;
    detail?: string;
    side?: string;
    returnDate?: string;
    fantasyStatus?: { description?: string; abbreviation?: string };
  };
  type?: { name?: string; description?: string; abbreviation?: string };
}

export interface ESPNInjuriesResponse {
  injuries?: Array<{
    id?: string;
    displayName?: string;
    abbreviation?: string;
    injuries?: ESPNInjuryEntry[];
  }>;
}

export async function fetchLeagueInjuries(): Promise<ESPNInjuriesResponse> {
  const res = await fetch(`/api/wnba/injuries`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Injuries fetch failed: ${res.status}`);
  return res.json();
}

export interface ESPNTeamLeaders {
  season: number | null;
  ppg: Record<string, number>;
}

export async function fetchTeamLeaders(teamId: string): Promise<ESPNTeamLeaders> {
  const res = await fetch(`/api/wnba/teams/${teamId}/leaders`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Team leaders fetch failed: ${res.status}`);
  return res.json();
}

export interface ESPNPlayerSearchEntry {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  jersey: string | null;
  position: string | null;
  headshot: string | null;
  teamId: string;
  teamAbbr: string;
  teamShortName: string;
  teamLogo: string | null;
}

export async function fetchAllPlayers(): Promise<{ players: ESPNPlayerSearchEntry[] }> {
  const res = await fetch(`/api/wnba/players`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Players fetch failed: ${res.status}`);
  return res.json();
}

export interface ESPNLeagueLeaderEntry {
  rank: number;
  athleteId: string;
  teamId: string | null;
  value: number | null;
  displayValue: string;
}

export interface ESPNLeagueLeaderCategory {
  name: string;
  displayName: string;
  abbreviation: string;
  leaders: ESPNLeagueLeaderEntry[];
}

export interface ESPNLeagueLeadersResponse {
  season: number | null;
  categories: ESPNLeagueLeaderCategory[];
}

export async function fetchLeagueLeaders(): Promise<ESPNLeagueLeadersResponse> {
  const res = await fetch(`/api/wnba/leaders`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Leaders fetch failed: ${res.status}`);
  return res.json();
}

// ESPN's injury entries don't expose athlete.id directly — pull it from the
// player-card link URL (path pattern .../id/{id}/...).
export function getAthleteIdFromInjuryEntry(entry: ESPNInjuryEntry): string | null {
  const link =
    entry.athlete?.links?.find((l) => l.rel?.includes("playercard"))?.href ??
    entry.athlete?.links?.[0]?.href ??
    null;
  if (!link) return null;
  const m = link.match(/\/id\/(\d+)(?:\/|$)/);
  return m?.[1] ?? null;
}

// Format a roster/injury entry into a human-readable label.
// Ex: "Out — Right Knee Surgery"  ·  "Out — Knee"  ·  "Day-to-Day"
export function formatInjuryLabel(entry: ESPNInjuryEntry | null | undefined): string {
  if (!entry) return "";
  const status = (entry.status ?? entry.type?.description ?? "").trim();
  const parts: string[] = [];
  if (entry.details?.side) parts.push(entry.details.side);
  if (entry.details?.type) parts.push(entry.details.type);
  if (entry.details?.detail) parts.push(entry.details.detail);
  const detail = parts.join(" ").trim();
  if (status && detail) return `${status} — ${detail}`;
  return status || detail || "";
}

// Pull a per-game season-averages row out of ESPN's varying shapes.
// Returns parallel labels + values arrays so callers can render any subset.
export function extractSeasonAverages(
  data: ESPNAthleteOverview | null | undefined,
): { labels: string[]; values: string[]; seasonLabel?: string } | null {
  if (!data) return null;

  // Shape A: data.statistics.{labels,names,splits[0].stats}
  const stats = data.statistics;
  if (stats?.splits?.length) {
    const labels = stats.labels ?? stats.displayNames ?? stats.names ?? [];
    const values = stats.splits[0]?.stats ?? [];
    if (labels.length && values.length) {
      return { labels, values, seasonLabel: stats.season?.displayName ?? stats.displayName };
    }
  }

  // Shape B: data.categories[].{averages, abbreviations|names|displayNames}
  const cats = data.categories ?? [];
  for (const c of cats) {
    const labels = c.abbreviations ?? c.displayNames ?? c.names ?? [];
    const values = c.averages ?? c.totals ?? [];
    if (labels.length && values.length) {
      return { labels, values, seasonLabel: c.displayName ?? c.name };
    }
    // Shape C: stats: [{abbreviation, displayValue}]
    if (c.stats?.length) {
      const labels = c.stats.map((s) => s.abbreviation ?? s.name ?? "").filter(Boolean);
      const values = c.stats.map((s) => s.displayValue ?? (s.value != null ? String(s.value) : ""));
      if (labels.length && values.length) {
        return { labels, values, seasonLabel: c.displayName ?? c.name };
      }
    }
  }

  return null;
}

// Helper: extract headshot URL from various ESPN formats
export function getHeadshotUrl(
  headshot: string | { href?: string; alt?: string } | null | undefined,
): string | null {
  if (!headshot) return null;
  if (typeof headshot === "string") return headshot;
  return headshot.href ?? null;
}

// Helper: get athlete headshot by ID — proxied through our server to avoid ESPN hotlink blocking
export function getAthleteHeadshotById(athleteId: string): string {
  return `/api/wnba/headshot/${athleteId}`;
}

// Helper: extract a usable logo URL from either of ESPN's two shapes.
// Scoreboard/summary uses `logo: string`; teams list/detail uses `logos: [{href}]`.
// Prefers the "default" (non-dark) logo when multiple variants are returned.
export function getTeamLogoUrl(team: ESPNTeam | null | undefined): string | null {
  if (!team) return null;
  if (team.logo) return team.logo;
  if (team.logos && team.logos.length) {
    const preferred = team.logos.find(
      (l) => l.rel?.includes("default") && !l.rel?.includes("dark"),
    );
    return (preferred ?? team.logos[0]).href ?? null;
  }
  return null;
}

// Parse ESPN's displayClock into numeric minutes/seconds.
// In the last minute of a period ESPN drops the colon and emits sub-minute
// values like "45.3", "9.8", "0.4" — naïve `.split(":")` treats those as
// minutes, breaking both scoreboard rendering and elapsed-time math.
export function parseGameClock(raw: string | undefined | null): { minutes: number; seconds: number } {
  if (!raw) return { minutes: 0, seconds: 0 };
  const t = raw.trim();
  if (t.includes(":")) {
    const [m, s] = t.split(":");
    const min = parseInt(m, 10);
    const sec = parseFloat(s);
    return {
      minutes: Number.isFinite(min) ? min : 0,
      seconds: Number.isFinite(sec) ? sec : 0,
    };
  }
  const n = parseFloat(t);
  return { minutes: 0, seconds: Number.isFinite(n) ? n : 0 };
}

// Format ESPN's displayClock for the scoreboard, preserving the sub-minute
// tenths (e.g. "0:45.3"). Returns padded strings so the layout stays stable.
export function formatGameClock(raw: string | undefined | null): { min: string; sec: string } {
  if (!raw) return { min: "10", sec: "00" };
  const t = raw.trim();
  if (t.includes(":")) {
    const [m, s] = t.split(":");
    return { min: m || "0", sec: s || "00" };
  }
  if (/^\d+(\.\d+)?$/.test(t)) {
    const dot = t.indexOf(".");
    if (dot < 0) return { min: "0", sec: t.padStart(2, "0") };
    return { min: "0", sec: t.slice(0, dot).padStart(2, "0") + t.slice(dot) };
  }
  return { min: "0", sec: "00" };
}
