"use client";
import { useState } from "react";
import Image from "next/image";
import type { ESPNBoxscore, ESPNPlayerStats, ESPNTeam } from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { getAthleteHeadshotById } from "@/lib/espn";
import { cn } from "@/lib/utils";

interface LiveBoxScoreProps {
  boxscore: ESPNBoxscore;
  onPlayerClick?: (stats: ESPNPlayerStats, team: ESPNTeam) => void;
}

const KEY_STATS = ["PTS", "REB", "AST", "STL", "BLK", "TO", "FG", "3PT", "FT", "MIN"];

function calcImpact(stats: string[], labels: string[]): number {
  const get = (key: string) => parseFloat(stats[labels.indexOf(key)] ?? "0") || 0;
  return get("PTS") + get("REB") + get("AST") + get("STL") + get("BLK") - get("TO");
}

export default function LiveBoxScore({ boxscore, onPlayerClick }: LiveBoxScoreProps) {
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [sortKey, setSortKey] = useState<string>("IMP");
  const [sortAsc, setSortAsc] = useState(false);

  const teams = boxscore.players ?? [];
  if (!teams.length) {
    return <div className="text-center py-12 text-white/20 text-sm">Box score not available.</div>;
  }

  const activeTeamStats = teams[activeTeamIdx];
  const teamData = activeTeamStats?.statistics?.[0];
  if (!teamData) {
    return <div className="text-center py-12 text-white/20 text-sm">No player data yet.</div>;
  }

  const labels: string[] = teamData.labels ?? teamData.names ?? [];
  const athletes = teamData.athletes ?? [];
  const displayedStats = KEY_STATS.filter((k) => labels.includes(k));

  // Sort athletes — "IMP" uses composite, others use raw stat value
  const sorted = [...athletes].sort((a, b) => {
    if (a.didNotPlay) return 1;
    if (b.didNotPlay) return -1;
    if (sortKey === "IMP") {
      const aImp = calcImpact(a.stats, labels);
      const bImp = calcImpact(b.stats, labels);
      return sortAsc ? aImp - bImp : bImp - aImp;
    }
    const idx = labels.indexOf(sortKey);
    if (idx < 0) return 0;
    const aVal = parseFloat(a.stats[idx] ?? "0") || 0;
    const bVal = parseFloat(b.stats[idx] ?? "0") || 0;
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <div>
      {/* Team tabs */}
      <div className="flex gap-2 mb-4">
        {teams.map((t, i) => {
          const abbr = t.team.abbreviation;
          const color = getTeamColor(abbr) || `#${t.team.color || "a855f7"}`;
          return (
            <button
              key={i}
              onClick={() => setActiveTeamIdx(i)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={
                activeTeamIdx === i
                  ? { background: `${color}18`, borderColor: `${color}50`, color }
                  : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
              }>
              {t.team.shortDisplayName ?? abbr}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th className="text-left px-3 py-2.5 text-white/30 font-semibold uppercase tracking-wide sticky left-0"
                style={{ background: "#0f0f1a", minWidth: 140 }}>
                Player
              </th>
              {/* Impact score column first */}
              <th
                onClick={() => handleSort("IMP")}
                className="px-3 py-2.5 text-center cursor-pointer select-none transition-colors"
                title="Impact: PTS + REB + AST + STL + BLK − TO"
                style={{ color: sortKey === "IMP" ? "#a855f7" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                IMP{sortKey === "IMP" && <span className="ml-0.5">{sortAsc ? "↑" : "↓"}</span>}
              </th>
              {displayedStats.map((label) => (
                <th
                  key={label}
                  onClick={() => handleSort(label)}
                  className="px-3 py-2.5 text-center cursor-pointer select-none transition-colors"
                  style={{ color: sortKey === label ? "#a855f7" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                  {label}
                  {sortKey === label && <span className="ml-0.5">{sortAsc ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((athlete, i) => {
              const p = athlete.athlete;
              const abbr = activeTeamStats.team.abbreviation;
              const color = getTeamColor(abbr) || "#a855f7";
              const dnp = athlete.didNotPlay;
              const isStarter = athlete.starter;
              const ptsIdx = labels.indexOf("PTS");
              const pts = ptsIdx >= 0 ? parseInt(athlete.stats[ptsIdx] ?? "0") || 0 : 0;
              const isHot = pts >= 20;
              const impact = dnp ? null : calcImpact(athlete.stats, labels);

              return (
                <tr
                  key={p.id ?? i}
                  onClick={() => !dnp && onPlayerClick?.(athlete, activeTeamStats.team)}
                  className={cn(
                    "border-t border-white/[0.04] transition-colors",
                    !dnp && "cursor-pointer hover:bg-white/[0.03]",
                    dnp && "opacity-40"
                  )}>
                  {/* Player cell */}
                  <td className="px-3 py-2 sticky left-0" style={{ background: "#0a0a0f" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Image
                          src={getAthleteHeadshotById(p.id)}
                          alt={p.displayName}
                          width={28}
                          height={28}
                          className="object-cover w-full h-full"
                          unoptimized
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-white/80 leading-none">{p.shortName ?? p.displayName}</span>
                          {isHot && <span title="Hot hand 🔥">🔥</span>}
                          {isStarter && (
                            <span className="text-[9px] px-1 rounded font-bold"
                              style={{ background: `${color}20`, color }}>S</span>
                          )}
                        </div>
                        {p.position && (
                          <span className="text-[10px] text-white/25">{p.position.abbreviation}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Impact column */}
                  <td className="px-3 py-2 text-center tabular-nums font-bold"
                    style={{
                      color: sortKey === "IMP" && i === 0 && !dnp
                        ? color
                        : dnp ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.55)",
                      fontWeight: sortKey === "IMP" && i === 0 && !dnp ? 800 : 600,
                    }}>
                    {dnp ? "—" : impact}
                  </td>

                  {/* Stat cells */}
                  {displayedStats.map((label) => {
                    const idx = labels.indexOf(label);
                    const val = idx >= 0 ? athlete.stats[idx] ?? "—" : "—";
                    const isLeader = label === sortKey && i === 0 && !dnp;
                    return (
                      <td key={label} className="px-3 py-2 text-center tabular-nums"
                        style={{ color: isLeader ? color : dnp ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.65)", fontWeight: isLeader ? 700 : 400 }}>
                        {dnp ? "DNP" : val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
