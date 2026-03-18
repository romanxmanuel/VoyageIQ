import { fetchTravelpayoutsFlights, normalizeTravelpayoutsTicket, pickTierTicket } from "@/adapters/flights/travelpayouts-flight-adapter";
import { fetchRawFlightOffers, normalizeFlightOffer, pickTierOffer } from "@/adapters/flights/amadeus-flight-adapter";
import { fetchHotelOffers, pickTierHotel } from "@/adapters/lodging/amadeus-hotels-client";
import { calculateScenarioCost } from "@/domain/pricing/calculate-scenario-cost";
import { buildTripScenarios } from "@/domain/scenarios/build-trip-scenarios";
import { attachScenarioSimilarity, deriveTravelerProfile, deriveTripConstraints } from "@/domain/scenarios/scenario-similarity";
import { resolveIataCodeFuzzy } from "@/domain/trip/data/iata-city-map";
import { getFeaturedDestinations, getPhilippinesSpotlights, resolveDestination } from "@/domain/trip/destination-catalog";
import { PlannerInput, PlannerViewModel, TripScenario } from "@/domain/trip/types";
import { attachScenarioVerification } from "@/server/services/attach-scenario-verification";
import { hydrateGenericDestinationSeed } from "@/server/services/hydrate-generic-destination";
import { getFlightFareVerifier } from "@/server/services/flight-fare-verifier";
import { buildFlightSearchUrl } from "@/lib/travel-links";

export class DestinationResolutionError extends Error {}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function derivePlanningDates(input: PlannerInput) {
  const today = new Date();
  const departDate = input.departureDate
    ? new Date(input.departureDate)
    : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const returnDate = new Date(departDate.getTime() + input.nights * 24 * 60 * 60 * 1000);

  return { departDate, returnDate };
}

async function enrichScenariosWithLiveData(
  scenarios: TripScenario[],
  input: PlannerInput,
  match: NonNullable<ReturnType<typeof resolveDestination>>
) {
  const originIata = resolveIataCodeFuzzy(input.origin) ?? "MCO";
  const { departDate, returnDate } = derivePlanningDates(input);
  const fareVerifier = getFlightFareVerifier();

  try {
    const [tickets, amadeusTickets, liveHotels] = await Promise.all([
      match.iataCode
        ? fetchTravelpayoutsFlights(
            originIata,
            match.iataCode,
            formatDate(departDate),
            formatDate(returnDate),
            input.travelers,
            input.preferDirectFlights ?? false
          ).catch(() => [])
        : Promise.resolve([]),
      match.iataCode
        ? fetchRawFlightOffers(
            originIata,
            match.iataCode,
            formatDate(departDate),
            formatDate(returnDate),
            input.travelers,
            input.preferDirectFlights ?? false
          ).catch(() => [])
        : Promise.resolve([]),
      match.cityCode
        ? fetchHotelOffers(
            match.cityCode,
            formatDate(departDate),
            formatDate(returnDate),
            input.travelers,
            input.nights
          ).catch(() => [])
        : Promise.resolve([])
    ]);

    for (const scenario of scenarios) {
      const rawTicket = pickTierTicket(tickets, scenario.tier);
      const amadeusTicket = pickTierOffer(amadeusTickets, scenario.tier);
      const tierHotel = pickTierHotel(liveHotels, scenario.tier, input.nights);

      if (rawTicket) {
        const normalized = normalizeTravelpayoutsTicket(rawTicket, input.travelers);
        scenario.flight = {
          ...scenario.flight,
          baseFarePerTraveler: normalized.pricePerTraveler,
          totalCost: normalized.totalPrice,
          airline: normalized.airline,
          durationHours: Math.round((normalized.durationMinutes / 60) * 10) / 10,
          stops: normalized.stops,
          deepLinkUrl: normalized.deepLinkUrl,
          pricingSource: "travelpayouts",
          isLivePrice: true
        };
      } else if (amadeusTicket) {
        const normalized = normalizeFlightOffer(amadeusTicket, input.travelers);
        scenario.flight = {
          ...scenario.flight,
          baseFarePerTraveler: normalized.pricePerTraveler,
          totalCost: normalized.totalPrice,
          airline: normalized.airline,
          durationHours: Math.round((normalized.durationMinutes / 60) * 10) / 10,
          stops: normalized.stops,
          cabin: normalized.cabinClass,
          deepLinkUrl: normalized.deepLinkUrl,
          pricingSource: "amadeus",
          isLivePrice: true
        };
      } else if (scenario.tier === "lean" && match.iataCode) {
        const compareUrl = buildFlightSearchUrl(
          input.origin,
          match.iataCode,
          formatDate(departDate),
          formatDate(returnDate),
          input.travelers,
          match.destination.name
        );
        const verifiedFare = await fareVerifier.verifyBudgetFare({
          input,
          originIata,
          destinationIata: match.iataCode,
          departDate: formatDate(departDate),
          returnDate: formatDate(returnDate),
          scenario,
          compareUrl
        });

        if (verifiedFare && verifiedFare.totalPrice < scenario.flight.totalCost) {
          scenario.flight = {
            ...scenario.flight,
            airline: verifiedFare.provider,
            baseFarePerTraveler: verifiedFare.pricePerTraveler,
            totalCost: verifiedFare.totalPrice,
            deepLinkUrl: verifiedFare.url ?? scenario.flight.deepLinkUrl,
            pricingSource: "public-verifier",
            isLivePrice: false
          };
        }
      }

      if (tierHotel) {
        scenario.stay = {
          ...scenario.stay,
          name: tierHotel.hotelName,
          address: tierHotel.address,
          nightlyRate: tierHotel.pricePerNight
        };
      }

      const transitPerDay = Math.max(Math.round(scenario.cost.localTransitTotal / Math.max(input.nights, 1)), 0);
      const activitiesTotal =
        scenario.activities.reduce((total, activity) => total + activity.estimatedPerPerson, 0) * input.travelers;

      scenario.cost = calculateScenarioCost({
        travelers: input.travelers,
        nights: input.nights,
        airfareTotal: scenario.flight.totalCost,
        lodgingTotal: scenario.stay.nightlyRate * input.nights,
        dailyFoodPerTraveler: scenario.diningPlan.dailyBudgetPerTraveler,
        activitiesTotal,
        transitPerDay,
        arrivalTransferTotal: scenario.cost.arrivalTransferTotal
      });
    }
  } catch (error) {
    console.error("Live data fetch failed, using seeded estimates:", error);
  }

  return scenarios;
}

