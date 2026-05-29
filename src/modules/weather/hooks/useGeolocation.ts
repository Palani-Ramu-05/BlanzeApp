import { useEffect, useState } from 'react'
import type { Coordinates } from '../types/weather.types'

type PermissionState = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported' | 'error'

interface GeolocationState {
  coords: Coordinates | null
  status: PermissionState
  error: string | null
  refreshLocation: () => void
}

const fallbackCoords: Coordinates = {
  latitude: 13.0827,
  longitude: 80.2707,
}

export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [status, setStatus] = useState<PermissionState>('idle')
  const [error, setError] = useState<string | null>(null)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setCoords(fallbackCoords)
      setStatus('unsupported')
      setError('Geolocation is not supported in this browser.')
      return
    }

    setStatus('loading')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setStatus('granted')
      },
      (geoError) => {
        setCoords(fallbackCoords)
        setStatus(geoError.code === geoError.PERMISSION_DENIED ? 'denied' : 'error')
        setError(geoError.message || 'Location permission is required for local weather intelligence.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 1000 * 60 * 10 },
    )
  }

  useEffect(() => {
    requestLocation()
  }, [])

  return { coords, status, error, refreshLocation: requestLocation }
}
