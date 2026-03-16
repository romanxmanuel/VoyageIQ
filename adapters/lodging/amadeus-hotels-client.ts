import type { ScenarioTier } from '@/domain/trip/types'
import type { LiveHotelOffer } from './types'
import { getAmadeusClient } from '@/adapters/flights/amadeus-client'
import { CacheService } from '@/server/services/cache-service'

export function normalizeHotelOffer(raw: any, nights: number): LiveHotelOffer {
  const hotel = raw.hotel ?? {}
  const offer = raw.offers?.[0] ?? {}
  const totalPrice = parseFloat(offer.price?.total ?? '0')
  const address = [hotel.address?.lines?.[0], hotel.address?.cityName].filter(Boolean).join(', ')

  return {
    hotelId: hotel.hotelId ?? '',
    hotelName: hotel.name ?? 'Unknown Hotel',
    address,
    stars: parseInt(hotel.rating ?? '3'),
    checkIn: offer.checkInDate ?? '',
    checkOut: offer.checkOutDate ?? '',
    roomType: offer.room?.typeEstimated?.category ?? 'STANDARD_ROOM',
    pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : totalPrice,
    totalPrice,
    deepLinkUrl: `https://www.booking.com/search.html?ss=${encodeURIComponent(hotel.name ?? '')}`,
  }
}

export function pickTierHotel(rawOffers: any[], tier: ScenarioTier, nights: number): LiveHotelOffer | null {
  if (rawOffers.length === 0) return null
  const sorted = [...rawOffers].sort(
    (a, b) => parseFloat(a.offers?.[0]?.price?.total ?? '0') - parseFloat(b.offers?.[0]?.price?.total ?? '0')
  )
  const n = sorted.length
  const tierIndex: Record<ScenarioTier, number> = {
    lean: 0,
    balanced: Math.max(0, Math.floor(n * 0.25)),
    elevated: Math.max(0, Math.floor(n * 0.60)),
    signature: n - 1,
  }
  return normalizeHotelOffer(sorted[Math.min(tierIndex[tier], n - 1)], nights)
}

export async function fetchHotelOffers(
  cityCode: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  nights: number
): Promise<LiveHotelOffer[]> {
  const client = getAmadeusClient()

  // Step 1: hotel IDs for city (cached 24h)
  const listKey = CacheService.buildHotelListCacheKey(cityCode)
  let hotelIds = (await CacheService.get(listKey)) as string[] | null ?? []

  if (hotelIds.length === 0) {
    const listResponse = await client.referenceData.locations.hotels.byCity.get({ cityCode })
    hotelIds = (listResponse.data ?? []).slice(0, 20).map((h: any) => h.hotelId as string)
    await CacheService.set(listKey, hotelIds, 24)
  }

  if (hotelIds.length === 0) return []

  // Step 2: offers for those IDs (cached 2h)
  const rooms = Math.max(1, Math.ceil(adults / 2))
  const offersKey = CacheService.buildHotelOffersCacheKey(cityCode, checkIn, checkOut, rooms)
  const cachedOffers = await CacheService.get(offersKey)
  if (cachedOffers) return cachedOffers as LiveHotelOffer[]

  const offersResponse = await client.shopping.hotelOffersSearch.get({
    hotelIds: hotelIds.join(','),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: String(adults),
    roomQuantity: String(rooms),
    currencyCode: 'USD',
    bestRateOnly: 'true',
  })

  const normalized = (offersResponse.data ?? []).map((o: any) => normalizeHotelOffer(o, nights))
  await CacheService.set(offersKey, normalized, 2)
  return normalized
}
