import { ActivitySearchAdapter, ActivitySearchResult } from "@/adapters/activities/types";
import { buildMapsSearchUrl } from "@/lib/travel-links";

export class OutboundLinkActivityAdapter implements ActivitySearchAdapter {
  async searchActivities({ scenario }: Parameters<ActivitySearchAdapter["searchActivities"]>[0]) {
    const results: ActivitySearchResult[] = scenario.activities.map((activity) => ({
      itemId: activity.id,
      provider: "Google Maps",
      kind: "activity",
      label: "Open activity in Google Maps",
      url: buildMapsSearchUrl(activity.name, activity.address),
      note: `${activity.durationHours} hours with an estimated ${activity.estimatedPerPerson} per person cost.`,
      direct: true
    }));

    return results;
  }
}
