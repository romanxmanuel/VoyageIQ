import type { DestinationSeed } from "@/domain/trip/types";

function estimateFlightCost(iataCode: string, country: string): number {
  const normalizedCountry = country.toLowerCase();
  const asiaPacific = /^(MNL|BKK|NRT|HND|KIX|SIN|HKG|ICN|GMP|KUL|CGK|DPS|SGN|HAN|PNH|REP|RGN|CNX|DMK|USM|KBV|CEB|DVO|ILO|GES|ZAM|CRK|TAG|MPH|ENI|IAO|LGP|WNP|PEK|PVG|CAN|CTU|SHA|HGH|TSA|TPE|KHH|MFM)$/.test(iataCode);
  const europe = /^(LHR|LGW|STN|CDG|AMS|FRA|MUC|FCO|MAD|BCN|LIS|VIE|ZRH|BRU|CPH|ARN|HEL|WAW|PRG|BUD|DUB|ATH|IST|SAW|BER|NCE|VCE|FLR|DBV|SPU|MXP|OPO|OSL)$/.test(iataCode);
  const latinAmerica = /^(GRU|EZE|BOG|LIM|SCL|GIG|BSB|CUN|MEX|PTY|SJO|GUA|SAL|MGA|TGU)$/.test(iataCode);
  const middleEast = /^(DXB|AUH|DOH|AMM|BEY|CAI|TLV|BAH|KWI|MCT|RUH|JED)$/.test(iataCode);

  if (/united states|usa/.test(normalizedCountry)) {
    if (/^(HNL|OGG|KOA|LIH)$/.test(iataCode)) return 650;
    if (/^(LAX|SFO|SEA|PDX|SAN|LAS|PHX|DEN)$/.test(iataCode)) return 360;
    if (/^(ORD|DFW|IAH|MSP|DTW|OMA|STL|BNA|MSY|MCI)$/.test(iataCode)) return 245;
    if (/^(JFK|EWR|LGA|BOS|PHL|IAD|DCA|BWI|CLT|RDU)$/.test(iataCode)) return 220;
    if (/^(MIA|FLL|TPA|JAX|PBI|RSW|MCO)$/.test(iataCode)) return 150;
    return 260;
  }
  if (/canada/.test(normalizedCountry)) return 320;
  if (asiaPacific) return 1000;
  if (europe) return 900;
  if (latinAmerica) return 600;
  if (middleEast) return 1100;
  return 800;
}

export function createGenericDestinationSeed(
  name: string,
  country: string,
  iataCode: string,
  coordinates: { lat: number; lng: number }
): DestinationSeed {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const base = estimateFlightCost(iataCode, country);

  return {
    slug,
    name,
    country,
    regionLabel: `${name} city center`,
    airportCode: iataCode,
    cityCode: iataCode,
    coordinates,
    heroTitle: `Build a trip to ${name} from a verified destination search`,
    summary: `${name} was selected as a verified place. VoyageIQ will use real links where possible and honest open planning blocks when an exact venue still needs your choice.`,
    recommendedWindow: "Check local weather because the best season depends on the region",
    aliases: [name.toLowerCase(), slug],
    averageTransitPerDay: 15,
    mapNote: `Use Google Maps or a local ride app to move around ${name}.`,
    flights: {
      lean: {
        airline: "Budget carrier",
        departWindow: "Flexible dates",
        arriveWindow: "Varies by route",
        durationHours: 10,
        stops: 1,
        layover: "Hub airport",
        cabin: "Economy",
        bookingTip: `Search Kayak and Google Flights for the best rates to ${iataCode}. Flexible dates often save the most.`,
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
        bookingTip: `Book a few weeks ahead and compare Google Flights with airline-direct options for ${iataCode}.`,
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
        bookingTip: `Premium economy is usually the easiest comfort upgrade for a long trip to ${name}.`,
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
        bookingTip: `Check airline-direct offers and points redemptions if you want the smoothest route into ${name}.`,
        baseFarePerTraveler: Math.round(base * 3.2),
      },
    },
    stays: {
      lean: {
        name: `Central budget stay in ${name}`,
        style: "Budget hotel / guesthouse",
        address: `${name} city center`,
        nightlyRate: 45,
        neighborhood: "City center",
        whyItWorks: `Budget-friendly base profile for keeping more money available for the trip itself.`,
      },
      balanced: {
        name: `Central mid-range stay in ${name}`,
        style: "3-star hotel",
        address: `${name} city center`,
        nightlyRate: 110,
        neighborhood: "City center",
        whyItWorks: `Solid comfort profile without paying for luxury extras.`,
      },
      elevated: {
        name: `Higher-comfort stay in ${name}`,
        style: "4-star hotel",
        address: `${name} city center`,
        nightlyRate: 220,
        neighborhood: "Prime location",
        whyItWorks: `Better location and smoother day-to-day flow.`,
      },
      signature: {
        name: `Premium stay in ${name}`,
        style: "5-star hotel",
        address: `${name} city center`,
        nightlyRate: 420,
        neighborhood: "Premium district",
        whyItWorks: `Premium stay profile for the easiest version of the trip.`,
      },
    },
    dining: [
      {
        name: `Open local meal block in ${name}`,
        cuisine: "Local favorites",
        address: `${name} city center`,
        estimatedPerPerson: 12,
        signatureOrder: "Use maps and reviews to pick the exact place nearby once you are ready to book.",
        fit: ["lean", "balanced", "elevated", "signature"],
      },
      {
        name: `Open sit-down dinner block in ${name}`,
        cuisine: "Neighborhood dining",
        address: `${name} city center`,
        estimatedPerPerson: 24,
        signatureOrder: "Choose the best-rated dinner spot that fits your mood and budget that day.",
        fit: ["lean", "balanced", "elevated", "signature"],
      },
      {
        name: `Open premium dinner block in ${name}`,
        cuisine: "Higher-end dining",
        address: `${name} central district`,
        estimatedPerPerson: 55,
        signatureOrder: "Save this for the nicest dinner night once you compare the exact places.",
        fit: ["balanced", "elevated", "signature"],
      },
    ],
    activities: [
      {
        name: `Open city highlights block in ${name}`,
        address: `${name} historic center`,
        estimatedPerPerson: 20,
        durationHours: 3,
        travelMinutesFromCenter: 5,
        summary: `Use this for the main historic area or best-known neighborhood once you choose the exact place.`,
        fit: ["lean", "balanced", "elevated", "signature"],
      },
      {
        name: `Open landmark visit in ${name}`,
        address: `${name} tourist district`,
        estimatedPerPerson: 15,
        durationHours: 2,
        travelMinutesFromCenter: 15,
        summary: `Keep this open for the landmark or viewpoint that feels most worth it after checking reviews.`,
        fit: ["lean", "balanced", "elevated", "signature"],
      },
      {
        name: `Open food and culture block in ${name}`,
        address: `${name} market district`,
        estimatedPerPerson: 45,
        durationHours: 4,
        travelMinutesFromCenter: 10,
        summary: `Use this for a real food or culture experience once you compare the exact options.`,
        fit: ["balanced", "elevated", "signature"],
      },
      {
        name: `Open half-day adventure from ${name}`,
        address: `${name} surroundings`,
        estimatedPerPerson: 60,
        durationHours: 8,
        travelMinutesFromCenter: 60,
        summary: `Keep this as an optional adventure block if leaving the city feels worth it.`,
        fit: ["elevated", "signature"],
      },
    ],
  };
}
