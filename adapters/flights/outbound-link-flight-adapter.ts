import { FlightSearchAdapter, FlightSearchResult } from "@/adapters/flights/types";
import { buildFlightSearchUrl, buildGoogleFlightsUrl } from "@/lib/travel-links";

export class OutboundLinkFlightAdapter implements FlightSearchAdapter {
  async searchFlights({ input, match, scenario }: Parameters<FlightSearchAdapter["searchFlights"]>[0]) {
    const destCode = match.iataCode || match.destination.airportCode;
    const depart = input.departureDate;
    const returns = depart
      ? new Date(new Date(depart).getTime() + input.nights * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : undefined;

    const results: FlightSearchResult[] = [];

    if (scenario.flight.deepLinkUrl) {
      results.push({
        provider: "Aviasales",
        kind: "flight",
        label: `Book this flight now`,
        url: scenario.flight.deepLinkUrl,
        note: `Real-time price via Aviasales. ${scenario.flight.airline} routing for the ${scenario.label} scenario.`,
        direct: true,
        intent: "exact-booking",
      });
    }

    results.push(
      {
        provider: "Kayak",
        kind: "flight",
        label: "Compare flights on Kayak",
        url: buildFlightSearchUrl(input.origin, destCode, depart, returns, input.travelers, match.destination.name),
        note: destCode
          ? `${scenario.flight.airline} style routing with both airports prefilled.`
          : `Fallback fare search for ${match.destination.name}. Pick an autocomplete destination for exact airport matching.`,
        intent: "compare-options",
      },
      {
        provider: "Google Flights",
        kind: "flight",
        label: "Compare flights on Google Flights",
        url: buildGoogleFlightsUrl(input.origin, destCode, depart, returns, match.destination.name),
        note: destCode
          ? "Best fallback for alternate-day comparisons when an exact booking deep link is unavailable."
          : "Text-based fallback search when no destination airport code is available yet.",
        intent: "compare-options",
      }
    );

    return results;
  }
}
