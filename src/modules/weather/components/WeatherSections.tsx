import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import {
  Activity,
  Cloud,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Navigation,
  RefreshCw,
  Sunrise,
  Sunset,
  ThermometerSun,
  Umbrella,
  Wind,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'
import type { WeatherBundle } from '../types/weather.types'
import {
  describeWeather,
  formatDay,
  formatHour,
  formatTime,
  getAqiLabel,
  getDailyForecast,
  getHourlyForecast,
  getInsightList,
  getMetricTrend,
} from '../utils/weather.utils'
import { AnimatedCounter } from './AnimatedCounter'

const cardBase = 'relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.055] shadow-[0_18px_70px_rgba(0,0,0,.22)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent'

export function InsightPanel({ bundle }: { bundle: WeatherBundle }) {
  const insights = getInsightList(bundle.forecast.current, bundle.forecast)

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`${cardBase} p-5`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">AI Insight Layer</p>
          <h2 className="mt-1 text-lg font-black text-white">Operational Weather Brief</h2>
        </div>
        <div className="rounded-2xl border border-brand-400/20 bg-brand-400/10 px-3 py-2 text-brand-200">
          <div className="flex items-center gap-2 text-xs font-black">
            <Activity size={15} />
            Live
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((insight, index) => (
          <motion.div
            key={insight}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-surface-300 transition hover:border-brand-300/30 hover:bg-white/[0.065]"
          >
            <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-300/70 to-violet-300/20 opacity-70" />
            {insight}
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

export function HourlyForecast({ bundle }: { bundle: WeatherBundle }) {
  const hours = getHourlyForecast(bundle.forecast)

  return (
    <section className={`${cardBase} p-5`}>
      <SectionHeader title="Next 24 Hours" subtitle="Temperature, rain risk and pressure windows" />
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {hours.map((hour, index) => {
          const descriptor = describeWeather(hour.weatherCode, true)
          const Icon = descriptor.icon
          return (
            <motion.div
              key={hour.time}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="min-w-[104px] rounded-[22px] border border-white/10 bg-black/10 p-3 text-center shadow-lg shadow-black/10 transition hover:border-cyan-300/30 hover:bg-white/[0.075]"
            >
              <p className="text-xs text-surface-400">{formatHour(hour.time)}</p>
              <Icon size={24} className="mx-auto my-3 text-brand-300" />
              <p className="text-xl font-black text-white">{Math.round(hour.temperature)}°</p>
              <p className="mt-2 text-[11px] text-cyan-300">{Math.round(hour.rainProbability)}% rain</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export function DailyForecast({ bundle }: { bundle: WeatherBundle }) {
  const days = getDailyForecast(bundle.forecast)

  return (
    <section className={`${cardBase} p-5`}>
      <SectionHeader title="7 Day Forecast" subtitle="Daily planning range" />
      <div className="mt-4 space-y-2">
        {days.map((day, index) => {
          const descriptor = describeWeather(day.weatherCode, true)
          const Icon = descriptor.icon
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-[72px_36px_1fr_64px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <p className="text-sm font-semibold text-white">{index === 0 ? 'Today' : formatDay(day.date)}</p>
              <Icon size={21} className="text-brand-300" />
              <div className="h-2 overflow-hidden rounded-full bg-surface-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-brand-400 to-amber-300"
                  style={{ width: `${Math.min(100, Math.max(20, day.max * 2))}%` }}
                />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{Math.round(day.max)}°</p>
                <p className="text-xs text-surface-400">{Math.round(day.min)}° / {Math.round(day.rainProbability)}%</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export function MetricsGrid({ bundle }: { bundle: WeatherBundle }) {
  const current = bundle.forecast.current
  const hourly = bundle.forecast.hourly
  const metrics: Array<{ label: string; value: number; suffix: string; icon: LucideIcon; decimals?: number }> = [
    { label: 'Humidity', value: current.relative_humidity_2m, suffix: '%', icon: Droplets },
    { label: 'Wind Speed', value: current.wind_speed_10m, suffix: ' km/h', icon: Wind },
    { label: 'Pressure', value: current.pressure_msl, suffix: ' hPa', icon: Gauge },
    { label: 'UV Index', value: hourly.uv_index[new Date().getHours()] ?? 0, suffix: '', icon: ThermometerSun, decimals: 1 },
    { label: 'Visibility', value: (hourly.visibility[new Date().getHours()] ?? 0) / 1000, suffix: ' km', icon: Eye, decimals: 1 },
    { label: 'Cloud Cover', value: current.cloud_cover, suffix: '%', icon: Cloud },
    { label: 'Dew Point', value: hourly.dew_point_2m[new Date().getHours()] ?? 0, suffix: '°', icon: Droplets },
    { label: 'Precipitation', value: current.precipitation, suffix: ' mm', icon: Umbrella, decimals: 1 },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={metric.label} metric={metric} index={index} />
      ))}
    </section>
  )
}

function MetricCard({
  metric,
  index,
}: {
  metric: { label: string; value: number; suffix: string; icon: LucideIcon; decimals?: number }
  index: number
}) {
  const Icon = metric.icon
  const trend = getMetricTrend(index + Math.round(metric.value))
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className={`${cardBase} p-4`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-surface-400">{metric.label}</p>
          <p className="mt-2 text-2xl font-black text-white">
            <AnimatedCounter value={metric.value} suffix={metric.suffix} decimals={metric.decimals ?? 0} />
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-2 text-brand-300">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 flex h-8 items-end gap-1">
        {trend.map((value, trendIndex) => (
          <span key={trendIndex} className="flex-1 rounded-full bg-brand-400/30" style={{ height: `${value}%` }} />
        ))}
      </div>
    </motion.div>
  )
}

export function SunMoonSection({ bundle }: { bundle: WeatherBundle }) {
  const daily = bundle.forecast.daily
  const daylightHours = (daily.daylight_duration[0] ?? 0) / 3600

  return (
    <section className={`${cardBase} p-5`}>
      <SectionHeader title="Sun & Moon" subtitle="Light window and rhythm planning" />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
        <div className="relative h-32 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-sky-400/20 to-orange-300/10">
          <div className="absolute bottom-4 left-6 right-6 h-px bg-white/20" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 130" preserveAspectRatio="none">
            <path d="M30 105 C120 10 300 10 390 105" fill="none" stroke="rgba(255,255,255,.34)" strokeWidth="2" strokeDasharray="7 7" />
          </svg>
          <motion.div
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '68%' }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute h-8 w-8 rounded-full bg-amber-300 shadow-[0_0_42px_rgba(252,211,77,.9)]"
            style={{ offsetPath: 'path("M30 105 C120 10 300 10 390 105")' }}
          />
        </div>
        <div className="grid gap-3">
          <SunStat icon={Sunrise} label="Sunrise" value={formatTime(daily.sunrise[0])} />
          <SunStat icon={Sunset} label="Sunset" value={formatTime(daily.sunset[0])} />
          <SunStat icon={RefreshCw} label="Daylight" value={`${daylightHours.toFixed(1)}h`} />
        </div>
      </div>
    </section>
  )
}

function SunStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <Icon size={18} className="text-amber-300" />
      <div>
        <p className="text-xs text-surface-400">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

export function AirQualitySection({ bundle }: { bundle: WeatherBundle }) {
  const aqi = bundle.airQuality.current.us_aqi ?? 0
  const status = getAqiLabel(aqi)
  const circumference = 2 * Math.PI * 42
  const dash = (status.percent / 100) * circumference

  return (
    <section className={`${cardBase} p-5`}>
      <SectionHeader title="Air Quality" subtitle="Health signal and particulates" />
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,.09)" strokeWidth="10" fill="none" />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              stroke={status.color}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dash} ${circumference}` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-black text-white">{Math.round(aqi)}</p>
            <p className="text-xs" style={{ color: status.color }}>{status.label}</p>
          </div>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <ParticleStat label="PM2.5" value={bundle.airQuality.current.pm2_5} />
          <ParticleStat label="PM10" value={bundle.airQuality.current.pm10} />
          <ParticleStat label="AQI" value={aqi} />
          <ParticleStat label="Wind bearing" value={bundle.forecast.current.wind_direction_10m} suffix="°" icon={Compass} />
        </div>
      </div>
    </section>
  )
}

function ParticleStat({ label, value, suffix = ' µg/m³', icon: Icon = Navigation }: { label: string; value: number; suffix?: string; icon?: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-xs text-surface-400">
        <Icon size={13} />
        {label}
      </div>
      <p className="mt-2 text-xl font-black text-white">{Math.round(value)}{suffix}</p>
    </div>
  )
}

export function WeatherCharts({ bundle }: { bundle: WeatherBundle }) {
  const data = getHourlyForecast(bundle.forecast).slice(0, 12).map((hour) => ({
    time: formatHour(hour.time),
    temperature: Math.round(hour.temperature),
    rain: Math.round(hour.rainProbability),
    wind: Math.round(hour.windSpeed),
  }))

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <ChartCard title="Temperature Trend">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="temperature" stroke="#f59e0b" fill="url(#tempGradient)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Rain Probability">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="rain" fill="#38bdf8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Wind Speed">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="wind" stroke="#a78bfa" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${cardBase} p-5`}>
      <SectionHeader title={title} subtitle="12 hour model curve" />
      <div className="mt-4">{children}</div>
    </section>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-base font-black text-white">{title}</h2>
      <p className="mt-1 text-xs text-surface-400">{subtitle}</p>
    </div>
  )
}

const tooltipStyle = {
  background: 'rgb(15 23 42 / .92)',
  border: '1px solid rgb(255 255 255 / .12)',
  borderRadius: 14,
  color: '#fff',
}
