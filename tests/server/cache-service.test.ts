import { describe, it, expect } from 'vitest'
import { CacheService } from '@/server/services/cache-service'

describe('CacheService', () => {
  it('exports get, set, invalidate functions', () => {
    expect(typeof CacheService.get).toBe('function')
    expect(typeof CacheService.set).toBe('function')
    expect(typeof CacheService.invalidate).toBe('function')
  })

  it('buildCacheKey formats keys correctly', () => {
    const { buildFlightCacheKey, buildHotelListCacheKey, buildHotelOffersCacheKey } = CacheService
    expect(buildFlightCacheKey('MCO', 'MNL', '2026-06-01', '2026-06-08', 2, false))
      .toBe('flights:MCO:MNL:2026-06-01:2026-06-08:2:false')
    expect(buildHotelListCacheKey('MNL'))
      .toBe('hotel-list:MNL')
    expect(buildHotelOffersCacheKey('MNL', '2026-06-01', '2026-06-08', 1))
      .toBe('hotel-offers:MNL:2026-06-01:2026-06-08:1')
  })
})
