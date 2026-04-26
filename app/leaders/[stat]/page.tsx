"use client";
import { use, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  fetchLeagueLeaders,
  fetchAllPlayers,
  getAthleteHeadshotById,
  type ESPNPlayerSearchEntry,
} from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { hexWithOpacity } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const FAV_YELLOW = "#fde68a";

// Map URL slug → ESPN category name + human label.
const STAT_MAP: Record<
  string,
  { categoryName: string; label: string; abbr: string; description: string }
> = {
  pts: { categoryName: "pointsPerGame", label: "Points per Game", abbr: "PTS", description: "Points scored per game" },
  reb: { categoryName: "reboundsPerGame", label: "Rebounds per Game", abbr: "REB", description: "Total rebounds per game" },
  ast: { categoryName: "assistsPerGame", label: "Assists per Game", abbr: "AST", description: "Assists per game" },
  stl: { categoryName: "stealsPerGame", label: "Steals per Game", abbr: "STL", description: "Steals per game" },
  blk: { categoryName: "blocksPerGame", label: "Blocks per Game", abbr: "BLK", description: "Blocks per game" },
  min: { categoryName: "minutesPerGame", label: "Minutes per Game", abbr: "MIN", description: "Average minutes played per game" },
  pf:  { categoryName: "foulsPerGame", label: "Fouls per Game", abbr: "PF", description: "Personal fouls per game" },
  fg:  { categoryName: "fieldGoalPercentage", label: "Field Goal %", abbr: "FG%", description: "Field goal shooting percentage" },
  "3p":{ categoryName: "3PointPct", label: "3-Point %", abbr: "3P%", description: "3-point shooting percentage" },
  ft:  { categoryName: "FreeThrowPct", label: "Free Throw %", abbr: "FT%", description: "Free throw shooting percentage" },
  per: { categoryName: "PER", label: "Player Efficiency Rating", abbr: "PER", description: "Composite efficiency metric" },
  "3pm": { categoryName: "3PointsMadePerGame", label: "3-Pointers Made per Game", abbr: "3PM", description: "Made 3-pointers per game" },
  dbldbl: { categoryName: "doubleDouble", label: "Double-Doubles", abbr: "DBLDBL", description: "Total double-doubles this season" },
};

// Stats not exposed by the league leaders endpoint — handled with an empty-state.
const NOT_AVAILABLE: Record<string, { label: string; abbr: string }> = {
  gp: { label: "Games Played", abbr: "GP" },
  to: { label: "Turnovers per Game", abbr: "TO" },
};

