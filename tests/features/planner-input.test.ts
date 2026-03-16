import { describe, it, expect } from 'vitest'
import { parsePlannerSearchParams } from '@/features/search/planner-input'

describe('parsePlannerSearchParams', () => {
  it('parses budgetCap when present', () => {
    const result = parsePlannerSearchParams({
      destination: 'Manila',
      origin: 'Orlando',
      travelers: '2',
      nights: '7',
      budgetCap: '4000',
    })
    expect(result?.budgetCap).toBe(4000)
  })

  it('parses travelPreferences flags', () => {
    const result = parsePlannerSearchParams({
      destination: 'Manila',
      origin: 'Orlando',
      travelers: '2',
      nights: '7',
      preferDirectFlights: 'true',
      preferLocalFood: 'true',
      lowWalkingIntensity: 'false',
    })
    expect(result?.preferDirectFlights).toBe(true)
    expect(result?.preferLocalFood).toBe(true)
    expect(result?.lowWalkingIntensity).toBe(false)
  })

  it('defaults travelPreferences to false when absent', () => {
    const result = parsePlannerSearchParams({
      destination: 'Manila',
      origin: 'Orlando',
      travelers: '2',
      nights: '7',
    })
    expect(result?.preferDirectFlights).toBe(false)
    expect(result?.preferLocalFood).toBe(false)
    expect(result?.lowWalkingIntensity).toBe(false)
  })
})
