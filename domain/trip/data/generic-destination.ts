import type { DestinationSeed } from "@/domain/trip/types";

// Regional base fare estimates (per traveler, round trip from US)
function estimateFlightCost(iataCode: string): number {
  // Asia-Pacific
  const asiaPacific = /^(MNL|BKK|NRT|HND|KIX|SIN|HKG|ICN|GMP|KUL|CGK|DPS|SGN|HAN|PNH|REP|RGN|CNX|DMK|USM|KBV|CEB|DVO|ILO|GES|ZAM|CRK|TAG|MPH|ENI|IAO|LGP|WNP|PEK|PVG|CAN|CTU|SHA|HGH|TSA|TPE|KHH|MFM)$/.test(iataCode);
  const europe = /^(LHR|LGW|STN|CDG|AMS|FRA|MUC|FCO|MAD|BCN|LIS|VIE|ZRH|BRU|CPH|ARN|HEL|WAW|PRG|BUD|DUB|ATH|IST|SAW|BER|NCE|VCE|FLR|DBV|SPU|MXP|OPO|OSL)$/.test(iataCode);
  const latinAmerica = /^(GRU|EZE|BOG|LIM|SCL|GIG|BSB|CUN|MEX|PTY|SJO|GUA|SAL|MGA|TGU)$/.test(iataCode);
  const middleEast = /^(DXB|AUH|DOH|AMM|BEY|CAI|TLV|BAH|KWI|MCT|RUH|JED)$/.test(iataCode);

  if (asiaPacific) return 1000;
  if (europe) return 900;
  if (latinAmerica) return 600;
  if (middleEast) return 1100;
  return 800; // default
}

export function createGenericDestinationSeed(
  name: string,
  country: string,
  iataCode: string,
  coordinates: { lat: number; lng: number }
): DestinationSeed {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const base = estimateFlightCost(iataCode);

  return {
    slug,
    name,
    country,
    regionLabel: `${name} city center`,
    airportCode: iataCode,
    cityCode: iataCode,
    coordinates,
    heroTitle: `Explore ${name} — plan your trip with real flight and hotel prices`,
    summary: `${name} is available for live flight search. Real prices from Aviasales, hotel availability from Booking.com, and activity ideas from TripAdvisor.`,
    recommendedWindow: "Check local weather — varies by season",
    aliases: [name.toLowerCase(), slug],
    averageTransitPerDay: 15,
    mapNote: `Use Google Maps or ride-hailing apps to navigate ${name}.`,
    flights: {
      lean: {
        airline: "Budget carrier",
        departWindow: "Flexible dates",
        arriveWindow: "Varies by route",
        durationHours: 10,
        stops: 1,
        layover: "Hub airport",
        cabin: "Economy",
        bookingTip: `Search Kayak and Google Flights for the best rates to ${iataCode}. Flexible dates save 20–30%.`,
        baseFarePerTraveler: Math.round(base * 0.85),
      },
      balanced: {
        airline: "Major carrier",
        departWindow: "Midweek preferred",
        arriveWindow: "Varies by route",
        durationHours: 10,
        stops: 1,
        layover: "Hub airport",
        cabin: "Economy",
        bookingTip: `Book 6–8 weeks out for best fares to ${iataCode}. Set a price alert on Google Flights.`,
        baseFarePerTraveler: base,
      },
      elevated: {
        airline: "Premium carrier",
        departWindow: "Tuesday or Wednesday",
        arriveWindow: "Varies by route",
        durationHours: 10,
        stops: 1,
        layover: "Hub airport",
        cabin: "Premium Economy",
        bookingTip: `Premium economy significantly improves comfort on long-haul routes to ${name}.`,
        baseFarePerTraveler: Math.round(base * 1.6),
      },
      signature: {
        airline: "Business class routing",
        departWindow: "Flexible",
        arriveWindow: "Varies by route",
        durationHours: 10,
        stops: 1,
        layover: "Hub airport",
        cabin: "Business",
        bookingTip: `Business class to ${name} — check airline direct and use points when available.`,
        baseFarePerTraveler: Math.round(base * 3.2),
      },
    },
    stays: {
      lean: {
        name: `Budget hotel in ${name}`,
        style: "Budget hotel / guesthouse",
        address: `${name} city center`,
        nightlyRate: 45,
        neighborhood: "City center",
        whyItWorks: `Clean, central, and well-reviewed. Keeps the lodging budget low so you can spend on experiences.`,
      },
      balanced: {
        name: `Mid-range hotel in ${name}`,
        style: "3-star hotel",
        address: `${name} city center`,
        nightlyRate: 110,
        neighborhood: "City center",
        whyItWorks: `Comfortable base with amenities. Removes friction without premium pricing.`,
      },
      elevated: {
        name: `Upscale hotel in ${name}`,
        style: "4-star hotel",
        address: `${name} city center`,
        nightlyRate: 220,
        neighborhood: "Prime location",
        whyItWorks: `Better location, better service, better breakfast. The step-up that makes the daily routine noticeably smoother.`,
      },
      signature: {
        name: `Luxury hotel in ${name}`,
        style: "5-star hotel",
        address: `${name} city center`,
        nightlyRate: 420,
        neighborhood: "Premium district",
        whyItWorks: `Top-tier property in ${name}. Best service, best location, best amenities.`,
      },
    },
    dining: [
      {
        name: `Local food market in ${name}`,
        cuisine: "Local street food",
        address: `${name} city center`,
        estimatedPerPerson: 8,
        signatureOrder: "Ask locals what's fresh — the best street food is always seasonal",
        fit: ["lean", "balanced"],
      },
      {
        name: `Mid-range restaurant in ${name}`,
        cuisine: "Local cuisine",
        address: `${name} city center`,
        estimatedPerPerson: 20,
        signatureOrder: "Order the daily special or chef's recommendation",
        fit: ["balanced", "elevated"],
      },
      {
        name: `Fine dining in ${name}`,
        cuisine: "Contemporary local cuisine",
        address: `${name} fine dining district`,
        estimatedPerPerson: 55,
        signatureOrder: "Tasting menu or multi-course dinner",
        fit: ["elevated", "signature"],
      },
    ],
    activities: [
      {
        name: `${name} city walking tour`,
        address: `${name} historic center`,
        estimatedPerPerson: 20,
        durationHours: 3,
        travelMinutesFromCenter: 5,
        summary: `Explore the historic neighborhoods and main landmarks of ${name} with a local guide.`,
        fit: ["lean", "balanced", "elevated", "signature"],
      },
      {
        name: `Top cultural landmark in ${name}`,
        address: `${name} tourist district`,
        estimatedPerPerson: 15,
        durationHours: 2,
        travelMinutesFromCenter: 15,
        summary: `Visit the most iconic sight in ${name}. Check TripAdvisor for current top attractions.`,
        fit: ["lean", "balanced", "elevated", "signature"],
      },
      {
        name: `${name} food and culture tour`,
        address: `${name} market district`,
        estimatedPerPerson: 45,
        durationHours: 4,
        travelMinutesFromCenter: 10,
        summary: `Guided tour combining local food stops, market visits, and cultural context. Great for first-time visitors.`,
        fit: ["balanced", "elevated", "signature"],
      },
      {
        name: `Day trip from ${name}`,
        address: `${name} surroundings`,
        estimatedPerPerson: 60,
        durationHours: 8,
        travelMinutesFromCenter: 60,
        summary: `Explore the area around ${name}. Check Viator for organized day trips to nearby highlights.`,
        fit: ["elevated", "signature"],
      },
    ],
  };
}
