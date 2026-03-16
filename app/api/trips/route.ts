import { NextResponse } from "next/server";

import type { PlannerViewModel } from "@/domain/trip/types";
import { saveTripRequest } from "@/server/repositories/save-trip-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      viewModel?: PlannerViewModel;
      selectedScenarioId?: string;
    };

    if (!payload.viewModel || !payload.selectedScenarioId) {
      return NextResponse.json({ error: "Missing planner payload." }, { status: 400 });
    }

    const id = await saveTripRequest(payload.viewModel, payload.selectedScenarioId);

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save the generated strategy."
      },
      { status: 500 }
    );
  }
}

