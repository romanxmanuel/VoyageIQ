import Anthropic from "@anthropic-ai/sdk";
import type { ScenarioTier, TravelIntel, VenueActivity, VenueDining } from "@/domain/trip/types";

const TIMEOUT_MS = 6000;

export interface EnrichedContent {
  activities: Partial<Record<ScenarioTier, VenueActivity[]>>;
  dining: {
    casual: VenueDining[];
    sitdown: VenueDining[];
    premium: VenueDining[];
  };
  neighborhoods: Partial<Record<ScenarioTier, string>>;
  travelIntel: TravelIntel;
}

const SYSTEM_PROMPT =
  "You are a travel content expert. Return ONLY valid JSON matching the exact schema requested. No prose, no markdown, no explanation.";

function buildPrompt(name: string, country: string): string {
  return `Generate travel venue content for ${name}, ${country}.

Return a JSON object:
{
  "activities": {
    "lean": [{"name":string,"neighborhood":string,"estimatedPerPerson":number,"durationHours":number,"description":string}],
    "balanced": [3 items same shape],
    "elevated": [3 items same shape],
    "signature": [3 items same shape]
  },
  "dining": {
    "casual": [{"name":string,"neighborhood":string,"cuisine":string,"estimatedPerPerson":number,"description":string}],
    "sitdown": [3 items same shape],
    "premium": [3 items same shape]
  },
  "neighborhoods": {"lean":string,"balanced":string,"elevated":string,"signature":string},
  "travelIntel": {"bestMonths":string,"visaNote":string,"currency":string,"transitTip":string,"arrivalNote":string}
}

Rules: use real named venues and neighborhoods; realistic USD prices; accurate visa/transit info for US citizens.`;
}

function parseResult(text: string): EnrichedContent | null {
  try {
    // Strip any accidental markdown fencing
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const json = JSON.parse(clean) as Partial<EnrichedContent>;
    if (!json.activities || !json.dining || !json.neighborhoods || !json.travelIntel) return null;
    return json as EnrichedContent;
  } catch {
    return null;
  }
}

export async function enrichGenericDestinationContent(
  name: string,
  country: string
): Promise<EnrichedContent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const message = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildPrompt(name, country) }]
      },
      { signal: controller.signal }
    );
    clearTimeout(timer);
    const block = message.content[0];
    if (block.type !== "text") return null;
    return parseResult(block.text);
  } catch (err) {
    clearTimeout(timer);
    console.error(
      "[claude-enrichment] enrichment failed:",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}
