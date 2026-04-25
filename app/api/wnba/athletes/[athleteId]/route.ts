import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)";

// Always merges bio + stats. ESPN's /overview endpoint has stats but no
// athlete bio, so we fetch the base /athletes/{id} for bio and the /overview
// (or /stats) endpoint for season stats in parallel and combine.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  const { athleteId } = await params;
  try {
    const [bioRes, overviewRes] = await Promise.all([
      fetch(
        `https://site.web.api.espn.com/apis/common/v3/sports/basketball/wnba/athletes/${athleteId}`,
        { headers: { "User-Agent": UA }, next: { revalidate: 300 } }
      ),
      fetch(
        `https://site.web.api.espn.com/apis/common/v3/sports/basketball/wnba/athletes/${athleteId}/overview`,
        { headers: { "User-Agent": UA }, next: { revalidate: 300 } }
      ),
    ]);

    const bio = bioRes.ok ? await bioRes.json() : null;
    const overview = overviewRes.ok ? await overviewRes.json() : null;

    // If overview lacks stats, fall back to the dedicated /stats endpoint.
    let statistics = overview?.statistics ?? null;
    let categories = overview?.categories ?? null;
    if (!statistics && !categories) {
      try {
        const statsRes = await fetch(
          `https://site.web.api.espn.com/apis/common/v3/sports/basketball/wnba/athletes/${athleteId}/stats`,
          { headers: { "User-Agent": UA }, next: { revalidate: 300 } }
        );
        if (statsRes.ok) {
          const stats = await statsRes.json();
          statistics = stats?.statistics ?? statistics;
          categories = stats?.categories ?? categories;
        }
      } catch {
        // ignore — we still return whatever we have
      }
    }

    // ESPN returns news as an object keyed by numeric strings ("0","1",...).
    // Normalize to an array for consumer convenience.
    const rawNews = overview?.news;
    const news = Array.isArray(rawNews)
      ? rawNews
      : rawNews && typeof rawNews === "object"
        ? Object.values(rawNews)
        : [];

    return NextResponse.json(
      {
        athlete: bio?.athlete ?? null,
        statistics,
        categories,
        news,
      },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
  } catch (err) {
    console.error("[WNBA athlete]", err);
    return NextResponse.json({ athlete: null, statistics: null }, { status: 500 });
  }
}
