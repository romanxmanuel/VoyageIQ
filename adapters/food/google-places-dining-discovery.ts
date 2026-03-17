import { searchGooglePlacesBatch, type GooglePlaceLookupResult } from "@/adapters/maps/google-places-text-search";
import { DestinationMatch, ScenarioTier } from "@/domain/trip/types";

interface DiscoverDiningOptions {
  match: DestinationMatch;
  stayNeighborhood?: string;
  tier?: ScenarioTier;
  travelers?: number;
  limit?: number;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getAffordabilityWeight(tier?: ScenarioTier) {
  if (tier === "signature") return 0.15;
  if (tier === "elevated") return 0.3;
  if (tier === "balanced") return 0.55;
  return 0.75;
}

function scoreDiningPlace(place: GooglePlaceLookupResult, tier?: ScenarioTier) {
  const affordabilityWeight = getAffordabilityWeight(tier);
  const ratingScore = (place.rating ?? 4) * 22;
  const reviewScore = Math.min(Math.log10((place.userRatingCount ?? 10) + 1) * 18, 30);
  const affordabilityScore =
    place.priceLevel === undefined
      ? 10
      : Math.max(0, (4 - place.priceLevel) * 8) * affordabilityWeight;
  const premiumAllowance =
    place.priceLevel === undefined
      ? 0
      : tier === "signature" || tier === "elevated"
        ? place.priceLevel * 4
        : 0;
  const categoryBoost = /restaurant|food|ramen|sushi|izakaya|cafe/i.test(place.category ?? "") ? 6 : 0;

  return ratingScore + reviewScore + affordabilityScore + premiumAllowance + categoryBoost;
}

function buildDiningQueries({ match, stayNeighborhood, tier, travelers }: DiscoverDiningOptions) {
  const destinationName = match.destination.name;
  const neighborhood = stayNeighborhood?.trim();
  const familyQuery = travelers && travelers >= 3 ? `${destinationName} family restaurants` : null;
  const budgetOrPremiumQuery =
    tier === "elevated" || tier === "signature"
      ? `${destinationName} fine dining`
      : `${destinationName} cheap eats`;

  return [
    neighborhood ? `${neighborhood}, ${destinationName} restaurants` : `${destinationName} restaurants`,
    `${destinationName} best restaurants`,
    `${destinationName} local food`,
    `${destinationName} food spots`,
    `${destinationName} popular cafes`,
    budgetOrPremiumQuery,
    familyQuery
  ].filter((query): query is string => Boolean(query));
}

export async function discoverGoogleDiningPlaces(options: DiscoverDiningOptions) {
  const queries = buildDiningQueries(options);
  const coordinates =
    options.match.coordinates.lat === 0 && options.match.coordinates.lng === 0
      ? undefined
      : options.match.coordinates;
  const batches = [
    await searchGooglePlacesBatch(queries, 8, {
      coordinates,
      radiusMeters: 35000
    })
  ];

  const seen = new Set<string>();
  const merged: GooglePlaceLookupResult[] = [];

  for (const batch of batches) {
    for (const place of batch) {
      const stableKey = normalize(`${place.name}-${place.address}`);

      if (seen.has(stableKey)) {
        continue;
      }

      seen.add(stableKey);
      merged.push(place);
    }
  }

  return merged
    .sort((left, right) => scoreDiningPlace(right, options.tier) - scoreDiningPlace(left, options.tier))
    .slice(0, options.limit ?? 14);
}
