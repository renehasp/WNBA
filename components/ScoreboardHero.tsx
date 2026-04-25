"use client";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ESPNCompetitor, ESPNStatus } from "@/lib/espn";
import { formatGameClock } from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { hexWithOpacity, ordinalPeriod } from "@/lib/utils";

const WNBA_TIMEOUTS_TOTAL = 7;

interface ScoreboardHeroProps {
  home: ESPNCompetitor;
  away: ESPNCompetitor;
  status: ESPNStatus;
  venueName?: string;
  broadcasts?: string[];
  homeTimeoutsUsed?: number;
  awayTimeoutsUsed?: number;
}

function AnimatedScore({ value, color }: { value: string; color: string }) {
  const prevRef = useRef(value);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 400);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <motion.span
      key={value}
      initial={{ scale: 1 }}
      animate={pop ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.35 }}
      className="tabular-nums font-extrabold leading-none select-none"
      style={{
        fontSize: "clamp(3rem, 8vw, 6rem)",
        color,
        textShadow: `0 0 40px ${hexWithOpacity(color, 0.5)}`,
      }}>
      {value || "0"}
    </motion.span>
  );
}

function DigitalClock({ clock, period, isLive }: { clock: string; period: number; isLive: boolean }) {
  const [showColon, setShowColon] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => setShowColon((v) => !v), 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  const { min, sec } = formatGameClock(clock);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-mono font-bold text-white/90 flex items-center"
        style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}>
        <span>{min}</span>
        <span className={isLive ? "blink-colon" : ""} style={{ opacity: showColon || !isLive ? 1 : 0.15 }}>:</span>
        <span>{sec}</span>
      </div>
      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest"
        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
        {ordinalPeriod(period)}
      </span>
    </div>
  );
}

