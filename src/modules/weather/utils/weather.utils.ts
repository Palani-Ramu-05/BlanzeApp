import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Moon,
  Snowflake,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import type {
  DailyForecastItem,
  ForecastResponse,
  HourlyForecastItem,
  WeatherCurrent,
  WeatherTheme,
} from '../types/weather.types'

export interface WeatherDescriptor {
  label: string
  icon: LucideIcon
  theme: WeatherTheme
}

export function describeWeather(code: number, isDay = true): WeatherDescriptor {
  if (!isDay) return { label: 'Quiet night', icon: Moon, theme: 'night' }
  if (code === 0) return { label: 'Clear sky', icon: Sun, theme: 'sunny' }
  if ([1, 2].includes(code)) return { label: 'Mostly clear', icon: Sun, theme: 'sunny' }
  if (code === 3) return { label: 'Overcast', icon: Cloud, theme: 'cloudy' }
  if ([45, 48].includes(code)) return { label: 'Foggy', icon: CloudFog, theme: 'cloudy' }
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: CloudDrizzle, theme: 'rain' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain expected', icon: CloudRain, theme: 'rain' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snowfall', icon: CloudSnow, theme: 'snow' }
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: CloudLightning, theme: 'storm' }
  return { label: 'Changing conditions', icon: Cloud, theme: 'cloudy' }
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function formatHour(value: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true }).format(new Date(value))
}

export function formatDay(value: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(value))
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value))
}

export function getThemeClasses(theme: WeatherTheme): string {
  const themes: Record<WeatherTheme, string> = {
    sunny: 'from-amber-400/35 via-orange-500/20 to-sky-500/20',
    cloudy: 'from-sky-400/25 via-slate-400/15 to-slate-800/30',
    rain: 'from-blue-500/25 via-cyan-500/10 to-slate-950/70',
    storm: 'from-slate-800/70 via-blue-500/20 to-cyan-400/15',
    night: 'from-indigo-500/25 via-violet-500/15 to-slate-950/80',
    snow: 'from-cyan-200/30 via-blue-200/15 to-slate-800/35',
  }
  return themes[theme]
}

export function getHourlyForecast(forecast: ForecastResponse): HourlyForecastItem[] {
  const now = Date.now()
  const start = Math.max(0, forecast.hourly.time.findIndex((time) => new Date(time).getTime() >= now))
  return forecast.hourly.time.slice(start, start + 24).map((time, index) => {
    const actualIndex = start + index
    return {
      time,
      temperature: forecast.hourly.temperature_2m[actualIndex] ?? 0,
      rainProbability: forecast.hourly.precipitation_probability[actualIndex] ?? 0,
      weatherCode: forecast.hourly.weather_code[actualIndex] ?? 0,
      windSpeed: forecast.hourly.wind_speed_10m[actualIndex] ?? 0,
    }
  })
}

export function getDailyForecast(forecast: ForecastResponse): DailyForecastItem[] {
  return forecast.daily.time.map((date, index) => ({
    date,
    weatherCode: forecast.daily.weather_code[index] ?? 0,
    min: forecast.daily.temperature_2m_min[index] ?? 0,
    max: forecast.daily.temperature_2m_max[index] ?? 0,
    rainProbability: forecast.daily.precipitation_probability_max[index] ?? 0,
  }))
}

export function getWeatherInsight(current: WeatherCurrent, forecast: ForecastResponse): string {
  const maxRain = Math.max(...forecast.daily.precipitation_probability_max.slice(0, 1), 0)
  const maxUv = Math.max(...forecast.hourly.uv_index.slice(10, 16), 0)
  const maxWind = Math.max(...forecast.daily.wind_speed_10m_max.slice(0, 1), current.wind_speed_10m)

  if (maxRain < 20 && maxUv < 6 && maxWind < 24) return 'Current conditions are ideal for focused work and low-friction planning today.'
  if (maxUv >= 8) return 'UV levels peak aggressively around midday. Plan outdoor work before noon or late afternoon.'
  if (maxRain >= 60) return 'Rain risk is material today. Keep travel windows flexible and expect slower transitions.'
  if (maxWind >= 35) return 'Wind speeds strengthen later today. Outdoor activity will feel noticeably more exposed.'
  if (current.relative_humidity_2m >= 80) return 'Humidity is elevated. Indoor focus blocks may feel more comfortable than long outdoor sessions.'
  return 'Conditions are stable with only minor weather friction expected across the next several hours.'
}

export function getInsightList(current: WeatherCurrent, forecast: ForecastResponse): string[] {
  const rain = forecast.daily.precipitation_probability_max[0] ?? 0
  const uv = forecast.daily.uv_index_max[0] ?? 0
  const wind = forecast.daily.wind_speed_10m_max[0] ?? current.wind_speed_10m
  const cloud = current.cloud_cover

  return [
    rain < 25 ? 'Low chance of rain today.' : `${Math.round(rain)}% rain probability is in the model today.`,
    uv >= 7 ? 'UV levels are high between late morning and mid-afternoon.' : 'UV exposure remains manageable today.',
    wind >= 32 ? 'Strong winds are expected after sunset.' : 'Wind should stay within a comfortable operating range.',
    cloud <= 35 ? 'High daylight quality supports outdoor breaks.' : 'Cloud cover may reduce glare and keep the day visually calm.',
  ]
}

export function getAqiLabel(aqi: number): { label: string; color: string; percent: number } {
  if (aqi <= 50) return { label: 'Good', color: '#22c55e', percent: 18 }
  if (aqi <= 100) return { label: 'Moderate', color: '#eab308', percent: 38 }
  if (aqi <= 150) return { label: 'Sensitive', color: '#f97316', percent: 58 }
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444', percent: 76 }
  return { label: 'Hazardous', color: '#a855f7', percent: 96 }
}

export function getMetricTrend(seed: number): number[] {
  return Array.from({ length: 10 }, (_, index) => {
    const wave = Math.sin((index + seed) / 1.8) * 10
    return Math.max(8, Math.round(42 + wave + (seed % 9)))
  })
}

export const metricIcons = {
  humidity: Droplets,
  uv: Sun,
  snow: Snowflake,
}
