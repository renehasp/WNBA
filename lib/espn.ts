// ESPN WNBA Public API — Types & Fetch Helpers

export interface ESPNTeam {
  id: string;
  uid?: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  name?: string;
  location?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
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

// Helper: extract headshot URL from various ESPN formats
export function getHeadshotUrl(headshot: ESPNAthleteRef["headshot"]): string | null {
  if (!headshot) return null;
  if (typeof headshot === "string") return headshot;
  return headshot.href ?? null;
}

// Helper: get athlete headshot by ID — proxied through our server to avoid ESPN hotlink blocking
export function getAthleteHeadshotById(athleteId: string): string {
  return `/api/wnba/headshot/${athleteId}`;
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
