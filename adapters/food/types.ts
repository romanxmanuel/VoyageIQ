import { DestinationMatch, PlannerInput, ScenarioTier, TripScenario, VerificationLink } from "@/domain/trip/types";

export interface DiningSearchResult extends VerificationLink {
  kind: "restaurant";
}

export interface DiningSearchAdapter {
  searchDining(params: {
    input: PlannerInput;
    match: DestinationMatch;
    scenario: TripScenario;
    tier: ScenarioTier;
  }): Promise<DiningSearchResult[]>;
}
