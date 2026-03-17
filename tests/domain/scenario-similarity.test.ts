import { describe, expect, it } from "vitest";
import { buildTripScenarios } from "@/domain/scenarios/build-trip-scenarios";
import { attachScenarioSimilarity } from "@/domain/scenarios/scenario-similarity";
import { resolveDestination } from "@/domain/trip/destination-catalog";

describe("attachScenarioSimilarity", () => {
  it("builds buyer-friendly alternatives without duplicate target scenarios", () => {
    const input = {
      destinationQuery: "Tokyo",
      destination: "Tokyo",
      origin: "Orlando",
      travelers: 4,
      nights: 6,
      preferDirectFlights: false,
      preferLocalFood: false,
      lowWalkingIntensity: true,
    };

    const scenarios = buildTripScenarios(input, resolveDestination("Tokyo"));
    const enriched = attachScenarioSimilarity(scenarios, input);
    const active = enriched.find((scenario) => scenario.tier === "balanced");

    expect(active?.alternatives.every((alternative) =>
      ["save-money", "easier-for-parents", "better-hotel-and-food"].includes(alternative.kind)
    )).toBe(true);

    const scenarioIds = active?.alternatives.map((alternative) => alternative.scenarioId) ?? [];
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
    expect(active?.alternatives.every((alternative) => alternative.heading.length > 0)).toBe(true);
  });
});
