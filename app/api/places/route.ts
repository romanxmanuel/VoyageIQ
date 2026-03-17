import { NextResponse } from "next/server";
import { searchGooglePlaces } from "@/adapters/maps/google-places-text-search";
import { searchDestinationSuggestions } from "@/domain/trip/destination-catalog";
import { resolveIataCodeFuzzy } from "@/domain/trip/data/iata-city-map";

interface GoogleAutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input")?.trim() ?? "";

  if (input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const curatedPredictions = searchDestinationSuggestions(input);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ predictions: curatedPredictions });
  }

  const fetchGooglePredictions = async (types?: string) => {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("key", apiKey);
    if (types) {
      url.searchParams.set("types", types);
    }

    const response = await fetch(url.toString(), { cache: "no-store" });
    const data = await response.json();

    return ((data.predictions ?? []) as GoogleAutocompletePrediction[]).map((prediction) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text ?? prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text ?? "",
      country: prediction.structured_formatting?.secondary_text ?? "",
      iataCode: resolveIataCodeFuzzy(
        [prediction.structured_formatting?.main_text, prediction.structured_formatting?.secondary_text, prediction.description]
          .filter(Boolean)
          .join(", ")
      ),
      source: "google" as const,
    }));
  };

  const [cityPredictions, regionPredictions] = await Promise.all([
    fetchGooglePredictions("(cities)"),
    fetchGooglePredictions("(regions)")
  ]);

  let googlePredictions = [...cityPredictions, ...regionPredictions];

  if (!googlePredictions.length) {
    const textMatches = await searchGooglePlaces(input, 5);
    googlePredictions = textMatches.map((place, index) => ({
      placeId: `text:${place.name}:${index}`,
      description: place.address,
      mainText: place.name,
      secondaryText: place.address,
      country: place.address,
      iataCode: resolveIataCodeFuzzy(`${place.name}, ${place.address}`),
      source: "google" as const,
    }));
  }

  const merged = [...googlePredictions, ...curatedPredictions].filter(
    (candidate, index, all) =>
      all.findIndex((item) => item.mainText === candidate.mainText && item.secondaryText === candidate.secondaryText) === index
  );

  return NextResponse.json({ predictions: merged });
}
