import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
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
  Highlighter, Star, Pin, Trash2, FileCode, FileText,
  Copy, Download, WrapText, Check, Tag, X, ChevronDown,
  Palette, AlignLeft,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { updateNote, archiveNote, toggleFavorite, togglePin, setSaving } from '../store/notesSlice'
import { cn } from '@utils/index'
import { NOTE_ICONS, FOLDER_COLORS, CODE_LANGUAGES, detectLanguage } from '../dto/types/notes.types'
import toast from 'react-hot-toast'

const AUTOSAVE_DELAY = 1200

// ── Toolbar button ────────────────────────────────────────────
function ToolbarBtn({ onClick, isActive, children, title, disabled }: {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'w-6 h-6 rounded-md flex items-center justify-center transition-all text-[11px]',
        isActive
          ? 'bg-brand-600/25 text-brand-400'
          : 'text-surface-400 hover:text-white hover:bg-surface-700',
        disabled && 'opacity-30 pointer-events-none',
      )}
    >
      {children}
    </button>
  )
}

// ── Link input bubble ─────────────────────────────────────────
function LinkInput({ onConfirm, onCancel }: { onConfirm: (url: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="flex items-center gap-1 bg-surface-800 border border-surface-600 rounded-lg px-2 py-1">
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onConfirm(val); if (e.key === 'Escape') onCancel() }}
        placeholder="https://..." className="bg-transparent text-xs outline-none w-40 text-slate-200" />
      <button onClick={() => onConfirm(val)} className="text-brand-400 hover:text-brand-300 text-xs">✓</button>
      <button onClick={onCancel} className="text-surface-500 hover:text-white text-xs">✗</button>
    </div>
  )
}

