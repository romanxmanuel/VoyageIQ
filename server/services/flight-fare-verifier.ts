import { ExternalFlightFareVerifier } from "@/adapters/flights/external-flight-fare-verifier";
import { FlightFareVerifier } from "@/adapters/flights/fare-verifier";

class NoopFlightFareVerifier implements FlightFareVerifier {
  async verifyBudgetFare() {
    return null;
  }
}

export function getFlightFareVerifier(): FlightFareVerifier {
  const endpoint = process.env.FLIGHT_VERIFIER_URL?.trim();

  if (endpoint) {
    return new ExternalFlightFareVerifier(endpoint);
  }

  return new NoopFlightFareVerifier();
}
