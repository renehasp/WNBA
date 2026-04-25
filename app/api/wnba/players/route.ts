import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)";

interface RawTeam {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  logos?: Array<{ href: string; rel?: string[] }>;
}

interface RawAthlete {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  jersey?: string;
  position?: { abbreviation?: string; displayName?: string };
  headshot?: { href?: string };
}

// Fans out roster fetches across all teams server-side and returns a flat
// list optimized for the search dropdown on /teams. Cached aggressively
// since rosters change rarely.
export async function GET() {
  try {
    const teamsRes = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams?limit=50",
      { headers: { "User-Agent": UA }, next: { revalidate: 3600 } }
    );
    if (!teamsRes.ok) throw new Error(`teams ${teamsRes.status}`);
    const teamsJson = await teamsRes.json();
    const teams: RawTeam[] = (teamsJson?.sports?.[0]?.leagues?.[0]?.teams ?? []).map(
      (t: { team: RawTeam }) => t.team,
    );

    const rosters = await Promise.all(
      teams.map(async (team) => {
        try {
          const r = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${team.id}/roster`,
            { headers: { "User-Agent": UA }, next: { revalidate: 1800 } }
          );
          if (!r.ok) return { team, athletes: [] as RawAthlete[] };
          const j = await r.json();
          return { team, athletes: (j?.athletes ?? []) as RawAthlete[] };
        } catch {
          return { team, athletes: [] as RawAthlete[] };
        }
      }),
    );

    const players = rosters.flatMap(({ team, athletes }) =>
      athletes.map((a) => ({
        id: a.id,
        firstName: a.firstName ?? null,
        lastName: a.lastName ?? null,
        displayName: a.displayName,
        jersey: a.jersey ?? null,
        position: a.position?.abbreviation ?? a.position?.displayName ?? null,
        headshot: a.headshot?.href ?? null,
        teamId: team.id,
        teamAbbr: team.abbreviation,
        teamShortName: team.shortDisplayName ?? team.displayName,
        teamLogo: team.logos?.[0]?.href ?? null,
      })),
    );

    return NextResponse.json(
      { players },
      { headers: { "Cache-Control": "public, max-age=600, s-maxage=600" } },
    );
  } catch (err) {
    console.error("[WNBA all players]", err);
    return NextResponse.json({ players: [] }, { status: 500 });
  }
}
