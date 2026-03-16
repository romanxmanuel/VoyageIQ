import type { ScenarioTier } from '@/domain/trip/types'
import type { LiveFlightOffer } from './types'
import { CacheService } from '@/server/services/cache-service'

const AVIASALES_BASE = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
const DEEP_LINK_BASE = 'https://www.aviasales.com'

interface TravelpayoutsTicket {
  origin: string
  destination: string
  origin_airport: string
  destination_airport: string
  price: number
  airline: string
  flight_number: number
  departure_at: string
  return_at: string
  transfers: number
  return_transfers: number
  duration_to: number
  duration_back: number
  link: string
}

interface TravelpayoutsResponse {
  success: boolean
  data: TravelpayoutsTicket[]
  currency: string
}

export function normalizeTravelpayoutsTicket(
  ticket: TravelpayoutsTicket,
  travelers: number
): LiveFlightOffer {
  return {
    id: `${ticket.airline}${ticket.flight_number}-${ticket.departure_at}`,
    airline: ticket.airline,
    airlineCode: ticket.airline,
    departureTime: ticket.departure_at,
    arrivalTime: ticket.return_at,
    durationMinutes: ticket.duration_to,
    stops: ticket.transfers,
    cabinClass: 'ECONOMY',
    pricePerTraveler: Math.round(ticket.price / travelers),
    totalPrice: ticket.price,
    deepLinkUrl: `${DEEP_LINK_BASE}${ticket.link}`,
  }
}

export function pickTierTicket(
  tickets: TravelpayoutsTicket[],
  tier: ScenarioTier
): TravelpayoutsTicket | null {
  if (tickets.length === 0) return null
  const sorted = [...tickets].sort((a, b) => a.price - b.price)
  const n = sorted.length
  const tierIndex: Record<ScenarioTier, number> = {
    lean: 0,
    balanced: Math.max(0, Math.floor(n * 0.33)),
    elevated: Math.max(0, Math.floor(n * 0.66)),
    signature: n - 1,
  }
  return sorted[Math.min(tierIndex[tier], n - 1)]
}

export async function fetchTravelpayoutsFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  travelers: number,
  preferDirectFlights: boolean
): Promise<TravelpayoutsTicket[]> {
  const token = process.env.TRAVELPAYOUTS_API_TOKEN
  if (!token) return []

  const cacheKey = CacheService.buildFlightCacheKey(
    origin, destination, departureDate, returnDate, travelers, preferDirectFlights
  )
  const cached = await CacheService.get(cacheKey)
  if (cached) return cached as TravelpayoutsTicket[]

  const params = new URLSearchParams({
    origin,
    destination,
    departure_at: departureDate,
    return_at: returnDate,
    token,
    currency: 'usd',
    sorting: 'price',
    limit: '15',
    ...(preferDirectFlights ? { direct: 'true' } : {}),
  })

  const res = await fetch(`${AVIASALES_BASE}?${params}`, {
    headers: { 'Accept-Encoding': 'gzip' },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    console.error(`Travelpayouts API error: ${res.status} ${res.statusText}`)
    return []
  }

  const json: TravelpayoutsResponse = await res.json()
  if (!json.success) return []

  const tickets = json.data ?? []
  await CacheService.set(cacheKey, tickets, 2)
  return tickets
}
