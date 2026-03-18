import { CostBreakdown } from "@/domain/trip/types";

interface CostInput {
  travelers: number;
  nights: number;
  airfareTotal: number;
  lodgingTotal: number;
  dailyFoodPerTraveler: number;
  activitiesTotal: number;
  transitPerDay: number;
  arrivalTransferTotal?: number;
}

export function calculateScenarioCost(input: CostInput): CostBreakdown {
  const days = Math.max(input.nights, 1);
  const foodTotal = Math.round(input.dailyFoodPerTraveler * input.travelers * days);
  const localTransitTotal = Math.round(input.transitPerDay * days);
  const arrivalTransferTotal = input.arrivalTransferTotal ?? 0;
  const subtotal =
    input.airfareTotal +
    input.lodgingTotal +
    foodTotal +
    input.activitiesTotal +
    localTransitTotal +
    arrivalTransferTotal;
  const taxesAndFees = Math.round(subtotal * 0.11);
  const contingencyBuffer = Math.round(subtotal * 0.06);
  const totalTripCost = subtotal + taxesAndFees + contingencyBuffer;

  return {
    airfareTotal: input.airfareTotal,
    lodgingTotal: input.lodgingTotal,
    foodTotal,
    activitiesTotal: input.activitiesTotal,
    localTransitTotal,
    arrivalTransferTotal,
    taxesAndFees,
    contingencyBuffer,
    totalTripCost,
    costPerTraveler: Math.round(totalTripCost / input.travelers),
    costPerDay: Math.round(totalTripCost / days)
  };
}
