import { useState, useRef, useCallback, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { Move } from 'lucide-react'

interface CropSelectorProps {
  imageUrl: string
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void
  className?: string
}

export const CropSelector = memo(function CropSelector({ imageUrl, onCropChange, className }: CropSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const img = imageRef.current
    if (!img) return
    const updateSize = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
      setDisplaySize({ width: img.clientWidth, height: img.clientHeight })
    }
    if (img.complete) {
      updateSize()
    } else {
      img.onload = updateSize
    }
  }, [imageUrl])

  const getImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      const scaleX = naturalSize.width / displaySize.width || 1
      const scaleY = naturalSize.height / displaySize.height || 1
      return {
        x: Math.round((clientX - rect.left) * scaleX),
        y: Math.round((clientY - rect.top) * scaleY),
      }
    },
    [naturalSize, displaySize],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getImageCoords(e.clientX, e.clientY)
      setDrawing(true)
      setStartPos(pos)
      setCrop({ ...pos, width: 0, height: 0 })
    },
    [getImageCoords],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawing) return
      const pos = getImageCoords(e.clientX, e.clientY)
      const newCrop = {
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        width: Math.abs(pos.x - startPos.x),
        height: Math.abs(pos.y - startPos.y),
      }
      setCrop(newCrop)
      onCropChange(newCrop)
    },
    [drawing, startPos, onCropChange, getImageCoords],
  )

  const handleMouseUp = useCallback(() => {
    setDrawing(false)
  }, [])

  const scaleToDisplay = (val: number, axis: 'x' | 'y') => {
    const srcSize = axis === 'x' ? naturalSize.width : naturalSize.height
    const dstSize = axis === 'x' ? displaySize.width : displaySize.height
    return (val / (srcSize || 1)) * dstSize
  }

  const displayCrop = {
    x: scaleToDisplay(crop.x, 'x'),
    y: scaleToDisplay(crop.y, 'y'),
    width: scaleToDisplay(crop.width, 'x'),
    height: scaleToDisplay(crop.height, 'y'),
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative inline-block cursor-crosshair select-none rounded-lg overflow-hidden border border-surface-700/50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Crop selection"
          className="max-w-full max-h-[400px] object-contain block"
          draggable={false}
        />
        {(crop.width > 0 || crop.height > 0) && (
          <div
            className="absolute border-2 border-brand-400 bg-brand-500/10 pointer-events-none"
            style={{
              left: displayCrop.x,
              top: displayCrop.y,
              width: displayCrop.width,
              height: displayCrop.height,
            }}
          >
            <div className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-900/80 text-[10px] text-brand-300 font-mono whitespace-nowrap">
              <Move size={10} />
              {crop.width} x {crop.height}
            </div>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-4 gap-3 mt-3"
      >
        <div className="rounded-lg bg-surface-800/50 border border-surface-700/50 px-3 py-2">
          <p className="text-[10px] text-surface-500 uppercase tracking-wider">X</p>
          <p className="text-sm font-mono font-semibold text-brand-300">{crop.x}px</p>
        </div>
        <div className="rounded-lg bg-surface-800/50 border border-surface-700/50 px-3 py-2">
          <p className="text-[10px] text-surface-500 uppercase tracking-wider">Y</p>
          <p className="text-sm font-mono font-semibold text-brand-300">{crop.y}px</p>
        </div>
        <div className="rounded-lg bg-surface-800/50 border border-surface-700/50 px-3 py-2">
          <p className="text-[10px] text-surface-500 uppercase tracking-wider">Width</p>
          <p className="text-sm font-mono font-semibold text-brand-300">{crop.width}px</p>
        </div>
        <div className="rounded-lg bg-surface-800/50 border border-surface-700/50 px-3 py-2">
          <p className="text-[10px] text-surface-500 uppercase tracking-wider">Height</p>
          <p className="text-sm font-mono font-semibold text-brand-300">{crop.height}px</p>
        </div>
      </motion.div>
    </div>
  )
})
