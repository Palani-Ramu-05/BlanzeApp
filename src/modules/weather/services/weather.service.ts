import { fetchAirQuality, fetchForecast } from '../api/weather.api'
import type { Coordinates, WeatherBundle } from '../types/weather.types'

export async function getWeatherIntelligence(coords: Coordinates): Promise<WeatherBundle> {
  const [forecast, airQuality] = await Promise.all([
    fetchForecast(coords),
    fetchAirQuality(coords),
  ])

  const timezoneCity = forecast.timezone.split('/').pop()?.replaceAll('_', ' ')
  const coordinateLabel = `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`

  return {
    forecast,
    airQuality,
    locationName: timezoneCity ? `${timezoneCity} Area` : coordinateLabel,
  }
}