export async function buildPlannerViewModel(input: PlannerInput): Promise<PlannerViewModel> {
  const { departDate, returnDate } = derivePlanningDates(input);
  const normalizedInput: PlannerInput = {
    ...input,
    departureDate: formatDate(departDate)
  };

  let match;

  try {
    match = resolveDestination(normalizedInput.destinationQuery, {
      airportCode: normalizedInput.resolvedDestinationAirportCode,
      country: normalizedInput.resolvedDestinationCountry,
      label: normalizedInput.resolvedDestinationLabel,
      source: normalizedInput.resolvedDestinationSource,
      placeId: normalizedInput.resolvedDestinationPlaceId
    });
  } catch (error) {
    throw new DestinationResolutionError(error instanceof Error ? error.message : "Choose a real place from the list.");
  }

  if (match.isGeneric) {
    match = {
      ...match,
      destination: await hydrateGenericDestinationSeed(match.destination)
    };
  }

  const ruleBasedScenarios = buildTripScenarios(normalizedInput, match);
  const liveEnrichedScenarios = await enrichScenariosWithLiveData(ruleBasedScenarios, normalizedInput, match);
  const scoredScenarios = attachScenarioSimilarity(liveEnrichedScenarios, normalizedInput);
  const verifiedScenarios = await attachScenarioVerification(scoredScenarios, normalizedInput, match);
  const reorderedScenarios = applyPreferenceScoring(verifiedScenarios, normalizedInput);

  const requestedTierIndex = input.tier
    ? reorderedScenarios.findIndex((s) => s.tier === input.tier)
    : -1;
  const selectedScenarioIndex =
    requestedTierIndex >= 0
      ? requestedTierIndex
      : reorderedScenarios.reduce((bestIndex, scenario, index, all) => {
          return scenario.ruleScore > all[bestIndex].ruleScore ? index : bestIndex;
        }, Math.min(1, reorderedScenarios.length - 1));

  return {
    constraints: deriveTripConstraints(normalizedInput),
    travelerProfile: deriveTravelerProfile(normalizedInput),
    input: normalizedInput,
    match,
    scenarios: reorderedScenarios,
    selectedScenarioIndex,
    departDate: formatDate(departDate),
    returnDate: formatDate(returnDate)
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
  return scenarios.map((scenario) => {
    let bonus = 0;
    if (input.preferDirectFlights && scenario.flight.stops === 0) bonus += 20;
    if (input.preferLocalFood) {
      const hasLocalFood = scenario.diningPlan.highlights.some(
        (dining) => !dining.cuisine.toLowerCase().includes("tourist") && dining.estimatedPerPerson < 20
      );
      if (hasLocalFood) bonus += 15;
    }
    if (input.lowWalkingIntensity) {
      const walkingActivities = scenario.activities.filter((activity) => activity.travelMinutesFromCenter < 10);
      if (walkingActivities.length < 2) bonus += 10;
    }
    if (input.budgetCap && scenario.cost.totalTripCost > input.budgetCap) bonus -= 50;
    return { ...scenario, ruleScore: scenario.ruleScore + bonus };
  });
}
