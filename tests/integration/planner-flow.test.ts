import { describe, it, expect, vi } from 'vitest'
import { resolveDestination } from '@/domain/trip/destination-catalog'
import { buildTripScenarios } from '@/domain/scenarios/build-trip-scenarios'

// Mock Amadeus client so tests don't need real credentials
vi.mock('@/adapters/flights/amadeus-client', () => ({
  getAmadeusClient: () => ({
    shopping: {
      flightOffersSearch: { get: async () => ({ data: [] }) },
      hotelOffersSearch: { get: async () => ({ data: [] }) },
    },
    referenceData: {
      locations: {
        hotels: { byCity: { get: async () => ({ data: [] }) } },
      },
    },
  }),
}))

describe('Planner flow — seeded destinations', () => {
  it('resolves Manila and generates 4 scenarios', () => {
    const match = resolveDestination('Manila')
    expect(match.destination.slug).toBe('manila')
    expect(match.iataCode).toBe('MNL')
    expect(match.cityCode).toBe('MNL')

    const input = {
      destinationQuery: 'Manila',
      destination: 'Manila',
      origin: 'Orlando',
      travelers: 2,
      nights: 7,
      preferDirectFlights: false,
      preferLocalFood: true,
      lowWalkingIntensity: false,
    }
    const scenarios = buildTripScenarios(input, match)
    expect(scenarios).toHaveLength(4)
    expect(scenarios.map((s) => s.tier)).toEqual(['lean', 'balanced', 'elevated', 'signature'])
  })

  it('resolves Davao and generates 4 scenarios', () => {
    const match = resolveDestination('Davao')
    expect(match.destination.slug).toBe('davao')
    expect(match.iataCode).toBe('DVO')

    const input = {
      destinationQuery: 'Davao',
      destination: 'Davao',
      origin: 'Orlando',
      travelers: 2,
      nights: 7,
      preferDirectFlights: false,
      preferLocalFood: false,
      lowWalkingIntensity: false,
    }
    const scenarios = buildTripScenarios(input, match)
    expect(scenarios).toHaveLength(4)
  })

  it('resolves Sorsogon correctly', () => {
    const match = resolveDestination('Sorsogon')
    expect(match.destination.slug).toBe('sorsogon')
    expect(match.iataCode).toBe('LGP')
  })

  it('resolves Naga correctly', () => {
    const match = resolveDestination('Naga')
    expect(match.destination.slug).toBe('naga')
    expect(match.iataCode).toBe('WNP')
  })

  it('resolves Cebu correctly', () => {
    const match = resolveDestination('Cebu')
    expect(match.destination.slug).toBe('cebu')
    expect(match.iataCode).toBe('CEB')
  })
})
