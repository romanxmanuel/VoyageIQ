import { discoverGoogleDiningPlaces } from "@/adapters/food/google-places-dining-discovery";
import { searchGooglePlaces } from "@/adapters/maps/google-places-text-search";
import { DestinationSeed, ScenarioTier } from "@/domain/trip/types";

const ACTIVITY_COSTS = [0, 18, 28, 42, 65, 95];
const ACTIVITY_DURATIONS = [1.5, 2, 2.5, 3, 4, 5];

function buildTierFits(index: number): ScenarioTier[] {
  if (index < 2) return ["lean", "balanced", "elevated", "signature"];
  if (index < 4) return ["balanced", "elevated", "signature"];
  return ["elevated", "signature"];
}

export async function hydrateGenericDestinationSeed(seed: DestinationSeed) {
  const [hotels, restaurants, activities] = await Promise.all([
    searchGooglePlaces(`${seed.name} hotel`, 4, {
      coordinates: seed.coordinates,
      radiusMeters: 30000
    }),
    discoverGoogleDiningPlaces({
      match: {
        destination: seed,
        originalQuery: seed.name,
        normalizedQuery: seed.slug,
        matchedAlias: seed.name,
        isFallback: false,
        isVerified: true,
        isGeneric: true,
        helperText: `Verified place for ${seed.name}`,
        iataCode: seed.airportCode,
        cityCode: seed.cityCode ?? seed.airportCode,
        coordinates: seed.coordinates ?? { lat: 0, lng: 0 }
      },
      stayNeighborhood: seed.regionLabel,
      limit: 20
    }),
    searchGooglePlaces(`${seed.name} tourist attractions`, 6, {
      coordinates: seed.coordinates,
      radiusMeters: 35000
    })
  ]);

  const nextSeed: DestinationSeed = {
    ...seed,
    stays: { ...seed.stays },
    dining: seed.dining,
    activities: seed.activities
  };

  const tiers: ScenarioTier[] = ["lean", "balanced", "elevated", "signature"];

  hotels.slice(0, 4).forEach((hotel, index) => {
    const tier = tiers[index];
    const fallback = nextSeed.stays[tier];
    nextSeed.stays[tier] = {
      ...fallback,
      name: hotel.name,
      address: hotel.address,
      neighborhood: hotel.address.split(",")[0] ?? fallback.neighborhood
    };
  });

  if (restaurants.length) {
    nextSeed.dining = restaurants.map((restaurant, index) => ({
      id: `google-dining-${seed.slug}-${index + 1}`,
      name: restaurant.name,
      cuisine: restaurant.category ?? "Local dining",
      address: restaurant.address,
      estimatedPerPerson: ACTIVITY_COSTS[Math.min(index + 1, ACTIVITY_COSTS.length - 1)] ?? 28,
      signatureOrder:
        restaurant.rating && restaurant.userRatingCount
          ? `${restaurant.rating.toFixed(1)} stars from ${restaurant.userRatingCount.toLocaleString()} Google reviews.`
          : "Use photos and reviews to pick what fits your mood that day.",
      fit: buildTierFits(index)
    }));
  }

  if (activities.length) {
    nextSeed.activities = activities.map((activity, index) => ({
      id: `google-activity-${seed.slug}-${index + 1}`,
      name: activity.name,
      address: activity.address,
      estimatedPerPerson: ACTIVITY_COSTS[Math.min(index, ACTIVITY_COSTS.length - 1)] ?? 28,
      durationHours: ACTIVITY_DURATIONS[Math.min(index, ACTIVITY_DURATIONS.length - 1)] ?? 2,
      travelMinutesFromCenter: 18 + index * 4,
      summary: `Real place pulled for ${seed.name}. Open it, check reviews, and decide if it fits your trip style.`,
      fit: buildTierFits(index)
    }));
  }

  return nextSeed;
}
