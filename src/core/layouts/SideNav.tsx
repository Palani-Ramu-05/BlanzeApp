import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Zap, ChevronLeft, ChevronRight, Settings,
  HelpCircle, BarChart3, Users, Package, Shield, Bell, CloudUpload, Wrench,
  Timer, KanbanSquare, NotebookPen
} from 'lucide-react'
import { cn } from '@utils/index'
import { ROUTES } from '@core/constants/constants'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { signOutThunk } from '@modules/auth/store/authSlice'
import { AppLogo, AppLogoName } from '@/assets/images'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  badge?: string | number
  group?: string
}

const navItems: NavItem[] = [
  { label: 'Weather', to: ROUTES.DASHBOARD, icon: <LayoutDashboard size={18} />, group: 'main' },
  { label: 'FetchLab', to: ROUTES.FETCHLAB, icon: <Zap size={18} />, badge: 'Pro', group: 'main' },
  { label: 'VaultDrop', to: ROUTES.VAULTDROP, icon: <CloudUpload size={18} />, group: 'main' },
  { label: 'DevTools', to: ROUTES.DEVTOOLS, icon: <Wrench size={18} />, group: 'main' },
  { label: 'Timer', to: ROUTES.TIMER, icon: <Timer size={18} />, group: 'productivity' },
  { label: 'Task Board', to: ROUTES.TASKBOARD, icon: <KanbanSquare size={18} />, group: 'productivity' },
  { label: 'Notes', to: ROUTES.NOTES, icon: <NotebookPen size={18} />, group: 'productivity' },
  { label: 'Analytics', to: '/analytics', icon: <BarChart3 size={18} />, group: 'system' },
  { label: 'Users', to: '/users', icon: <Users size={18} />, group: 'system' },
  { label: 'Packages', to: '/packages', icon: <Package size={18} />, group: 'system' },
  { label: 'Security', to: '/security', icon: <Shield size={18} />, group: 'system' },
  { label: 'Notifications', to: '/notifications', icon: <Bell size={18} />, group: 'system' },
]

const bottomItems: NavItem[] = [
  { label: 'Settings', to: '/settings', icon: <Settings size={18} /> },
  { label: 'Help', to: '/help', icon: <HelpCircle size={18} /> },
]

interface SideNavProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export const SideNav = ({ collapsed, onToggle, mobileOpen, onMobileClose }: SideNavProps) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const location = useLocation()

  const isActive = (to: string) => {
    if (to === ROUTES.DASHBOARD) return location.pathname === ROUTES.DASHBOARD
    return location.pathname.startsWith(to)
  }

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const active = isActive(item.to)
    return (
      <NavLink
        to={item.to}
        onClick={onMobileClose}
        className={cn(
          'sidebar-item relative group',
          active && 'sidebar-item-active',
          collapsed && 'justify-center px-0 py-2.5',
        )}
        title={collapsed ? item.label : undefined}
      >
        <span className={cn('flex-shrink-0', active ? 'text-brand-400' : 'text-surface-400 group-hover:text-white')}>
          {item.icon}
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 truncate text-sm overflow-hidden whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {!collapsed && item.badge && (
          <span className="text-[9px] font-bold bg-brand-600/20 text-brand-400 border border-brand-600/30 px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-3 px-2 py-1 bg-surface-800 border border-surface-700 rounded-lg text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-glass">
            {item.label}
          </div>
        )}
      </NavLink>
    )
  }

  const GroupLabel = ({ label }: { label: string }) => (
    <p className={cn('text-[10px] font-bold text-surface-500 uppercase tracking-widest px-2 mb-1 mt-4', collapsed && 'hidden')}>
      {label}
    </p>
  )

  const sidebarContent = (
    <div className={cn('flex flex-col h-full', collapsed ? 'items-center' : '')}>
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-3 py-4 flex-shrink-0', collapsed && 'justify-center px-0')}>
        {collapsed && (
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
            <img src={AppLogo} alt="App Logo" className="h-full w-full object-contain" />
        </div>
        )}
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-black text-white text-base tracking-tight overflow-hidden whitespace-nowrap"
            >
              <img src={AppLogoName} alt="App Logo" className="h-full w-[50%] object-contain" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className={cn('h-px bg-surface-700/60 mb-3', collapsed ? 'w-8' : 'mx-3')} />

      {/* Nav items */}
      <nav className={cn('flex-1 flex flex-col gap-0.5 overflow-y-auto px-2 no-scrollbar', collapsed && 'px-1')}>
        <GroupLabel label="Main" />
        {navItems.filter(i => i.group === 'main').map((item) => (
          <NavItemComponent key={item.to} item={item} />
        ))}

        <GroupLabel label="Productivity" />
        {navItems.filter(i => i.group === 'productivity').map((item) => (
          <NavItemComponent key={item.to} item={item} />
        ))}

        <GroupLabel label="System" />
        {navItems.filter(i => i.group === 'system').map((item) => (
          <NavItemComponent key={item.to} item={item} />
        ))}

        <p className={cn('text-[10px] font-bold text-surface-500 uppercase tracking-widest px-2 mb-1 mt-4', collapsed && 'hidden')}>
          Settings
        </p>
        {bottomItems.map((item) => (
          <NavItemComponent key={item.to} item={item} />
        ))}
      </nav>

      {/* User profile */}
      <div className={cn('flex-shrink-0 border-t border-surface-700/60 p-2 mt-2')}>
        <div
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-700/50 transition-colors cursor-pointer',
            collapsed && 'justify-center',
          )}
          onClick={() => dispatch(signOutThunk())}
          title="Sign out"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs font-semibold text-white truncate whitespace-nowrap max-w-[120px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-surface-400 truncate whitespace-nowrap max-w-[120px]">
                  {user?.email || ''}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 'var(--sidebar-width, 260px)' }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col relative bg-surface-900 border-r border-surface-700/60 h-screen flex-shrink-0 overflow-hidden"
      >
        {sidebarContent}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="absolute top-4 -right-3 w-6 h-6 bg-surface-800 border border-surface-600 rounded-full flex items-center justify-center text-surface-400 hover:text-white hover:border-brand-500 transition-all z-10 shadow-sm"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-surface-900 border-r border-surface-700/60 z-40 lg:hidden overflow-hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
