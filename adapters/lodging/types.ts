import { DestinationMatch, PlannerInput, ScenarioTier, TripScenario, VerificationLink } from "@/domain/trip/types";

export interface LodgingSearchResult extends VerificationLink {
  kind: "hotel" | "airbnb" | "hostel";
}

export interface LodgingSearchAdapter {
  searchLodging(params: {
    input: PlannerInput;
    match: DestinationMatch;
    scenario: TripScenario;
    tier: ScenarioTier;
  }): Promise<LodgingSearchResult[]>;
}
