"use client";
import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Heart, Loader2, MapPin, Tv, ChevronRight, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { fetchSchedule, getTeamLogoUrl, type ESPNEvent } from "@/lib/espn";
import { useAppStore } from "@/store/useAppStore";
import { getTeamColor } from "@/lib/teams";
import { hexWithOpacity } from "@/lib/utils";

const FAV_YELLOW = "#fde68a";

const DEVICE_TZ =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/New_York";

function shortTzLabel(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
  } catch {
    return zone;
  }
}

interface DayGroup {
  iso: string; // YYYY-MM-DD in selected zone
  display: string; // e.g. "Saturday, April 26"
  events: ESPNEvent[];
}

export default function SchedulePage() {
  const tzPref = useAppStore((s) => s.timeZone);
  const tz = tzPref ?? DEVICE_TZ;
  const favoriteTeamId = useAppStore((s) => s.favoriteTeamId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["schedule"],
    queryFn: () => fetchSchedule(30),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Filter to upcoming + group by date in the selected time zone.
  const days: DayGroup[] = useMemo(() => {
    const events = (data?.events ?? []).filter(
      (e) => e.status?.type?.state === "pre",
    );

    const groups = new Map<string, ESPNEvent[]>();
    for (const ev of events) {
      const date = new Date(ev.date);
      // Build YYYY-MM-DD in the user's selected zone
      const isoParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const y = isoParts.find((p) => p.type === "year")?.value ?? "";
      const m = isoParts.find((p) => p.type === "month")?.value ?? "";
      const d = isoParts.find((p) => p.type === "day")?.value ?? "";
      const iso = `${y}-${m}-${d}`;
      if (!groups.has(iso)) groups.set(iso, []);
      groups.get(iso)!.push(ev);
    }

    const sortedDays = Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([iso, evs]) => {
        const sample = new Date(evs[0].date);
        const display = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          weekday: "long",
          month: "long",
          day: "numeric",
        }).format(sample);
        evs.sort((a, b) => +new Date(a.date) - +new Date(b.date));
        return { iso, display, events: evs };
      });

    return sortedDays;
  }, [data, tz]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar size={20} className="text-white/60" />
              <span>
                Upcoming{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                  Schedule
                </span>
              </span>
            </h1>
            <p className="text-sm text-white/30 mt-1 flex items-center gap-1.5 flex-wrap">
              <Clock size={12} />
              <span>
                Times in <span className="text-white/60 font-semibold">{shortTzLabel(tz)}</span>
                <span className="text-white/30"> ({tz})</span>
              </span>
              <Link href="/settings" className="underline decoration-white/20 hover:decoration-white/60">
                change
              </Link>
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-2 text-white/30">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading schedule…</span>
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-400/70 text-sm">
            Failed to load the schedule. ESPN API may be unavailable.
          </div>
        )}

        {!isLoading && days.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">🏀</span>
            <p className="text-lg font-bold text-white/55">No upcoming games</p>
            <p className="text-xs text-white/30 text-center max-w-sm">
              Either the season hasn&apos;t opened yet or the next 30 days have no scheduled games.
            </p>
          </div>
        )}

        {days.map((day, di) => (
          <motion.section
            key={day.iso}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: di * 0.04 }}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-white/55 uppercase tracking-widest">
                {day.display}
              </h2>
              <span className="text-xs text-white/25">
                ({day.events.length} {day.events.length === 1 ? "game" : "games"})
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {day.events.map((event) => (
                <ScheduleCard
                  key={event.id}
                  event={event}
                  tz={tz}
                  favoriteTeamId={favoriteTeamId}
                />
              ))}
            </div>
          </motion.section>
        ))}
      </main>
    </div>
  );
}

