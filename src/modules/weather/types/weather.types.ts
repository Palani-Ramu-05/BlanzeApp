export type WeatherTheme = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'night' | 'snow'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface WeatherCurrent {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  is_day: number
  precipitation: number
  weather_code: number
  cloud_cover: number
  pressure_msl: number
  wind_speed_10m: number
  wind_direction_10m: number
  wind_gusts_10m: number
}

export interface WeatherHourly {
  time: string[]
  temperature_2m: number[]
  apparent_temperature: number[]
  precipitation_probability: number[]
  precipitation: number[]
  weather_code: number[]
  relative_humidity_2m: number[]
  dew_point_2m: number[]
  pressure_msl: number[]
  cloud_cover: number[]
  visibility: number[]
  wind_speed_10m: number[]
  uv_index: number[]
}

export interface WeatherDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  sunrise: string[]
  sunset: string[]
  daylight_duration: number[]
  uv_index_max: number[]
  precipitation_probability_max: number[]
  wind_speed_10m_max: number[]
}

export interface ForecastResponse {
  latitude: number
  longitude: number
  timezone: string
  timezone_abbreviation: string
  current: WeatherCurrent
  hourly: WeatherHourly
  daily: WeatherDaily
}

export interface AirQualityCurrent {
  time: string
  us_aqi: number
  pm10: number
  pm2_5: number
}

export interface AirQualityResponse {
  current: AirQualityCurrent
}

export interface HourlyForecastItem {
  time: string
  temperature: number
  rainProbability: number
  weatherCode: number
  windSpeed: number
}

export interface DailyForecastItem {
  date: string
  weatherCode: number
  min: number
  max: number
  rainProbability: number
}

export interface WeatherBundle {
  forecast: ForecastResponse
  airQuality: AirQualityResponse
  locationName: string
}
