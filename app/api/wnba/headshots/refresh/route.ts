import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";
// Bulk download — give it room to walk every team roster.
export const maxDuration = 300;

const CACHE_DIR = path.join(process.cwd(), "public", "headshots");
const CONCURRENCY = 6;

async function ensureDir() {
  try { await fs.mkdir(CACHE_DIR, { recursive: true }); } catch {}
}

async function alreadyHave(id: string): Promise<boolean> {
  for (const ext of ["png", "jpg"]) {
    try {
      await fs.access(path.join(CACHE_DIR, `${id}.${ext}`));
      return true;
    } catch {}
  }
  return false;
}

const ESPN_HEADERS = {
  Referer: "https://www.espn.com/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

async function downloadOne(
  id: string,
  preferredHref?: string,
): Promise<"downloaded" | "cached" | "missing"> {
  if (await alreadyHave(id)) return "cached";

  const candidates: Array<{ url: string; ext: string }> = [];
  if (preferredHref) {
    const m = preferredHref.match(/\.(png|jpg|jpeg)(?:\?|$)/i);
    const ext = (m?.[1] ?? "png").toLowerCase().replace("jpeg", "jpg");
    candidates.push({ url: preferredHref, ext });
  }
  for (const ext of ["png", "jpg"]) {
    if (candidates.some((c) => c.ext === ext)) continue;
    candidates.push({
      url: `https://a.espncdn.com/i/headshots/wnba/players/full/${id}.${ext}`,
      ext,
    });
  }

  for (const { url, ext } of candidates) {
    try {
      const res = await fetch(url, { headers: ESPN_HEADERS, cache: "no-store" });
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        await fs.writeFile(path.join(CACHE_DIR, `${id}.${ext}`), buf);
        // Clear any stale negative marker so the per-id route serves the new bytes.
        try { await fs.unlink(path.join(CACHE_DIR, `${id}.404`)); } catch {}
        return "downloaded";
      }
    } catch {}
  }

  try { await fs.writeFile(path.join(CACHE_DIR, `${id}.404`), ""); } catch {}
  return "missing";
}

interface ESPNTeamsResponse {
  sports?: Array<{
    leagues?: Array<{
      teams?: Array<{ team: { id: string; abbreviation?: string; displayName?: string } }>;
    }>;
  }>;
}

interface ESPNRosterResponse {
  athletes?: Array<{
    id: string;
    headshot?: { href?: string };
  }>;
}

async function fetchTeams(): Promise<Array<{ id: string }>> {
  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams",
    { headers: ESPN_HEADERS, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`teams: HTTP ${res.status}`);
  const data: ESPNTeamsResponse = await res.json();
  const teams = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return teams.map((t) => ({ id: t.team.id }));
}

async function fetchRoster(teamId: string): Promise<Array<{ id: string; href?: string }>> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${teamId}/roster`,
    { headers: ESPN_HEADERS, cache: "no-store" },
  );
  if (!res.ok) return [];
  const data: ESPNRosterResponse = await res.json();
  return (data.athletes ?? [])
    .filter((a) => a.id)
    .map((a) => ({ id: a.id, href: a.headshot?.href }));
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(n, items.length) },
    async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return out;
}

export async function POST() {
  try {
    await ensureDir();

    const teams = await fetchTeams();
    const rosters = await pool(teams.map((t) => t.id), 4, fetchRoster);

    const dedup = new Map<string, { id: string; href?: string }>();
    rosters.flat().forEach((p) => { if (!dedup.has(p.id)) dedup.set(p.id, p); });
    const players = Array.from(dedup.values());

    const results = await pool(
      players,
      CONCURRENCY,
      (p) => downloadOne(p.id, p.href),
    );

    const counts = { downloaded: 0, cached: 0, missing: 0 };
    for (const r of results) counts[r]++;

    return NextResponse.json({
      ok: true,
      teams: teams.length,
      players: players.length,
      ...counts,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? "refresh failed" },
      { status: 502 },
    );
  }
}
