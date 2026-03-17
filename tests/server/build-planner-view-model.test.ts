import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchTravelpayoutsFlightsMock = vi.fn();
const pickTierTicketMock = vi.fn();
const normalizeTravelpayoutsTicketMock = vi.fn();
const fetchHotelOffersMock = vi.fn();
const pickTierHotelMock = vi.fn();
const fetchRawFlightOffersMock = vi.fn();
const pickTierOfferMock = vi.fn();
const normalizeFlightOfferMock = vi.fn();
const verifyBudgetFareMock = vi.fn();

vi.mock("@/adapters/flights/travelpayouts-flight-adapter", () => ({
  fetchTravelpayoutsFlights: (...args: unknown[]) => fetchTravelpayoutsFlightsMock(...args),
  pickTierTicket: (...args: unknown[]) => pickTierTicketMock(...args),
  normalizeTravelpayoutsTicket: (...args: unknown[]) => normalizeTravelpayoutsTicketMock(...args)
}));

vi.mock("@/adapters/lodging/amadeus-hotels-client", () => ({
  fetchHotelOffers: (...args: unknown[]) => fetchHotelOffersMock(...args),
  pickTierHotel: (...args: unknown[]) => pickTierHotelMock(...args)
}));

vi.mock("@/adapters/flights/amadeus-flight-adapter", () => ({
  fetchRawFlightOffers: (...args: unknown[]) => fetchRawFlightOffersMock(...args),
  pickTierOffer: (...args: unknown[]) => pickTierOfferMock(...args),
  normalizeFlightOffer: (...args: unknown[]) => normalizeFlightOfferMock(...args)
}));

vi.mock("@/server/services/flight-fare-verifier", () => ({
  getFlightFareVerifier: () => ({
    verifyBudgetFare: (...args: unknown[]) => verifyBudgetFareMock(...args)
  })
}));

describe("buildPlannerViewModel", () => {
  beforeEach(() => {
    fetchTravelpayoutsFlightsMock.mockReset();
    pickTierTicketMock.mockReset();
    normalizeTravelpayoutsTicketMock.mockReset();
    fetchHotelOffersMock.mockReset();
    pickTierHotelMock.mockReset();
    fetchRawFlightOffersMock.mockReset();
    pickTierOfferMock.mockReset();
    normalizeFlightOfferMock.mockReset();
    verifyBudgetFareMock.mockReset();
  });

  it("uses a default departure date for flight links and recalculates costs from live flight pricing", async () => {
    const ticket = {
      airline: "TK",
      flight_number: 101,
      departure_at: "2026-06-01T10:00:00.000Z",
      return_at: "2026-06-07T16:00:00.000Z",
      transfers: 0,
      price: 336,
      duration_to: 600,
      link: "/test-deeplink"
    };

    fetchTravelpayoutsFlightsMock.mockResolvedValue([ticket]);
    pickTierTicketMock.mockImplementation(() => ticket);
    normalizeTravelpayoutsTicketMock.mockReturnValue({
      id: "ticket-1",
      airline: "Test Air",
      airlineCode: "TK",
      departureTime: "2026-06-01T10:00:00.000Z",
      arrivalTime: "2026-06-07T16:00:00.000Z",
      durationMinutes: 600,
      stops: 0,
      cabinClass: "ECONOMY",
      pricePerTraveler: 168,
      totalPrice: 336,
      deepLinkUrl: "https://www.aviasales.com/test-deeplink"
    });
    fetchHotelOffersMock.mockResolvedValue([]);
    pickTierHotelMock.mockReturnValue(null);
    fetchRawFlightOffersMock.mockResolvedValue([]);
    pickTierOfferMock.mockReturnValue(null);
    normalizeFlightOfferMock.mockReturnValue(null);
    verifyBudgetFareMock.mockResolvedValue(null);

    const { buildPlannerViewModel } = await import("@/server/services/build-planner-view-model");

    const viewModel = await buildPlannerViewModel({
      destinationQuery: "Tokyo",
      destination: "Tokyo",
      origin: "Orlando",
      travelers: 2,
      nights: 6,
      preferDirectFlights: false,
      preferLocalFood: true,
      lowWalkingIntensity: false
    });

    const budgetScenario = viewModel.scenarios.find((scenario) => scenario.tier === "lean");

    expect(viewModel.input.departureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(budgetScenario?.flight.totalCost).toBe(336);
    expect(budgetScenario?.cost.airfareTotal).toBe(336);
    expect(budgetScenario?.flight.isLivePrice).toBe(true);
    expect(budgetScenario?.flight.pricingSource).toBe("travelpayouts");
    expect(budgetScenario?.verification.flights[0]?.intent).toBe("exact-booking");
    expect(budgetScenario?.verification.flights[0]?.url).toBe("https://www.aviasales.com/test-deeplink");
  });

  it("can lower the budget fare when a public fare verifier finds a cheaper checked price", async () => {
    fetchTravelpayoutsFlightsMock.mockResolvedValue([]);
    pickTierTicketMock.mockReturnValue(null);
    normalizeTravelpayoutsTicketMock.mockReturnValue(null);
    fetchHotelOffersMock.mockResolvedValue([]);
    pickTierHotelMock.mockReturnValue(null);
    fetchRawFlightOffersMock.mockResolvedValue([]);
    pickTierOfferMock.mockReturnValue(null);
    normalizeFlightOfferMock.mockReturnValue(null);
    verifyBudgetFareMock.mockResolvedValue({
      provider: "Public Fare Check",
      totalPrice: 148,
      pricePerTraveler: 148,
      url: "https://example.com/public-fare"
    });

    const { buildPlannerViewModel } = await import("@/server/services/build-planner-view-model");

    const viewModel = await buildPlannerViewModel({
      destinationQuery: "St. Louis",
      destination: "St. Louis",
      resolvedDestinationLabel: "St. Louis",
      resolvedDestinationSource: "google",
      resolvedDestinationPlaceId: "text:St. Louis:0",
      resolvedDestinationAirportCode: "STL",
      resolvedDestinationCountry: "USA",
      origin: "Orlando",
      travelers: 1,
      nights: 5,
      preferDirectFlights: false,
      preferLocalFood: true,
      lowWalkingIntensity: false
    });

    const budgetScenario = viewModel.scenarios.find((scenario) => scenario.tier === "lean");

    expect(budgetScenario?.flight.totalCost).toBe(148);
    expect(budgetScenario?.flight.pricingSource).toBe("public-verifier");
    expect(budgetScenario?.verification.flights[0]?.url).toBe("https://example.com/public-fare");
  });
});