export default function LeadersPage({ params }: { params: Promise<{ stat: string }> }) {
  const { stat: statRaw } = use(params);
  const stat = statRaw.toLowerCase();
  const config = STAT_MAP[stat];
  const unavailable = !config ? NOT_AVAILABLE[stat] : undefined;

  const favoriteTeamId = useAppStore((s) => s.favoriteTeamId);

  const leadersQuery = useQuery({
    queryKey: ["league-leaders"],
    queryFn: fetchLeagueLeaders,
    staleTime: 30 * 60 * 1000,
    enabled: !!config,
  });

  const playersQuery = useQuery({
    queryKey: ["all-players"],
    queryFn: fetchAllPlayers,
    staleTime: 30 * 60 * 1000,
    enabled: !!config,
  });

  // athleteId → roster entry (name, team, headshot)
  const playerMap = useMemo(() => {
    const map = new Map<string, ESPNPlayerSearchEntry>();
    (playersQuery.data?.players ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [playersQuery.data]);

  const category = useMemo(() => {
    if (!config) return null;
    return (
      leadersQuery.data?.categories.find((c) => c.name === config.categoryName) ?? null
    );
  }, [config, leadersQuery.data]);

  const isLoading = leadersQuery.isLoading || playersQuery.isLoading;

  if (unavailable) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors w-fit">
            <ArrowLeft size={12} />
            Home
          </Link>
          <div className="text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <p className="text-lg font-bold text-white/60">{unavailable.label} ({unavailable.abbr})</p>
            <p className="mt-2 text-sm text-white/35 max-w-md mx-auto">
              ESPN doesn&apos;t expose this stat as a league-wide ranking. View any player&apos;s
              page to see their individual {unavailable.label.toLowerCase()}.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60">
            <ArrowLeft size={12} /> Home
          </Link>
          <div className="text-center py-16 text-white/40">Unknown stat: {statRaw}</div>
        </main>
      </div>
    );
  }

  const accent = "#a855f7";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        <Link
          href="/teams"
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors w-fit">
          <ArrowLeft size={12} />
          Back
        </Link>

        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            background: `linear-gradient(135deg, ${hexWithOpacity(accent, 0.18)} 0%, ${hexWithOpacity("#3b82f6", 0.08)} 100%), #0f0f1a`,
            borderColor: hexWithOpacity(accent, 0.25),
          }}>
          <div className="flex items-center gap-3">
            <Trophy size={24} className="text-yellow-400" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
                League Leaders
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {config.label}
              </h1>
              <p className="text-xs text-white/45 mt-0.5">
                {config.description}
                {leadersQuery.data?.season ? (
                  <>
                    {" · "}
                    <span className="font-semibold text-white/70">
                      {leadersQuery.data.season} season
                    </span>
                    {leadersQuery.data.season < new Date().getFullYear() && (
                      <span className="text-white/35">
                        {" "}(most recent — {new Date().getFullYear()} hasn&apos;t started)
                      </span>
                    )}
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-2 text-white/30">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading leaderboard…</span>
          </div>
        )}

        {!isLoading && category && (
          <motion.div
            className="flex flex-col gap-1.5"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.015 } } }}>
            {category.leaders.map((entry) => {
              const player = playerMap.get(entry.athleteId);
              const teamAbbr = player?.teamAbbr ?? "";
              const color = getTeamColor(teamAbbr) || "#a855f7";
              const headshot =
                player?.headshot ?? getAthleteHeadshotById(entry.athleteId);
              const teamLogo = player?.teamLogo ?? null;
              const podium =
                entry.rank === 1
                  ? "🏆"
                  : entry.rank === 2
                    ? "🥈"
                    : entry.rank === 3
                      ? "🥉"
                      : null;
              const playerTeamId = player?.teamId ?? entry.teamId;
              const isFavorite =
                !!favoriteTeamId && playerTeamId === favoriteTeamId;
              return (
                <motion.div
                  key={`${entry.athleteId}-${entry.rank}`}
                  variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
                  <Link
                    href={
                      player
                        ? `/teams/${player.teamId}/players/${entry.athleteId}`
                        : entry.teamId
                          ? `/teams/${entry.teamId}/players/${entry.athleteId}`
                          : "#"
                    }
                    className="group flex items-center gap-3 px-3 py-2 rounded-xl border transition-all hover:border-white/20"
                    style={{
                      background: isFavorite
                        ? hexWithOpacity(FAV_YELLOW, 0.08)
                        : "rgba(255,255,255,0.02)",
                      borderColor: isFavorite
                        ? hexWithOpacity(FAV_YELLOW, 0.45)
                        : entry.rank <= 3
                          ? hexWithOpacity(color, 0.3)
                          : "rgba(255,255,255,0.06)",
                    }}>
                    {/* Rank */}
                    <div className="w-8 text-center shrink-0">
                      {podium ? (
                        <span className="text-lg" title={`#${entry.rank}`}>{podium}</span>
                      ) : (
                        <span className="text-xs font-bold text-white/40 tabular-nums">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Headshot circle */}
                    <div
                      className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                      style={{
                        background: hexWithOpacity(color, 0.1),
                        border: `1px solid ${hexWithOpacity(color, 0.3)}`,
                      }}>
                      {teamLogo && (
                        <div
                          aria-hidden
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage: `url(${teamLogo})`,
                            backgroundSize: "70%",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            opacity: 0.18,
                          }}
                        />
                      )}
                      <Image
                        src={headshot}
                        alt={player?.displayName ?? "Player"}
                        width={40}
                        height={40}
                        className="relative object-cover w-full h-full"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>

                    {/* Name + team */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                        {isFavorite && (
                          <Heart size={11} fill={FAV_YELLOW} className="text-yellow-200 shrink-0" />
                        )}
                        <span className="truncate">
                          {player?.displayName ?? `Player ${entry.athleteId}`}
                        </span>
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {player?.position ? `${player.position} · ` : ""}
                        {player?.teamShortName ?? ""}
                      </p>
                    </div>

                    {/* Value */}
                    <div className="text-right shrink-0">
                      <span
                        className="text-base font-extrabold tabular-nums"
                        style={{ color: entry.rank <= 3 ? color : "rgba(255,255,255,0.85)" }}>
                        {entry.displayValue}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!isLoading && category && category.leaders.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            No leaderboard data available for this season yet.
          </div>
        )}
      </main>
    </div>
  );
}
