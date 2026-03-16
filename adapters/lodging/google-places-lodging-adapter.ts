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
        label: place?.websiteUri ? `Open ${scenario.stay.name} website` : `Open ${scenario.stay.name} in Maps`,
        url: place?.websiteUri ?? place?.googleMapsUri ?? buildMapsSearchUrl(scenario.stay.name, scenario.stay.address),
        note: "Direct place page for the exact stay in this scenario.",
        direct: true
      },
      {
        provider: "Booking.com",
        kind: "hotel",
        label: `Compare hotels in ${match.destination.name}`,
        url: buildBookingSearchUrl(match.destination.name, match.destination.country),
        note: "Compare nearby hotel inventory around the same base.",
        direct: false
      },
      {
        provider: "Airbnb",
        kind: "airbnb",
        label: `Compare Airbnb in ${match.destination.name}`,
        url: buildAirbnbSearchUrl(match.destination.name, match.destination.country),
        note: "Compare homes, villas, and larger family lodging.",
        direct: false
      }
    ];

    if (stayKind === "hostel") {
      results.push({
        provider: "Hostelworld",
        kind: "hostel",
        label: `Compare hostels in ${match.destination.name}`,
        url: buildHostelworldSearchUrl(match.destination.name, match.destination.country),
        note: "Compare the lean scenario against dedicated hostel inventory.",
        direct: false
      });
    }

    return results;
  }
}
