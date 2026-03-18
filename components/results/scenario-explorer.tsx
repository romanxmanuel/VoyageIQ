"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Link,
  Plane,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Wallet
} from "lucide-react";
import {
  PlannerViewModel,
  ScenarioAlternative,
  TravelIntel,
  VerificationLink
} from "@/domain/trip/types";
import { formatCurrency, formatDecimal } from "@/lib/formatters";
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

const TIER_STYLES: Record<
  string,
  {
    border: string;
    activeBorder: string;
    bg: string;
    activeBg: string;
    pill: string;
    dot: string;
  }
> = {
  lean: {
    border: "border-slate-600/30",
    activeBorder: "border-slate-400/50",
    bg: "bg-slate-800/20",
    activeBg: "bg-slate-700/25",
    pill: "border-slate-400/30 bg-slate-700/30 text-slate-300",
    dot: "bg-slate-400"
  },
  balanced: {
    border: "border-cyan-400/25",
    activeBorder: "border-cyan-400/60",
    bg: "bg-cyan-900/15",
    activeBg: "bg-cyan-400/12",
    pill: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    dot: "bg-cyan-400"
  },
  elevated: {
    border: "border-indigo-400/25",
    activeBorder: "border-indigo-400/55",
    bg: "bg-indigo-900/15",
    activeBg: "bg-indigo-400/10",
    pill: "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
    dot: "bg-indigo-400"
  },
  signature: {
    border: "border-amber-400/25",
    activeBorder: "border-amber-400/55",
    bg: "bg-amber-900/12",
    activeBg: "bg-amber-400/10",
    pill: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400"
  }
};

function getTierStyle(tier: string) {
  return TIER_STYLES[tier] ?? TIER_STYLES.balanced;
}

function getIntentLabel(intent?: VerificationLink["intent"]) {
  if (intent === "exact-booking") return "Best link";
  if (intent === "exact-place") return "Exact place";
  return "Compare";
}

function getActionLinkClasses(link: VerificationLink) {
  if (link.intent === "exact-booking")
    return "border-cyan-400/40 bg-cyan-400/12 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/18";
  if (link.intent === "exact-place")
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100 hover:border-emerald-300 hover:bg-emerald-400/14";
  return "border-white/12 bg-white/6 text-slate-200 hover:border-white/22 hover:bg-white/10";
}

function ActionLink({
  link,
  emphasized = false
}: {
  link: VerificationLink;
  emphasized?: boolean;
}) {
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
      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/60">
        {getIntentLabel(link.intent)}
      </span>
      <ExternalLink className="size-3.5" />
    </a>
  );
}

function formatSavingsCopy(priceDelta: number) {
  return priceDelta < 0
    ? `Save ${formatCurrency(Math.abs(priceDelta))}`
    : `+${formatCurrency(Math.abs(priceDelta))}`;
}

function getBookingHint(link: VerificationLink) {
  if (link.intent === "exact-booking")
    return "Start here if you want the exact option we found.";
  if (link.intent === "exact-place")
    return "Open the exact place first, then compare nearby alternatives if needed.";
  return "Use this when you want to compare nearby options before booking.";
}

function getFlightPriceCopy(activeScenario: PlannerViewModel["scenarios"][number]) {
  if (activeScenario.flight.pricingSource === "public-verifier")
    return `${formatCurrency(activeScenario.flight.totalCost)} checked total`;
  if (activeScenario.flight.isLivePrice)
    return `${formatCurrency(activeScenario.flight.totalCost)} total`;
  return `${formatCurrency(activeScenario.flight.totalCost)} estimated total`;
}

