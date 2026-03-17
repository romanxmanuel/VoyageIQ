"use client";

import { FormEvent, useDeferredValue, useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { DestinationSpotlight, DestinationSuggestion, PlannerInput } from "@/domain/trip/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDestinationSearch } from "@/features/search/use-destination-search";
import { cn } from "@/lib/utils";

interface TripIntakeFormProps {
  featuredDestinations: DestinationSpotlight[];
  philippinesSpotlights: DestinationSpotlight[];
  initialInput: PlannerInput;
  destinationError?: string | null;
}

function getSuggestionBadge(suggestion: DestinationSuggestion) {
  if (suggestion.source === "google") {
    return "Verified place";
  }

  return "VoyageIQ pick";
}

export function TripIntakeForm({
  featuredDestinations,
  philippinesSpotlights,
  initialInput,
  destinationError
}: TripIntakeFormProps) {
  const [destination, setDestination] = useState(initialInput.destinationQuery);
  const [destinationInput, setDestinationInput] = useState(initialInput.destinationQuery);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DestinationSuggestion | null>(
    initialInput.destinationQuery
      ? {
          placeId: initialInput.resolvedDestinationPlaceId ?? `initial:${initialInput.destinationQuery}`,
          description: initialInput.resolvedDestinationCountry
            ? `${initialInput.destinationQuery}, ${initialInput.resolvedDestinationCountry}`
            : initialInput.destinationQuery,
          mainText: initialInput.resolvedDestinationLabel ?? initialInput.destinationQuery,
          secondaryText: initialInput.resolvedDestinationCountry ?? "",
          country: initialInput.resolvedDestinationCountry,
          iataCode: initialInput.resolvedDestinationAirportCode ?? null,
          source: (initialInput.resolvedDestinationSource as DestinationSuggestion["source"]) ?? "seeded",
        }
      : null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFamilyMode, setShowFamilyMode] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
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

  const exactPrediction = useMemo(
    () =>
      predictions.find((prediction) => prediction.mainText.toLowerCase() === destinationInput.trim().toLowerCase()) ?? null,
    [predictions, destinationInput]
  );

  const resolvedSuggestion = selectedSuggestion ?? exactPrediction;
  const formError = clientError ?? destinationError ?? null;

  function applyDestinationSelection(nextSelection: DestinationSuggestion) {
    setSelectedSuggestion(nextSelection);
    setDestinationInput(nextSelection.mainText);
    setDestination(nextSelection.mainText);
    setClientError(null);
    setShowSuggestions(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!resolvedSuggestion && destinationInput.trim()) {
      event.preventDefault();
      setClientError("Choose a real place from the list so VoyageIQ can verify the destination before building the trip.");
      setShowSuggestions(true);
      return;
    }

    setClientError(null);
  }

  return (
    <Card className="relative overflow-hidden border-cyan-300/15 bg-[linear-gradient(145deg,rgba(6,12,24,0.92),rgba(8,26,39,0.86))]">
      <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[radial-gradient(circle_at_top_right,rgba(101,245,212,0.18),transparent_58%)] lg:block" />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge>Plan Your Trip</Badge>
            <CardTitle className="max-w-2xl text-3xl leading-tight sm:text-4xl">
              Tell VoyageIQ where you want to go and who is coming.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base text-slate-200">
              You will get a few trip options, a day-by-day plan, and real links to check flights, stays, food, and activities.
            </CardDescription>
          </div>

          <form action="/" className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-200">Where do you want to go?</span>
              <div className="relative">
                <input
                  autoComplete="off"
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45"
                  name="destination"
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setDestinationInput(nextValue);
                    setDestination(nextValue);
                    setClientError(null);
                    if (selectedSuggestion && selectedSuggestion.mainText !== nextValue) {
                      setSelectedSuggestion(null);
                    }
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Any city, beach, or country..."
                  type="text"
                  value={destinationInput}
                />
                <input type="hidden" name="destinationLabel" value={resolvedSuggestion?.mainText ?? ""} />
                <input type="hidden" name="destinationPlaceId" value={resolvedSuggestion?.placeId ?? ""} />
                <input type="hidden" name="destinationSource" value={resolvedSuggestion?.source ?? ""} />
                <input type="hidden" name="destinationAirportCode" value={resolvedSuggestion?.iataCode ?? ""} />
                <input type="hidden" name="destinationCountry" value={resolvedSuggestion?.country ?? resolvedSuggestion?.secondaryText ?? ""} />

                {showSuggestions && (predictions.length > 0 || destinationInput.trim().length >= 2) ? (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#081019] shadow-lg">
                    {predictions.length ? (
                      <ul className="max-h-56 overflow-y-auto">
                        {predictions.map((prediction) => (
                          <li
                            className="cursor-pointer border-b border-white/6 px-4 py-3 last:border-b-0 hover:bg-white/6"
                            key={prediction.placeId}
                            onMouseDown={() => applyDestinationSelection(prediction)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-white">{prediction.mainText}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {prediction.secondaryText || prediction.description}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                                    prediction.source === "google"
                                      ? "border-emerald-300/25 bg-emerald-300/12 text-emerald-100"
                                      : "border-cyan-300/25 bg-cyan-300/12 text-cyan-100"
                                  )}
                                >
                                  {getSuggestionBadge(prediction)}
                                </span>
                                {prediction.iataCode ? (
                                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                                    {prediction.iataCode}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-start gap-3 px-4 py-3 text-sm text-slate-300">
                        <AlertCircle className="mt-0.5 size-4 text-amber-200" />
                        <p>No verified places found yet. Try a more specific city, island, or country name.</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {resolvedSuggestion ? (
                  <span className="inline-flex items-center gap-2 text-emerald-100">
                    <CheckCircle2 className="size-4" />
                    {resolvedSuggestion.source === "google" ? "Verified real place selected" : "Curated VoyageIQ destination selected"}
                  </span>
                ) : (
                  <span className="text-slate-400">Pick a real place from the list so VoyageIQ can verify it before building the trip.</span>
                )}
              </div>

              {formError ? <p className="text-sm leading-6 text-amber-200">{formError}</p> : null}
            </label>

            {showPhilippinesSpotSelector ? (
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">Top spots in the Philippines</span>
                <select
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/45"
                  onChange={(event) => {
                    if (event.target.value) {
                      const selectedSpot = philippinesSpotlights.find((spot) => spot.name === event.target.value);
                      if (selectedSpot) {
                        applyDestinationSelection({
                          placeId: `spot:${selectedSpot.slug}`,
                          description: `${selectedSpot.name}, ${selectedSpot.country}`,
                          mainText: selectedSpot.name,
                          secondaryText: selectedSpot.country,
                          country: selectedSpot.country,
                          iataCode: selectedSpot.airportCode ?? null,
                          source: "seeded",
                        });
                      }
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
                  If you are thinking about the Philippines, this lets you jump straight to popular spots.
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
              <span className="text-sm font-medium text-slate-200">How many days?</span>
              <input
                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/45"
                defaultValue={initialInput.nights}
                max={30}
                min={3}
                name="nights"
                type="number"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">When do you want to leave? (optional)</span>
              <input
                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/45"
                defaultValue={initialInput.departureDate ?? ""}
                min={new Date().toISOString().split("T")[0]}
                name="departureDate"
                type="date"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Total budget (optional)</span>
              <input
                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45"
                min={500}
                name="budgetCap"
                placeholder="e.g. 4000"
                step={100}
                type="number"
              />
              <p className="mt-1 text-xs text-white/40">For everyone together</p>
            </div>

            <div className="rounded-lg border border-white/10 p-4 sm:col-span-2">
              <button
                className="flex w-full items-center justify-between text-left text-sm font-medium text-white/70 transition-colors hover:text-white"
                onClick={() => setShowFamilyMode(!showFamilyMode)}
                type="button"
              >
                <span>Need an easier trip for parents or travelers who do not want a lot of walking?</span>
                <span className="text-white/40">{showFamilyMode ? "−" : "+"}</span>
              </button>
              {showFamilyMode ? (
                <div className="mt-3 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
                    <input className="accent-white" name="preferDirectFlights" type="checkbox" value="true" />
                    Keep flights easier
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
                    <input className="accent-white" name="preferLocalFood" type="checkbox" value="true" />
                    Focus more on local food
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
                    <input className="accent-white" name="lowWalkingIntensity" type="checkbox" value="true" />
                    Keep walking to a minimum
                  </label>
                </div>
              ) : null}
            </div>

            <div className="flex items-end sm:col-span-2">
              <Button className="w-full sm:w-auto" type="submit">
                Show my trip options &#x2192;
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
                    applyDestinationSelection({
                      placeId: `featured:${destinationOption.slug}`,
                      description: `${destinationOption.name}, ${destinationOption.country}`,
                      mainText: destinationOption.name,
                      secondaryText: destinationOption.country,
                      country: destinationOption.country,
                      iataCode: destinationOption.airportCode ?? null,
                      source: "seeded",
                    });
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
                    applyDestinationSelection({
                      placeId: `philippines:${spot.slug}`,
                      description: `${spot.name}, ${spot.country}`,
                      mainText: spot.name,
                      secondaryText: spot.country,
                      country: spot.country,
                      iataCode: spot.airportCode ?? null,
                      source: "seeded",
                    });
                  }}
                  type="button"
                >
                  {spot.name}
                </button>
              ))}
            </div>
          ) : null}

          <p className="mt-4 text-xs text-slate-400">
            {isPending ? "Updating destination..." : "You start simple, and VoyageIQ fills in the rest."}
          </p>
        </div>
      </div>
    </Card>
  );
}
