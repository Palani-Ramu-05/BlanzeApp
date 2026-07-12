import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@utils/index'
import { Button, Card, Badge, Skeleton } from '@components/index'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { ProcessingSteps } from '../components/ProgressSteps'
import { useImageStudio } from '../hooks/useImageStudio'
import type { ImageTool, ImageMetadata } from '../hooks/useImageStudio'
import {
  Image, Upload, Copy, Check, Download, RefreshCw, Trash2, StopCircle, Sparkles,
  ScanLine, Subtitles, Eye, FileText, AlignLeft, X, AlertCircle,
  FileImage, Palette, Grid, Tag, Fingerprint, BarChart3, Layout, Lightbulb, Camera, Layers,
  FileSpreadsheet, PieChart, QrCode, Languages, Mountain, Gauge, Accessibility,
  Search, PanelLeft, PanelRight,
  Maximize2, Minimize2, Table,
} from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import toast from 'react-hot-toast'

interface ToolConfig {
  id: ImageTool
  label: string
  icon: React.ReactNode
  description: string
  badge?: string
  group: 'vision' | 'analyze' | 'extract' | 'create' | 'advanced'
}

const TOOLS: ToolConfig[] = [
  { id: 'ocr', label: 'OCR', icon: <ScanLine size={15} />, description: 'Extract text from images, screenshots, and scanned documents', badge: 'Text', group: 'extract' },
  { id: 'caption', label: 'Caption', icon: <Subtitles size={15} />, description: 'Generate AI captions in multiple styles', badge: 'Creative', group: 'create' },
  { id: 'image-explanation', label: 'Explanation', icon: <Eye size={15} />, description: 'Detailed image analysis with scene understanding', badge: 'Vision', group: 'vision' },
  { id: 'image-to-text', label: 'Image to Text', icon: <FileText size={15} />, description: 'Convert image content into structured text formats', badge: 'Convert', group: 'extract' },
  { id: 'image-summary', label: 'Summary', icon: <AlignLeft size={15} />, description: 'Concise AI summary of any image content', badge: 'Quick', group: 'vision' },
  { id: 'object-detection', label: 'Objects', icon: <Grid size={15} />, description: 'Detect and list every object visible in the image', badge: 'Detect', group: 'analyze' },
  { id: 'image-tagging', label: 'Tags', icon: <Tag size={15} />, description: 'Generate keywords, tags, categories, and smart labels', badge: 'Tags', group: 'analyze' },
  { id: 'color-analysis', label: 'Colors', icon: <Palette size={15} />, description: 'Analyze dominant colors, palette, and contrast', badge: 'Color', group: 'analyze' },
  { id: 'image-metadata', label: 'Metadata', icon: <FileImage size={15} />, description: 'Extract image characteristics and quality metrics', badge: 'Info', group: 'analyze' },
  { id: 'face-analysis', label: 'Faces', icon: <Fingerprint size={15} />, description: 'Detect faces and analyze expressions (non-identifying)', badge: 'Face', group: 'advanced' },
  { id: 'document-analysis', label: 'Document', icon: <FileSpreadsheet size={15} />, description: 'Detect document type and extract key information', badge: 'Doc', group: 'advanced' },
  { id: 'table-detection', label: 'Tables', icon: <Table size={15} />, description: 'Detect and extract tables from images', badge: 'Table', group: 'extract' },
  { id: 'chart-analysis', label: 'Charts', icon: <PieChart size={15} />, description: 'Analyze charts, graphs, and data visualizations', badge: 'Chart', group: 'analyze' },
  { id: 'qr-barcode', label: 'QR/Barcode', icon: <QrCode size={15} />, description: 'Detect and decode QR codes and barcodes', badge: 'Decode', group: 'advanced' },
  { id: 'image-translation', label: 'Translate', icon: <Languages size={15} />, description: 'Translate text inside images to any language', badge: 'Translate', group: 'advanced' },
  { id: 'background-analysis', label: 'Background', icon: <Mountain size={15} />, description: 'Analyze foreground, background, scene, and lighting', badge: 'Scene', group: 'vision' },
  { id: 'image-quality', label: 'Quality', icon: <Gauge size={15} />, description: 'Assess sharpness, noise, brightness, and quality score', badge: 'Score', group: 'analyze' },
  { id: 'accessibility', label: 'Accessibility', icon: <Accessibility size={15} />, description: 'Generate ALT text and accessibility descriptions', badge: 'A11y', group: 'create' },
  { id: 'smart-search', label: 'Smart Search', icon: <Search size={15} />, description: 'Generate searchable metadata and suggested queries', badge: 'Search', group: 'advanced' },
]

