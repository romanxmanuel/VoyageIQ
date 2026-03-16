import { FlightSearchAdapter, FlightSearchResult } from "@/adapters/flights/types";
import { buildFlightSearchUrl, buildGoogleFlightsUrl } from "@/lib/travel-links";

export class OutboundLinkFlightAdapter implements FlightSearchAdapter {
  async searchFlights({ input, match, scenario }: Parameters<FlightSearchAdapter["searchFlights"]>[0]) {
    const results: FlightSearchResult[] = [
      {
        provider: "Kayak",
        kind: "flight",
        label: `Search ${input.origin} to ${match.destination.airportCode} on Kayak`,
        url: buildFlightSearchUrl(input.origin, match.destination.airportCode),
        note: `${scenario.flight.airline} style routing for the ${scenario.label} scenario.`
      },
      {
        provider: "Google Flights",
        kind: "flight",
        label: `Search ${input.origin} to ${match.destination.airportCode} on Google Flights`,
        url: buildGoogleFlightsUrl(input.origin, match.destination.airportCode),
        note: "Useful for fast fare checking and alternate departure-day comparisons."
      }
    ];

    return results;
  }
}
