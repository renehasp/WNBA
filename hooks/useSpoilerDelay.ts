"use client";
import { useAppStore } from "@/store/useAppStore";
import {
  calculateGameTimeSecs,
  gameTimeSecsToDisplay,
  calculateSyncDelta,
} from "@/lib/spoiler-engine";

export function useSpoilerDelay(liveStatus?: { period: number; clock: string }) {
  const { delaySeconds, syncMode, setDelay, setSyncDelta, clearDelay } = useAppStore();

  const liveTimeSecs = liveStatus
    ? calculateGameTimeSecs(liveStatus.period, liveStatus.clock)
    : 0;

  const yourViewSecs = liveTimeSecs - delaySeconds;
  const yourView =
    delaySeconds > 0 && liveStatus
      ? gameTimeSecsToDisplay(Math.max(0, yourViewSecs))
      : null;

  const syncToTV = (tvPeriod: number, tvClock: string) => {
    if (!liveStatus) return 0;
    const delta = calculateSyncDelta(
      liveStatus.period,
      liveStatus.clock,
      tvPeriod,
      tvClock
    );
    setSyncDelta(delta);
    return delta;
  };

  const delayPresets = [
    { label: "Off", value: 0 },
    { label: "15s", value: 15 },
    { label: "30s", value: 30 },
    { label: "60s", value: 60 },
    { label: "90s", value: 90 },
    { label: "TV", value: 120 },
  ];

  return {
    delaySeconds,
    syncMode,
    yourView,
    liveTimeSecs,
    setDelay,
    syncToTV,
    clearDelay,
    delayPresets,
  };
}
