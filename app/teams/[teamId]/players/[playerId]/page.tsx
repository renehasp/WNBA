"use client";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, ArrowLeft, ExternalLink, Loader2, Newspaper, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  fetchAthleteOverview,
  fetchTeam,
  fetchLeagueInjuries,
  extractSeasonAverages,
  getAthleteHeadshotById,
  getAthleteIdFromInjuryEntry,
  getHeadshotUrl,
  getTeamLogoUrl,
  formatInjuryLabel,
} from "@/lib/espn";
import { getTeamColor, getTeamSecondary } from "@/lib/teams";
import { hexWithOpacity } from "@/lib/utils";

const DISPLAY_STATS: Array<{ key: string; label: string; name: string; slug: string; aliases: string[] }> = [
  { key: "GP",  label: "GP",  name: "Games Played",      slug: "gp",  aliases: ["GP", "G", "GAMES PLAYED", "GAMES_PLAYED"] },
  { key: "MIN", label: "MIN", name: "Minutes per Game",  slug: "min", aliases: ["MIN", "MPG", "MINUTES"] },
  { key: "PTS", label: "PTS", name: "Points per Game",   slug: "pts", aliases: ["PTS", "PPG", "POINTS"] },
  { key: "REB", label: "REB", name: "Rebounds per Game", slug: "reb", aliases: ["REB", "RPG", "REBOUNDS", "TREB", "TOTREB", "TOTAL REBOUNDS"] },
  { key: "AST", label: "AST", name: "Assists per Game",  slug: "ast", aliases: ["AST", "APG", "ASSISTS"] },
  { key: "STL", label: "STL", name: "Steals per Game",   slug: "stl", aliases: ["STL", "SPG", "STEALS"] },
  { key: "BLK", label: "BLK", name: "Blocks per Game",   slug: "blk", aliases: ["BLK", "BPG", "BLOCKS"] },
  { key: "TO",  label: "TO",  name: "Turnovers per Game",slug: "to",  aliases: ["TO", "TOV", "TURNOVERS"] },
  { key: "FG%", label: "FG%", name: "Field Goal %",      slug: "fg",  aliases: ["FG%", "FGP", "FG PCT", "FIELD GOAL %"] },
  { key: "3P%", label: "3P%", name: "3-Point %",         slug: "3p",  aliases: ["3P%", "3PP", "3PT%", "3-POINT FIELD GOAL %", "3-POINT %"] },
  { key: "FT%", label: "FT%", name: "Free Throw %",      slug: "ft",  aliases: ["FT%", "FTP", "FT PCT", "FREE THROW %"] },
  { key: "PF",  label: "PF",  name: "Fouls per Game",    slug: "pf",  aliases: ["PF", "PFG", "FOULS", "PERSONAL FOULS"] },
];

function findStat(
  labels: string[],
  values: string[],
  aliases: string[],
): string | null {
  const norm = (s: string) => (s ?? "").toUpperCase().trim();
  const aliasSet = new Set(aliases.map(norm));
  for (let i = 0; i < labels.length; i++) {
    if (aliasSet.has(norm(labels[i]))) {
      const v = values[i];
      if (v != null && v !== "") return String(v);
    }
  }
  return null;
}

function StatCard({
  label,
  name,
  value,
  color,
  highlight,
  href,
}: {
  label: string;
  name: string;
  value: string;
  color: string;
  highlight?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      title={`See league leaders for ${name}`}
      className="relative group flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-all hover:scale-[1.04] hover:border-white/30 cursor-pointer"
      style={{
        background: highlight ? hexWithOpacity(color, 0.1) : "rgba(255,255,255,0.03)",
        borderColor: highlight ? hexWithOpacity(color, 0.3) : "rgba(255,255,255,0.07)",
      }}>
      <span
        className="text-2xl font-extrabold tabular-nums leading-none"
        style={{ color: highlight ? color : "rgba(255,255,255,0.85)" }}>
        {value}
      </span>
      <span className="text-[10px] text-white/40 uppercase tracking-wide font-semibold">
        {label}
      </span>
      {highlight && <TrendingUp size={10} style={{ color }} />}

      {/* Custom hover tooltip — appears above the card */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-md text-[11px] font-medium text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 shadow-lg"
        style={{
          background: "rgba(15,15,26,0.96)",
          border: `1px solid ${hexWithOpacity(color, 0.45)}`,
        }}>
        {name} <span className="text-white/45">— see leaders</span>
        <span
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: `4px solid ${hexWithOpacity(color, 0.45)}`,
          }}
        />
      </div>
    </Link>
  );
}