function ScheduleCard({
  event,
  tz,
  favoriteTeamId,
}: {
  event: ESPNEvent;
  tz: string;
  favoriteTeamId: string | null;
}) {
  const competition = event.competitions?.[0];
  if (!competition) return null;
  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const homeColor = getTeamColor(home.team.abbreviation) || "#a855f7";
  const awayColor = getTeamColor(away.team.abbreviation) || "#3b82f6";
  const homeLogo = getTeamLogoUrl(home.team);
  const awayLogo = getTeamLogoUrl(away.team);

  const isFavoriteGame =
    !!favoriteTeamId &&
    (home.team.id === favoriteTeamId || away.team.id === favoriteTeamId);

  const date = new Date(event.date);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  const venue = competition.venue?.fullName ?? null;
  const city = competition.venue?.address?.city;
  const state = competition.venue?.address?.state;
  const venueLoc = [city, state].filter(Boolean).join(", ");

  const broadcasts = competition.broadcasts?.flatMap((b) => b.names) ?? [];

  return (
    <Link
      href={`/game/${event.id}`}
      className="group relative block rounded-2xl border overflow-hidden transition-all hover:scale-[1.005]"
      style={{
        background: isFavoriteGame
          ? `linear-gradient(135deg, ${hexWithOpacity(awayColor, 0.06)} 0%, ${hexWithOpacity(FAV_YELLOW, 0.1)} 50%, ${hexWithOpacity(homeColor, 0.06)} 100%)`
          : `linear-gradient(135deg, ${hexWithOpacity(awayColor, 0.06)} 0%, #0f0f1a 50%, ${hexWithOpacity(homeColor, 0.06)} 100%)`,
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

      <div className="relative p-4 sm:p-5">
        {/* Top row: away vs home */}
        <div className="flex items-center justify-between gap-3">
          {/* Away (visiting) */}
          <TeamSide team={away.team} color={awayColor} logoUrl={awayLogo} role="Visiting" />

          {/* Center: game time */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="text-xs uppercase tracking-widest font-semibold text-white/35">
              vs
            </div>
            <div className="text-sm font-bold text-white tabular-nums">{time}</div>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-white/30">
              {shortTzLabel(tz)}
            </div>
          </div>

          {/* Home */}
          <TeamSide team={home.team} color={homeColor} logoUrl={homeLogo} role="Home" reverse />
        </div>

        {/* Footer info: venue, city, broadcast */}
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/45">
          {venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={11} className="text-white/35" />
              <span className="text-white/65 font-semibold">{venue}</span>
              {venueLoc && <span className="text-white/35">· {venueLoc}</span>}
            </span>
          )}
          {broadcasts.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Tv size={11} className="text-white/35" />
              <span>{broadcasts.join(", ")}</span>
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-white/35 group-hover:text-white/70 transition-colors">
            Open game
            <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function TeamSide({
  team,
  color,
  logoUrl,
  role,
  reverse = false,
}: {
  team: { abbreviation: string; displayName: string; shortDisplayName?: string };
  color: string;
  logoUrl: string | null;
  role: string;
  reverse?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 min-w-0 flex-1 ${reverse ? "flex-row-reverse" : ""}`}>
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: hexWithOpacity(color, 0.1),
          border: `2px solid ${hexWithOpacity(color, 0.3)}`,
        }}>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={team.displayName}
            width={44}
            height={44}
            className="object-contain"
            style={{ width: "75%", height: "75%" }}
            unoptimized
          />
        ) : (
          <span className="text-sm font-black" style={{ color }}>
            {team.abbreviation.slice(0, 2)}
          </span>
        )}
      </div>
      <div className={`flex flex-col min-w-0 ${reverse ? "items-end" : "items-start"}`}>
        <span
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: hexWithOpacity(color, 0.85) }}>
          {role}
        </span>
        <span className="font-bold text-white text-sm sm:text-base leading-tight truncate max-w-full"
          title={team.displayName}>
          {team.shortDisplayName ?? team.displayName}
        </span>
        <span className="text-[10px] text-white/30 tabular-nums">{team.abbreviation}</span>
      </div>
    </div>
  );
}
