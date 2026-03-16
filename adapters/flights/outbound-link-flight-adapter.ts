import { FlightSearchAdapter, FlightSearchResult } from "@/adapters/flights/types";
import { buildFlightSearchUrl, buildGoogleFlightsUrl, guessAirportCode } from "@/lib/travel-links";
import { resolveIataCode } from "@/domain/trip/data/iata-city-map";

export class OutboundLinkFlightAdapter implements FlightSearchAdapter {
  async searchFlights({ input, match, scenario }: Parameters<FlightSearchAdapter["searchFlights"]>[0]) {
    const originCode = guessAirportCode(input.origin) || resolveIataCode(input.origin) || input.origin;
    const destCode = match.iataCode || match.destination.airportCode;
    const depart = input.departureDate;
    const returns = depart
      ? new Date(new Date(depart).getTime() + input.nights * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      : undefined;

    const results: FlightSearchResult[] = [];

    // If Travelpayouts returned a real deep link, use it as the primary booking link
    if (scenario.flight.deepLinkUrl) {
      results.push({
        provider: "Aviasales",
        kind: "flight",
        label: `Book this flight on Aviasales`,
        url: scenario.flight.deepLinkUrl,
        note: `Real-time price via Aviasales. ${scenario.flight.airline} routing for the ${scenario.label} scenario.`,
      });
    }

    results.push(
      {
        provider: "Kayak",
        kind: "flight",
        label: `Search ${originCode} → ${destCode} on Kayak`,
        url: buildFlightSearchUrl(input.origin, destCode, depart, returns, input.travelers),
        note: `${scenario.flight.airline} style routing. Kayak compares multiple airlines.`,
      },
      {
        provider: "Google Flights",
        kind: "flight",
        label: `Search ${originCode} → ${destCode} on Google Flights`,
        url: buildGoogleFlightsUrl(input.origin, destCode, depart, returns),
        note: "Best for fast fare calendar and alternate-day price comparison.",
      }
    );

    return results;
  }
}
