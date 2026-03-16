import { calculateScenarioCost } from "@/domain/pricing/calculate-scenario-cost";
import { buildScenarioFeatureVector, scoreScenario } from "@/domain/scenarios/scenario-similarity";
import {
  ActivityOption,
  ActivityPlan,
  DestinationMatch,
  DiningSpot,
  FlightPlan,
  ItineraryDay,
  PlannerInput,
  ScenarioTier,
  TripScenario
} from "@/domain/trip/types";

const SCENARIO_META: Record<
  ScenarioTier,
  {
    label: string;
    headline: string;
    fitSummary: string;
    flightMultiplier: number;
    foodMultiplier: number;
    transitMultiplier: number;
    activityCount: number;
    gains: string[];
    losses: string[];
  }
> = {
  lean: {
    label: "Lean Explorer",
    headline: "Keep the total family number low while protecting the moments that make the trip feel real.",
    fitSummary: "Best for value-focused families who care more about destination signal than room prestige.",
    flightMultiplier: 0.94,
    foodMultiplier: 0.9,
    transitMultiplier: 0.85,
    activityCount: 2,
    gains: ["Lowest total trip cost", "Best cost-per-day efficiency", "Keeps iconic anchors intact"],
    losses: ["Smaller room footprint", "Fewer premium meal moments", "More transit optimization required"]
  },
  balanced: {
    label: "Balanced Core",
    headline: "Maximize comfort per dollar without letting the trip drift into bland middle-ground.",
    fitSummary: "Best overall default for most families who want a strong trip without apology spending.",
    flightMultiplier: 1,
    foodMultiplier: 1.12,
    transitMultiplier: 1,
    activityCount: 3,
    gains: ["Stronger flight timing", "Hotel quality improves", "More room for signature meals"],
    losses: ["Total budget rises", "Less flexibility for extra shopping or upgrades"]
  },
  elevated: {
    label: "Elevated Flow",
    headline: "Use higher spend where it buys back energy, memory density, and less day-to-day friction.",
    fitSummary: "Best when the trip needs to feel noticeably smoother, not just marginally nicer.",
    flightMultiplier: 1.18,
    foodMultiplier: 1.32,
    transitMultiplier: 1.08,
    activityCount: 4,
    gains: ["Premium-economy style flight comfort", "Better-located stay", "More curated activity mix"],
    losses: ["Lower margin for schedule changes", "Each extra night gets meaningfully pricier"]
  },
  signature: {
    label: "Signature Memory",
    headline: "Treat the trip like a major family memory project with premium booking choices throughout.",
    fitSummary: "Best for milestone travel where comfort and wow-factor matter as much as efficiency.",
    flightMultiplier: 1.42,
    foodMultiplier: 1.62,
    transitMultiplier: 1.18,
    activityCount: 5,
    gains: ["Highest ease and recovery", "Most polished meals and lodging", "Premium memory moments"],
    losses: ["Largest upfront spend", "Weakest cost-per-day efficiency", "Least resilient to budget tightening"]
  }
};

