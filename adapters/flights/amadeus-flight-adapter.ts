import type { ScenarioTier } from '@/domain/trip/types'
import type { LiveFlightOffer } from './types'
import { getAmadeusClient } from './amadeus-client'
import { CacheService } from '@/server/services/cache-service'

export function parseDurationMinutes(iso: string): number {
  const hoursMatch = iso.match(/(\d+)H/)
  const minsMatch = iso.match(/(\d+)M/)
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0
  const mins = minsMatch ? parseInt(minsMatch[1]) : 0
  return hours * 60 + mins
}

export function normalizeFlightOffer(raw: any, travelers: number): LiveFlightOffer {
  const itinerary = raw.itineraries?.[0]
  const firstSegment = itinerary?.segments?.[0]
  const lastSegment = itinerary?.segments?.[itinerary.segments.length - 1]
  const cabin = raw.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? 'ECONOMY'
  const totalPrice = parseFloat(raw.price?.grandTotal ?? '0')
  const stops = (itinerary?.segments?.length ?? 1) - 1

  return {
    id: raw.id,
    airline: raw.validatingAirlineCodes?.[0] ?? 'Unknown',
    airlineCode: raw.validatingAirlineCodes?.[0] ?? '??',
    departureTime: firstSegment?.departure?.at ?? '',
    arrivalTime: lastSegment?.arrival?.at ?? '',
    durationMinutes: parseDurationMinutes(itinerary?.duration ?? 'PT0M'),
    stops,
    cabinClass: cabin,
    pricePerTraveler: Math.round(totalPrice / travelers),
    totalPrice,
    deepLinkUrl: `https://www.google.com/flights?q=flights+from+${firstSegment?.departure?.iataCode ?? ''}+to+${lastSegment?.arrival?.iataCode ?? ''}`,
  }
}

// Sorts by raw price.grandTotal — must be called with RAW Amadeus offer objects, not normalized
export function pickTierOffer(rawOffers: any[], tier: ScenarioTier): any | null {
  if (rawOffers.length === 0) return null
  const sorted = [...rawOffers].sort(
    (a, b) => parseFloat(a.price?.grandTotal ?? '0') - parseFloat(b.price?.grandTotal ?? '0')
  )
  const n = sorted.length
  const tierIndex: Record<ScenarioTier, number> = {
    lean: 0,
    balanced: Math.max(0, Math.floor(n * 0.33)),
    elevated: Math.max(0, Math.floor(n * 0.66)),
    signature: n - 1,
  }
  return sorted[Math.min(tierIndex[tier], n - 1)]
}

// Returns RAW Amadeus offer objects (not normalized) so pickTierOffer can sort by price.grandTotal
export async function fetchRawFlightOffers(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  adults: number,
  preferDirectFlights: boolean
): Promise<any[]> {
  const cacheKey = CacheService.buildFlightCacheKey(
    origin, destination, departureDate, returnDate, adults, preferDirectFlights
  )
  const cached = await CacheService.get(cacheKey)
  if (cached) return cached as any[]

  const client = getAmadeusClient()
  const params: Record<string, string | number> = {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    returnDate,
    adults,
    max: 15,
    currencyCode: 'USD',
  }
  if (preferDirectFlights) params.nonStop = 'true'

  const response = await client.shopping.flightOffersSearch.get(params)
  const raw: any[] = response.data ?? []
  await CacheService.set(cacheKey, raw, 2)
  return raw
}
