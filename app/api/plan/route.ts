import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPlannerViewModel } from "@/server/services/build-planner-view-model";

const requestSchema = z.object({
  destinationQuery: z.string().min(1),
  destination: z.string().optional(),
  origin: z.string().min(2).default("Orlando"),
  travelers: z.number().int().min(1).max(12).default(2),
  nights: z.number().int().min(3).max(30).default(6),
  budgetCap: z.number().positive().optional(),
  preferDirectFlights: z.boolean().default(false),
  preferLocalFood: z.boolean().default(false),
  lowWalkingIntensity: z.boolean().default(false),
  departureDate: z.string().optional(),
  destinationLabel: z.string().optional(),
  destinationPlaceId: z.string().optional(),
  destinationSource: z.string().optional(),
  destinationAirportCode: z.string().optional(),
  destinationCountry: z.string().optional()
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

  return NextResponse.json(
    await buildPlannerViewModel({
      ...parsed.data,
      resolvedDestinationLabel: parsed.data.destinationLabel,
      resolvedDestinationPlaceId: parsed.data.destinationPlaceId,
      resolvedDestinationSource: parsed.data.destinationSource,
      resolvedDestinationAirportCode: parsed.data.destinationAirportCode,
      resolvedDestinationCountry: parsed.data.destinationCountry
    })
  );
}
