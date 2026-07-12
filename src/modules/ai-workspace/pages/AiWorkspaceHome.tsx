import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@utils/index'
import { useAppSelector, useAppDispatch } from '@core/hooks/useStore'
import {
  MessageSquare,
  PenTool,
  Mic,
  FileText,
  Image,
  Code2,
  Languages,
  Search,
  Sparkles,
  Clock,
  Star,
  ArrowRight,
  Bot,
  FileOutput,
  MicVocal,
  ScanLine,
  CheckCheck,
  MessagesSquare,
} from 'lucide-react'
import {
  resetChat,
  setActiveConversation,
} from '../store/aiWorkspaceSlice'
import type { RecentActivity, FavoriteTool, StudioType } from '../dto/types'
import { format } from 'date-fns'
import { markdownRendererStyles } from '../styles/markdownStyles'
import { studioConfig } from '../config/studioConfig'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const AiWorkspaceHome = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { recentActivity, favorites, conversations } = useAppSelector((s) => s.aiWorkspace)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    if (searchValue.trim()) {
      dispatch(resetChat())
      navigate('/ai/chat')
    }
  }, [searchValue, dispatch, navigate])

  const handleNewChat = useCallback(() => {
    dispatch(resetChat())
    navigate('/ai/chat')
  }, [dispatch, navigate])

  const handleOpenStudio = useCallback((studio: StudioType) => {
    navigate(`/ai/${studio}`)
  }, [navigate])

  const handleOpenRecent = useCallback((activity: RecentActivity) => {
    if (activity.conversationId) {
      dispatch(setActiveConversation(activity.conversationId))
      navigate('/ai/chat')
    } else {
      navigate(`/ai/${activity.studio}`)
    }
  }, [dispatch, navigate])

  const getStudioIcon = (id: StudioType) => {
    const config = studioConfig[id]
    if (config) return config.icon
    return <Bot size={20} />
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <style>{markdownRendererStyles}</style>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="text-center space-y-3">
            <motion.h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[rgb(var(--color-text-primary))]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Hello, {user?.name || 'there'}
            </motion.h1>
            <p className="text-base sm:text-lg text-surface-400">
              What would you like to create today?
            </p>
          </motion.div>

          {/* AI Search Box */}
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-brand-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative flex items-center bg-surface-900 border border-surface-700/60 rounded-2xl shadow-lg overflow-hidden focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all duration-200">
                <Search size={20} className="ml-4 text-surface-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
                  placeholder="Ask AI anything..."
                  className="flex-1 bg-transparent border-none outline-none px-3 py-4 text-sm placeholder:text-surface-400"
                  style={{ color: 'rgb(var(--color-text-primary))' }}
                  aria-label="AI search input"
                />
                <div className="flex items-center gap-1 pr-3">
                  <QuickActionButton
                    icon={<Mic size={16} />}
                    label="Voice"
                    onClick={() => handleOpenStudio('voice')}
                  />
                  <QuickActionButton
                    icon={<FileText size={16} />}
                    label="Upload"
                    onClick={() => handleOpenStudio('document')}
                  />
                  <QuickActionButton
                    icon={<Image size={16} />}
                    label="Image"
                    onClick={() => handleOpenStudio('image')}
                  />
                  <QuickActionButton
                    icon={<Code2 size={16} />}
                    label="Code"
                    onClick={() => handleOpenStudio('coding')}
                  />
                  <QuickActionButton
                    icon={<Languages size={16} />}
                    label="Translate"
                    onClick={() => handleOpenStudio('translation')}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center mt-3">
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/80 border border-surface-700/60 hover:border-surface-500/50 hover:bg-surface-800 transition-all text-xs font-medium text-surface-300 hover:text-surface-100"
                >
                  <MessageSquare size={14} />
                  New Chat
                </button>
              </div>
            </div>
          </motion.div>

          {/* Studio Cards */}
          <motion.div variants={itemVariants}>
            <h2 className="text-sm font-semibold text-surface-400 mb-4 flex items-center gap-2">
              <Sparkles size={14} />
              Studios
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.values(studioConfig).map((studio) => (
                <StudioCard
                  key={studio.id}
                  icon={studio.icon}
                  title={studio.title}
                  description={studio.description}
                  gradient={studio.gradient}
                  color={studio.color}
                  onClick={() => handleOpenStudio(studio.id as StudioType)}
                />
              ))}
            </div>
          </motion.div>

          {/* Recent Activity & Favorites */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div>
              <h2 className="text-sm font-semibold text-surface-400 mb-3 flex items-center gap-2">
                <Clock size={14} />
                Recent Activity
              </h2>
              <div className="space-y-1.5">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity) => (
                    <RecentActivityCard
                      key={activity.id}
                      activity={activity}
                      onClick={() => handleOpenRecent(activity)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 bg-surface-900/50 border border-surface-700/30 rounded-xl">
                    <Bot size={24} className="text-surface-600 mx-auto mb-2" />
                    <p className="text-xs text-surface-500">No recent activity</p>
                    <p className="text-[10px] text-surface-600 mt-1">Start a chat or use a studio</p>
                  </div>
                )}
              </div>
            </div>

            {/* Favorites */}
            <div>
              <h2 className="text-sm font-semibold text-surface-400 mb-3 flex items-center gap-2">
                <Star size={14} />
                Favorites
              </h2>
              <div className="grid grid-cols-2 gap-1.5">
                {favorites.map((fav) => (
                  <FavoriteCard
                    key={fav.id}
                    favorite={fav}
                    onClick={() => navigate(`/ai/${fav.studio}`)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

interface QuickActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

const QuickActionButton = ({ icon, label, onClick }: QuickActionButtonProps) => (
  <button
    onClick={onClick}
    className="p-2 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800/80 transition-all"
    aria-label={label}
    title={label}
  >
    {icon}
  </button>
)

interface StudioCardProps {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  color: string
  onClick: () => void
}

const StudioCard = ({ icon, title, description, gradient, color, onClick }: StudioCardProps) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      'relative group flex flex-col items-start p-4 rounded-2xl text-left',
      'border border-surface-700/50 bg-surface-900/80 backdrop-blur-sm',
      'hover:border-surface-500/50 transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
    )}
    style={{ boxShadow: 'var(--shadow-card)' }}
    aria-label={`Open ${title}`}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3"
      style={{ background: gradient }}
    >
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))] mb-1">{title}</h3>
    <p className="text-xs text-surface-400 leading-relaxed line-clamp-2">{description}</p>
    <div
      className="mt-2 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      style={{ color }}
    >
      <span>Open</span>
      <ArrowRight size={12} />
    </div>
    <div
      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
      style={{ background: gradient }}
    />
  </motion.button>
)

