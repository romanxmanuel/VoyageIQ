"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ExternalLink, Plane, UtensilsCrossed, Wallet } from "lucide-react";
import { PlannerViewModel, ScenarioAlternative, VerificationLink } from "@/domain/trip/types";
import { formatCurrency, formatDecimal } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SavePlanButton } from "@/components/planner/save-plan-button";
import { CostBreakdown } from "@/components/results/cost-breakdown";
import { ItineraryTimeline } from "@/components/results/itinerary-timeline";
import { cn } from "@/lib/utils";

interface ScenarioExplorerProps {
  viewModel: PlannerViewModel;
}

const CHANGE_LABELS: Record<string, string> = {
  costPerDay: "Lower daily spend",
  comfort: "More comfort",
  foodQuality: "Better food",
  activityDensity: "More to do",
  transitConvenience: "Easier getting around",
  familyFriendliness: "Better for families"
};

function getIntentLabel(intent?: VerificationLink["intent"]) {
  if (intent === "exact-booking") return "Best link";
  if (intent === "exact-place") return "Exact place";
  return "Compare";
}

function getActionLinkClasses(link: VerificationLink) {
  if (link.intent === "exact-booking") {
    return "border-cyan-300/40 bg-cyan-300/14 text-cyan-50 hover:border-cyan-200 hover:bg-cyan-300/18";
  }

  if (link.intent === "exact-place") {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-50 hover:border-emerald-200 hover:bg-emerald-300/14";
  }

  return "border-white/12 bg-white/6 text-slate-100 hover:border-white/25 hover:bg-white/10";
}

function ActionLink({ link, emphasized = false }: { link: VerificationLink; emphasized?: boolean }) {
  return (
    <a
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
        emphasized && "px-4 py-2.5",
        getActionLinkClasses(link)
      )}
      href={link.url}
      rel="noreferrer"
      target="_blank"
      title={link.note}
    >
      <span>{link.label}</span>
      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/70">
        {getIntentLabel(link.intent)}
      </span>
      <ExternalLink className="size-4" />
    </a>
  );
}

function formatSavingsCopy(priceDelta: number) {
  return priceDelta < 0 ? `Save ${formatCurrency(Math.abs(priceDelta))}` : `Spend ${formatCurrency(Math.abs(priceDelta))} more`;
}

function getBookingHint(link: VerificationLink) {
  if (link.intent === "exact-booking") return "Start here if you want the exact option we found.";
  if (link.intent === "exact-place") return "Open the exact place first, then compare nearby alternatives if needed.";
  return "Use this when you want to compare nearby options before booking.";
}

function getFlightPriceCopy(activeScenario: PlannerViewModel["scenarios"][number]) {
  if (activeScenario.flight.pricingSource === "public-verifier") {
    return `${formatCurrency(activeScenario.flight.totalCost)} checked total`;
  }

  if (activeScenario.flight.isLivePrice) {
    return `${formatCurrency(activeScenario.flight.totalCost)} total`;
  }

  return `${formatCurrency(activeScenario.flight.totalCost)} estimated total`;
}

function getAverageNightlyGroupCost(viewModel: PlannerViewModel, totalTripCost: number) {
  return Math.round(totalTripCost / Math.max(viewModel.input.nights, 1));
}

function buildSavingsFooter(viewModel: PlannerViewModel, activeScenario: PlannerViewModel["scenarios"][number]) {
  const bestValue = viewModel.scenarios.find((scenario) => scenario.tier === "balanced") ?? activeScenario;
  const premium = viewModel.scenarios.find((scenario) => scenario.tier === "signature") ?? activeScenario;
  const cheapest = viewModel.scenarios.reduce((best, scenario) =>
    scenario.cost.totalTripCost < best.cost.totalTripCost ? scenario : best
  );
  const recommendedScenario = activeScenario.id === premium.id ? bestValue : activeScenario;
  const compareTarget = activeScenario.id === premium.id ? premium : premium;
  const savingsAmount = Math.max(compareTarget.cost.totalTripCost - recommendedScenario.cost.totalTripCost, 0);
  const biggestLever =
    recommendedScenario.cost.airfareTotal >= recommendedScenario.cost.lodgingTotal ? "flight choice" : "hotel choice";
  const extraReason =
    biggestLever === "flight choice"
      ? "The biggest gap usually comes from a cheaper cabin and less aggressive routing."
      : "The biggest gap usually comes from a simpler hotel choice, not from cutting every meal or activity.";
  const stretchSavings = Math.max(bestValue.cost.totalTripCost - cheapest.cost.totalTripCost, 0);

  return {
    recommendedScenario,
    compareTarget,
    savingsAmount,
    biggestLever,
    extraReason,
    stretchSavings,
    bestValue,
    cheapest
  };
}