function buildSavingsFooter(
  viewModel: PlannerViewModel,
  activeScenario: PlannerViewModel["scenarios"][number]
) {
  const bestValue =
    viewModel.scenarios.find((s) => s.tier === "balanced") ?? activeScenario;
  const premium =
    viewModel.scenarios.find((s) => s.tier === "signature") ?? activeScenario;
  const cheapest = viewModel.scenarios.reduce((best, s) =>
    s.cost.totalTripCost < best.cost.totalTripCost ? s : best
  );
  const recommendedScenario =
    activeScenario.id === premium.id ? bestValue : activeScenario;
  const compareTarget = premium;
  const savingsAmount = Math.max(
    compareTarget.cost.totalTripCost - recommendedScenario.cost.totalTripCost,
    0
  );
  const biggestLever =
    recommendedScenario.cost.airfareTotal >= recommendedScenario.cost.lodgingTotal
      ? "flight choice"
      : "hotel choice";
  const extraReason =
    biggestLever === "flight choice"
      ? "The biggest gap usually comes from a cheaper cabin and less aggressive routing."
      : "The biggest gap usually comes from a simpler hotel choice, not from cutting every meal or activity.";
  const stretchSavings = Math.max(
    bestValue.cost.totalTripCost - cheapest.cost.totalTripCost,
    0
  );
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
      className="rounded-[18px] border border-white/9 bg-white/4 p-4 text-left transition hover:border-cyan-400/22 hover:bg-white/7"
      onClick={onSelect}
      type="button"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {alternative.heading}
          </p>
          <p className="mt-1 text-sm font-medium text-white">{alternative.label}</p>
        </div>
        <p
          className={cn(
            "text-sm font-medium",
            alternative.priceDelta < 0 ? "text-emerald-400" : "text-amber-400"
          )}
        >
          {formatSavingsCopy(alternative.priceDelta)}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{alternative.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {alternative.changes.slice(0, 3).map((change) => (
          <span
            className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-slate-400"
            key={`${alternative.scenarioId}-${change.label}`}
          >
            {CHANGE_LABELS[change.label]}
          </span>
        ))}
      </div>
    </button>
  );
}

