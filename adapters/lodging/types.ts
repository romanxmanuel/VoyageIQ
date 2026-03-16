import { DestinationMatch, PlannerInput, ScenarioTier, TripScenario, VerificationLink } from "@/domain/trip/types";

export interface LiveHotelOffer {
  hotelId: string
  hotelName: string
  address: string
  stars: number
  checkIn: string
  checkOut: string
  roomType: string
  pricePerNight: number
  totalPrice: number
  deepLinkUrl: string
}

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
