import { LodgingSearchAdapter, LodgingSearchResult } from "@/adapters/lodging/types";
import {
  buildAirbnbSearchUrl,
  buildBookingSearchUrl,
  buildHostelworldSearchUrl,
  buildMapsSearchUrl,
} from "@/lib/travel-links";

export class OutboundLinkLodgingAdapter implements LodgingSearchAdapter {
  async searchLodging({ match, scenario, input }: Parameters<LodgingSearchAdapter["searchLodging"]>[0]) {
    const stayKind: LodgingSearchResult["kind"] = scenario.stay.style
      .toLowerCase()
      .includes("hostel")
      ? "hostel"
      : "hotel";

    const depart = input.departureDate;
    const checkin = depart;
    const checkout = depart
      ? new Date(new Date(depart).getTime() + input.nights * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      : undefined;
    const adults = input.travelers;

    const results: LodgingSearchResult[] = [
      {
        provider: "Google Maps",
        kind: stayKind,
        label: "Open in Maps",
        url: buildMapsSearchUrl(scenario.stay.name, scenario.stay.address),
        note: "Verify the exact stay, address, and nearby context.",
        direct: true,
        intent: "exact-place",
      },
      {
        provider: "Booking.com",
        kind: "hotel",
        label: "Compare hotels on Booking.com",
        url: buildBookingSearchUrl(
          match.destination.name,
          match.destination.country,
          checkin,
          checkout,
          adults
        ),
        note: "Check comparable hotel and resort inventory around the recommended base.",
        intent: "compare-options",
      },
      {
        provider: "Airbnb",
        kind: "airbnb",
        label: "Compare Airbnb options",
        url: buildAirbnbSearchUrl(
          match.destination.name,
          match.destination.country,
          checkin,
          checkout,
          adults
        ),
        note: "Use this when you want to compare villas, apartments, or family-size lodging.",
        intent: "compare-options",
      },
    ];

    if (stayKind === "hostel") {
      results.push({
        provider: "Hostelworld",
        kind: "hostel",
        label: "Compare hostels on Hostelworld",
        url: buildHostelworldSearchUrl(match.destination.name, match.destination.country),
        note: "Helpful when the lean scenario works best with hostel-style inventory.",
        intent: "compare-options",
      });
    }

    return results;
  }
}
