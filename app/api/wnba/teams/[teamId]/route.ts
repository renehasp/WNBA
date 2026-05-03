import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; WNBASyncCourt/1.0)";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  try {
    const [teamRes, rosterRes] = await Promise.all([
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${teamId}`,
        { headers: { "User-Agent": UA }, next: { revalidate: 600 } }
      ),
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${teamId}/roster`,
        { headers: { "User-Agent": UA }, next: { revalidate: 600 } }
      ),
    ]);

    if (!teamRes.ok) throw new Error(`Team ESPN ${teamRes.status}`);

    const teamJson = await teamRes.json();
    const rosterJson = rosterRes.ok ? await rosterRes.json() : { athletes: [] };

    return NextResponse.json(
      {
        team: teamJson?.team ?? null,
        athletes: rosterJson?.athletes ?? [],
      },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
  } catch (err) {
    console.error("[WNBA team]", err);
    return NextResponse.json({ team: null, athletes: [] });
  }
}
