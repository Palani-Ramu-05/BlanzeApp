import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppLogoName } from '@/assets/images'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-surface-950 to-surface-950" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-600/5 rounded-full blur-2xl translate-x-1/4 translate-y-1/4" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src={AppLogoName} alt="" height={100} />
          </div>
        </div>

        {/* Feature highlights */}
        {/* <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-black text-white leading-tight mb-3">
              Enterprise-grade
              <br />
              <span className="gradient-text">developer platform</span>
            </h2>
            <p className="text-surface-400 text-sm leading-relaxed max-w-sm">
              A powerful, scalable dashboard built for modern teams. Test APIs, manage workflows,
              and monitor everything — all in one place.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-3"
          >
            {[
              { icon: '⚡', label: 'FetchLab — Postman-style API testing' },
              { icon: '🔐', label: 'Secure authentication & authorization' },
              { icon: '📊', label: 'Real-time analytics & monitoring' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center text-sm flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-sm text-surface-300">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </div> */}

        {/* Bottom quote */}
        {/* <div className="relative z-10">
          <p className="text-xs text-surface-500">
            Trusted by developers & enterprise teams worldwide
          </p>
        </div> */}
      </div>

      {/* Right panel - auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <span>⚡</span>
            </div>
            <span className="text-base font-black text-white">BlanzeApp</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
