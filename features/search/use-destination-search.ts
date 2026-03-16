'use client'

import { useState, useEffect, useRef } from 'react'
import { resolveIataCode } from '@/domain/trip/data/iata-city-map'

export interface DestinationPrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
  iataCode: string | null
}

export function useDestinationSearch(query: string, debounceMs = 300) {
  const [predictions, setPredictions] = useState<DestinationPrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (query.length < 2) {
      setPredictions([])
      return
    }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(query)}`)
        const data = await res.json()
        const enriched: DestinationPrediction[] = (data.predictions ?? []).map((p: any) => ({
          ...p,
          iataCode: resolveIataCode(p.mainText),
        }))
        setPredictions(enriched)
      } catch {
        setPredictions([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, debounceMs])

  return { predictions, isLoading }
}
