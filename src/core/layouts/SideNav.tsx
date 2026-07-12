import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@utils/index'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { signOutThunk } from '@modules/auth/store/authSlice'
import { DashboardAppLogo, AppLogo2 } from '@/assets/images'
import { sidebarGroups, sidebarBottomItems } from '@/routes/sidebarConfig'
import type { SidebarItemConfig } from '@/routes/sidebarConfig'

interface SideNavProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function hasActiveChild(locationPath: string, item: SidebarItemConfig): boolean {
  if (item.route && locationPath.startsWith(item.route)) return true
  if (item.children) return item.children.some((child) => hasActiveChild(locationPath, child))
  return false
}

interface LeafItemProps {
  item: SidebarItemConfig
  collapsed: boolean
  onMobileClose: () => void
  depth?: number
}

const LeafItem = ({ item, collapsed, onMobileClose, depth = 0 }: LeafItemProps) => {
  const location = useLocation()
  const childTextClass = depth >= 1 ? 'text-xs' : 'text-sm'

  if (item.disabled || !item.route) {
    return (
      <div
        className={cn(
          'sidebar-item opacity-50 cursor-not-allowed',
          collapsed && 'justify-center px-0',
        )}
        title={collapsed ? item.title : undefined}
      >
        {item.icon && (
          <span className="flex-shrink-0 text-surface-500">{item.icon}</span>
        )}
        {!collapsed && (
          <span className={cn('flex-1 truncate overflow-hidden whitespace-nowrap text-surface-500', childTextClass)}>
            {item.title}
          </span>
        )}
        {!collapsed && item.badge && (
          <span className="text-[7px] font-medium text-surface-600 bg-surface-800 px-1 py-0.5 rounded whitespace-nowrap">
            {item.badge}
          </span>
        )}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs text-surface-100 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-dropdown">
            {item.title}
          </div>
        )}
      </div>
    )
  }

  const isDashboard = item.route === '/'
  const active = isDashboard
    ? location.pathname === '/'
    : location.pathname.startsWith(item.route)

  return (
    <NavLink
      to={item.route}
      onClick={onMobileClose}
      className={cn(
        'sidebar-item relative group',
        active && 'sidebar-item-active',
        collapsed && 'justify-center px-0',
      )}
      title={collapsed ? item.title : undefined}
    >
      {item.icon && (
        <span className={cn('flex-shrink-0', active ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-100')}>
          {item.icon}
        </span>
      )}
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={cn('flex-1 truncate overflow-hidden whitespace-nowrap', childTextClass)}
          >
            {item.title}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && item.badge && (
        <span className="text-[9px] font-bold bg-brand-500/15 text-brand-400 border border-brand-500/25 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          {item.badge}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs text-surface-100 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-dropdown">
          {item.title}
        </div>
      )}
    </NavLink>
  )
}

interface AccordionItemProps {
  item: SidebarItemConfig
  collapsed: boolean
  onMobileClose: () => void
  depth?: number
}

