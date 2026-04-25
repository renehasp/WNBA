import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)";

// Returns a flat map of athleteId → points-per-game for a team, used to sort
// the roster from MVP and down. Tries current calendar year first; falls back
// to prior year (the WNBA off-season makes the current year empty until May).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const year = new Date().getFullYear();
  const candidates = [year, year - 1];

  for (const season of candidates) {
    try {
      const res = await fetch(
        `https://sports.core.api.espn.com/v2/sports/basketball/leagues/wnba/seasons/${season}/types/2/teams/${teamId}/leaders`,
        { headers: { "User-Agent": UA }, next: { revalidate: 1800 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const ppgCat = (data?.categories ?? []).find(
        (c: { name?: string }) => c.name === "pointsPerGame",
      );
      const leaders = ppgCat?.leaders ?? [];
      if (!leaders.length) continue;

      const ppg: Record<string, number> = {};
      for (const entry of leaders) {
        const ref: string | undefined = entry?.athlete?.$ref;
        if (!ref) continue;
        const m = ref.match(/\/athletes\/(\d+)\??/);
        if (!m) continue;
        const id = m[1];
        const v = typeof entry.value === "number" ? entry.value : parseFloat(entry.displayValue);
        if (Number.isFinite(v)) ppg[id] = v;
      }

      return NextResponse.json(
        { season, ppg },
        { headers: { "Cache-Control": "public, max-age=900, s-maxage=900" } }
      );
    } catch (err) {
      console.error("[WNBA team leaders]", season, err);
    }
  }

  return NextResponse.json({ season: null, ppg: {} });
}
