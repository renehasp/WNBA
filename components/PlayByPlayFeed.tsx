"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, type TargetAndTransition, type Transition } from "framer-motion";
import { Shield, X } from "lucide-react";
import type { ProcessedPlay } from "@/lib/spoiler-engine";
import type { ESPNCompetitor, ESPNPlayerStats, ESPNTeam } from "@/lib/espn";
import { getTeamColor } from "@/lib/teams";
import { hexWithOpacity, ordinalPeriod } from "@/lib/utils";

// ── Play classification ───────────────────────────────────────────────────────
type PlayType =
  | "three_made" | "three_missed"
  | "dunk" | "layup_made" | "two_made"
  | "ft_made" | "ft_missed"
  | "shot_missed" | "rebound"
  | "steal" | "block"
  | "foul" | "turnover"
  | "timeout" | "sub" | "jumpball" | "other";

function classifyPlay(text: string | undefined, scoringPlay?: boolean): PlayType {
  const t = (text ?? "").toLowerCase();
  if (t.includes("3 point") || t.includes("three point") || t.includes("3-point")) {
    return scoringPlay ? "three_made" : "three_missed";
  }
  if (scoringPlay && (t.includes("dunk") || t.includes("slam"))) return "dunk";
  if (scoringPlay && t.includes("layup")) return "layup_made";
  if (t.includes("free throw") || t.includes("free-throw")) {
    return (t.includes("missed") || !scoringPlay) ? "ft_missed" : "ft_made";
  }
  if (scoringPlay) return "two_made";
  if (t.includes("missed") || t.includes(" miss ")) return "shot_missed";
  if (t.includes("rebound")) return "rebound";
  if (t.includes("steal") || t.includes("steals")) return "steal";
  if (t.includes("block")) return "block";
  if (t.includes("turnover") || t.includes("lost ball") || t.includes("bad pass")) return "turnover";
  if (t.includes("foul")) return "foul";
  if (t.includes("timeout")) return "timeout";
  if (t.includes("substitut") || t.includes("enters") || t.includes("replaces")) return "sub";
  if (t.includes("jump ball")) return "jumpball";
  return "other";
}

// ── Per-type visual config ────────────────────────────────────────────────────
type PlayConfig = {
  color: string;
  label: string;
  emoji: string;
  importance: "high" | "medium" | "low";
  shimmer?: boolean;
  shake?: boolean;
};

const CONFIGS: Record<PlayType, PlayConfig> = {
  three_made:   { color: "#a855f7", label: "3PT",       emoji: "🎯", importance: "high",   shimmer: true },
  dunk:         { color: "#f97316", label: "DUNK",      emoji: "🔥", importance: "high",   shimmer: true },
  layup_made:   { color: "#22c55e", label: "LAYUP",     emoji: "🏀", importance: "medium" },
  two_made:     { color: "#22c55e", label: "SCORE",     emoji: "🏀", importance: "medium" },
  ft_made:      { color: "#06b6d4", label: "FREE THROW",emoji: "✓",  importance: "low" },
  ft_missed:    { color: "#475569", label: "FT MISS",   emoji: "✗",  importance: "low" },
  shot_missed:  { color: "#334155", label: "MISS",      emoji: "↓",  importance: "low" },
  three_missed: { color: "#475569", label: "3PT MISS",  emoji: "↓",  importance: "low" },
  rebound:      { color: "#3b82f6", label: "REB",       emoji: "↩",  importance: "low" },
  steal:        { color: "#eab308", label: "STEAL",     emoji: "⚡", importance: "medium" },
  block:        { color: "#ef4444", label: "BLOCK",     emoji: "✋", importance: "medium" },
  foul:         { color: "#f43f5e", label: "FOUL",      emoji: "🚨", importance: "medium", shake: true },
  turnover:     { color: "#f97316", label: "TO",        emoji: "💨", importance: "low" },
  timeout:      { color: "#8b5cf6", label: "TIMEOUT",   emoji: "⏸",  importance: "low" },
  sub:          { color: "#64748b", label: "SUB",       emoji: "🔀", importance: "low" },
  jumpball:     { color: "#94a3b8", label: "TIP",       emoji: "⬆",  importance: "low" },
  other:        { color: "#334155", label: "",          emoji: "·",  importance: "low" },
};

