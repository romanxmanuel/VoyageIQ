import { DiningSearchAdapter, DiningSearchResult } from "@/adapters/food/types";
import { buildMapsSearchUrl } from "@/lib/travel-links";

export class OutboundLinkDiningAdapter implements DiningSearchAdapter {
  async searchDining({ scenario }: Parameters<DiningSearchAdapter["searchDining"]>[0]) {
    const results: DiningSearchResult[] = scenario.diningPlan.highlights.map((spot) => ({
      itemId: spot.id,
      provider: "Google Maps",
      kind: "restaurant",
      title: spot.name,
      address: spot.address,
      label: "Open in Maps",
      url: buildMapsSearchUrl(spot.name, spot.address),
      note: `${spot.cuisine} spot around ${spot.estimatedPerPerson} per person.`,
      direct: true,
      intent: "exact-place"
    }));

    return results;
  }
}
