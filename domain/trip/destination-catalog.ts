import { philippinesDestinations, philippinesFeaturedDestination } from "@/domain/trip/data/philippines-destinations";
import { coreDestinations } from "@/domain/trip/data/core-destinations";
import { manilaDestination } from "@/domain/trip/data/philippines-manila";
import { sorsogonDestination } from "@/domain/trip/data/philippines-sorsogon";
import { nagaDestination } from "@/domain/trip/data/philippines-naga";
import { cebuDestination } from "@/domain/trip/data/philippines-cebu";
import { davaoDestination } from "@/domain/trip/data/philippines-davao";
import { DestinationMatch, DestinationSeed, DestinationSuggestion } from "@/domain/trip/types";
import { createGenericDestinationSeed } from "@/domain/trip/data/generic-destination";
import { resolveIataCodeFuzzy } from "@/domain/trip/data/iata-city-map";

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

  const aliasPrefix = destination.aliases.find((alias) => {
    const normalizedAlias = normalize(alias);
    return (
      normalizedAlias.startsWith(normalizedQuery) ||
      normalizedAlias.split(/\s+/).some((token) => token.startsWith(normalizedQuery))
    );
  });

  if (aliasPrefix) {
    return 70;
  }

  return normalizedQuery
    .split(/\s+/)
    .filter((token) =>
      destination.aliases.some((alias) => {
        const normalizedAlias = normalize(alias);
        return (
          normalizedAlias.startsWith(token) ||
          normalizedAlias.split(/\s+/).some((aliasToken) => aliasToken.startsWith(token))
        );
      })
    )
    .length;
}

function buildSeedSuggestion(destination: DestinationSeed): DestinationSuggestion {
  return {
    placeId: `seed:${destination.slug}`,
    description: `${destination.name}, ${destination.country}`,
    mainText: destination.name,
    secondaryText: destination.country,
    country: destination.country,
    iataCode: destination.airportCode ?? null,
    source: "seeded",
  };
}

export function getFeaturedDestinations() {
  return [
    philippinesFeaturedDestination,
    ...coreDestinations.map((destination) => ({
      slug: destination.slug,
      name: destination.name,
      country: destination.country,
      summary: destination.summary,
      tourismUrl: destination.tourismUrl,
      airportCode: destination.airportCode
    }))
  ];
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

export function searchDestinationSuggestions(query: string): DestinationSuggestion[] {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return getFeaturedDestinations().map((destination) => ({
      placeId: `seed:${destination.slug}`,
      description: `${destination.name}, ${destination.country}`,
      mainText: destination.name,
      secondaryText: destination.country,
      country: destination.country,
      iataCode: destination.airportCode ?? null,
      source: "seeded",
    }));
  }

  return DESTINATIONS.filter((destination) => scoreDestination(normalizedQuery, destination) >= 70)
    .sort((left, right) => scoreDestination(normalizedQuery, right) - scoreDestination(normalizedQuery, left))
    .slice(0, 6)
    .map(buildSeedSuggestion)
    .filter((candidate, index, all) => all.findIndex((item) => item.mainText === candidate.mainText) === index);
}

export function resolveDestination(
  query: string,
  overrides?: {
    airportCode?: string;
    country?: string;
    label?: string;
    source?: string;
    placeId?: string;
  }
): DestinationMatch {
  const normalizedQuery = normalize(query);
  const overrideAirportCode = overrides?.airportCode?.trim() || "";
  const overrideCountry = overrides?.country?.trim() || "";
  const overrideLabel = overrides?.label?.trim() || query;
  const overrideSource = overrides?.source?.trim() || "";
  const overridePlaceId = overrides?.placeId?.trim() || "";

  if (normalizedQuery === "philippines") {
    return {
      destination: PHILIPPINES_DEFAULT,
      originalQuery: query,
      normalizedQuery,
      matchedAlias: "philippines",
      isFallback: false,
      isVerified: true,
      isGeneric: false,
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
  const bestScore = ranked[0]?.score ?? 0;
  const matchedAlias =
    bestMatch.aliases.find((alias) => normalize(alias) === normalizedQuery) ||
    bestMatch.aliases.find((alias) => {
      const normalizedAlias = normalize(alias);
      return normalizedAlias.startsWith(normalizedQuery);
    }) ||
    bestMatch.aliases[0];

  if ((overrideSource === "google" && overridePlaceId && overrideLabel) || (!!overrideAirportCode && !!overrideLabel)) {
    const iataCode = overrideAirportCode || resolveIataCodeFuzzy(`${overrideLabel}, ${overrideCountry}`) || "";
    const genericSeed = createGenericDestinationSeed(
      overrideLabel || query,
      overrideCountry || "International",
      iataCode,
      { lat: 0, lng: 0 }
    );

    return {
      destination: genericSeed,
      originalQuery: query,
      normalizedQuery,
      matchedAlias: normalizedQuery,
      isFallback: false,
      isVerified: true,
      isGeneric: true,
      helperText: iataCode
        ? `Planning your trip to ${overrideLabel || query} using the verified place you selected, with ${iataCode} as the flight anchor.`
        : `Planning your trip to ${overrideLabel || query} using the verified place you selected.`,
      iataCode,
      cityCode: iataCode,
      coordinates: { lat: 0, lng: 0 },
    };
  }

  if (!normalizedQuery || bestScore < 2) {
    throw new Error("Choose a real place from the suggestion list so VoyageIQ can verify the destination.");
  }

  return {
    destination: bestMatch,
    originalQuery: query,
    normalizedQuery,
    matchedAlias,
    isFallback: false,
    isVerified: true,
    isGeneric: false,
    helperText: `Matched your search to ${bestMatch.name} using "${matchedAlias}".`,
    iataCode: bestMatch.airportCode,
    cityCode: bestMatch.cityCode ?? bestMatch.airportCode,
    coordinates: bestMatch.coordinates ?? { lat: 0, lng: 0 },
  };
}
