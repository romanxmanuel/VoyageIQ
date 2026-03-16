import { DestinationMatch, PlannerInput, ScenarioTier, TripScenario, VerificationLink } from "@/domain/trip/types";

export interface LiveFlightOffer {
  id: string
  airline: string
  airlineCode: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  stops: number
  cabinClass: string
  pricePerTraveler: number
  totalPrice: number
  deepLinkUrl: string
}

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
