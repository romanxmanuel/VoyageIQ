"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ExternalLink, Plane, UtensilsCrossed, Wallet } from "lucide-react";
import { PlannerViewModel, VerificationLink } from "@/domain/trip/types";
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

const TIER_DISPLAY_NAMES: Record<string, string> = {
  lean: "Budget",
  balanced: "Best Value",
  elevated: "Comfortable",
  signature: "Splurge",
};

const CHANGE_LABELS: Record<string, string> = {
  costPerDay: "Price/day",
  comfort: "Comfort",
  foodQuality: "Food",
  activityDensity: "Activities",
  transitConvenience: "Transit",
  familyFriendliness: "Family fit"
};

function ActionLink({ link }: { link: VerificationLink }) {
  return (
    <a
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
        link.direct
          ? "border-cyan-300/40 bg-cyan-300/14 text-cyan-50 hover:border-cyan-200 hover:bg-cyan-300/18"
          : "border-white/12 bg-white/6 text-slate-100 hover:border-white/25 hover:bg-white/10"
      )}
      href={link.url}
      rel="noreferrer"
      target="_blank"
      title={link.note}
    >
      <span>{link.label}</span>
      <ExternalLink className="size-4" />
    </a>
  );
}

export function ScenarioExplorer({ viewModel }: ScenarioExplorerProps) {
  const [selectedIndex, setSelectedIndex] = useState(viewModel.selectedScenarioIndex);
  const activeIndex = useDeferredValue(selectedIndex);
  const activeScenario = viewModel.scenarios[activeIndex];

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-cyan-300/15 bg-[linear-gradient(145deg,rgba(7,15,29,0.96),rgba(8,31,42,0.82))]">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex items-center gap-3 text-cyan-100">
                  <Wallet className="size-5" />
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Trip total</span>
                </div>
                <p className="font-display text-3xl text-white">{formatCurrency(activeScenario.cost.totalTripCost)}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {formatCurrency(activeScenario.cost.costPerTraveler)} per traveler
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex items-center gap-3 text-cyan-100">
                  <Plane className="size-5" />
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Flight shape</span>
                </div>
                <p className="font-display text-3xl text-white">{activeScenario.flight.cabin}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {formatDecimal(activeScenario.flight.durationHours)} hours with {activeScenario.flight.stops} stop
                  {activeScenario.flight.stops === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex items-center gap-3 text-cyan-100">
                  <UtensilsCrossed className="size-5" />
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Food budget</span>
                </div>
                <p className="font-display text-3xl text-white">
                  {formatCurrency(activeScenario.diningPlan.dailyBudgetPerTraveler)}
                </p>
                <p className="mt-2 text-sm text-slate-300">Per traveler, per day, in the active scenario</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Tradeoff slider</p>
                  <p className="font-display text-2xl text-white">{activeScenario.label}</p>
                </div>
                <div className="max-w-md text-right">
                  <p className="text-sm text-slate-300">{activeScenario.fitSummary}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cyan-100/80">
                    Rule score {activeScenario.ruleScore}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Hard constraints and rule-based scoring come first. Distance only helps surface the nearest alternative.
                  </p>
                </div>
              </div>

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

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {viewModel.scenarios.map((scenario, index) => (
                  <button
                    className={cn(
                      "rounded-[20px] border px-4 py-3 text-left transition",
                      index === activeIndex
                        ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    )}
                    key={scenario.id}
                    onClick={() => startTransition(() => setSelectedIndex(index))}
                    type="button"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{TIER_DISPLAY_NAMES[scenario.tier] ?? scenario.label}</p>
                    <p className="mt-1 font-medium">{scenario.label}</p>
                    <p className="mt-2 text-sm">{formatCurrency(scenario.cost.totalTripCost)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Why this match works</p>
            <h3 className="mt-2 font-display text-2xl text-white">{viewModel.match.destination.regionLabel}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{viewModel.match.destination.summary}</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Best travel window</p>
                <p className="mt-2 text-sm text-white">{viewModel.match.destination.recommendedWindow}</p>
              </div>
              {activeScenario.verification.destinationGuide ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Official tourism guide</p>
                  <div className="mt-3">
                    <ActionLink link={activeScenario.verification.destinationGuide} />
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Local movement</p>
                <p className="mt-2 text-sm text-white">{viewModel.match.destination.mapNote}</p>
              </div>
              <SavePlanButton selectedScenarioId={activeScenario.id} viewModel={viewModel} />
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]"
          exit={{ opacity: 0, y: 12 }}
          initial={{ opacity: 0, y: 12 }}
          key={activeScenario.id}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <div className="space-y-6">
            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scenario summary</p>
                  <CardTitle>{activeScenario.headline}</CardTitle>
                </div>
                <Badge>{formatCurrency(activeScenario.cost.costPerDay)} / day</Badge>
              </div>
              <p className="mb-6 text-sm leading-6 text-slate-300">{activeScenario.fitSummary}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-300/12 bg-emerald-300/7 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">What you get</p>
                  <ul className="mt-3 space-y-2 text-sm text-white">
                    {activeScenario.tradeoffs.gains.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-amber-300/12 bg-amber-300/7 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-100/70">What you give up</p>
                  <ul className="mt-3 space-y-2 text-sm text-white">
                    {activeScenario.tradeoffs.losses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {activeScenario.alternatives.length ? (
                <div className="mt-6 space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Closest alternatives</p>
                  <div className="grid gap-3">
                    {activeScenario.alternatives.map((alternative) => {
                      const targetIndex = viewModel.scenarios.findIndex((scenario) => scenario.id === alternative.scenarioId);

                      return (
                        <button
                          key={`${activeScenario.id}-${alternative.kind}`}
                          className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-300/25 hover:bg-white/8"
                          onClick={() => {
                            if (targetIndex >= 0) {
                              startTransition(() => setSelectedIndex(targetIndex));
                            }
                          }}
                          type="button"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                {alternative.kind.replace(/-/g, " ")}
                              </p>
                              <p className="mt-1 font-medium text-white">{alternative.label}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-cyan-50">
                                {alternative.priceDelta < 0 ? "Save" : "Spend"} {formatCurrency(Math.abs(alternative.priceDelta))}
                              </p>
                              <p className="text-xs text-slate-400">distance {alternative.distance.toFixed(3)}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-300">{alternative.summary}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {alternative.changes.map((change) => (
                              <span
                                className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-50"
                                key={`${alternative.scenarioId}-${change.label}`}
                              >
                                {CHANGE_LABELS[change.label]} {change.delta >= 0 ? "+" : ""}
                                {change.delta.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cost anatomy</p>
                  <CardTitle>Every displayed total is traceable</CardTitle>
                </div>
                <Badge>{formatCurrency(activeScenario.cost.totalTripCost)}</Badge>
              </div>
              <CostBreakdown cost={activeScenario.cost} />
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">How to book this trip</p>
              <div className="mt-3 space-y-4">
                <div>
                  <h4 className="font-display text-xl text-white">{activeScenario.flight.airline}</h4>
                  <p className="text-sm text-slate-300">
                    {activeScenario.flight.departWindow} departure, {activeScenario.flight.arriveWindow} arrival, layover in{" "}
                    {activeScenario.flight.layover}
                  </p>
                  <p className="mt-2 text-sm text-cyan-50">{activeScenario.flight.bookingTip}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {activeScenario.verification.flights.map((flightLink) => (
                      <ActionLink key={flightLink.url} link={flightLink} />
                    ))}
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">{activeScenario.stay.name}</p>
                  <p className="mt-1 text-sm text-slate-300">{activeScenario.stay.address}</p>
                  <p className="mt-2 text-sm text-cyan-50">{activeScenario.stay.whyItWorks}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {activeScenario.verification.lodging.map((lodgingLink) => (
                      <ActionLink key={lodgingLink.url} link={lodgingLink} />
                    ))}
                  </div>
                </div>
                <div className="grid gap-3">
                  {activeScenario.bookingSequence.map((item) => (
                    <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-4" key={item}>
                      <ArrowRight className="mt-0.5 size-4 text-cyan-200" />
                      <p className="text-sm text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Your first day</p>
              <div className="mt-4 space-y-3">
                {activeScenario.arrivalPlan.map((item) => (
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm leading-6 text-slate-200" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dining verification</p>
                  <CardTitle>Real food spots to inspect</CardTitle>
                </div>
                <Badge>{activeScenario.diningPlan.highlights.length} picks</Badge>
              </div>
              <div className="space-y-3">
                {activeScenario.diningPlan.highlights.map((spot) => {
                  const diningLink = spot.verificationLink;

                  return (
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4" key={spot.name}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">{spot.name}</p>
                          <p className="mt-1 text-sm text-slate-300">
                            {spot.cuisine} • {spot.address}
                          </p>
                          <p className="mt-2 text-sm text-cyan-50">{spot.signatureOrder}</p>
                        </div>
                        <div className="text-right text-sm text-slate-200">
                          <p>{formatCurrency(spot.estimatedPerPerson)} pp</p>
                          {diningLink ? (
                            <div className="mt-2">
                              <ActionLink link={diningLink} />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dining and activities</p>
                  <CardTitle>What the family is actually doing</CardTitle>
                </div>
                <Badge>{activeScenario.activities.length} anchors</Badge>
              </div>
              <div className="space-y-3">
                {activeScenario.activities.map((activity) => {
                  const activityLink = activity.verificationLink;

                  return (
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4" key={activity.name}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
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
                          <p>{formatCurrency(activity.estimatedPerPerson)} pp</p>
                          <p>{formatDecimal(activity.durationHours)} hr</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Day-by-day flow</p>
                  <CardTitle>Planned itinerary rhythm</CardTitle>
                </div>
                <Badge>{viewModel.input.nights} nights</Badge>
              </div>
              <ItineraryTimeline days={activeScenario.itinerary} />
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
