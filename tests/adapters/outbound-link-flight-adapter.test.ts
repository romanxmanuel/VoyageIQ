import { describe, expect, it } from "vitest";
import { OutboundLinkFlightAdapter } from "@/adapters/flights/outbound-link-flight-adapter";
import { resolveDestination } from "@/domain/trip/destination-catalog";
import { buildTripScenarios } from "@/domain/scenarios/build-trip-scenarios";

describe("OutboundLinkFlightAdapter", () => {
  it("puts exact booking links first and labels fallback links as compare options", async () => {
    const input = {
      destinationQuery: "Tokyo",
      destination: "Tokyo",
      origin: "Orlando",
      travelers: 2,
      nights: 6,
      preferDirectFlights: false,
      preferLocalFood: false,
      lowWalkingIntensity: false,
      departureDate: "2026-06-01",
    };

    const match = resolveDestination("Tokyo");
    const scenario = buildTripScenarios(input, match)[1];
    scenario.flight.deepLinkUrl = "https://example.com/exact-booking";

    const adapter = new OutboundLinkFlightAdapter();
    const links = await adapter.searchFlights({ input, match, scenario, tier: scenario.tier });

    expect(links[0]?.intent).toBe("exact-booking");
    expect(links[0]?.label).toBe("Book this flight now");
    expect(links.slice(1).every((link) => link.intent === "compare-options")).toBe(true);
  });
});
