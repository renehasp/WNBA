"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SyncMode = "none" | "delay" | "synced";

interface AppState {
  selectedGameId: string | null;
  delaySeconds: number;
  syncMode: SyncMode;
  syncDelta: number;
  favoriteTeamId: string | null;
  notificationsEnabled: boolean;

  setSelectedGame: (id: string | null) => void;
  setDelay: (seconds: number) => void;
  setSyncDelta: (delta: number) => void;
  clearDelay: () => void;
  setFavoriteTeam: (teamId: string | null) => void;
  setNotifications: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedGameId: null,
      delaySeconds: 0,
      syncMode: "none",
      syncDelta: 0,
      favoriteTeamId: null,
      notificationsEnabled: false,

      setSelectedGame: (id) => set({ selectedGameId: id }),

      setDelay: (seconds) =>
        set({
          delaySeconds: Math.max(0, Math.min(300, seconds)),
          syncMode: seconds > 0 ? "delay" : "none",
          syncDelta: 0,
        }),

      setSyncDelta: (delta) =>
        set({
          syncDelta: delta,
          delaySeconds: delta,
          syncMode: delta > 0 ? "synced" : "none",
        }),

      clearDelay: () =>
        set({ delaySeconds: 0, syncMode: "none", syncDelta: 0 }),

      setFavoriteTeam: (teamId) => set({ favoriteTeamId: teamId }),

      setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    { name: "wnba-synccourt-v1" }
  )
);
