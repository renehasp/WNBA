"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ESPNBoxscore, ESPNPlayerStats, ESPNTeam } from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { getAthleteHeadshotById } from "@/lib/espn";
import { cn, hexWithOpacity } from "@/lib/utils";

interface LiveBoxScoreProps {
  boxscore: ESPNBoxscore;
  onPlayerClick?: (stats: ESPNPlayerStats, team: ESPNTeam) => void;
  liveAwayScore?: string;
  liveHomeScore?: string;
  liveClock?: string;
  livePeriod?: number;
}

const KEY_STATS = ["PTS", "REB", "AST", "STL", "BLK", "TO", "PF", "FG", "3PT", "FT", "MIN"];

const STAT_LABELS: Record<string, string> = {
  "MIN": "Minutes",
  "PTS": "Points",
  "REB": "Rebounds",
  "AST": "Assists",
  "STL": "Steals",
  "BLK": "Blocks",
  "TO": "Turnovers",
  "FG": "Field Goals",
  "3PT": "3-Pointers",
  "FT": "Free Throws",
  "PF": "Fouls",
  "IMP": "Impact",
};

function calcImpact(stats: string[], labels: string[]): number {
  const get = (key: string) => parseFloat(stats[labels.indexOf(key)] ?? "0") || 0;
  return get("PTS") + get("REB") + get("AST") + get("STL") + get("BLK") - get("TO");
}

