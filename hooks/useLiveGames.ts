"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard } from "@/lib/espn";

export function useLiveGames() {
  return useQuery({
    queryKey: ["scoreboard"],
    queryFn: fetchScoreboard,
    refetchInterval: 3000,
    staleTime: 2000,
    retry: 2,
  });
}
