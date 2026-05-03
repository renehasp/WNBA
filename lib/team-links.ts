// Team history and information links
export const TEAM_LINKS: Record<string, { wnba: string; wikipedia: string; name: string }> = {
  "LA": {
    name: "Los Angeles Sparks",
    wnba: "https://www.wnba.com/team/los-angeles-sparks/",
    wikipedia: "https://en.wikipedia.org/wiki/Los_Angeles_Sparks",
  },
  "IND": {
    name: "Indiana Fever",
    wnba: "https://www.wnba.com/team/indiana-fever/",
    wikipedia: "https://en.wikipedia.org/wiki/Indiana_Fever",
  },
  "ATL": {
    name: "Atlanta Dream",
    wnba: "https://www.wnba.com/team/atlanta-dream/",
    wikipedia: "https://en.wikipedia.org/wiki/Atlanta_Dream",
  },
  "CHI": {
    name: "Chicago Sky",
    wnba: "https://www.wnba.com/team/chicago-sky/",
    wikipedia: "https://en.wikipedia.org/wiki/Chicago_Sky",
  },
  "CON": {
    name: "Connecticut Sun",
    wnba: "https://www.wnba.com/team/connecticut-sun/",
    wikipedia: "https://en.wikipedia.org/wiki/Connecticut_Sun",
  },
  "DAL": {
    name: "Dallas Wings",
    wnba: "https://www.wnba.com/team/dallas-wings/",
    wikipedia: "https://en.wikipedia.org/wiki/Dallas_Wings",
  },
  "DREAM": {
    name: "Atlanta Dream",
    wnba: "https://www.wnba.com/team/atlanta-dream/",
    wikipedia: "https://en.wikipedia.org/wiki/Atlanta_Dream",
  },
  "FEVER": {
    name: "Indiana Fever",
    wnba: "https://www.wnba.com/team/indiana-fever/",
    wikipedia: "https://en.wikipedia.org/wiki/Indiana_Fever",
  },
  "HOU": {
    name: "Houston Comets",
    wnba: "https://www.wnba.com/team/houston-comets/",
    wikipedia: "https://en.wikipedia.org/wiki/Houston_Comets",
  },
  "LA_SPARKS": {
    name: "Los Angeles Sparks",
    wnba: "https://www.wnba.com/team/los-angeles-sparks/",
    wikipedia: "https://en.wikipedia.org/wiki/Los_Angeles_Sparks",
  },
  "LV": {
    name: "Las Vegas Aces",
    wnba: "https://www.wnba.com/team/las-vegas-aces/",
    wikipedia: "https://en.wikipedia.org/wiki/Las_Vegas_Aces",
  },
  "MIN": {
    name: "Minnesota Lynx",
    wnba: "https://www.wnba.com/team/minnesota-lynx/",
    wikipedia: "https://en.wikipedia.org/wiki/Minnesota_Lynx",
  },
  "NY": {
    name: "New York Liberty",
    wnba: "https://www.wnba.com/team/new-york-liberty/",
    wikipedia: "https://en.wikipedia.org/wiki/New_York_Liberty",
  },
  "PHX": {
    name: "Phoenix Mercury",
    wnba: "https://www.wnba.com/team/phoenix-mercury/",
    wikipedia: "https://en.wikipedia.org/wiki/Phoenix_Mercury",
  },
  "SEA": {
    name: "Seattle Storm",
    wnba: "https://www.wnba.com/team/seattle-storm/",
    wikipedia: "https://en.wikipedia.org/wiki/Seattle_Storm",
  },
  "SPA": {
    name: "San Antonio Silver Stars",
    wnba: "https://www.wnba.com/team/san-antonio-silver-stars/",
    wikipedia: "https://en.wikipedia.org/wiki/San_Antonio_Silver_Stars",
  },
  "WAS": {
    name: "Washington Mystics",
    wnba: "https://www.wnba.com/team/washington-mystics/",
    wikipedia: "https://en.wikipedia.org/wiki/Washington_Mystics",
  },
};

export function getTeamLinks(abbreviation: string) {
  return TEAM_LINKS[abbreviation] || null;
}