// ── Enter animations per play type ───────────────────────────────────────────
type MotionProps = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
};

function getEnterAnim(type: PlayType): MotionProps {
  switch (type) {
    case "three_made":
      return {
        initial: { opacity: 0, y: -28, scale: 1.06 },
        animate: { opacity: 1, y: 0,   scale: 1 },
        transition: { type: "spring", stiffness: 380, damping: 20 },
      };
    case "dunk":
      return {
        initial: { opacity: 0, scale: 0.68, rotate: -6 },
        animate: { opacity: 1, scale: 1,    rotate: 0 },
        transition: { type: "spring", stiffness: 520, damping: 15 },
      };
    case "layup_made":
    case "two_made":
      return {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { type: "spring", stiffness: 360, damping: 25 },
      };
    case "ft_made":
      return {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.2, ease: "easeOut" },
      };
    case "ft_missed":
    case "shot_missed":
    case "three_missed":
      return {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, ease: "easeOut" },
      };
    case "rebound":
      return {
        initial: { opacity: 0, y: 16, scale: 0.93 },
        animate: { opacity: 1, y: 0,  scale: 1 },
        transition: { type: "spring", stiffness: 400, damping: 22 },
      };
    case "steal":
      return {
        initial: { opacity: 0, x: -36 },
        animate: { opacity: 1, x: 0 },
        transition: { type: "spring", stiffness: 550, damping: 20 },
      };
    case "block":
      return {
        initial: { opacity: 0, y: -18, scale: 1.08 },
        animate: { opacity: 1, y: 0,   scale: 1 },
        transition: { type: "spring", stiffness: 460, damping: 20 },
      };
    case "foul":
      return {
        initial: { opacity: 0, x: 0 },
        animate: { opacity: 1, x: [8, -6, 5, -3, 0] } as TargetAndTransition,
        transition: { duration: 0.38, times: [0, 0.25, 0.5, 0.75, 1] },
      };
    case "turnover":
      return {
        initial: { opacity: 0, x: 22 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.24, ease: "easeOut" },
      };
    case "timeout":
      return {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.3 },
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.18 },
      };
  }
}

// ── PlayCard ─────────────────────────────────────────────────────────────────
type AvatarState = "headshot" | "logo" | "emoji";

