import { PlannerInput, TripScenario } from "@/domain/trip/types";

export interface VerifiedPublicFare {
  provider: string;
  totalPrice: number;
  pricePerTraveler: number;
  url?: string;
}

export interface FlightFareVerifier {
  verifyBudgetFare(params: {
    input: PlannerInput;
    originIata: string;
    destinationIata: string;
    departDate: string;
    returnDate: string;
    scenario: TripScenario;
    compareUrl: string;
  }): Promise<VerifiedPublicFare | null>;
}
