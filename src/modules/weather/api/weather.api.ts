import type { AirQualityResponse, Coordinates, ForecastResponse } from '../types/weather.types'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

async function fetchJson<T extends object>(url: URL): Promise<T> {
  const response = await fetch(url)
  const data = (await response.json()) as T | { error?: boolean; reason?: string }

  if (!response.ok || ('error' in data && data.error)) {
    throw new Error(('reason' in data && data.reason) || 'Unable to load weather intelligence')
  }

  return data as T
}

export async function fetchForecast({ latitude, longitude }: Coordinates): Promise<ForecastResponse> {
  const url = new URL(FORECAST_URL)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
  )
  url.searchParams.set(
    'hourly',
    [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'relative_humidity_2m',
      'dew_point_2m',
      'pressure_msl',
      'cloud_cover',
      'visibility',
      'wind_speed_10m',
      'uv_index',
    ].join(','),
  )
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'daylight_duration',
      'uv_index_max',
      'precipitation_probability_max',
      'wind_speed_10m_max',
    ].join(','),
  )

  return fetchJson<ForecastResponse>(url)
}

export async function fetchAirQuality({ latitude, longitude }: Coordinates): Promise<AirQualityResponse> {
  const url = new URL(AIR_QUALITY_URL)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('current', 'us_aqi,pm10,pm2_5')

  return fetchJson<AirQualityResponse>(url)
}
