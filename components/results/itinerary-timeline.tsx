import { ItineraryDay } from "@/domain/trip/types";
import { formatCurrency, formatTravelTime } from "@/lib/formatters";

interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

export function ItineraryTimeline({ days }: ItineraryTimelineProps) {
  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div className="rounded-[20px] border border-white/10 bg-slate-950/30 p-4" key={day.dayNumber}>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Day {day.dayNumber}</p>
              <h4 className="font-display text-lg text-white">{day.title}</h4>
              <p className="mt-1 text-sm text-slate-300">{day.note}</p>
            </div>
            <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-medium text-cyan-50">
              {formatCurrency(day.totalEstimate)}
            </div>
          </div>

          <div className="divide-y divide-white/10 rounded-[18px] border border-white/8 bg-white/5 px-4">
            {day.stops.map((stop) => (
              <div className="grid gap-2 py-3 sm:grid-cols-[90px_1fr_auto]" key={`${day.dayNumber}-${stop.slot}`}>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{stop.slot}</div>
                <div>
                  <p className="font-medium text-white">{stop.title}</p>
                  <p className="text-sm text-slate-300">{stop.location}</p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p>{formatCurrency(stop.cost)}</p>
                  <p>{formatTravelTime(stop.travelMinutes)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
