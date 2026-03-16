import { describe, it, expect } from 'vitest'
import { normalizeHotelOffer, pickTierHotel } from '@/adapters/lodging/amadeus-hotels-client'

const mockOffer = {
  hotel: {
    hotelId: 'HTMANCBD',
    name: 'Test Hotel',
    address: { lines: ['1 Main St'], cityName: 'Manila' },
    rating: '4',
  },
  offers: [{
    checkInDate: '2026-06-01',
    checkOutDate: '2026-06-08',
    room: { typeEstimated: { category: 'STANDARD_ROOM' } },
    price: { total: '490.00', currency: 'USD' },
  }],
}

describe('normalizeHotelOffer', () => {
  it('calculates pricePerNight correctly', () => {
    const result = normalizeHotelOffer(mockOffer, 7)
    expect(result.pricePerNight).toBe(70)
    expect(result.totalPrice).toBe(490)
    expect(result.hotelName).toBe('Test Hotel')
  })
  it('builds a deep link URL', () => {
    const result = normalizeHotelOffer(mockOffer, 7)
    expect(result.deepLinkUrl).toContain('booking.com')
  })
})

describe('pickTierHotel', () => {
  it('returns null for empty array', () => {
    expect(pickTierHotel([], 'lean', 7)).toBeNull()
  })
  it('picks cheapest for lean', () => {
    const cheapOffer = { ...mockOffer, hotel: { ...mockOffer.hotel, hotelId: 'H2' }, offers: [{ ...mockOffer.offers[0], price: { total: '280.00', currency: 'USD' } }] }
    const result = pickTierHotel([mockOffer, cheapOffer], 'lean', 7)
    expect(result?.totalPrice).toBe(280)
  })
})
