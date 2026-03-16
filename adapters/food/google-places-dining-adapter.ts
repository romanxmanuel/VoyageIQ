import { DiningSearchAdapter, DiningSearchResult } from "@/adapters/food/types";
import { searchGooglePlace } from "@/adapters/maps/google-places-text-search";
import { buildMapsSearchUrl } from "@/lib/travel-links";

export class GooglePlacesDiningAdapter implements DiningSearchAdapter {
  async searchDining({ scenario }: Parameters<DiningSearchAdapter["searchDining"]>[0]) {
    const results = await Promise.all(
      scenario.diningPlan.highlights.map(async (spot) => {
        const place = await searchGooglePlace(`${spot.name}, ${spot.address}`);

        return {
          itemId: spot.id,
          provider: place?.websiteUri ? "Official Website" : "Google Maps",
          kind: "restaurant" as const,
          label: place?.websiteUri ? "Open official website" : "Open in Google Maps",
          url: place?.websiteUri ?? place?.googleMapsUri ?? buildMapsSearchUrl(spot.name, spot.address),
          note: `${spot.cuisine} spot around ${spot.estimatedPerPerson} per person.`,
          direct: true
        } satisfies DiningSearchResult;
      })
    );

    return results;
  }
}
