/* eslint-disable @typescript-eslint/no-explicit-any */
declare class Amadeus {
  constructor(opts: { clientId: string; clientSecret: string })
  shopping: {
    flightOffersSearch: {
      get(params: Record<string, string | number>): Promise<{ data: any[] }>
    }
    hotelOffersSearch: {
      get(params: Record<string, string>): Promise<{ data: any[] }>
    }
  }
  referenceData: {
    locations: {
      hotels: {
        byCity: {
          get(params: { cityCode: string }): Promise<{ data: any[] }>
        }
      }
    }
  }
}

export default Amadeus
