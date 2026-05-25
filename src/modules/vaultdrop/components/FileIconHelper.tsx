import {
  FileText, FileJson, FileImage, FileArchive, File, Film
} from 'lucide-react'

export const getFileIcon = (mimeType: string, size = 18) => {
  if (mimeType.startsWith('image/')) return <FileImage size={size} className="text-sky-400" />
  if (mimeType === 'application/pdf') return <FileText size={size} className="text-red-400" />
  if (mimeType === 'application/json') return <FileJson size={size} className="text-yellow-400" />
  if (mimeType.includes('zip')) return <FileArchive size={size} className="text-orange-400" />
  if (mimeType === 'text/plain') return <FileText size={size} className="text-surface-300" />
  if (mimeType.startsWith('video/')) return <Film size={size} className="text-purple-400" />
  return <File size={size} className="text-surface-400" />
}

export const getFileColor = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'text-sky-400 bg-sky-500/10'
  if (mimeType === 'application/pdf') return 'text-red-400 bg-red-500/10'
  if (mimeType === 'application/json') return 'text-yellow-400 bg-yellow-500/10'
  if (mimeType.includes('zip')) return 'text-orange-400 bg-orange-500/10'
  return 'text-surface-300 bg-surface-700/40'
}
