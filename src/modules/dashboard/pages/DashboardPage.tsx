import { motion } from 'framer-motion'
import { Zap, ArrowRight, BarChart3, Users, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@components/index'
import { useAppSelector } from '@core/hooks/useStore'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { ROUTES } from '@core/constants/constants'

const stats = [
  { label: 'API Requests', value: '12,847', change: '+18%', icon: <Activity size={18} />, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { label: 'Active Users', value: '3,214', change: '+5%', icon: <Users size={18} />, color: 'text-green-400', bg: 'bg-green-500/10' },
  { label: 'Collections', value: '48', change: '+2', icon: <Zap size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Success Rate', value: '99.2%', change: '+0.3%', icon: <BarChart3 size={18} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export const DashboardPage = () => {
  usePageTitle('Dashboard')
  const { user } = useAppSelector((s) => s.auth)

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-black text-white mb-1">
          Good morning, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-sm text-surface-400">Here's what's happening in your workspace today.</p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-xs text-surface-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader
              title="FetchLab — API Testing"
              subtitle="Test REST & GraphQL APIs with a Postman-like interface"
              actions={
                <Link
                  to={ROUTES.FETCHLAB}
                  className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                >
                  Open <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="grid grid-cols-3 gap-2">
              {['GET', 'POST', 'DELETE'].map((method) => (
                <div
                  key={method}
                  className="p-2.5 rounded-lg bg-surface-800 border border-surface-700 text-center"
                >
                  <span
                    className={`text-xs font-bold ${
                      method === 'GET'
                        ? 'text-green-400'
                        : method === 'POST'
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}
                  >
                    {method}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader title="Recent Activity" subtitle="Latest events in your workspace" />
            <div className="space-y-2">
              {[
                { action: 'API request sent', time: '2m ago', icon: '⚡' },
                { action: 'New collection created', time: '15m ago', icon: '📁' },
                { action: 'User invited', time: '1h ago', icon: '👤' },
                { action: 'Auth token refreshed', time: '3h ago', icon: '🔐' },
              ].map((event) => (
                <div key={event.action} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-800 transition-colors">
                  <span className="text-sm">{event.icon}</span>
                  <span className="text-xs text-surface-300 flex-1">{event.action}</span>
                  <span className="text-[10px] text-surface-500">{event.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