const AccordionItem = ({ item, collapsed, onMobileClose, depth = 0 }: AccordionItemProps) => {
  const location = useLocation()
  const active = hasActiveChild(location.pathname, item)
  const [open, setOpen] = useState(active)

  useEffect(() => {
    if (active && !open) setOpen(true)
  }, [active, open])

  if (collapsed) {
    return (
      <div className="flex flex-col items-center">
        {item.icon && (
          <div className="sidebar-item relative group justify-center px-0 cursor-pointer" onClick={() => setOpen((v) => !v)}>
            <span className={cn('flex-shrink-0', active ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-100')}>
              {item.icon}
            </span>
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs text-surface-100 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-dropdown">
              {item.title}
            </div>
          </div>
        )}
        {open && (
          <div className="flex flex-col items-center gap-0.5 mt-0.5 border-l border-surface-700/30 pl-1 ml-0.5">
            {item.children?.map((child) => (
              <RecursiveNavItem key={child.id} item={child} collapsed={collapsed} onMobileClose={onMobileClose} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'sidebar-item w-full',
          active && 'sidebar-item-active',
        )}
      >
        {item.icon && (
          <span className={cn('flex-shrink-0', active ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-100')}>
            {item.icon}
          </span>
        )}
        <span className="flex-1 truncate text-sm text-left">{item.title}</span>
        <ChevronDown
          size={14}
          className={cn('flex-shrink-0 text-surface-400 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 px-1 mt-0.5 border-l border-surface-700/30 ml-2.5 pl-1.5">
              {item.children?.map((child) => (
                <RecursiveNavItem key={child.id} item={child} collapsed={collapsed} onMobileClose={onMobileClose} depth={depth + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface RecursiveNavItemProps {
  item: SidebarItemConfig
  collapsed: boolean
  onMobileClose: () => void
  depth?: number
}

const RecursiveNavItem = ({ item, collapsed, onMobileClose, depth = 0 }: RecursiveNavItemProps) => {
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return <AccordionItem item={item} collapsed={collapsed} onMobileClose={onMobileClose} depth={depth} />
  }

  return <LeafItem item={item} collapsed={collapsed} onMobileClose={onMobileClose} depth={depth} />
}

const GroupLabel = ({ label, collapsed }: { label: string; collapsed: boolean }) => (
  <p className={cn(
    'text-[9px] font-semibold text-surface-500 uppercase tracking-[0.12em] px-2 mb-1 mt-5',
    collapsed && 'hidden',
  )}>
    {label}
  </p>
)

export const SideNav = ({ collapsed, onToggle, mobileOpen, onMobileClose }: SideNavProps) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)

  const sidebarContent = (
    <div className={cn('flex flex-col h-full', collapsed && 'items-center')}>
      <div className={cn('flex items-center gap-2.5 px-3 py-4 flex-shrink-0', collapsed && 'justify-center px-0')}>
        {collapsed && (
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src={AppLogo2} alt="App Logo" className="h-full w-full object-contain" />
          </div>
        )}
        <AnimatePresence>
          {!collapsed && (
            <img src={DashboardAppLogo} alt="App Logo" style={{ width: '65%', margin: 'auto' }} className="object-contain" />
          )}
        </AnimatePresence>
      </div>

      <div className={cn('h-px bg-surface-700/40 mb-3', collapsed ? 'w-8' : 'mx-4')} />

      <nav className={cn(
        'flex-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 no-scrollbar',
        collapsed && 'px-1',
      )}>
        {sidebarGroups.map((group) => (
          <div key={group.id}>
            {group.label && <GroupLabel label={group.label} collapsed={collapsed} />}
            <div className={cn(collapsed && 'flex flex-col items-center gap-0.5')}>
              {group.items.map((item) => (
                <RecursiveNavItem key={item.id} item={item} collapsed={collapsed} onMobileClose={onMobileClose} />
              ))}
            </div>
          </div>
        ))}

        <div className={cn('h-px bg-surface-700/30 my-2', collapsed ? 'w-8 mx-auto' : 'mx-2')} />

        <div className={cn(collapsed && 'flex flex-col items-center gap-0.5')}>
          {sidebarBottomItems.map((item) => (
            <RecursiveNavItem key={item.id} item={item} collapsed={collapsed} onMobileClose={onMobileClose} />
          ))}
        </div>
      </nav>

      <div className="flex-shrink-0 border-t border-surface-700/40 p-2 mt-2">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl hover:bg-surface-800/50 transition-all cursor-pointer group',
            collapsed && 'justify-center',
          )}
          onClick={() => dispatch(signOutThunk())}
          title="Sign out"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden flex-1 min-w-0"
              >
                <p className="text-xs font-semibold text-surface-100 truncate whitespace-nowrap max-w-[120px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-surface-400 truncate whitespace-nowrap max-w-[120px]">
                  {user?.email || ''}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-surface-500 group-hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
              <LogOut size={13} />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col relative bg-surface-900 border-r border-surface-700/40 h-screen flex-shrink-0 overflow-hidden"
      >
        {sidebarContent}

        <button
          onClick={onToggle}
          className="absolute top-5 -right-3 w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-100 hover:border-surface-500 transition-all z-10 shadow-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-surface-900 border-r border-surface-700/40 z-40 lg:hidden overflow-hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
