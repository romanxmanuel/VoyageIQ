export type ScenarioTier = "lean" | "balanced" | "elevated" | "signature";

export interface TravelerProfile {
  travelers: number;
  partyMode: "solo" | "pair" | "family" | "group";
  familyFriendlyPriority: number;
}

export interface TripConstraint {
  destinationQuery: string;
  origin: string;
  travelers: number;
  nights: number;
  travelPreferences?: {
    preferDirectFlights: boolean
    preferLocalFood: boolean
    lowWalkingIntensity: boolean
  }
  budgetCap?: number
}

import type { PlannerInput } from "@/features/search/planner-input";
export type { PlannerInput };

export type VerificationLinkKind = "flight" | "hotel" | "airbnb" | "hostel" | "restaurant" | "activity" | "guide";

export interface FlightTemplate {
  airline: string;
  departWindow: string;
  arriveWindow: string;
  durationHours: number;
  stops: number;
  layover: string;
  cabin: string;
  bookingTip: string;
  baseFarePerTraveler: number;
  deepLinkUrl?: string;
}

export interface StayOption {
  name: string;
  style: string;
  address: string;
  nightlyRate: number;
  neighborhood: string;
  whyItWorks: string;
}

export interface DiningSpot {
  id?: string;
  name: string;
  cuisine: string;
  address: string;
  estimatedPerPerson: number;
  signatureOrder: string;
  fit: ScenarioTier[];
  verificationLink?: VerificationLink;
}

export interface ActivityOption {
  id?: string;
  name: string;
  address: string;
  estimatedPerPerson: number;
  durationHours: number;
  travelMinutesFromCenter: number;
  summary: string;
  fit: ScenarioTier[];
  verificationLink?: VerificationLink;
}

export interface VenueActivity {
  name: string;
  neighborhood: string;
  estimatedPerPerson: number;
  durationHours: number;
  description: string;
}

export interface VenueDining {
  name: string;
  neighborhood: string;
  cuisine: string;
  estimatedPerPerson: number;
  description: string;
}

export interface TravelIntel {
  bestMonths: string;
  visaNote: string;
  currency: string;
  transitTip: string;
  arrivalNote: string;
}

export interface DestinationSeed {
  slug: string;
  name: string;
  country: string;
  regionLabel: string;
  airportCode: string;
  cityCode?: string;
  coordinates?: { lat: number; lng: number };
  tourismUrl?: string;
  heroTitle: string;
  summary: string;
  recommendedWindow: string;
  aliases: string[];
  averageTransitPerDay: number;
  mapNote: string;
  flights: Record<ScenarioTier, FlightTemplate>;
  stays: Record<ScenarioTier, StayOption>;
  dining: DiningSpot[];
  activities: ActivityOption[];
  venues?: {
    activities: Partial<Record<ScenarioTier, VenueActivity[]>>;
    dining: {
      casual: VenueDining[];
      sitdown: VenueDining[];
      premium: VenueDining[];
    };
    neighborhoods: Partial<Record<ScenarioTier, string>>;
    travelIntel?: TravelIntel;
  };
  flightFloors?: Record<string, { economy: number; premiumEconomy: number; business: number }>;
  hotelFloors?: Partial<Record<ScenarioTier, number>>;
  arrivalTransferCost?: { low: number; high: number };
}

export interface DestinationMatch {
  destination: DestinationSeed;
  originalQuery: string;
  normalizedQuery: string;
  matchedAlias: string;
  isFallback: boolean;
  isVerified: boolean;
  isGeneric: boolean;
  helperText: string;
  iataCode: string;
  cityCode: string;
  coordinates: { lat: number; lng: number };
}

export interface FlightPlan extends FlightTemplate {
  totalCost: number;
  pricingSource?: "seeded" | "travelpayouts" | "amadeus" | "public-verifier";
  isLivePrice?: boolean;
}

export interface DiningPlan {
  dailyBudgetPerTraveler: number;
  highlights: DiningSpot[];
}

export interface ActivityPlan extends ActivityOption {
  totalCost: number;
}

export interface CostBreakdown {
  airfareTotal: number;
  lodgingTotal: number;
  foodTotal: number;
  activitiesTotal: number;
  localTransitTotal: number;
  arrivalTransferTotal: number;
  taxesAndFees: number;
  contingencyBuffer: number;
  totalTripCost: number;
  costPerTraveler: number;
  costPerDay: number;
}

export interface ItineraryStop {
  slot: "Morning" | "Afternoon" | "Evening";
  title: string;
  location: string;
  cost: number;
  travelMinutes: number;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  note: string;
  totalEstimate: number;
  stops: ItineraryStop[];
}

export interface ScenarioTradeoffs {
  gains: string[];
  losses: string[];
}

export interface ScenarioFeatureVector {
  costPerDay: number;
  comfort: number;
  foodQuality: number;
  activityDensity: number;
  transitConvenience: number;
  familyFriendliness: number;
}

export interface TradeoffChange {
  label: keyof ScenarioFeatureVector;
  from: number;
  to: number;
  delta: number;
}

export interface ScenarioAlternative {
  kind: "save-money" | "easier-for-parents" | "better-hotel-and-food";
  heading: string;
  scenarioId: string;
  label: string;
  summary: string;
  priceDelta: number;
  distance: number;
  changes: TradeoffChange[];
}

export type VerificationLinkIntent = "exact-booking" | "exact-place" | "compare-options";

export interface VerificationLink {
  itemId?: string;
  provider: string;
  kind: VerificationLinkKind;
  title?: string;
  address?: string;
  label: string;
  url: string;
  note: string;
  direct?: boolean;
  intent?: VerificationLinkIntent;
}

export interface ScenarioVerificationResources {
  flights: VerificationLink[];
  lodging: VerificationLink[];
  dining: VerificationLink[];
  activities: VerificationLink[];
  destinationGuide?: VerificationLink;
}

export interface TripScenario {
  id: string;
  tier: ScenarioTier;
  label: string;
  headline: string;
  fitSummary: string;
  ruleScore: number;
  featureVector: ScenarioFeatureVector;
  alternatives: ScenarioAlternative[];
  flight: FlightPlan;
  stay: StayOption;
  diningPlan: DiningPlan;
  activities: ActivityPlan[];
  itinerary: ItineraryDay[];
  arrivalPlan: string[];
  bookingSequence: string[];
  tradeoffs: ScenarioTradeoffs;
  cost: CostBreakdown;
  verification: ScenarioVerificationResources;
}

export interface PlannerViewModel {
  constraints: TripConstraint;
  travelerProfile: TravelerProfile;
  input: PlannerInput;
  match: DestinationMatch;
  scenarios: TripScenario[];
  selectedScenarioIndex: number;
  departDate: string;   // YYYY-MM-DD
  returnDate: string;   // YYYY-MM-DD
}

export interface DestinationSpotlight {
  slug: string;
  name: string;
  country: string;
  summary: string;
  tourismUrl?: string;
  airportCode?: string;
}

export interface DestinationSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  country?: string;
  iataCode: string | null;
  source: "seeded" | "known-location" | "google";
}
