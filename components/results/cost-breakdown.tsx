import { CostBreakdown as CostBreakdownType } from "@/domain/trip/types";
import { formatCurrency } from "@/lib/formatters";

interface CostBreakdownProps {
  cost: CostBreakdownType;
  hasLiveFlightPrice?: boolean;
  flightPricingSource?: "seeded" | "travelpayouts" | "amadeus" | "public-verifier";
}

const rows: Array<{ key: keyof CostBreakdownType; label: string }> = [
  { key: "airfareTotal", label: "Flights" },
  { key: "lodgingTotal", label: "Hotels" },
  { key: "foodTotal", label: "Food" },
  { key: "activitiesTotal", label: "Activities" },
  { key: "localTransitTotal", label: "Local transport" },
  { key: "taxesAndFees", label: "Taxes & fees" },
  { key: "contingencyBuffer", label: "Contingency buffer" }
];

export function CostBreakdown({
  cost,
  hasLiveFlightPrice = false,
  flightPricingSource = "seeded"
}: CostBreakdownProps) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div className="flex items-center justify-between text-sm text-slate-300" key={row.key}>
          <span>{row.label}</span>
          <span className="font-medium text-white">{formatCurrency(cost[row.key])}</span>
        </div>
      ))}
      {cost.arrivalTransferTotal > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Airport transfers</span>
          <span className="font-medium text-white">{formatCurrency(cost.arrivalTransferTotal)}</span>
        </div>
      )}
      <p className="mt-2 text-xs text-white/40">
        {flightPricingSource === "public-verifier"
          ? "Budget flight pricing was checked against a live public compare source. Verify the final fare on the compare link before booking."
          : hasLiveFlightPrice
          ? "Flight pricing is live for this route and may still change at booking."
          : "Flight pricing is an estimate for this route. Use the compare link to check the current cheapest fare before booking."}
      </p>
    </div>
  );
}

