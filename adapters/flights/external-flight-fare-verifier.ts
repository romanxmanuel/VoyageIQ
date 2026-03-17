import { FlightFareVerifier, VerifiedPublicFare } from "@/adapters/flights/fare-verifier";

export class ExternalFlightFareVerifier implements FlightFareVerifier {
  constructor(private readonly endpoint: string) {}

  async verifyBudgetFare(params: Parameters<FlightFareVerifier["verifyBudgetFare"]>[0]) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        originIata: params.originIata,
        destinationIata: params.destinationIata,
        departDate: params.departDate,
        returnDate: params.returnDate,
        travelers: params.input.travelers,
        compareUrl: params.compareUrl,
        scenarioId: params.scenario.id
      }),
      cache: "no-store"
    }).catch(() => null);

    if (!response?.ok) {
      return null;
    }

    const payload = (await response.json()) as Partial<VerifiedPublicFare>;

    if (!payload.totalPrice || !payload.pricePerTraveler || !payload.provider) {
      return null;
    }

    return {
      provider: payload.provider,
      totalPrice: payload.totalPrice,
      pricePerTraveler: payload.pricePerTraveler,
      url: payload.url
    };
  }
}
