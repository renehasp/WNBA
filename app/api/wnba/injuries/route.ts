import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)";

// Proxies ESPN's league-wide WNBA injury report. Cached for a few minutes
// since it changes infrequently and every player page reads from it.
export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/injuries",
      { headers: { "User-Agent": UA }, next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch (err) {
    console.error("[WNBA injuries]", err);
    return NextResponse.json({ injuries: [] });
  }
}
