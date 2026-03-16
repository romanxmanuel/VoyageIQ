import { philippinesDestinations, philippinesFeaturedDestination } from "@/domain/trip/data/philippines-destinations";
import { coreDestinations } from "@/domain/trip/data/core-destinations";
import { manilaDestination } from "@/domain/trip/data/philippines-manila";
import { sorsogonDestination } from "@/domain/trip/data/philippines-sorsogon";
import { nagaDestination } from "@/domain/trip/data/philippines-naga";
import { cebuDestination } from "@/domain/trip/data/philippines-cebu";
import { davaoDestination } from "@/domain/trip/data/philippines-davao";
import { DestinationMatch, DestinationSeed } from "@/domain/trip/types";
import { createGenericDestinationSeed } from "@/domain/trip/data/generic-destination";
import { resolveIataCode } from "@/domain/trip/data/iata-city-map";

const philippinesCityDestinations: DestinationSeed[] = [
  manilaDestination,
  sorsogonDestination,
  nagaDestination,
  cebuDestination,
  davaoDestination,
];

const DESTINATIONS: DestinationSeed[] = [
  ...philippinesDestinations,
  ...philippinesCityDestinations,
  ...coreDestinations,
];
const PHILIPPINES_DEFAULT = philippinesDestinations[0];

const normalize = (value: string) => value.toLowerCase().trim();

function scoreDestination(query: string, destination: DestinationSeed) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (destination.aliases.some((alias) => normalize(alias) === normalizedQuery)) {
    return 100;
  }

  const aliasPartial = destination.aliases.find(
    (alias) => normalize(alias).includes(normalizedQuery) || normalizedQuery.includes(normalize(alias))
  );

  if (aliasPartial) {
    return 70;
  }

  return normalizedQuery
    .split(/\s+/)
    .filter((token) => destination.aliases.some((alias) => normalize(alias).includes(token)))
    .length;
}

export function getFeaturedDestinations() {
  return [philippinesFeaturedDestination, ...coreDestinations.map((destination) => ({
    slug: destination.slug,
    name: destination.name,
    country: destination.country,
    summary: destination.summary,
    tourismUrl: destination.tourismUrl,
    airportCode: destination.airportCode
  }))];
}

export function getPhilippinesSpotlights() {
  return [...philippinesDestinations, ...philippinesCityDestinations].map((destination) => ({
    slug: destination.slug,
    name: destination.name,
    country: destination.country,
    summary: destination.summary,
    tourismUrl: destination.tourismUrl,
    airportCode: destination.airportCode
  }));
}

export function resolveDestination(query: string): DestinationMatch {
  const normalizedQuery = normalize(query);

  if (normalizedQuery === "philippines") {
    return {
      destination: PHILIPPINES_DEFAULT,
      originalQuery: query,
      normalizedQuery,
      matchedAlias: "philippines",
      isFallback: false,
      helperText:
        'Matched "Philippines" to Boracay as the default seeded island strategy. Use the Philippines spots dropdown to switch to El Nido, Bohol, or Siargao.',
      iataCode: PHILIPPINES_DEFAULT.airportCode,
      cityCode: PHILIPPINES_DEFAULT.cityCode ?? PHILIPPINES_DEFAULT.airportCode,
      coordinates: PHILIPPINES_DEFAULT.coordinates ?? { lat: 0, lng: 0 },
    };
  }

  const ranked = DESTINATIONS
    .map((destination) => ({
      destination,
      score: scoreDestination(normalizedQuery, destination)
    }))
    .sort((left, right) => right.score - left.score);

  const bestMatch = ranked[0]?.destination || DESTINATIONS[0];
  const matchedAlias =
    bestMatch.aliases.find((alias) => normalize(alias) === normalizedQuery) ||
    bestMatch.aliases.find(
      (alias) => normalize(alias).includes(normalizedQuery) || normalizedQuery.includes(normalize(alias))
    ) ||
    bestMatch.aliases[0];

  const isFallback = !normalizedQuery || ranked[0]?.score < 2;

  if (isFallback && normalizedQuery) {
    // Try to resolve via IATA map for unsupported cities
    const iataCode = resolveIataCode(normalizedQuery);
    if (iataCode) {
      const genericSeed = createGenericDestinationSeed(
        query, // use original casing
        "International",
        iataCode,
        { lat: 0, lng: 0 }
      );
      return {
        destination: genericSeed,
        originalQuery: query,
        normalizedQuery,
        matchedAlias: normalizedQuery,
        isFallback: false,
        helperText: `Planning your trip to ${query} with live flight prices via Aviasales.`,
        iataCode,
        cityCode: iataCode,
        coordinates: { lat: 0, lng: 0 },
      };
    }
  }

  return {
    destination: bestMatch,
    originalQuery: query,
    normalizedQuery,
    matchedAlias,
    isFallback,
    helperText: isFallback
      ? `Showing results for ${bestMatch.name} — type more specifically or choose from the Philippines quick-picks for an exact match.`
      : `Matched your search to ${bestMatch.name} using "${matchedAlias}".`,
    iataCode: bestMatch.airportCode,
    cityCode: bestMatch.cityCode ?? bestMatch.airportCode,
    coordinates: bestMatch.coordinates ?? { lat: 0, lng: 0 },
  };
}
