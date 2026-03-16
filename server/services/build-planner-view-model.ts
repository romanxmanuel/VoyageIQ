import { buildTripScenarios } from "@/domain/scenarios/build-trip-scenarios";
import { attachScenarioSimilarity, deriveTravelerProfile, deriveTripConstraints } from "@/domain/scenarios/scenario-similarity";
import { getFeaturedDestinations, getPhilippinesSpotlights, resolveDestination } from "@/domain/trip/destination-catalog";
import { PlannerInput, PlannerViewModel } from "@/domain/trip/types";
import { attachScenarioVerification } from "@/server/services/attach-scenario-verification";

export async function buildPlannerViewModel(input: PlannerInput): Promise<PlannerViewModel> {
  const match = resolveDestination(input.destinationQuery);
  const ruleBasedScenarios = buildTripScenarios(input, match);
  const scoredScenarios = attachScenarioSimilarity(ruleBasedScenarios, input);
  const scenarios = await attachScenarioVerification(scoredScenarios, input, match);
  const selectedScenarioIndex = scenarios.reduce((bestIndex, scenario, index, allScenarios) => {
    return scenario.ruleScore > allScenarios[bestIndex].ruleScore ? index : bestIndex;
  }, Math.min(1, scenarios.length - 1));

  return {
    constraints: deriveTripConstraints(input),
    travelerProfile: deriveTravelerProfile(input),
    input,
    match,
    scenarios,
    selectedScenarioIndex
  };
}

export function getPlannerLandingData() {
  return {
    featuredDestinations: getFeaturedDestinations(),
    philippinesSpotlights: getPhilippinesSpotlights()
  };
}
