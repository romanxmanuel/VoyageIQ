import { DestinationSeed } from "@/domain/trip/types";

export const philippinesDestinationsPartTwo: DestinationSeed[] = [
  {
    slug: "bohol",
    name: "Bohol",
    country: "Philippines",
    regionLabel: "Panglao, Loboc, and Chocolate Hills corridor",
    airportCode: "TAG",
    tourismUrl: "https://tourism.bohol.gov.ph/",
    heroTitle: "Beach time, countryside routes, and a very family-readable Philippines itinerary",
    summary:
      "Bohol is one of the best Philippines options when you want a wider activity mix and easier family-friendly pacing.",
    recommendedWindow: "November to May, with drier countryside conditions from January to April",
    aliases: ["philippines", "bohol", "panglao", "chocolate hills", "loboc", "tarsier", "alona beach"],
    averageTransitPerDay: 30,
    mapNote: "Expect a mix of van transfers, tricycles, and one dedicated countryside day with longer road movement.",
    flights: {
      lean: {
        airline: "Philippine Airlines + Cebu Pacific",
        departWindow: "Tuesday evening",
        arriveWindow: "Thursday afternoon",
        durationHours: 26.4,
        stops: 2,
        layover: "Los Angeles and Manila",
        cabin: "Economy",
        bookingTip: "Lean mode usually means building the Bohol leg from Manila or Cebu separately.",
        baseFarePerTraveler: 1105
      },
      balanced: {
        airline: "ANA + Philippine Airlines",
        departWindow: "Wednesday morning",
        arriveWindow: "Thursday afternoon",
        durationHours: 24.2,
        stops: 2,
        layover: "Tokyo and Manila",
        cabin: "Economy Plus",
        bookingTip: "Aim for a domestic arrival that lands before sunset so the first night still feels productive.",
        baseFarePerTraveler: 1360
      },
      elevated: {
        airline: "Korean Air + Philippine Airlines",
        departWindow: "Thursday morning",
        arriveWindow: "Friday afternoon",
        durationHours: 22.6,
        stops: 2,
        layover: "Seoul and Manila",
        cabin: "Premium economy",
        bookingTip: "Premium economy is the cleanest comfort/value middle ground for a longer island itinerary.",
        baseFarePerTraveler: 1795
      },
      signature: {
        airline: "Singapore Airlines + Philippine Airlines",
        departWindow: "Friday morning",
        arriveWindow: "Saturday afternoon",
        durationHours: 21.8,
        stops: 2,
        layover: "Singapore and Manila",
        cabin: "Business",
        bookingTip: "Use premium cabin here if the trip length is short and every recovered hour matters.",
        baseFarePerTraveler: 3325
      }
    },
    stays: {
      lean: {
        name: "Moon Fools Hostel",
        style: "Hostel",
        address: "Daorong, Danao, Panglao, Bohol 6340, Philippines",
        nightlyRate: 41,
        neighborhood: "Panglao",
        whyItWorks: "Low-cost launch point for Panglao beaches without forcing a hostel in the middle of dense nightlife."
      },
      balanced: {
        name: "Bohol Beach Club",
        style: "Beach resort",
        address: "Bolod Beach, Panglao, Bohol 6340, Philippines",
        nightlyRate: 158,
        neighborhood: "Bolod Beach",
        whyItWorks: "Very solid family value with beach access and enough structure to keep logistics smooth."
      },
      elevated: {
        name: "Oceanica Resort Panglao",
        style: "Upscale resort",
        address: "Bolod Beach, Panglao, Bohol 6340, Philippines",
        nightlyRate: 228,
        neighborhood: "Bolod Beach",
        whyItWorks: "A stronger comfort move that still preserves room in the budget for countryside excursions."
      },
      signature: {
        name: "Amorita Resort",
        style: "Luxury resort",
        address: "1 Ester A. Lim Drive, Barangay Tawala, Panglao, Bohol 6340, Philippines",
        nightlyRate: 520,
        neighborhood: "Alona Beach bluff",
        whyItWorks: "The premium Bohol move when the trip wants polished service and a high-view beach base."
      }
    },
    dining: [
      {
        name: "Bohol Bee Farm Restaurant",
        cuisine: "Farm-to-table Filipino",
        address: "Dao, Dauis, Bohol 6339, Philippines",
        estimatedPerPerson: 20,
        signatureOrder: "Organic salads, cassava chips, and homemade ice cream",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Barwoo",
        cuisine: "Korean barbecue",
        address: "Alona Beach Road, Panglao, Bohol 6340, Philippines",
        estimatedPerPerson: 18,
        signatureOrder: "Unlimited samgyeopsal sets",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "The Buzzz Cafe",
        cuisine: "Cafe",
        address: "Alona Beach Road, Panglao, Bohol 6340, Philippines",
        estimatedPerPerson: 14,
        signatureOrder: "Ube ice cream and Filipino breakfast plates",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Bougainvillea Spanish Restaurant",
        cuisine: "Spanish",
        address: "Tawala, Panglao, Bohol 6340, Philippines",
        estimatedPerPerson: 26,
        signatureOrder: "Paella and seafood tapas",
        fit: ["balanced", "elevated", "signature"]
      }
    ],
    activities: [
      {
        name: "Chocolate Hills countryside tour",
        address: "Chocolate Hills Complex, Carmen, Bohol 6319, Philippines",
        estimatedPerPerson: 26,
        durationHours: 8,
        travelMinutesFromCenter: 95,
        summary: "The signature inland Bohol day and still the best way to justify leaving the beach for a full loop.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Philippine Tarsier Sanctuary",
        address: "Tarsier Sanctuary Road, Corella, Bohol 6337, Philippines",
        estimatedPerPerson: 4,
        durationHours: 1.5,
        travelMinutesFromCenter: 60,
        summary: "Low-cost stop with strong family payoff if paired to the countryside route efficiently.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Loboc river cruise lunch",
        address: "Loboc Riverwatch, Loboc, Bohol 6316, Philippines",
        estimatedPerPerson: 16,
        durationHours: 1.5,
        travelMinutesFromCenter: 70,
        summary: "A slightly touristy but dependable scenic block that works especially well for mixed-age family groups.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Alona Beach snorkel day",
        address: "Alona Beach, Panglao, Bohol 6340, Philippines",
        estimatedPerPerson: 0,
        durationHours: 4,
        travelMinutesFromCenter: 15,
        summary: "High-return low-cost beach day that keeps the itinerary from becoming all road transfers.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Balicasag Island boat tour",
        address: "Alona Beach boat area, Panglao, Bohol 6340, Philippines",
        estimatedPerPerson: 42,
        durationHours: 5,
        travelMinutesFromCenter: 18,
        summary: "Strong premium water-day upgrade when the trip wants one major marine experience.",
        fit: ["balanced", "elevated", "signature"]
      }
    ]
  },
  {
    slug: "siargao",
    name: "Siargao",
    country: "Philippines",
    regionLabel: "General Luna, Cloud 9, and island-hopping coast",
    airportCode: "IAO",
    tourismUrl: "https://www.siargao.ph/",
    heroTitle: "Surf-town rhythm, blue lagoons, and a lower-density island energy that still feels cinematic",
    summary:
      "Siargao fits travelers who want the Philippines to feel a little more exploratory and less resort-packaged.",
    recommendedWindow: "March to October for drier weather, with surf season peaking later in the year",
    aliases: ["philippines", "siargao", "general luna", "cloud 9", "sugba lagoon", "naked island"],
    averageTransitPerDay: 26,
    mapNote: "Most movement is scooter, van, or boat-based around General Luna and the nearby island-hopping circuit.",
    flights: {
      lean: {
        airline: "Philippine Airlines + Cebu Pacific",
        departWindow: "Tuesday evening",
        arriveWindow: "Thursday afternoon",
        durationHours: 27.1,
        stops: 2,
        layover: "Los Angeles and Manila",
        cabin: "Economy",
        bookingTip: "Lean pricing usually comes from separate domestic booking into Sayak Airport after the long-haul.",
        baseFarePerTraveler: 1160
      },
      balanced: {
        airline: "ANA + Philippine Airlines",
        departWindow: "Wednesday morning",
        arriveWindow: "Thursday afternoon",
        durationHours: 24.7,
        stops: 2,
        layover: "Tokyo and Manila",
        cabin: "Economy Plus",
        bookingTip: "Preserve at least a few connection hours in Manila because island weather can shift schedules.",
        baseFarePerTraveler: 1415
      },
      elevated: {
        airline: "Korean Air + Philippine Airlines",
        departWindow: "Thursday morning",
        arriveWindow: "Friday afternoon",
        durationHours: 22.8,
        stops: 2,
        layover: "Seoul and Cebu",
        cabin: "Premium economy",
        bookingTip: "Comfort matters more here because the final arrival is often followed by a longer ground transfer.",
        baseFarePerTraveler: 1865
      },
      signature: {
        airline: "Singapore Airlines + Philippine Airlines",
        departWindow: "Friday morning",
        arriveWindow: "Saturday afternoon",
        durationHours: 22.2,
        stops: 2,
        layover: "Singapore and Cebu",
        cabin: "Business",
        bookingTip: "Use premium cabin only if protecting energy for a shorter, high-intensity island stay.",
        baseFarePerTraveler: 3410
      }
    },
    stays: {
      lean: {
        name: "Hiraya Surf Hostel",
        style: "Hostel",
        address: "Tourism Road, General Luna, Surigao del Norte 8419, Philippines",
        nightlyRate: 44,
        neighborhood: "General Luna",
        whyItWorks: "Affordable social base close to cafes, surf schools, and the main General Luna strip."
      },
      balanced: {
        name: "Tropical Temple Siargao Resort",
        style: "Boutique resort",
        address: "Tourism Road, General Luna, Surigao del Norte 8419, Philippines",
        nightlyRate: 152,
        neighborhood: "General Luna",
        whyItWorks: "Good middle ground between design and practicality, with easy daily launch access."
      },
      elevated: {
        name: "Isla Cabana Resort",
        style: "Beach resort",
        address: "Tourism Road, General Luna, Surigao del Norte 8419, Philippines",
        nightlyRate: 248,
        neighborhood: "General Luna beachfront",
        whyItWorks: "A stronger comfort move that still keeps you inside the main restaurant and surf corridor."
      },
      signature: {
        name: "Nay Palad Hideaway",
        style: "Ultra-luxury resort",
        address: "Malinao, General Luna, Surigao del Norte 8419, Philippines",
        nightlyRate: 980,
        neighborhood: "Malinao",
        whyItWorks: "True top-end Siargao when the goal is a once-in-a-while all-in island experience."
      }
    },
    dining: [
      {
        name: "Kermit Siargao",
        cuisine: "Italian and Filipino",
        address: "Tourism Road, General Luna, Surigao del Norte 8419, Philippines",
        estimatedPerPerson: 20,
        signatureOrder: "Wood-fired pizza and tuna kinilaw",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Bravo Restaurant",
        cuisine: "Spanish",
        address: "Tourism Road, Catangnan, General Luna, Surigao del Norte 8419, Philippines",
        estimatedPerPerson: 24,
        signatureOrder: "Croquettes and seafood paella",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Shaka Siargao",
        cuisine: "Healthy cafe",
        address: "Cloud 9 Boardwalk, General Luna, Surigao del Norte 8419, Philippines",
        estimatedPerPerson: 12,
        signatureOrder: "Smoothie bowls and vegan breakfast plates",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Cev: Ceviche and Kinilaw Shack",
        cuisine: "Seafood",
        address: "Tourism Road, General Luna, Surigao del Norte 8419, Philippines",
        estimatedPerPerson: 18,
        signatureOrder: "Kinilaw tasting board and grilled seafood",
        fit: ["lean", "balanced", "elevated", "signature"]
      }
    ],
    activities: [
      {
        name: "Cloud 9 boardwalk and surf session",
        address: "Cloud 9 Boardwalk, General Luna, Surigao del Norte 8419, Philippines",
        estimatedPerPerson: 15,
        durationHours: 2.5,
        travelMinutesFromCenter: 12,
        summary: "The default Siargao identity block and the fastest way to feel the island's rhythm.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Sugba Lagoon day trip",
        address: "Del Carmen Port, Del Carmen, Surigao del Norte 8418, Philippines",
        estimatedPerPerson: 42,
        durationHours: 6,
        travelMinutesFromCenter: 55,
        summary: "A high-payoff scenic day that makes Siargao feel meaningfully different from just another beach trip.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Naked, Daku, and Guyam island hopping",
        address: "General Luna Port, Surigao del Norte 8419, Philippines",
        estimatedPerPerson: 32,
        durationHours: 5,
        travelMinutesFromCenter: 18,
        summary: "The best broad-appeal family water day once there is room for a dedicated boat block.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Magpupungko rock pools",
        address: "Pilar, Surigao del Norte 8420, Philippines",
        estimatedPerPerson: 3,
        durationHours: 2,
        travelMinutesFromCenter: 70,
        summary: "Low-cost geological stop that works when paired to a wider island road day.",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Private surf coaching block",
        address: "Cloud 9 area, General Luna, Surigao del Norte 8419, Philippines",
        estimatedPerPerson: 52,
        durationHours: 2,
        travelMinutesFromCenter: 12,
        summary: "A premium but worthwhile upgrade if the trip wants one coached activity instead of only passive scenery.",
        fit: ["elevated", "signature"]
      }
    ]
  }
];