function PlayCard({
  play,
  home,
  away,
  homeColor,
  awayColor,
  isNewest,
  headshotSrc,
  onAvatarClick,
}: {
  play: ProcessedPlay;
  home: ESPNCompetitor;
  away: ESPNCompetitor;
  homeColor: string;
  awayColor: string;
  isNewest: boolean;
  headshotSrc: string | null;
  onAvatarClick?: () => void;
}) {
  const athlete = play.athletes?.[0]?.athlete;

  // Determine which team this athlete is on (for logo fallback)
  const athleteTeamId = athlete?.team?.id;
  const playTeamId = play.team?.id;
  const teamIdForSide = athleteTeamId || playTeamId;
  const side: "home" | "away" | null =
    teamIdForSide === home.team.id ? "home"
    : teamIdForSide === away.team.id ? "away"
    : null;
  const teamLogo = side === "home" ? home.team.logo : side === "away" ? away.team.logo : null;

  // 3-step fallback: headshot → team logo → emoji
  const [avatarState, setAvatarState] = useState<AvatarState>(
    headshotSrc ? "headshot" : teamLogo ? "logo" : "emoji"
  );

  const type = classifyPlay(play.text ?? "", play.scoringPlay);
  const cfg = CONFIGS[type];

  // Play-type color drives card styling (border, shimmer, badge)
  const accentColor = cfg.color;

  // Avatar circle border uses the player's team color (home or away)
  const athleteTeamAbbr = athlete?.team?.abbreviation;
  const circleColor = (athleteTeamAbbr ? getTeamColor(athleteTeamAbbr) : null)
    ?? accentColor;

  const isHigh   = cfg.importance === "high";
  const isMedium = cfg.importance === "medium";
  const isLow    = cfg.importance === "low";

  const cardBg = isHigh
    ? hexWithOpacity(accentColor, 0.09)
    : isMedium
      ? hexWithOpacity(accentColor, 0.05)
      : "rgba(255,255,255,0.02)";

  const cardBorder = isHigh
    ? hexWithOpacity(accentColor, 0.4)
    : isMedium
      ? hexWithOpacity(accentColor, 0.2)
      : "rgba(255,255,255,0.05)";

  const cardShadow = isHigh
    ? `0 0 28px ${hexWithOpacity(accentColor, 0.18)}, 0 2px 8px ${hexWithOpacity(accentColor, 0.08)}`
    : isMedium
      ? `0 0 12px ${hexWithOpacity(accentColor, 0.08)}`
      : "none";

  const anim = getEnterAnim(type);
  const periodLabel = ordinalPeriod(play.period?.number ?? 1);
  const clock = play.clock?.displayValue ?? "";
  const hasScore = play.homeScore !== undefined && play.awayScore !== undefined && play.scoringPlay;

  // Add team name after player name in play text
  let displayText = play.text ?? "";
  let playerName = athlete?.displayName;

  // Get team abbreviation with multiple fallbacks
  let teamAbbr: string | null = null;

  // First try: use play.team abbreviation directly (most reliable)
  if (play.team?.abbreviation) {
    teamAbbr = play.team.abbreviation;
  }
  // Second try: match play.team.id to home/away
  else if (play.team?.id) {
    teamAbbr = play.team.id === home.team.id
      ? home.team.abbreviation
      : play.team.id === away.team.id
        ? away.team.abbreviation
        : null;
  }
  // Third try: use athlete team data
  else if (athlete?.team?.abbreviation) {
    teamAbbr = athlete.team.abbreviation;
  }
  // Fourth try: match athlete.team.id to home/away
  else if (athlete?.team?.id) {
    teamAbbr = athlete.team.id === home.team.id
      ? home.team.abbreviation
      : athlete.team.id === away.team.id
        ? away.team.abbreviation
        : null;
  }
  // Last resort: use side variable to infer team
  else if (side) {
    teamAbbr = side === "home" ? home.team.abbreviation : away.team.abbreviation;
  }

  // Replace player name with "player (TEAM)" if we have both
  if (playerName && teamAbbr) {
    const nameParts = playerName.split(" ");
    const lastName = nameParts[nameParts.length - 1];
    const firstInitial = nameParts[0]?.[0];

    // Try different name patterns in order of specificity
    const namePatterns = [
      playerName, // Full name: "Raven Johnson"
      lastName, // Last name: "Johnson"
      ...(firstInitial ? [`${firstInitial}. ${lastName}`, `${firstInitial}.${lastName}`] : []), // Abbreviated: "R. Johnson" or "R.Johnson"
    ].filter((n): n is string => n && n.length > 0);

    let replaced = false;
    for (const pattern of namePatterns) {
      if (displayText.includes(pattern)) {
        displayText = displayText.replace(pattern, `${pattern} (${teamAbbr})`);
        replaced = true;
        break;
      }
    }

    // If still not found, try case-insensitive match for the last name at least
    if (!replaced && lastName) {
      const idx = displayText.toLowerCase().indexOf(lastName.toLowerCase());
      if (idx !== -1) {
        const original = displayText.substring(idx, idx + lastName.length);
        displayText = displayText.replace(original, `${original} (${teamAbbr})`);
      }
    }
  }

  return (
    <motion.div
      layout
      initial={anim.initial}
      animate={anim.animate}
      exit={{ opacity: 0, x: 12, scale: 0.96, transition: { duration: 0.15 } }}
      transition={anim.transition}
      className="relative flex gap-3 p-3 rounded-xl border overflow-hidden"
      style={{ background: cardBg, borderColor: cardBorder, boxShadow: cardShadow }}>

      {/* Team Logo Background */}
      {teamLogo && (
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `url(${teamLogo})`,
            backgroundSize: "120%",
            backgroundPosition: "right center",
            backgroundRepeat: "no-repeat",
            filter: "blur(1px)",
          }}
        />
      )}

      {/* Shimmer sweep (3PT + dunk only) */}
      {cfg.shimmer && (
        <motion.div
          initial={{ x: "-110%" }}
          animate={{ x: "110%" }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${hexWithOpacity(accentColor, 0.28)} 50%, transparent 100%)`,
            zIndex: 0,
          }}
        />
      )}

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: isLow ? "rgba(255,255,255,0.06)" : accentColor, opacity: isLow ? 1 : 0.7 }}
      />

      {/* "NEW" pulse dot for newest play */}
      {isNewest && !isLow && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full pulse-live"
          style={{ background: accentColor }}
        />
      )}

      {/* Avatar — photo + emoji badge + jersey. Becomes a button when the play
          maps to a box-score player so we can pop the same Today's Stats modal
          that the Box Score tab uses. */}
      <div className="relative z-10 shrink-0 flex flex-col items-center gap-0.5" style={{ width: 44 }}>
        <button
          type="button"
          onClick={onAvatarClick}
          disabled={!onAvatarClick}
          aria-label={onAvatarClick ? `Open today's stats for ${athlete?.displayName ?? "player"}` : undefined}
          className={`relative w-10 h-10 rounded-full p-0 border-0 bg-transparent ${
            onAvatarClick
              ? "cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              : "cursor-default"
          }`}>
          {/* Photo circle — border uses team color, bg uses play-type accent */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: hexWithOpacity(accentColor, isLow ? 0.07 : 0.14),
              border: `2px solid ${hexWithOpacity(circleColor, isLow ? 0.25 : 0.7)}`,
              boxShadow: isHigh ? `0 0 14px ${hexWithOpacity(circleColor, 0.4)}` : `0 0 6px ${hexWithOpacity(circleColor, 0.2)}`,
            }}>
            {avatarState === "headshot" && headshotSrc ? (
              <Image
                src={headshotSrc}
                alt={athlete?.displayName ?? "Player"}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                unoptimized
                onError={() => setAvatarState(teamLogo ? "logo" : "emoji")}
              />
            ) : avatarState === "logo" && teamLogo ? (
              <Image
                src={teamLogo}
                alt={side === "home" ? home.team.displayName : away.team.displayName}
                width={40}
                height={40}
                className="object-contain p-1.5 w-full h-full opacity-60"
                unoptimized
                onError={() => setAvatarState("emoji")}
              />
            ) : (
              <span className={`leading-none select-none ${isHigh ? "text-base" : "text-sm"}`}>
                {cfg.emoji}
              </span>
            )}
          </div>

          {/* Emoji badge — always shown, bottom-right corner */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] leading-none pointer-events-none"
            style={{
              background: hexWithOpacity(accentColor, 0.92),
              border: `1.5px solid ${hexWithOpacity(circleColor, 0.6)}`,
              boxShadow: `0 0 7px ${hexWithOpacity(accentColor, 0.55)}`,
            }}>
            {cfg.emoji}
          </div>
        </button>

        {/* Jersey number */}
        {athlete?.jersey && (
          <span
            className="text-[9px] font-bold tabular-nums leading-none"
            style={{ color: hexWithOpacity(accentColor, isLow ? 0.35 : 0.65) }}>
            #{athlete.jersey}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {/* Play text */}
          <p className="text-xs leading-snug"
            style={{ color: isHigh ? "rgba(255,255,255,0.9)" : isLow ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.7)" }}>
            <span style={{ fontWeight: isHigh ? 600 : isMedium ? 500 : 400 }}>
              {displayText}
            </span>
          </p>

          {/* Score badge (scoring plays only) */}
          {hasScore && (
            <motion.span
              key={`${play.homeScore}-${play.awayScore}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.12 }}
              className="shrink-0 text-xs font-extrabold tabular-nums px-2 py-0.5 rounded-lg"
              style={{
                background: hexWithOpacity(accentColor, 0.18),
                color: accentColor,
                border: `1px solid ${hexWithOpacity(accentColor, 0.35)}`,
                boxShadow: isHigh ? `0 0 10px ${hexWithOpacity(accentColor, 0.3)}` : "none",
                letterSpacing: "0.04em",
              }}>
              {play.awayScore}–{play.homeScore}
            </motion.span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5">
          {/* Play type badge */}
          {cfg.label && (
            <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{
                background: hexWithOpacity(accentColor, isLow ? 0.08 : 0.14),
                color: isLow ? "rgba(255,255,255,0.3)" : accentColor,
              }}>
              {cfg.label}
            </span>
          )}

          {/* Period */}
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.28)" }}>
            {periodLabel}
          </span>

          {/* Clock */}
          {clock && (
            <span className="text-[10px] font-mono text-white/20">{clock}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main feed ─────────────────────────────────────────────────────────────────
type ResolvedPlayer = { stats: ESPNPlayerStats; team: ESPNTeam; headshot: string };

interface PlayByPlayFeedProps {
  visiblePlays: ProcessedPlay[];
  bufferedCount: number;
  home: ESPNCompetitor;
  away: ESPNCompetitor;
  delaySeconds: number;
  playerById?: Record<string, ResolvedPlayer>;
  playerLookup?: Array<ResolvedPlayer & { name: string }>;
  onPlayerClick?: (stats: ESPNPlayerStats, team: ESPNTeam) => void;
}

export default function PlayByPlayFeed({
  visiblePlays,
  bufferedCount,
  home,
  away,
  delaySeconds,
  playerById,
  playerLookup,
  onPlayerClick,
}: PlayByPlayFeedProps) {
  const homeColor = getTeamColor(home.team.abbreviation) || "#a855f7";
  const awayColor = getTeamColor(away.team.abbreviation) || "#3b82f6";

  // Resolve each play to a box-score player (when possible). The resolver
  // returns headshot URL plus stats/team so the avatar click can pop the same
  // Today's Stats modal that Box Score uses. Resolution order:
  //   1. play.athletes[0].id matches a box-score athlete
  //   2. play.text contains a box-score player's display name
  //   3. otherwise undefined (PlayCard falls back to logo/emoji, no click)
  const resolvedByPlayId = useMemo(() => {
    const out: Record<string, ResolvedPlayer> = {};
    if (!playerById && !playerLookup) return out;
    visiblePlays.forEach((play) => {
      const athleteId = play.athletes?.[0]?.athlete?.id;
      if (athleteId && playerById?.[athleteId]) {
        out[play.id] = playerById[athleteId];
        return;
      }
      const text = play.text;
      if (text && playerLookup) {
        for (const p of playerLookup) {
          if (text.includes(p.name)) {
            out[play.id] = p;
            return;
          }
        }
      }
    });
    return out;
  }, [visiblePlays, playerById, playerLookup]);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedPlayType, setSelectedPlayType] = useState<PlayType | null>(null);

  // Extract unique players and play types from visiblePlays
  const { uniquePlayers, uniquePlayTypes, playersByTeam } = useMemo(() => {
    const players = new Map<string, { name: string; team: string; teamId: string }>();
    const playTypes = new Set<PlayType>();

    // First, use playerLookup if available (has complete team info)
    if (playerLookup && playerLookup.length > 0) {
      playerLookup.forEach((player) => {
        const teamName = player.team.shortDisplayName || player.team.displayName;
        const teamId = player.team.id;
        players.set(player.name, { name: player.name, team: teamName, teamId });
      });
    }

    // Then, also extract from plays for any players not in lookup
    visiblePlays.forEach((play) => {
      const playerName = play.athletes?.[0]?.athlete?.displayName ?? "Unknown";
      if (playerName && playerName !== "Unknown" && !players.has(playerName)) {
        const athleteTeamId = play.athletes?.[0]?.athlete?.team?.id;
        let teamName = "";
        let teamId = "";
        if (athleteTeamId === home.team.id) {
          teamName = home.team.shortDisplayName || home.team.displayName;
          teamId = home.team.id;
        } else if (athleteTeamId === away.team.id) {
          teamName = away.team.shortDisplayName || away.team.displayName;
          teamId = away.team.id;
        }

        if (teamName) {
          players.set(playerName, { name: playerName, team: teamName, teamId });
        }
      }

      playTypes.add(classifyPlay(play.text, play.scoringPlay));
    });

    // Group players by team and sort by last name
    const grouped = new Map<string, Array<{ name: string; team: string; teamId: string }>>();
    Array.from(players.values()).forEach((player) => {
      if (!grouped.has(player.team)) {
        grouped.set(player.team, []);
      }
      grouped.get(player.team)!.push(player);
    });

    // Sort players within each team by last name
    grouped.forEach((players) => {
      players.sort((a, b) => {
        const lastNameA = a.name.split(" ").pop() || a.name;
        const lastNameB = b.name.split(" ").pop() || b.name;
        return lastNameA.localeCompare(lastNameB);
      });
    });

    return {
      uniquePlayers: Array.from(players.values()),
      uniquePlayTypes: Array.from(playTypes).sort(),
      playersByTeam: grouped,
    };
  }, [visiblePlays, playerLookup, home, away]);

  // Filter plays based on selected player and play type
  const filtered = useMemo(() => {
    return visiblePlays.filter((play) => {
      // Filter by player
      if (selectedPlayer) {
        const playerName = play.athletes?.[0]?.athlete?.displayName ?? "";
        if (!playerName.includes(selectedPlayer) && !play.text?.includes(selectedPlayer)) {
          return false;
        }
      }

      // Filter by play type
      if (selectedPlayType) {
        const playType = classifyPlay(play.text, play.scoringPlay);
        if (playType !== selectedPlayType) {
          return false;
        }
      }

      return true;
    });
  }, [visiblePlays, selectedPlayer, selectedPlayType]);

  const reversed = [...filtered].reverse();

  return (
    <div className="flex flex-col gap-3">
      {/* Spoiler Veil buffer banner */}
      {bufferedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#f59e0b" }}>
          <Shield size={13} />
          <span>
            {bufferedCount} play{bufferedCount !== 1 ? "s" : ""} held by Spoiler Veil — {delaySeconds}s delay active
          </span>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Player Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Player</label>
          <select
            value={selectedPlayer ?? ""}
            onChange={(e) => setSelectedPlayer(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] border border-white/10 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30">
            <option value="">All Players</option>
            {Array.from(playersByTeam.entries()).map(([team, players]) => (
              <optgroup key={team} label={team}>
                {players.map((player) => (
                  <option key={player.name} value={player.name}>
                    {player.name} ({team})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {selectedPlayer && (
            <button
              onClick={() => setSelectedPlayer(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Clear filter">
              <X size={14} className="text-white/40" />
            </button>
          )}
        </div>

        {/* Play Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Play Type</label>
          <select
            value={selectedPlayType ?? ""}
            onChange={(e) => setSelectedPlayType((e.target.value as PlayType) || null)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] border border-white/10 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30">
            <option value="">All Play Types</option>
            {uniquePlayTypes.map((type) => (
              <option key={type} value={type}>
                {CONFIGS[type].label || type}
              </option>
            ))}
          </select>
          {selectedPlayType && (
            <button
              onClick={() => setSelectedPlayType(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Clear filter">
              <X size={14} className="text-white/40" />
            </button>
          )}
        </div>

        {/* Results count */}
        {(selectedPlayer || selectedPlayType) && (
          <div className="ml-auto flex items-center text-xs text-white/40">
            {reversed.length} play{reversed.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="relative flex flex-col gap-1.5 pb-6">
        {/* Team Logo Watermarks Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {/* Away team logo (left) */}
          {away.team.logo && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2"
              style={{
                backgroundImage: `url(${away.team.logo})`,
                backgroundSize: "200%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: "300px",
                height: "300px",
                filter: "blur(1px)",
                opacity: 0.12,
              }}
            />
          )}
          {/* Home team logo (right) */}
          {home.team.logo && (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2"
              style={{
                backgroundImage: `url(${home.team.logo})`,
                backgroundSize: "200%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: "300px",
                height: "300px",
                filter: "blur(1px)",
                opacity: 0.12,
              }}
            />
          )}
        </div>

        {/* Feed content */}
        <div className="relative z-10">
          <AnimatePresence initial={false}>
          {reversed.map((play, i) => {
            const resolved = resolvedByPlayId[play.id];
            return (
              <PlayCard
                key={play.id}
                play={play}
                home={home}
                away={away}
                homeColor={homeColor}
                awayColor={awayColor}
                isNewest={i === 0}
                headshotSrc={resolved?.headshot ?? null}
                onAvatarClick={
                  resolved && onPlayerClick
                    ? () => onPlayerClick(resolved.stats, resolved.team)
                    : undefined
                }
              />
            );
          })}
        </AnimatePresence>
        </div>
      </div>

      {visiblePlays.length === 0 && (
        <div className="text-center py-12 text-white/20 text-sm">
          {delaySeconds > 0
            ? "Plays will appear as your delayed stream catches up…"
            : "No plays yet — game hasn't started or data is loading."}
        </div>
      )}
    </div>
  );
}
