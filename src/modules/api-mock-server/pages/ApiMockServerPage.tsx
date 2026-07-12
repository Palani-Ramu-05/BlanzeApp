import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Database, Plus, Search, Star, Archive, MoreHorizontal, Copy, Trash2,
  FolderOpen, ChevronRight, FileJson, Globe, Box,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  fetchProjects, createProject, deleteProject, duplicateProject, toggleFavorite, toggleArchive, setSearchQuery,
} from '../store/apiMockServerSlice'
import type { MockProject } from '../dto/types/api-mock-server.types'
import { cn } from '@utils/index'
import { ROUTES } from '@core/constants/constants'
import { getMockUrl } from '../services/api-mock-server.service'

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  POST: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  PUT: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  PATCH: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  DELETE: 'text-red-400 bg-red-500/10 border-red-500/20',
  HEAD: 'text-surface-400 bg-surface-500/10 border-surface-500/20',
  OPTIONS: 'text-surface-400 bg-surface-500/10 border-surface-500/20',
}

function ProjectCard({ project, onEdit, onDelete }: { project: MockProject; onEdit: () => void; onDelete: () => void }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-surface-900/60 border border-surface-700/50 rounded-2xl p-4 hover:border-brand-500/30 hover:shadow-glow-sm hover:shadow-brand-500/5 transition-all cursor-pointer backdrop-blur-sm"
      onClick={() => navigate(`${ROUTES.API_MOCK_SERVER}/${project.uuid}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-glow-sm shadow-brand-600/20 flex-shrink-0">
            <Database size={16} className="text-surface-50" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-surface-50 truncate max-w-[200px]">{project.name}</h3>
            <p className="text-[10px] text-surface-500 truncate max-w-[200px]">{project.description || 'No description'}</p>
          </div>
        </div>
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800 transition-all opacity-0 group-hover:opacity-100">
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 bg-surface-800 border border-surface-700/60 rounded-xl shadow-dropdown z-50 py-1 overflow-hidden" onMouseLeave={() => setMenuOpen(false)}>
              {[
                { icon: Copy, label: 'Duplicate', action: () => dispatch(duplicateProject(project.uuid)) },
                { icon: Star, label: project.isFavorite ? 'Unfavorite' : 'Favorite', action: () => dispatch(toggleFavorite(project.uuid)) },
                { icon: Archive, label: project.isArchived ? 'Unarchive' : 'Archive', action: () => dispatch(toggleArchive(project.uuid)) },
                { icon: Globe, label: 'Copy Mock URL', action: () => navigator.clipboard.writeText(getMockUrl(project)) },
                { icon: Trash2, label: 'Delete', action: onDelete, danger: true },
              ].map((item) => (
                <button key={item.label} onClick={() => { item.action(); setMenuOpen(false) }}
                  className={cn('w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors', item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-surface-300 hover:bg-surface-700/60')}>
                  <item.icon size={12} /> {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono text-surface-400 bg-surface-800/60 px-1.5 py-0.5 rounded-md border border-surface-700/40">{project.basePath}</span>
        <span className="text-[10px] text-surface-500">v{project.version}</span>
        {project.isFavorite && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
        {project.isArchived && <Archive size={10} className="text-surface-500" />}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-surface-500">
        <span className="flex items-center gap-1"><FileJson size={10} /> {project.statistics.totalEndpoints} endpoints</span>
        <span className="flex items-center gap-1"><FolderOpen size={10} /> {project.statistics.totalCollections} collections</span>
        <span className="flex items-center gap-1 text-surface-600">{project.statistics.totalRequests} req</span>
      </div>
    </motion.div>
  )
}

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePath, setBasePath] = useState('/api')
  const [tags, setTags] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    await dispatch(createProject({
      name: name.trim(),
      description: description.trim(),
      basePath: basePath.trim() || '/api',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    }))
    setName('')
    setDescription('')
    setBasePath('/api')
    setTags('')
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-surface-900 border border-surface-700/60 rounded-2xl p-5 w-full max-w-md shadow-dropdown mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-surface-50 mb-1">New Mock Project</h2>
        <p className="text-[11px] text-surface-500 mb-4">Create a new API mock server project</p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-surface-400 mb-1 block">Project Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My API" autoFocus
              className="w-full px-3 py-1.5 bg-surface-800 border border-surface-700/60 rounded-lg text-[12px] text-surface-50 placeholder:text-surface-600 outline-none focus:border-brand-500/60 transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-surface-400 mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="API description..." rows={2}
              className="w-full px-3 py-1.5 bg-surface-800 border border-surface-700/60 rounded-lg text-[12px] text-surface-50 placeholder:text-surface-600 outline-none focus:border-brand-500/60 transition-all resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-surface-400 mb-1 block">Base Path</label>
            <input value={basePath} onChange={(e) => setBasePath(e.target.value)} placeholder="/api"
              className="w-full px-3 py-1.5 bg-surface-800 border border-surface-700/60 rounded-lg text-[12px] text-surface-50 placeholder:text-surface-600 outline-none focus:border-brand-500/60 transition-all font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-surface-400 mb-1 block">Tags (comma separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="auth, users, payments"
              className="w-full px-3 py-1.5 bg-surface-800 border border-surface-700/60 rounded-lg text-[12px] text-surface-50 placeholder:text-surface-600 outline-none focus:border-brand-500/60 transition-all" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-surface-700/40">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[11px] text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-all">Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim()}
            className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 disabled:opacity-40 transition-all shadow-glow-sm">
            Create Project
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function ApiMockServerPage() {
  const dispatch = useAppDispatch()
  const { projects, loading, pagination, searchQuery } = useAppSelector((s) => s.apiMockServer)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<'all' | 'favorites' | 'archived'>('all')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  const filtered = projects.filter((p) => {
    if (filter === 'favorites' && !p.isFavorite) return false
    if (filter === 'archived' && !p.isArchived) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
    }
    return true
  })

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteProject(deleteTarget))
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-glow-sm shadow-brand-600/20">
            <Database size={14} className="text-surface-50" />
          </div>
          <div>
            <h1 className="text-base font-black text-surface-50 tracking-tight">API Mock Server</h1>
            <p className="text-[10px] text-surface-500">Create, test, and manage mock APIs without writing code</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-glow-sm transition-all">
          <Plus size={12} /> New Project
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
          <input value={searchQuery} onChange={(e) => dispatch(setSearchQuery(e.target.value))} placeholder="Search projects, endpoints, tags..."
            className="w-full pl-7 pr-2.5 py-1.5 bg-surface-800/60 border border-surface-700/50 rounded-lg text-[11px] text-surface-50 placeholder:text-surface-600 outline-none focus:border-brand-500/60 transition-all" />
        </div>
        <div className="flex bg-surface-800/60 border border-surface-700/50 rounded-lg p-px gap-px">
          {(['all', 'favorites', 'archived'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-2.5 py-1 rounded text-[10px] font-semibold transition-all capitalize', filter === f ? 'bg-brand-600/30 text-brand-300' : 'text-surface-400 hover:text-surface-50')}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-900/60 border border-surface-700/50 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-surface-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 bg-surface-800 rounded" />
                  <div className="h-2 w-20 bg-surface-800 rounded" />
                </div>
              </div>
              <div className="h-2 w-32 bg-surface-800 rounded mb-3" />
              <div className="flex gap-3">
                <div className="h-2 w-16 bg-surface-800 rounded" />
                <div className="h-2 w-16 bg-surface-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-surface-500">
          <Box size={32} className="text-surface-700 mb-3" />
          <p className="text-sm font-medium text-surface-400 mb-1">No projects yet</p>
          <p className="text-[11px] text-surface-600 mb-4">Create your first mock API project to get started</p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 transition-all">
            <Plus size={12} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((project) => (
            <ProjectCard key={project.uuid} project={project} onEdit={() => {}} onDelete={() => setDeleteTarget(project.uuid)} />
          ))}
        </div>
      )}

      {pagination.total > 0 && (
        <p className="text-[10px] text-surface-600 text-center">{pagination.total} project{pagination.total !== 1 ? 's' : ''}</p>
      )}

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setDeleteTarget(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-900 border border-surface-700/60 rounded-2xl p-5 w-full max-w-sm shadow-dropdown mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-surface-50 mb-1">Delete Project?</h2>
            <p className="text-[11px] text-surface-500 mb-4">This will permanently delete all collections and endpoints in this project.</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 rounded-lg text-[11px] text-surface-400 hover:text-surface-200 transition-all">Cancel</button>
              <button onClick={handleDelete} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 transition-all">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
