import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, Bell, ChevronRight, Sun, Moon, Command } from 'lucide-react'
import { useAppSelector } from '@core/hooks/useStore'
import { useTheme } from '@core/contexts/ThemeContext'
import { cn } from '@utils/index'

interface HeaderProps {
  onMenuClick: () => void
}

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  fetchlab: 'FetchLab',
  analytics: 'Analytics',
  users: 'Users',
  packages: 'Packages',
  security: 'Security',
  notifications: 'Notifications',
  settings: 'Settings',
  help: 'Help',
  vaultdrop: 'VaultDrop',
  devtools: 'DevTools',
  'api-mock-server': 'API Mock Server',
  timer: 'Timer',
  'task-board': 'Task Board',
  notes: 'Notes',
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAppSelector((s) => s.auth)
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const { toggleTheme, isDark } = useTheme()

  const segments = location.pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => ({ label: breadcrumbMap[seg] || seg, key: seg }))

  return (
    <header
      className={cn(
        'h-14 flex items-center gap-3 px-4 lg:px-5 flex-shrink-0 transition-all duration-200',
        'bg-surface-900/70 backdrop-blur-lg border-b border-surface-700/40',
      )}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={17} />
      </button>

      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        <Command size={13} className="text-surface-500 flex-shrink-0" />
        {segments.map((seg, i) => (
          <span key={seg.key} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight size={11} className="text-surface-600 flex-shrink-0" />}
            <span
              className={cn(
                'text-sm truncate',
                i === segments.length - 1
                  ? 'font-semibold text-surface-100'
                  : 'text-surface-400',
              )}
            >
              {seg.label}
            </span>
          </span>
        ))}
        {segments.length === 0 && (
          <span className="text-sm font-semibold text-surface-100">Dashboard</span>
        )}
      </nav>

      <div className="flex items-center gap-1 flex-shrink-0">
        <motion.div
          animate={{ width: searchOpen ? 240 : 32 }}
          transition={{ duration: 0.2 }}
          className="relative flex items-center"
        >
          {searchOpen ? (
            <input
              autoFocus
              placeholder="Search anything…"
              onBlur={() => setSearchOpen(false)}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-8 pr-3 py-1.5 text-sm placeholder:text-surface-400 outline-none focus:border-brand-500 transition-colors text-surface-100"
            />
          ) : null}
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              searchOpen
                ? 'absolute left-0 text-surface-400 pointer-events-none'
                : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800',
            )}
            aria-label="Search"
          >
            <Search size={15} />
          </button>
        </motion.div>

        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors" aria-label="Notifications">
          <Bell size={15} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-400 rounded-full ring-2 ring-surface-900" />
        </button>

        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.9 }}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? 'dark' : 'light'}
              initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
              transition={{ duration: 0.15 }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-surface-800 transition-colors ml-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-[11px] font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-surface-200 max-w-[80px] truncate">
            {user?.name || 'User'}
          </span>
        </button>
      </div>
    </header>
  )
}
