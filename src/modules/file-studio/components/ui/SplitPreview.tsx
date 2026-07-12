import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@utils/index'

interface SplitPreviewProps {
  beforeUrl: string
  afterUrl: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

export const SplitPreview = ({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className,
}: SplitPreviewProps) => {
  const [sliderPos, setSliderPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      setSliderPos((x / rect.width) * 100)
    },
    [],
  )

  const handleMouseDown = useCallback(() => {
    setDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return
      handleMove(e.clientX)
    },
    [dragging, handleMove],
  )

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleMove(e.touches[0].clientX)
    },
    [handleMove],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-surface-700/50 bg-surface-800/30 overflow-hidden', className)}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-700/30">
        <span className="text-[11px] font-mono text-surface-400">{beforeLabel}</span>
        <span className="text-[11px] font-mono text-brand-400">{afterLabel}</span>
      </div>
      <div
        ref={containerRef}
        className="relative w-full h-[400px] select-none overflow-hidden cursor-ew-resize"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        <img
          src={afterUrl}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={beforeUrl}
            alt={beforeLabel}
            className="absolute top-0 left-0 w-full h-full object-contain max-w-none"
            style={{ width: `${100 / (sliderPos / 100)}%` }}
            draggable={false}
          />
        </div>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/70 shadow-lg z-10"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-surface-700">
              <path d="M4 2L2 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 2L10 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
