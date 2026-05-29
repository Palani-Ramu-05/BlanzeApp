import { motion } from 'framer-motion'
import { CalendarClock, Gauge, MapPin, RefreshCw, Sparkles, Wind } from 'lucide-react'
import type { WeatherBundle, WeatherTheme } from '../types/weather.types'
import { describeWeather, formatTime, getGreeting, getThemeClasses, getWeatherInsight } from '../utils/weather.utils'
import { AnimatedCounter } from './AnimatedCounter'

interface WeatherHeroProps {
  bundle: WeatherBundle
  onRefresh: () => void
  refreshing: boolean
  permissionNote?: string | null
}

export function WeatherHero({ bundle, onRefresh, refreshing, permissionNote }: WeatherHeroProps) {
  const { forecast, locationName } = bundle
  const descriptor = describeWeather(forecast.current.weather_code, forecast.current.is_day === 1)
  const Icon = descriptor.icon
  const insight = getWeatherInsight(forecast.current, forecast)

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[34px] border border-white/10 bg-surface-900/68 p-4 shadow-[0_30px_120px_rgba(0,0,0,.45)] backdrop-blur-2xl lg:p-7"
    >
      <DynamicAtmosphere theme={descriptor.theme} />

      <div className="relative z-10 grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-stretch">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/10 p-5 backdrop-blur-2xl lg:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-10 top-16 h-44 w-44 rounded-full border border-white/10" />

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl">
              <Sparkles size={13} className="text-amber-200" />
              Predictive Weather Intelligence
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-xs text-white/75 backdrop-blur-xl">
              <CalendarClock size={13} />
              Updated {formatTime(forecast.current.time)}
            </span>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/60">{getGreeting()}</p>
          <h1 className="mt-3 max-w-4xl text-[2.3rem] font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            Weather signals, refined for focused execution.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-white/72 lg:text-base">
            {locationName}: {insight}
          </p>

          {permissionNote && (
            <p className="mt-3 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-100">
              {permissionNote} Showing a fallback location until access is enabled.
            </p>
          )}

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            <SignalPill label="Comfort" value={`${Math.round(forecast.current.apparent_temperature)} deg`} />
            <SignalPill label="Cloud Load" value={`${Math.round(forecast.current.cloud_cover)}%`} />
            <SignalPill label="Pressure" value={`${Math.round(forecast.current.pressure_msl)} hPa`} />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border border-white/[0.12] bg-white/[0.075] p-5 text-white shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-x-10 top-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/65">{descriptor.label}</p>
              <p className="mt-2 text-7xl font-black tracking-tight sm:text-8xl">
                <AnimatedCounter value={forecast.current.temperature_2m} suffix=" deg" />
              </p>
            </div>
            <button
              onClick={onRefresh}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20"
              title="Refresh weather"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="relative mt-6 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
              className="absolute h-52 w-52 rounded-full border border-dashed border-white/18"
            />
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-36 w-36 items-center justify-center rounded-[42px] border border-white/15 bg-black/15 text-white shadow-2xl backdrop-blur-2xl"
            >
              <Icon size={76} strokeWidth={1.25} />
            </motion.div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 text-xs text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-white/60">
                <Gauge size={13} /> Feels like
              </div>
              <p className="text-lg font-bold text-white">{Math.round(forecast.current.apparent_temperature)} deg</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-white/60">
                <Wind size={13} /> Wind
              </div>
              <p className="text-lg font-bold text-white">{Math.round(forecast.current.wind_speed_10m)} km/h</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-white/65">
            <MapPin size={13} />
            {forecast.latitude.toFixed(2)}, {forecast.longitude.toFixed(2)}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function SignalPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  )
}

function DynamicAtmosphere({ theme }: { theme: WeatherTheme }) {
  return (
    <>
      <motion.div
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className={`absolute inset-0 bg-gradient-to-br ${getThemeClasses(theme)}`}
        style={{ backgroundSize: '240% 240%' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(255,255,255,0.12),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.46))]" />
      {Array.from({ length: 20 }).map((_, index) => (
        <motion.span
          key={index}
          animate={{ y: [0, -18, 0], opacity: [0.18, 0.7, 0.18] }}
          transition={{ duration: 4 + (index % 5), repeat: Infinity, delay: index * 0.18 }}
          className="absolute h-1 w-1 rounded-full bg-white/60"
          style={{ left: `${6 + index * 4.7}%`, top: `${14 + (index % 7) * 10}%` }}
        />
      ))}
    </>
  )
}
