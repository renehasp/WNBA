import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)";

interface RawLeader {
  athlete?: { $ref?: string };
  team?: { $ref?: string };
  value?: number;
  displayValue?: string;
}

interface RawCategory {
  name?: string;
  displayName?: string;
  abbreviation?: string;
  leaders?: RawLeader[];
}

// Returns the league-wide leaderboard for every available stat category.
// Each entry is parsed to flat { athleteId, teamId, value, displayValue, rank }
// so callers can render directly without resolving Core API $refs.
export async function GET() {
  const year = new Date().getFullYear();
  const candidates = [year, year - 1];

  for (const season of candidates) {
    try {
      const res = await fetch(
        `https://sports.core.api.espn.com/v2/sports/basketball/leagues/wnba/seasons/${season}/types/2/leaders?limit=200`,
        { headers: { "User-Agent": UA }, next: { revalidate: 1800 } }
      );
      if (!res.ok) continue;
      const data = await res.json();

      const categories = (data?.categories ?? []).map((cat: RawCategory) => {
        // ESPN sometimes returns leaders in non-strictly-descending order
        // (e.g. low-minute outliers spliced in). Parse, drop entries without
        // an athleteId, sort by value desc, then re-rank.
        const parsed = (cat.leaders ?? [])
          .map((l) => {
            const aMatch = l.athlete?.$ref?.match(/\/athletes\/(\d+)/);
            const tMatch = l.team?.$ref?.match(/\/teams\/(\d+)/);
            const value = typeof l.value === "number" ? l.value : parseFloat(l.displayValue ?? "");
            return {
              athleteId: aMatch?.[1] ?? null,
              teamId: tMatch?.[1] ?? null,
              value: Number.isFinite(value) ? value : null,
              displayValue: l.displayValue ?? "",
            };
          })
          .filter((e): e is { athleteId: string; teamId: string | null; value: number | null; displayValue: string } => !!e.athleteId);

        parsed.sort((a, b) => {
          const av = a.value ?? -Infinity;
          const bv = b.value ?? -Infinity;
          return bv - av;
        });

        const ranked = parsed.map((e, i) => ({ rank: i + 1, ...e }));

        return {
          name: cat.name,
          displayName: cat.displayName,
          abbreviation: cat.abbreviation,
          leaders: ranked,
        };
      });

      if (categories.length) {
        return NextResponse.json(
          { season, categories },
          { headers: { "Cache-Control": "public, max-age=900, s-maxage=900" } }
        );
      }
    } catch (err) {
      console.error("[WNBA league leaders]", season, err);
    }
  }

  return NextResponse.json({ season: null, categories: [] });
}
