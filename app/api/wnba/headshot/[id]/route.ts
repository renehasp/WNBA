import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

const CACHE_DIR = path.join(process.cwd(), "public", "headshots");
// Re-attempt 404s after this much time so newly-added players eventually populate.
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;

async function ensureDir() {
  try { await fs.mkdir(CACHE_DIR, { recursive: true }); } catch {}
}

async function readCached(id: string): Promise<{ buf: Uint8Array; ext: string } | null> {
  for (const ext of ["png", "jpg"]) {
    try {
      const buf = await fs.readFile(path.join(CACHE_DIR, `${id}.${ext}`));
      return { buf: new Uint8Array(buf), ext };
    } catch {}
  }
  return null;
}

async function isNegativeFresh(id: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(CACHE_DIR, `${id}.404`));
    return Date.now() - stat.mtimeMs < NEGATIVE_TTL_MS;
  } catch {
    return false;
  }
}

async function fetchFromESPN(id: string): Promise<{ buf: Uint8Array; ext: string } | null> {
  for (const ext of ["png", "jpg"]) {
    const url = `https://a.espncdn.com/i/headshots/wnba/players/full/${id}.${ext}`;
    try {
      const res = await fetch(url, {
        headers: {
          Referer: "https://www.espn.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        cache: "no-store",
      });
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        await ensureDir();
        await fs.writeFile(path.join(CACHE_DIR, `${id}.${ext}`), buf);
        return { buf, ext };
      }
    } catch {}
  }
  return null;
}

async function writeNegativeMarker(id: string) {
  await ensureDir();
  try { await fs.writeFile(path.join(CACHE_DIR, `${id}.404`), ""); } catch {}
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) {
    return new NextResponse(null, { status: 400 });
  }

  // node's fs.readFile / fetch().arrayBuffer() return Uint8Array<ArrayBufferLike>,
  // but BodyInit only accepts ArrayBuffer-backed views. The data is always
  // ArrayBuffer-backed at runtime — TS just can't prove it.
  const cached = await readCached(id);
  if (cached) {
    return new NextResponse(cached.buf as unknown as BodyInit, {
      headers: {
        "Content-Type": `image/${cached.ext}`,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  }

  if (await isNegativeFresh(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const fetched = await fetchFromESPN(id);
  if (fetched) {
    return new NextResponse(fetched.buf as unknown as BodyInit, {
      headers: {
        "Content-Type": `image/${fetched.ext}`,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  }

  await writeNegativeMarker(id);
  return new NextResponse(null, { status: 404 });
}
