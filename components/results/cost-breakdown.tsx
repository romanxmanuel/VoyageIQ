import { CostBreakdown as CostBreakdownType } from "@/domain/trip/types";
import { formatCurrency } from "@/lib/formatters";

interface CostBreakdownProps {
  cost: CostBreakdownType;
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

export function CostBreakdown({ cost }: CostBreakdownProps) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div className="flex items-center justify-between text-sm text-slate-300" key={row.key}>
          <span>{row.label}</span>
          <span className="font-medium text-white">{formatCurrency(cost[row.key])}</span>
        </div>
      ))}
      <p className="text-xs text-white/40 mt-2">Prices are live and may change at time of booking.</p>
    </div>
  );
}

