interface GooglePlaceResult {
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text?: string };
  priceLevel?: string;
}

export interface GooglePlaceLookupResult {
  name: string;
  address: string;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  category?: string;
  priceLevel?: number;
}

interface SearchGooglePlacesOptions {
  coordinates?: { lat: number; lng: number };
  radiusMeters?: number;
}

const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.primaryTypeDisplayName",
  "places.priceLevel"
].join(",");

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4
};

function mapPlace(place: GooglePlaceResult, fallbackQuery: string) {
  return {
    name: place.displayName?.text ?? fallbackQuery,
    address: place.formattedAddress ?? fallbackQuery,
    googleMapsUri: place.googleMapsUri,
    websiteUri: place.websiteUri,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    category: place.primaryTypeDisplayName?.text,
    priceLevel: place.priceLevel ? PRICE_LEVEL_MAP[place.priceLevel] ?? undefined : undefined
  } satisfies GooglePlaceLookupResult;
}

function dedupePlaces(places: GooglePlaceLookupResult[]) {
  const seen = new Set<string>();

  return places.filter((place) => {
    const key = `${place.name.toLowerCase()}|${place.address.toLowerCase()}|${place.googleMapsUri ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function searchGooglePlaces(query: string, pageSize = 1, options?: SearchGooglePlacesOptions) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return [];
  }

  const response = await fetch(GOOGLE_PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize,
      ...(options?.coordinates
        ? {
            locationBias: {
              circle: {
                center: {
                  latitude: options.coordinates.lat,
                  longitude: options.coordinates.lng
                },
                radius: options.radiusMeters ?? 25000
              }
            }
          }
        : {})
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { places?: GooglePlaceResult[] };

  return dedupePlaces((payload.places ?? []).map((place) => mapPlace(place, query)));
}

export async function searchGooglePlacesBatch(
  queries: string[],
  pageSize = 6,
  options?: SearchGooglePlacesOptions
) {
  const groups = await Promise.all(
    queries.map((query) =>
      searchGooglePlaces(query, pageSize, options)
    )
  );

  return dedupePlaces(groups.flat());
}

export async function searchGooglePlace(query: string) {
  const [place] = await searchGooglePlaces(query, 1);
  return place ?? null;
}
