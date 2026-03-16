import { DiningSearchAdapter, DiningSearchResult } from "@/adapters/food/types";
import { buildMapsSearchUrl } from "@/lib/travel-links";

export class OutboundLinkDiningAdapter implements DiningSearchAdapter {
  async searchDining({ scenario }: Parameters<DiningSearchAdapter["searchDining"]>[0]) {
    const results: DiningSearchResult[] = scenario.diningPlan.highlights.map((spot) => ({
      itemId: spot.id,
      provider: "Google Maps",
      kind: "restaurant",
      label: "Open in Google Maps",
      url: buildMapsSearchUrl(spot.name, spot.address),
      note: `${spot.cuisine} spot around ${spot.estimatedPerPerson} per person.`,
      direct: true
    }));

    return results;
  }
}