const ORIGIN_BASELINES: Record<string, number> = {
  orlando: 1,
  miami: 1,
  atlanta: 0.96,
  newyork: 0.93,
  chicago: 1.05,
  dallas: 1.08,
  losangeles: 0.84,
  sanfrancisco: 0.9,
  seattle: 0.88
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function buildEntityId(prefix: string, value: string) {
  return `${prefix}-${normalize(value)}`;
}

function estimateOriginMultiplier(origin: string) {
  const normalizedOrigin = normalize(origin);
  const directMatch = ORIGIN_BASELINES[normalizedOrigin];

  if (directMatch) {
    return directMatch;
  }

  return normalizedOrigin.length > 10 ? 1.1 : 1.04;
}

function pickDiningHighlights(spots: DiningSpot[], tier: ScenarioTier) {
  const matching = spots.filter((spot) => spot.fit.includes(tier));
  const tierOffset: Record<ScenarioTier, number> = {
    lean: 0,
    balanced: 1,
    elevated: 2,
    signature: 0
  };

  if (matching.length <= 3) {
    return matching.map((spot) => ({
      ...spot,
      id: spot.id ?? buildEntityId("dining", `${spot.name}-${spot.address}`)
    }));
  }

  const offset = tierOffset[tier] % matching.length;
  const rotated = [...matching.slice(offset), ...matching.slice(0, offset)];

  return rotated.slice(0, 3).map((spot) => ({
    ...spot,
    id: spot.id ?? buildEntityId("dining", `${spot.name}-${spot.address}`)
  }));
}

function pickActivities(activities: ActivityOption[], tier: ScenarioTier, nights: number) {
  const count = Math.min(Math.max(2, nights - 1), SCENARIO_META[tier].activityCount);
  const matching = activities.filter((activity) => activity.fit.includes(tier));
  const tierOffset: Record<ScenarioTier, number> = {
    lean: 0,
    balanced: 1,
    elevated: 2,
    signature: 0
  };
  const offset = matching.length ? tierOffset[tier] % matching.length : 0;
  const rotated = matching.length ? [...matching.slice(offset), ...matching.slice(0, offset)] : [];

  return rotated
    .slice(0, count)
    .map<ActivityPlan>((activity) => ({
      ...activity,
      id: activity.id ?? buildEntityId("activity", `${activity.name}-${activity.address}`),
      totalCost: activity.estimatedPerPerson
    }));
}

function buildFlexibleTitle(dayNumber: number, stayNeighborhood: string, scenarioLabel: string) {
  const titles = [
    `Slow neighborhood start in ${stayNeighborhood}`,
    `${scenarioLabel} reset day near ${stayNeighborhood}`,
    `Open-format exploration around ${stayNeighborhood}`,
    `Local discovery day from ${stayNeighborhood}`
  ];

  return titles[(dayNumber - 1) % titles.length];
}

function buildFlexibleNote(dayNumber: number, destinationName: string, stayNeighborhood: string) {
  const notes = [
    `Use this day to absorb ${destinationName} at a slower pace instead of forcing another paid anchor.`,
    `This is where the trip feels human: room for coffee, photos, rest, and one extra local detour in ${stayNeighborhood}.`,
    `Keep one block unstructured so the family can chase whatever feels best once you're actually there.`
  ];

  return notes[(dayNumber - 1) % notes.length];
}

function buildItinerary(
  destinationName: string,
  scenarioLabel: string,
  dining: DiningSpot[],
  activities: ActivityPlan[],
  nights: number,
  stayName: string,
  stayNeighborhood: string
) {
  const totalDays = Math.max(3, nights);
  const itinerary: ItineraryDay[] = [];
  const majorActivities = activities.slice(0, Math.max(1, totalDays - 2));

  for (let index = 0; index < totalDays; index += 1) {
    const dayNumber = index + 1;
    const activity = majorActivities[index - 1];
    const dinner = dining[index % dining.length];

    if (index === 0) {
      itinerary.push({
        dayNumber,
        title: "Arrival and neighborhood orientation",
        note: "The first day should protect energy, food, and an easy first impression instead of trying to be productive.",
        totalEstimate: dinner.estimatedPerPerson + 18,
        stops: [
          {
            slot: "Morning",
            title: `Land, check into ${stayName}, and reset`,
            location: stayNeighborhood,
            cost: 0,
            travelMinutes: 35
          },
          {
            slot: "Afternoon",
            title: `Walk the core of ${stayNeighborhood}`,
            location: stayNeighborhood,
            cost: 18,
            travelMinutes: 12
          },
          {
            slot: "Evening",
            title: `Dinner at ${dinner.name}`,
            location: dinner.address,
            cost: dinner.estimatedPerPerson,
            travelMinutes: 15
          }
        ]
      });

      continue;
    }

    if (index === totalDays - 1) {
      itinerary.push({
        dayNumber,
        title: "Departure buffer and final favorites",
        note: "Keep the final day light so checkout, luggage, and airport movement do not crush the trip ending.",
        totalEstimate: Math.round(dinner.estimatedPerPerson + 24),
        stops: [
          {
            slot: "Morning",
            title: `Favorite breakfast repeat near ${stayNeighborhood}`,
            location: stayNeighborhood,
            cost: 12,
            travelMinutes: 8
          },
          {
            slot: "Afternoon",
            title: `Last walk, photos, and checkout buffer in ${destinationName}`,
            location: stayNeighborhood,
            cost: 12,
            travelMinutes: 10
          },
          {
            slot: "Evening",
            title: `Final meal at ${dinner.name} before airport transfer`,
            location: dinner.address,
            cost: dinner.estimatedPerPerson,
            travelMinutes: 20
          }
        ]
      });

      continue;
    }

    if (activity) {
      itinerary.push({
        dayNumber,
        title: `${activity.name} anchor day`,
        note: "This day carries one major anchor and keeps the surrounding blocks intentionally lighter.",
        totalEstimate:
          activity.estimatedPerPerson + dinner.estimatedPerPerson + Math.round(activity.estimatedPerPerson * 0.35),
        stops: [
          {
            slot: "Morning",
            title: `Easy breakfast and transfer toward ${activity.name}`,
            location: stayNeighborhood,
            cost: 14,
            travelMinutes: 18
          },
          {
            slot: "Afternoon",
            title: activity.name,
            location: activity.address,
            cost: activity.estimatedPerPerson,
            travelMinutes: activity.travelMinutesFromCenter
          },
          {
            slot: "Evening",
            title: `Dinner at ${dinner.name}`,
            location: dinner.address,
            cost: dinner.estimatedPerPerson,
            travelMinutes: 15
          }
        ]
      });

      continue;
    }

    itinerary.push({
      dayNumber,
      title: buildFlexibleTitle(dayNumber, stayNeighborhood, scenarioLabel),
      note: buildFlexibleNote(dayNumber, destinationName, stayNeighborhood),
      totalEstimate: Math.round(dinner.estimatedPerPerson + 26),
      stops: [
        {
          slot: "Morning",
          title: `Slow breakfast and cafe time near ${stayNeighborhood}`,
          location: stayNeighborhood,
          cost: 14,
          travelMinutes: 8
        },
        {
          slot: "Afternoon",
          title: `Freeform shopping, beach, or photo block in ${destinationName}`,
          location: stayNeighborhood,
          cost: 12,
          travelMinutes: 15
        },
        {
          slot: "Evening",
          title: `Dinner at ${dinner.name}`,
          location: dinner.address,
          cost: dinner.estimatedPerPerson,
          travelMinutes: 15
        }
      ]
    });
  }

  return itinerary;
}

export function buildTripScenarios(input: PlannerInput, match: DestinationMatch): TripScenario[] {
  const originMultiplier = estimateOriginMultiplier(input.origin);
  const { destination } = match;

  return (Object.keys(SCENARIO_META) as ScenarioTier[]).map((tier) => {
    const meta = SCENARIO_META[tier];
    const flightTemplate = destination.flights[tier];
    const stay = destination.stays[tier];
    const diningHighlights = pickDiningHighlights(destination.dining, tier);
    const activities = pickActivities(destination.activities, tier, input.nights);
    const airfarePerTraveler = Math.round(flightTemplate.baseFarePerTraveler * originMultiplier * meta.flightMultiplier);
    const airfareTotal = airfarePerTraveler * input.travelers;
    const lodgingTotal = stay.nightlyRate * input.nights;
    const foodBaseline =
      diningHighlights.reduce((total, spot) => total + spot.estimatedPerPerson, 0) / Math.max(diningHighlights.length, 1);
    const dailyBudgetPerTraveler = Math.round(foodBaseline * meta.foodMultiplier + 18);
    const activitiesTotal =
      activities.reduce((total, activity) => total + activity.estimatedPerPerson, 0) * input.travelers;
    const transitPerDay = Math.round(destination.averageTransitPerDay * meta.transitMultiplier);
    const cost = calculateScenarioCost({
      travelers: input.travelers,
      nights: input.nights,
      airfareTotal,
      lodgingTotal,
      dailyFoodPerTraveler: dailyBudgetPerTraveler,
      activitiesTotal,
      transitPerDay
    });

    const flight: FlightPlan = {
      ...flightTemplate,
      baseFarePerTraveler: airfarePerTraveler,
      totalCost: airfareTotal
    };

    const baseScenario: TripScenario = {
      id: `${destination.slug}-${tier}`,
      tier,
      label: meta.label,
      headline: meta.headline,
      fitSummary: meta.fitSummary,
      ruleScore: 0,
      featureVector: {
        costPerDay: 0,
        comfort: 0,
        foodQuality: 0,
        activityDensity: 0,
        transitConvenience: 0,
        familyFriendliness: 0
      },
      alternatives: [],
      flight,
      stay,
      diningPlan: {
        dailyBudgetPerTraveler,
        highlights: diningHighlights
      },
      activities,
      itinerary: buildItinerary(
        destination.name,
        meta.label,
        diningHighlights,
        activities,
        input.nights,
        stay.name,
        stay.neighborhood
      ),
      arrivalPlan: [
        `Book the ${flight.airline} routing into ${destination.airportCode} and aim for the ${flight.arriveWindow} arrival window.`,
        `Transfer into ${stay.neighborhood} first so the family can settle before the first major sightseeing block.`,
        "Use the first meal to stabilize energy rather than chasing a high-effort reservation immediately."
      ],
      bookingSequence: [
        `Lock flights first because the ${tier} scenario is most sensitive to airfare variance.`,
        `Book ${stay.name} next to preserve the neighborhood logic behind this itinerary.`,
        "Reserve the highest-demand activity before choosing secondary dining reservations."
      ],
      tradeoffs: {
        gains: meta.gains,
        losses: meta.losses
      },
      cost,
      verification: {
        flights: [],
        lodging: [],
        dining: [],
        activities: []
      }
    };

    const featureVector = buildScenarioFeatureVector(baseScenario, input);

    return {
      ...baseScenario,
      featureVector,
      ruleScore: scoreScenario(featureVector, input)
    };
  });
}
