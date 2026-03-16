import { describe, it, expect } from 'vitest'
import { resolveIataCode } from '@/domain/trip/data/iata-city-map'

describe('resolveIataCode', () => {
  it('resolves Manila to MNL', () => expect(resolveIataCode('Manila')).toBe('MNL'))
  it('resolves Cebu to CEB', () => expect(resolveIataCode('Cebu')).toBe('CEB'))
  it('resolves Davao to DVO', () => expect(resolveIataCode('Davao')).toBe('DVO'))
  it('resolves Sorsogon to LGP', () => expect(resolveIataCode('Sorsogon')).toBe('LGP'))
  it('resolves Naga to WNP', () => expect(resolveIataCode('Naga')).toBe('WNP'))
  it('resolves Tokyo to HND', () => expect(resolveIataCode('Tokyo')).toBe('HND'))
  it('resolves Paris to CDG', () => expect(resolveIataCode('Paris')).toBe('CDG'))
  it('resolves Bangkok to BKK', () => expect(resolveIataCode('Bangkok')).toBe('BKK'))
  it('resolves Bali to DPS', () => expect(resolveIataCode('Bali')).toBe('DPS'))
  it('is case-insensitive', () => expect(resolveIataCode('manila')).toBe('MNL'))
  it('returns null for unknown city', () => expect(resolveIataCode('Nonexistentcity')).toBeNull())
})
