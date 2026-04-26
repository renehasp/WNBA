"use client";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Heart, Loader2, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import PlayerSearch from "@/components/PlayerSearch";
import { fetchTeams, getTeamLogoUrl } from "@/lib/espn";
import { getTeamColor, getTeamSecondary } from "@/lib/teams";
import { hexWithOpacity } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const FAV_YELLOW = "#fde68a";

export default function TeamsPage() {
  const favoriteTeamId = useAppStore((s) => s.favoriteTeamId);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
    staleTime: 60 * 60 * 1000,
  });

  const teams = (data?.sports?.[0]?.leagues?.[0]?.teams ?? [])
    .map((t) => t.team)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-start sm:items-center justify-between gap-4 mb-8 flex-col sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-white/60" />
              <span>
                WNBA{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                  Teams
                </span>
              </span>
            </h1>
            <p className="text-sm text-white/30 mt-1">
              {teams.length || ""} {teams.length === 1 ? "team" : "teams"}
              {teams.length ? " · click a team to view its roster" : ""}
            </p>
          </div>
          <PlayerSearch />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-2 text-white/30">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading teams…</span>
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-400/70 text-sm">
            Failed to load teams. ESPN API may be unavailable.
          </div>
        )}

        {!isLoading && teams.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
            {teams.map((team, idx) => {
              const color = getTeamColor(team.abbreviation) || `#${team.color || "a855f7"}`;
              const secondary = getTeamSecondary(team.abbreviation);
              const record = team.record?.items?.[0]?.summary;
              const logoUrl = getTeamLogoUrl(team);
              // Only the first card gets priority — Next's LCP detector picks
              // a single image, and marking many as priority creates new warnings.
              const isLcpCandidate = idx === 0;
              const isFavorite = team.id === favoriteTeamId;

              return (
                <motion.div
                  key={team.id}
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
                        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                        title="Your favorite team"
                        style={{
                          background: hexWithOpacity(FAV_YELLOW, 0.18),
                          border: `1px solid ${hexWithOpacity(FAV_YELLOW, 0.55)}`,
                        }}>
                        <Heart size={11} fill={FAV_YELLOW} className="text-yellow-200" />
                      </div>
                    )}
                    {/* Background watermark — CSS background so it isn't LCP-tracked */}
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
                    <div className="relative p-4 flex flex-col gap-3 min-h-[140px]">
                      <div className="flex items-start justify-between">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={team.displayName}
                            width={48}
                            height={48}
                            className="object-contain"
                            style={{ width: 48, height: 48 }}
                            priority={isLcpCandidate}
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg"
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
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                          {team.location ?? ""}
                        </p>
                        <h2 className="text-lg font-bold text-white leading-tight">
                          {team.name ?? team.shortDisplayName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums"
                            style={{ background: hexWithOpacity(color, 0.18), color }}>
                            {team.abbreviation}
                          </span>
                          {record && (
                            <span className="text-xs text-white/50 tabular-nums">{record}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}
