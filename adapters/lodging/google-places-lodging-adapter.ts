import { LodgingSearchAdapter, LodgingSearchResult } from "@/adapters/lodging/types";
import { searchGooglePlace } from "@/adapters/maps/google-places-text-search";
import {
  buildAirbnbSearchUrl,
  buildBookingSearchUrl,
  buildHostelworldSearchUrl,
  buildMapsSearchUrl
} from "@/lib/travel-links";

export class GooglePlacesLodgingAdapter implements LodgingSearchAdapter {
  async searchLodging({ match, scenario }: Parameters<LodgingSearchAdapter["searchLodging"]>[0]) {
    const place = await searchGooglePlace(`${scenario.stay.name}, ${scenario.stay.address}`);
    const stayKind: LodgingSearchResult["kind"] = scenario.stay.style.toLowerCase().includes("hostel") ? "hostel" : "hotel";

    const results: LodgingSearchResult[] = [
      {
        provider: place?.websiteUri ? "Official Website" : "Google Maps",
        kind: stayKind,
        label: place?.websiteUri ? "Official site" : "Open in Maps",
        url: place?.websiteUri ?? place?.googleMapsUri ?? buildMapsSearchUrl(scenario.stay.name, scenario.stay.address),
        note: "Direct place page for the exact stay in this scenario.",
        direct: true,
        intent: place?.websiteUri ? "exact-booking" : "exact-place"
      },
      {
        provider: "Booking.com",
        kind: "hotel",
        label: "Compare hotels on Booking.com",
        url: buildBookingSearchUrl(match.destination.name, match.destination.country),
        note: "Compare nearby hotel inventory around the same base.",
        direct: false,
        intent: "compare-options"
      },
      {
        provider: "Airbnb",
        kind: "airbnb",
        label: "Compare Airbnb options",
        url: buildAirbnbSearchUrl(match.destination.name, match.destination.country),
        note: "Compare homes, villas, and larger family lodging.",
        direct: false,
        intent: "compare-options"
      }
    ];

    if (stayKind === "hostel") {
      results.push({
        provider: "Hostelworld",
        kind: "hostel",
        label: "Compare hostels on Hostelworld",
        url: buildHostelworldSearchUrl(match.destination.name, match.destination.country),
        note: "Compare the lean scenario against dedicated hostel inventory.",
        direct: false,
        intent: "compare-options"
      });
    }

    return results;
  }
}
