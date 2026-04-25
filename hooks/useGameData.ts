"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchGameSummary } from "@/lib/espn";
import {
  processPlays,
  getVisiblePlays,
  getBufferedCount,
  calculateGameTimeSecs,
} from "@/lib/spoiler-engine";
import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";

export function useGameData(eventId: string, livePeriod = 1, liveClock = "10:00") {
  const delaySeconds = useAppStore((s) => s.delaySeconds);

  const query = useQuery({
    queryKey: ["summary", eventId],
    queryFn: () => fetchGameSummary(eventId),
    refetchInterval: 8000,
    staleTime: 5000,
    enabled: !!eventId,
    retry: 2,
  });

  const { allPlays, visiblePlays, bufferedCount, liveGameTimeSecs } = useMemo(() => {
    const plays = query.data?.plays ?? [];
    const processed = processPlays(plays);
    const liveTimeSecs = calculateGameTimeSecs(livePeriod, liveClock);
    const visible = getVisiblePlays(processed, liveTimeSecs, delaySeconds);
    const buffered = getBufferedCount(processed, liveTimeSecs, delaySeconds);
    return { allPlays: processed, visiblePlays: visible, bufferedCount: buffered, liveGameTimeSecs: liveTimeSecs };
  }, [query.data, delaySeconds, livePeriod, liveClock]);

  return {
    ...query,
    allPlays,
    visiblePlays,
    bufferedCount,
    liveGameTimeSecs,
    boxscore: query.data?.boxscore,
    gameInfo: query.data?.gameInfo,
  };
}
