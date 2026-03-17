'use client'

import { useState, useEffect, useRef } from 'react'
import type { DestinationSuggestion } from '@/domain/trip/types'

export type DestinationPrediction = DestinationSuggestion

export function useDestinationSearch(query: string, debounceMs = 300) {
  const [predictions, setPredictions] = useState<DestinationPrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(query)}`)
        const data = await res.json()
        setPredictions((data.predictions ?? []) as DestinationPrediction[])
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
