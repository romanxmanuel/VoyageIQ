import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPlannerViewModel } from "@/server/services/build-planner-view-model";

const requestSchema = z.object({
  destinationQuery: z.string().min(1),
  destination: z.string().optional(),
  origin: z.string().min(2).default("Orlando"),
  travelers: z.number().int().min(1).max(12).default(2),
  nights: z.number().int().min(3).max(14).default(6),
  budgetCap: z.number().positive().optional(),
  preferDirectFlights: z.boolean().default(false),
  preferLocalFood: z.boolean().default(false),
  lowWalkingIntensity: z.boolean().default(false),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid planner request",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  return NextResponse.json(await buildPlannerViewModel(parsed.data));
}
