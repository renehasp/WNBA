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
  // Multiplier on the root html font-size (1.0 = 100%). Persisted so the
  // setting carries across navigations and reloads.
  fontScale: number;

  setSelectedGame: (id: string | null) => void;
  setDelay: (seconds: number) => void;
  setSyncDelta: (delta: number) => void;
  clearDelay: () => void;
  setFavoriteTeam: (teamId: string | null) => void;
  setNotifications: (enabled: boolean) => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  resetFontScale: () => void;
}

export const FONT_SCALE_MIN = 0.85;
export const FONT_SCALE_MAX = 1.5;
export const FONT_SCALE_STEP = 0.1;
const clampScale = (v: number) =>
  Math.round(Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, v)) * 100) / 100;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedGameId: null,
      delaySeconds: 0,
      syncMode: "none",
      syncDelta: 0,
      favoriteTeamId: null,
      notificationsEnabled: false,
      fontScale: 1,

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

      increaseFontScale: () =>
        set((s) => ({ fontScale: clampScale(s.fontScale + FONT_SCALE_STEP) })),
      decreaseFontScale: () =>
        set((s) => ({ fontScale: clampScale(s.fontScale - FONT_SCALE_STEP) })),
      resetFontScale: () => set({ fontScale: 1 }),
    }),
    { name: "wnba-synccourt-v1" }
  )
);
