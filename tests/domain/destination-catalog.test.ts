import { describe, it, expect } from 'vitest'
import { resolveDestination } from '@/domain/trip/destination-catalog'

describe('resolveDestination', () => {
  it('resolves Manila with correct IATA and cityCode', () => {
    const match = resolveDestination('Manila')
    expect(match.destination.slug).toBe('manila')
    expect(match.iataCode).toBe('MNL')
    expect(match.cityCode).toBe('MNL')
    expect(match.coordinates.lat).toBeTypeOf('number')
  })
  it('resolves Sorsogon', () => {
    const match = resolveDestination('Sorsogon')
    expect(match.destination.slug).toBe('sorsogon')
    expect(match.iataCode).toBe('LGP')
  })
  it('resolves Naga', () => {
    const match = resolveDestination('Naga')
    expect(match.destination.slug).toBe('naga')
    expect(match.iataCode).toBe('WNP')
  })
  it('resolves Cebu', () => {
    const match = resolveDestination('Cebu')
    expect(match.destination.slug).toBe('cebu')
    expect(match.iataCode).toBe('CEB')
  })
  it('resolves Davao', () => {
    const match = resolveDestination('Davao')
    expect(match.destination.slug).toBe('davao')
    expect(match.iataCode).toBe('DVO')
  })
})
