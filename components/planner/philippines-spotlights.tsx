"use client";

import { DestinationSpotlight } from "@/domain/trip/types";
import { buildBookingSearchUrl, buildFlightSearchUrl, buildYouTubeSearchUrl } from "@/lib/travel-links";

interface PhilippinesSpotlightsProps {
  origin: string;
  spots: DestinationSpotlight[];
}

export function PhilippinesSpotlights({ origin, spots }: PhilippinesSpotlightsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Philippines discovery</p>
        <h3 className="font-display text-2xl text-white">Explore the spots people love watching first</h3>
        <p className="text-sm leading-6 text-slate-300">
          These cards are built for fast inspiration: watch the place, open the tourism guide, then jump straight into flights and stays.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {spots.map((spot) => (
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5" key={spot.slug}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl text-white">{spot.name}</p>
                <p className="text-sm text-slate-400">{spot.country}</p>
              </div>
              {spot.airportCode ? (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-50">
                  {spot.airportCode}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{spot.summary}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a
                className="text-cyan-50 underline underline-offset-4"
                href={buildYouTubeSearchUrl(`${spot.name} Philippines travel vlog`)}
                rel="noreferrer"
                target="_blank"
              >
                Watch on YouTube
              </a>
              {spot.tourismUrl ? (
                <a className="text-cyan-50 underline underline-offset-4" href={spot.tourismUrl} rel="noreferrer" target="_blank">
                  Tourism guide
                </a>
              ) : null}
              {spot.airportCode ? (
                <a
                  className="text-cyan-50 underline underline-offset-4"
                  href={buildFlightSearchUrl(origin, spot.airportCode)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Flights
                </a>
              ) : null}
              <a
                className="text-cyan-50 underline underline-offset-4"
                href={buildBookingSearchUrl(spot.name, spot.country)}
                rel="noreferrer"
                target="_blank"
              >
                Stays
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
