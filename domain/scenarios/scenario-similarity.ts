import type {
  PlannerInput,
  ScenarioAlternative,
  ScenarioFeatureVector,
  TradeoffChange,
  TravelerProfile,
  TripConstraint,
  TripScenario
} from "@/domain/trip/types";

type SimilarityWeights = Record<keyof ScenarioFeatureVector, number>;

const FEATURE_KEYS: Array<keyof ScenarioFeatureVector> = [
  "costPerDay",
  "comfort",
  "foodQuality",
  "activityDensity",
  "transitConvenience",
  "familyFriendliness"
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function getTierComfortBoost(label: string) {
  if (label.toLowerCase().includes("signature")) return 0.92;
  if (label.toLowerCase().includes("elevated")) return 0.76;
  if (label.toLowerCase().includes("balanced")) return 0.58;
  return 0.36;
}

export function deriveTravelerProfile(input: PlannerInput): TravelerProfile {
  const partyMode =
    input.travelers === 1 ? "solo" : input.travelers === 2 ? "pair" : input.travelers <= 5 ? "family" : "group";

  return {
    travelers: input.travelers,
    partyMode,
    familyFriendlyPriority: input.travelers >= 3 ? 0.9 : 0.55
  };
}

export function deriveTripConstraints(input: PlannerInput): TripConstraint {
  return {
    destinationQuery: input.destinationQuery,
    origin: input.origin,
    travelers: input.travelers,
    nights: input.nights
  };
}

export function buildScenarioFeatureVector(scenario: TripScenario, input: PlannerInput): ScenarioFeatureVector {
  const comfort = clamp(
    getTierComfortBoost(scenario.label) +
      (scenario.flight.stops === 0 ? 0.08 : 0) +
      (scenario.flight.cabin.toLowerCase().includes("premium") || scenario.flight.cabin.toLowerCase().includes("business") ? 0.1 : 0)
  );

  const foodQuality = clamp((scenario.diningPlan.dailyBudgetPerTraveler - 20) / 120);
  const activityDensity = clamp(scenario.activities.length / Math.max(input.nights, 3));
  const transitConvenience = clamp(
    1 - (scenario.flight.stops * 0.18 + Math.min(scenario.flight.durationHours / 24, 0.45)) + comfort * 0.12
  );
  const familyFriendliness = clamp(
    comfort * 0.28 +
      transitConvenience * 0.22 +
      clamp(1 - scenario.cost.costPerTraveler / 3200) * 0.28 +
      clamp(1 - Math.abs(activityDensity - 0.55)) * 0.22
  );

  return {
    costPerDay: clamp(scenario.cost.costPerDay / 550),
    comfort,
    foodQuality,
    activityDensity,
    transitConvenience,
    familyFriendliness
  };
}

function getRuleWeights(input: PlannerInput): SimilarityWeights {
  const familyHeavy = input.travelers >= 3;
  const shortTrip = input.nights <= 5;

  return {
    costPerDay: familyHeavy ? 1.65 : 1.25,
    comfort: 1.15,
    foodQuality: 0.8,
    activityDensity: shortTrip ? 0.85 : 1,
    transitConvenience: shortTrip ? 1.35 : 1.1,
    familyFriendliness: familyHeavy ? 1.6 : 1.05
  };
}

function getSimilarityWeights(input: PlannerInput): SimilarityWeights {
  const familyHeavy = input.travelers >= 3;

  return {
    costPerDay: familyHeavy ? 1.55 : 1.1,
    comfort: 1.2,
    foodQuality: 0.85,
    activityDensity: 0.95,
    transitConvenience: 1.1,
    familyFriendliness: familyHeavy ? 1.45 : 1
  };
}

export function scoreScenario(vector: ScenarioFeatureVector, input: PlannerInput) {
  const weights = getRuleWeights(input);
  const costFit = clamp(1 - vector.costPerDay);

  const total =
    costFit * weights.costPerDay +
    vector.comfort * weights.comfort +
    vector.foodQuality * weights.foodQuality +
    vector.activityDensity * weights.activityDensity +
    vector.transitConvenience * weights.transitConvenience +
    vector.familyFriendliness * weights.familyFriendliness;

  const max =
    weights.costPerDay +
    weights.comfort +
    weights.foodQuality +
    weights.activityDensity +
    weights.transitConvenience +
    weights.familyFriendliness;

  return Math.round((total / max) * 100);
}

export function calculateWeightedDistance(
  left: ScenarioFeatureVector,
  right: ScenarioFeatureVector,
  input: PlannerInput
) {
  const weights = getSimilarityWeights(input);

  const sum = FEATURE_KEYS.reduce((total, key) => {
    const delta = left[key] - right[key];
    return total + weights[key] * delta * delta;
  }, 0);

  return Math.sqrt(sum);
}

function buildTradeoffChanges(source: ScenarioFeatureVector, target: ScenarioFeatureVector) {
  return FEATURE_KEYS.map<TradeoffChange>((key) => ({
    label: key,
    from: Number(source[key].toFixed(2)),
    to: Number(target[key].toFixed(2)),
    delta: Number((target[key] - source[key]).toFixed(2))
  }))
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 3);
}

function getFlightTradeoff(source: TripScenario, candidate: TripScenario) {
  if (candidate.flight.stops > source.flight.stops) {
    return "more stops on the flight";
  }

  if (candidate.flight.stops < source.flight.stops) {
    return "easier flights with fewer stops";
  }

  if (candidate.flight.cabin !== source.flight.cabin) {
    return candidate.flight.cabin.toLowerCase().includes("business") || candidate.flight.cabin.toLowerCase().includes("premium")
      ? "a more comfortable flight"
      : "a simpler flight cabin";
  }

  return "a similar flight setup";
}