interface RecentActivityCardProps {
  activity: RecentActivity
  onClick: () => void
}

const activityIcons: Record<string, React.ReactNode> = {
  chat: <MessageSquare size={14} />,
  document: <FileText size={14} />,
  voice: <MicVocal size={14} />,
  task: <ScanLine size={14} />,
  translation: <Languages size={14} />,
}

const RecentActivityCard = ({ activity, onClick }: RecentActivityCardProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-800/60 transition-all group"
  >
    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400 group-hover:text-surface-200 transition-colors">
      {activityIcons[activity.type] || <FileOutput size={14} />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-[rgb(var(--color-text-primary))] truncate">{activity.title}</p>
      <p className="text-[10px] text-surface-500">{activity.subtitle} · {format(activity.timestamp, 'MMM d, h:mm a')}</p>
    </div>
    <ArrowRight size={12} className="text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
  </button>
)

interface FavoriteCardProps {
  favorite: FavoriteTool
  onClick: () => void
}

const favoriteIconMap: Record<string, React.ReactNode> = {
  mic: <Mic size={14} />,
  'refresh-cw': <PenTool size={14} />,
  'file-text': <FileText size={14} />,
  scan: <ScanLine size={14} />,
  languages: <Languages size={14} />,
  'check-circle': <CheckCheck size={14} />,
  'message-square': <MessagesSquare size={14} />,
}

const FavoriteCard = ({ favorite, onClick }: FavoriteCardProps) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-900/50 border border-surface-700/40 hover:border-surface-500/50 hover:bg-surface-800/60 transition-all group text-left"
  >
    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
      {favoriteIconMap[favorite.icon] || <Star size={14} />}
    </div>
    <span className="text-xs font-medium text-surface-300 group-hover:text-surface-100 transition-colors truncate">
      {favorite.name}
    </span>
  </button>
)
