import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Hourglass, Zap, Bell, Maximize2 } from 'lucide-react'
import { cn } from '@utils/index'

const CountdownTimer = lazy(() => import('../components/CountdownTimer').then(m => ({ default: m.CountdownTimer })))
const Stopwatch = lazy(() => import('../components/Stopwatch').then(m => ({ default: m.Stopwatch })))
const IntervalTimer = lazy(() => import('../components/IntervalTimer').then(m => ({ default: m.IntervalTimer })))
const AlarmManager = lazy(() => import('../components/AlarmManager').then(m => ({ default: m.AlarmManager })))

type Tab = 'countdown' | 'stopwatch' | 'interval' | 'alarm'

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  { id: 'countdown', label: 'Countdown', icon: <Timer size={16} />, color: '#3b82f6', description: 'Focus timer with presets' },
  { id: 'stopwatch', label: 'Stopwatch', icon: <Hourglass size={16} />, color: '#10b981', description: 'Precision lap timer' },
  { id: 'interval', label: 'Interval', icon: <Zap size={16} />, color: '#f59e0b', description: 'HIIT & workout rounds' },
  { id: 'alarm', label: 'Alarm', icon: <Bell size={16} />, color: '#8b5cf6', description: 'Smart alarm system' },
]

function TabLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
    </div>
  )
}

export function TimerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('countdown')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const active = TABS.find(t => t.id === activeTab)!

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('flex flex-col gap-6', isFullscreen && 'fixed inset-0 z-50 bg-surface-950 p-6')}
    >
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${active.color}20`, border: `1.5px solid ${active.color}50` }}>
              <span style={{ color: active.color }}>{active.icon}</span>
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>Timer</h1>
              <p className="text-xs text-surface-400">{active.description}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsFullscreen(v => !v)}
          className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-white hover:border-surface-500 transition-all flex items-center justify-center"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 bg-surface-900/60 border border-surface-700/60 rounded-2xl p-1.5 overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
              activeTab === tab.id ? 'text-white' : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="timer-tab-bg"
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: `${tab.color}20`, border: `1.5px solid ${tab.color}40` }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative" style={{ color: activeTab === tab.id ? tab.color : undefined }}>
              {tab.icon}
            </span>
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-surface-900/60 border border-surface-700/60 rounded-2xl p-6 flex-1 min-h-[500px]"
        style={{ boxShadow: 'var(--shadow-card)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'countdown' && <CountdownTimer />}
              {activeTab === 'stopwatch' && <Stopwatch />}
              {activeTab === 'interval' && <IntervalTimer />}
              {activeTab === 'alarm' && <AlarmManager />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
