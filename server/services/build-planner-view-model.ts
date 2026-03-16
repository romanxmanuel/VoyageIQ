import { buildTripScenarios } from "@/domain/scenarios/build-trip-scenarios";
import { attachScenarioSimilarity, deriveTravelerProfile, deriveTripConstraints } from "@/domain/scenarios/scenario-similarity";
import { getFeaturedDestinations, getPhilippinesSpotlights, resolveDestination } from "@/domain/trip/destination-catalog";
import { PlannerInput, PlannerViewModel, TripScenario } from "@/domain/trip/types";
import { attachScenarioVerification } from "@/server/services/attach-scenario-verification";
import { fetchTravelpayoutsFlights, pickTierTicket, normalizeTravelpayoutsTicket } from "@/adapters/flights/travelpayouts-flight-adapter";
import { fetchHotelOffers, pickTierHotel } from "@/adapters/lodging/amadeus-hotels-client";
import { resolveIataCode } from "@/domain/trip/data/iata-city-map";

export async function buildPlannerViewModel(input: PlannerInput): Promise<PlannerViewModel> {
  const match = resolveDestination(input.destinationQuery);
  const ruleBasedScenarios = buildTripScenarios(input, match);
  const scoredScenarios = attachScenarioSimilarity(ruleBasedScenarios, input);
  const scenarios = await attachScenarioVerification(scoredScenarios, input, match);

  // Live data enrichment
  const today = new Date();
  const departDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const returnDate = new Date(departDate.getTime() + input.nights * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const originIata = resolveIataCode(input.origin) ?? 'MCO';

  try {
    const [tickets, liveHotels] = await Promise.all([
      fetchTravelpayoutsFlights(
        originIata,
        match.iataCode,
        fmt(departDate),
        fmt(returnDate),
        input.travelers,
        input.preferDirectFlights ?? false
      ),
      fetchHotelOffers(
        match.cityCode,
        fmt(departDate),
        fmt(returnDate),
        input.travelers,
        input.nights
      ),
    ]);

    for (const scenario of scenarios) {
      const rawTicket = pickTierTicket(tickets, scenario.tier);
      const tierHotel = pickTierHotel(liveHotels, scenario.tier, input.nights);

      if (rawTicket) {
        const normalized = normalizeTravelpayoutsTicket(rawTicket, input.travelers);
        scenario.flight = {
          ...scenario.flight,
          baseFarePerTraveler: normalized.pricePerTraveler,
          airline: normalized.airline,
          durationHours: Math.round((normalized.durationMinutes / 60) * 10) / 10,
          stops: normalized.stops,
          deepLinkUrl: normalized.deepLinkUrl,
        };
      }
      if (tierHotel) {
        scenario.stay = {
          ...scenario.stay,
          name: tierHotel.hotelName,
          address: tierHotel.address,
          nightlyRate: tierHotel.pricePerNight,
        };
      }
    }
  } catch (err) {
    // Graceful fallback — seeded data remains if live API fails
    console.error('Live data fetch failed, using seeded estimates:', err);
  }

  const reorderedScenarios = applyPreferenceScoring(scenarios, input);

  const selectedScenarioIndex = reorderedScenarios.reduce((bestIndex, scenario, index, all) => {
    return scenario.ruleScore > all[bestIndex].ruleScore ? index : bestIndex;
  }, Math.min(1, reorderedScenarios.length - 1));

  return {
    constraints: deriveTripConstraints(input),
    travelerProfile: deriveTravelerProfile(input),
    input,
    match,
    scenarios: reorderedScenarios,
    selectedScenarioIndex,
  };
}

export function getPlannerLandingData() {
  return {
    featuredDestinations: getFeaturedDestinations(),
    philippinesSpotlights: getPhilippinesSpotlights()
  };
}

function applyPreferenceScoring(scenarios: TripScenario[], input: PlannerInput): TripScenario[] {
  if (!input.preferDirectFlights && !input.preferLocalFood && !input.lowWalkingIntensity && !input.budgetCap) {
    return scenarios;
  }
  return scenarios.map((s) => {
    let bonus = 0;
    if (input.preferDirectFlights && s.flight.stops === 0) bonus += 20;
    if (input.preferLocalFood) {
      const hasLocalFood = s.diningPlan.highlights.some(
        (d) => !d.cuisine.toLowerCase().includes('tourist') && d.estimatedPerPerson < 20
      );
      if (hasLocalFood) bonus += 15;
    }
    if (input.lowWalkingIntensity) {
      const walkingActivities = s.activities.filter((a) => a.travelMinutesFromCenter < 10);
      if (walkingActivities.length < 2) bonus += 10;
    }
    if (input.budgetCap && s.cost.totalTripCost > input.budgetCap) bonus -= 50;
    return { ...s, ruleScore: s.ruleScore + bonus };
  });
}
