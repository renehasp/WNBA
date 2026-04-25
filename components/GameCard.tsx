"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { ESPNEvent } from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { hexWithOpacity, ordinalPeriod, formatTime } from "@/lib/utils";

interface GameCardProps {
  event: ESPNEvent;
}

export default function GameCard({ event }: GameCardProps) {
  const router = useRouter();
  const competition = event.competitions[0];
  if (!competition) return null;

  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const status = event.status;
  const isLive = status.type.state === "in";
  const isFinal = status.type.state === "post";
  const isPre = status.type.state === "pre";

  const homeColor = `#${home.team.color || "a855f7"}`;
  const awayColor = `#${away.team.color || "3b82f6"}`;
  const homeAbbr = home.team.abbreviation;
  const awayAbbr = away.team.abbreviation;

  const homeScore = parseInt(home.score) || 0;
  const awayScore = parseInt(away.score) || 0;
  const homeLeading = homeScore > awayScore;
  const awayLeading = awayScore > homeScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/game/${event.id}`)}
      className="cursor-pointer rounded-2xl border overflow-hidden select-none"
      style={{
        background: "linear-gradient(145deg, #0f0f1a, #161627)",
        borderColor: isLive ? hexWithOpacity(homeColor, 0.3) : "rgba(255,255,255,0.07)",
        boxShadow: isLive
          ? `0 0 24px ${hexWithOpacity(homeColor, 0.12)}`
          : "0 2px 12px rgba(0,0,0,0.3)",
      }}>
      {/* Live indicator bar */}
      {isLive && (
        <div className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, ${awayColor}, ${homeColor})` }} />
      )}

      <div className="p-4">
        {/* Teams + Scores */}
        <div className="flex items-center justify-between gap-3">
          {/* Away team */}
          <TeamSide
            team={away.team}
            score={away.score}
            isLeading={awayLeading}
            color={awayColor}
            abbr={awayAbbr}
            showScore={!isPre}
          />

          {/* Center: status */}
          <div className="flex flex-col items-center gap-1 min-w-[56px]">
            {isLive && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] pulse-live" />
                <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wide">Live</span>
              </div>
            )}
            {isFinal && (
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">Final</span>
            )}
            {isPre && (
              <span className="text-[10px] font-medium text-white/40">
                {formatTime(event.date)}
              </span>
            )}
            {isLive && (
              <span className="text-[11px] text-white/60 font-medium">
                {ordinalPeriod(status.period)} · {status.displayClock}
              </span>
            )}
            {!isPre && !isLive && !isFinal && (
              <span className="text-[11px] text-white/40">{status.type.shortDetail}</span>
            )}
          </div>

          {/* Home team */}
          <TeamSide
            team={home.team}
            score={home.score}
            isLeading={homeLeading}
            color={homeColor}
            abbr={homeAbbr}
            showScore={!isPre}
            reverse
          />
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-white/30">
            {competition.venue?.fullName ?? ""}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-medium"
            style={{ color: isLive ? "#a855f7" : "rgba(255,255,255,0.35)" }}>
            <span>{isLive ? "Watch Live" : "View"}</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TeamSide({
  team,
  score,
  isLeading,
  color,
  abbr,
  showScore,
  reverse = false,
}: {
  team: { logo?: string; shortDisplayName?: string; displayName: string };
  score: string;
  isLeading: boolean;
  color: string;
  abbr: string;
  showScore: boolean;
  reverse?: boolean;
}) {
  const teamColor = getTeamColor(abbr) || color;
  return (
    <div className={`flex items-center gap-2.5 ${reverse ? "flex-row-reverse" : ""}`}>
      {/* Logo */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: hexWithOpacity(teamColor, 0.12), border: `1px solid ${hexWithOpacity(teamColor, 0.25)}` }}>
        {team.logo ? (
          <Image
            src={team.logo}
            alt={team.displayName}
            width={28}
            height={28}
            className="object-contain"
            unoptimized
          />
        ) : (
          <span className="text-xs font-bold" style={{ color: teamColor }}>
            {abbr.slice(0, 2)}
          </span>
        )}
      </div>
      {/* Name + score */}
      <div className={`flex flex-col ${reverse ? "items-end" : "items-start"}`}>
        <span className="text-xs font-semibold text-white/70">
          {team.shortDisplayName ?? abbr}
        </span>
        {showScore && (
          <span
            className="text-2xl font-bold leading-none tabular-nums"
            style={{ color: isLeading ? "#ffffff" : "rgba(255,255,255,0.45)" }}>
            {score || "0"}
          </span>
        )}
      </div>
    </div>
  );
}