// ── Code mode editor ──────────────────────────────────────────
function CodeEditor({ noteId, rawContent, onChange }: { noteId: string; rawContent: string; onChange: (v: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef  = useRef<HTMLDivElement>(null)
  const [lang, setLang] = useState(() => detectLanguage(rawContent))
  const [copied, setCopied] = useState(false)
  const [showLines, setShowLines] = useState(true)

  // Auto-detect language when content changes substantially
  useEffect(() => {
    if (rawContent.length % 50 === 0) setLang(detectLanguage(rawContent))
  }, [rawContent])

  const lineCount = useMemo(() => (rawContent.match(/\n/g)?.length ?? 0) + 1, [rawContent])

  const syncScroll = () => {
    if (lineNumRef.current && textareaRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current!
      const start = ta.selectionStart
      const end   = ta.selectionEnd
      const newVal = rawContent.slice(0, start) + '  ' + rawContent.slice(end)
      onChange(newVal)
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2 })
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  const handleFormat = () => {
    if (lang !== 'json') return
    try {
      const pretty = JSON.stringify(JSON.parse(rawContent), null, 2)
      onChange(pretty)
      toast.success('JSON formatted')
    } catch {
      toast.error('Invalid JSON — cannot format')
    }
  }

  const handleDownload = () => {
    const ext = lang === 'json' ? 'json' : lang === 'html' ? 'html' : lang === 'xml' ? 'xml' :
      lang === 'css' ? 'css' : lang === 'python' ? 'py' : lang === 'sql' ? 'sql' :
      lang === 'yaml' ? 'yaml' : lang === 'markdown' ? 'md' :
      lang === 'javascript' || lang === 'typescript' ? 'js' : 'txt'
    const blob = new Blob([rawContent], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `note-${noteId.slice(0, 8)}.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const currentLangLabel = CODE_LANGUAGES.find(l => l.id === lang)?.label ?? 'Auto Detect'

  return (
    <div className="flex flex-col h-full bg-surface-950">
      {/* Code toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-900/80 border-b border-surface-700/50 flex-shrink-0">
        {/* Language selector */}
        <div className="relative">
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="appearance-none bg-surface-800 border border-surface-700 rounded-md pl-2 pr-5 py-0.5 text-[10px] text-brand-400 font-mono font-semibold outline-none focus:border-brand-500 cursor-pointer"
          >
            {CODE_LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
          <ChevronDown size={9} className="absolute right-1 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
        </div>

        <span className="text-[10px] text-surface-600 font-mono">
          {lineCount} line{lineCount !== 1 ? 's' : ''}
          {' · '}
          {rawContent.length.toLocaleString()} chars
        </span>

        <div className="ml-auto flex items-center gap-1">
          {lang === 'json' && (
            <button onClick={handleFormat} title="Format JSON (pretty print)"
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-surface-700 hover:border-brand-600/50 text-surface-400 hover:text-brand-400 transition-colors">
              <WrapText size={10} /> Format
            </button>
          )}
          <button onClick={() => setShowLines(v => !v)} title="Toggle line numbers"
            className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-surface-700 transition-colors',
              showLines ? 'text-brand-400 border-brand-600/40' : 'text-surface-500 hover:text-white')}>
            <AlignLeft size={10} />
          </button>
          <button onClick={handleDownload} title="Download file"
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-surface-700 text-surface-400 hover:text-white transition-colors">
            <Download size={10} /> Save
          </button>
          <button onClick={handleCopy} title="Copy all content"
            className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors',
              copied ? 'border-green-600/40 text-green-400' : 'border-surface-700 text-surface-400 hover:text-white')}>
            {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy All</>}
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line numbers */}
        {showLines && (
          <div
            ref={lineNumRef}
            className="flex-shrink-0 overflow-hidden select-none bg-surface-950 border-r border-surface-800/60 text-right"
            style={{ width: 44, paddingTop: 16, paddingBottom: 16 }}
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="text-[11px] font-mono text-surface-700 leading-5 pr-2">{i + 1}</div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={rawContent}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          className="flex-1 bg-transparent font-mono text-[13px] text-slate-200 resize-none outline-none leading-5 overflow-auto"
          style={{ padding: '16px 16px 16px 12px', tabSize: 2 }}
          placeholder="Paste or type your content here — formatting is preserved exactly as entered…"
        />
      </div>
    </div>
  )
}

// ── Rich mode toolbar ─────────────────────────────────────────
function RichToolbar({ editor, onDelete }: { editor: ReturnType<typeof useEditor>; onDelete: () => void }) {
  const [showLink, setShowLink] = useState(false)

  if (!editor) return null

  const setLink = (url: string) => {
    setShowLink(false)
    if (!url) { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url.startsWith('http') ? url : `https://${url}` }).run()
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-1.5 border-b border-surface-700/50 bg-surface-900/50 flex-shrink-0">
      {/* Text styling */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline code">
        <Code size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
        <Highlighter size={12} />
      </ToolbarBtn>

      {showLink ? (
        <LinkInput onConfirm={setLink} onCancel={() => setShowLink(false)} />
      ) : (
        <ToolbarBtn onClick={() => setShowLink(true)} isActive={editor.isActive('link')} title="Insert / edit link">
          <LinkIcon size={12} />
        </ToolbarBtn>
      )}

      <div className="w-px h-4 bg-surface-700 mx-0.5" />

      {/* Headings */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 size={12} />
      </ToolbarBtn>

      <div className="w-px h-4 bg-surface-700 mx-0.5" />

      {/* Lists */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
        <List size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered list">
        <ListOrdered size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task / checkbox list">
        <CheckSquare size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
        <Quote size={12} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal divider">
        <Minus size={12} />
      </ToolbarBtn>

      {/* Right side — delete */}
      <div className="ml-auto flex items-center">
        <ToolbarBtn onClick={onDelete} title="Move to Trash">
          <Trash2 size={12} />
        </ToolbarBtn>
      </div>
    </div>
  )
}

// ── Tags editor ───────────────────────────────────────────────
function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 24)
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setInput('')
  }

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map(tag => (
        <span key={tag}
          className="inline-flex items-center gap-1 text-[10px] font-medium bg-brand-600/15 border border-brand-600/25 text-brand-300 px-2 py-0.5 rounded-full">
          #{tag}
          <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
            <X size={9} />
          </button>
        </span>
      ))}
      {editing ? (
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
            if (e.key === 'Escape') { setEditing(false); setInput('') }
          }}
          onBlur={() => { if (input) addTag(input); setEditing(false) }}
          placeholder="tag name…"
          className="text-[10px] bg-transparent border-b border-brand-600/50 outline-none text-brand-300 placeholder:text-surface-600 w-20"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-0.5 text-[10px] text-surface-600 hover:text-brand-400 transition-colors">
          <Tag size={10} /> Add tag
        </button>
      )}
    </div>
  )
}

