import { Compass, PlaneTakeoff, SlidersHorizontal } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PhilippinesSpotlights } from "@/components/planner/philippines-spotlights";
import { TripIntakeForm } from "@/components/planner/trip-intake-form";
import { ScenarioExplorer } from "@/components/results/scenario-explorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDefaultPlannerInput, parsePlannerSearchParams } from "@/features/search/planner-input";
import { summarizeScenarioExtremes } from "@/features/scenarios/scenario-overview";
import { formatCurrency } from "@/lib/formatters";
import { buildPlannerViewModel, getPlannerLandingData } from "@/server/services/build-planner-view-model";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const plannerInput = parsePlannerSearchParams(resolvedSearchParams);
  const landingData = getPlannerLandingData();
  const viewModel = plannerInput ? await buildPlannerViewModel(plannerInput) : null;
  const scenarioSummary = viewModel ? summarizeScenarioExtremes(viewModel) : null;

  return (
    <PageShell className="gap-10">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(150deg,rgba(8,16,28,0.92),rgba(7,26,38,0.88))] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.22)] sm:px-8 sm:py-10">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(101,245,212,0.18),transparent_55%)] lg:block" />
        <div className="relative space-y-8">
          <div className="max-w-4xl space-y-4">
            <Badge>Constraint-Aware Travel Optimizer</Badge>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              See the best trip you can have, not just the cheapest flights you can click.
            </h1>
            <p className="max-w-3xl text-balance text-lg leading-8 text-slate-200">
              VoyageIQ assembles a complete trip strategy from minimal input, then makes the tradeoffs obvious as budget,
              comfort, and time change. It is built to feel like a travel strategy engine, not an OTA filter wall.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-300/12 p-3 text-cyan-100">
                  <Compass className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Minimal intake</CardTitle>
                  <CardDescription>Destination, origin, travelers, and nights are enough to get a real answer.</CardDescription>
                </div>
              </div>
            </Card>
            <Card className="bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-300/12 p-3 text-cyan-100">
                  <SlidersHorizontal className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tradeoff clarity</CardTitle>
                  <CardDescription>The slider shows what improves and what disappears at each budget tier.</CardDescription>
                </div>
              </div>
            </Card>
            <Card className="bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-300/12 p-3 text-cyan-100">
                  <PlaneTakeoff className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Production path</CardTitle>
                  <CardDescription>Seeded data today, adapter-based live provider integrations next.</CardDescription>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <TripIntakeForm
        featuredDestinations={landingData.featuredDestinations}
        philippinesSpotlights={landingData.philippinesSpotlights}
        initialInput={plannerInput ?? getDefaultPlannerInput()}
      />

      <Card>
        <PhilippinesSpotlights
          origin={(plannerInput ?? getDefaultPlannerInput()).origin}
          spots={landingData.philippinesSpotlights}
        />
      </Card>

      {viewModel ? (
        <ScenarioExplorer viewModel={viewModel} />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card>
            <Badge>How the MVP thinks</Badge>
            <CardTitle className="mt-4 text-3xl">
              One search becomes four scenarios instead of one flat answer.
            </CardTitle>
            <CardDescription className="mt-4 text-base text-slate-200">
              The current scaffold uses seeded destination intelligence, deterministic pricing, and real architecture boundaries so
              we can graduate to live APIs without ripping the product apart.
            </CardDescription>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hard constraints</p>
                <p className="mt-2 text-sm text-white">Budget posture, party size, nights, and supported destinations decide what is actually valid.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Rule-based scoring</p>
                <p className="mt-2 text-sm text-white">VoyageIQ ranks scenarios with typed business logic before it uses any geometric similarity.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Similarity helper</p>
                <p className="mt-2 text-sm text-white">Weighted Euclidean distance only helps answer “closest cheaper,” “closest premium,” and “convenience-first.”</p>
              </div>
            </div>
          </Card>

          <Card>
            <Badge>Spotlight destinations</Badge>
            <div className="mt-4 space-y-4">
              {landingData.featuredDestinations.map((destination) => (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5" key={destination.slug}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-2xl text-white">{destination.name}</p>
                      <p className="text-sm text-slate-400">{destination.country}</p>
                    </div>
                    <p className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-50">
                      Seeded
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{destination.summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {scenarioSummary ? (
        <Card className="border-cyan-300/12 bg-[linear-gradient(145deg,rgba(9,18,31,0.95),rgba(9,30,40,0.84))]">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scenario spread</p>
              <CardTitle className="mt-3 text-3xl">
                From {formatCurrency(scenarioSummary.cheapest.cost.totalTripCost)} to{" "}
                {formatCurrency(scenarioSummary.richest.cost.totalTripCost)}
              </CardTitle>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cheapest mode</p>
              <p className="mt-2 font-display text-2xl text-white">{scenarioSummary.cheapest.label}</p>
              <p className="mt-2 text-sm text-slate-300">{scenarioSummary.cheapest.headline}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Budget delta</p>
              <p className="mt-2 font-display text-2xl text-white">{formatCurrency(scenarioSummary.delta)}</p>
              <p className="mt-2 text-sm text-slate-300">
                That is the cost of moving from your leanest strategy to the most premium memory path.
              </p>
            </div>
          </div>
        </Card>
      ) : null}
    </PageShell>
  );
}
