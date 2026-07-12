import { motion } from 'framer-motion'
import { useAppSelector } from '@core/hooks/useStore'
import { usePageTitle } from '@core/hooks/usePageTitle'
import {
  ArrowRight, Zap, CloudUpload, Wrench, Timer,
  KanbanSquare, NotebookPen, ScanSearch, Sparkles,
  Activity, CheckCircle2, Clock, TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const quickActions = [
  { label: 'FetchLab', desc: 'Test APIs', icon: Zap, to: '/fetchlab', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'VaultDrop', desc: 'File storage', icon: CloudUpload, to: '/vaultdrop', color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { label: 'DevTools', desc: 'Developer utilities', icon: Wrench, to: '/devtools', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Web Scraper', desc: 'Extract data', icon: ScanSearch, to: '/web-scraper', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

const recentActivity = [
  { action: 'API request sent', detail: 'GET /api/users', time: '2m ago', icon: Zap, color: 'text-amber-400' },
  { action: 'File uploaded', detail: 'design-final-v3.fig', time: '15m ago', icon: CloudUpload, color: 'text-brand-400' },
  { action: 'Task completed', detail: 'Review PR #42', time: '1h ago', icon: CheckCircle2, color: 'text-emerald-400' },
  { action: 'Note edited', detail: 'Sprint notes', time: '2h ago', icon: NotebookPen, color: 'text-violet-400' },
]

const projectSummary = [
  { label: 'API Collections', value: '12', change: '+2', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Files Stored', value: '48', change: '+5', icon: CloudUpload, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { label: 'Active Tasks', value: '24', change: '-3', icon: KanbanSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Notes', value: '16', change: '+1', icon: NotebookPen, color: 'text-violet-400', bg: 'bg-violet-500/10' },
]

const tips = [
  'Use Ctrl+Enter to send requests in FetchLab',
  'Drag & drop files directly into VaultDrop',
  'Toggle dark/light mode from the header',
  'Collapse the sidebar for more workspace space',
]

export const DashboardPage = () => {
  usePageTitle('Dashboard')
  const navigate = useNavigate()
  const { user } = useAppSelector((s) => s.auth)

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Here's what's happening across your workspace
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {projectSummary.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              className="premium-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={15} className={stat.color} />
                </div>
                <span className={`text-[11px] font-semibold ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-surface-400 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Zap size={14} className="text-brand-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.25 }}
                  onClick={() => navigate(action.to)}
                  className="premium-card p-4 text-left cursor-pointer group hover:border-brand-500/30"
                >
                  <div className={`w-9 h-9 rounded-xl ${action.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon size={17} className={action.color} />
                  </div>
                  <p className="text-sm font-bold">{action.label}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{action.desc}</p>
                </motion.button>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="premium-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700/50">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Activity size={14} className="text-brand-400" />
                  Recent Activity
                </h2>
                <button className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
                  View all <ArrowRight size={11} />
                </button>
              </div>
              <div className="divide-y divide-surface-700/30">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-800/30 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0">
                      <item.icon size={13} className={item.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-surface-400">{item.detail}</p>
                    </div>
                    <span className="text-[11px] text-surface-500 flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* System Status */}
            <div className="premium-card p-5">
              <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-emerald-400" />
                System Status
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'API Service', status: 'Operational', color: 'text-emerald-400' },
                  { label: 'Database', status: 'Healthy', color: 'text-emerald-400' },
                  { label: 'Storage', status: 'Operational', color: 'text-emerald-400' },
                  { label: 'Authentication', status: 'Active', color: 'text-emerald-400' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-surface-400">{s.label}</span>
                    <span className={`text-xs font-semibold flex items-center gap-1.5 ${s.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="premium-card p-5">
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Clock size={14} className="text-amber-400" />
                Quick Tips
              </h2>
              <div className="space-y-2.5">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <TrendingUp size={11} className="text-brand-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-surface-300 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modules */}
            <div className="premium-card p-5">
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                <KanbanSquare size={14} className="text-brand-400" />
                Modules
              </h2>
              <div className="space-y-2">
                {[
                  { label: 'Task Board', icon: KanbanSquare, to: '/task-board' },
                  { label: 'Timer', icon: Timer, to: '/timer' },
                  { label: 'Notes', icon: NotebookPen, to: '/notes' },
                ].map((m) => (
                  <button
                    key={m.label}
                    onClick={() => navigate(m.to)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-surface-800/60 transition-colors text-xs font-medium text-surface-300 hover:text-white text-left"
                  >
                    <m.icon size={13} className="text-surface-400" />
                    {m.label}
                    <ArrowRight size={11} className="ml-auto text-surface-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
