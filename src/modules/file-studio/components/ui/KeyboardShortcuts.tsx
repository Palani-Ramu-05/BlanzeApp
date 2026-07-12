import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard } from 'lucide-react'

const shortcuts = [
  { keys: ['Ctrl', 'V'], desc: 'Paste file from clipboard' },
  { keys: ['Ctrl', 'Z'], desc: 'Reset / clear file' },
  { keys: ['Escape'], desc: 'Close / dismiss' },
]

export const KeyboardShortcuts = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShow((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      <button
        onClick={() => setShow((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 w-9 h-9 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-100 hover:border-surface-500 transition-all shadow-lg"
        title="Keyboard shortcuts (? to toggle)"
        aria-label="Toggle keyboard shortcuts"
      >
        <Keyboard size={14} />
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed bottom-16 right-4 z-50 w-64 rounded-xl border border-surface-700/50 bg-surface-900/95 backdrop-blur-lg shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-surface-700/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Keyboard Shortcuts</p>
            </div>
            <div className="p-3 space-y-2">
              {shortcuts.map((s) => (
                <div key={s.desc} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-surface-300">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-800 border border-surface-700 text-surface-300"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
