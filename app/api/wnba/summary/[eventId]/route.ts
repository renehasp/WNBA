import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/summary?event=${eventId}`,
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
    console.error("[WNBA summary]", err);
    return NextResponse.json({ plays: [], boxscore: null });
  }
}
