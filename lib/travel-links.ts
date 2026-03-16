import { resolveIataCode } from "@/domain/trip/data/iata-city-map";

const ORIGIN_AIRPORT_CODES: Array<{ tokens: string[]; code: string }> = [
  { tokens: ["orlando", "mco"], code: "MCO" },
  { tokens: ["new york", "jfk", "lga", "ewr"], code: "JFK" },
  { tokens: ["miami", "mia"], code: "MIA" },
  { tokens: ["atlanta", "atl"], code: "ATL" },
  { tokens: ["chicago", "ord"], code: "ORD" },
  { tokens: ["los angeles", "lax"], code: "LAX" },
  { tokens: ["san francisco", "sfo"], code: "SFO" },
  { tokens: ["seattle", "sea"], code: "SEA" },
  { tokens: ["dallas", "dfw"], code: "DFW" },
  { tokens: ["boston", "bos"], code: "BOS" },
  { tokens: ["houston", "iah", "hobby"], code: "IAH" },
  { tokens: ["phoenix", "phx"], code: "PHX" },
  { tokens: ["denver", "den"], code: "DEN" },
  { tokens: ["las vegas", "las"], code: "LAS" },
  { tokens: ["minneapolis", "msp"], code: "MSP" },
  { tokens: ["detroit", "dtw"], code: "DTW" },
  { tokens: ["philadelphia", "phl"], code: "PHL" },
  { tokens: ["washington", "iad", "dca", "bwi"], code: "IAD" },
];

function slugifyLocation(value: string) {
  return value.trim().replace(/,/g, "").replace(/\s+/g, "-");
}

export function guessAirportCode(origin: string): string {
  const iataMatch = origin.match(/\b([A-Z]{3})\b/);
  if (iataMatch) return iataMatch[1];
  const normalized = origin.toLowerCase();
  const matched = ORIGIN_AIRPORT_CODES.find((e) =>
    e.tokens.some((t) => normalized.includes(t))
  );
  if (matched) return matched.code;
  return resolveIataCode(origin) ?? "";
}

export function buildFlightSearchUrl(
  origin: string,
  destinationCode: string,
  departDate?: string,
  returnDate?: string,
  adults?: number
): string {
  const originCode = guessAirportCode(origin);
  if (!originCode) return "https://www.google.com/travel/flights";
  const adultsSuffix = adults && adults > 1 ? `/${adults}adults` : "";
  if (departDate && returnDate) {
    return `https://www.kayak.com/flights/${originCode}-${destinationCode}/${departDate}/${returnDate}${adultsSuffix}`;
  }
  return `https://www.kayak.com/flights/${originCode}-${destinationCode}${adultsSuffix}`;
}

export function buildGoogleFlightsUrl(
  origin: string,
  destinationCode: string,
  departDate?: string,
  returnDate?: string
): string {
  const originCode = guessAirportCode(origin);
  if (!originCode) return "https://www.google.com/travel/flights";
  const base = `https://www.google.com/travel/flights?hl=en#flt=${originCode}.${destinationCode}`;
  if (departDate && returnDate) {
    return `${base}.${departDate}*${destinationCode}.${originCode}.${returnDate}`;
  }
  return base;
}

export function buildBookingSearchUrl(
  location: string,
  country: string,
  checkin?: string,
  checkout?: string,
  adults?: number
): string {
  const params = new URLSearchParams({ ss: `${location}, ${country}` });
  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);
  if (adults) {
    params.set("group_adults", String(adults));
    params.set("no_rooms", "1");
  }
  return `https://www.booking.com/searchresults.html?${params}`;
}

export function buildAirbnbSearchUrl(
  location: string,
  country: string,
  checkin?: string,
  checkout?: string,
  adults?: number
): string {
  const slug = slugifyLocation(`${location} ${country}`);
  const params = new URLSearchParams();
  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);
  if (adults) params.set("adults", String(adults));
  const q = params.toString();
  return `https://www.airbnb.com/s/${slug}/homes${q ? "?" + q : ""}`;
}

export function buildHostelworldSearchUrl(location: string, country: string): string {
  return `https://www.hostelworld.com/st/hostels/${slugifyLocation(`${location} ${country}`)}`;
}

export function buildMapsSearchUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}

export function buildYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function buildTripAdvisorSearchUrl(query: string): string {
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`;
}

export function buildViatorSearchUrl(query: string): string {
  return `https://www.viator.com/searchResults/all?text=${encodeURIComponent(query)}`;
}
