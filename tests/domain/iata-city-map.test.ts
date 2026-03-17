import { describe, it, expect } from 'vitest'
import { resolveIataCode } from '@/domain/trip/data/iata-city-map'

describe('resolveIataCode', () => {
  it('resolves Manila to MNL', () => expect(resolveIataCode('Manila')).toBe('MNL'))
  it('resolves Cebu to CEB', () => expect(resolveIataCode('Cebu')).toBe('CEB'))
  it('resolves Davao to DVO', () => expect(resolveIataCode('Davao')).toBe('DVO'))
  it('resolves Sorsogon to LGP', () => expect(resolveIataCode('Sorsogon')).toBe('LGP'))
  it('resolves Naga to WNP', () => expect(resolveIataCode('Naga')).toBe('WNP'))
  it('resolves Tokyo to HND', () => expect(resolveIataCode('Tokyo')).toBe('HND'))
  it('resolves New Jersey to EWR', () => expect(resolveIataCode('New Jersey')).toBe('EWR'))
  it('resolves St. Louis to STL', () => expect(resolveIataCode('St. Louis')).toBe('STL'))
  it('resolves Omaha to OMA', () => expect(resolveIataCode('Omaha')).toBe('OMA'))
  it('resolves Paris to CDG', () => expect(resolveIataCode('Paris')).toBe('CDG'))
  it('resolves Santorini to JTR', () => expect(resolveIataCode('Santorini')).toBe('JTR'))
  it('resolves Cancún to CUN', () => expect(resolveIataCode('Cancún')).toBe('CUN'))
  it('resolves Bangkok to BKK', () => expect(resolveIataCode('Bangkok')).toBe('BKK'))
  it('resolves Bali to DPS', () => expect(resolveIataCode('Bali')).toBe('DPS'))
  it('is case-insensitive', () => expect(resolveIataCode('manila')).toBe('MNL'))
  it('returns null for unknown city', () => expect(resolveIataCode('Nonexistentcity')).toBeNull())
})
