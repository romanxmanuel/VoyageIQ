import { CostBreakdown as CostBreakdownType } from "@/domain/trip/types";
import { formatCurrency } from "@/lib/formatters";

interface CostBreakdownProps {
  cost: CostBreakdownType;
}

const rows: Array<{ key: keyof CostBreakdownType; label: string }> = [
  { key: "airfareTotal", label: "Flights" },
  { key: "lodgingTotal", label: "Stay" },
  { key: "foodTotal", label: "Food" },
  { key: "activitiesTotal", label: "Activities" },
  { key: "localTransitTotal", label: "Local transit" },
  { key: "taxesAndFees", label: "Taxes and fees" },
  { key: "contingencyBuffer", label: "Flex buffer" }
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
    </div>
  );
}

