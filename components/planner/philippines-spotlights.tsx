"use client";

import { DestinationSpotlight } from "@/domain/trip/types";
import { buildBookingSearchUrl, buildFlightSearchUrl, buildYouTubeSearchUrl } from "@/lib/travel-links";

interface PhilippinesSpotlightsProps {
  origin: string;
  spots: DestinationSpotlight[];
}

function ActionChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/12 hover:text-cyan-50"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}

export function PhilippinesSpotlights({ origin, spots }: PhilippinesSpotlightsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Philippines ideas</p>
          <h3 className="font-display text-lg text-white sm:text-xl">Quick places to browse</h3>
        </div>
        <p className="max-w-lg text-xs text-slate-300 sm:text-sm">
          Watch, compare, then jump into flights or stays.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {spots.map((spot) => (
          <div className="rounded-[18px] border border-white/10 bg-white/5 p-3.5" key={spot.slug}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-white">{spot.name}</p>
                <p className="text-xs text-slate-400">{spot.country}</p>
              </div>
              {spot.airportCode ? (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-50">
                  {spot.airportCode}
                </span>
              ) : null}
            </div>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{spot.summary}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <ActionChip href={buildYouTubeSearchUrl(`${spot.name} Philippines travel vlog`)} label="Watch" />
              {spot.tourismUrl ? <ActionChip href={spot.tourismUrl} label="Guide" /> : null}
              {spot.airportCode ? <ActionChip href={buildFlightSearchUrl(origin, spot.airportCode)} label="Flights" /> : null}
              <ActionChip href={buildBookingSearchUrl(spot.name, spot.country)} label="Stays" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
