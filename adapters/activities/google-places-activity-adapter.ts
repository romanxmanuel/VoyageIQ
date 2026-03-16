import { ActivitySearchAdapter, ActivitySearchResult } from "@/adapters/activities/types";
import { searchGooglePlace } from "@/adapters/maps/google-places-text-search";
import { buildMapsSearchUrl } from "@/lib/travel-links";

export class GooglePlacesActivityAdapter implements ActivitySearchAdapter {
  async searchActivities({ scenario }: Parameters<ActivitySearchAdapter["searchActivities"]>[0]) {
    const results = await Promise.all(
      scenario.activities.map(async (activity) => {
        const place = await searchGooglePlace(`${activity.name}, ${activity.address}`);

        return {
          itemId: activity.id,
          provider: place?.websiteUri ? "Official Website" : "Google Maps",
          kind: "activity" as const,
          label: place?.websiteUri ? "Open official website" : "Open activity in Google Maps",
          url: place?.websiteUri ?? place?.googleMapsUri ?? buildMapsSearchUrl(activity.name, activity.address),
          note: `${activity.durationHours} hours with an estimated ${activity.estimatedPerPerson} per person cost.`,
          direct: true
        } satisfies ActivitySearchResult;
      })
    );

    return results;
  }
}
