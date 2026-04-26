import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)";

function fmt(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// Returns upcoming WNBA games for the next ~30 days. ESPN's scoreboard
// supports a date range (YYYYMMDD-YYYYMMDD), so this is a single fetch.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const daysParam = parseInt(url.searchParams.get("days") ?? "", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(60, daysParam) : 30;

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + days);

  try {
    const espnUrl =
      `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard` +
      `?dates=${fmt(start)}-${fmt(end)}&limit=400`;
    const res = await fetch(espnUrl, {
      headers: { "User-Agent": UA },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch (err) {
    console.error("[WNBA schedule]", err);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