function TimeoutDots({ used, color, reverse }: { used: number; color: string; reverse?: boolean }) {
  const remaining = Math.max(0, WNBA_TIMEOUTS_TOTAL - used);
  return (
    <div className={`flex items-center gap-[4px] ${reverse ? "flex-row-reverse" : "flex-row"}`}
      title={`${remaining} timeout${remaining !== 1 ? "s" : ""} remaining · ${used} used`}>
      {Array.from({ length: WNBA_TIMEOUTS_TOTAL }).map((_, i) => {
        const isUsed = i < used;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: 7,
              height: 7,
              background: isUsed ? hexWithOpacity(color, 0.85) : "rgba(255,255,255,0.1)",
              border: isUsed ? `1px solid ${hexWithOpacity(color, 0.5)}` : "1px solid rgba(255,255,255,0.12)",
              boxShadow: isUsed ? `0 0 5px ${hexWithOpacity(color, 0.4)}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function TeamBlock({
  competitor,
  timeoutsUsed = 0,
  reverse = false,
}: {
  competitor: ESPNCompetitor;
  timeoutsUsed?: number;
  reverse?: boolean;
}) {
  const abbr = competitor.team.abbreviation;
  const teamColor = getTeamColor(abbr) || `#${competitor.team.color || "a855f7"}`;
  const score = competitor.score || "0";
  const isWinning = parseInt(competitor.score) > 0;

  return (
    <div className={`flex flex-col items-center gap-3 ${reverse ? "" : ""}`} style={{ flex: 1 }}>
      {/* Logo ring */}
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: "clamp(64px, 12vw, 100px)",
          height: "clamp(64px, 12vw, 100px)",
          background: hexWithOpacity(teamColor, 0.1),
          border: `2px solid ${hexWithOpacity(teamColor, 0.35)}`,
          boxShadow: `0 0 32px ${hexWithOpacity(teamColor, 0.2)}, inset 0 0 16px ${hexWithOpacity(teamColor, 0.08)}`,
        }}>
        {competitor.team.logo ? (
          <Image
            src={competitor.team.logo}
            alt={competitor.team.displayName}
            width={60}
            height={60}
            className="object-contain"
            style={{ width: "60%", height: "60%" }}
            unoptimized
          />
        ) : (
          <span className="text-2xl font-black" style={{ color: teamColor }}>
            {abbr.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Team name */}
      <div className="text-center">
        <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
          {competitor.homeAway === "home" ? "Home" : "Away"}
        </p>
        <p className="font-bold text-white text-sm sm:text-base leading-tight">
          {competitor.team.shortDisplayName || competitor.team.displayName}
        </p>
        <p className="text-xs text-white/30">{abbr}</p>
      </div>

      {/* Score */}
      <AnimatedScore
        value={score}
        color={isWinning || score === "0" ? teamColor : "rgba(255,255,255,0.4)"}
      />

      {/* Record */}
      {competitor.records?.[0] && (
        <span className="text-xs text-white/30">{competitor.records[0].summary}</span>
      )}

      {/* Timeout dots */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[9px] uppercase tracking-widest font-semibold text-white/20">Timeouts</span>
        <TimeoutDots used={timeoutsUsed} color={teamColor} reverse={reverse} />
      </div>
    </div>
  );
}

export default function ScoreboardHero({
  home,
  away,
  status,
  venueName,
  broadcasts,
  homeTimeoutsUsed = 0,
  awayTimeoutsUsed = 0,
}: ScoreboardHeroProps) {
  const isLive = status.type.state === "in";
  const isFinal = status.type.state === "post";
  const isPre = status.type.state === "pre";

  // Detect special game states
  const statusName = (status.type.name ?? "").toUpperCase();
  const statusDesc = (status.type.description ?? "").toLowerCase();
  const statusDetail = (status.type.detail ?? "").toLowerCase();

  const isTimeout = statusName.includes("TIMEOUT") || statusDesc.includes("timeout") || statusDetail.includes("timeout");
  const isHalftime = !isTimeout && (statusName.includes("HALFTIME") || statusDesc.includes("halftime"));
  const clockAtZero = (() => {
    const t = (status.displayClock ?? "").trim();
    return t === "0:00" || t === "00:00" || t === "0.0" || t === "0";
  })();
  const isEndPeriod = !isTimeout && !isHalftime && (
    statusName.includes("END_PERIOD") ||
    statusDesc.includes("end of period") ||
    statusDesc.includes("end of ") ||
    (isLive && clockAtZero)
  );

  let periodBreakLabel: string | null = null;
  if (isTimeout) {
    periodBreakLabel = "Timeout";
  } else if (isHalftime) {
    periodBreakLabel = "Halftime";
  } else if (isEndPeriod) {
    const p = status.period;
    const pLabel = p === 5 ? "OT" : p > 5 ? `${p - 4}OT` : ordinalPeriod(p);
    periodBreakLabel = `End of ${pLabel}`;
  }

  const awayColor = getTeamColor(away.team.abbreviation) || `#${away.team.color || "3b82f6"}`;
  const homeColor = getTeamColor(home.team.abbreviation) || `#${home.team.color || "a855f7"}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
      style={{ background: "linear-gradient(160deg, #0f0f1a 0%, #0a0a0f 60%, #0f0f1a 100%)" }}>
      {/* Background gradient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 20% 50%, ${hexWithOpacity(awayColor, 0.08)} 0%, transparent 70%),
                       radial-gradient(ellipse 60% 50% at 80% 50%, ${hexWithOpacity(homeColor, 0.08)} 0%, transparent 70%)`,
        }} />

      {/* Background team logo watermarks — away centered on 25%, home centered on 75% */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {away.team.logo && (
          <Image
            src={away.team.logo}
            alt=""
            width={400}
            height={400}
            className="object-contain absolute"
            style={{
              left: "25%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "35%",
              height: "auto",
              opacity: 0.06,
              filter: "blur(0.5px)",
            }}
            unoptimized
          />
        )}
        {home.team.logo && (
          <Image
            src={home.team.logo}
            alt=""
            width={400}
            height={400}
            className="object-contain absolute"
            style={{
              left: "75%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "35%",
              height: "auto",
              opacity: 0.06,
              filter: "blur(0.5px)",
            }}
            unoptimized
          />
        )}
      </div>

      {/* Color bar top */}
      <div className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${awayColor} 0%, transparent 40%, transparent 60%, ${homeColor} 100%)` }} />

      <div className="relative px-4 py-6 sm:px-8 sm:py-8">
        {/* Main scoreboard row */}
        <div className="flex items-end justify-between gap-4">
          <TeamBlock competitor={away} timeoutsUsed={awayTimeoutsUsed} />

          {/* Center: clock + status */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <AnimatePresence mode="wait">
              {periodBreakLabel ? (
                <motion.div
                  key={periodBreakLabel}
                  initial={{ opacity: 0, scale: 0.85, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 6 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: isTimeout
                      ? "rgba(56,189,248,0.12)"
                      : isHalftime
                        ? "rgba(251,191,36,0.13)"
                        : "rgba(255,255,255,0.07)",
                    border: isTimeout
                      ? "1px solid rgba(56,189,248,0.35)"
                      : isHalftime
                        ? "1px solid rgba(251,191,36,0.35)"
                        : "1px solid rgba(255,255,255,0.14)",
                    color: isTimeout ? "#38bdf8" : isHalftime ? "#f59e0b" : "rgba(255,255,255,0.65)",
                  }}>
                  {isTimeout && <span className="text-sm">⏱</span>}
                  {isHalftime && <span className="text-sm">☕</span>}
                  {periodBreakLabel}
                </motion.div>
              ) : isLive ? (
                <motion.div
                  key="live"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] pulse-live" />
                  Live
                </motion.div>
              ) : isFinal ? (
                <motion.div
                  key="final"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                  Final
                </motion.div>
              ) : isPre ? (
                <motion.div
                  key="pre"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                  Upcoming
                </motion.div>
              ) : null}
            </AnimatePresence>

            {!isPre && (
              <DigitalClock
                clock={status.displayClock}
                period={status.period}
                isLive={isLive}
              />
            )}

            <div className="text-center">
              <span className="text-xs font-medium text-white/25 uppercase tracking-widest">vs</span>
            </div>
          </div>

          <TeamBlock competitor={home} timeoutsUsed={homeTimeoutsUsed} reverse />
        </div>

        {/* Bottom info row */}
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2 text-xs text-white/30">
          {venueName && <span>📍 {venueName}</span>}
          {broadcasts && broadcasts.length > 0 && (
            <span>📺 {broadcasts.join(", ")}</span>
          )}
          {!venueName && !broadcasts?.length && <span />}
          <span className="text-white/20">{status.type.detail}</span>
        </div>
      </div>
    </div>
  );
}
