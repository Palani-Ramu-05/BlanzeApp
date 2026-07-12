import { cn } from '@utils/index'
import { X, FileText, Image, Music, Video, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { AiAttachment } from '../dto/types'
import { formatBytes } from '@utils/index'

interface AttachmentsProps {
  attachments: AiAttachment[]
  onRemove: (id: string) => void
  className?: string
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image size={16} />
  if (type.startsWith('audio/')) return <Music size={16} />
  if (type.startsWith('video/')) return <Video size={16} />
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return <FileText size={16} />
  return <File size={16} />
}

export const Attachments = ({ attachments, onRemove, className }: AttachmentsProps) => {
  if (attachments.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2 px-4 pt-3', className)}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs max-w-[200px]',
            attachment.status === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-surface-800/60 border-surface-700/60 text-surface-300',
          )}
        >
          {attachment.status === 'uploading' ? (
            <Loader2 size={14} className="animate-spin text-brand-400" />
          ) : attachment.status === 'error' ? (
            <AlertCircle size={14} className="text-red-400" />
          ) : (
            <span className="text-surface-400">{getFileIcon(attachment.type)}</span>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate max-w-[120px]">{attachment.name}</p>
            {attachment.status === 'uploading' && attachment.progress !== undefined ? (
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${attachment.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-surface-500">{attachment.progress}%</span>
              </div>
            ) : (
              <p className="text-[10px] text-surface-500">{formatBytes(attachment.size)}</p>
            )}
          </div>

          {attachment.status !== 'uploading' && (
            <button
              onClick={() => onRemove(attachment.id)}
              className="p-0.5 rounded hover:bg-surface-700/60 text-surface-500 hover:text-red-400 transition-colors flex-shrink-0"
              aria-label={`Remove ${attachment.name}`}
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
