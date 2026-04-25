"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveGames } from "@/hooks/useLiveGames";
import GameCard from "@/components/GameCard";
import Navbar from "@/components/Navbar";
import { RefreshCw, Calendar, Wifi, WifiOff } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.05] p-4 h-[140px] skeleton" />
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useLiveGames();
  const events = data?.events ?? [];

  const liveEvents = events.filter((e) => e.status.type.state === "in");
  const upcomingEvents = events.filter((e) => e.status.type.state === "pre");
  const finalEvents = events.filter((e) => e.status.type.state === "post");

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Today&apos;s{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                Games
              </span>
            </h1>
            <p className="text-sm text-white/30 mt-1 flex items-center gap-1.5">
              <Calendar size={12} />
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-white/25 hidden sm:block">Updated {lastUpdated}</span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all disabled:opacity-40">
              <RefreshCw size={11} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-400 text-sm">
            <WifiOff size={16} />
            <div>
              <p className="font-semibold">Failed to load games</p>
              <p className="text-xs opacity-70 mt-0.5">ESPN API may be temporarily unavailable. Data may be stale.</p>
            </div>
            <button onClick={() => refetch()} className="ml-auto text-xs underline opacity-70 hover:opacity-100">Retry</button>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Loaded content */}
        {!isLoading && (
          <div className="flex flex-col gap-10">
            {/* Live games */}
            {liveEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] pulse-live" />
                  <h2 className="text-sm font-bold text-[#22c55e] uppercase tracking-widest">Live Now</h2>
                  <span className="text-xs text-white/25">({liveEvents.length})</span>
                </div>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
                  <AnimatePresence>
                    {liveEvents.map((event) => (
                      <GameCard key={event.id} event={event} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            )}

            {/* Upcoming */}
            {upcomingEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={13} className="text-white/30" />
                  <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">Upcoming</h2>
                  <span className="text-xs text-white/20">({upcomingEvents.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map((event) => (
                    <GameCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Final */}
            {finalEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-white/20" />
                  <h2 className="text-sm font-bold text-white/30 uppercase tracking-widest">Final</h2>
                  <span className="text-xs text-white/20">({finalEvents.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finalEvents.map((event) => (
                    <GameCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {events.length === 0 && !isLoading && !isError && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <span className="text-6xl">🏀</span>
                <h2 className="text-xl font-bold text-white/50">No games today</h2>
                <p className="text-sm text-white/25 text-center max-w-xs">
                  Check back during the WNBA season (May–September). The schedule updates automatically.
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-white/20">
                  <Wifi size={12} />
                  <span>Polling ESPN every 8 seconds</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
