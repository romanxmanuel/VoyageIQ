export interface TravelTimeAdapter {
  estimateTravelTime(origin: string, destination: string): Promise<number>;
}

