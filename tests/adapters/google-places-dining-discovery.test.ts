import { beforeEach, describe, expect, it, vi } from "vitest";
import { discoverGoogleDiningPlaces } from "@/adapters/food/google-places-dining-discovery";
import { resolveDestination } from "@/domain/trip/destination-catalog";

const searchGooglePlacesBatchMock = vi.fn();

vi.mock("@/adapters/maps/google-places-text-search", () => ({
  searchGooglePlacesBatch: (...args: unknown[]) => searchGooglePlacesBatchMock(...args)
}));

describe("discoverGoogleDiningPlaces", () => {
  beforeEach(() => {
    searchGooglePlacesBatchMock.mockReset();
  });

  it("merges multiple restaurant queries and removes duplicates", async () => {
    const match = resolveDestination("Tokyo");

    searchGooglePlacesBatchMock.mockResolvedValueOnce([
      { name: "Sushi Saito", address: "Akasaka, Tokyo", googleMapsUri: "https://maps.example/saito" },
      { name: "Afuri Ramen", address: "Harajuku, Tokyo", googleMapsUri: "https://maps.example/afuri" },
      { name: "Sushi Saito", address: "Akasaka, Tokyo", googleMapsUri: "https://maps.example/saito" },
      { name: "Narisawa", address: "Minato, Tokyo", googleMapsUri: "https://maps.example/narisawa" },
      { name: "Gyukatsu Motomura", address: "Shibuya, Tokyo", googleMapsUri: "https://maps.example/motomura" },
      { name: "Uobei", address: "Shibuya, Tokyo", googleMapsUri: "https://maps.example/uobei" }
    ]);

    const places = await discoverGoogleDiningPlaces({
      match,
      stayNeighborhood: "Shinjuku",
      tier: "balanced",
      travelers: 4,
      limit: 10
    });

    expect(searchGooglePlacesBatchMock).toHaveBeenCalledTimes(1);
    expect(searchGooglePlacesBatchMock.mock.calls[0]?.[0]).toContain("Tokyo best restaurants");
    expect(places.map((place) => place.name)).toEqual([
      "Sushi Saito",
      "Afuri Ramen",
      "Narisawa",
      "Gyukatsu Motomura",
      "Uobei"
    ]);
  });

  it("caps the total results to the requested limit", async () => {
    const match = resolveDestination("Tokyo");

    searchGooglePlacesBatchMock.mockResolvedValueOnce(
      Array.from({ length: 20 }, (_, placeIndex) => ({
        name: `Spot ${placeIndex}`,
        address: `Address ${placeIndex}`,
        googleMapsUri: `https://maps.example/${placeIndex}`
      }))
    );

    const places = await discoverGoogleDiningPlaces({
      match,
      stayNeighborhood: "Shinjuku",
      tier: "balanced",
      travelers: 4,
      limit: 14
    });

    expect(places).toHaveLength(14);
  });

  it("pushes better bang-for-buck places higher for budget-friendly tiers", async () => {
    const match = resolveDestination("Tokyo");

    searchGooglePlacesBatchMock.mockResolvedValueOnce([
      {
        name: "Budget Sushi",
        address: "Shibuya, Tokyo",
        googleMapsUri: "https://maps.example/budget-sushi",
        rating: 4.5,
        userRatingCount: 2400,
        category: "Sushi Restaurant",
        priceLevel: 1
      },
      {
        name: "Luxury Sushi",
        address: "Ginza, Tokyo",
        googleMapsUri: "https://maps.example/luxury-sushi",
        rating: 4.7,
        userRatingCount: 3200,
        category: "Sushi Restaurant",
        priceLevel: 4
      }
    ]);

    const places = await discoverGoogleDiningPlaces({
      match,
      stayNeighborhood: "Shinjuku",
      tier: "lean",
      travelers: 2,
      limit: 10
    });

    expect(places[0]?.name).toBe("Budget Sushi");
  });
});
