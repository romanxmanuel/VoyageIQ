import { discoverGoogleDiningPlaces } from "@/adapters/food/google-places-dining-discovery";
import { DiningSearchAdapter, DiningSearchResult } from "@/adapters/food/types";
import { GooglePlaceLookupResult, searchGooglePlace } from "@/adapters/maps/google-places-text-search";
import { buildMapsSearchUrl } from "@/lib/travel-links";

function buildPlaceNote(place: GooglePlaceLookupResult) {
  const rating =
    place.rating && place.userRatingCount
      ? `${place.rating.toFixed(1)} stars from ${place.userRatingCount.toLocaleString()} reviews`
      : null;
  const category = place.category ? place.category.replace(/_/g, " ") : null;
  const price = place.priceLevel !== undefined ? `${"$".repeat(Math.max(place.priceLevel, 1))}` : null;

  return [rating, category, price, place.address].filter(Boolean).join(" - ");
}

function toDiningResult(place: GooglePlaceLookupResult, itemId?: string) {
  return {
    itemId,
    provider: place.websiteUri ? "Official Website" : "Google Maps",
    kind: "restaurant" as const,
    title: place.name,
    address: place.address,
    label: place.websiteUri ? "Official site" : "Open in Maps",
    url: place.websiteUri ?? place.googleMapsUri ?? buildMapsSearchUrl(place.name, place.address),
    note: buildPlaceNote(place),
    direct: true,
    intent: place.websiteUri ? "exact-booking" : "exact-place"
  } satisfies DiningSearchResult;
}

function dedupeResults(results: DiningSearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = `${result.itemId ?? ""}|${result.url}|${result.label}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isDiningResult(place: DiningSearchResult | null): place is DiningSearchResult {
  return place !== null;
}

export class GooglePlacesDiningAdapter implements DiningSearchAdapter {
  async searchDining({ input, match, scenario, tier }: Parameters<DiningSearchAdapter["searchDining"]>[0]) {
    const highlightPlaces: Array<DiningSearchResult | null> = await Promise.all(
      scenario.diningPlan.highlights.map(async (spot) => {
        const place = await searchGooglePlace(`${spot.name}, ${spot.address}`);
        return place ? toDiningResult(place, spot.id) : null;
      })
    );

    const broaderPlaces = await discoverGoogleDiningPlaces({
      match,
      stayNeighborhood: scenario.stay.neighborhood,
      tier,
      travelers: input.travelers,
      limit: 18
    });

    const broaderResults = broaderPlaces.map((place) => toDiningResult(place));

    return dedupeResults([
      ...highlightPlaces.filter(isDiningResult),
      ...broaderResults
    ]);
  }
}
