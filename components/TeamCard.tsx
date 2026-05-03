"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, Heart } from "lucide-react";
import type { ESPNTeam } from "@/lib/espn";
import { getTeamColor, getTeamSecondary } from "@/lib/teams";
import { hexWithOpacity } from "@/lib/utils";
import { getTeamFoundedYear } from "@/lib/teamData";

const FAV_YELLOW = "#fde68a";

interface TeamCardProps {
  team: ESPNTeam & { record?: { items?: Array<{ summary?: string }> } };
  logoUrl?: string | null;
  isFavorite: boolean;
  isLcpCandidate: boolean;
  rank?: number;
}

export default function TeamCard({
  team,
  logoUrl,
  isFavorite,
  isLcpCandidate,
  rank,
}: TeamCardProps) {
  const color = getTeamColor(team.abbreviation) || `#${team.color || "a855f7"}`;
  const secondary = getTeamSecondary(team.abbreviation);
  const record = team.record?.items?.[0]?.summary;
  const founded = getTeamFoundedYear(team.abbreviation, team.displayName);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
      <Link
        href={`/teams/${team.id}`}
        className="group relative block rounded-2xl border overflow-hidden transition-all hover:scale-[1.02]"
        style={{
          background: isFavorite
            ? `linear-gradient(135deg, ${hexWithOpacity(FAV_YELLOW, 0.18)} 0%, ${hexWithOpacity(color, 0.12)} 100%)`
            : `linear-gradient(135deg, ${hexWithOpacity(color, 0.15)} 0%, ${hexWithOpacity(secondary, 0.08)} 100%)`,
          borderColor: isFavorite ? hexWithOpacity(FAV_YELLOW, 0.55) : hexWithOpacity(color, 0.25),
          boxShadow: isFavorite ? `0 0 24px ${hexWithOpacity(FAV_YELLOW, 0.15)}` : undefined,
        }}>
        {isFavorite && (
          <div
            className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center"
            title="Your favorite team"
            style={{
              background: hexWithOpacity(FAV_YELLOW, 0.18),
              border: `1px solid ${hexWithOpacity(FAV_YELLOW, 0.55)}`,
            }}>
            <Heart size={9} fill={FAV_YELLOW} className="text-yellow-200" />
          </div>
        )}
        {/* Background watermark */}
        {logoUrl && (
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              backgroundImage: `url(${logoUrl})`,
              backgroundSize: "120%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.1,
              filter: "blur(0.5px)",
            }}
          />
        )}
        <div className="relative p-3 flex flex-col gap-2 min-h-[110px]">
          <div className="flex items-start justify-between">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={team.displayName}
                width={40}
                height={40}
                className="object-contain"
                style={{ width: 40, height: 40 }}
                priority={isLcpCandidate}
                unoptimized
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base"
                style={{ background: hexWithOpacity(color, 0.2), color }}>
                {team.abbreviation.slice(0, 2)}
              </div>
            )}
            <ChevronRight
              size={16}
              className="text-white/30 group-hover:text-white/70 transition-colors"
            />
          </div>
          <div>
            <div className="text-base font-bold text-white leading-tight">
              {team.name ?? team.shortDisplayName}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[9px] font-bold tabular-nums"
                style={{ color }}>
                {team.location ?? team.abbreviation}
              </span>
              {record && (
                <span className="text-[10px] text-white/50 tabular-nums">{record}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[9px]">
              {rank && (
                <span className="text-white/60">
                  Rank: <span className="font-bold" style={{ color }}>{rank}</span>
                </span>
              )}
              {founded && (
                <span className="text-white/60">
                  Est: <span className="font-bold text-white">{founded}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
