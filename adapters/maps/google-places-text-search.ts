interface GooglePlaceResult {
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  websiteUri?: string;
}

export interface GooglePlaceLookupResult {
  name: string;
  address: string;
  googleMapsUri?: string;
  websiteUri?: string;
}

const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.googleMapsUri",
  "places.websiteUri"
].join(",");

export async function searchGooglePlace(query: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
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
      pageSize: 1
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { places?: GooglePlaceResult[] };
  const place = payload.places?.[0];

  if (!place) {
    return null;
  }

  return {
    name: place.displayName?.text ?? query,
    address: place.formattedAddress ?? query,
    googleMapsUri: place.googleMapsUri,
    websiteUri: place.websiteUri
  } satisfies GooglePlaceLookupResult;
}
