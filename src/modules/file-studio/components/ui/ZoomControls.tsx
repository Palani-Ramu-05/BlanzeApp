import { useState, useCallback, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { cn } from '@utils/index'

interface ZoomControlsProps {
  children: ReactNode
  className?: string
}

export const ZoomControls = ({ children, className }: ZoomControlsProps) => {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setRotation(0)
  }, [])

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5 px-1">
        <div className="flex items-center gap-1 rounded-lg border border-surface-700/50 bg-surface-800/30 p-0.5">
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-700/50 transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[11px] font-mono text-surface-400 w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-700/50 transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
        </div>
        <button
          onClick={handleRotate}
          className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-700/50 transition-colors border border-surface-700/50"
          title="Rotate 90°"
          aria-label="Rotate"
        >
          <RotateCw size={13} />
        </button>
        {(zoom !== 1 || rotation !== 0) && (
          <button
            onClick={handleReset}
            className="text-[10px] text-surface-400 hover:text-surface-100 transition-colors ml-1"
          >
            Reset
          </button>
        )}
      </div>
      <motion.div
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
