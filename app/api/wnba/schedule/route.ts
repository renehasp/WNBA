import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)";

function fmt(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// Returns WNBA games for a date range. Supports both historical (past N days) and future games.
// By default fetches past 10 days + today. Pass ?futureOnly=true to fetch future games only.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const futureOnly = url.searchParams.get("futureOnly") === "true";
  const daysParam = parseInt(url.searchParams.get("days") ?? "", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(180, daysParam) : 180;

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  if (!futureOnly) {
    start.setUTCDate(start.getUTCDate() - 10);
  }

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
    return NextResponse.json({ events: [] });
  }
}
