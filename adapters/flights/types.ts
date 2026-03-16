import { DestinationMatch, PlannerInput, ScenarioTier, TripScenario, VerificationLink } from "@/domain/trip/types";

export interface FlightSearchResult extends VerificationLink {
  kind: "flight";
}

export interface FlightSearchAdapter {
  searchFlights(params: {
    input: PlannerInput;
    match: DestinationMatch;
    scenario: TripScenario;
    tier: ScenarioTier;
  }): Promise<FlightSearchResult[]>;
}
