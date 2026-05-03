// WNBA team founding years - comprehensive mapping with multiple key variations
export const TEAM_FOUNDED: Record<string, number> = {
  // Standard abbreviations
  "ATL": 2008,
  "CHI": 2006,
  "CON": 1999,
  "DAL": 1998,
  "IND": 2002,
  "LA": 1997,
  "LV": 1997,
  "MIN": 1999,
  "NY": 1997,
  "PHX": 1997,
  "SEA": 2000,
  "WAS": 1998,

  // Alternative abbreviations
  "DREAM": 2008,
  "SKY": 2006,
  "SUN": 1999,
  "WINGS": 1998,
  "FEVER": 2002,
  "SPARKS": 1997,
  "ACES": 1997,
  "LYNX": 1999,
  "LIBERTY": 1997,
  "MERCURY": 1997,
  "STORM": 2000,
  "MYSTICS": 1998,

  // Full team names
  "Atlanta Dream": 2008,
  "Chicago Sky": 2006,
  "Connecticut Sun": 1999,
  "Dallas Wings": 1998,
  "Indiana Fever": 2002,
  "Los Angeles Sparks": 1997,
  "Las Vegas Aces": 1997,
  "Minnesota Lynx": 1999,
  "New York Liberty": 1997,
  "Phoenix Mercury": 1997,
  "Seattle Storm": 2000,
  "Washington Mystics": 1998,

  // Short display names
  "Dream": 2008,
  "Sky": 2006,
  "Sun": 1999,
  "Wings": 1998,
  "Fever": 2002,
  "Sparks": 1997,
  "Aces": 1997,
  "Lynx": 1999,
  "Liberty": 1997,
  "Mercury": 1997,
  "Storm": 2000,
  "Mystics": 1998,
};

export function getTeamFoundedYear(abbreviation: string | undefined, displayName?: string): number | null {
  if (!abbreviation && !displayName) return null;

  // Try direct abbreviation first
  if (abbreviation && TEAM_FOUNDED[abbreviation]) {
    return TEAM_FOUNDED[abbreviation];
  }

  // Try display name
  if (displayName && TEAM_FOUNDED[displayName]) {
    return TEAM_FOUNDED[displayName];
  }

  // Try uppercase abbreviation
  if (abbreviation) {
    const upper = abbreviation.toUpperCase();
    if (TEAM_FOUNDED[upper]) {
      return TEAM_FOUNDED[upper];
    }
  }

  // Try extracting team name from display name (e.g., "Atlanta Dream" -> "Dream")
  if (displayName) {
    const parts = displayName.split(" ");
    const lastName = parts[parts.length - 1];
    if (TEAM_FOUNDED[lastName]) {
      return TEAM_FOUNDED[lastName];
    }
  }

  return null;
}
