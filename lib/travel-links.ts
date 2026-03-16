const ORIGIN_AIRPORT_CODES: Array<{ tokens: string[]; code: string }> = [
  { tokens: ["orlando", "mco"], code: "MCO" },
  { tokens: ["new york", "jfk", "lga", "ewr"], code: "JFK" },
  { tokens: ["miami", "mia"], code: "MIA" },
  { tokens: ["atlanta", "atl"], code: "ATL" },
  { tokens: ["chicago", "ord"], code: "ORD" },
  { tokens: ["los angeles", "lax"], code: "LAX" },
  { tokens: ["san francisco", "sfo"], code: "SFO" },
  { tokens: ["seattle", "sea"], code: "SEA" },
  { tokens: ["dallas", "dfw"], code: "DFW" }
];

function slugifyLocation(value: string) {
  return value
    .trim()
    .replace(/,/g, "")
    .replace(/\s+/g, "-");
}

export function guessAirportCode(origin: string) {
  const iataMatch = origin.match(/\b([A-Z]{3})\b/);

  if (iataMatch) {
    return iataMatch[1];
  }

  const normalizedOrigin = origin.toLowerCase();
  const matched = ORIGIN_AIRPORT_CODES.find((entry) => entry.tokens.some((token) => normalizedOrigin.includes(token)));

  return matched?.code ?? "";
}

export function buildFlightSearchUrl(origin: string, destinationAirportCode: string) {
  const originCode = guessAirportCode(origin);

  if (!originCode) {
    return "https://www.google.com/travel/flights";
  }

  return `https://www.kayak.com/flights/${originCode}-${destinationAirportCode}`;
}

export function buildGoogleFlightsUrl(origin: string, destinationAirportCode: string) {
  const originCode = guessAirportCode(origin);

  if (!originCode) {
    return "https://www.google.com/travel/flights";
  }

  return `https://www.google.com/travel/flights?hl=en#flt=${originCode}.${destinationAirportCode}`;
}

export function buildMapsSearchUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}

export function buildBookingSearchUrl(location: string, country: string) {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${location}, ${country}`)}`;
}

export function buildAirbnbSearchUrl(location: string, country: string) {
  return `https://www.airbnb.com/s/${slugifyLocation(`${location} ${country}`)}/homes`;
}

export function buildHostelworldSearchUrl(location: string, country: string) {
  return `https://www.hostelworld.com/st/hostels/${slugifyLocation(`${location} ${country}`)}`;
}

export function buildYouTubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
