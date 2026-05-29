import { motion } from 'framer-motion'
import { AlertTriangle, BrainCircuit, LocateFixed, RefreshCw, ShieldCheck, Sparkles, Waves } from 'lucide-react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useWeatherIntelligence } from '../hooks/useWeatherIntelligence'
import { WeatherSkeleton } from './WeatherSkeleton'
import { WeatherHero } from './WeatherHero'
import {
  AirQualitySection,
  DailyForecast,
  HourlyForecast,
  InsightPanel,
  MetricsGrid,
  SunMoonSection,
  WeatherCharts,
} from './WeatherSections'

export function WeatherExperience() {
  const { coords, status, error: locationError, refreshLocation } = useGeolocation()
  const weatherQuery = useWeatherIntelligence(coords)

  if (status === 'loading' || weatherQuery.isLoading) return <WeatherSkeleton />

  if (weatherQuery.isError) {
    return (
      <WeatherState
        title="Weather intelligence is temporarily unavailable"
        message={weatherQuery.error.message}
        actionLabel="Try again"
        onAction={() => weatherQuery.refetch()}
      />
    )
  }

  if (!weatherQuery.data) {
    return (
      <WeatherState
        title="Enable location intelligence"
        message={locationError || 'Allow location access to generate local weather intelligence.'}
        actionLabel="Use my location"
        onAction={refreshLocation}
      />
    )
  }

  const permissionNote = status === 'denied' || status === 'unsupported' ? locationError : null

  return (
    <div className="relative -m-6 min-h-[calc(100vh-var(--header-height))] overflow-hidden bg-[#070a12]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,.20),transparent_26%),radial-gradient(circle_at_78%_0%,rgba(168,85,247,.15),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(251,191,36,.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,.045),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto max-w-[1500px] space-y-5 p-3 sm:p-5 lg:p-6">
        <WeatherCommandBar
          locationName={weatherQuery.data.locationName}
          refreshing={weatherQuery.isFetching}
          onRefresh={() => weatherQuery.refetch()}
        />
        <WeatherHero
          bundle={weatherQuery.data}
          onRefresh={() => weatherQuery.refetch()}
          refreshing={weatherQuery.isFetching}
          permissionNote={permissionNote}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } }, hidden: {} }}
          className="space-y-5"
        >
          <InsightPanel bundle={weatherQuery.data} />
          <MetricsGrid bundle={weatherQuery.data} />
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <HourlyForecast bundle={weatherQuery.data} />
            <DailyForecast bundle={weatherQuery.data} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <SunMoonSection bundle={weatherQuery.data} />
            <AirQualitySection bundle={weatherQuery.data} />
          </div>
          <WeatherCharts bundle={weatherQuery.data} />
        </motion.div>
      </div>
    </div>
  )
}

function WeatherCommandBar({
  locationName,
  refreshing,
  onRefresh,
}: {
  locationName: string
  refreshing: boolean
  onRefresh: () => void
}) {
  const chips = [
    { label: 'Live Model', icon: Waves },
    { label: 'AI Briefing', icon: BrainCircuit },
    { label: '15m Cache', icon: ShieldCheck },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 flex flex-col gap-3 rounded-[22px] border border-white/10 bg-surface-950/58 p-3 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-surface-400">Blanze Weather OS</p>
          <p className="truncate text-sm font-black text-white">{locationName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {chips.map(({ label, icon: Icon }) => (
          <span key={label} className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-surface-300">
            <Icon size={13} className="text-brand-300" />
            {label}
          </span>
        ))}
        <button
          onClick={onRefresh}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12]"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </motion.div>
  )
}

function WeatherState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string
  message: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height)-48px)] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md rounded-3xl border border-white/10 bg-surface-900/90 p-6 text-center shadow-2xl shadow-black/20"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
          <AlertTriangle size={24} />
        </div>
        <h1 className="text-xl font-black text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-surface-400">{message}</p>
        <button onClick={onAction} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-500">
          {actionLabel === 'Try again' ? <RefreshCw size={15} /> : <LocateFixed size={15} />}
          {actionLabel}
        </button>
      </motion.div>
    </div>
  )
}