export default function PlayerSeasonPage({
  params,
}: {
  params: Promise<{ teamId: string; playerId: string }>;
}) {
  const { teamId, playerId } = use(params);

  const playerQuery = useQuery({
    queryKey: ["athlete", playerId],
    queryFn: () => fetchAthleteOverview(playerId),
    staleTime: 5 * 60 * 1000,
  });

  // Pull team info for color theming and a back link to the right roster.
  const teamQuery = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeam(teamId),
    staleTime: 5 * 60 * 1000,
  });

  // League-wide injury report — has details (body part, side, return date)
  // that the per-team roster doesn't expose.
  const injuriesQuery = useQuery({
    queryKey: ["injuries"],
    queryFn: fetchLeagueInjuries,
    staleTime: 5 * 60 * 1000,
  });

  const team = teamQuery.data?.team;
  const abbr = team?.abbreviation ?? "";
  const color = getTeamColor(abbr) || `#${team?.color || "a855f7"}`;
  const secondary = getTeamSecondary(abbr);
  const logoUrl = getTeamLogoUrl(team);

  const overviewAthlete = playerQuery.data?.athlete;
  const rosterPlayer = teamQuery.data?.athletes?.find((a) => a.id === playerId);

  // Merge: prefer overview when present, fall back to roster bio for everything
  // that's missing. Either source alone is enough to render the header.
  const athlete = overviewAthlete
    ? { ...rosterPlayer, ...overviewAthlete }
    : rosterPlayer;
  const headshot =
    getHeadshotUrl(overviewAthlete?.headshot) ??
    getHeadshotUrl(rosterPlayer?.headshot) ??
    getAthleteHeadshotById(playerId);
  const averages = extractSeasonAverages(playerQuery.data ?? null);

  // Injury detail — look up this player in the league injury report
  // (the roster's injuries array only has status, no body part/side/etc).
  const detailedInjury = (() => {
    const groups = injuriesQuery.data?.injuries ?? [];
    for (const group of groups) {
      for (const entry of group.injuries ?? []) {
        if (getAthleteIdFromInjuryEntry(entry) === playerId) return entry;
      }
    }
    return null;
  })();
  const fallbackInjury = rosterPlayer?.injuries?.[0] ?? null;
  const isInjured =
    !!detailedInjury ||
    (!!fallbackInjury && (fallbackInjury.status ?? "").toLowerCase() !== "active");
  const injuryLabel = detailedInjury
    ? formatInjuryLabel(detailedInjury)
    : fallbackInjury?.status ?? "";
  const injuryReturnDate = detailedInjury?.details?.returnDate ?? null;
  const injuryShortNote = detailedInjury?.shortComment ?? null;

  const isLoading = playerQuery.isLoading || teamQuery.isLoading;
  const isError = playerQuery.isError;

  const ptsVal = averages ? findStat(averages.labels, averages.values, ["PTS", "PPG", "POINTS"]) : null;
  const ptsNum = ptsVal ? parseFloat(ptsVal) : 0;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Page-wide team logo watermark — CSS background so it isn't LCP-tracked */}
      {logoUrl && (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            backgroundImage: `url(${logoUrl})`,
            backgroundSize: "min(80vmin, 900px)",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.05,
            filter: "blur(0.5px)",
          }}
        />
      )}
      <Navbar />
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        <Link
          href={`/teams/${teamId}`}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors w-fit">
          <ArrowLeft size={12} />
          {team?.displayName ?? "Roster"}
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-2 text-white/30">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading player…</span>
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-400/70 text-sm">
            Failed to load player. ESPN API may be unavailable.
          </div>
        )}

        {!isLoading && athlete && (
          <div
            className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
            style={{
              background: `linear-gradient(135deg, ${hexWithOpacity(color, 0.18)} 0%, ${hexWithOpacity(secondary, 0.08)} 100%), #0f0f1a`,
              borderColor: hexWithOpacity(color, 0.25),
            }}>
            <div className="flex items-start gap-6 flex-wrap sm:flex-nowrap">
              {/* Large headshot — upper left */}
              <div
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden shrink-0 relative"
                style={{
                  border: `3px solid ${hexWithOpacity(color, 0.5)}`,
                  background: hexWithOpacity(color, 0.1),
                  boxShadow: `0 0 32px ${hexWithOpacity(color, 0.25)}`,
                }}>
                {logoUrl && (
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${logoUrl})`,
                      backgroundSize: "70%",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      opacity: 0.18,
                    }}
                  />
                )}
                <Image
                  src={headshot}
                  alt={athlete.displayName}
                  width={160}
                  height={160}
                  className="relative object-cover w-full h-full"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Right column: name + position + team + status */}
              <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  {athlete.displayName}
                </h1>

                <div className="flex items-center gap-2 flex-wrap">
                  {athlete.jersey && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded tabular-nums"
                      style={{ background: hexWithOpacity(color, 0.18), color }}>
                      #{athlete.jersey}
                    </span>
                  )}
                  {athlete.position?.displayName && (
                    <span className="text-sm text-white/70 font-medium">
                      {athlete.position.displayName}
                    </span>
                  )}
                </div>

                {team && (
                  <div className="flex items-center gap-2">
                    {logoUrl && (
                      <Image
                        src={logoUrl}
                        alt=""
                        aria-hidden
                        width={20}
                        height={20}
                        className="object-contain"
                        style={{ width: 20, height: 20 }}
                        unoptimized
                      />
                    )}
                    <span className="text-sm font-semibold text-white/85">
                      {team.displayName}
                    </span>
                  </div>
                )}

                {/* Status pill + injury detail line */}
                {isInjured ? (
                  <div className="flex flex-col gap-1.5">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit"
                      style={{
                        color: "#ef4444",
                        borderColor: "rgba(239,68,68,0.4)",
                        background: "rgba(239,68,68,0.1)",
                      }}
                      title={injuryShortNote ?? injuryLabel}>
                      <AlertTriangle size={12} />
                      <span>{injuryLabel || "Injured"}</span>
                      {injuryReturnDate && (
                        <span className="text-[10px] font-medium opacity-80">
                          · est. return{" "}
                          {new Date(injuryReturnDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    {injuryShortNote && (
                      <p className="text-[11px] text-white/55 leading-snug max-w-prose">
                        {injuryShortNote}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit"
                    style={{
                      color: "#22c55e",
                      borderColor: "rgba(34,197,94,0.4)",
                      background: "rgba(34,197,94,0.1)",
                    }}>
                    <Activity size={12} />
                    <span>Healthy and playing</span>
                  </div>
                )}

                {/* Bio line */}
                <div className="flex items-center gap-3 mt-1 text-[11px] text-white/35 flex-wrap">
                  {athlete.displayHeight && <span>{athlete.displayHeight}</span>}
                  {athlete.displayWeight && <span>· {athlete.displayWeight}</span>}
                  {athlete.age != null && <span>· Age {athlete.age}</span>}
                  {athlete.experience?.years != null && (
                    <span>
                      ·{" "}
                      {athlete.experience.years === 0
                        ? "Rookie"
                        : `${athlete.experience.years} yr${athlete.experience.years === 1 ? "" : "s"} exp`}
                    </span>
                  )}
                  {athlete.college?.name && <span>· {athlete.college.name}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest">
                Season Averages
              </h2>
              {averages?.seasonLabel && (
                <span className="text-xs text-white/30">{averages.seasonLabel}</span>
              )}
            </div>

            {averages ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {DISPLAY_STATS.map(({ key, label, name, slug, aliases }) => {
                  const v = findStat(averages.labels, averages.values, aliases);
                  if (v == null) return null;
                  const highlight =
                    (key === "PTS" && ptsNum >= 18) ||
                    (key === "REB" && parseFloat(v) >= 8) ||
                    (key === "AST" && parseFloat(v) >= 6);
                  return (
                    <StatCard
                      key={key}
                      label={label}
                      name={name}
                      value={v}
                      color={color}
                      highlight={highlight}
                      href={`/leaders/${slug}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-white/30 text-sm rounded-xl border border-white/[0.06]">
                No season stats available yet.
              </div>
            )}
          </section>
        )}

        {!isLoading && (() => {
          const articles = (playerQuery.data?.news ?? [])
            .filter((a) => !!a.links?.web?.href && (a.headline || a.description))
            .slice(0, 6);
          if (articles.length === 0) return null;
          return (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                  <Newspaper size={14} className="text-white/45" />
                  News
                </h2>
                <span className="text-xs text-white/30">via ESPN</span>
              </div>

              <div className="flex flex-col gap-3">
                {articles.map((a, i) => {
                  const href = a.links?.web?.href ?? "#";
                  const img = a.images?.[0];
                  const published = a.published ? new Date(a.published) : null;
                  const ago = published ? formatTimeAgo(published) : null;
                  return (
                    <a
                      key={(a.id ?? i).toString()}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col sm:flex-row gap-3 p-3 rounded-xl border transition-all hover:border-white/20"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderColor: "rgba(255,255,255,0.06)",
                      }}>
                      {img?.url && (
                        <div className="relative shrink-0 w-full sm:w-40 aspect-video sm:aspect-square overflow-hidden rounded-lg bg-white/[0.04]">
                          <Image
                            src={img.url}
                            alt={img.caption ?? a.headline ?? ""}
                            fill
                            sizes="(max-width: 640px) 100vw, 160px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <h3 className="text-sm font-semibold text-white leading-snug group-hover:underline decoration-white/30 underline-offset-2">
                          {a.headline}
                        </h3>
                        {a.description && a.description !== a.headline && (
                          <p className="text-xs text-white/55 leading-relaxed line-clamp-3">
                            {a.description}
                          </p>
                        )}
                        <div className="mt-auto flex items-center gap-2 pt-1 text-[11px] text-white/40">
                          <span
                            className="inline-flex items-center gap-1 font-semibold text-white/60 group-hover:text-white/80 transition-colors"
                            style={{ color }}>
                            ESPN
                            <ExternalLink size={10} />
                          </span>
                          {a.byline && <span>· {a.byline}</span>}
                          {ago && <span>· {ago}</span>}
                          {a.type && a.type !== "Story" && (
                            <span className="ml-auto text-[10px] uppercase tracking-widest text-white/30">
                              {a.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })()}
      </main>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const ms = Date.now() - date.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
