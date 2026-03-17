import { Compass, PlaneTakeoff, SlidersHorizontal } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PhilippinesSpotlights } from "@/components/planner/philippines-spotlights";
import { TripIntakeForm } from "@/components/planner/trip-intake-form";
import { ScenarioExplorer } from "@/components/results/scenario-explorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDefaultPlannerInput, parsePlannerSearchParams } from "@/features/search/planner-input";
import { buildPlannerViewModel, DestinationResolutionError, getPlannerLandingData } from "@/server/services/build-planner-view-model";

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
    <PageShell className="gap-10">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(150deg,rgba(8,16,28,0.92),rgba(7,26,38,0.88))] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.22)] sm:px-8 sm:py-10">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(101,245,212,0.18),transparent_55%)] lg:block" />
        <div className="relative space-y-8">
          <div className="max-w-4xl space-y-4">
            <Badge>Smarter Trip Planning</Badge>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Find the best trip you can take with the time and budget you actually have.
            </h1>
            <p className="max-w-3xl text-balance text-lg leading-8 text-slate-200">
              VoyageIQ builds a full trip plan from a few simple details, then shows how the trip changes as you spend less or more.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-300/12 p-3 text-cyan-100">
                  <Compass className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Simple start</CardTitle>
                  <CardDescription>Just enter where you want to go, where you are flying from, and who is coming.</CardDescription>
                </div>
              </div>
            </Card>
            <Card className="bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-300/12 p-3 text-cyan-100">
                  <SlidersHorizontal className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Easy comparisons</CardTitle>
                  <CardDescription>See what gets better, and what you give up, as the trip gets cheaper or nicer.</CardDescription>
                </div>
              </div>
            </Card>
            <Card className="bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-300/12 p-3 text-cyan-100">
                  <PlaneTakeoff className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Real trip links</CardTitle>
                  <CardDescription>Check real flights, stays, restaurants, and activities without digging through ten tabs.</CardDescription>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <TripIntakeForm
        destinationError={destinationError}
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
            <Badge>How it helps</Badge>
            <CardTitle className="mt-4 text-3xl">
              One search turns into a few trip styles you can actually compare.
            </CardTitle>
            <CardDescription className="mt-4 text-base text-slate-200">
              Instead of making you build a trip piece by piece, VoyageIQ gives you a few strong options right away.
            </CardDescription>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Built around real limits</p>
                <p className="mt-2 text-sm text-white">Trip length, family size, and budget all shape the answer from the start.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Clear trip styles</p>
                <p className="mt-2 text-sm text-white">Budget, best value, comfortable, and splurge options help you compare without getting overwhelmed.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quick next-best options</p>
                <p className="mt-2 text-sm text-white">When you move the slider, you can quickly see the closest cheaper or nicer version of the trip.</p>
              </div>
            </div>
          </Card>

          <Card>
            <Badge>Popular destinations</Badge>
            <div className="mt-4 space-y-4">
              {landingData.featuredDestinations.map((destination) => (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5" key={destination.slug}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-2xl text-white">{destination.name}</p>
                      <p className="text-sm text-slate-400">{destination.country}</p>
                    </div>
                    <p className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-50">
                      Popular
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{destination.summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </PageShell>
  );
}
