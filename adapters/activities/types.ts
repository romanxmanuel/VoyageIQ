import { DestinationMatch, PlannerInput, ScenarioTier, TripScenario, VerificationLink } from "@/domain/trip/types";

export interface ActivitySearchResult extends VerificationLink {
  kind: "activity";
}

export interface ActivitySearchAdapter {
  searchActivities(params: {
    input: PlannerInput;
    match: DestinationMatch;
    scenario: TripScenario;
    tier: ScenarioTier;
  }): Promise<ActivitySearchResult[]>;
}
