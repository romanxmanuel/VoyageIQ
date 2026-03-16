import { describe, it, expectTypeOf } from 'vitest'
import type {
  TripConstraint,
  DestinationMatch,
  DestinationSeed,
} from '@/domain/trip/types'

describe('TripConstraint', () => {
  it('accepts travelPreferences', () => {
    const c: TripConstraint = {
      destinationQuery: 'Manila',
      origin: 'Orlando',
      travelers: 2,
      nights: 7,
      travelPreferences: {
        preferDirectFlights: true,
        preferLocalFood: true,
        lowWalkingIntensity: false,
      },
      budgetCap: 5000,
    }
    expectTypeOf(c.travelPreferences).toMatchTypeOf<{
      preferDirectFlights: boolean
      preferLocalFood: boolean
      lowWalkingIntensity: boolean
    } | undefined>()
  })
})

describe('DestinationSeed', () => {
  it('has optional cityCode and coordinates for live API enrichment', () => {
    expectTypeOf<DestinationSeed['cityCode']>().toMatchTypeOf<string | undefined>()
    expectTypeOf<DestinationSeed['coordinates']>().toMatchTypeOf<{ lat: number; lng: number } | undefined>()
  })
})

describe('DestinationMatch', () => {
  it('has iataCode, cityCode, coordinates', () => {
    expectTypeOf<DestinationMatch['iataCode']>().toBeString()
    expectTypeOf<DestinationMatch['cityCode']>().toBeString()
    expectTypeOf<DestinationMatch['coordinates']>().toMatchTypeOf<{ lat: number; lng: number }>()
  })
})
