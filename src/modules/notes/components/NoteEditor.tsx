import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, Minus, Link as LinkIcon,
  Highlighter, Star, Pin, Trash2
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { updateNote, deleteNote, toggleFavorite, togglePin, setSaving } from '../store/notesSlice'
import { cn } from '@utils/index'
import { NOTE_ICONS } from '../dto/types/notes.types'
import { format } from 'date-fns'

const AUTOSAVE_DELAY = 1000

function ToolbarButton({ onClick, isActive, children, title }: {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
        isActive
          ? 'bg-brand-600/20 text-brand-400'
          : 'text-surface-400 hover:text-white hover:bg-surface-700'
      )}
    >
      {children}
    </button>
  )
}

export function NoteEditor({ noteId }: { noteId: string }) {
  const dispatch = useAppDispatch()
  const note = useAppSelector(s => s.notes.notes.find(n => n.id === noteId))
  const { isSaving } = useAppSelector(s => s.notes)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [editTitle, setEditTitle] = useState(note?.title ?? 'Untitled')

  const debouncedSave = useCallback((content: object, text: string, wordCount: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    dispatch(setSaving(true))
    saveTimer.current = setTimeout(() => {
      dispatch(updateNote({ id: noteId, changes: { content, contentText: text, wordCount } }))
      dispatch(setSaving(false))
    }, AUTOSAVE_DELAY)
  }, [noteId, dispatch])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: 'Start writing... Use / for commands' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Highlight.configure({ multicolor: false }),
      Typography,
      CharacterCount,
    ],
    content: note?.content ?? undefined,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const text = editor.getText()
      const wordCount = text.split(/\s+/).filter(Boolean).length
      debouncedSave(json, text.slice(0, 200), wordCount)
    },
    editorProps: {
      attributes: { class: 'tiptap outline-none' },
    },
  }, [noteId])

  // Update editor content when note changes (switching notes)
  useEffect(() => {
    if (editor && note?.content) {
      const current = editor.getJSON()
      if (JSON.stringify(current) !== JSON.stringify(note.content)) {
        editor.commands.setContent(note.content)
      }
    }
    setEditTitle(note?.title ?? 'Untitled')
  }, [noteId]) // eslint-disable-line

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const handleTitleBlur = () => {
    dispatch(updateNote({ id: noteId, changes: { title: editTitle || 'Untitled' } }))
  }

  if (!note || !editor) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-700/50 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
            <Bold size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
            <Italic size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code">
            <Code size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
            <Highlighter size={13} />
          </ToolbarButton>
        </div>

        <div className="w-px h-5 bg-surface-700 mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="H1">
            <Heading1 size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="H2">
            <Heading2 size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="H3">
            <Heading3 size={13} />
          </ToolbarButton>
        </div>

        <div className="w-px h-5 bg-surface-700 mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
            <List size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered list">
            <ListOrdered size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task list">
            <CheckSquare size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote">
            <Quote size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
            <Minus size={13} />
          </ToolbarButton>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isSaving && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-surface-500 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" /> Saving...
            </motion.span>
          )}
          <span className="text-[10px] text-surface-600">
            {editor.storage.characterCount?.words() ?? 0} words
          </span>
          <button onClick={() => dispatch(togglePin(noteId))}
            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              note.isPinned ? 'text-brand-400 bg-brand-600/20' : 'text-surface-500 hover:text-white hover:bg-surface-700')}>
            <Pin size={13} />
          </button>
          <button onClick={() => dispatch(toggleFavorite(noteId))}
            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              note.isFavorite ? 'text-amber-400' : 'text-surface-500 hover:text-white hover:bg-surface-700')}>
            <Star size={13} className={note.isFavorite ? 'fill-current' : ''} />
          </button>
          <button onClick={() => dispatch(deleteNote(noteId))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:text-red-400 hover:bg-red-600/10 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Note title */}
      <div className="px-8 pt-8 pb-2 flex-shrink-0">
        {/* Icon picker */}
        <div className="relative mb-3">
          <button onClick={() => setShowIconPicker(v => !v)}
            className="text-4xl hover:scale-110 transition-transform leading-none">{note.icon}</button>
          <AnimatePresence>
            {showIconPicker && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-12 left-0 bg-surface-800 border border-surface-700 rounded-xl p-2 flex flex-wrap gap-1 z-10 shadow-2xl w-52">
                {NOTE_ICONS.map(icon => (
                  <button key={icon} onClick={() => { dispatch(updateNote({ id: noteId, changes: { icon } })); setShowIconPicker(false) }}
                    className="w-8 h-8 rounded-lg hover:bg-surface-700 flex items-center justify-center text-lg transition-all">
                    {icon}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Untitled"
          className="w-full bg-transparent text-3xl font-black outline-none placeholder:text-surface-600"
          style={{ color: 'rgb(var(--color-text-primary))' }}
        />
        <p className="text-xs text-surface-500 mt-1">
          {format(new Date(note.updatedAt), 'MMMM d, yyyy · HH:mm')}
          {note.tags.length > 0 && (
            <span className="ml-2">{note.tags.map(t => `#${t}`).join(' ')}</span>
          )}
        </p>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4">
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  )
}
