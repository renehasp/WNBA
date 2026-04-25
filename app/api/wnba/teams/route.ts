import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams?limit=50",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch (err) {
    console.error("[WNBA teams]", err);
    return NextResponse.json({ sports: [] }, { status: 500 });
  }
}
