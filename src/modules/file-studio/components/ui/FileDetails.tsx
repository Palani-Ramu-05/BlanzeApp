import { motion } from 'framer-motion'
import { File, HardDrive, Image as ImageIcon, Monitor, Calendar } from 'lucide-react'
import { cn } from '@utils/index'
import type { FileDetails as FileDetailsType } from '../../dto/common'

interface FileDetailsProps {
  details: FileDetailsType
  className?: string
}

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-800/40 transition-colors">
    <div className="w-8 h-8 rounded-lg bg-surface-800/60 flex items-center justify-center text-surface-400 flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-surface-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-surface-100 truncate">{value}</p>
    </div>
  </div>
)

export const FileDetails = ({ details, className }: FileDetailsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('rounded-xl border border-surface-700/50 bg-surface-800/30', className)}
    >
      <div className="px-4 py-3 border-b border-surface-700/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">File Details</p>
      </div>
      <div className="p-2 space-y-0.5">
        <DetailRow icon={<File size={14} />} label="Name" value={details.name} />
        <DetailRow icon={<File size={14} />} label="Extension" value={details.extension.toUpperCase()} />
        <DetailRow icon={<File size={14} />} label="MIME Type" value={details.mimeType} />
        <DetailRow icon={<HardDrive size={14} />} label="Size" value={details.sizeFormatted} />
        {details.dimensions && (
          <DetailRow
            icon={<ImageIcon size={14} />}
            label="Dimensions"
            value={`${details.dimensions.width} × ${details.dimensions.height}`}
          />
        )}
        {details.resolution && (
          <DetailRow icon={<Monitor size={14} />} label="Resolution" value={`${details.resolution.dpi} DPI`} />
        )}
        {details.lastModified && (
          <DetailRow icon={<Calendar size={14} />} label="Modified" value={new Date(details.lastModified).toLocaleDateString()} />
        )}
      </div>
    </motion.div>
  )
}
