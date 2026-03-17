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
    label: "Budget trip",
    headline: "Keep the trip real while spending as little as you reasonably can.",
    fitSummary: "Best if saving money matters more than a nicer room or smoother flight timing.",
    flightMultiplier: 0.94,
    foodMultiplier: 0.9,
    transitMultiplier: 0.85,
    activityCount: 2,
    gains: ["Lowest total price", "Still covers the must-do moments", "Good for stretching the budget"],
    losses: ["Smaller room", "Less wiggle room for upgrades", "More effort getting around"]
  },
  balanced: {
    label: "Best value",
    headline: "This is the sweet spot for most people: a good trip without overspending.",
    fitSummary: "Best for most families who want a strong trip without feeling cheap or extravagant.",
    flightMultiplier: 1,
    foodMultiplier: 1.12,
    transitMultiplier: 1,
    activityCount: 3,
    gains: ["Better hotel area", "More balanced food plan", "Stronger mix of comfort and savings"],
    losses: ["Costs more than the cheapest version", "Less room for impulse upgrades"]
  },
  elevated: {
    label: "More comfort",
    headline: "Spend more where it makes the trip feel easier, calmer, and less tiring.",
    fitSummary: "Best when smoother flights, a better hotel, and easier days matter more than squeezing every dollar.",
    flightMultiplier: 1.18,
    foodMultiplier: 1.32,
    transitMultiplier: 1.08,
    activityCount: 4,
    gains: ["Better flight comfort", "More convenient stay", "Stronger activity mix"],
    losses: ["Price rises faster with each extra day", "Less budget flexibility once booked"]
  },
  signature: {
    label: "Treat yourself",
    headline: "Use the premium version when this trip is meant to feel big, easy, and memorable.",
    fitSummary: "Best for milestone trips where comfort and wow factor matter more than keeping costs low.",
    flightMultiplier: 1.42,
    foodMultiplier: 1.62,
    transitMultiplier: 1.18,
    activityCount: 5,
    gains: ["Most comfortable overall flow", "Best hotel and food moments", "Highest ease for the group"],
    losses: ["Highest upfront cost", "You pay a lot more for each upgrade", "Harder to trim after booking"]
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

const FLEXIBLE_DAY_THEMES = [
  {
    title: "Slow neighborhood day",
    note: "Leave room to wander, rest, shop, and follow whatever feels best once you are actually there.",
    afternoonTitle: "Browse local streets, shops, and photo spots",
    afternoonCost: 12,
    afternoonTravelMinutes: 14
  },
  {
    title: "Cafe and local market day",
    note: "Use one day to eat well, move slower, and enjoy the place without another timed ticket.",
    afternoonTitle: "Visit a local market or neighborhood food street",
    afternoonCost: 16,
    afternoonTravelMinutes: 18
  },
  {
    title: "Low-pressure family day",
    note: "This day protects energy so the trip stays fun instead of turning into a checklist.",
    afternoonTitle: "Pick a park, waterfront, or easy local stroll",
    afternoonCost: 10,
    afternoonTravelMinutes: 12
  },
  {
    title: "Pick-your-own adventure day",
    note: "Keep one day open enough to follow weather, energy, and whatever surprise recommendation shows up.",
    afternoonTitle: "Choose one extra local stop that feels right in the moment",
    afternoonCost: 14,
    afternoonTravelMinutes: 15
  }
];

const BREAKFAST_TITLES = [
  "Easy breakfast near the hotel",
  "Quick breakfast before heading out",
  "Coffee and breakfast in the neighborhood",
  "Breakfast and a slow start nearby"
];

const DINNER_FALLBACKS = [
  "Open neighborhood dinner",
  "Open local dinner block",
  "Open relaxed dinner plan",
  "Open final dinner choice"
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
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

function toStableId(prefix: string, item: { id?: string; name: string; address: string }) {
  return item.id ?? buildEntityId(prefix, `${item.name}-${item.address}`);
}

function dedupeByStableId<T extends { id?: string; name: string; address: string }>(prefix: string, items: T[]) {
  const seen = new Set<string>();

  return items.reduce<T[]>((unique, item) => {
    const stableId = toStableId(prefix, item);

    if (seen.has(stableId)) {
      return unique;
    }

    seen.add(stableId);
    unique.push({
      ...item,
      id: stableId
    });
    return unique;
  }, []);
}

function rotateByTier<T>(items: T[], tier: ScenarioTier) {
  if (!items.length) {
    return [];
  }

  const tierOffset: Record<ScenarioTier, number> = {
    lean: 0,
    balanced: 1,
    elevated: 2,
    signature: 0
  };

  const offset = tierOffset[tier] % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function pickDiningPool(spots: DiningSpot[], tier: ScenarioTier) {
  const unique = dedupeByStableId("dining", spots);
  const matching = unique.filter((spot) => spot.fit.includes(tier));
  const supporting = unique.filter((spot) => !spot.fit.includes(tier));

  return [...rotateByTier(matching, tier), ...rotateByTier(supporting, tier)];
}

function pickDiningHighlights(spots: DiningSpot[], tier: ScenarioTier, nights: number) {
  return pickDiningPool(spots, tier).slice(0, Math.min(Math.max(5, Math.min(nights + 2, 8)), 8));
}

function pickActivities(activities: ActivityOption[], tier: ScenarioTier, nights: number) {
  const count = Math.min(Math.max(2, nights - 1), SCENARIO_META[tier].activityCount);
  const unique = dedupeByStableId("activity", activities);
  const matching = unique.filter((activity) => activity.fit.includes(tier));
  const supporting = unique.filter((activity) => !activity.fit.includes(tier));

  return [...rotateByTier(matching, tier), ...rotateByTier(supporting, tier)]
    .slice(0, count)
    .map<ActivityPlan>((activity) => ({
      ...activity,
      id: activity.id ?? buildEntityId("activity", `${activity.name}-${activity.address}`),
      totalCost: activity.estimatedPerPerson
    }));
}

function buildFlexibleDayTitle(dayNumber: number, stayNeighborhood: string) {
  const theme = FLEXIBLE_DAY_THEMES[(dayNumber - 1) % FLEXIBLE_DAY_THEMES.length];
  return `${theme.title} in ${stayNeighborhood}`;
}

function buildFlexibleDayNote(dayNumber: number) {
  return FLEXIBLE_DAY_THEMES[(dayNumber - 1) % FLEXIBLE_DAY_THEMES.length].note;
}

function buildBreakfastTitle(dayNumber: number) {
  return BREAKFAST_TITLES[(dayNumber - 1) % BREAKFAST_TITLES.length];
}

function buildGenericDinner(dayNumber: number, stayNeighborhood: string, diningPool: DiningSpot[]) {
  const title = DINNER_FALLBACKS[(dayNumber - 1) % DINNER_FALLBACKS.length];
  const cuisines = Array.from(new Set(diningPool.map((spot) => spot.cuisine.toLowerCase()).filter(Boolean))).slice(0, 3);
  const cuisineHint = cuisines.length ? ` ${cuisines.join(", ")}` : " local food";

  return {
    title: `${title} in ${stayNeighborhood}: ${cuisineHint}`,
    location: stayNeighborhood,
    cost: 28,
    travelMinutes: 10
  };
}

function takeDinnerStop(dayNumber: number, remainingDining: DiningSpot[], stayNeighborhood: string, diningPool: DiningSpot[]) {
  const dinner = remainingDining.shift();

  if (!dinner) {
    const fallback = buildGenericDinner(dayNumber, stayNeighborhood, diningPool);

    return {
      cost: fallback.cost,
      stop: {
        slot: "Evening" as const,
        title: fallback.title,
        location: fallback.location,
        cost: fallback.cost,
        travelMinutes: fallback.travelMinutes
      }
    };
  }

  return {
    cost: dinner.estimatedPerPerson,
    stop: {
      slot: "Evening" as const,
      title: `Dinner at ${dinner.name}`,
      location: dinner.address,
      cost: dinner.estimatedPerPerson,
      travelMinutes: 15
    }
  };
}

function buildItinerary(
  destinationName: string,
  diningPool: DiningSpot[],
  activities: ActivityPlan[],
  nights: number,
  stayName: string,
  stayNeighborhood: string
) {
  const totalDays = Math.max(3, nights);
  const itinerary: ItineraryDay[] = [];
  const remainingDining = [...diningPool];
  const remainingActivities = [...activities];
  const usedActivityIds = new Set<string>();

  for (let index = 0; index < totalDays; index += 1) {
    const dayNumber = index + 1;
    const dinner = takeDinnerStop(dayNumber, remainingDining, stayNeighborhood, diningPool);

    if (index === 0) {
      itinerary.push({
        dayNumber,
        title: "Arrival and easy first night",
        note: "Use the first day to settle in, eat well, and get your bearings without overdoing it.",
        totalEstimate: dinner.cost + 18,
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
            title: `Take a short first walk around ${stayNeighborhood}`,
            location: stayNeighborhood,
            cost: 18,
            travelMinutes: 12
          },
          dinner.stop
        ]
      });

      continue;
    }

    if (index === totalDays - 1) {
      itinerary.push({
        dayNumber,
        title: "Departure day without the stress",
        note: "Keep the last day light so checkout and airport timing do not sour the ending of the trip.",
        totalEstimate: Math.round(dinner.cost + 24),
        stops: [
          {
            slot: "Morning",
            title: `Easy breakfast before checkout`,
            location: stayNeighborhood,
            cost: 12,
            travelMinutes: 8
          },
          {
            slot: "Afternoon",
            title: `Last photos, one easy stop, and checkout in ${destinationName}`,
            location: stayNeighborhood,
            cost: 12,
            travelMinutes: 10
          },
          {
            ...dinner.stop,
            title:
              dinner.stop.title.startsWith("Dinner at")
                ? `${dinner.stop.title} before the airport`
                : dinner.stop.title
          }
        ]
      });

      continue;
    }

    const activity = remainingActivities.find((candidate) => {
      const stableId = candidate.id ?? buildEntityId("activity", `${candidate.name}-${candidate.address}`);
      return !usedActivityIds.has(stableId);
    });

    if (activity) {
      usedActivityIds.add(activity.id ?? buildEntityId("activity", `${activity.name}-${activity.address}`));

      itinerary.push({
        dayNumber,
        title: `${activity.name} day`,
        note: "This day centers on one main plan so the rest of the schedule can stay easy.",
        totalEstimate:
          activity.estimatedPerPerson + dinner.cost + Math.round(activity.estimatedPerPerson * 0.35),
        stops: [
          {
            slot: "Morning",
            title: `${buildBreakfastTitle(dayNumber)} before ${activity.name}`,
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
          dinner.stop
        ]
      });

      continue;
    }

    const theme = FLEXIBLE_DAY_THEMES[(dayNumber - 1) % FLEXIBLE_DAY_THEMES.length];

    itinerary.push({
      dayNumber,
      title: buildFlexibleDayTitle(dayNumber, stayNeighborhood),
      note: buildFlexibleDayNote(dayNumber),
      totalEstimate: Math.round(dinner.cost + theme.afternoonCost + 14),
      stops: [
        {
          slot: "Morning",
          title: buildBreakfastTitle(dayNumber),
          location: stayNeighborhood,
          cost: 14,
          travelMinutes: 8
        },
        {
          slot: "Afternoon",
          title: `${theme.afternoonTitle} in ${destinationName}`,
          location: stayNeighborhood,
          cost: theme.afternoonCost,
          travelMinutes: theme.afternoonTravelMinutes
        },
        dinner.stop
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
    const diningHighlights = pickDiningHighlights(destination.dining, tier, input.nights);
    const diningPool = pickDiningPool(destination.dining, tier);
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
      totalCost: airfareTotal,
      pricingSource: "seeded",
      isLivePrice: false
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
        diningPool,
        activities,
        input.nights,
        stay.name,
        stay.neighborhood
      ),
      arrivalPlan: [
        `Book the ${flight.airline} flight into ${destination.airportCode} and aim for the ${flight.arriveWindow.toLowerCase()} arrival window.`,
        `Head to ${stay.neighborhood} first so everyone can settle in before doing anything ambitious.`,
        "Use the first meal and first night to recover, not to cram in sightseeing."
      ],
      bookingSequence: [
        `Lock in flights first because this ${meta.label.toLowerCase()} version moves the most when airfare shifts.`,
        `Book ${stay.name} next so you keep the same neighborhood feel and daily flow.`,
        "Reserve the top activity before filling in optional meals and extras."
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
