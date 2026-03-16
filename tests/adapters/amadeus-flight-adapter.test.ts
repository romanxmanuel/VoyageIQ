import { describe, it, expect } from 'vitest'
import { normalizeFlightOffer, pickTierOffer, parseDurationMinutes } from '@/adapters/flights/amadeus-flight-adapter'

describe('parseDurationMinutes', () => {
  it('parses PT18H30M correctly', () => {
    expect(parseDurationMinutes('PT18H30M')).toBe(1110)
  })
  it('parses PT2H0M correctly', () => {
    expect(parseDurationMinutes('PT2H0M')).toBe(120)
  })
})

const mockRawOffer = {
  id: 'offer-1',
  validatingAirlineCodes: ['AA'],
  itineraries: [{
    duration: 'PT18H30M',
    segments: [
      { departure: { iataCode: 'MCO', at: '2026-06-01T08:00:00' }, arrival: { iataCode: 'NRT', at: '2026-06-01T18:00:00' }, carrierCode: 'AA', numberOfStops: 0 },
      { departure: { iataCode: 'NRT', at: '2026-06-01T20:00:00' }, arrival: { iataCode: 'MNL', at: '2026-06-02T00:30:00' }, carrierCode: 'AA', numberOfStops: 0 },
    ]
  }],
  travelerPricings: [{ fareDetailsBySegment: [{ cabin: 'ECONOMY' }] }],
  price: { grandTotal: '1960.00', currency: 'USD' },
}

describe('normalizeFlightOffer', () => {
  it('maps total price and per-traveler price correctly', () => {
    const result = normalizeFlightOffer(mockRawOffer, 2)
    expect(result.totalPrice).toBe(1960)
    expect(result.pricePerTraveler).toBe(980)
  })
  it('counts stops as segments minus 1', () => {
    const result = normalizeFlightOffer(mockRawOffer, 2)
    expect(result.stops).toBe(1) // 2 segments = 1 stop
  })
})

describe('pickTierOffer', () => {
  it('returns null for empty array', () => {
    expect(pickTierOffer([], 'lean')).toBeNull()
  })
  it('picks cheapest for lean tier', () => {
    const offers = [
      { ...mockRawOffer, id: '1', price: { grandTotal: '2000.00', currency: 'USD' } },
      { ...mockRawOffer, id: '2', price: { grandTotal: '1800.00', currency: 'USD' } },
    ]
    const result = pickTierOffer(offers, 'lean')
    expect(result?.id).toBe('2')
  })
  it('picks most expensive for signature tier', () => {
    const offers = [
      { ...mockRawOffer, id: '1', price: { grandTotal: '2000.00', currency: 'USD' } },
      { ...mockRawOffer, id: '2', price: { grandTotal: '3500.00', currency: 'USD' } },
    ]
    const result = pickTierOffer(offers, 'signature')
    expect(result?.id).toBe('2')
  })
})
