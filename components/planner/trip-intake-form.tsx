"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { DestinationSpotlight, PlannerInput } from "@/domain/trip/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDestinationSearch } from "@/features/search/use-destination-search";
import { cn } from "@/lib/utils";

interface TripIntakeFormProps {
  featuredDestinations: DestinationSpotlight[];
  philippinesSpotlights: DestinationSpotlight[];
  initialInput: PlannerInput;
}

export function TripIntakeForm({ featuredDestinations, philippinesSpotlights, initialInput }: TripIntakeFormProps) {
  const [destination, setDestination] = useState(initialInput.destinationQuery);
  const [destinationInput, setDestinationInput] = useState(initialInput.destinationQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFamilyMode, setShowFamilyMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { predictions } = useDestinationSearch(destinationInput);
  const deferredDestination = useDeferredValue(destination);
  const normalizedDestination = deferredDestination.toLowerCase().trim();
  const isPhilippinesSpot = philippinesSpotlights.some((spot) => spot.name.toLowerCase() === normalizedDestination);
  const showPhilippinesSpotSelector = normalizedDestination.includes("philippines") || isPhilippinesSpot;

  const spotlight =
    featuredDestinations.find((item) => item.name.toLowerCase().includes(normalizedDestination)) ||
    (isPhilippinesSpot ? featuredDestinations[0] : null) ||
    featuredDestinations[0];

  return (
    <Card className="relative overflow-hidden border-cyan-300/15 bg-[linear-gradient(145deg,rgba(6,12,24,0.92),rgba(8,26,39,0.86))]">
      <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[radial-gradient(circle_at_top_right,rgba(101,245,212,0.18),transparent_58%)] lg:block" />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge>Trip Strategy Intake</Badge>
            <CardTitle className="max-w-2xl text-3xl leading-tight sm:text-4xl">
              Start with the destination, trip length, and family size. VoyageIQ handles the rest.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base text-slate-200">
              The planner turns minimal input into four coherent trip scenarios, then shows what you gain and lose as cost changes.
            </CardDescription>
          </div>

          <form action="/" className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-200">Where do you want to go?</span>
              <div className="relative">
                <input
                  type="text"
                  name="destination"
                  value={destinationInput}
                  onChange={(e) => {
                    setDestinationInput(e.target.value);
                    setDestination(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Any city, beach, or country..."
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45"
                />
                {showSuggestions && predictions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-black border border-white/10 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {predictions.map((p) => (
                      <li
                        key={p.placeId}
                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm"
                        onMouseDown={() => {
                          setDestinationInput(p.mainText);
                          setDestination(p.mainText);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-medium">{p.mainText}</span>
                        {p.secondaryText && (
                          <span className="text-white/40 ml-2 text-xs">{p.secondaryText}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>

            {showPhilippinesSpotSelector ? (
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">Top spots in the Philippines</span>
                <select
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/45"
                  onChange={(event) => {
                    if (event.target.value) {
                      setDestinationInput(event.target.value);
                      setDestination(event.target.value);
                    }
                  }}
                  value={philippinesSpotlights.some((spot) => spot.name === destination) ? destination : ""}
                >
                  <option value="">Pick a Philippines spot...</option>
                  {philippinesSpotlights.map((spot) => (
                    <option key={spot.slug} value={spot.name}>
                      {spot.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm leading-6 text-slate-400">
                  Boracay is the default match for Philippines, but you can switch to El Nido, Bohol, Siargao, Cebu, Manila, or beyond.
                </p>
              </label>
            ) : null}

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Flying from</span>
              <input
                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45"
                defaultValue={initialInput.origin}
                name="origin"
                placeholder="Orlando"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Travelers</span>
              <input
                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/45"
                defaultValue={initialInput.travelers}
                max={12}
                min={1}
                name="travelers"
                type="number"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Trip length (days)</span>
              <input
                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/45"
                defaultValue={initialInput.nights}
                max={14}
                min={3}
                name="nights"
                type="number"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Your total budget (optional)</span>
              <input
                type="number"
                name="budgetCap"
                min={500}
                step={100}
                placeholder="e.g. 4000"
                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45"
              />
              <p className="text-xs text-white/40 mt-1">Total USD for the whole trip</p>
            </div>

            <div className="border border-white/10 rounded-lg p-4 sm:col-span-2">
              <button
                type="button"
                onClick={() => setShowFamilyMode(!showFamilyMode)}
                className="w-full text-left text-sm font-medium flex justify-between items-center text-white/70 hover:text-white transition-colors"
              >
                <span>Planning for older or less-mobile travelers?</span>
                <span className="text-white/40">{showFamilyMode ? "−" : "+"}</span>
              </button>
              {showFamilyMode && (
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <input type="checkbox" name="preferDirectFlights" value="true" className="accent-white" />
                    Prefer direct or single-connection flights
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <input type="checkbox" name="preferLocalFood" value="true" className="accent-white" />
                    Prioritize authentic local food, not tourist restaurants
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <input type="checkbox" name="lowWalkingIntensity" value="true" className="accent-white" />
                    Avoid long walking days (max 3km/day)
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-end sm:col-span-2">
              <Button className="w-full sm:w-auto" type="submit">
                Find real trips with live prices &#x2192;
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3">
            {featuredDestinations.map((destinationOption) => (
              <button
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  destinationOption.name === spotlight.name
                    ? "border-cyan-300/40 bg-cyan-300/14 text-cyan-50"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                )}
                key={destinationOption.slug}
                onClick={() =>
                  startTransition(() => {
                    setDestinationInput(destinationOption.name);
                    setDestination(destinationOption.name);
                  })
                }
                type="button"
              >
                {destinationOption.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-slate-950/45 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-300/14 p-2 text-cyan-100">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl text-white">{spotlight.name}</p>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-300">{spotlight.summary}</p>

          {showPhilippinesSpotSelector ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {philippinesSpotlights.map((spot) => (
                <button
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    destination === spot.name
                      ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-50"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                  )}
                  key={spot.slug}
                  onClick={() => {
                    setDestinationInput(spot.name);
                    setDestination(spot.name);
                  }}
                  type="button"
                >
                  {spot.name}
                </button>
              ))}
            </div>
          ) : null}

          <p className="mt-4 text-xs text-slate-400">
            {isPending ? "Switching destination spotlight..." : "VoyageIQ keeps the intake light, then expands into tradeoffs."}
          </p>
        </div>
      </div>
    </Card>
  );
}
