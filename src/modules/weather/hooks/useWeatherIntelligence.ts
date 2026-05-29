import { useQuery } from '@tanstack/react-query'
import { getWeatherIntelligence } from '../services/weather.service'
import type { Coordinates } from '../types/weather.types'

const FIFTEEN_MINUTES = 1000 * 60 * 15

export function useWeatherIntelligence(coords: Coordinates | null) {
  return useQuery({
    queryKey: ['weather-intelligence', coords?.latitude, coords?.longitude],
    queryFn: () => {
      if (!coords) throw new Error('Location is not available')
      return getWeatherIntelligence(coords)
    },
    enabled: Boolean(coords),
    staleTime: FIFTEEN_MINUTES,
    refetchInterval: FIFTEEN_MINUTES,
    refetchOnWindowFocus: false,
  })
}
