"use client";
import { use, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BarChart2, List, Target, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import ScoreboardHero from "@/components/ScoreboardHero";
import PlayByPlayFeed from "@/components/PlayByPlayFeed";
import SpoilerVeilControls from "@/components/SpoilerVeilControls";
import LiveBoxScore from "@/components/LiveBoxScore";
import ShotChart from "@/components/ShotChart";
import PlayerModal from "@/components/PlayerModal";
import { useLiveGames } from "@/hooks/useLiveGames";
import { useGameData } from "@/hooks/useGameData";
import { useAppStore } from "@/store/useAppStore";
import type { ESPNPlayerStats, ESPNTeam } from "@/lib/espn";
import { getHeadshotUrl, getAthleteHeadshotById } from "@/lib/espn";

type Tab = "plays" | "boxscore" | "shotchart";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "plays", label: "Play-by-Play", Icon: List },
  { id: "boxscore", label: "Box Score", Icon: BarChart2 },
  { id: "shotchart", label: "Shot Chart", Icon: Target },
];

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("plays");
  const [selectedPlayer, setSelectedPlayer] = useState<{ stats: ESPNPlayerStats; team: ESPNTeam } | null>(null);

  const delaySeconds = useAppStore((s) => s.delaySeconds);

  // Get live status from scoreboard to know current period/clock
  const { data: scoreboard } = useLiveGames();
  const liveEvent = scoreboard?.events?.find((e) => e.id === id);
  const liveStatus = liveEvent?.status;
  const livePeriod = liveStatus?.period ?? 1;
  const liveClock = liveStatus?.displayClock ?? "10:00";

  const competition = liveEvent?.competitions?.[0];
  const home = competition?.competitors?.find((c) => c.homeAway === "home");
  const away = competition?.competitors?.find((c) => c.homeAway === "away");

  // Fetch detailed summary + process through spoiler engine
  const {
    isLoading,
    isError,
    visiblePlays,
    bufferedCount,
    boxscore,
    gameInfo,
  } = useGameData(id, livePeriod, liveClock);

  const broadcasts = competition?.broadcasts?.flatMap((b) => b.names) ?? [];
  const venueName = gameInfo?.venue?.fullName ?? competition?.venue?.fullName;

  // Build a box-score-derived player resolver so play-by-play can both render
  // the correct headshot AND open the same "Today's Stats" modal that the Box
  // Score tab opens. Each entry carries enough to pop the modal:
  // { stats, team, headshot }. Two indexes:
  //   - playerById: O(1) lookup when the play has an athlete ref.
  //   - playerLookup: name-sorted-longest-first list for fuzzy text matching
  //     (so "Aliyah Boston" beats "Boston").
  const { playerById, playerLookup } = useMemo(() => {
    type Entry = { stats: ESPNPlayerStats; team: ESPNTeam; headshot: string };
    const byId: Record<string, Entry> = {};
    const lookup: Array<Entry & { name: string }> = [];
    boxscore?.players?.forEach((teamStats) => {
      teamStats.statistics?.[0]?.athletes?.forEach((ps) => {
        const id = ps.athlete.id;
        if (!id) return;
        const headshot = getHeadshotUrl(ps.athlete.headshot) ?? getAthleteHeadshotById(id);
        const entry: Entry = { stats: ps, team: teamStats.team, headshot };
        byId[id] = entry;
        if (ps.athlete.displayName) {
          lookup.push({ name: ps.athlete.displayName, ...entry });
        }
      });
    });
    lookup.sort((a, b) => b.name.length - a.name.length);
    return { playerById: byId, playerLookup: lookup };
  }, [boxscore]);

  // Build athlete ID → "home"|"away" map from boxscore (play refs often lack team data)
  const teamMap = useMemo(() => {
    const map: Record<string, "home" | "away"> = {};
    boxscore?.players?.forEach((teamStats) => {
      const side: "home" | "away" = teamStats.team.id === home?.team.id ? "home" : "away";
      teamStats.statistics?.[0]?.athletes?.forEach((ps) => {
        if (ps.athlete.id) map[ps.athlete.id] = side;
      });
    });
    return map;
  }, [boxscore, home]);

  // Count charged timeouts per team from play-by-play
  // Excludes TV/Official/mandatory timeouts which don't count against teams
  function countTimeouts(teamId: string | undefined, teamName: string | undefined) {
    if (!teamId && !teamName) return 0;
    return visiblePlays.filter((p) => {
      const t = (p.text ?? "").toLowerCase();
      if (!t.includes("timeout")) return false;
      if (t.includes("tv timeout") || t.includes("official timeout") || t.includes("end of")) return false;
      const athleteTeamId = p.athletes?.[0]?.athlete?.team?.id;
      if (athleteTeamId) return athleteTeamId === teamId;
      return teamName ? (p.text ?? "").includes(teamName) : false;
    }).length;
  }
  const homeTimeoutsUsed = countTimeouts(home?.team?.id, home?.team?.shortDisplayName);
  const awayTimeoutsUsed = countTimeouts(away?.team?.id, away?.team?.shortDisplayName);

  if (!liveEvent && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center flex-col gap-4 text-white/30">
          <span className="text-5xl">🏀</span>
          <p className="text-lg font-semibold">Game not found</p>
          <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 underline">
            ← Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        {/* Back link */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors w-fit">
          <ArrowLeft size={12} />
          All Games
        </Link>

        {/* Scoreboard Hero */}
        {home && away && liveStatus ? (
          <ScoreboardHero
            home={home}
            away={away}
            status={liveStatus}
            venueName={venueName}
            broadcasts={broadcasts}
            homeTimeoutsUsed={homeTimeoutsUsed}
            awayTimeoutsUsed={awayTimeoutsUsed}
          />
        ) : (
          <div className="h-48 rounded-2xl skeleton" />
        )}

        {/* Spoiler Veil Controls */}
        <SpoilerVeilControls
          livePeriod={livePeriod}
          liveClock={liveClock}
          bufferedCount={bufferedCount}
        />

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {TABS.map(({ id: tabId, label, Icon }) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ color: isActive ? "white" : "rgba(255,255,255,0.35)" }}>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-white/25 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading game data…</span>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="text-center py-12 text-red-400/70 text-sm">
            Failed to load game details. ESPN API may be unavailable.
          </div>
        )}

        {/* Tab content */}
        {!isLoading && home && away && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}>

              {activeTab === "plays" && (
                <PlayByPlayFeed
                  visiblePlays={visiblePlays}
                  bufferedCount={bufferedCount}
                  home={home}
                  away={away}
                  delaySeconds={delaySeconds}
                  playerById={playerById}
                  playerLookup={playerLookup}
                  onPlayerClick={(stats, team) => setSelectedPlayer({ stats, team })}
                />
              )}

              {activeTab === "boxscore" && boxscore && (
                <LiveBoxScore
                  boxscore={boxscore}
                  onPlayerClick={(stats, team) => setSelectedPlayer({ stats, team })}
                />
              )}

              {activeTab === "boxscore" && !boxscore && (
                <div className="text-center py-12 text-white/20 text-sm">
                  Box score not available yet.
                </div>
              )}

              {activeTab === "shotchart" && (
                <ShotChart
                  plays={visiblePlays}
                  home={home}
                  away={away}
                  teamMap={teamMap}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal
          stats={selectedPlayer.stats}
          team={selectedPlayer.team}
          labels={
            boxscore?.players
              ?.find((p) => p.team.id === selectedPlayer.team.id)
              ?.statistics?.[0]?.labels ?? []
          }
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
