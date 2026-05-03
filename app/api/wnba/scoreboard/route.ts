import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)" },
        next: { revalidate: 5 },
      }
    );
    if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[WNBA scoreboard]", err);
    return NextResponse.json({ events: [] });
  }
}
