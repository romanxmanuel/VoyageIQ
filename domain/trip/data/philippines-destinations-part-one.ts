import { DestinationSeed } from "@/domain/trip/types";

export const philippinesDestinationsPartOne: DestinationSeed[] = [
  {
    slug: "boracay",
    name: "Boracay",
    country: "Philippines",
    regionLabel: "White Beach, Station 1 to Station 3",
    airportCode: "MPH",
    cityCode: "MPH",
    coordinates: { lat: 11.9674, lng: 121.9248 },
    tourismUrl: "https://www.itsmorefuninthephilippines.com/destinations/boracay/",
    heroTitle: "Powder-white beach days, easy island pacing, and a high payoff family reset",
    summary:
      "Boracay is the cleanest Philippines first-timer move when the goal is maximum scenic payoff with straightforward logistics.",
    recommendedWindow: "November to May, with January to April as the clearest beach season",
    aliases: ["philippines", "boracay", "white beach", "station 1", "station 2", "station 3", "caticlan"],
    averageTransitPerDay: 22,
    mapNote: "Most days are walkable along White Beach with short e-trike hops for dinners and activity docks.",
    flights: {
      lean: {
        airline: "Philippine Airlines + Cebu Pacific",
        departWindow: "Tuesday evening",
        arriveWindow: "Thursday afternoon",
        durationHours: 26.8,
        stops: 2,
        layover: "Los Angeles and Manila",
        cabin: "Economy",
        bookingTip: "Save the most by flying into Manila first, then booking the Caticlan hop as a separate leg.",
        baseFarePerTraveler: 1120
      },
      balanced: {
        airline: "ANA + Philippine Airlines",
        departWindow: "Wednesday morning",
        arriveWindow: "Thursday evening",
        durationHours: 23.7,
        stops: 2,
        layover: "Tokyo and Manila",
        cabin: "Economy Plus",
        bookingTip: "A cleaner international carrier on the long-haul leg helps a lot before the final island transfer.",
        baseFarePerTraveler: 1380
      },
      elevated: {
        airline: "Korean Air + Philippine Airlines",
        departWindow: "Thursday morning",
        arriveWindow: "Friday afternoon",
        durationHours: 21.9,
        stops: 2,
        layover: "Seoul and Manila",
        cabin: "Premium economy",
        bookingTip: "Premium economy is worth considering here because the long-haul plus domestic transfer compounds fatigue.",
        baseFarePerTraveler: 1825
      },
      signature: {
        airline: "Singapore Airlines + Philippine Airlines",
        departWindow: "Friday morning",
        arriveWindow: "Saturday afternoon",
        durationHours: 21.1,
        stops: 2,
        layover: "Singapore and Manila",
        cabin: "Business",
        bookingTip: "If this is a celebratory family trip, buy back recovery time on the transpacific and regional legs.",
        baseFarePerTraveler: 3380
      }
    },
    stays: {
      lean: {
        name: "Frendz Hostel Boracay",
        style: "Social hostel",
        address: "Balabag, Malay, Boracay Island, Aklan 5608, Philippines",
        nightlyRate: 54,
        neighborhood: "Station 2",
        whyItWorks: "Affordable base close to White Beach, with easy access to food and boat activity pickups."
      },
      balanced: {
        name: "Henann Garden Resort",
        style: "Resort hotel",
        address: "Station 2, Boracay Highway Central, Boracay Island, Aklan 5608, Philippines",
        nightlyRate: 164,
        neighborhood: "Station 2",
        whyItWorks: "Reliable mid-range family move with better pool downtime and still-walkable beach access."
      },
      elevated: {
        name: "Aqua Boracay",
        style: "Lifestyle resort",
        address: "Bulabog Beach, Boracay Island, Aklan 5608, Philippines",
        nightlyRate: 238,
        neighborhood: "Bulabog",
        whyItWorks: "Quieter rooms, stronger design, and easy crossover to both Bulabog and White Beach energy."
      },
      signature: {
        name: "Shangri-La Boracay",
        style: "Luxury resort",
        address: "Barangay Yapak, Malay, Boracay Island, Aklan 5608, Philippines",
        nightlyRate: 612,
        neighborhood: "Yapak",
        whyItWorks: "The premium island move when the goal is a full-service family reset with a private-beach feel."
      }
    },
    dining: [
      {
        name: "Two Seasons Boracay BarLO",
        cuisine: "Seafood",
        address: "Station 1, White Beach Path, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 24,
        signatureOrder: "Oyster sisig and grilled seafood platters",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Nonie's",
        cuisine: "Filipino fusion",
        address: "Station X, Hue Hotels and Resorts, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 18,
        signatureOrder: "Chicken inasal and calamansi juice",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Dos Mestizos",
        cuisine: "Spanish Filipino",
        address: "Remedios Street, Station 2, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 32,
        signatureOrder: "Paella negra and sangria",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "The Sunny Side Cafe",
        cuisine: "Breakfast cafe",
        address: "Station 3, White Beach Path, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 15,
        signatureOrder: "Mango cream pancakes and local coffee",
        fit: ["lean", "balanced", "elevated", "signature"]
      }
    ],
    activities: [
      {
        name: "White Beach sailing paraw cruise",
        address: "White Beach, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 20,
        durationHours: 1.5,
        travelMinutesFromCenter: 8,
        summary: "Low-friction signature Boracay memory block with huge scenic payoff at sunset.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Island hopping with snorkeling stops",
        address: "Station 1 boat area, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 34,
        durationHours: 5,
        travelMinutesFromCenter: 12,
        summary: "Best family-value upgrade once the trip has enough time for a full water day.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Mount Luho viewpoint ride",
        address: "Mount Luho Road, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 5,
        durationHours: 1.5,
        travelMinutesFromCenter: 20,
        summary: "Cheap panoramic reset that helps break up consecutive beach blocks.",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Private helmet diving session",
        address: "Bulabog Beach, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 48,
        durationHours: 2,
        travelMinutesFromCenter: 18,
        summary: "A more adventurous premium bump for families who want one standout underwater memory.",
        fit: ["elevated", "signature"]
      },
      {
        name: "Puka Shell Beach half-day",
        address: "Puka Shell Beach, Boracay Island, Aklan 5608, Philippines",
        estimatedPerPerson: 0,
        durationHours: 3,
        travelMinutesFromCenter: 22,
        summary: "High-return, low-cost beach switch when you want calmer scenery without another paid tour.",
        fit: ["lean", "balanced", "elevated", "signature"]
      }
    ],
    venues: {
      activities: {},
      dining: { casual: [], sitdown: [], premium: [] },
      neighborhoods: { lean: "Station 2", balanced: "Station 2", elevated: "Bulabog", signature: "Yapak" }
    },
    flightFloors: {
      orlando: { economy: 1200, premiumEconomy: 2400, business: 4500 },
      "*": { economy: 1000, premiumEconomy: 2000, business: 3800 }
    },
    hotelFloors: { lean: 50, balanced: 150, elevated: 220, signature: 580 },
    arrivalTransferCost: { low: 8, high: 20 }
  },
  {
    slug: "elnido",
    name: "El Nido",
    country: "Philippines",
    regionLabel: "Corong Corong, Bacuit Bay, and Big Lagoon routes",
    airportCode: "ENI",
    cityCode: "ENI",
    coordinates: { lat: 11.1784, lng: 119.4053 },
    tourismUrl: "https://elnidoofficial.com/",
    heroTitle: "Limestone cliffs, blue-water tours, and one of the strongest scenic payoffs in Southeast Asia",
    summary:
      "El Nido is for the Philippines version of a cinematic island trip where boat tours are the core emotional driver.",
    recommendedWindow: "November to May, especially December to April for calmer seas",
    aliases: ["philippines", "el nido", "palawan", "bacuit bay", "big lagoon", "small lagoon", "corong corong"],
    averageTransitPerDay: 28,
    mapNote: "Most movement is tricycle plus boat-tour staging, so route pacing matters more than distance on paper.",
    flights: {
      lean: {
        airline: "Philippine Airlines + AirSWIFT",
        departWindow: "Tuesday evening",
        arriveWindow: "Thursday afternoon",
        durationHours: 27.2,
        stops: 2,
        layover: "Los Angeles and Manila",
        cabin: "Economy",
        bookingTip: "The cheapest version is usually long-haul to Manila plus a separate Palawan domestic booking.",
        baseFarePerTraveler: 1180
      },
      balanced: {
        airline: "ANA + AirSWIFT",
        departWindow: "Wednesday morning",
        arriveWindow: "Thursday afternoon",
        durationHours: 24.8,
        stops: 2,
        layover: "Tokyo and Manila",
        cabin: "Economy Plus",
        bookingTip: "Keep at least a half-day buffer in Manila when stitching international and island flights.",
        baseFarePerTraveler: 1440
      },
      elevated: {
        airline: "Korean Air + AirSWIFT",
        departWindow: "Thursday morning",
        arriveWindow: "Friday afternoon",
        durationHours: 22.9,
        stops: 2,
        layover: "Seoul and Manila",
        cabin: "Premium economy",
        bookingTip: "Premium space matters because the final small-aircraft hop is better handled when the long-haul leg was comfortable.",
        baseFarePerTraveler: 1890
      },
      signature: {
        airline: "Singapore Airlines + AirSWIFT",
        departWindow: "Friday morning",
        arriveWindow: "Saturday afternoon",
        durationHours: 22.1,
        stops: 2,
        layover: "Singapore and Manila",
        cabin: "Business",
        bookingTip: "Use business only if the island experience is the point and you want to land ready for a boat day fast.",
        baseFarePerTraveler: 3490
      }
    },
    stays: {
      lean: {
        name: "Spin Designer Hostel",
        style: "Design hostel",
        address: "Balinsasayaw Road, El Nido, Palawan 5313, Philippines",
        nightlyRate: 48,
        neighborhood: "El Nido Town",
        whyItWorks: "Cheap, social, and walking distance to town restaurants and island-hopping assembly points."
      },
      balanced: {
        name: "Sea Cocoon Hotel",
        style: "Value hotel",
        address: "Calle Hama, El Nido, Palawan 5313, Philippines",
        nightlyRate: 142,
        neighborhood: "El Nido Town",
        whyItWorks: "Strong convenience move when you want easier morning departures for Tour A and Tour C."
      },
      elevated: {
        name: "Karuna El Nido Villas",
        style: "Villa stay",
        address: "Corong Corong, El Nido, Palawan 5313, Philippines",
        nightlyRate: 236,
        neighborhood: "Corong Corong",
        whyItWorks: "Better view payoff and calmer evenings while still staying close to town."
      },
      signature: {
        name: "Lihim Resorts",
        style: "Luxury resort",
        address: "999 Sitio Caalan, Barangay Masagana, El Nido, Palawan 5313, Philippines",
        nightlyRate: 695,
        neighborhood: "Caalan",
        whyItWorks: "Private-feeling premium base that turns the whole trip into a resort-plus-adventure experience."
      }
    },
    dining: [
      {
        name: "Artcafe",
        cuisine: "Cafe and Filipino fusion",
        address: "Calle Hama, Barangay Buena Suerte, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 16,
        signatureOrder: "Breakfast plates and mango shakes",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Happiness Beach Bar",
        cuisine: "Middle Eastern",
        address: "Serena Street, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 19,
        signatureOrder: "Shawarma plates and smoothie bowls",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Trattoria Altrove",
        cuisine: "Pizza",
        address: "Serena Street, Barangay Buena Suerte, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 22,
        signatureOrder: "Wood-fired pizza and burrata",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Bella Vita El Nido",
        cuisine: "Italian",
        address: "Corong Corong, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 28,
        signatureOrder: "Seafood pasta and sunset cocktails",
        fit: ["balanced", "elevated", "signature"]
      }
    ],
    activities: [
      {
        name: "Tour A Big Lagoon island hopping",
        address: "El Nido Port, Barangay Buena Suerte, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 32,
        durationHours: 7,
        travelMinutesFromCenter: 10,
        summary: "The classic El Nido day that justifies the destination for first-time visitors.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Las Cabanas sunset beach block",
        address: "Marimegmeg Beach, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 0,
        durationHours: 3,
        travelMinutesFromCenter: 18,
        summary: "High visual payoff with almost no spend, especially good on arrival or low-energy days.",
        fit: ["lean", "balanced", "elevated", "signature"]
      },
      {
        name: "Tour C hidden beaches circuit",
        address: "El Nido Port, Barangay Buena Suerte, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 35,
        durationHours: 7,
        travelMinutesFromCenter: 10,
        summary: "Worth adding once the trip has enough days to support a second major boat day.",
        fit: ["balanced", "elevated", "signature"]
      },
      {
        name: "Canopy walk viewpoint",
        address: "Taraw Cliff Access, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 11,
        durationHours: 1,
        travelMinutesFromCenter: 8,
        summary: "Cheap and memorable vertical viewpoint without committing to a full trekking day.",
        fit: ["lean", "balanced", "elevated"]
      },
      {
        name: "Private premium speedboat charter",
        address: "El Nido Port, Barangay Buena Suerte, El Nido, Palawan 5313, Philippines",
        estimatedPerPerson: 120,
        durationHours: 6,
        travelMinutesFromCenter: 10,
        summary: "A signature-level convenience upgrade when avoiding crowd friction matters more than cost.",
        fit: ["elevated", "signature"]
      }
    ],
    venues: {
      activities: {},
      dining: { casual: [], sitdown: [], premium: [] },
      neighborhoods: { lean: "El Nido Town", balanced: "El Nido Town", elevated: "Corong Corong", signature: "Caalan" }
    },
    flightFloors: {
      orlando: { economy: 1250, premiumEconomy: 2500, business: 4600 },
      "*": { economy: 1050, premiumEconomy: 2100, business: 4000 }
    },
    hotelFloors: { lean: 45, balanced: 130, elevated: 220, signature: 650 },
    arrivalTransferCost: { low: 10, high: 25 }
  }
];
