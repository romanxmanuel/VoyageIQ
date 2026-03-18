"use client";

import { FormEvent, useDeferredValue, useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { PhilippinesSpotlights } from "@/components/planner/philippines-spotlights";
import { DestinationSpotlight, DestinationSuggestion, PlannerInput } from "@/domain/trip/types";
import { useDestinationSearch } from "@/features/search/use-destination-search";
import { cn } from "@/lib/utils";

interface TripIntakeFormProps {
  featuredDestinations: DestinationSpotlight[];
  philippinesSpotlights: DestinationSpotlight[];
  initialInput: PlannerInput;
  destinationError?: string | null;
}

function getSuggestionBadge(suggestion: DestinationSuggestion) {
  if (suggestion.source === "google") return "Verified";
  return "VoyageIQ pick";
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/45 focus:bg-white/7";

const labelClass = "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500";

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
          source: (initialInput.resolvedDestinationSource as DestinationSuggestion["source"]) ?? "seeded"
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
  const isPhilippinesSpot = philippinesSpotlights.some(
    (spot) => spot.name.toLowerCase() === normalizedDestination
  );
  const showPhilippinesSpotSelector =
    normalizedDestination.includes("philippines") || isPhilippinesSpot;
  const defaultSpotlight =
    featuredDestinations.find((item) => item.name.toLowerCase() !== "philippines") ??
    featuredDestinations[0];

  const spotlight =
    featuredDestinations.find((item) => item.name.toLowerCase().includes(normalizedDestination)) ||
    (showPhilippinesSpotSelector ? featuredDestinations[0] : null) ||
    defaultSpotlight;

  const exactPrediction = useMemo(
    () =>
      predictions.find(
        (prediction) =>
          prediction.mainText.toLowerCase() === destinationInput.trim().toLowerCase()
      ) ?? null,
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
      setClientError(
        "Choose a real place from the list so VoyageIQ can verify the destination before building the trip."
      );
      setShowSuggestions(true);
      return;
    }
    setClientError(null);
  }

  return (
    <div className="glass rounded-[28px] p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        {/* ── LEFT: form ── */}
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400/70">
              Plan your trip
            </p>
            <h2
              className="mt-2 font-display text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              Where do you want to go?
            </h2>
          </div>

          <form action="/" className="space-y-4" onSubmit={handleSubmit}>
            {/* ── Destination ── */}
            <div className="space-y-1.5">
              <label className={labelClass}>Destination</label>
              <div className="relative">
                <input
                  autoComplete="off"
                  className={inputClass}
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
                  placeholder="Any city, beach, or country…"
                  type="text"
                  value={destinationInput}
                />
                {/* Hidden fields — backend requires these */}
                <input type="hidden" name="destinationLabel" value={resolvedSuggestion?.mainText ?? ""} />
                <input type="hidden" name="destinationPlaceId" value={resolvedSuggestion?.placeId ?? ""} />
                <input type="hidden" name="destinationSource" value={resolvedSuggestion?.source ?? ""} />
                <input
                  type="hidden"
                  name="destinationAirportCode"
                  value={resolvedSuggestion?.iataCode ?? ""}
                />
                <input
                  type="hidden"
                  name="destinationCountry"
                  value={
                    resolvedSuggestion?.country ??
                    resolvedSuggestion?.secondaryText ??
                    ""
                  }
                />

                {/* Autocomplete dropdown */}
                {showSuggestions &&
                  (predictions.length > 0 || destinationInput.trim().length >= 2) ? (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1829] shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                    {predictions.length ? (
                      <ul className="max-h-56 overflow-y-auto">
                        {predictions.map((prediction) => (
                          <li
                            className="cursor-pointer border-b border-white/6 px-4 py-3 last:border-b-0 hover:bg-white/5"
                            key={prediction.placeId}
                            onMouseDown={() => applyDestinationSelection(prediction)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {prediction.mainText}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {prediction.secondaryText || prediction.description}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em]",
                                    prediction.source === "google"
                                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                      : "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
                                  )}
                                >
                                  {getSuggestionBadge(prediction)}
                                </span>
                                {prediction.iataCode ? (
                                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-slate-400">
                                    {prediction.iataCode}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-start gap-3 px-4 py-3 text-sm text-slate-400">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                        <p>
                          No verified places found yet. Try a more specific city, island, or
                          country name.
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Verification status */}
              <div className="flex items-center gap-2 text-xs">
                {resolvedSuggestion ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    {resolvedSuggestion.source === "google"
                      ? "Verified place"
                      : "Curated VoyageIQ destination"}
                  </span>
                ) : (
                  <span className="text-slate-600">
                    Pick from the list to verify before building the trip.
                  </span>
                )}
              </div>

              {formError ? (
                <p className="text-xs leading-5 text-amber-400">{formError}</p>
              ) : null}
            </div>

            {/* ── Philippines spot selector ── */}
            {showPhilippinesSpotSelector ? (
              <div className="space-y-1.5">
                <label className={labelClass}>Top spots in the Philippines</label>
                <select
                  className={inputClass}
                  onChange={(event) => {
                    if (event.target.value) {
                      const selectedSpot = philippinesSpotlights.find(
                        (spot) => spot.name === event.target.value
                      );
                      if (selectedSpot) {
                        applyDestinationSelection({
                          placeId: `spot:${selectedSpot.slug}`,
                          description: `${selectedSpot.name}, ${selectedSpot.country}`,
                          mainText: selectedSpot.name,
                          secondaryText: selectedSpot.country,
                          country: selectedSpot.country,
                          iataCode: selectedSpot.airportCode ?? null,
                          source: "seeded"
                        });
                      }
                    }
                  }}
                  value={
                    philippinesSpotlights.some((spot) => spot.name === destination)
                      ? destination
                      : ""
                  }
                >
                  <option value="">Pick a Philippines spot…</option>
                  {philippinesSpotlights.map((spot) => (
                    <option key={spot.slug} value={spot.name}>
                      {spot.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* ── Row 2: Flying from + Travelers + Nights ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Flying from</label>
                <input
                  className={inputClass}
                  defaultValue={initialInput.origin}
                  name="origin"
                  placeholder="Orlando"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Travelers</label>
                <input
                  className={inputClass}
                  defaultValue={initialInput.travelers}
                  max={12}
                  min={1}
                  name="travelers"
                  type="number"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Nights</label>
                <input
                  className={inputClass}
                  defaultValue={initialInput.nights}
                  max={30}
                  min={3}
                  name="nights"
                  type="number"
                />
              </div>
            </div>

            {/* ── Row 3: Date + Budget ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass}>Departure date (optional)</label>
                <input
                  className={inputClass}
                  defaultValue={initialInput.departureDate ?? ""}
                  min={new Date().toISOString().split("T")[0]}
                  name="departureDate"
                  type="date"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Total budget (optional)</label>
                <input
                  className={inputClass}
                  min={500}
                  name="budgetCap"
                  placeholder="e.g. 4000 — for everyone"
                  step={100}
                  type="number"
                />
              </div>
            </div>

            {/* ── Family / accessibility toggle ── */}
            <div className="rounded-2xl border border-white/8 bg-white/4">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setShowFamilyMode(!showFamilyMode)}
                type="button"
              >
                <span className="text-sm text-slate-400">
                  Need an easier trip for parents or low-mobility travelers?
                </span>
                {showFamilyMode ? (
                  <ChevronUp className="size-4 shrink-0 text-slate-500" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-slate-500" />
                )}
              </button>
              {showFamilyMode ? (
                <div className="space-y-3 border-t border-white/8 px-5 pb-4 pt-3">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                    <input className="accent-cyan-400" name="preferDirectFlights" type="checkbox" value="true" />
                    Keep flights easier (fewer stops)
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                    <input className="accent-cyan-400" name="preferLocalFood" type="checkbox" value="true" />
                    Focus more on local food options
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                    <input className="accent-cyan-400" name="lowWalkingIntensity" type="checkbox" value="true" />
                    Keep walking to a minimum
                  </label>
                </div>
              ) : null}
            </div>

            {/* ── Submit ── */}
            <button
              className="w-full rounded-2xl bg-[linear-gradient(135deg,#65f5d4_0%,#14b8a6_55%,#0f766e_100%)] py-4 text-sm font-semibold text-slate-950 shadow-[0_16px_48px_rgba(20,184,166,0.3)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              type="submit"
            >
              Build my trip plan →
            </button>
          </form>

          {/* ── Quick-select chips ── */}
          <div className="flex flex-wrap gap-2">
            {featuredDestinations.map((destinationOption) => (
              <button
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition",
                  destinationOption.name === spotlight?.name
                    ? "border-cyan-400/40 bg-cyan-400/12 text-cyan-200"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/18 hover:bg-white/8 hover:text-slate-300"
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
                      source: "seeded"
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

        {/* ── RIGHT: destination spotlight ── */}
        <div className="space-y-4">
          <div className="rounded-[22px] border border-white/9 bg-white/4 p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Destination spotlight
            </p>
            <p
              className="mt-2 font-display text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {spotlight?.name ?? "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {spotlight?.country ?? ""}
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-400">{spotlight?.summary ?? ""}</p>

            {/* Tourism link */}
            {spotlight?.tourismUrl ? (
              <div className="mt-5 border-t border-white/8 pt-4">
                <a
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/8 hover:text-slate-200"
                  href={spotlight.tourismUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Official tourism guide ↗
                </a>
              </div>
            ) : null}

            {showPhilippinesSpotSelector ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {philippinesSpotlights.map((spot) => (
                  <button
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      destination === spot.name
                        ? "border-cyan-400/38 bg-cyan-400/12 text-cyan-200"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/18 hover:bg-white/8"
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
                        source: "seeded"
                      });
                    }}
                    type="button"
                  >
                    {spot.name}
                  </button>
                ))}
              </div>
            ) : null}

            <p className="mt-4 text-[11px] leading-5 text-slate-600">
              {isPending
                ? "Updating destination…"
                : showPhilippinesSpotSelector
                  ? "Use the Philippines hub when you want island-first options from one entry point."
                  : "VoyageIQ fills in everything else — flights, hotels, food, and a day-by-day plan."}
            </p>
          </div>

          {/* Philippines spotlights panel */}
          {showPhilippinesSpotSelector ? (
            <div className="rounded-[22px] border border-white/9 bg-white/4 p-4">
              <PhilippinesSpotlights origin={initialInput.origin} spots={philippinesSpotlights} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
