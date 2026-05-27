import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, Bell, ChevronRight, Sun, Moon } from 'lucide-react'
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
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAppSelector((s) => s.auth)
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, toggleTheme, isDark } = useTheme()

  const segments = location.pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => ({ label: breadcrumbMap[seg] || seg, key: seg }))

  return (
    <header
      className={cn(
        'h-[60px] flex items-center gap-3 px-4 lg:px-5 flex-shrink-0 transition-colors duration-200',
        'bg-surface-900/80 backdrop-blur-md border-b border-surface-700/60',
      )}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 flex-1 min-w-0">
        {segments.map((seg, i) => (
          <span key={seg.key} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight size={12} className="text-surface-600 flex-shrink-0" />}
            <span
              className={cn(
                'text-sm truncate',
                i === segments.length - 1
                  ? 'font-semibold'
                  : 'text-surface-400',
              )}
            >
              {seg.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Search */}
        <motion.div
          animate={{ width: searchOpen ? 220 : 32 }}
          transition={{ duration: 0.2 }}
          className="relative flex items-center"
        >
          {searchOpen ? (
            <input
              autoFocus
              placeholder="Search…"
              onBlur={() => setSearchOpen(false)}
              className="w-full bg-surface-800 border border-surface-600 rounded-lg pl-8 pr-3 py-1.5 text-sm placeholder:text-surface-400 outline-none focus:border-brand-500"
            />
          ) : null}
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              searchOpen
                ? 'absolute left-0 text-surface-400 pointer-events-none'
                : 'text-surface-400 hover:text-white hover:bg-surface-700',
            )}
          >
            <Search size={16} />
          </button>
        </motion.div>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.9 }}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Profile */}
        <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-700 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate text-surface-200">
            {user?.name || 'User'}
          </span>
        </button>
      </div>
    </header>
  )
}