function TravelIntelCard({ intel }: { intel: TravelIntel }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass rounded-[24px] p-6">
      <button
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
            <Globe className="size-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Travel intel</p>
            <p
              className="mt-0.5 font-display text-base font-bold text-white"
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              Know before you go
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-slate-500 transition" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-500 transition" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="mt-5 divide-y divide-white/8 rounded-2xl border border-white/9 bg-white/4 px-5">
              {(
                [
                  { label: "Best time to visit", value: intel.bestMonths },
                  { label: "Visa", value: intel.visaNote },
                  { label: "Currency", value: intel.currency },
                  { label: "Getting around", value: intel.transitTip },
                  { label: "Airport & arrival", value: intel.arrivalNote }
                ] as const
              ).map(({ label, value }) => (
                <div key={label} className="py-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ScenarioExplorer({ viewModel }: ScenarioExplorerProps) {
  const [selectedIndex, setSelectedIndex] = useState(viewModel.selectedScenarioIndex);
  const [copied, setCopied] = useState(false);
  const activeIndex = useDeferredValue(selectedIndex);
  const activeScenario = viewModel.scenarios[activeIndex];
  const savings = buildSavingsFooter(viewModel, activeScenario);

  function handleCopyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("tier", activeScenario.tier);
    window.history.replaceState(null, "", url.toString());
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  const nightlyGroupCost = Math.round(
    activeScenario.cost.totalTripCost / Math.max(viewModel.input.nights, 1)
  );
  const tierStyle = getTierStyle(activeScenario.tier);
  const highlightDiningIds = new Set(
    activeScenario.diningPlan.highlights.map((spot) => spot.id).filter(Boolean)
  );
  const extraDiningLinks = activeScenario.verification.dining.filter(
    (link) => !link.itemId || !highlightDiningIds.has(link.itemId)
  );

  return (
    <section className="space-y-5">
      {/* ── Hero card: destination + scenario switcher ── */}
      <div className="glass rounded-[28px] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {/* Destination header */}
            <div>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {viewModel.match.destination.name}
              </span>
              <h2
                className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                {viewModel.match.destination.heroTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-7 text-slate-400">
                {viewModel.match.helperText}
              </p>
            </div>

            {/* 3 stat cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/9 bg-white/5 p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <Wallet className="size-3.5 text-cyan-400" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Total cost
                  </span>
                </div>
                <p
                  className="font-display text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                  {formatCurrency(activeScenario.cost.totalTripCost)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatCurrency(activeScenario.cost.costPerTraveler)} per traveler
                </p>
              </div>

              <div className="rounded-2xl border border-white/9 bg-white/5 p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <Plane className="size-3.5 text-cyan-400" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Flight
                  </span>
                </div>
                <p
                  className="font-display text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                  {activeScenario.flight.cabin}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDecimal(activeScenario.flight.durationHours)} hrs ·{" "}
                  {activeScenario.flight.stops} stop
                  {activeScenario.flight.stops === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/9 bg-white/5 p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <UtensilsCrossed className="size-3.5 text-cyan-400" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Food / day
                  </span>
                </div>
                <p
                  className="font-display text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                  {formatCurrency(activeScenario.diningPlan.dailyBudgetPerTraveler)}
                </p>
                <p className="mt-1 text-xs text-slate-500">per traveler per day</p>
              </div>
            </div>

            {/* Scenario switcher */}
            <div className="rounded-[22px] border border-white/9 bg-white/4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Trip style
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block size-2 rounded-full",
                        tierStyle.dot
                      )}
                    />
                    <p
                      className="font-display text-xl font-bold text-white"
                      style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                    >
                      {activeScenario.label}
                    </p>
                  </div>
                  <p className="mt-1.5 max-w-xl text-sm text-slate-400">
                    {activeScenario.fitSummary}
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs text-slate-400">
                  {formatCurrency(nightlyGroupCost)} avg / night
                </div>
              </div>

              {/* Slider */}
              <div className="mt-5 space-y-2">
                <input
                  max={viewModel.scenarios.length - 1}
                  min={0}
                  onChange={(event) => {
                    const nextIndex = Number(event.target.value);
                    startTransition(() => setSelectedIndex(nextIndex));
                  }}
                  type="range"
                  value={selectedIndex}
                />
                <p className="text-xs text-slate-600">
                  Slide left to save more. Slide right for better comfort and quality.
                </p>
              </div>

              {/* Tier tab buttons */}
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {viewModel.scenarios.map((scenario, index) => {
                  const ts = getTierStyle(scenario.tier);
                  const isActive = index === activeIndex;
                  return (
                    <button
                      className={cn(
                        "rounded-[16px] border px-3 py-3.5 text-left transition",
                        isActive
                          ? `${ts.activeBorder} ${ts.activeBg}`
                          : `${ts.border} ${ts.bg} hover:border-white/20 hover:bg-white/8`
                      )}
                      key={scenario.id}
                      onClick={() => startTransition(() => setSelectedIndex(index))}
                      type="button"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-block size-1.5 rounded-full transition",
                            isActive ? ts.dot : "bg-slate-600"
                          )}
                        />
                        <p className={cn("text-xs font-semibold", isActive ? "text-white" : "text-slate-400")}>
                          {scenario.label}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "mt-1.5 font-display text-base font-bold",
                          isActive ? "text-white" : "text-slate-500"
                        )}
                        style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                      >
                        {formatCurrency(scenario.cost.totalTripCost)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: destination context */}
          <div className="rounded-[22px] border border-white/9 bg-white/4 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Why this place works
            </p>
            <h3
              className="mt-2 font-display text-xl font-bold text-white"
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {viewModel.match.destination.regionLabel}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {viewModel.match.destination.summary}
            </p>
            <div className="mt-5 space-y-0 border-t border-white/8 pt-4">
              <div className="flex items-start justify-between gap-4 border-b border-white/6 py-3">
                <p className="text-xs text-slate-500">Best travel window</p>
                <p className="text-right text-xs font-medium text-slate-200">
                  {viewModel.match.destination.recommendedWindow}
                </p>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <p className="text-xs text-slate-500">Getting around</p>
                <p className="text-right text-xs font-medium text-slate-200">
                  {viewModel.match.destination.mapNote}
                </p>
              </div>
              {activeScenario.verification.destinationGuide ? (
                <div className="pt-1">
                  <ActionLink emphasized link={activeScenario.verification.destinationGuide} />
                </div>
              ) : null}
              <div className="pt-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
                  onClick={handleCopyLink}
                  type="button"
                >
                  <Link className="size-3.5" />
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Animated detail sections ── */}
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          key={activeScenario.id}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* ── LEFT column ── */}
          <div className="space-y-5">
            {/* Trip summary + tradeoffs */}
            <div className="glass rounded-[24px] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Trip summary
                  </p>
                  <h3
                    className="mt-2 font-display text-xl font-bold text-white"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {activeScenario.headline}
                  </h3>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                    tierStyle.pill
                  )}
                >
                  {activeScenario.tier}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">{activeScenario.fitSummary}</p>

              {/* Tradeoffs */}
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/14 bg-emerald-900/10 p-4">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-400/80">
                    <TrendingUp className="size-3.5" />
                    What gets better
                  </p>
                  <ul className="mt-3 space-y-2">
                    {activeScenario.tradeoffs.gains.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-200">
                        <span className="mt-0.5 shrink-0 text-emerald-400">↑</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-amber-400/14 bg-amber-900/10 p-4">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-amber-400/80">
                    <TrendingDown className="size-3.5" />
                    What you give up going cheaper
                  </p>
                  <ul className="mt-3 space-y-2">
                    {activeScenario.tradeoffs.losses.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-0.5 shrink-0 text-amber-400">↓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Alternatives */}
              {activeScenario.alternatives.length ? (
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Other ways to shape this trip
                  </p>
                  <div className="grid gap-2.5">
                    {activeScenario.alternatives.map((alternative) => {
                      const targetIndex = viewModel.scenarios.findIndex(
                        (s) => s.id === alternative.scenarioId
                      );
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
            </div>

            {/* Cost breakdown */}
            <div className="glass rounded-[24px] p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Where the money goes
                  </p>
                  <h3
                    className="mt-1 font-display text-xl font-bold text-white"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    Cost breakdown
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-300">
                  {formatCurrency(activeScenario.cost.totalTripCost)} total
                </span>
              </div>
              <CostBreakdown
                cost={activeScenario.cost}
                hasLiveFlightPrice={Boolean(activeScenario.flight.isLivePrice)}
                flightPricingSource={activeScenario.flight.pricingSource}
              />
            </div>

            {/* Booking section */}
            <div className="glass rounded-[24px] p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Book this trip
              </p>
              <div className="mt-4 space-y-4">
                {/* Flight */}
                <div className="rounded-2xl border border-white/9 bg-white/4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4
                        className="font-display text-lg font-bold text-white"
                        style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                      >
                        {activeScenario.flight.airline}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                          {activeScenario.flight.cabin}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                          {activeScenario.flight.isLivePrice
                            ? "Live"
                            : activeScenario.flight.pricingSource === "public-verifier"
                            ? "Verified"
                            : "Estimated"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {activeScenario.flight.departWindow} depart ·{" "}
                        {activeScenario.flight.arriveWindow} arrive · layover in{" "}
                        {activeScenario.flight.layover}
                      </p>
                      <p className="mt-2 text-sm text-cyan-300">{activeScenario.flight.bookingTip}</p>
                      {activeScenario.flight.pricingSource === "public-verifier" ? (
                        <p className="mt-2 text-xs text-emerald-300">
                          Budget fare checked against a live compare source. Re-open the link to confirm today&apos;s cheapest.
                        </p>
                      ) : !activeScenario.flight.isLivePrice ? (
                        <p className="mt-2 text-xs text-amber-300">
                          Estimated fare. Check the live compare link below for today&apos;s price.
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-medium text-slate-300">
                      {getFlightPriceCopy(activeScenario)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {activeScenario.verification.flights.map((flightLink, index) => (
                      <ActionLink emphasized={index === 0} key={flightLink.url} link={flightLink} />
                    ))}
                  </div>
                  {activeScenario.verification.flights[0] ? (
                    <p className="mt-3 text-[11px] text-slate-600">
                      {getBookingHint(activeScenario.verification.flights[0])}
                    </p>
                  ) : null}
                </div>

                {/* Lodging */}
                <div className="rounded-2xl border border-white/9 bg-white/4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{activeScenario.stay.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{activeScenario.stay.address}</p>
                      <p className="mt-2 text-sm text-cyan-300">{activeScenario.stay.whyItWorks}</p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-slate-300">
                      {formatCurrency(activeScenario.stay.nightlyRate)} / night
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {activeScenario.verification.lodging.map((lodgingLink, index) => (
                      <ActionLink
                        emphasized={index === 0}
                        key={lodgingLink.url}
                        link={lodgingLink}
                      />
                    ))}
                  </div>
                  {activeScenario.verification.lodging[0] ? (
                    <p className="mt-3 text-[11px] text-slate-600">
                      {getBookingHint(activeScenario.verification.lodging[0])}
                    </p>
                  ) : null}
                </div>

                {/* Booking sequence */}
                <div className="divide-y divide-white/8 rounded-2xl border border-white/9 bg-white/4 px-5">
                  {activeScenario.bookingSequence.map((item) => (
                    <div className="flex items-start gap-3 py-3.5" key={item}>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-cyan-400/60" />
                      <p className="text-sm text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT column ── */}
          <div className="space-y-5">
            {/* Arrival plan */}
            <div className="glass rounded-[24px] p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Arrival plan</p>
              <div className="mt-4 divide-y divide-white/8 rounded-2xl border border-white/9 bg-white/4 px-5">
                {activeScenario.arrivalPlan.map((item) => (
                  <div className="py-3.5 text-sm leading-6 text-slate-300" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Dining */}
            <div className="glass rounded-[24px] p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Places to eat
                  </p>
                  <h3
                    className="mt-1 font-display text-xl font-bold text-white"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    Restaurants worth checking out
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-300">
                  {activeScenario.verification.dining.length} picks
                </span>
              </div>
              <div className="divide-y divide-white/8 rounded-2xl border border-white/9 bg-white/4 px-5">
                {activeScenario.diningPlan.highlights.map((spot) => {
                  const diningLink = spot.verificationLink;
                  return (
                    <div
                      className="flex flex-wrap items-start justify-between gap-4 py-5"
                      key={spot.name}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{spot.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {spot.cuisine} · {spot.address}
                        </p>
                        <p className="mt-2 text-sm text-cyan-300">{spot.signatureOrder}</p>
                        {diningLink ? (
                          <div className="mt-3">
                            <ActionLink link={diningLink} />
                          </div>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-medium text-slate-300">
                        {formatCurrency(spot.estimatedPerPerson)} / person
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Extra dining links */}
              {extraDiningLinks.length ? (
                <div className="mt-4 rounded-2xl border border-white/9 bg-white/4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        More real restaurants nearby
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Pulled live from Google for a bigger list to compare.
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-300">
                      {extraDiningLinks.length} more
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {extraDiningLinks.slice(0, 8).map((link) => (
                      <div
                        className="rounded-[18px] border border-white/9 bg-slate-950/30 p-3.5"
                        key={link.url}
                      >
                        {link.title ? (
                          <p className="text-sm font-medium text-white">{link.title}</p>
                        ) : null}
                        {link.address ? (
                          <p className="mt-1 text-xs text-slate-500">{link.address}</p>
                        ) : null}
                        <p className="mt-1 text-sm text-slate-400">{link.note}</p>
                        <div className="mt-3">
                          <ActionLink link={link} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Activities */}
            <div className="glass rounded-[24px] p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Things to do
                  </p>
                  <h3
                    className="mt-1 font-display text-xl font-bold text-white"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    Main activities
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-300">
                  {activeScenario.activities.length} picks
                </span>
              </div>
              <div className="divide-y divide-white/8 rounded-2xl border border-white/9 bg-white/4 px-5">
                {activeScenario.activities.map((activity) => {
                  const activityLink = activity.verificationLink;
                  return (
                    <div
                      className="flex flex-wrap items-start justify-between gap-4 py-5"
                      key={activity.name}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{activity.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{activity.address}</p>
                        <p className="mt-2 text-sm text-cyan-300">{activity.summary}</p>
                        {activityLink ? (
                          <div className="mt-3">
                            <ActionLink link={activityLink} />
                          </div>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right text-sm text-slate-300">
                        <p>{formatCurrency(activity.estimatedPerPerson)} / person</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDecimal(activity.durationHours)} hours
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Travel Intel */}
            {viewModel.match.destination.venues?.travelIntel ? (
              <TravelIntelCard intel={viewModel.match.destination.venues.travelIntel} />
            ) : null}

            {/* Day-by-day itinerary */}
            <div className="glass rounded-[24px] p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Day-by-day plan
                  </p>
                  <h3
                    className="mt-1 font-display text-xl font-bold text-white"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    Your trip outline
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-300">
                  {viewModel.input.nights} days
                </span>
              </div>
              <ItineraryTimeline days={activeScenario.itinerary} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Smart savings callout ── */}
      <div className="glass rounded-[24px] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Smart savings
            </p>
            <h3
              className="mt-2 font-display text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {savings.recommendedScenario.label} saves you{" "}
              {formatCurrency(savings.savingsAmount)} vs.{" "}
              {savings.compareTarget.label}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {savings.recommendedScenario.label} keeps the trip strong without paying for the biggest jump in comfort and extras.{" "}
              {savings.extraReason}
            </p>
            <p className="mt-2 text-sm text-cyan-300">
              If you want to save even more,{" "}
              {savings.cheapest.label.toLowerCase()} trims about{" "}
              {formatCurrency(savings.stretchSavings)} off{" "}
              {savings.bestValue.label.toLowerCase()}.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/9 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Biggest lever
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Most of the savings come from your{" "}
                <span className="font-medium text-white">{savings.biggestLever}</span>, not from cutting every fun part of the trip.
              </p>
            </div>
            <div className="rounded-2xl border border-white/9 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Book next
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {activeScenario.verification.flights[0] ? (
                  <ActionLink emphasized link={activeScenario.verification.flights[0]} />
                ) : null}
                {activeScenario.verification.lodging[0] ? (
                  <ActionLink emphasized link={activeScenario.verification.lodging[0]} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
