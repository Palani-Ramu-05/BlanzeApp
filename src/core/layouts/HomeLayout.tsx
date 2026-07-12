import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SideNav } from './SideNav'
import { Header } from './Header'
import { ErrorBoundary } from './ErrorBoundary'
import { motion } from 'framer-motion'

export const HomeLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isFullPage = ['/fetchlab', '/task-board', '/ai'].some(r => location.pathname.startsWith(r))

  return (
    <div className="flex h-screen bg-[rgb(var(--color-body-bg))] overflow-hidden">
      <SideNav
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />

        {isFullPage ? (
          <main className="flex-1 overflow-hidden min-h-0">
            <ErrorBoundary>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="h-full overflow-hidden"
              >
                <Outlet />
              </motion.div>
            </ErrorBoundary>
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <ErrorBoundary>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 lg:p-6 min-h-full"
              >
                <Outlet />
              </motion.div>
            </ErrorBoundary>
          </main>
        )}
      </div>
    </div>
  )
}
