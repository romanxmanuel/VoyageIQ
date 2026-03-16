import { z } from "zod";
import { PlannerInput } from "@/domain/trip/types";

const plannerSearchSchema = z.object({
  destination: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(2).default("Orlando"),
  travelers: z.coerce.number().int().min(1).max(12).default(2),
  nights: z.coerce.number().int().min(3).max(14).default(6)
});

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parsePlannerSearchParams(searchParams: RawSearchParams): PlannerInput | null {
  const parsed = plannerSearchSchema.safeParse({
    destination: Array.isArray(searchParams.destination) ? searchParams.destination[0] : searchParams.destination,
    origin: Array.isArray(searchParams.origin) ? searchParams.origin[0] : searchParams.origin,
    travelers: Array.isArray(searchParams.travelers) ? searchParams.travelers[0] : searchParams.travelers,
    nights: Array.isArray(searchParams.nights) ? searchParams.nights[0] : searchParams.nights
  });

  if (!parsed.success || !parsed.data.destination) {
    return null;
  }

  return {
    destinationQuery: parsed.data.destination,
    origin: parsed.data.origin,
    travelers: parsed.data.travelers,
    nights: parsed.data.nights
  };
}

export function getDefaultPlannerInput(): PlannerInput {
  return {
    destinationQuery: "",
    origin: "Orlando",
    travelers: 2,
    nights: 6
  };
}

