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

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      <SideNav
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* Main scrollable area with consistent p-6 padding */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <ErrorBoundary>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6 min-h-full"
            >
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
