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
  if (label.toLowerCase().includes("signature")) {
    return 0.92;
  }

  if (label.toLowerCase().includes("elevated")) {
    return 0.76;
  }

  if (label.toLowerCase().includes("balanced")) {
    return 0.58;
  }

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

function buildAlternativeSummary(kind: ScenarioAlternative["kind"], candidate: TripScenario, priceDelta: number, changes: TradeoffChange[]) {
  const primaryChange = changes[0];
  const direction = primaryChange.delta >= 0 ? "up" : "down";
  const priceCopy =
    priceDelta < 0 ? `saves $${Math.abs(priceDelta).toLocaleString()}` : `adds $${Math.abs(priceDelta).toLocaleString()}`;

  if (kind === "closest-cheaper") {
    return `${candidate.label} changes the least while ${priceCopy}, with the biggest shift in ${primaryChange.label} (${direction} ${Math.abs(primaryChange.delta).toFixed(2)}).`;
  }

  if (kind === "closest-premium") {
    return `${candidate.label} is the nearest more premium move, mainly shifting ${primaryChange.label} while ${priceCopy}.`;
  }

  return `${candidate.label} is the convenience-first alternative, mostly changing ${primaryChange.label} while ${priceCopy}.`;
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
    scenarioId: candidate.id,
    label: candidate.label,
    summary: buildAlternativeSummary(kind, candidate, priceDelta, changes),
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

export function attachScenarioSimilarity(scenarios: TripScenario[], input: PlannerInput) {
  return scenarios.map((scenario) => {
    const cheaperCandidates = sortByDistance(
      scenario,
      scenarios.filter((candidate) => candidate.id !== scenario.id && candidate.cost.totalTripCost < scenario.cost.totalTripCost),
      input
    );
    const premiumCandidates = sortByDistance(
      scenario,
      scenarios.filter(
        (candidate) =>
          candidate.id !== scenario.id &&
          candidate.cost.totalTripCost > scenario.cost.totalTripCost &&
          candidate.featureVector.comfort >= scenario.featureVector.comfort
      ),
      input
    );
    const convenienceCandidates = sortByDistance(
      scenario,
      scenarios.filter(
        (candidate) =>
          candidate.id !== scenario.id &&
          candidate.featureVector.transitConvenience > scenario.featureVector.transitConvenience
      ),
      input
    );

    const alternatives: ScenarioAlternative[] = [];

    if (cheaperCandidates[0]) {
      alternatives.push(buildAlternative("closest-cheaper", scenario, cheaperCandidates[0], input));
    }

    if (premiumCandidates[0]) {
      alternatives.push(buildAlternative("closest-premium", scenario, premiumCandidates[0], input));
    }

    if (convenienceCandidates[0]) {
      alternatives.push(buildAlternative("closest-convenience", scenario, convenienceCandidates[0], input));
    }

    return {
      ...scenario,
      alternatives
    };
  });
}
