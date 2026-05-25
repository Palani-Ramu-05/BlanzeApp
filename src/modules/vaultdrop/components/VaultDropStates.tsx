import { motion } from 'framer-motion'
import { CloudUpload } from 'lucide-react'

export const VaultDropEmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center"
  >
    <div className="relative">
      <div className="w-20 h-20 rounded-3xl bg-surface-800/80 border border-surface-700/40 flex items-center justify-center">
        <CloudUpload size={32} className="text-surface-500" />
      </div>
      <div className="absolute inset-0 rounded-3xl bg-brand-500/10 blur-2xl" />
    </div>
    <div className="space-y-1.5">
      <p className="text-base font-bold text-white">No files uploaded yet</p>
      <p className="text-sm text-surface-400 max-w-xs">
        Drag & drop files above or click to browse. Your uploads will appear here.
      </p>
    </div>
  </motion.div>
)

export const VaultDropSkeleton = () => (
  <div className="rounded-xl border border-surface-700/60 overflow-hidden">
    <div className="px-4 py-2.5 bg-surface-800/60 border-b border-surface-700/40 h-9 animate-pulse bg-surface-800" />
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-surface-800/60 last:border-0">
        <div className="w-8 h-8 rounded-lg bg-surface-800 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-surface-800 rounded animate-pulse w-1/3" />
          <div className="h-2.5 bg-surface-800/60 rounded animate-pulse w-1/5" />
        </div>
        <div className="flex gap-1">
          <div className="w-7 h-7 rounded-lg bg-surface-800 animate-pulse" />
          <div className="w-7 h-7 rounded-lg bg-surface-800 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)
