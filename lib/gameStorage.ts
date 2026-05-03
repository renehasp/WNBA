import type { ESPNEvent } from "@/lib/espn";

const GAMES_STORAGE_KEY = "wnba-games-history";
const DAYS_TO_KEEP = 10;

interface StoredGame {
  event: ESPNEvent;
  storedAt: number;
}

function getDayAgo(days: number): number {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.getTime();
}

export function saveGames(events: ESPNEvent[]): void {
  try {
    const stored = getStoredGames();
    const eventIds = new Set(events.map((e) => e.id));

    // Keep existing games that aren't in the new fetch
    const retained = stored.filter((g) => !eventIds.has(g.event.id));

    // Add new games
    const updated = [
      ...retained,
      ...events.map((event) => ({ event, storedAt: Date.now() })),
    ];

    // Remove games older than DAYS_TO_KEEP
    const cutoffTime = getDayAgo(DAYS_TO_KEEP);
    const cleaned = updated.filter((g) => {
      const eventDate = new Date(g.event.date).getTime();
      return eventDate > cutoffTime;
    });

    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.error("Failed to save games to localStorage:", err);
  }
}

export function getStoredGames(): StoredGame[] {
  try {
    const stored = localStorage.getItem(GAMES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (err) {
    console.error("Failed to read games from localStorage:", err);
    return [];
  }
}

export function mergeGameData(
  fetchedEvents: ESPNEvent[],
): ESPNEvent[] {
  const stored = getStoredGames();
  const fetchedIds = new Set(fetchedEvents.map((e) => e.id));

  // Get stored games that aren't in the current fetch
  const storedEvents = stored
    .filter((g) => !fetchedIds.has(g.event.id))
    .map((g) => g.event);

  // Combine and deduplicate
  const all = [...fetchedEvents, ...storedEvents];
  const seen = new Set<string>();
  return all.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}
