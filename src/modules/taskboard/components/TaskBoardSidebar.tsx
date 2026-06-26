import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronRight, Plus, MoreHorizontal, Trash2, Pencil,
  Check, X, KanbanSquare, Layers,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  setActiveSpace, setActiveProject,
  createSpaceAsync, updateSpaceAsync, deleteSpaceAsync,
  createProjectAsync, updateProjectAsync, deleteProjectAsync,
} from '../store/taskboardSlice'
import { SPACE_COLORS, SPACE_ICONS, PROJECT_ICONS, type Space, type Project } from '../dto/types/taskboard.types'
import { cn } from '@utils/index'

// ── Small helpers ──────────────────────────────────────────────

function ColorDots({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map(c => (
        <button key={c} onClick={e => { e.stopPropagation(); onChange(c) }}
          className={cn('w-4 h-4 rounded-full transition-transform hover:scale-110 flex-shrink-0', value === c && 'ring-2 ring-white ring-offset-1 ring-offset-surface-800')}
          style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

function IconGrid({ icons, value, onChange }: { icons: string[]; value: string; onChange: (i: string) => void }) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {icons.map(ic => (
        <button key={ic} onClick={e => { e.stopPropagation(); onChange(ic) }}
          className={cn('w-7 h-7 text-sm rounded-lg flex items-center justify-center hover:bg-surface-700 transition-colors', value === ic && 'bg-surface-700 ring-1 ring-brand-500')}>
          {ic}
        </button>
      ))}
    </div>
  )
}

// ── Edit modal (for spaces and projects) ──────────────────────
interface EditModalProps {
  title: string
  name: string
  color: string
  icon: string
  iconSet: string[]
  onSave: (name: string, color: string, icon: string) => void
  onClose: () => void
}

function EditModal({ title, name: initName, color: initColor, icon: initIcon, iconSet, onSave, onClose }: EditModalProps) {
  const [name, setName]   = useState(initName)
  const [color, setColor] = useState(initColor)
  const [icon, setIcon]   = useState(initIcon)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="relative z-10 w-80 bg-surface-900 border border-surface-700 rounded-2xl p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="w-6 h-6 rounded-lg flex items-center justify-center text-surface-500 hover:text-white hover:bg-surface-700 transition-colors">
            <X size={13} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 mb-4 p-2.5 bg-surface-800/60 border border-surface-700/40 rounded-xl">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${color}22`, border: `1.5px solid ${color}66` }}>
            {icon}
          </span>
          <span className="text-sm font-semibold text-slate-200 flex-1 truncate">{name || 'Untitled'}</span>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider block mb-1">Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim(), color, icon) }}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-surface-600 outline-none focus:border-brand-500 transition-colors"
            placeholder="Enter name…"
          />
        </div>

        {/* Color */}
        <div className="mb-3">
          <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider block mb-2">Color</label>
          <ColorDots colors={SPACE_COLORS} value={color} onChange={setColor} />
        </div>

        {/* Icon */}
        <div className="mb-4">
          <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider block mb-2">Icon</label>
          <IconGrid icons={iconSet} value={icon} onChange={setIcon} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 text-xs text-surface-400 border border-surface-700 rounded-xl hover:border-surface-600 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), color, icon)}
            disabled={!name.trim()}
            className="flex-1 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Save
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Inline quick-create form ──────────────────────────────────
function InlineCreate({ placeholder, defaultColor, defaultIcon, iconSet, onConfirm, onCancel }: {
  placeholder: string; defaultColor: string; defaultIcon: string; iconSet: string[]
  onConfirm: (name: string, color: string, icon: string) => void
  onCancel: () => void
}) {
  const [name, setName]   = useState('')
  const [color, setColor] = useState(defaultColor)
  const [icon, setIcon]   = useState(defaultIcon)
  const [open, setOpen]   = useState(false)

  return (
    <div className="bg-surface-800/90 border border-surface-600 rounded-xl p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(v => !v)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-base hover:bg-surface-700 transition-colors flex-shrink-0"
          style={{ backgroundColor: `${color}22`, border: `1px solid ${color}44` }}>
          {icon}
        </button>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim(), color, icon); if (e.key === 'Escape') onCancel() }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-surface-500 outline-none min-w-0"
        />
        <button onClick={onCancel} className="text-surface-600 hover:text-red-400 transition-colors flex-shrink-0"><X size={12} /></button>
        <button onClick={() => name.trim() && onConfirm(name.trim(), color, icon)}
          className="text-surface-600 hover:text-green-400 transition-colors flex-shrink-0"><Check size={12} /></button>
      </div>
      {open && (
        <div className="space-y-2 pt-1 border-t border-surface-700/50">
          <div>
            <p className="text-[9px] text-surface-600 uppercase tracking-wider mb-1.5">Color</p>
            <ColorDots colors={SPACE_COLORS} value={color} onChange={setColor} />
          </div>
          <div>
            <p className="text-[9px] text-surface-600 uppercase tracking-wider mb-1.5">Icon</p>
            <IconGrid icons={iconSet} value={icon} onChange={setIcon} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dropdown menu (fixed position) ───────────────────────────
interface MenuItem { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }

function DropMenu({ items, anchorRef, onClose }: {
  items: MenuItem[]
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
}) {
  const rect = anchorRef.current?.getBoundingClientRect()
  if (!rect) return null
  const top  = rect.bottom + 4
  const left = Math.min(rect.left, window.innerWidth - 160)

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        onClick={e => e.stopPropagation()}
        className="absolute bg-surface-800 border border-surface-700 rounded-xl shadow-2xl py-1 min-w-[150px]"
        style={{ top, left }}
      >
        {items.map(item => (
          <button key={item.label}
            onClick={e => { e.stopPropagation(); item.onClick(); onClose() }}
            className={cn('w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors',
              item.danger
                ? 'text-surface-400 hover:text-red-400 hover:bg-red-500/10'
                : 'text-surface-300 hover:bg-surface-700 hover:text-white')}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </motion.div>
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────
export function TaskBoardSidebar() {
  const dispatch  = useAppDispatch()
  const { spaces, projects, tasks, activeSpaceId, activeProjectId } = useAppSelector(s => s.taskboard)

  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set(spaces.map(s => s.id)))

  // Create
  const [creatingSpace, setCreatingSpace]     = useState(false)
  const [creatingProject, setCreatingProject] = useState<string | null>(null)

  // Edit modals
  const [editSpace, setEditSpace]     = useState<Space | null>(null)
  const [editProject, setEditProject] = useState<Project | null>(null)

  // Dropdown menus (keyed by id, anchor ref stored per button)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRefs = useRef<Record<string, React.RefObject<HTMLButtonElement | null>>>({})

  const getRef = useCallback((id: string): React.RefObject<HTMLButtonElement | null> => {
    if (!menuRefs.current[id]) {
      menuRefs.current[id] = { current: null }
    }
    return menuRefs.current[id]
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedSpaces(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Space handlers ──
  const handleSaveSpace = (space: Space, name: string, color: string, icon: string) => {
    dispatch(updateSpaceAsync({ id: space.id, changes: { name, color, icon } }))
    setEditSpace(null)
  }

  const handleDeleteSpace = (id: string) => {
    if (window.confirm('Delete this space and all its projects and tasks?')) {
      dispatch(deleteSpaceAsync(id))
    }
  }

  // ── Project handlers ──
  const handleSaveProject = (project: Project, name: string, color: string, icon: string) => {
    dispatch(updateProjectAsync({ id: project.id, changes: { name, color, icon } }))
    setEditProject(null)
  }

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Delete this project and all its tasks?')) {
      dispatch(deleteProjectAsync(id))
    }
  }

  // ── Build menu items ──
  const spaceMenuItems = (space: Space): MenuItem[] => [
    {
      label: 'Edit Space',
      icon: <Pencil size={11} />,
      onClick: () => setEditSpace(space),
    },
    {
      label: 'Add Project',
      icon: <Plus size={11} />,
      onClick: () => { setCreatingProject(space.id); setExpandedSpaces(prev => new Set([...prev, space.id])) },
    },
    {
      label: 'Delete Space',
      icon: <Trash2 size={11} />,
      onClick: () => handleDeleteSpace(space.id),
      danger: true,
    },
  ]

  const projectMenuItems = (project: Project): MenuItem[] => [
    {
      label: 'Edit Project',
      icon: <Pencil size={11} />,
      onClick: () => setEditProject(project),
    },
    {
      label: 'Delete Project',
      icon: <Trash2 size={11} />,
      onClick: () => handleDeleteProject(project.id),
      danger: true,
    },
  ]

  return (
    <>
      {/* Edit modals */}
      <AnimatePresence>
        {editSpace && (
          <EditModal
            title="Edit Space"
            name={editSpace.name}
            color={editSpace.color}
            icon={editSpace.icon}
            iconSet={SPACE_ICONS}
            onSave={(n, c, i) => handleSaveSpace(editSpace, n, c, i)}
            onClose={() => setEditSpace(null)}
          />
        )}
        {editProject && (
          <EditModal
            title="Edit Project"
            name={editProject.name}
            color={editProject.color}
            icon={editProject.icon}
            iconSet={PROJECT_ICONS}
            onSave={(n, c, i) => handleSaveProject(editProject, n, c, i)}
            onClose={() => setEditProject(null)}
          />
        )}
      </AnimatePresence>

      {/* Dropdown menus (rendered via fixed portal) */}
      <AnimatePresence>
        {openMenu && openMenu.startsWith('space-') && (
          <DropMenu
            items={spaceMenuItems(spaces.find(s => s.id === openMenu.slice(6))!)}
            anchorRef={getRef(openMenu)}
            onClose={() => setOpenMenu(null)}
          />
        )}
        {openMenu && openMenu.startsWith('proj-') && (
          <DropMenu
            items={projectMenuItems(projects.find(p => p.id === openMenu.slice(5))!)}
            anchorRef={getRef(openMenu)}
            onClose={() => setOpenMenu(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-surface-700/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600/20 border border-brand-600/30 flex items-center justify-center flex-shrink-0">
              <KanbanSquare size={13} className="text-brand-400" />
            </div>
            <span className="text-sm font-bold text-white flex-1">Task Board</span>
            <button
              onClick={() => setCreatingSpace(true)}
              title="New Space"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-surface-500 hover:text-white hover:bg-surface-700 transition-colors">
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Spaces + projects list */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-1.5">

          {/* New space inline form */}
          <AnimatePresence>
            {creatingSpace && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden px-2 pb-1.5">
                <InlineCreate
                  placeholder="Space name…"
                  defaultColor="#6366f1"
                  defaultIcon="🚀"
                  iconSet={SPACE_ICONS}
                  onConfirm={(name, color, icon) => { dispatch(createSpaceAsync({ name, color, icon })); setCreatingSpace(false) }}
                  onCancel={() => setCreatingSpace(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Space rows */}
          {spaces.map(space => {
            const spaceProjects = projects.filter(p => p.spaceId === space.id && p.status === 'active')
            const isExpanded    = expandedSpaces.has(space.id)
            const menuKey       = `space-${space.id}`

            return (
              <div key={space.id}>
                {/* Space header row */}
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-xl mx-1 cursor-pointer transition-colors hover:bg-surface-800/50',
                  activeSpaceId === space.id && 'bg-surface-800/40',
                )}>
                  {/* Chevron */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleExpand(space.id) }}
                    className="w-4 h-4 flex items-center justify-center text-surface-600 hover:text-white transition-colors flex-shrink-0">
                    {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </button>

                  {/* Icon + name */}
                  <div
                    className="flex items-center gap-1.5 flex-1 min-w-0"
                    onClick={() => { dispatch(setActiveSpace(space.id)); toggleExpand(space.id) }}>
                    <span className="text-sm flex-shrink-0" style={{ color: space.color }}>{space.icon}</span>
                    <span className="text-xs font-semibold text-slate-200 truncate">{space.name}</span>
                  </div>

                  {/* Action buttons — always visible */}
                  <button
                    onClick={e => { e.stopPropagation(); setCreatingProject(space.id); setExpandedSpaces(prev => new Set([...prev, space.id])) }}
                    title="Add project"
                    className="w-5 h-5 rounded flex items-center justify-center text-surface-500 hover:text-brand-400 hover:bg-brand-600/10 transition-colors flex-shrink-0">
                    <Plus size={11} />
                  </button>
                  <button
                    ref={el => { getRef(menuKey).current = el }}
                    onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === menuKey ? null : menuKey) }}
                    title="Space options"
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center transition-colors flex-shrink-0',
                      openMenu === menuKey ? 'text-white bg-surface-700' : 'text-surface-500 hover:text-white hover:bg-surface-700',
                    )}>
                    <MoreHorizontal size={11} />
                  </button>
                </div>

                {/* Projects under this space */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-5 border-l border-surface-700/40 pl-1 pb-0.5">
                        {spaceProjects.map(project => {
                          const taskCount  = tasks.filter(t => t.projectId === project.id).length
                          const isActive   = activeProjectId === project.id
                          const projKey    = `proj-${project.id}`

                          return (
                            <div key={project.id}
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded-lg mx-1 cursor-pointer transition-all',
                                isActive ? 'bg-brand-600/15 text-white' : 'text-surface-400 hover:bg-surface-800/50 hover:text-slate-300',
                              )}>
                              {/* Color dot */}
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />

                              {/* Icon + name */}
                              <div className="flex items-center gap-1 flex-1 min-w-0"
                                onClick={() => { dispatch(setActiveSpace(space.id)); dispatch(setActiveProject(project.id)) }}>
                                <span className="text-xs flex-shrink-0">{project.icon}</span>
                                <span className={cn('text-xs truncate', isActive ? 'font-semibold text-white' : 'font-medium')}>
                                  {project.name}
                                </span>
                              </div>

                              {/* Task count */}
                              {taskCount > 0 && (
                                <span className={cn('text-[10px] rounded-full px-1.5 flex-shrink-0 font-medium',
                                  isActive ? 'text-brand-400 bg-brand-500/15' : 'text-surface-600 bg-surface-800')}>
                                  {taskCount}
                                </span>
                              )}

                              {/* Project menu */}
                              <button
                                ref={el => { getRef(projKey).current = el }}
                                onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === projKey ? null : projKey) }}
                                title="Project options"
                                className={cn(
                                  'w-4 h-4 rounded flex items-center justify-center transition-colors flex-shrink-0',
                                  openMenu === projKey ? 'text-white bg-surface-700' : 'text-surface-600 hover:text-white hover:bg-surface-700',
                                )}>
                                <MoreHorizontal size={10} />
                              </button>
                            </div>
                          )
                        })}

                        {/* Inline create project */}
                        <AnimatePresence>
                          {creatingProject === space.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mx-1 mt-1">
                              <InlineCreate
                                placeholder="Project name…"
                                defaultColor={space.color}
                                defaultIcon="📋"
                                iconSet={PROJECT_ICONS}
                                onConfirm={(name, color, icon) => { dispatch(createProjectAsync({ spaceId: space.id, name, color, icon })); setCreatingProject(null) }}
                                onCancel={() => setCreatingProject(null)}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Add project link */}
                        {creatingProject !== space.id && (
                          <button
                            onClick={() => setCreatingProject(space.id)}
                            className="flex items-center gap-1.5 px-2 py-1 mx-1 text-[10px] text-surface-600 hover:text-brand-400 hover:bg-surface-800/30 transition-colors w-full text-left rounded-lg">
                            <Plus size={9} />Add project
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {/* Empty state */}
          {spaces.length === 0 && !creatingSpace && (
            <div className="px-4 py-8 text-center">
              <Layers size={24} className="text-surface-700 mx-auto mb-2" />
              <p className="text-xs text-surface-500 mb-3">No spaces yet</p>
              <button
                onClick={() => setCreatingSpace(true)}
                className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors">
                + Create your first space
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-surface-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCreatingSpace(true)}
              className="flex items-center gap-1.5 text-[10px] text-surface-500 hover:text-brand-400 transition-colors">
              <Plus size={10} /> New Space
            </button>
            <span className="flex items-center gap-1 text-[10px] text-surface-700">
              <Layers size={9} /> {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
