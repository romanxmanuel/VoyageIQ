// amadeus ships no TypeScript types; declaration lives in amadeus.d.ts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Amadeus = require('amadeus') as typeof import('./amadeus.d')['default']

let _client: InstanceType<typeof Amadeus> | null = null

export function getAmadeusClient(): InstanceType<typeof Amadeus> {
  if (_client) return _client

  const clientId = process.env.AMADEUS_CLIENT_ID
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      'AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET must be set in environment variables'
    )
  }

  _client = new Amadeus({ clientId, clientSecret })
  return _client
}
