import type { ESPNPlay } from "./espn";
import { parseGameClock } from "./espn";

export interface ProcessedPlay extends ESPNPlay {
  gameTimeSecs: number;
}

// WNBA: 10-min quarters (600s), 5-min OT periods (300s)
const QUARTER_SECS = 600;
const OT_SECS = 300;

/**
 * Convert period + clock-string to total elapsed seconds from tip-off.
 * Clock is in MM:SS format, counting DOWN to 0:00.
 */
export function calculateGameTimeSecs(period: number, clockStr: string): number {
  if (!clockStr || !period) return 0;

  const { minutes, seconds } = parseGameClock(clockStr);
  const clockSecs = minutes * 60 + seconds;

  const isOT = period > 4;
  const periodLen = isOT ? OT_SECS : QUARTER_SECS;
  const elapsedInPeriod = Math.max(0, periodLen - clockSecs);

  if (!isOT) {
    return (period - 1) * QUARTER_SECS + elapsedInPeriod;
  } else {
    const otIndex = period - 5; // 0-based OT period index
    return 4 * QUARTER_SECS + otIndex * OT_SECS + elapsedInPeriod;
  }
}

/**
 * Reverse: convert total elapsed seconds → { period, clock }
 */
export function gameTimeSecsToDisplay(totalSecs: number): {
  period: number;
  clock: string;
  periodLabel: string;
} {
  if (totalSecs <= 0) {
    return { period: 1, clock: "10:00", periodLabel: "1st" };
  }

  const maxRegulation = 4 * QUARTER_SECS;

  if (totalSecs <= maxRegulation) {
    const period = Math.min(Math.ceil(totalSecs / QUARTER_SECS), 4);
    const elapsedInPeriod = totalSecs - (period - 1) * QUARTER_SECS;
    const remaining = QUARTER_SECS - elapsedInPeriod;
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    const labels = ["", "1st", "2nd", "3rd", "4th"];
    return {
      period,
      clock: `${min}:${sec.toString().padStart(2, "0")}`,
      periodLabel: labels[period] ?? `${period}th`,
    };
  } else {
    const otSecs = totalSecs - maxRegulation;
    const otIndex = Math.floor(otSecs / OT_SECS);
    const period = 5 + otIndex;
    const elapsedInOT = otSecs - otIndex * OT_SECS;
    const remaining = OT_SECS - elapsedInOT;
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    const otLabel = otIndex === 0 ? "OT" : `${otIndex + 1}OT`;
    return {
      period,
      clock: `${min}:${sec.toString().padStart(2, "0")}`,
      periodLabel: otLabel,
    };
  }
}

/**
 * Attach gameTimeSecs to each play from the ESPN plays array.
 */
export function processPlays(plays: ESPNPlay[]): ProcessedPlay[] {
  return plays.map((play) => ({
    ...play,
    gameTimeSecs: calculateGameTimeSecs(
      play.period?.number ?? 1,
      play.clock?.displayValue ?? "10:00"
    ),
  }));
}

/**
 * Filter plays to only those that should be visible given the current delay.
 * liveGameTimeSecs = elapsed seconds at the live edge right now.
 * delaySeconds = how many seconds behind live the user's view is.
 */
export function getVisiblePlays(
  processedPlays: ProcessedPlay[],
  liveGameTimeSecs: number,
  delaySeconds: number
): ProcessedPlay[] {
  const displayTimeSecs = liveGameTimeSecs - delaySeconds;
  return processedPlays.filter((p) => p.gameTimeSecs <= displayTimeSecs);
}

/**
 * Count how many plays are buffered (hidden due to delay).
 */
export function getBufferedCount(
  processedPlays: ProcessedPlay[],
  liveGameTimeSecs: number,
  delaySeconds: number
): number {
  if (delaySeconds <= 0) return 0;
  const visible = getVisiblePlays(processedPlays, liveGameTimeSecs, delaySeconds);
  return processedPlays.length - visible.length;
}

/**
 * Calculate the delay delta when the user syncs to their TV/stream clock.
 * Returns seconds of delay (0 if user is ahead of live, which shouldn't happen).
 */
export function calculateSyncDelta(
  livePeriod: number,
  liveClock: string,
  tvPeriod: number,
  tvClock: string
): number {
  const liveTimeSecs = calculateGameTimeSecs(livePeriod, liveClock);
  const tvTimeSecs = calculateGameTimeSecs(tvPeriod, tvClock);
  return Math.max(0, liveTimeSecs - tvTimeSecs);
}