// ── Cover color picker ────────────────────────────────────────
function CoverColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[10px] text-surface-500 hover:text-white transition-colors"
        title="Set cover color"
      >
        <Palette size={11} />
        {value ? <span className="w-3 h-3 rounded-full" style={{ backgroundColor: value }} /> : 'Cover'}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-6 left-0 bg-surface-800 border border-surface-700 rounded-xl p-2 flex flex-wrap gap-1.5 z-50 shadow-2xl"
              style={{ width: 128 }}
            >
              <button
                onClick={() => { onChange(''); setOpen(false) }}
                className="w-5 h-5 rounded-full border-2 border-dashed border-surface-600 hover:border-surface-400 transition-colors flex items-center justify-center"
                title="No cover color"
              >
                <X size={8} className="text-surface-500" />
              </button>
              {FOLDER_COLORS.map(c => (
                <button key={c}
                  onClick={() => { onChange(c); setOpen(false) }}
                  className={cn('w-5 h-5 rounded-full transition-transform hover:scale-110', value === c && 'ring-2 ring-white ring-offset-1 ring-offset-surface-800')}
                  style={{ backgroundColor: c }} />
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main editor ───────────────────────────────────────────────
export function NoteEditor({ noteId }: { noteId: string }) {
  const dispatch = useAppDispatch()
  const note     = useAppSelector(s => s.notes.notes.find(n => n.id === noteId))
  const folders  = useAppSelector(s => s.notes.folders)
  const { isSaving } = useAppSelector(s => s.notes)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showIconPicker, setShowIconPicker] = useState(false)
  const [editTitle, setEditTitle]           = useState(note?.title ?? 'Untitled')
  const [rawContent, setRawContent]         = useState(note?.rawContent ?? '')

  const noteType = note?.noteType ?? 'rich'

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
      Placeholder.configure({ placeholder: 'Start writing…  Use / for commands' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Highlight.configure({ multicolor: false }),
      Typography,
      CharacterCount,
    ],
    content: noteType === 'rich' ? (note?.content ?? undefined) : undefined,
    onUpdate: ({ editor }) => {
      if (noteType !== 'rich') return
      const json = editor.getJSON()
      const text = editor.getText()
      debouncedSave(json, text.slice(0, 500), text.split(/\s+/).filter(Boolean).length)
    },
    editorProps: {
      attributes: { class: 'tiptap outline-none' },
    },
  }, [noteId])

  // Sync local state when switching notes
  useEffect(() => {
    if (editor && note?.content && noteType === 'rich') {
      const current = editor.getJSON()
      if (JSON.stringify(current) !== JSON.stringify(note.content)) {
        editor.commands.setContent(note.content)
      }
    }
    setEditTitle(note?.title ?? 'Untitled')
    setRawContent(note?.rawContent ?? '')
  }, [noteId]) // eslint-disable-line

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const handleTitleBlur = () => {
    dispatch(updateNote({ id: noteId, changes: { title: editTitle || 'Untitled' } }))
  }

  const handleTitleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus() }
  }

  const handleModeToggle = (mode: 'rich' | 'code') => {
    if (mode === noteType) return
    dispatch(updateNote({ id: noteId, changes: { noteType: mode } }))
  }

  const handleRawChange = (val: string) => {
    setRawContent(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    dispatch(setSaving(true))
    saveTimer.current = setTimeout(() => {
      dispatch(updateNote({
        id: noteId,
        changes: { rawContent: val, contentText: val.slice(0, 500), wordCount: val.split(/\s+/).filter(Boolean).length },
      }))
      dispatch(setSaving(false))
    }, AUTOSAVE_DELAY)
  }

  const handleTagsChange = (tags: string[]) => {
    dispatch(updateNote({ id: noteId, changes: { tags } }))
  }

  const handleCoverChange = (coverColor: string) => {
    dispatch(updateNote({ id: noteId, changes: { coverColor } }))
  }

  const handleDelete = () => {
    dispatch(archiveNote(noteId))
    toast.success('Note moved to Trash')
  }

  const handleExportRich = () => {
    const text = editor?.getText() ?? ''
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${editTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const readingTime = useMemo(() => {
    const wc = note?.wordCount ?? 0
    if (wc < 200) return `< 1 min read`
    return `${Math.ceil(wc / 200)} min read`
  }, [note?.wordCount])

  const folder = folders.find(f => f.id === note?.folderId)

  if (!note) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Cover color strip */}
      {note.coverColor && (
        <div className="flex-shrink-0 h-1.5" style={{ backgroundColor: note.coverColor }} />
      )}

      {/* ── Note type toggle bar ───────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-900/60 border-b border-surface-700/50 flex-shrink-0">
        <div className="flex items-center bg-surface-800 border border-surface-700 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => handleModeToggle('rich')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all',
              noteType === 'rich'
                ? 'bg-brand-600/25 text-brand-400 border border-brand-600/30'
                : 'text-surface-500 hover:text-white',
            )}
            title="Rich text editor — formatted content with headings, lists, etc."
          >
            <FileText size={10} /> Rich
          </button>
          <button
            onClick={() => handleModeToggle('code')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all',
              noteType === 'code'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-600/25'
                : 'text-surface-500 hover:text-white',
            )}
            title="Raw / Code mode — content is stored exactly as pasted. JSON, XML, emails, code — no transformation."
          >
            <FileCode size={10} /> Raw
          </button>
        </div>

        {noteType === 'code' && (
          <span className="text-[10px] text-surface-500 italic">
            Paste JSON, XML, code, emails — format is preserved exactly
          </span>
        )}

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-1">
          {isSaving ? (
            <span className="text-[10px] text-surface-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" /> Saving…
            </span>
          ) : (
            <span className="text-[10px] text-surface-700">Saved</span>
          )}

          <button onClick={() => dispatch(togglePin(noteId))}
            className={cn('w-6 h-6 rounded-md flex items-center justify-center transition-all',
              note.isPinned ? 'text-brand-400 bg-brand-600/20' : 'text-surface-600 hover:text-white hover:bg-surface-700')}>
            <Pin size={11} />
          </button>
          <button onClick={() => dispatch(toggleFavorite(noteId))}
            className={cn('w-6 h-6 rounded-md flex items-center justify-center transition-all',
              note.isFavorite ? 'text-amber-400' : 'text-surface-600 hover:text-white hover:bg-surface-700')}>
            <Star size={11} className={note.isFavorite ? 'fill-current' : ''} />
          </button>
          {noteType === 'rich' && (
            <button onClick={handleExportRich} title="Download as .txt"
              className="w-6 h-6 rounded-md flex items-center justify-center text-surface-600 hover:text-white hover:bg-surface-700 transition-all">
              <Download size={11} />
            </button>
          )}
          <button onClick={handleDelete} title="Move to Trash"
            className="w-6 h-6 rounded-md flex items-center justify-center text-surface-600 hover:text-red-400 hover:bg-red-600/10 transition-all">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* ── Rich mode: toolbar ────────────────────────────── */}
      {noteType === 'rich' && <RichToolbar editor={editor} onDelete={handleDelete} />}

      {/* ── Note header (title, icon, metadata) ──────────── */}
      <div className="px-6 pt-4 pb-2 flex-shrink-0">
        {/* Icon + folder badge row */}
        <div className="relative mb-1.5 flex items-center gap-2">
          <button
            onClick={() => setShowIconPicker(v => !v)}
            className="text-2xl hover:scale-110 transition-transform leading-none select-none"
            title="Change icon"
          >
            {note.icon}
          </button>
          <AnimatePresence>
            {showIconPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-12 left-0 bg-surface-800 border border-surface-700 rounded-xl p-2 flex flex-wrap gap-1 z-20 shadow-2xl"
                style={{ width: 220 }}
              >
                {NOTE_ICONS.map(icon => (
                  <button key={icon}
                    onClick={() => { dispatch(updateNote({ id: noteId, changes: { icon } })); setShowIconPicker(false) }}
                    className="w-8 h-8 rounded-lg hover:bg-surface-700 flex items-center justify-center text-lg transition-all">
                    {icon}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Folder badge */}
          {folder && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
              style={{ color: folder.color, borderColor: `${folder.color}40`, backgroundColor: `${folder.color}15` }}>
              {folder.icon} {folder.name}
            </span>
          )}
        </div>

        {/* Title */}
        <input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKey}
          placeholder="Untitled"
          className="w-full bg-transparent text-xl font-black outline-none placeholder:text-surface-600 text-white leading-tight mb-1.5"
        />

        {/* Metadata + cover + tags row */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-[10px] text-surface-600">
            {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            {new Date(note.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {note.wordCount > 0 && (
            <>
              <span className="text-[10px] text-surface-700">·</span>
              <span className="text-[10px] text-surface-600">{note.wordCount.toLocaleString()} w · {readingTime}</span>
            </>
          )}
          <CoverColorPicker value={note.coverColor} onChange={handleCoverChange} />
        </div>

        {/* Tags */}
        <TagsEditor tags={note.tags} onChange={handleTagsChange} />
      </div>

      <div className="h-px bg-surface-700/40 mx-6 flex-shrink-0 mb-0.5" />

      {/* ── Editor content ────────────────────────────────── */}
      {noteType === 'rich' ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-2">
          <EditorContent editor={editor} className="min-h-full prose-sm" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            noteId={noteId}
            rawContent={rawContent}
            onChange={handleRawChange}
          />
        </div>
      )}
    </div>
  )
}
