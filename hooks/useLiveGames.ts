"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard } from "@/lib/espn";

export function useLiveGames() {
  return useQuery({
    queryKey: ["scoreboard"],
    queryFn: fetchScoreboard,
    refetchInterval: 8000,
    staleTime: 5000,
    retry: 2,
  });
}
