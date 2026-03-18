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
    ],
    venues: {
      activities: {
        lean: [
          {
            name: "Senso-ji Temple & Nakamise Shopping Street",
            neighborhood: "Asakusa",
            estimatedPerPerson: 0,
            durationHours: 2.5,
            description: "Tokyo's oldest temple with a famous market street leading to the gate. Free entry — arrive before 9 AM to beat tour groups."
          },
          {
            name: "Shibuya Crossing & Scramble Square observation deck",
            neighborhood: "Shibuya",
            estimatedPerPerson: 20,
            durationHours: 1.5,
            description: "Watch the world's busiest pedestrian crossing from street level or from the rooftop deck on the 46th floor."
          },
          {
            name: "Ueno Park & Tokyo National Museum",
            neighborhood: "Ueno",
            estimatedPerPerson: 5,
            durationHours: 3,
            description: "The museum complex anchors one of Tokyo's biggest public parks. Museum entry ¥1,000; park is free."
          }
        ],
        balanced: [
          {
            name: "Meiji Jingu Shrine & Harajuku walk",
            neighborhood: "Harajuku",
            estimatedPerPerson: 0,
            durationHours: 2,
            description: "Forested shrine in the middle of the city followed by Takeshita Street for local youth fashion and street food."
          },
          {
            name: "Tokyo Skytree",
            neighborhood: "Asakusa",
            estimatedPerPerson: 22,
            durationHours: 2,
            description: "World's second-tallest tower with a 350m observation deck. Book tickets online to skip the line."
          },
          {
            name: "Tsukiji Outer Market breakfast",
            neighborhood: "Tsukiji",
            estimatedPerPerson: 18,
            durationHours: 1.5,
            description: "The outer market is still open and serves the best tamago sushi and sashimi breakfast in the city."
          }
        ],
        elevated: [
          {
            name: "teamLab Borderless (Azabudai Hills)",
            neighborhood: "Azabudai",
            estimatedPerPerson: 32,
            durationHours: 3,
            description: "Immersive digital art museum with dozens of connected rooms. Book 2–3 weeks out — sells out consistently."
          },
          {
            name: "Sake tasting at Kurand Sake Market",
            neighborhood: "Ikebukuro",
            estimatedPerPerson: 40,
            durationHours: 2,
            description: "Flat-fee sake tasting with 100+ varieties. Get a cup and work through the flavors at your own pace."
          },
          {
            name: "Tokyo cooking class (ramen or sushi)",
            neighborhood: "Shinjuku",
            estimatedPerPerson: 65,
            durationHours: 3,
            description: "Small-group class where you cook and eat. Tokyo Cooking Studio and Cooking Sun both get strong reviews."
          }
        ],
        signature: [
          {
            name: "Robot Restaurant dinner show",
            neighborhood: "Shinjuku",
            estimatedPerPerson: 100,
            durationHours: 2.5,
            description: "Loud, absurd, and completely Tokyo. Dinner show with giant robots, neon dancers, and over-the-top production design."
          },
          {
            name: "Shinkansen day trip to Nikko or Kamakura",
            neighborhood: "Nikko / Kamakura",
            estimatedPerPerson: 130,
            durationHours: 8,
            description: "One-day bullet-train escape from Tokyo. Nikko for ornate shrines and waterfalls; Kamakura for the Great Buddha and coastal walks."
          },
          {
            name: "Private sake tasting & kaiseki pairing",
            neighborhood: "Ginza",
            estimatedPerPerson: 90,
            durationHours: 2.5,
            description: "Guided private session pairing regional sake with seasonal kaiseki dishes. Book at least a week ahead."
          }
        ]
      },
      dining: {
        casual: [
          {
            name: "Fuunji",
            neighborhood: "Shinjuku",
            cuisine: "Tsukemen",
            estimatedPerPerson: 14,
            description: "One of Tokyo's most celebrated tsukemen spots. Rich, concentrated dipping broth. Expect a short line at lunch."
          },
          {
            name: "Ichiran Ramen",
            neighborhood: "Shibuya",
            cuisine: "Ramen",
            estimatedPerPerson: 13,
            description: "Solo-booth ramen experience. Order broth richness and spice on a form. Perfect for a low-key meal after sightseeing."
          },
          {
            name: "Gyukatsu Motomura",
            neighborhood: "Shibuya",
            cuisine: "Gyukatsu",
            estimatedPerPerson: 16,
            description: "Breaded beef cutlet cooked at your table on a hot stone. Better and cheaper than tonkatsu at comparable spots."
          }
        ],
        sitdown: [
          {
            name: "Gonpachi Shibuya",
            neighborhood: "Shibuya",
            cuisine: "Izakaya",
            estimatedPerPerson: 35,
            description: "Classic Tokyo izakaya atmosphere — skewers, sake, and grilled things. The Shibuya branch is the most accessible."
          },
          {
            name: "Ninja Tokyo",
            neighborhood: "Akasaka",
            cuisine: "Japanese multi-course",
            estimatedPerPerson: 75,
            description: "Novelty dinner experience in a feudal-style maze. Food is decent; the theatrics make it memorable for groups."
          },
          {
            name: "Trattoria Siciliana Don Ciccio",
            neighborhood: "Shinjuku",
            cuisine: "Italian",
            estimatedPerPerson: 45,
            description: "Tokyo has surprisingly great Italian food. This local neighborhood spot is excellent value for a non-Japanese night."
          }
        ],
        premium: [
          {
            name: "Sushi Saito",
            neighborhood: "Akasaka",
            cuisine: "Omakase sushi",
            estimatedPerPerson: 350,
            description: "Three Michelin stars. Considered one of the best sushi counters in the world. Requires a Japanese-speaking local contact to book."
          },
          {
            name: "Narisawa",
            neighborhood: "Minami-Aoyama",
            cuisine: "Innovative Japanese",
            estimatedPerPerson: 280,
            description: "Two Michelin stars. Regularly ranked in Asia's 50 Best Restaurants. Book at least 2 months ahead."
          },
          {
            name: "Sukiyabashi Jiro Honten",
            neighborhood: "Ginza",
            cuisine: "Omakase sushi",
            estimatedPerPerson: 400,
            description: "The most famous sushi counter in the world. Three Michelin stars. Booking only through a hotel concierge."
          }
        ]
      },
      neighborhoods: {
        lean: "Asakusa",
        balanced: "Shinjuku",
        elevated: "Shibuya",
        signature: "Ginza"
      },
      travelIntel: {
        bestMonths: "March–May (cherry blossoms) and Oct–Nov. June–July is rainy season — expect humidity and crowds without the blooms.",
        visaNote: "US citizens: no visa required for stays under 90 days. Passport must be valid for the duration of stay.",
        currency: "Japanese Yen (JPY). Tokyo is increasingly card-friendly but carry ¥10,000–¥20,000 cash for smaller shops, shrines, and vending machines.",
        transitTip: "Get a Suica IC card at the airport — reloadable, works on all trains and buses. JR Pass ($300–$500) only worth it if you plan to leave Tokyo.",
        arrivalNote: "Haneda (HND): 30 min by Tokyo Monorail (~$5). Narita (NRT): 60–90 min by Narita Express (~$30). Haneda is strongly preferred."
      }
    },
    flightFloors: {
      orlando: { economy: 1100, premiumEconomy: 2200, business: 4000 },
      miami: { economy: 1100, premiumEconomy: 2200, business: 4000 },
      "*": { economy: 900, premiumEconomy: 1800, business: 3500 }
    },
    hotelFloors: {
      lean: 75,
      balanced: 120,
      elevated: 220,
      signature: 350
    },
    arrivalTransferCost: { low: 5, high: 30 }
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
    ],
    venues: {
      activities: {
        lean: [
          { name: "Musée d'Orsay", neighborhood: "Saint-Germain", estimatedPerPerson: 16, durationHours: 3, description: "World-class Impressionist collection in a converted train station. Book online — lines at the door are long." },
          { name: "Sacré-Cœur & Montmartre walk", neighborhood: "Montmartre", estimatedPerPerson: 0, durationHours: 2.5, description: "Free hilltop basilica with a sweeping Paris view. Wander the artist quarter below for crepes and street sketches." },
          { name: "Centre Pompidou", neighborhood: "Marais", estimatedPerPerson: 15, durationHours: 2, description: "Modern and contemporary art museum with a rooftop view. Combine with a walk through Le Marais." }
        ],
        balanced: [
          { name: "Eiffel Tower (summit)", neighborhood: "Champ de Mars", estimatedPerPerson: 32, durationHours: 2, description: "Book the summit ticket online weeks ahead. Visit at dusk for golden hour then stay for the hourly light show." },
          { name: "Versailles day trip", neighborhood: "Versailles", estimatedPerPerson: 35, durationHours: 6, description: "Palace of Versailles plus the Grand Trianon and gardens. Take the RER C — 40 minutes from central Paris." },
          { name: "Louvre Museum", neighborhood: "1st arrondissement", estimatedPerPerson: 22, durationHours: 3, description: "Pick 2–3 wings rather than trying to see everything. Denon wing has the Mona Lisa, Venus de Milo, and Winged Victory." }
        ],
        elevated: [
          { name: "Paris food market tour (Marché d'Aligre)", neighborhood: "Bastille", estimatedPerPerson: 45, durationHours: 3, description: "Guided morning market tour with tastings. One of the oldest and most authentic outdoor markets in Paris." },
          { name: "Seine River dinner cruise", neighborhood: "Pont de l'Alma", estimatedPerPerson: 90, durationHours: 2.5, description: "Bateaux Parisiens or Bateaux Mouches. Multi-course French dinner while passing Notre-Dame and the Eiffel Tower." },
          { name: "Musée Rodin & Gardens", neighborhood: "Invalides", estimatedPerPerson: 14, durationHours: 2, description: "Elegant sculpture museum in an 18th-century mansion. The Thinker is in the garden. Quiet and manageable." }
        ],
        signature: [
          { name: "Moulin Rouge dinner show", neighborhood: "Pigalle", estimatedPerPerson: 240, durationHours: 4, description: "The original cabaret. Dinner + show package. Book well in advance — regularly sold out months ahead." },
          { name: "Private cheese and wine tasting", neighborhood: "Marais", estimatedPerPerson: 110, durationHours: 2, description: "Small-group or private session in a Marais cave à vin. Learn AOC cheese pairings with regional French wines." },
          { name: "Champagne region day trip", neighborhood: "Épernay", estimatedPerPerson: 180, durationHours: 8, description: "Train to Épernay or Reims for Moët, Veuve Clicquot, or Taittinger cellar tours. Best with a half-day tour company." }
        ]
      },
      dining: {
        casual: [
          { name: "Bouillon Pigalle", neighborhood: "Pigalle", cuisine: "French bistro", estimatedPerPerson: 18, description: "Classic bouillon — affordable traditional French food in a beautiful 1900s brasserie setting. Expect a queue but it moves fast." },
          { name: "L'As du Fallafel", neighborhood: "Marais", cuisine: "Falafel", estimatedPerPerson: 8, description: "Legendary falafel stand in the Jewish quarter. The takeaway line is worth it — best falafel in Paris." },
          { name: "Du Pain et des Idées", neighborhood: "Canal Saint-Martin", cuisine: "Boulangerie", estimatedPerPerson: 7, description: "Widely considered one of the best bakeries in Paris. Try the escargot pastry and the pain des amis loaf." }
        ],
        sitdown: [
          { name: "Septime", neighborhood: "Bastille", cuisine: "Modern French bistro", estimatedPerPerson: 75, description: "One Michelin star with a relaxed atmosphere. Book 2–3 weeks ahead. The tasting menu changes weekly." },
          { name: "Le Comptoir du Relais", neighborhood: "Saint-Germain", cuisine: "French brasserie", estimatedPerPerson: 45, description: "Yves Camdeborde's classic brasserie. Excellent steak tartare and charcuterie. No reservations for dinner — arrive early." },
          { name: "Frenchie Bar à Vins", neighborhood: "Sentier", cuisine: "Wine bar", estimatedPerPerson: 55, description: "Smaller sister to Frenchie restaurant. Natural wines and excellent small plates. No reservations accepted." }
        ],
        premium: [
          { name: "Guy Savoy", neighborhood: "Pont des Arts", cuisine: "French haute cuisine", estimatedPerPerson: 450, description: "Three Michelin stars. The artichoke and black truffle soup is iconic. Reserve months ahead." },
          { name: "Le Grand Véfour", neighborhood: "Palais Royal", cuisine: "Classic French", estimatedPerPerson: 280, description: "Two Michelin stars in one of Paris's oldest and most beautiful dining rooms." },
          { name: "Taillevent", neighborhood: "8th arrondissement", cuisine: "French haute cuisine", estimatedPerPerson: 320, description: "One of the grande dames of Parisian fine dining. Two Michelin stars, formal but not stiff." }
        ]
      },
      neighborhoods: {
        lean: "Bastille",
        balanced: "Marais",
        elevated: "Saint-Germain",
        signature: "8th arrondissement"
      },
      travelIntel: {
        bestMonths: "April–June and September–October. Paris in July–August is hot and crowded. Winter is quiet and atmospheric but cold.",
        visaNote: "US citizens: no visa required for stays under 90 days in the Schengen Area. ETIAS authorization required from late 2025.",
        currency: "Euro (EUR). Cards accepted nearly everywhere. Keep €20–€50 cash for small cafes, markets, and tips.",
        transitTip: "Paris Metro is excellent. Buy a carnet (book of 10 tickets) or a Navigo Easy card. Avoid taxis for short trips — Metro is faster.",
        arrivalNote: "CDG Airport: 35–50 min by RER B (~€12) or 45 min by taxi (~€55–€65 fixed rate). Orly: 30 min by OrlyVal + RER B (~€14)."
      }
    },
    flightFloors: {
      orlando: { economy: 650, premiumEconomy: 1400, business: 2800 },
      miami: { economy: 600, premiumEconomy: 1300, business: 2600 },
      "*": { economy: 550, premiumEconomy: 1200, business: 2400 }
    },
    hotelFloors: {
      lean: 80,
      balanced: 140,
      elevated: 260,
      signature: 420
    },
    arrivalTransferCost: { low: 12, high: 65 }
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
    ],
    venues: {
      activities: {
        lean: [
          { name: "Hanauma Bay snorkeling", neighborhood: "East Oahu", estimatedPerPerson: 25, durationHours: 4, description: "Marine sanctuary with protected reef and hundreds of fish species. Reservation required — book 2 days ahead at hanaumabaystatepark.org." },
          { name: "Diamond Head Summit hike", neighborhood: "Diamond Head", estimatedPerPerson: 5, durationHours: 2, description: "1.6-mile round trip to the volcanic crater rim. Best views of Waikiki and the Honolulu skyline. Arrive before 8 AM to beat crowds." },
          { name: "Waimea Valley & waterfall", neighborhood: "North Shore", estimatedPerPerson: 20, durationHours: 3.5, description: "Botanical garden with a trail to a 45-foot waterfall and natural swimming hole. North Shore drive adds shrimp trucks and beach stops." }
        ],
        balanced: [
          { name: "Pearl Harbor & USS Arizona Memorial", neighborhood: "Pearl Harbor", estimatedPerPerson: 30, durationHours: 4, description: "National memorial with a museum, USS Arizona exhibit, and boat ride to the sunken ship. Free but requires timed entry reservation." },
          { name: "North Shore surf watching & shrimp trucks", neighborhood: "Haleiwa", estimatedPerPerson: 22, durationHours: 4, description: "Watch big wave surfing at Waimea Bay or Banzai Pipeline (winter). Giovanni's and Romy's are the landmark shrimp truck stops." },
          { name: "Polynesian Cultural Center", neighborhood: "Laie", estimatedPerPerson: 65, durationHours: 6, description: "Living cultural museum with six island villages, performances, and a luau dinner show. Best for families — long but well-organized." }
        ],
        elevated: [
          { name: "Lanikai Pillboxes sunrise hike", neighborhood: "Kailua", estimatedPerPerson: 0, durationHours: 2.5, description: "Bucket-list sunrise hike with panoramic views of Mokulua Islands and the windward coast. Set the alarm for 5:30 AM." },
          { name: "Sunset catamaran sail", neighborhood: "Waikiki", estimatedPerPerson: 55, durationHours: 2, description: "Sailing catamaran off Waikiki Beach with cocktails and snacks. Operators depart from the beach — no dock needed." },
          { name: "Honolulu Museum of Art", neighborhood: "Downtown Honolulu", estimatedPerPerson: 20, durationHours: 2, description: "Strong Asian and Pacific collection in a beautiful 1920s building. Smaller and more manageable than the Bishop Museum." }
        ],
        signature: [
          { name: "Private helicopter tour of Oahu", neighborhood: "Honolulu Airport", estimatedPerPerson: 250, durationHours: 2, description: "Doors-off or doors-on helicopter tour covering Diamond Head, Ko'olau Mountains, and the North Shore. Makani Kai and Blue Hawaiian are top operators." },
          { name: "Interisland day trip to Maui", neighborhood: "Maui", estimatedPerPerson: 200, durationHours: 8, description: "Short interisland flight to Maui for a full day: Hana drive, beach time, or the Old Lahaina Luau. A second island adds real variety." },
          { name: "Private surfing lesson (North Shore)", neighborhood: "Haleiwa", estimatedPerPerson: 180, durationHours: 3, description: "Private 1-on-1 session with a local surf instructor at a North Shore break matched to your skill level." }
        ]
      },
      dining: {
        casual: [
          { name: "Leonard's Bakery", neighborhood: "Kapahulu", cuisine: "Malasadas", estimatedPerPerson: 8, description: "Famous for Portuguese malasadas (hot fried dough). Been open since 1952. Original and custard-filled are the two to get." },
          { name: "Rainbow Drive-In", neighborhood: "Kapahulu", cuisine: "Hawaiian plate lunch", estimatedPerPerson: 12, description: "Classic Hawaiian plate lunch: two scoops rice, macaroni salad, and a protein. A must-do for the full local experience." },
          { name: "Matsumoto Shave Ice", neighborhood: "Haleiwa", cuisine: "Shave ice", estimatedPerPerson: 6, description: "North Shore institution since 1951. Get it with ice cream and azuki beans at the bottom. The line moves fast." }
        ],
        sitdown: [
          { name: "Duke's Waikiki", neighborhood: "Waikiki", cuisine: "Hawaiian seafood", estimatedPerPerson: 40, description: "Oceanfront restaurant named for Duke Kahanamoku. Good fish tacos, mai tais, and Hula Pie. Arrive early for a beach-facing table." },
          { name: "Ono Seafood", neighborhood: "Kapahulu", cuisine: "Poke", estimatedPerPerson: 20, description: "Hole-in-the-wall poke spot that locals rate as among the best on the island. Simple menu, generous portions." },
          { name: "Moku Kitchen", neighborhood: "Kakaako", cuisine: "Modern Hawaiian", estimatedPerPerson: 35, description: "Farm-to-table spot in the Kakaako arts district. Great cocktails and a good mix of Hawaii regional cuisine." }
        ],
        premium: [
          { name: "Nobu Honolulu", neighborhood: "Waikiki", cuisine: "Japanese-Peruvian fusion", estimatedPerPerson: 120, description: "Nobu Matsuhisa's Honolulu outpost. The black cod miso is the signature dish. Reservations essential." },
          { name: "Senia", neighborhood: "Chinatown", cuisine: "Modern American", estimatedPerPerson: 130, description: "James Beard-nominated restaurant with a locally-sourced tasting menu. One of Honolulu's most exciting fine dining spots." },
          { name: "MW Restaurant", neighborhood: "Ala Moana", cuisine: "Hawaii Regional Cuisine", estimatedPerPerson: 90, description: "Top-chef alumni restaurant celebrating Hawaii's culinary identity. Strong local ingredient sourcing." }
        ]
      },
      neighborhoods: {
        lean: "Kapahulu",
        balanced: "Waikiki",
        elevated: "Ala Moana",
        signature: "Kahala"
      },
      travelIntel: {
        bestMonths: "April–June and September–October for lower crowds and prices. Peak season (December, June–August) is significantly more expensive.",
        visaNote: "Hawaii is a US state — no international travel requirements for US citizens.",
        currency: "USD. Cards accepted everywhere. No currency exchange needed for US travelers.",
        transitTip: "Rent a car if you plan to explore beyond Waikiki — Oahu's bus system is limited. Waikiki itself is walkable. Uber works well in the city.",
        arrivalNote: "Daniel K. Inouye Airport (HNL): 20–30 min to Waikiki by taxi or rideshare (~$30–$40). No rail connection yet — rideshare is the most reliable option."
      }
    },
    flightFloors: {
      orlando: { economy: 500, premiumEconomy: 1100, business: 2200 },
      miami: { economy: 480, premiumEconomy: 1050, business: 2100 },
      "*": { economy: 400, premiumEconomy: 900, business: 1800 }
    },
    hotelFloors: {
      lean: 80,
      balanced: 130,
      elevated: 240,
      signature: 380
    },
    arrivalTransferCost: { low: 30, high: 45 }
  }
];