function getHotelTradeoff(source: TripScenario, candidate: TripScenario) {
  if (candidate.stay.nightlyRate > source.stay.nightlyRate) {
    return "a better hotel area and nicer room";
  }

  if (candidate.stay.nightlyRate < source.stay.nightlyRate) {
    return "a simpler hotel to lower the total cost";
  }

  return "a similar hotel setup";
}

function getFoodTradeoff(source: TripScenario, candidate: TripScenario) {
  if (candidate.diningPlan.dailyBudgetPerTraveler > source.diningPlan.dailyBudgetPerTraveler) {
    return "a stronger food plan";
  }

  if (candidate.diningPlan.dailyBudgetPerTraveler < source.diningPlan.dailyBudgetPerTraveler) {
    return "less spent on food each day";
  }

  return "a similar food plan";
}

function getActivityTradeoff(source: TripScenario, candidate: TripScenario) {
  if (candidate.activities.length > source.activities.length) {
    return "more paid activities";
  }

  if (candidate.activities.length < source.activities.length) {
    return "fewer paid activities";
  }

  return "a similar activity mix";
}

function formatPriceDelta(priceDelta: number) {
  return priceDelta < 0
    ? `save ${Math.abs(priceDelta).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`
    : `spend ${Math.abs(priceDelta).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} more`;
}

function buildAlternativeSummary(
  kind: ScenarioAlternative["kind"],
  source: TripScenario,
  candidate: TripScenario,
  priceDelta: number
) {
  if (kind === "save-money") {
    return `This version helps you ${formatPriceDelta(priceDelta)} with ${getFlightTradeoff(source, candidate)}, ${getHotelTradeoff(source, candidate)}, and ${getActivityTradeoff(source, candidate)}.`;
  }

  if (kind === "easier-for-parents") {
    return `This version makes the trip easier with ${getFlightTradeoff(source, candidate)}, less walking pressure, and ${getHotelTradeoff(source, candidate)}.`;
  }

  return `This version leans into comfort with ${getHotelTradeoff(source, candidate)}, ${getFoodTradeoff(source, candidate)}, and ${getActivityTradeoff(source, candidate)}.`;
}

function buildAlternativeHeading(kind: ScenarioAlternative["kind"]) {
  if (kind === "save-money") return "Save money";
  if (kind === "easier-for-parents") return "Easier for parents";
  return "Better hotel and food";
}

function buildAlternative(
  kind: ScenarioAlternative["kind"],
  source: TripScenario,
  candidate: TripScenario,
  input: PlannerInput
): ScenarioAlternative {
  const changes = buildTradeoffChanges(source.featureVector, candidate.featureVector);
  const priceDelta = candidate.cost.totalTripCost - source.cost.totalTripCost;

  return {
    kind,
    heading: buildAlternativeHeading(kind),
    scenarioId: candidate.id,
    label: candidate.label,
    summary: buildAlternativeSummary(kind, source, candidate, priceDelta),
    priceDelta,
    distance: Number(calculateWeightedDistance(source.featureVector, candidate.featureVector, input).toFixed(3)),
    changes
  };
}

function sortByDistance(source: TripScenario, candidates: TripScenario[], input: PlannerInput) {
  return [...candidates].sort(
    (left, right) =>
      calculateWeightedDistance(source.featureVector, left.featureVector, input) -
      calculateWeightedDistance(source.featureVector, right.featureVector, input)
  );
}

function buildScenarioAlternatives(scenario: TripScenario, scenarios: TripScenario[], input: PlannerInput) {
  const cheaperCandidates = sortByDistance(
    scenario,
    scenarios.filter((candidate) => candidate.id !== scenario.id && candidate.cost.totalTripCost < scenario.cost.totalTripCost),
    input
  );
  const easierCandidates = sortByDistance(
    scenario,
    scenarios.filter(
      (candidate) =>
        candidate.id !== scenario.id &&
        candidate.featureVector.transitConvenience >= scenario.featureVector.transitConvenience &&
        candidate.featureVector.familyFriendliness >= scenario.featureVector.familyFriendliness &&
        (candidate.cost.totalTripCost !== scenario.cost.totalTripCost || candidate.featureVector.transitConvenience !== scenario.featureVector.transitConvenience)
    ),
    input
  );
  const comfortCandidates = sortByDistance(
    scenario,
    scenarios.filter(
      (candidate) =>
        candidate.id !== scenario.id &&
        (candidate.featureVector.comfort > scenario.featureVector.comfort || candidate.featureVector.foodQuality > scenario.featureVector.foodQuality)
    ),
    input
  );

  const requested = [
    cheaperCandidates[0] ? buildAlternative("save-money", scenario, cheaperCandidates[0], input) : null,
    easierCandidates[0] ? buildAlternative("easier-for-parents", scenario, easierCandidates[0], input) : null,
    comfortCandidates[0] ? buildAlternative("better-hotel-and-food", scenario, comfortCandidates[0], input) : null
  ].filter((item): item is ScenarioAlternative => Boolean(item));

  const unique: ScenarioAlternative[] = [];
  for (const alternative of requested) {
    const duplicateScenario = unique.some((item) => item.scenarioId === alternative.scenarioId);
    const nearlySamePrice = unique.some((item) => Math.abs(item.priceDelta - alternative.priceDelta) < 150);
    if (duplicateScenario || nearlySamePrice) continue;
    unique.push(alternative);
  }

  return unique;
}

export function attachScenarioSimilarity(scenarios: TripScenario[], input: PlannerInput) {
  return scenarios.map((scenario) => ({
    ...scenario,
    alternatives: buildScenarioAlternatives(scenario, scenarios, input)
  }));
}
