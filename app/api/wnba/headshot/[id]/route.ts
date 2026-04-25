import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

const CACHE_DIR = path.join(process.cwd(), "public", "headshots");
// Re-attempt 404s after this much time so newly-added players eventually populate.
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;

// 1x1 fully-transparent PNG used when ESPN has no headshot for an athlete.
// Returning a cacheable image (rather than 404) keeps the browser from
// refetching on every navigation and avoids broken-image flicker.
const TRANSPARENT_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

function transparentResponse() {
  return new NextResponse(TRANSPARENT_PNG as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      // One-day browser cache so the same missing-headshot ID doesn't re-hit
      // this route on every page navigation.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      "X-Headshot-Status": "missing",
    },
  });
}

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
    return transparentResponse();
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
  return transparentResponse();
}
