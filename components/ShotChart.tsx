"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProcessedPlay } from "@/lib/spoiler-engine";
import type { ESPNCompetitor } from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { hexWithOpacity } from "@/lib/utils";

interface ShotChartProps {
  plays: ProcessedPlay[];
  home: ESPNCompetitor;
  away: ESPNCompetitor;
  teamMap?: Record<string, "home" | "away">;
}

// ── Full-court SVG constants ───────────────────────────────────────────────
const W = 500;
const H = 940;         // full court: ~2× half
const BX = W / 2;     // basket center X
const H_BY = H - 52;  // home basket Y (bottom)
const A_BY = 52;      // away basket Y (top)
const KEY_W = 160;
const KEY_H = 190;
const KEY_X = (W - KEY_W) / 2;
const FT_R = 60;
const THREE_R = 222;
const CRN_X = 30;     // corner 3PT line x offset from edge
// y-offset where the 3PT arc meets the corner line
const CRN_DY = Math.sqrt(Math.max(0, THREE_R ** 2 - (BX - CRN_X) ** 2));

// ── Court SVG ─────────────────────────────────────────────────────────────
function FullCourt({ homeColor, awayColor }: { homeColor: string; awayColor: string }) {
  const hc = hexWithOpacity(homeColor, 0.5);
  const ac = hexWithOpacity(awayColor, 0.5);
  const line = "rgba(255,255,255,0.13)";
  const lineFaint = "rgba(255,255,255,0.07)";

  return (
    <g>
      {/* Background */}
      <rect x={0} y={0} width={W} height={H} rx={10} fill="#0c0c1c" />
      {/* Court border */}
      <rect x={2} y={2} width={W - 4} height={H - 4} rx={8}
        fill="none" stroke={line} strokeWidth={2} />

      {/* Half-court line */}
      <line x1={2} y1={H / 2} x2={W - 2} y2={H / 2} stroke={line} strokeWidth={1.5} />
      {/* Center circles */}
      <circle cx={BX} cy={H / 2} r={62} fill="none" stroke={lineFaint} strokeWidth={1.5} />
      <circle cx={BX} cy={H / 2} r={20} fill="none" stroke={lineFaint} strokeWidth={1} />

      {/* ── HOME basket (bottom) ── */}
      <rect x={KEY_X} y={H_BY - KEY_H} width={KEY_W} height={KEY_H}
        fill={hexWithOpacity(homeColor, 0.04)} stroke={line} strokeWidth={1.5} />
      <circle cx={BX} cy={H_BY - KEY_H} r={FT_R}
        fill="none" stroke={line} strokeWidth={1.5} strokeDasharray="6 5" />
      <path
        d={`M ${CRN_X} ${H_BY} L ${CRN_X} ${H_BY - CRN_DY} A ${THREE_R} ${THREE_R} 0 0 1 ${W - CRN_X} ${H_BY - CRN_DY} L ${W - CRN_X} ${H_BY}`}
        fill="none" stroke={line} strokeWidth={2} />
      <path d={`M ${BX - 40} ${H_BY} A 40 40 0 0 1 ${BX + 40} ${H_BY}`}
        fill="none" stroke={lineFaint} strokeWidth={1} />
      <circle cx={BX} cy={H_BY} r={14} fill="none" stroke={hc} strokeWidth={2} />
      <circle cx={BX} cy={H_BY} r={3.5} fill={hc} />
      <line x1={BX - 26} y1={H_BY + 13} x2={BX + 26} y2={H_BY + 13}
        stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeLinecap="round" />

      {/* ── AWAY basket (top) ── */}
      <rect x={KEY_X} y={A_BY} width={KEY_W} height={KEY_H}
        fill={hexWithOpacity(awayColor, 0.04)} stroke={line} strokeWidth={1.5} />
      <circle cx={BX} cy={A_BY + KEY_H} r={FT_R}
        fill="none" stroke={line} strokeWidth={1.5} strokeDasharray="6 5" />
      <path
        d={`M ${CRN_X} ${A_BY} L ${CRN_X} ${A_BY + CRN_DY} A ${THREE_R} ${THREE_R} 0 0 0 ${W - CRN_X} ${A_BY + CRN_DY} L ${W - CRN_X} ${A_BY}`}
        fill="none" stroke={line} strokeWidth={2} />
      <path d={`M ${BX - 40} ${A_BY} A 40 40 0 0 0 ${BX + 40} ${A_BY}`}
        fill="none" stroke={lineFaint} strokeWidth={1} />
      <circle cx={BX} cy={A_BY} r={14} fill="none" stroke={ac} strokeWidth={2} />
      <circle cx={BX} cy={A_BY} r={3.5} fill={ac} />
      <line x1={BX - 26} y1={A_BY - 13} x2={BX + 26} y2={A_BY - 13}
        stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

// ── Team detection ────────────────────────────────────────────────────────
// Uses boxscore-derived teamMap first (most reliable), then falls back to
// the athlete.team field which ESPN often omits from play refs.
function getTeam(
  play: ProcessedPlay,
  homeAbbr: string,
  awayAbbr: string,
  homeId: string,
  awayId: string,
  teamMap: Record<string, "home" | "away">,
): "home" | "away" | null {
  const athleteId = play.athletes?.[0]?.athlete?.id;
  if (athleteId && teamMap[athleteId]) return teamMap[athleteId];
  const t = play.athletes?.[0]?.athlete?.team;
  if (!t) return null;
  const abbr = t.abbreviation?.toUpperCase();
  if (abbr === homeAbbr.toUpperCase()) return "home";
  if (abbr === awayAbbr.toUpperCase()) return "away";
  if (t.id === homeId) return "home";
  if (t.id === awayId) return "away";
  return null;
}

// ── Coordinate mapping ────────────────────────────────────────────────────
// ESPN coordinates vary by game: could be feet (-25→25 x, 0→47 y),
// tenths-of-feet (-250→250 x, 0→470 y), or 0-100 percentage.
// We auto-detect by inspecting the actual data range and normalize to SVG.
function buildCoordMapper(shots: Array<{ x: number; y: number }>) {
  if (shots.length === 0) return (x: number, y: number) => ({ nx: 0.5, ny: 0 });

  const xs = shots.map((s) => s.x);
  const ys = shots.map((s) => s.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMax = Math.max(...ys);

  // If x spans negatives → feet or tenths-of-feet centered on basket
  // Normalize x symmetrically around 0 → map to [0, W]
  const xRange = xMax - xMin || 1;
  const normX = (x: number) => Math.max(0, Math.min(1, (x - xMin) / xRange));
  // y: distance from basket outward → normalize by observed max (0→half-court)
  const normY = (y: number) => Math.max(0, Math.min(1, y / (yMax || 1)));

  return (x: number, y: number) => ({ nx: normX(x), ny: normY(y) });
}

function mapShot(
  nx: number, ny: number,
  side: "home" | "away" | null
) {
  const svgX = nx * W;
  const halfH = H / 2 - 52; // usable height per half-court in SVG
  if (side === "home") return { svgX, svgY: H_BY - ny * halfH };
  if (side === "away") return { svgX, svgY: A_BY + ny * halfH };
  // Unknown — stagger near midcourt so they don't all pile up
  return { svgX, svgY: H / 2 + (nx - 0.5) * 60 };
}

interface TooltipData { svgX: number; svgY: number; text: string; color: string }

// ── Main component ────────────────────────────────────────────────────────
export default function ShotChart({ plays, home, away, teamMap = {} }: ShotChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const homeColor = getTeamColor(home.team.abbreviation) || "#a855f7";
  const awayColor = getTeamColor(away.team.abbreviation) || "#3b82f6";

  const shotPlays = plays.filter((p) =>
    p.coordinate?.x !== undefined &&
    p.coordinate?.y !== undefined &&
    (p.shootingPlay ||
      p.scoringPlay ||
      /three|jumper|layup|dunk|hook|shot|free throw/i.test(p.text ?? ""))
  );

  if (shotPlays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/20 text-sm gap-2">
        <span className="text-3xl">🏀</span>
        <span>No shot coordinate data available for this game.</span>
      </div>
    );
  }

  // Build coordinate normalizer from actual data ranges
  const coordMapper = buildCoordMapper(shotPlays.map((p) => p.coordinate!));

  // Stats counters
  let homeMakes = 0, homeAttempts = 0, awayMakes = 0, awayAttempts = 0;

  const shots = shotPlays.map((play, i) => {
    const coord = play.coordinate!;
    const side = getTeam(play, home.team.abbreviation, away.team.abbreviation, home.team.id, away.team.id, teamMap);
    const { nx, ny } = coordMapper(coord.x, coord.y);
    const { svgX, svgY } = mapShot(nx, ny, side);
    const text = play.text ?? "";
    const made = play.shotMade ?? play.scoringPlay ?? !text.toLowerCase().includes("missed");
    const color = side === "home" ? homeColor : side === "away" ? awayColor : "rgba(255,255,255,0.3)";
    const isThree = /three|3-point/i.test(text);
    const r = isThree ? 7.5 : 5.5;

    if (side === "home") { homeAttempts++; if (made) homeMakes++; }
    if (side === "away") { awayAttempts++; if (made) awayMakes++; }

    return { play, svgX, svgY, made, color, r, i };
  });

  return (
    <div className="flex flex-col gap-3">
      {/* FG% summary */}
      <div className="flex gap-3">
        {[
          { label: home.team.shortDisplayName, color: homeColor, makes: homeMakes, att: homeAttempts },
          { label: away.team.shortDisplayName, color: awayColor, makes: awayMakes, att: awayAttempts },
        ].map(({ label, color, makes, att }) => (
          <div key={label} className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ background: hexWithOpacity(color, 0.06), borderColor: hexWithOpacity(color, 0.2) }}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs font-semibold" style={{ color }}>{label}</span>
            <span className="text-xs text-white/40 ml-auto font-mono">
              {makes}/{att} · {att > 0 ? Math.round((makes / att) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>

      {/* Court SVG */}
      <div className="relative" onMouseLeave={() => setTooltip(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full rounded-xl overflow-hidden"
          style={{ maxHeight: 680, userSelect: "none" }}>
          <FullCourt homeColor={homeColor} awayColor={awayColor} />

          {shots.map(({ play, svgX, svgY, made, color, r, i }) => (
            <motion.g
              key={`${play.id}-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.008, duration: 0.18, type: "spring", stiffness: 400, damping: 20 }}
              onMouseEnter={() => setTooltip({ svgX, svgY, text: play.text, color })}
              style={{ cursor: "pointer" }}>
              {made ? (
                <>
                  {/* Glow ring */}
                  <circle cx={svgX} cy={svgY} r={r + 5} fill={hexWithOpacity(color, 0.12)} />
                  {/* Fill */}
                  <circle cx={svgX} cy={svgY} r={r} fill={hexWithOpacity(color, 0.85)} stroke={color} strokeWidth={1.5} />
                </>
              ) : (
                /* X for miss — team colored, not white */
                <>
                  <line x1={svgX - r} y1={svgY - r} x2={svgX + r} y2={svgY + r}
                    stroke={hexWithOpacity(color, 0.55)} strokeWidth={2} strokeLinecap="round" />
                  <line x1={svgX + r} y1={svgY - r} x2={svgX - r} y2={svgY + r}
                    stroke={hexWithOpacity(color, 0.55)} strokeWidth={2} strokeLinecap="round" />
                </>
              )}
            </motion.g>
          ))}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs text-white/80 max-w-[280px] text-center pointer-events-none z-10"
              style={{ background: "#1a1a2e", border: `1px solid ${hexWithOpacity(tooltip.color, 0.4)}` }}>
              {tooltip.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-xs text-white/35">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: homeColor }} />
          <span>{home.team.shortDisplayName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: awayColor }} />
          <span>{away.team.shortDisplayName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <span>Make</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/30 font-bold">✕</span>
          <span>Miss</span>
        </div>
      </div>
    </div>
  );
}