function AlternativeCard({
  alternative,
  onSelect
}: {
  alternative: ScenarioAlternative;
  onSelect: () => void;
}) {
  return (
    <button
      className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-300/25 hover:bg-white/8"
      onClick={onSelect}
      type="button"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{alternative.heading}</p>
          <p className="mt-1 font-medium text-white">{alternative.label}</p>
        </div>
        <p className="text-sm text-cyan-50">{formatSavingsCopy(alternative.priceDelta)}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{alternative.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {alternative.changes.slice(0, 3).map((change) => (
          <span
            className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-200"
            key={`${alternative.scenarioId}-${change.label}`}
          >
            {CHANGE_LABELS[change.label]}
          </span>
        ))}
      </div>
    </button>
  );
}

function DetailRow({
  title,
  detail,
  aside
}: {
  title: string;
  detail: string;
  aside?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-300">{detail}</p>
      </div>
      {aside ? <p className="shrink-0 text-sm text-slate-300">{aside}</p> : null}
    </div>
  );
}

export function ScenarioExplorer({ viewModel }: ScenarioExplorerProps) {
  const [selectedIndex, setSelectedIndex] = useState(viewModel.selectedScenarioIndex);
  const activeIndex = useDeferredValue(selectedIndex);
  const activeScenario = viewModel.scenarios[activeIndex];
  const savings = buildSavingsFooter(viewModel, activeScenario);
  const nightlyGroupCost = getAverageNightlyGroupCost(viewModel, activeScenario.cost.totalTripCost);
  const highlightDiningIds = new Set(activeScenario.diningPlan.highlights.map((spot) => spot.id).filter(Boolean));
  const extraDiningLinks = activeScenario.verification.dining.filter((link) => !link.itemId || !highlightDiningIds.has(link.itemId));

  return (
    <section className="space-y-5">
      <Card className="overflow-hidden border-cyan-300/15 bg-[linear-gradient(145deg,rgba(7,15,29,0.96),rgba(8,31,42,0.82))]">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <div className="space-y-3">
              <Badge>{viewModel.match.destination.name}</Badge>
              <CardTitle className="max-w-3xl text-3xl leading-tight sm:text-4xl">
                {viewModel.match.destination.heroTitle}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base text-slate-200">
                {viewModel.match.helperText}
              </CardDescription>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <Wallet className="size-4" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Total for everyone</span>
                </div>
                <p className="font-display text-2xl text-white">{formatCurrency(activeScenario.cost.totalTripCost)}</p>
                <p className="mt-1 text-sm text-slate-300">{formatCurrency(activeScenario.cost.costPerTraveler)} per traveler</p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <Plane className="size-4" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Flight plan</span>
                </div>
                <p className="font-display text-2xl text-white">{activeScenario.flight.cabin}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {formatDecimal(activeScenario.flight.durationHours)} hours, {activeScenario.flight.stops} stop
                  {activeScenario.flight.stops === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <UtensilsCrossed className="size-4" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Food plan</span>
                </div>
                <p className="font-display text-2xl text-white">{formatCurrency(activeScenario.diningPlan.dailyBudgetPerTraveler)}</p>
                <p className="mt-1 text-sm text-slate-300">per traveler per day</p>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-slate-950/45 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Trip style</p>
                  <p className="mt-1 font-display text-2xl text-white">{activeScenario.label}</p>
                  <p className="mt-2 max-w-2xl text-sm text-slate-300">{activeScenario.fitSummary}</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">
                  {formatCurrency(nightlyGroupCost)} average per night for the group
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  className="accent-cyan-300"
                  max={viewModel.scenarios.length - 1}
                  min={0}
                  onChange={(event) => {
                    const nextIndex = Number(event.target.value);
                    startTransition(() => setSelectedIndex(nextIndex));
                  }}
                  type="range"
                  value={selectedIndex}
                />
                <p className="text-sm text-slate-400">Slide left to save more. Slide right for better comfort, hotel quality, and easier travel.</p>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {viewModel.scenarios.map((scenario, index) => (
                  <button
                    className={cn(
                      "rounded-[18px] border px-3 py-3 text-left transition",
                      index === activeIndex
                        ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    )}
                    key={scenario.id}
                    onClick={() => startTransition(() => setSelectedIndex(index))}
                    type="button"
                  >
                    <p className="font-medium">{scenario.label}</p>
                    <p className="mt-1 text-sm">{formatCurrency(scenario.cost.totalTripCost)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Why this place works</p>
            <h3 className="mt-2 font-display text-2xl text-white">{viewModel.match.destination.regionLabel}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{viewModel.match.destination.summary}</p>
            <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
              <DetailRow title="Best travel window" detail={viewModel.match.destination.recommendedWindow} />
              <DetailRow title="Getting around" detail={viewModel.match.destination.mapNote} />
              {activeScenario.verification.destinationGuide ? (
                <div className="pt-1">
                  <ActionLink emphasized link={activeScenario.verification.destinationGuide} />
                </div>
              ) : null}
              <SavePlanButton selectedScenarioId={activeScenario.id} viewModel={viewModel} />
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]"
          exit={{ opacity: 0, y: 12 }}
          initial={{ opacity: 0, y: 12 }}
          key={activeScenario.id}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <div className="space-y-5">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trip summary</p>
                  <CardTitle className="mt-2">{activeScenario.headline}</CardTitle>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">
                  {formatCurrency(nightlyGroupCost)} average night
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">{activeScenario.fitSummary}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-emerald-300/12 bg-emerald-300/7 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">What gets better here</p>
                  <ul className="mt-3 space-y-2 text-sm text-white">
                    {activeScenario.tradeoffs.gains.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[20px] border border-amber-300/12 bg-amber-300/7 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-100/70">What you give up if you spend less</p>
                  <ul className="mt-3 space-y-2 text-sm text-white">
                    {activeScenario.tradeoffs.losses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {activeScenario.alternatives.length ? (
                <div className="mt-6 space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Other ways to shape this trip</p>
                  <div className="grid gap-3">
                    {activeScenario.alternatives.map((alternative) => {
                      const targetIndex = viewModel.scenarios.findIndex((scenario) => scenario.id === alternative.scenarioId);

                      return (
                        <AlternativeCard
                          alternative={alternative}
                          key={`${activeScenario.id}-${alternative.kind}`}
                          onSelect={() => {
                            if (targetIndex >= 0) {
                              startTransition(() => setSelectedIndex(targetIndex));
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Where the money goes</p>
                  <CardTitle>What this trip costs</CardTitle>
                </div>
                <Badge>{formatCurrency(activeScenario.cost.totalTripCost)} total</Badge>
              </div>
              <CostBreakdown
                cost={activeScenario.cost}
                hasLiveFlightPrice={Boolean(activeScenario.flight.isLivePrice)}
                flightPricingSource={activeScenario.flight.pricingSource}
              />
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Book this trip</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-[20px] border border-white/8 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-display text-xl text-white">{activeScenario.flight.airline}</h4>
                      <p className="mt-1 text-sm text-slate-300">
                        {activeScenario.flight.departWindow} departure, {activeScenario.flight.arriveWindow} arrival, layover in{" "}
                        {activeScenario.flight.layover}
                      </p>
                      <p className="mt-2 text-sm text-cyan-50">{activeScenario.flight.bookingTip}</p>
                      {activeScenario.flight.pricingSource === "public-verifier" ? (
                        <p className="mt-2 text-sm text-emerald-200">
                          This budget fare was checked against a live public compare source. Re-open the compare link to confirm the current cheapest option.
                        </p>
                      ) : !activeScenario.flight.isLivePrice ? (
                        <p className="mt-2 text-sm text-amber-200">
                          This budget flight number is an estimate. Check the live compare link below for the cheapest fare today.
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-300">{getFlightPriceCopy(activeScenario)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {activeScenario.verification.flights.map((flightLink, index) => (
                      <ActionLink emphasized={index === 0} key={flightLink.url} link={flightLink} />
                    ))}
                  </div>
                  {activeScenario.verification.flights[0] ? (
                    <p className="mt-3 text-xs text-slate-400">{getBookingHint(activeScenario.verification.flights[0])}</p>
                  ) : null}
                </div>

                <div className="rounded-[20px] border border-white/8 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{activeScenario.stay.name}</p>
                      <p className="mt-1 text-sm text-slate-300">{activeScenario.stay.address}</p>
                      <p className="mt-2 text-sm text-cyan-50">{activeScenario.stay.whyItWorks}</p>
                    </div>
                    <p className="text-sm text-slate-300">{formatCurrency(activeScenario.stay.nightlyRate)} per night</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {activeScenario.verification.lodging.map((lodgingLink, index) => (
                      <ActionLink emphasized={index === 0} key={lodgingLink.url} link={lodgingLink} />
                    ))}
                  </div>
                  {activeScenario.verification.lodging[0] ? (
                    <p className="mt-3 text-xs text-slate-400">{getBookingHint(activeScenario.verification.lodging[0])}</p>
                  ) : null}
                </div>

                <div className="divide-y divide-white/10 rounded-[20px] border border-white/8 bg-white/5 px-4">
                  {activeScenario.bookingSequence.map((item) => (
                    <div className="flex items-start gap-3 py-3" key={item}>
                      <ArrowRight className="mt-0.5 size-4 text-cyan-200" />
                      <p className="text-sm text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Arrival plan</p>
              <div className="mt-4 divide-y divide-white/10 rounded-[20px] border border-white/8 bg-white/5 px-4">
                {activeScenario.arrivalPlan.map((item) => (
                  <div className="py-3 text-sm leading-6 text-slate-200" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Places to eat</p>
                  <CardTitle>Restaurants worth checking out</CardTitle>
                </div>
                <Badge>{activeScenario.verification.dining.length} real options</Badge>
              </div>
              <div className="divide-y divide-white/10 rounded-[20px] border border-white/8 bg-white/5 px-4">
                {activeScenario.diningPlan.highlights.map((spot) => {
                  const diningLink = spot.verificationLink;

                  return (
                    <div className="flex flex-wrap items-start justify-between gap-4 py-4" key={spot.name}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{spot.name}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {spot.cuisine} · {spot.address}
                        </p>
                        <p className="mt-2 text-sm text-cyan-50">{spot.signatureOrder}</p>
                        {diningLink ? (
                          <div className="mt-3">
                            <ActionLink link={diningLink} />
                          </div>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-200">{formatCurrency(spot.estimatedPerPerson)} per traveler</p>
                    </div>
                  );
                })}
              </div>
              {extraDiningLinks.length ? (
                <div className="mt-4 rounded-[20px] border border-white/8 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">More real restaurants nearby</p>
                      <p className="mt-1 text-sm text-slate-300">
                        Pulled live from Google so you have a bigger list of real places to compare.
                      </p>
                    </div>
                    <Badge>{extraDiningLinks.length} more</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {extraDiningLinks.slice(0, 8).map((link) => (
                      <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-3" key={link.url}>
                        {link.title ? <p className="font-medium text-white">{link.title}</p> : null}
                        {link.address ? <p className="mt-1 text-sm text-slate-300">{link.address}</p> : null}
                        <p className="text-sm text-slate-200">{link.note}</p>
                        <div className="mt-3">
                          <ActionLink link={link} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Things to do</p>
                  <CardTitle>Main activities for this trip</CardTitle>
                </div>
                <Badge>{activeScenario.activities.length} picks</Badge>
              </div>
              <div className="divide-y divide-white/10 rounded-[20px] border border-white/8 bg-white/5 px-4">
                {activeScenario.activities.map((activity) => {
                  const activityLink = activity.verificationLink;

                  return (
                    <div className="flex flex-wrap items-start justify-between gap-4 py-4" key={activity.name}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{activity.name}</p>
                        <p className="mt-1 text-sm text-slate-300">{activity.address}</p>
                        <p className="mt-2 text-sm text-cyan-50">{activity.summary}</p>
                        {activityLink ? (
                          <div className="mt-3">
                            <ActionLink link={activityLink} />
                          </div>
                        ) : null}
                      </div>
                      <div className="text-right text-sm text-slate-200">
                        <p>{formatCurrency(activity.estimatedPerPerson)} per traveler</p>
                        <p>{formatDecimal(activity.durationHours)} hours</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Day-by-day plan</p>
                  <CardTitle>Your trip outline</CardTitle>
                </div>
                <Badge>{viewModel.input.nights} days</Badge>
              </div>
              <ItineraryTimeline days={activeScenario.itinerary} />
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>

      <Card className="border-cyan-300/12 bg-[linear-gradient(145deg,rgba(9,18,31,0.95),rgba(9,30,40,0.84))]">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Smart savings callout</p>
            <CardTitle className="mt-2 text-3xl">
              {savings.recommendedScenario.label} saves you {formatCurrency(savings.savingsAmount)} compared to {savings.compareTarget.label}
            </CardTitle>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {savings.recommendedScenario.label} keeps the trip strong without paying for the biggest jump in comfort and extras. {savings.extraReason}
            </p>
            <p className="mt-2 text-sm text-cyan-50">
              If you want to save even more, {savings.cheapest.label.toLowerCase()} trims about {formatCurrency(savings.stretchSavings)} off {savings.bestValue.label.toLowerCase()}.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Biggest reason</p>
              <p className="mt-2 text-sm text-white">
                Most of the savings come from your {savings.biggestLever}, not from stripping out every fun part of the trip.
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Book next</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {activeScenario.verification.flights[0] ? <ActionLink emphasized link={activeScenario.verification.flights[0]} /> : null}
                {activeScenario.verification.lodging[0] ? <ActionLink emphasized link={activeScenario.verification.lodging[0]} /> : null}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
