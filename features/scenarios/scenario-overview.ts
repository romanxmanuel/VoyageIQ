import { PlannerViewModel } from "@/domain/trip/types";

export function summarizeScenarioExtremes(viewModel: PlannerViewModel) {
  const cheapest = viewModel.scenarios[0];
  const richest = viewModel.scenarios[viewModel.scenarios.length - 1];

  return {
    cheapest,
    richest,
    delta: richest.cost.totalTripCost - cheapest.cost.totalTripCost
  };
}

