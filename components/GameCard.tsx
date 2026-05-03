"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MapPin, Tv, ChevronRight } from "lucide-react";
import type { ESPNEvent } from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { hexWithOpacity, ordinalPeriod, formatTime } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { getTeamLogoUrl } from "@/lib/espn";

const FAV_YELLOW = "#fde68a";

interface GameCardProps {
  event: ESPNEvent;
}

export default function GameCard({ event }: GameCardProps) {
  const router = useRouter();
  const favoriteTeamId = useAppStore((s) => s.favoriteTeamId);
  const competition = event.competitions[0];
  if (!competition) return null;

  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const status = event.status;
  const isLive = status.type.state === "in";
  const isFinal = status.type.state === "post";
  const isPre = status.type.state === "pre";

  const homeColor = getTeamColor(home.team.abbreviation) || `#${home.team.color || "a855f7"}`;
  const awayColor = getTeamColor(away.team.abbreviation) || `#${away.team.color || "3b82f6"}`;
  const homeLogo = getTeamLogoUrl(home.team);
  const awayLogo = getTeamLogoUrl(away.team);

  const homeScore = parseInt(home.score) || 0;
  const awayScore = parseInt(away.score) || 0;
  const homeLeading = homeScore > awayScore;
  const awayLeading = awayScore > homeScore;

  const isFavoriteGame =
    !!favoriteTeamId &&
    (home.team.id === favoriteTeamId || away.team.id === favoriteTeamId);

  const venue = competition.venue?.fullName ?? null;
  const city = competition.venue?.address?.city;
  const state = competition.venue?.address?.state;
  const venueLoc = [city, state].filter(Boolean).join(", ");
  const broadcasts = competition.broadcasts?.flatMap((b) => b.names) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/game/${event.id}`)}
      className="cursor-pointer rounded-2xl border overflow-hidden select-none relative"
      style={{
        background: isFavoriteGame
          ? `linear-gradient(135deg, ${hexWithOpacity(awayColor, 0.08)} 0%, ${hexWithOpacity(FAV_YELLOW, 0.12)} 50%, ${hexWithOpacity(homeColor, 0.08)} 100%)`
          : `linear-gradient(135deg, ${hexWithOpacity(awayColor, 0.08)} 0%, #0f0f1a 50%, ${hexWithOpacity(homeColor, 0.08)} 100%)`,
        borderColor: isFavoriteGame ? hexWithOpacity(FAV_YELLOW, 0.5) : "rgba(255,255,255,0.07)",
        boxShadow: isFavoriteGame ? `0 0 16px ${hexWithOpacity(FAV_YELLOW, 0.12)}` : undefined,
      }}>
      {isFavoriteGame && (
        <div
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
          title="Your favorite team is playing"
          style={{
            background: hexWithOpacity(FAV_YELLOW, 0.15),
            border: `1px solid ${hexWithOpacity(FAV_YELLOW, 0.5)}`,
            color: FAV_YELLOW,
          }}>
          <Heart size={9} fill={FAV_YELLOW} />
          Favorite
        </div>
      )}

      {/* Live indicator bar */}
      {isLive && (
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, ${awayColor}, ${homeColor})` }}
        />
      )}

      {/* Faint background watermarks — away on the left, home on the right */}
      {awayLogo && (
        <div
          className="absolute pointer-events-none"
          aria-hidden
          style={{
            left: 0,
            top: 0,
            width: "50%",
            height: "100%",
            backgroundImage: `url(${awayLogo})`,
            backgroundSize: "70%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.05,
          }}
        />
      )}
      {homeLogo && (
        <div
          className="absolute pointer-events-none"
          aria-hidden
          style={{
            left: "50%",
            top: 0,
            width: "50%",
            height: "100%",
            backgroundImage: `url(${homeLogo})`,
            backgroundSize: "70%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.05,
          }}
        />
      )}

      <div className="relative p-3">
        {/* Top row: away vs home */}
        <div className="flex items-center justify-between gap-2">
          {/* Away team */}
          <TeamSide team={away.team} color={awayColor} logoUrl={awayLogo} />

          {/* Center: status */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            {isLive && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] pulse-live" />
                <span className="text-[8px] font-bold text-[#22c55e] uppercase tracking-wide">Live</span>
              </div>
            )}
            {isFinal && (
              <span className="text-[8px] font-semibold text-white/40 uppercase tracking-wide">Final</span>
            )}
            {isPre && (
              <span className="text-[8px] font-medium text-white/40">
                {formatTime(event.date)}
              </span>
            )}
            {isLive && (
              <span className="text-[9px] text-white/60 font-medium">
                {ordinalPeriod(status.period)} · {status.displayClock}
              </span>
            )}
            {!isPre && !isLive && !isFinal && (
              <span className="text-[9px] text-white/40">{status.type.shortDetail}</span>
            )}
          </div>

          {/* Home team */}
          <TeamSide team={home.team} color={homeColor} logoUrl={homeLogo} reverse />
        </div>

        {/* Scores - shown below for final and live games */}
        {!isPre && (
          <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: awayLeading ? "#ffffff" : "rgba(255,255,255,0.45)" }}>
              {away.score || "0"}
            </span>
            <span className="text-2xl font-bold tabular-nums"
              style={{ color: homeLeading ? "#ffffff" : "rgba(255,255,255,0.45)" }}>
              {home.score || "0"}
            </span>
          </div>
        )}

        {/* Footer info: venue, city, broadcast */}
        <div className="mt-2 pt-2 border-t border-white/[0.05] flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/45">
          {venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={10} className="text-white/35" />
              <span className="text-white/65 font-semibold">{venue}</span>
              {venueLoc && <span className="text-white/35">· {venueLoc}</span>}
            </span>
          )}
          {broadcasts.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Tv size={10} className="text-white/35" />
              <span>{broadcasts.join(", ")}</span>
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-white/35">
            Open game
            <ChevronRight size={10} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function TeamSide({
  team,
  color,
  logoUrl,
  reverse = false,
}: {
  team: { abbreviation: string; displayName: string; shortDisplayName?: string };
  color: string;
  logoUrl: string | null;
  reverse?: boolean;
}) {
  const teamColor = color;
  return (
    <div className={`flex items-center gap-2 min-w-0 flex-1 ${reverse ? "flex-row-reverse" : ""}`}>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: hexWithOpacity(teamColor, 0.1),
          border: `1.5px solid ${hexWithOpacity(teamColor, 0.3)}`,
        }}>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={team.displayName}
            width={32}
            height={32}
            className="object-contain"
            style={{ width: "70%", height: "70%" }}
            unoptimized
          />
        ) : (
          <span className="text-xs font-black" style={{ color: teamColor }}>
            {team.abbreviation.slice(0, 2)}
          </span>
        )}
      </div>
      <div className={`flex flex-col min-w-0 ${reverse ? "items-end" : "items-start"}`}>
        <span className="font-bold text-white text-xs leading-tight truncate max-w-full">
          {team.shortDisplayName ?? team.abbreviation}
        </span>
        <span className="text-[8px] text-white/40 tabular-nums">{team.abbreviation}</span>
      </div>
    </div>
  );
}
