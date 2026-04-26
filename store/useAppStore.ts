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
  // IANA time zone (e.g. "America/New_York"). null = use the device default.
  timeZone: string | null;

  setSelectedGame: (id: string | null) => void;
  setDelay: (seconds: number) => void;
  setSyncDelta: (delta: number) => void;
  clearDelay: () => void;
  setFavoriteTeam: (teamId: string | null) => void;
  setNotifications: (enabled: boolean) => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  resetFontScale: () => void;
  setTimeZone: (zone: string | null) => void;
}

// Common WNBA-relevant time zones for the settings dropdown. The first entry
// (`null`) means "use whatever the device reports".
export const TIME_ZONES: Array<{ value: string | null; label: string; sublabel: string }> = [
  { value: null, label: "Device default", sublabel: "Use my device's time zone" },
  { value: "America/New_York", label: "Eastern", sublabel: "America/New_York" },
  { value: "America/Chicago", label: "Central", sublabel: "America/Chicago" },
  { value: "America/Denver", label: "Mountain", sublabel: "America/Denver" },
  { value: "America/Phoenix", label: "Arizona", sublabel: "America/Phoenix · no DST" },
  { value: "America/Los_Angeles", label: "Pacific", sublabel: "America/Los_Angeles" },
  { value: "America/Anchorage", label: "Alaska", sublabel: "America/Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii", sublabel: "Pacific/Honolulu" },
  { value: "America/Toronto", label: "Toronto", sublabel: "America/Toronto" },
  { value: "Europe/London", label: "London", sublabel: "Europe/London" },
  { value: "Europe/Paris", label: "Central Europe", sublabel: "Europe/Paris" },
  { value: "UTC", label: "UTC", sublabel: "Coordinated Universal Time" },
];

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
      timeZone: null,

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

      setTimeZone: (zone) => set({ timeZone: zone }),
    }),
    { name: "wnba-synccourt-v1" }
  )
);
