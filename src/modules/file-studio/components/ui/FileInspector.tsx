import { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Hash, Type, BarChart3 } from 'lucide-react'
import { cn } from '@utils/index'

interface FileInspectorProps {
  file: File
  className?: string
}

interface ImageMetadata {
  width: number
  height: number
  aspectRatio: string
  type: string
  fileSizeMB: string
  lastModified: string
}

export const FileInspector = memo(function FileInspector({ file, className }: FileInspectorProps) {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null)

  useEffect(() => {
    if (!file.type.startsWith('image/')) {
      setMetadata(null)
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
      const w = img.naturalWidth
      const h = img.naturalHeight
      const d = gcd(w, h)
      setMetadata({
        width: w,
        height: h,
        aspectRatio: `${w / d}:${h / d}`,
        type: file.type.split('/')[1]?.toUpperCase() || 'Unknown',
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
        lastModified: new Date(file.lastModified).toLocaleDateString(),
      })
      URL.revokeObjectURL(url)
    }
    img.src = url
    return () => { URL.revokeObjectURL(url) }
  }, [file])

  if (!metadata) return null

  const items = [
    { icon: <ImageIcon size={13} />, label: 'Dimensions', value: `${metadata.width} × ${metadata.height}` },
    { icon: <Hash size={13} />, label: 'Aspect Ratio', value: metadata.aspectRatio },
    { icon: <Type size={13} />, label: 'Type', value: metadata.type },
    { icon: <BarChart3 size={13} />, label: 'Size', value: `${metadata.fileSizeMB} MB` },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('rounded-xl border border-surface-700/50 bg-surface-800/30', className)}
    >
      <div className="px-4 py-3 border-b border-surface-700/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Inspector</p>
      </div>
      <div className="p-2 space-y-0.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 py-2 px-3 rounded-lg hover:bg-surface-800/40 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-800/60 flex items-center justify-center text-surface-400 flex-shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-surface-500 font-medium uppercase tracking-wider">{item.label}</p>
              <p className="text-xs font-semibold text-surface-100">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
})
