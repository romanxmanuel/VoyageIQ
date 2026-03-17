import { DestinationMatch, PlannerInput, ScenarioTier, TripScenario } from "@/domain/trip/types";
import { getProviderRegistry } from "@/server/services/provider-registry";

function getIntentRank(intent?: string) {
  if (intent === "exact-booking") return 0;
  if (intent === "exact-place") return 1;
  return 2;
}

export async function attachScenarioVerification(scenarios: TripScenario[], input: PlannerInput, match: DestinationMatch) {
  const providers = getProviderRegistry();
  const enrichedScenarios = await Promise.all(
    scenarios.map(async (scenario) => {
      const params = {
        input,
        match,
        scenario,
        tier: scenario.tier as ScenarioTier
      };

      const [flights, lodging, dining, activities] = await Promise.all([
        providers.flights.searchFlights(params),
        providers.lodging.searchLodging(params),
        providers.dining.searchDining(params),
        providers.activities.searchActivities(params)
      ]);

      const sortedFlights = [...flights].sort((left, right) => getIntentRank(left.intent) - getIntentRank(right.intent));
      const sortedLodging = [...lodging].sort((left, right) => getIntentRank(left.intent) - getIntentRank(right.intent));
      const sortedDining = [...dining].sort((left, right) => getIntentRank(left.intent) - getIntentRank(right.intent));
      const sortedActivities = [...activities].sort((left, right) => getIntentRank(left.intent) - getIntentRank(right.intent));

      const diningById = new Map(sortedDining.filter((link) => link.itemId).map((link) => [link.itemId, link]));
      const activitiesById = new Map(sortedActivities.filter((link) => link.itemId).map((link) => [link.itemId, link]));

      return {
        ...scenario,
        diningPlan: {
          ...scenario.diningPlan,
          highlights: scenario.diningPlan.highlights.map((spot) => ({
            ...spot,
            verificationLink: spot.id ? diningById.get(spot.id) : undefined
          }))
        },
        activities: scenario.activities.map((activity) => ({
          ...activity,
          verificationLink: activity.id ? activitiesById.get(activity.id) : undefined
        })),
        verification: {
          flights: sortedFlights,
          lodging: sortedLodging,
          dining: sortedDining,
          activities: sortedActivities,
          destinationGuide: match.destination.tourismUrl
            ? {
                provider: "Official Tourism",
                kind: "guide" as const,
                label: `Open ${match.destination.name} tourism guide`,
                url: match.destination.tourismUrl,
                note: "Official destination overview and travel inspiration.",
                intent: "exact-place" as const
              }
            : undefined
        }
      };
    })
  );

  return enrichedScenarios;
}
