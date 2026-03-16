import { GooglePlacesActivityAdapter } from "@/adapters/activities/google-places-activity-adapter";
import { OutboundLinkActivityAdapter } from "@/adapters/activities/outbound-link-activity-adapter";
import { ActivitySearchAdapter } from "@/adapters/activities/types";
import { GooglePlacesDiningAdapter } from "@/adapters/food/google-places-dining-adapter";
import { OutboundLinkDiningAdapter } from "@/adapters/food/outbound-link-dining-adapter";
import { DiningSearchAdapter } from "@/adapters/food/types";
import { OutboundLinkFlightAdapter } from "@/adapters/flights/outbound-link-flight-adapter";
import { FlightSearchAdapter } from "@/adapters/flights/types";
import { GooglePlacesLodgingAdapter } from "@/adapters/lodging/google-places-lodging-adapter";
import { OutboundLinkLodgingAdapter } from "@/adapters/lodging/outbound-link-lodging-adapter";
import { LodgingSearchAdapter } from "@/adapters/lodging/types";

export interface ProviderRegistry {
  flights: FlightSearchAdapter;
  lodging: LodgingSearchAdapter;
  dining: DiningSearchAdapter;
  activities: ActivitySearchAdapter;
}

export function getProviderRegistry() {
  const hasGooglePlaces = Boolean(process.env.GOOGLE_MAPS_API_KEY);

  return {
    flights: new OutboundLinkFlightAdapter(),
    lodging: hasGooglePlaces ? new GooglePlacesLodgingAdapter() : new OutboundLinkLodgingAdapter(),
    dining: hasGooglePlaces ? new GooglePlacesDiningAdapter() : new OutboundLinkDiningAdapter(),
    activities: hasGooglePlaces ? new GooglePlacesActivityAdapter() : new OutboundLinkActivityAdapter()
  } satisfies ProviderRegistry;
}