const TOOL_GROUPS = [
  { key: 'vision', label: 'Vision & Understanding' },
  { key: 'analyze', label: 'Analysis & Detection' },
  { key: 'extract', label: 'Extraction & Conversion' },
  { key: 'create', label: 'Creation & Description' },
  { key: 'advanced', label: 'Advanced' },
]

const CAPTION_STYLES = [
  { value: 'detailed', label: 'Detailed' },
  { value: 'short', label: 'Short' },
  { value: 'seo', label: 'SEO' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'professional', label: 'Professional' },
  { value: 'funny', label: 'Funny' },
  { value: 'creative', label: 'Creative' },
  { value: 'product', label: 'Product' },
  { value: 'accessibility', label: 'Accessibility' },
]

const EXPLANATION_DEPTHS = [
  { value: 'detailed', label: 'Detailed' },
  { value: 'simple', label: 'Simple' },
  { value: 'technical', label: 'Technical' },
  { value: 'business', label: 'Business' },
  { value: 'educational', label: 'Educational' },
]

const TEXT_FORMATS = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'plain', label: 'Plain Text' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'notes', label: 'Formatted Notes' },
  { value: 'report', label: 'Structured Report' },
]

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
]

const PROCESSING_STEPS = [
  { id: 'uploading', label: 'Uploading Image...' },
  { id: 'analyzing', label: 'Analyzing...' },
  { id: 'ocr', label: 'Running OCR...' },
  { id: 'detecting', label: 'Detecting Objects...' },
  { id: 'understanding', label: 'Understanding Image...' },
  { id: 'generating', label: 'Generating AI Response...' },
  { id: 'finalizing', label: 'Finalizing...' },
  { id: 'done', label: 'Completed Successfully.' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDimension(w: number, h: number): string {
  return `${w} × ${h} px`
}

function getToolConfig(id: string): ToolConfig | undefined {
  return TOOLS.find(t => t.id === id)
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  'ocr': <ScanLine size={15} />,
  'caption': <Subtitles size={15} />,
  'image-explanation': <Eye size={15} />,
  'image-to-text': <FileText size={15} />,
  'image-summary': <AlignLeft size={15} />,
  'object-detection': <Grid size={15} />,
  'image-tagging': <Tag size={15} />,
  'color-analysis': <Palette size={15} />,
  'image-metadata': <FileImage size={15} />,
  'face-analysis': <Fingerprint size={15} />,
  'document-analysis': <FileSpreadsheet size={15} />,
  'table-detection': <Table size={15} />,
  'chart-analysis': <PieChart size={15} />,
  'qr-barcode': <QrCode size={15} />,
  'image-translation': <Languages size={15} />,
  'background-analysis': <Mountain size={15} />,
  'image-quality': <Gauge size={15} />,
  'accessibility': <Accessibility size={15} />,
  'smart-search': <Search size={15} />,
}

export const ImageStudio = () => {
  const navigate = useNavigate()
  const [activeTool, setActiveTool] = useState<ImageTool>('ocr')
  const [leftPanel, setLeftPanel] = useState(true)
  const [rightPanel, setRightPanel] = useState(true)

  const config = getToolConfig(activeTool)

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--color-bg-primary))]">
      <AppHeader
        icon={<Image size={16} />}
        title="Image Studio"
        gradient="linear-gradient(135deg, #ec4899, #f472b6)"
        breadcrumbs={[
          { label: 'AI Workspace', href: '/ai' },
          { label: 'Image Studio' },
          ...(config ? [{ label: config.label }] : []),
        ]}
        subtitle="OCR, caption, and analyze images"
      >
        <button
          onClick={() => setLeftPanel(p => !p)}
          className={cn('p-1.5 rounded-lg transition-all', leftPanel ? 'text-surface-400 bg-surface-800/40' : 'text-surface-600 hover:text-surface-400')}
          aria-label="Toggle left panel"
        >
          <PanelLeft size={15} />
          </button>
          <button
            onClick={() => setRightPanel(p => !p)}
            className={cn('p-1.5 rounded-lg transition-all', rightPanel ? 'text-surface-400 bg-surface-800/40' : 'text-surface-600 hover:text-surface-400')}
            aria-label="Toggle right panel"
          >
            <PanelRight size={15} />
          </button>
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="info" size="sm">AI Vision</Badge>
          <Badge variant="purple" size="sm">v3.0</Badge>
        </div>
      </AppHeader>

      <div className="flex-1 flex overflow-hidden">
        {leftPanel && (
          <aside className="w-56 flex-shrink-0 border-r border-surface-700/20 bg-surface-950/30 overflow-y-auto hidden lg:block">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-3 px-1">
                <Layout size={13} className="text-surface-500" />
                <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Tools</span>
              </div>
              <div className="space-y-3">
                {TOOL_GROUPS.map(group => (
                  <div key={group.key}>
                    <div className="text-[10px] font-medium text-surface-600 uppercase tracking-wider px-1 mb-1">{group.label}</div>
                    <div className="space-y-0.5">
                      {TOOLS.filter(t => t.group === group.key).map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left',
                            activeTool === tool.id
                              ? 'bg-brand-500/15 text-brand-400 font-medium'
                              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40',
                          )}
                        >
                          <span className={cn('flex-shrink-0', activeTool === tool.id ? 'text-brand-400' : 'text-surface-500')}>
                            {TOOL_ICONS[tool.id]}
                          </span>
                          <span className="truncate">{tool.label}</span>
                            {tool.badge && (
                            <Badge variant="info" size="sm" className="ml-auto">{tool.badge}</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-4xl mx-auto p-4 lg:p-6">
            <ImageStudioWorkspace key={activeTool} tool={activeTool} />
          </div>
        </main>

        {rightPanel && (
          <aside className="w-64 flex-shrink-0 border-l border-surface-700/20 bg-surface-950/30 overflow-y-auto hidden xl:block">
            <RightPanelContent />
          </aside>
        )}
      </div>
    </div>
  )
}

const RightPanelContent = () => (
  <div className="p-3 space-y-4">
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Lightbulb size={13} className="text-surface-500" />
        <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Tips</span>
      </div>
      <div className="space-y-2">
        {[
          { icon: <Upload size={14} />, text: 'Drag & drop any image to start' },
          { icon: <ScanLine size={14} />, text: 'OCR extracts text from images' },
          { icon: <Palette size={14} />, text: 'Color Analysis detects palette' },
          { icon: <Search size={14} />, text: 'Smart Search finds key terms' },
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-surface-900/30 border border-surface-700/20">
            <div className="w-7 h-7 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400 flex-shrink-0 mt-0.5">
              {tip.icon}
            </div>
            <p className="text-[11px] text-surface-400 leading-relaxed">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>

    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <BarChart3 size={13} className="text-surface-500" />
        <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Supported</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {['PNG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF', 'SVG', 'HEIC'].map(f => (
          <Badge key={f} variant="default" size="sm">{f}</Badge>
        ))}
      </div>
      <p className="text-[10px] text-surface-600 mt-1.5 px-1">Max 20 MB per image</p>
    </div>
  </div>
)

const ImageStudioWorkspace = ({ tool }: { tool: ImageTool }) => {
  const {
    result, isLoading, isStreaming, error, uploadProgress, metadata,
    process, stop, clear, retry, processingStage,
  } = useImageStudio()

  const config = getToolConfig(tool)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; size: number; type: string } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [copied, setCopied] = useState(false)
  const [captionStyle, setCaptionStyle] = useState('detailed')
  const [explanationDepth, setExplanationDepth] = useState('detailed')
  const [textFormat, setTextFormat] = useState('markdown')
  const [targetLanguage, setTargetLanguage] = useState('English')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result && !isStreaming && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [result, isStreaming])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    const img = new window.Image()
    img.onload = () => {
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight, size: file.size, type: file.type })
    }
    img.src = URL.createObjectURL(file)
    clear()
  }, [clear])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleClipboardPaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const ext = type.split('/')[1] || 'png'
            const file = new File([blob], `clipboard-image.${ext}`, { type })
            handleFile(file)
            return
          }
        }
      }
      toast.error('No image found in clipboard')
    } catch {
      toast.error('Unable to read clipboard. Please paste using Ctrl+V or upload a file.')
    }
  }, [handleFile])

  const handleProcess = useCallback(async () => {
    if (!imageFile) return

    const opts: Record<string, string> = {}
    if (tool === 'caption') opts.captionStyle = captionStyle
    if (tool === 'image-explanation') opts.explanationDepth = explanationDepth
    if (tool === 'image-to-text') opts.textFormat = textFormat
    if (tool === 'image-translation') opts.targetLanguage = targetLanguage

    await process(imageFile, tool, opts as any)
  }, [imageFile, tool, process, captionStyle, explanationDepth, textFormat, targetLanguage])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const ext = tool === 'ocr' ? 'txt' : 'md'
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${tool}-result.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClearImage = useCallback(() => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setImageMeta(null)
    clear()
  }, [imagePreview, clear])

  const showOptions = imagePreview &&
    (tool === 'caption' || tool === 'image-explanation' || tool === 'image-to-text' || tool === 'image-translation')

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br from-pink-500 to-fuchsia-500">
          {config?.icon || <Image size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-[rgb(var(--color-text-primary))]">{config?.label || 'Image Studio'}</h2>
            {config?.badge && <Badge variant="info" size="sm">{config.badge}</Badge>}
          </div>
          <p className="text-xs text-surface-400 mt-0.5">{config?.description}</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/gif,image/tiff,image/svg+xml,image/heic,image/heif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />

      <Card padding="md">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
              <FileImage size={12} />
              Image
            </label>
            {imageFile && imageMeta && (
              <div className="flex items-center gap-3 text-[11px] text-surface-500">
                <span>{imageFile.name}</span>
                <span className="text-surface-600">|</span>
                <span>{formatBytes(imageMeta.size)}</span>
                <span className="text-surface-600">|</span>
                <span>{formatDimension(imageMeta.width, imageMeta.height)}</span>
              </div>
            )}
          </div>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-surface-700/30 bg-surface-950">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-72 w-full object-contain"
                onLoad={(e) => {
                  if (!imageMeta) {
                    const img = e.currentTarget
                    setImageMeta({
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                      size: imageFile?.size || 0,
                      type: imageFile?.type || 'unknown',
                    })
                  }
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-surface-950/90 to-transparent p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-surface-300">
                    {formatDimension(imageMeta?.width || 0, imageMeta?.height || 0)}
                  </span>
                  {imageMeta && (
                    <>
                      <span className="text-surface-600">·</span>
                      <span className="text-[11px] text-surface-400">{formatBytes(imageMeta.size)}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handleBrowse}
                    className="p-1.5 rounded-lg bg-surface-800/80 text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-all"
                    aria-label="Replace image"
                  >
                    <Upload size={12} />
                  </button>
                  <button
                    onClick={handleClearImage}
                    className="p-1.5 rounded-lg bg-surface-800/80 text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={handleBrowse}
              className={cn(
                'relative flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
                isDragOver
                  ? 'border-brand-500 bg-brand-500/5'
                  : 'border-surface-700/40 hover:border-surface-500/40 bg-surface-900/20 hover:bg-surface-900/40',
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                <Image size={22} className="text-pink-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-surface-300">
                  <span className="text-brand-400 font-medium">Click to browse</span> or drag and drop
                </p>
                <p className="text-[11px] text-surface-500 mt-0.5">
                  PNG, JPEG, WEBP, BMP, GIF, TIFF, SVG, HEIC & more
                </p>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleClipboardPaste() }}
                  className="flex items-center gap-1 text-[11px] text-surface-400 hover:text-surface-200 transition-colors"
                >
                  <Camera size={11} />
                  Paste from Clipboard
                </button>
              </div>
            </div>
          )}

          {showOptions && (
            <div className="flex flex-wrap items-start gap-4 pt-1">
              {tool === 'caption' && (
                <div>
                  <label className="text-[11px] font-medium text-surface-400 mb-1 block">Caption Style</label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {CAPTION_STYLES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setCaptionStyle(s.value)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[11px] font-medium transition-all border whitespace-nowrap',
                          captionStyle === s.value
                            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                            : 'bg-surface-900/60 border-surface-700/30 text-surface-400 hover:border-surface-600',
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tool === 'image-explanation' && (
                <div>
                  <label className="text-[11px] font-medium text-surface-400 mb-1 block">Explanation Depth</label>
                  <div className="flex flex-wrap gap-1">
                    {EXPLANATION_DEPTHS.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setExplanationDepth(d.value)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[11px] font-medium transition-all border',
                          explanationDepth === d.value
                            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                            : 'bg-surface-900/60 border-surface-700/30 text-surface-400 hover:border-surface-600',
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tool === 'image-to-text' && (
                <div>
                  <label className="text-[11px] font-medium text-surface-400 mb-1 block">Output Format</label>
                  <div className="flex flex-wrap gap-1">
                    {TEXT_FORMATS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setTextFormat(f.value)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[11px] font-medium transition-all border',
                          textFormat === f.value
                            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                            : 'bg-surface-900/60 border-surface-700/30 text-surface-400 hover:border-surface-600',
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tool === 'image-translation' && (
                <div>
                  <label className="text-[11px] font-medium text-surface-400 mb-1 block">Target Language</label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.value}
                        onClick={() => setTargetLanguage(l.value)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[11px] font-medium transition-all border',
                          targetLanguage === l.value
                            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                            : 'bg-surface-900/60 border-surface-700/30 text-surface-400 hover:border-surface-600',
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-0.5">
            <Button
              onClick={handleProcess}
              disabled={!imageFile || isLoading}
              loading={isLoading}
              icon={<Sparkles size={13} />}
              size="sm"
            >
              {isLoading ? 'Processing...' : `Run ${config?.label || 'Analysis'}`}
            </Button>
            {isStreaming && (
              <Button variant="ghost" size="sm" icon={<StopCircle size={13} />} onClick={stop}>
                Stop
              </Button>
            )}
            {(result || error) && (
              <>
                <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={() => retry(imageFile!, tool, tool === 'caption' ? { captionStyle } as any : tool === 'image-explanation' ? { explanationDepth } as any : tool === 'image-to-text' ? { textFormat } as any : undefined)}>
                  Retry
                </Button>
                <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={handleClearImage}>
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {processingStage && isLoading && (
        <Card padding="md" className="bg-surface-900/30">
          <ProcessingSteps steps={PROCESSING_STEPS} currentStep={processingStage} />
        </Card>
      )}

      {isLoading && !result && !processingStage && (
        <Card padding="md">
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      )}

      {(result || error) && (
        <div ref={resultRef} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                <Sparkles size={12} />
                Result
              </label>
              {metadata && (
                <div className="flex items-center gap-2 text-[10px] text-surface-500">
                  {metadata.latency && (
                    <span className="bg-surface-800/50 px-1.5 py-0.5 rounded">
                      {(metadata.latency / 1000).toFixed(1)}s
                    </span>
                  )}
                  {metadata.provider && (
                    <span className="bg-surface-800/50 px-1.5 py-0.5 rounded">{metadata.provider}</span>
                  )}
                  {metadata.model && (
                    <span className="bg-surface-800/50 px-1.5 py-0.5 rounded">{metadata.model}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {result && !isStreaming && (
                <>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
                    title="Copy result"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
                    title="Download result"
                  >
                    <Download size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={cn(
            'rounded-xl border p-4',
            error ? 'bg-red-500/8 border-red-500/20' : 'bg-surface-900/50 border-surface-700/30',
          )}>
            {error ? (
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-400">Processing Error</p>
                  <p className="text-sm text-red-300/80 mt-0.5">{error}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="ghost" size="xs" icon={<RefreshCw size={11} />} onClick={() => retry(imageFile!, tool)}>
                      Retry
                    </Button>
                    <Button variant="ghost" size="xs" icon={<Trash2 size={11} />} onClick={handleClearImage}>
                      Clear & Try Again
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
                <MarkdownRenderer content={result} />
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-pink-400 animate-pulse ml-0.5 rounded-sm align-text-bottom" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!imagePreview && !result && !isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { icon: <Upload size={15} />, text: 'Upload or paste an image' },
            { icon: <Sparkles size={15} />, text: 'AI vision analyzes content' },
            { icon: <ScanLine size={15} />, text: '19 analysis tools available' },
            { icon: <Download size={15} />, text: 'Export in multiple formats' },
          ].map((tip, idx) => (
            <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-900/30 border border-surface-700/20">
              <div className="w-7 h-7 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400">{tip.icon}</div>
              <span className="text-[11px] text-surface-400">{tip.text}</span>
            </div>
          ))}
        </div>
      )}

      {metadata && result && !isLoading && (
        <Card padding="sm" className="bg-surface-900/20 border-surface-700/20">
          <div className="flex items-center gap-3 text-[10px] text-surface-500 flex-wrap">
            {metadata.format && (
              <span className="flex items-center gap-1">
                <FileImage size={11} /> Format: {metadata.format.toUpperCase()}
              </span>
            )}
            {metadata.width && metadata.height && (
              <span className="flex items-center gap-1">
                <Maximize2 size={11} /> {formatDimension(metadata.width, metadata.height)}
              </span>
            )}
            {metadata.fileSize && (
              <span className="flex items-center gap-1">
                <Download size={11} /> {formatBytes(metadata.fileSize)}
              </span>
            )}
            {metadata.aspectRatio && (
              <span className="flex items-center gap-1">
                <Layers size={11} /> Ratio: {metadata.aspectRatio}
              </span>
            )}
            {metadata.tokenUsage && (
              <span className="flex items-center gap-1">
                <BarChart3 size={11} /> Tokens: {metadata.tokenUsage.totalTokens}
              </span>
            )}
            {metadata.finishReason && (
              <span className="flex items-center gap-1">
                <Check size={11} /> {metadata.finishReason}
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
