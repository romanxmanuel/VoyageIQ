import { z } from "zod";

// Coerce string "true"/"false" to boolean; actual booleans pass through.
const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === "boolean") return val;
    return val.toLowerCase() === "true";
  })
  .default(false);

const plannerSearchSchema = z.object({
  destination: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(2).default("Orlando"),
  travelers: z.coerce.number().int().min(1).max(12).default(2),
  nights: z.coerce.number().int().min(3).max(14).default(6),
  budgetCap: z.coerce.number().positive().optional(),
  preferDirectFlights: booleanFromString,
  preferLocalFood: booleanFromString,
  lowWalkingIntensity: booleanFromString,
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type PlannerInput = z.infer<typeof plannerSearchSchema> & {
  destinationQuery: string;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function pickFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePlannerSearchParams(searchParams: RawSearchParams): PlannerInput | null {
  const parsed = plannerSearchSchema.safeParse({
    destination: pickFirst(searchParams.destination),
    origin: pickFirst(searchParams.origin),
    travelers: pickFirst(searchParams.travelers),
    nights: pickFirst(searchParams.nights),
    budgetCap: pickFirst(searchParams.budgetCap) || undefined,
    preferDirectFlights: pickFirst(searchParams.preferDirectFlights),
    preferLocalFood: pickFirst(searchParams.preferLocalFood),
    lowWalkingIntensity: pickFirst(searchParams.lowWalkingIntensity),
    departureDate: pickFirst(searchParams.departureDate),
  });

  if (!parsed.success || !parsed.data.destination) return null;

  return {
    ...parsed.data,
    destinationQuery: parsed.data.destination,
  };
}

export function getDefaultPlannerInput(): PlannerInput {
  return {
    destinationQuery: "",
    destination: "",
    origin: "Orlando",
    travelers: 2,
    nights: 6,
    budgetCap: undefined,
    preferDirectFlights: false,
    preferLocalFood: false,
    lowWalkingIntensity: false,
    departureDate: undefined,
  };
}
