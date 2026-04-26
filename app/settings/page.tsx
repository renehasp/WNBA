"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Globe, Heart, Minus, Plus, RotateCcw, Settings as SettingsIcon, Type } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  useAppStore,
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
  FONT_SCALE_STEP,
  TIME_ZONES,
} from "@/store/useAppStore";
import { fetchTeams } from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { hexWithOpacity } from "@/lib/utils";

const DEVICE_TZ =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/New_York";

function previewTimeIn(zone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date());
  } catch {
    return "—";
  }
}

export default function SettingsPage() {
  const fontScale = useAppStore((s) => s.fontScale);
  const increase = useAppStore((s) => s.increaseFontScale);
  const decrease = useAppStore((s) => s.decreaseFontScale);
  const reset = useAppStore((s) => s.resetFontScale);

  const timeZonePref = useAppStore((s) => s.timeZone);
  const setTimeZone = useAppStore((s) => s.setTimeZone);
  const effectiveTz = timeZonePref ?? DEVICE_TZ;

  const favoriteTeamId = useAppStore((s) => s.favoriteTeamId);
  const setFavoriteTeam = useAppStore((s) => s.setFavoriteTeam);
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
    staleTime: 60 * 60 * 1000,
  });
  const teams = (teamsQuery.data?.sports?.[0]?.leagues?.[0]?.teams ?? [])
    .map((t) => t.team)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const favoriteTeam = teams.find((t) => t.id === favoriteTeamId) ?? null;
  const favoriteAccent = favoriteTeam
    ? getTeamColor(favoriteTeam.abbreviation) || "#fde68a"
    : "#fde68a";

  const pct = Math.round(fontScale * 100);
  const atMin = fontScale <= FONT_SCALE_MIN + 0.001;
  const atMax = fontScale >= FONT_SCALE_MAX - 0.001;

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

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon size={20} className="text-white/60" />
            <span>
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                Settings
              </span>
            </span>
          </h1>
          <p className="text-sm text-white/30 mt-1">
            Preferences are saved locally and apply across all pages.
          </p>
        </div>

        {/* Font size card */}
        <section
          className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <Type size={18} className="text-purple-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white">Font size</h2>
              <p className="text-xs text-white/50 leading-relaxed mt-0.5">
                Scale text and UI everywhere in the app. Useful on phones or smaller
                screens. Range {Math.round(FONT_SCALE_MIN * 100)}% – {Math.round(FONT_SCALE_MAX * 100)}%.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={decrease}
              disabled={atMin}
              aria-label="Decrease font size"
              title="Decrease font size"
              className="w-11 h-11 rounded-xl border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/30 hover:bg-white/[0.04]"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <Minus size={18} className="text-white/80" />
            </button>

            <div
              className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl border"
              style={{
                background: "rgba(168,85,247,0.08)",
                borderColor: "rgba(168,85,247,0.3)",
              }}>
              <span className="text-3xl font-extrabold tabular-nums leading-none text-purple-300">
                {pct}%
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1.5 font-semibold">
                Current scale
              </span>
            </div>

            <button
              type="button"
              onClick={increase}
              disabled={atMax}
              aria-label="Increase font size"
              title="Increase font size"
              className="w-11 h-11 rounded-xl border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/30 hover:bg-white/[0.04]"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <Plus size={18} className="text-white/80" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${((fontScale - FONT_SCALE_MIN) / (FONT_SCALE_MAX - FONT_SCALE_MIN)) * 100}%`,
                  background: "linear-gradient(90deg, #a855f7, #3b82f6)",
                }}
              />
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={fontScale === 1}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all disabled:opacity-30">
              <RotateCcw size={11} />
              Reset
            </button>
          </div>

          {/* Live preview so the user can see the effect */}
          <div
            className="mt-1 p-3 rounded-xl border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1.5">
              Preview
            </p>
            <p className="text-sm text-white/85">
              Caitlin Clark scored 22 points on 8/16 shooting in the Indiana Fever&apos;s
              78&ndash;71 win over the Las Vegas Aces.
            </p>
            <p className="text-xs text-white/45 mt-1">
              Q3 · 4:21 left · ESPN · 2h ago
            </p>
          </div>
        </section>

        {/* Time zone card */}
        <section
          className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <Globe size={18} className="text-blue-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white">Time zone</h2>
              <p className="text-xs text-white/50 leading-relaxed mt-0.5">
                Used for the schedule page and any date/time display across the app.
                Defaults to your device&apos;s zone if you don&apos;t pick one.
              </p>
            </div>
          </div>

          <div>
            <select
              value={timeZonePref ?? "__device__"}
              onChange={(e) => {
                const v = e.target.value;
                setTimeZone(v === "__device__" ? null : v);
              }}
              className="w-full text-sm font-semibold rounded-xl border bg-white/[0.02] text-white/90 px-3 py-2.5 hover:border-white/25 transition-colors cursor-pointer focus:outline-none focus:border-white/35"
              style={{ borderColor: "rgba(255,255,255,0.12)", colorScheme: "dark" }}
              aria-label="Time zone">
              {TIME_ZONES.map((tz) => (
                <option key={tz.value ?? "device"} value={tz.value ?? "__device__"}>
                  {tz.label}
                  {tz.value === null ? ` (${DEVICE_TZ})` : ""} — {tz.sublabel}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-[11px] text-white/45">
              <p className="text-[9px] uppercase tracking-widest font-semibold text-white/30">
                Now in {timeZonePref ? "selected zone" : "device zone"}
              </p>
              <p className="text-base font-bold tabular-nums text-white/90 mt-0.5">
                {previewTimeIn(effectiveTz)}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">{effectiveTz}</p>
            </div>
            <Link
              href="/schedule"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all">
              View schedule →
            </Link>
          </div>
        </section>

        {/* Favorite team card */}
        <section
          className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(253,224,138,0.12)", border: "1px solid rgba(253,224,138,0.4)" }}>
              <Heart size={18} className="text-yellow-200" fill="currentColor" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white">Favorite team</h2>
              <p className="text-xs text-white/50 leading-relaxed mt-0.5">
                Picks your team for personalized highlights. The team and its players
                will be tinted yellow in lists across the app (teams grid, schedule,
                leaderboards, search).
              </p>
            </div>
          </div>

          <div>
            <select
              value={favoriteTeamId ?? ""}
              onChange={(e) => setFavoriteTeam(e.target.value || null)}
              disabled={teamsQuery.isLoading || teams.length === 0}
              className="w-full text-sm font-semibold rounded-xl border bg-white/[0.02] text-white/90 px-3 py-2.5 hover:border-white/25 transition-colors cursor-pointer focus:outline-none focus:border-white/35 disabled:opacity-50"
              style={{ borderColor: "rgba(255,255,255,0.12)", colorScheme: "dark" }}
              aria-label="Favorite team">
              <option value="">{teamsQuery.isLoading ? "Loading teams…" : "None"}</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName}
                </option>
              ))}
            </select>
          </div>

          {favoriteTeam && (
            <div
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border"
              style={{
                background: hexWithOpacity(favoriteAccent, 0.08),
                borderColor: hexWithOpacity(favoriteAccent, 0.3),
              }}>
              <div className="flex items-center gap-2 min-w-0">
                <Heart size={14} fill="#fde68a" className="text-yellow-200 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest font-semibold text-white/30">
                    Now following
                  </p>
                  <p className="text-base font-bold text-white truncate"
                    style={{ color: favoriteAccent }}>
                    {favoriteTeam.displayName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/teams/${favoriteTeam.id}`}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-white/75 hover:text-white hover:border-white/30 transition-all">
                  View team →
                </Link>
                <button
                  type="button"
                  onClick={() => setFavoriteTeam(null)}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-white/45 hover:text-white/80 hover:border-white/20 transition-all"
                  title="Clear favorite">
                  Clear
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="text-[11px] text-white/30 text-center">
          Step size: {Math.round(FONT_SCALE_STEP * 100)}%. Settings are stored on this device only.
        </p>
      </main>
    </div>
  );
}
