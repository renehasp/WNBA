export interface TeamInfo {
  id: string;
  name: string;
  fullName: string;
  abbreviation: string;
  city: string;
  primary: string;
  secondary: string;
}

export const TEAMS: Record<string, TeamInfo> = {
  ATL: { id: "ATL", name: "Dream",      fullName: "Atlanta Dream",            abbreviation: "ATL", city: "Atlanta",       primary: "#C8102E", secondary: "#041E42" },
  CHI: { id: "CHI", name: "Sky",        fullName: "Chicago Sky",              abbreviation: "CHI", city: "Chicago",       primary: "#418FDE", secondary: "#E03A3E" },
  CON: { id: "CON", name: "Sun",        fullName: "Connecticut Sun",          abbreviation: "CON", city: "Connecticut",   primary: "#E03A3E", secondary: "#F68A24" },
  DAL: { id: "DAL", name: "Wings",      fullName: "Dallas Wings",             abbreviation: "DAL", city: "Dallas",        primary: "#C4D600", secondary: "#002B5C" },
  IND: { id: "IND", name: "Fever",      fullName: "Indiana Fever",            abbreviation: "IND", city: "Indiana",       primary: "#002D62", secondary: "#E03A3E" },
  LV:  { id: "LV",  name: "Aces",       fullName: "Las Vegas Aces",           abbreviation: "LV",  city: "Las Vegas",     primary: "#C9243F", secondary: "#000000" },
  LA:  { id: "LA",  name: "Sparks",     fullName: "Los Angeles Sparks",       abbreviation: "LA",  city: "Los Angeles",   primary: "#702F8A", secondary: "#FFC72C" },
  MIN: { id: "MIN", name: "Lynx",       fullName: "Minnesota Lynx",           abbreviation: "MIN", city: "Minnesota",     primary: "#046A38", secondary: "#78BE20" },
  NY:  { id: "NY",  name: "Liberty",    fullName: "New York Liberty",         abbreviation: "NY",  city: "New York",      primary: "#86CEBC", secondary: "#000000" },
  PHX: { id: "PHX", name: "Mercury",    fullName: "Phoenix Mercury",          abbreviation: "PHX", city: "Phoenix",       primary: "#E56020", secondary: "#201747" },
  SEA: { id: "SEA", name: "Storm",      fullName: "Seattle Storm",            abbreviation: "SEA", city: "Seattle",       primary: "#2C5234", secondary: "#FEE11A" },
  WSH: { id: "WSH", name: "Mystics",    fullName: "Washington Mystics",       abbreviation: "WSH", city: "Washington",    primary: "#E03A3E", secondary: "#002B5C" },
  GS:  { id: "GS",  name: "Valkyries",  fullName: "Golden State Valkyries",   abbreviation: "GS",  city: "Golden State",  primary: "#FFC72C", secondary: "#1D1160" },
  TOR: { id: "TOR", name: "Tempo",      fullName: "Toronto Tempo",            abbreviation: "TOR", city: "Toronto",       primary: "#CE1141", secondary: "#000000" },
};

export function getTeamInfo(abbreviation: string): TeamInfo | undefined {
  if (!abbreviation) return undefined;
  return TEAMS[abbreviation.toUpperCase()] ?? TEAMS[abbreviation];
}

export function getTeamColor(abbreviation: string): string {
  return getTeamInfo(abbreviation)?.primary ?? "#a855f7";
}

export function getTeamSecondary(abbreviation: string): string {
  return getTeamInfo(abbreviation)?.secondary ?? "#3b82f6";
}
