import { PlaneTakeoff } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { TripIntakeForm } from "@/components/planner/trip-intake-form";
import { ScenarioExplorer } from "@/components/results/scenario-explorer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDefaultPlannerInput, parsePlannerSearchParams } from "@/features/search/planner-input";
import {
  buildPlannerViewModel,
  DestinationResolutionError,
  getPlannerLandingData
} from "@/server/services/build-planner-view-model";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const plannerInput = parsePlannerSearchParams(resolvedSearchParams);
  const landingData = getPlannerLandingData();
  let viewModel = null;
  let destinationError: string | null = null;

  if (plannerInput) {
    try {
      viewModel = await buildPlannerViewModel(plannerInput);
    } catch (error) {
      if (error instanceof DestinationResolutionError) {
        destinationError = error.message;
      } else {
        throw error;
      }
    }
  }

  return (
    <div className="relative">
      {/* ── CINEMATIC HERO (landing only) ── */}
      {!viewModel && (
        <section className="relative flex min-h-[90vh] flex-col overflow-hidden px-5 sm:px-8">
          {/* Ambient light blobs */}
          <div className="pointer-events-none absolute left-[-80px] top-[-40px] h-[560px] w-[560px] rounded-full bg-cyan-400/9 blur-[130px]" />
          <div className="pointer-events-none absolute right-[-60px] top-[60px] h-[380px] w-[380px] rounded-full bg-amber-400/7 blur-[110px]" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[800px] -translate-x-1/2 bg-cyan-400/4 blur-[120px]" />

          {/* Nav strip */}
          <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between py-7">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-cyan-400/12 p-2">
                <PlaneTakeoff className="size-4 text-cyan-400" />
              </div>
              <span
                className="font-display text-[17px] font-extrabold tracking-tight text-white"
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                VoyageIQ
              </span>
            </div>
            <div className="hidden items-center gap-6 sm:flex">
              <span className="text-sm text-slate-500">Trip strategy engine</span>
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Beta
              </span>
            </div>
          </div>

          {/* Hero content grid */}
          <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center lg:grid lg:grid-cols-[1fr_440px] lg:items-center lg:gap-14">
            {/* LEFT — massive type + copy */}
            <div className="space-y-8">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/60"
              >
                Constraint-aware travel optimizer
              </p>

              <div className="leading-none">
                <h1
                  className="font-display font-black"
                  style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                  <span
                    className="block text-outlined"
                    style={{
                      fontSize: "clamp(68px, 10.5vw, 148px)",
                      lineHeight: 0.88
                    }}
                  >
                    VOYAGE
                  </span>
                  <span
                    className="block text-white"
                    style={{
                      fontSize: "clamp(68px, 10.5vw, 148px)",
                      lineHeight: 0.88
                    }}
                  >
                    IQ
                  </span>
                </h1>
              </div>

              <p className="max-w-[480px] text-lg leading-8 text-slate-300">
                Tell VoyageIQ where you want to go and who is coming. Get a full
                trip plan across four budget tiers — with real flights, hotels,
                restaurants, and a day-by-day itinerary.
              </p>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  "4 trip tiers",
                  "Live flight prices",
                  "Real booking links",
                  "Day-by-day plan"
                ].map((stat) => (
                  <span
                    key={stat}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-400"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT — floating preview card */}
            <div className="mt-12 lg:mt-0">
              <div className="glass rounded-[28px] p-7 shadow-[0_48px_100px_rgba(0,0,0,0.45)]">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Sample plan preview
                  </p>
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    Best value
                  </span>
                </div>

                <p
                  className="font-display text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                  Bali, Indonesia
                </p>
                <p className="mt-1 text-sm text-slate-500">10 nights · 2 travelers · from Orlando</p>

                <div className="mt-6 space-y-0">
                  <div className="flex justify-between border-t border-white/7 py-3">
                    <span className="text-sm text-slate-500">Flights (economy)</span>
                    <span className="text-sm font-medium text-slate-200">$1,420 total</span>
                  </div>
                  <div className="flex justify-between border-t border-white/7 py-3">
                    <span className="text-sm text-slate-500">Hotel</span>
                    <span className="text-sm font-medium text-slate-200">$68 / night</span>
                  </div>
                  <div className="flex justify-between border-t border-white/7 py-3">
                    <span className="text-sm text-slate-500">Food</span>
                    <span className="text-sm font-medium text-slate-200">$28 / day each</span>
                  </div>
                  <div className="flex justify-between border-t border-white/7 py-3">
                    <span className="text-sm text-slate-500">Activities</span>
                    <span className="text-sm font-medium text-slate-200">$340 total</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between rounded-2xl border border-cyan-400/18 bg-cyan-400/7 px-5 py-3.5">
                  <span className="text-sm font-semibold text-cyan-200">Total for 2</span>
                  <span
                    className="font-display text-2xl font-bold text-white"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    $3,240
                  </span>
                </div>

                <p className="mt-4 text-[11px] leading-5 text-slate-600">
                  Slide the budget dial below to see all four tiers →
                </p>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="relative mx-auto flex w-full max-w-7xl justify-start pb-10 pt-6">
            <div className="flex flex-col items-start gap-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600">
                Plan your trip below
              </p>
              <div className="h-8 w-px bg-gradient-to-b from-slate-600 to-transparent" />
            </div>
          </div>
        </section>
      )}

      {/* ── FORM + RESULTS ── */}
      <PageShell className={viewModel ? "gap-8 pt-8" : "gap-8 pt-0"}>
        <TripIntakeForm
          destinationError={destinationError}
          featuredDestinations={landingData.featuredDestinations}
          philippinesSpotlights={landingData.philippinesSpotlights}
          initialInput={plannerInput ?? getDefaultPlannerInput()}
        />

        {viewModel ? (
          <ScenarioExplorer viewModel={viewModel} />
        ) : (
          <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
            <Card>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                How it works
              </p>
              <CardTitle className="mt-3 text-[1.75rem] leading-tight">
                One search. Four trip styles you can actually compare.
              </CardTitle>
              <CardDescription className="mt-4 text-base leading-7 text-slate-300">
                VoyageIQ builds a complete trip across four budget tiers — lean, best
                value, comfortable, and premium. See what changes, and what you give
                up, instantly.
              </CardDescription>
              <div className="mt-6 space-y-2.5">
                {[
                  {
                    label: "Built around real limits",
                    text: "Trip length, group size, and budget all shape the answer from day one."
                  },
                  {
                    label: "Four clear trip styles",
                    text: "Compare without getting overwhelmed — lean through premium, side by side."
                  },
                  {
                    label: "Instant tradeoff view",
                    text: "Move the slider and see the closest cheaper or nicer version in real time."
                  }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4"
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Popular destinations
              </p>
              <div className="mt-4 space-y-3">
                {landingData.featuredDestinations.map((destination) => (
                  <div
                    key={destination.slug}
                    className="rounded-2xl border border-white/8 bg-white/4 p-5 transition hover:border-white/14 hover:bg-white/6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className="font-display text-xl font-semibold text-white"
                          style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                        >
                          {destination.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">{destination.country}</p>
                      </div>
                      <span className="mt-0.5 shrink-0 rounded-full border border-cyan-400/22 bg-cyan-400/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-300">
                        Popular
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{destination.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}
      </PageShell>
    </div>
  );
}