export default function LiveBoxScore({ boxscore, onPlayerClick, liveAwayScore, liveHomeScore, liveClock, livePeriod }: LiveBoxScoreProps) {
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [sortKey, setSortKey] = useState<string>("IMP");
  const [sortAsc, setSortAsc] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

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

  // Calculate team totals
  const totals = displayedStats.reduce((acc, stat) => {
    const idx = labels.indexOf(stat);
    if (idx < 0) {
      acc[stat] = 0;
      return acc;
    }
    const sum = athletes.reduce((sum, athlete) => {
      if (athlete.didNotPlay) return sum;
      const val = parseFloat(athlete.stats[idx] ?? "0") || 0;
      return sum + val;
    }, 0);
    acc[stat] = sum;
    return acc;
  }, {} as Record<string, number>);

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
                  {/* Player cell — name + picture navigate to the full player page;
                      the rest of the row still opens the Today's Stats modal. */}
                  <td className="px-3 py-2 sticky left-0" style={{ background: "#0a0a0f" }}>
                    <Link
                      href={`/teams/${activeTeamStats.team.id}/players/${p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="group inline-flex items-center gap-2 hover:opacity-90"
                      title={`${p.displayName} — full profile`}>
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 transition-transform group-hover:scale-105"
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
                          <span className="font-semibold text-white/80 leading-none group-hover:underline decoration-white/30 underline-offset-2">
                            {p.shortName ?? p.displayName}
                          </span>
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
                    </Link>
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
            {/* Team Totals Row */}
            <tr
              onClick={() => setShowComparison(true)}
              style={{
                background: "linear-gradient(90deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))",
                borderTop: "2px solid rgba(168,85,247,0.3)",
                borderBottom: "2px solid rgba(168,85,247,0.3)",
                cursor: "pointer",
                boxShadow: "0 0 12px rgba(168,85,247,0.1)"
              }}
              className="hover:bg-opacity-20 transition-all hover:shadow-lg">
              <td className="px-3 py-2.5 sticky left-0 font-bold text-white uppercase tracking-wide text-xs"
                style={{ background: "#0f0f1a", color: "#a855f7" }}>
                ▶ Team Total
              </td>

              {/* Total Impact - sum of all impacts */}
              <td className="px-3 py-2.5 text-center tabular-nums font-bold text-white"
                style={{ fontSize: "0.875rem" }}>
                {Math.round(sorted.reduce((sum, athlete) => {
                  if (athlete.didNotPlay) return sum;
                  return sum + calcImpact(athlete.stats, labels);
                }, 0))}
              </td>

              {/* Total for each stat column */}
              {displayedStats.map((label) => (
                <td key={label} className="px-3 py-2.5 text-center tabular-nums font-bold text-white"
                  style={{ fontSize: "0.875rem" }}>
                  {totals[label].toFixed(label.includes("FG") || label.includes("3PT") || label.includes("FT") ? 1 : 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Team Comparison Modal */}
      {showComparison && teams.length === 2 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
            onClick={() => setShowComparison(false)}>
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-2xl rounded-2xl border overflow-hidden"
              style={{ background: "#0f0f1a", borderColor: "rgba(255,255,255,0.1)" }}
              onClick={(e) => e.stopPropagation()}>
              {/* Header with Mini Scoreboard */}
              <div className="relative p-6 border-b border-white/[0.06]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Team Stats</h2>
                  <button
                    onClick={() => setShowComparison(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                    <X size={15} />
                  </button>
                </div>

                {/* Mini Scoreboard */}
                <div className="flex items-center justify-between gap-4">
                  {/* Away Team */}
                  {teams[0] && (
                    <div className="flex-1 flex items-center justify-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-white/50 uppercase tracking-wide">{teams[0].team.shortDisplayName || teams[0].team.displayName}</p>
                        <p className="text-3xl font-extrabold text-white">{liveAwayScore ?? "0"}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: hexWithOpacity(getTeamColor(teams[0].team.abbreviation) || "#a855f7", 0.15),
                          border: `2px solid ${hexWithOpacity(getTeamColor(teams[0].team.abbreviation) || "#a855f7", 0.4)}`
                        }}>
                        {teams[0].team.logo ? (
                          <Image
                            src={teams[0].team.logo}
                            alt={teams[0].team.abbreviation}
                            width={32}
                            height={32}
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs font-bold" style={{ color: getTeamColor(teams[0].team.abbreviation) || "#a855f7" }}>{teams[0].team.abbreviation}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Center Clock */}
                  <div className="flex flex-col items-center gap-1 shrink-0 px-4">
                    <p className="text-xs font-mono font-bold text-white/80">{liveClock ?? "10:00"}</p>
                    <p className="text-[10px] text-white/40 uppercase">Q{livePeriod ?? 1}</p>
                  </div>

                  {/* Home Team */}
                  {teams[1] && (
                    <div className="flex-1 flex items-center justify-start gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: hexWithOpacity(getTeamColor(teams[1].team.abbreviation) || "#a855f7", 0.15),
                          border: `2px solid ${hexWithOpacity(getTeamColor(teams[1].team.abbreviation) || "#a855f7", 0.4)}`
                        }}>
                        {teams[1].team.logo ? (
                          <Image
                            src={teams[1].team.logo}
                            alt={teams[1].team.abbreviation}
                            width={32}
                            height={32}
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs font-bold" style={{ color: getTeamColor(teams[1].team.abbreviation) || "#a855f7" }}>{teams[1].team.abbreviation}</span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-white/50 uppercase tracking-wide">{teams[1].team.shortDisplayName || teams[1].team.displayName}</p>
                        <p className="text-3xl font-extrabold text-white">{liveHomeScore ?? "0"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Table */}
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wide">
                        Stat
                      </th>
                      {teams.map((team, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-center font-semibold"
                          style={{ color: getTeamColor(team.team.abbreviation) || "#a855f7" }}>
                          {team.team.shortDisplayName ?? team.team.abbreviation}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStats.map((stat) => {
                      const idx = labels.indexOf(stat);
                      if (idx < 0) return null;

                      const team0Total = teams[0]?.statistics?.[0]?.athletes?.reduce((sum, athlete) => {
                        if (athlete.didNotPlay) return sum;
                        return sum + (parseFloat(athlete.stats[idx] ?? "0") || 0);
                      }, 0) ?? 0;

                      const team1Total = teams[1]?.statistics?.[0]?.athletes?.reduce((sum, athlete) => {
                        if (athlete.didNotPlay) return sum;
                        return sum + (parseFloat(athlete.stats[idx] ?? "0") || 0);
                      }, 0) ?? 0;

                      // Turnovers and Fouls are "bad" — lower is better
                      const isBadStat = stat === "TO" || stat === "PF";
                      const isTeam0Better = isBadStat ? team0Total < team1Total : team0Total > team1Total;
                      const isTie = team0Total === team1Total;

                      return (
                        <tr key={stat} className="border-t border-white/[0.04]">
                          <td className="px-4 py-3 text-white/60 font-medium uppercase tracking-wide text-xs">
                            {STAT_LABELS[stat] || stat}
                          </td>
                          <td
                            className="px-4 py-3 text-center font-bold tabular-nums"
                            style={{
                              color: isTie ? "rgba(255,255,255,0.7)" : isTeam0Better ? "#22c55e" : "#ef4444",
                              background: isTie ? "transparent" : isTeam0Better ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                            }}>
                            {team0Total.toFixed(stat.includes("FG") || stat.includes("3PT") || stat.includes("FT") ? 1 : 0)}
                          </td>
                          <td
                            className="px-4 py-3 text-center font-bold tabular-nums"
                            style={{
                              color: isTie ? "rgba(255,255,255,0.7)" : !isTeam0Better ? "#22c55e" : "#ef4444",
                              background: isTie ? "transparent" : !isTeam0Better ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                            }}>
                            {team1Total.toFixed(stat.includes("FG") || stat.includes("3PT") || stat.includes("FT") ? 1 : 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
