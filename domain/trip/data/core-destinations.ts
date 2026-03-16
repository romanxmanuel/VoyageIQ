import { DestinationSeed } from "@/domain/trip/types";

export const coreDestinations: DestinationSeed[] = [
  {
    slug: "tokyo",
    name: "Tokyo",
    country: "Japan",
    regionLabel: "Shibuya to Asakusa loop",
    airportCode: "HND",
    cityCode: "TYO",
    coordinates: { lat: 35.6762, lng: 139.6503 },
    heroTitle: "High-voltage city energy with precise transport and layered neighborhoods",
    summary:
      "Tokyo works when you want a trip that can flex from efficient budget nights to premium skyline dining without losing flow.",
    recommendedWindow: "Late March to May, or October to November",
    aliases: ["tokyo", "japan", "shibuya", "asakusa", "sensoji", "teamlab", "tokyo skytree"],
    averageTransitPerDay: 18,
    mapNote: "Primary movement is rail and short taxi hops between Shibuya, Ginza, and Asakusa.",
    flights: {
      lean: {
        airline: "Delta + ANA",
        departWindow: "Tuesday evening",
        arriveWindow: "Thursday afternoon",
        durationHours: 18.4,
        stops: 1,
        layover: "Seattle",
        cabin: "Main cabin",
        bookingTip: "Book 7 to 10 weeks out and target midweek departures for the best value.",
        baseFarePerTraveler: 1090
      },
      balanced: {
        airline: "United + ANA",
        departWindow: "Wednesday morning",
        arriveWindow: "Thursday evening",
        durationHours: 16.8,
        stops: 1,
        layover: "San Francisco",
        cabin: "Economy Plus",
        bookingTip: "Use a one-stop routing with a short west coast connection to protect arrival energy.",
        baseFarePerTraveler: 1280
      },
      elevated: {
        airline: "American + Japan Airlines",
        departWindow: "Thursday afternoon",
        arriveWindow: "Friday evening",
        durationHours: 15.6,
        stops: 1,
        layover: "Dallas",
        cabin: "Premium economy",
        bookingTip: "Premium economy pays off here because the long-haul segment is where fatigue compounds.",
        baseFarePerTraveler: 1685
      },
      signature: {
        airline: "ANA",
        departWindow: "Friday morning",
        arriveWindow: "Saturday afternoon",
        durationHours: 14.9,
        stops: 1,
        layover: "Los Angeles",
        cabin: "Business",
        bookingTip: "Prioritize lie-flat space on the Pacific segment if this is a once-a-year family splurge.",
        baseFarePerTraveler: 2980
      }
    },
    stays: {
      lean: {
        name: "UNPLAN Shinjuku",
        style: "Social hostel",
        address: "5-3-15 Shinjuku, Shinjuku City, Tokyo 160-0022, Japan",
        nightlyRate: 86,
        neighborhood: "Shinjuku",
        whyItWorks: "Strong transit access and the lowest nightly cost without losing neighborhood energy."
      },
      balanced: {
        name: "Hotel Sunroute Plaza Shinjuku",
        style: "Business hotel",
        address: "2-3-1 Yoyogi, Shibuya City, Tokyo 151-0053, Japan",
        nightlyRate: 212,
        neighborhood: "Shinjuku South",
        whyItWorks: "Reliable rooms, direct station access, and easier family movement day to day."
      },
      elevated: {
        name: "sequence MIYASHITA PARK",
        style: "Lifestyle hotel",
        address: "6-20-10 Jingumae, Shibuya City, Tokyo 150-0001, Japan",
        nightlyRate: 328,
        neighborhood: "Shibuya",
        whyItWorks: "Better design, better food radius, and easy walking access to the city's best night energy."
      },
      signature: {
        name: "The Capitol Hotel Tokyu",
        style: "Luxury hotel",
        address: "2-10-3 Nagatacho, Chiyoda City, Tokyo 100-0014, Japan",
        nightlyRate: 765,
        neighborhood: "Akasaka",
        whyItWorks: "High-service base with calm recovery space after long transit days and dense sightseeing."
      }
    },
    dining: [
      {
        name: "Ichiran Shibuya",
        cuisine: "Ramen",
        address: "1-22-7 Jinnan, Shibuya City, Tokyo 150-0041, Japan",
        estimatedPerPerson: 18,
        signatureOrder: "Classic tonkotsu ramen with extra chashu",
        fit: ["lean", "balanced"]
      },
      {
        name: "Uobei Shibuya Dogenzaka",
        cuisine: "Conveyor sushi",
        address: "2-29-11 Dogenzaka, Shibuya City, Tokyo 150-0043, Japan",
        estimatedPerPerson: 24,
        signatureOrder: "Salmon, seared tuna, and uni tasting plates",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Gonpachi Nishi-Azabu",
        cuisine: "Izakaya",
        address: "1-13-11 Nishi-Azabu, Minato City, Tokyo 106-0031, Japan",
        estimatedPerPerson: 54,
        signatureOrder: "Yakitori spread with soba and house cocktails",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Sushi Daiwa",
        cuisine: "Sushi",
        address: "6-6-1 Toyosu, Koto City, Tokyo 135-0061, Japan",
        estimatedPerPerson: 95,
        signatureOrder: "Morning omakase counter set",
        fit: ["elevated", "signature"]
      }
    ],
    activities: [
      {
        name: "teamLab Planets",
        address: "6-1-16 Toyosu, Koto City, Tokyo 135-0061, Japan",
        estimatedPerPerson: 33,
        durationHours: 2,
        travelMinutesFromCenter: 28,
        summary: "Immersive digital art that feels worth the hype when paired with a flexible museum morning.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Senso-ji and Nakamise Walk",
        address: "2-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan",
        estimatedPerPerson: 0,
        durationHours: 2.5,
        travelMinutesFromCenter: 24,
        summary: "High-return cultural stop with almost no budget impact.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Tokyo Skytree Observation Deck",
        address: "1-1-2 Oshiage, Sumida City, Tokyo 131-0045, Japan",
        estimatedPerPerson: 21,
        durationHours: 1.5,
        travelMinutesFromCenter: 30,
        summary: "Easy skyline anchor for families who want a definitive city overview.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Shinjuku Gyoen",
        address: "11 Naitomachi, Shinjuku City, Tokyo 160-0014, Japan",
        estimatedPerPerson: 4,
        durationHours: 2,
        travelMinutesFromCenter: 15,
        summary: "Low-cost reset that protects trip energy between dense urban days.",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Private evening food crawl",
        address: "Ebisu Station area, Shibuya City, Tokyo 150-0022, Japan",
        estimatedPerPerson: 110,
        durationHours: 3,
        travelMinutesFromCenter: 18,
        summary: "A premium shortcut into neighborhood food confidence without planning friction.",
        fit: ["elevated", "signature"]
      }
    ]
  },
  {
    slug: "paris",
    name: "Paris",
    country: "France",
    regionLabel: "Marais, Saint-Germain, and Left Bank",
    airportCode: "CDG",
    cityCode: "PAR",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    heroTitle: "Museum density, cafe rhythm, and elegant tradeoffs between walkability and splurge",
    summary:
      "Paris is strongest when the plan balances iconic anchors with neighborhood pacing so the trip feels cinematic rather than rushed.",
    recommendedWindow: "April to June, or September to October",
    aliases: ["paris", "france", "eiffel tower", "louvre", "montmartre", "marais"],
    averageTransitPerDay: 20,
    mapNote: "This trip works best by combining Metro rides with long walking blocks in the core districts.",
    flights: {
      lean: {
        airline: "JetBlue + Air France",
        departWindow: "Monday night",
        arriveWindow: "Tuesday afternoon",
        durationHours: 11.5,
        stops: 1,
        layover: "JFK",
        cabin: "Economy",
        bookingTip: "Red-eye into a short taxi ride saves a hotel night without wrecking the schedule.",
        baseFarePerTraveler: 760
      },
      balanced: {
        airline: "Delta + Air France",
        departWindow: "Tuesday evening",
        arriveWindow: "Wednesday morning",
        durationHours: 10.6,
        stops: 1,
        layover: "Atlanta",
        cabin: "Economy Comfort",
        bookingTip: "Aim for a morning Paris arrival so the first day still yields a meaningful walkable block.",
        baseFarePerTraveler: 940
      },
      elevated: {
        airline: "United",
        departWindow: "Wednesday afternoon",
        arriveWindow: "Thursday morning",
        durationHours: 10.1,
        stops: 1,
        layover: "Washington, D.C.",
        cabin: "Premium Plus",
        bookingTip: "Premium cabin on the transatlantic leg helps families land ready for museums and reservations.",
        baseFarePerTraveler: 1380
      },
      signature: {
        airline: "Air France",
        departWindow: "Thursday evening",
        arriveWindow: "Friday morning",
        durationHours: 9.4,
        stops: 1,
        layover: "Miami",
        cabin: "Business",
        bookingTip: "If this is a celebratory trip, use business class to buy back sleep and first-day energy.",
        baseFarePerTraveler: 2690
      }
    },
    stays: {
      lean: {
        name: "The People Paris Marais",
        style: "Design hostel",
        address: "17 Boulevard Morland, 75004 Paris, France",
        nightlyRate: 94,
        neighborhood: "Bastille / Marais edge",
        whyItWorks: "High neighborhood value with solid transit and an easy first-time Paris feel."
      },
      balanced: {
        name: "citizenM Paris Gare de Lyon",
        style: "Smart hotel",
        address: "8 Rue Van Gogh, 75012 Paris, France",
        nightlyRate: 248,
        neighborhood: "Gare de Lyon",
        whyItWorks: "Consistent rooms and frictionless logistics for families who want fast daily starts."
      },
      elevated: {
        name: "Hotel Providence",
        style: "Boutique hotel",
        address: "90 Rue Rene Boulanger, 75010 Paris, France",
        nightlyRate: 395,
        neighborhood: "Canal Saint-Martin",
        whyItWorks: "A more memorable stay with stronger local dining right outside the door."
      },
      signature: {
        name: "Le Bristol Paris",
        style: "Luxury palace hotel",
        address: "112 Rue du Faubourg Saint-Honore, 75008 Paris, France",
        nightlyRate: 1320,
        neighborhood: "8th arrondissement",
        whyItWorks: "Classic splurge base with serious service and direct access to premium shopping and dining."
      }
    },
    dining: [
      {
        name: "L'As du Fallafel",
        cuisine: "Falafel",
        address: "34 Rue des Rosiers, 75004 Paris, France",
        estimatedPerPerson: 16,
        signatureOrder: "Falafel pita with eggplant and spicy sauce",
        fit: ["lean", "balanced"]
      },
      {
        name: "Bouillon Chartier",
        cuisine: "Classic Parisian",
        address: "7 Rue du Faubourg Montmartre, 75009 Paris, France",
        estimatedPerPerson: 26,
        signatureOrder: "Steak hache, poireaux vinaigrette, creme caramel",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Les Enfants du Marche",
        cuisine: "Wine bar",
        address: "39 Rue de Bretagne, 75003 Paris, France",
        estimatedPerPerson: 48,
        signatureOrder: "Seasonal plates with natural wine pairings",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Septime",
        cuisine: "Modern French",
        address: "80 Rue de Charonne, 75011 Paris, France",
        estimatedPerPerson: 120,
        signatureOrder: "Tasting menu with low-intervention wine pairing",
        fit: ["elevated", "signature"]
      }
    ],
    activities: [
      {
        name: "Louvre timed entry",
        address: "Rue de Rivoli, 75001 Paris, France",
        estimatedPerPerson: 25,
        durationHours: 3,
        travelMinutesFromCenter: 18,
        summary: "Still worth anchoring if you preselect a route instead of trying to see everything.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Seine river cruise",
        address: "Port de la Bourdonnais, 75007 Paris, France",
        estimatedPerPerson: 19,
        durationHours: 1,
        travelMinutesFromCenter: 20,
        summary: "Fast way to orient the family on day one with strong visual payoff.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Musee d'Orsay",
        address: "1 Rue de la Legion d'Honneur, 75007 Paris, France",
        estimatedPerPerson: 20,
        durationHours: 2.5,
        travelMinutesFromCenter: 22,
        summary: "Higher signal than another giant museum day if you want the trip to stay graceful.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Montmartre guided walk",
        address: "35 Rue du Chevalier de la Barre, 75018 Paris, France",
        estimatedPerPerson: 32,
        durationHours: 2,
        travelMinutesFromCenter: 25,
        summary: "Good trade when you want local story without burning a full day.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Versailles day trip",
        address: "Place d'Armes, 78000 Versailles, France",
        estimatedPerPerson: 52,
        durationHours: 6,
        travelMinutesFromCenter: 48,
        summary: "Worth it once the trip has enough days to absorb the transit overhead.",
        fit: ["elevated", "signature"]
      }
    ]
  },
  {
    slug: "honolulu",
    name: "Honolulu",
    country: "United States",
    regionLabel: "Waikiki, Kakaako, and Diamond Head",
    airportCode: "HNL",
    cityCode: "HNL",
    coordinates: { lat: 21.3069, lng: -157.8583 },
    heroTitle: "Beach ease, family-proof logistics, and clean luxury upside when budget increases",
    summary:
      "Honolulu is a strong family optimizer because you can control cost through lodging mix while keeping the emotional payoff high.",
    recommendedWindow: "April to early June, or September to mid-November",
    aliases: ["honolulu", "hawaii", "waikiki", "diamond head", "oahu", "aloha", "pearl harbor"],
    averageTransitPerDay: 28,
    mapNote: "Mix Biki bikes, rideshares, and one or two rental-car days depending on scenario tier.",
    flights: {
      lean: {
        airline: "Southwest + Hawaiian",
        departWindow: "Wednesday morning",
        arriveWindow: "Wednesday evening",
        durationHours: 13.2,
        stops: 1,
        layover: "Las Vegas",
        cabin: "Economy",
        bookingTip: "The cheapest family move is a single west coast or Vegas break before the Pacific segment.",
        baseFarePerTraveler: 720
      },
      balanced: {
        airline: "Delta",
        departWindow: "Thursday morning",
        arriveWindow: "Thursday evening",
        durationHours: 11.6,
        stops: 1,
        layover: "Los Angeles",
        cabin: "Comfort+",
        bookingTip: "Protect the family with a shorter layover and earlier island arrival.",
        baseFarePerTraveler: 890
      },
      elevated: {
        airline: "United",
        departWindow: "Friday morning",
        arriveWindow: "Friday afternoon",
        durationHours: 10.8,
        stops: 1,
        layover: "San Francisco",
        cabin: "Premium Plus",
        bookingTip: "A better cabin on the mainland-Hawaii leg meaningfully improves arrival energy.",
        baseFarePerTraveler: 1280
      },
      signature: {
        airline: "Hawaiian Airlines",
        departWindow: "Saturday morning",
        arriveWindow: "Saturday afternoon",
        durationHours: 10.4,
        stops: 1,
        layover: "Los Angeles",
        cabin: "First",
        bookingTip: "This is the cleanest splurge if the trip is celebrating something personal.",
        baseFarePerTraveler: 2140
      }
    },
    stays: {
      lean: {
        name: "The Beach Waikiki Boutique Hostel",
        style: "Budget stay",
        address: "2569 Cartwright Road, Honolulu, HI 96815",
        nightlyRate: 78,
        neighborhood: "Waikiki East",
        whyItWorks: "Budget-friendly bed base that still puts the beach and food within walking distance."
      },
      balanced: {
        name: "Vive Hotel Waikiki",
        style: "Value hotel",
        address: "2426 Kuhio Avenue, Honolulu, HI 96815",
        nightlyRate: 224,
        neighborhood: "Waikiki",
        whyItWorks: "One of the cleanest family-value moves when you want location without resort-level pricing."
      },
      elevated: {
        name: "Wayfinder Waikiki",
        style: "Lifestyle hotel",
        address: "2375 Ala Wai Boulevard, Honolulu, HI 96815",
        nightlyRate: 342,
        neighborhood: "Ala Wai",
        whyItWorks: "Better design feel and easier pool downtime without blowing up the whole trip."
      },
      signature: {
        name: "Halekulani",
        style: "Luxury resort",
        address: "2199 Kalia Road, Honolulu, HI 96815",
        nightlyRate: 980,
        neighborhood: "Waikiki Beachfront",
        whyItWorks: "Classic top-end Hawaii base when the goal is a true all-in celebratory family trip."
      }
    },
    dining: [
      {
        name: "Musubi Cafe Iyasume",
        cuisine: "Grab-and-go local",
        address: "2427 Kuhio Avenue, Honolulu, HI 96815",
        estimatedPerPerson: 12,
        signatureOrder: "Spam musubi trio and miso soup",
        fit: ["lean", "balanced"]
      },
      {
        name: "Marugame Udon",
        cuisine: "Udon",
        address: "2310 Kuhio Avenue, Honolulu, HI 96815",
        estimatedPerPerson: 18,
        signatureOrder: "Niku udon with tempura add-ons",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Ono Seafood",
        cuisine: "Poke",
        address: "747 Kapahulu Avenue, Honolulu, HI 96816",
        estimatedPerPerson: 24,
        signatureOrder: "Shoyu ahi poke bowl",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "House Without A Key",
        cuisine: "Beachfront dinner",
        address: "2199 Kalia Road, Honolulu, HI 96815",
        estimatedPerPerson: 92,
        signatureOrder: "Fresh island fish and sunset cocktails",
        fit: ["elevated", "signature"]
      }
    ],
    activities: [
      {
        name: "Diamond Head crater hike",
        address: "Diamond Head Road, Honolulu, HI 96815",
        estimatedPerPerson: 5,
        durationHours: 2,
        travelMinutesFromCenter: 18,
        summary: "Classic low-cost win with a high emotional payoff for first-time visitors.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Pearl Harbor National Memorial",
        address: "1 Arizona Memorial Place, Honolulu, HI 96818",
        estimatedPerPerson: 1,
        durationHours: 3,
        travelMinutesFromCenter: 32,
        summary: "High-value history block that works especially well on mixed-age family trips.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Kualoa Ranch UTV tour",
        address: "49-560 Kamehameha Highway, Kaneohe, HI 96744",
        estimatedPerPerson: 149,
        durationHours: 3,
        travelMinutesFromCenter: 55,
        summary: "Expensive, but one of the clearest memory-making upgrades when budget allows.",
        fit: ["elevated", "signature"]
      },
      {
        name: "Waikiki surf lesson",
        address: "2552 Kalakaua Avenue, Honolulu, HI 96815",
        estimatedPerPerson: 58,
        durationHours: 2,
        travelMinutesFromCenter: 10,
        summary: "A strong mid-trip energy spike that feels more memorable than another retail block.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Sunset catamaran sail",
        address: "1009 Ala Moana Boulevard, Honolulu, HI 96814",
        estimatedPerPerson: 76,
        durationHours: 1.5,
        travelMinutesFromCenter: 20,
        summary: "Best used when the trip wants one polished signature moment without a full luxury budget.",
        fit: ["balanced", "elevated", "signature"]
      }
    ]
  }
];
