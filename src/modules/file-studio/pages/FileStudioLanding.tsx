import { motion } from 'framer-motion'
import { Image, FileText, FileArchive, Shuffle } from 'lucide-react'
import { ToolCard } from '../components/landing/ToolCard'

const tools = [
  {
    title: 'Image Tools',
    description: 'Compress, resize, crop, rotate, flip, convert, watermark, and strip metadata from images.',
    icon: <Image size={22} className="text-white" />,
    route: '/file-studio/image-tools',
    formats: ['PNG', 'JPG', 'WEBP', 'AVIF'],
    gradient: 'bg-gradient-to-br from-blue-500/20 to-purple-500/20',
  },
  {
    title: 'PDF Tools',
    description: 'Merge, split, extract, delete, rotate, reorder pages, and compress PDF documents.',
    icon: <FileText size={22} className="text-white" />,
    route: '/file-studio/pdf-tools',
    formats: ['PDF'],
    gradient: 'bg-gradient-to-br from-red-500/20 to-orange-500/20',
  },
  {
    title: 'Compression',
    description: 'Reduce file size with configurable compression levels while maintaining quality.',
    icon: <FileArchive size={22} className="text-white" />,
    route: '/file-studio/compression',
    formats: ['PNG', 'JPG', 'WEBP', 'PDF'],
    gradient: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20',
  },
  {
    title: 'Format Converter',
    description: 'Convert between popular image formats, CSV/JSON, and TXT/JSON data formats.',
    icon: <Shuffle size={22} className="text-white" />,
    route: '/file-studio/converter',
    formats: ['PNG', 'JPG', 'WEBP', 'CSV', 'JSON', 'TXT'],
    gradient: 'bg-gradient-to-br from-amber-500/20 to-pink-500/20',
  },
]

export const FileStudioLanding = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full"
    >
      <div className="max-w-7xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            File <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-surface-400 text-sm sm:text-base">
            One Workspace. Every File Tool.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tools.map((tool, i) => (
            <ToolCard key={tool.route} {...tool} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
