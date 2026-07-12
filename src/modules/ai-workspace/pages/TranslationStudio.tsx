import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@utils/index'
import { Button, Textarea, Tabs } from '@components/index'
import { AppHeader } from '../components/AppHeader'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { aiService } from '../services/ai-service'
import type { TranslationTool, StudioRequest, StreamChunk } from '../dto/types'
import {
  Languages, Sparkles, StopCircle, Copy, Check, RefreshCw, Trash2,
  ArrowRight, Globe, FileText, Download, Upload, Image, Scan,
  BookOpen, LayoutPanelLeft, Columns3, AlignLeft, AlignRight,
} from 'lucide-react'

const TRANSLATION_TOOLS: { id: TranslationTool; label: string; icon: React.ReactNode; description: string; placeholder: string }[] = [
  { id: 'translate', label: 'Translate', icon: <Globe size={16} />, description: 'Translate text between languages', placeholder: 'Enter text to translate...' },
  { id: 'detect-language', label: 'Detect Language', icon: <Scan size={16} />, description: 'Detect language with confidence score', placeholder: 'Paste text to detect its language...' },
  { id: 'compare-translation', label: 'Compare', icon: <Columns3 size={16} />, description: 'Compare original vs translation', placeholder: 'Enter original text...' },
  { id: 'document-translation', label: 'Document', icon: <FileText size={16} />, description: 'Translate documents preserving structure', placeholder: 'Paste document content to translate...' },
  { id: 'image-translation', label: 'Image Text', icon: <Image size={16} />, description: 'Extract and translate text from images', placeholder: 'Describe the image or paste extracted text...' },
]

const LANGUAGES = [
  'Afrikaans', 'Arabic', 'Bengali', 'Bulgarian', 'Chinese', 'Croatian', 'Czech', 'Danish',
  'Dutch', 'English', 'Estonian', 'Filipino', 'Finnish', 'French', 'German', 'Greek',
  'Gujarati', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Italian',
  'Japanese', 'Kannada', 'Korean', 'Latvian', 'Lithuanian', 'Malay', 'Malayalam',
  'Marathi', 'Norwegian', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian',
  'Serbian', 'Slovak', 'Slovenian', 'Spanish', 'Swahili', 'Swedish', 'Tamil', 'Telugu',
  'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese', 'Welsh',
]

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function countChars(text: string): number {
  return text.length
}

function estimateReadingTime(text: string): number {
  return Math.max(1, Math.ceil(countWords(text) / 200))
}

export const TranslationStudio = () => {
  const [activeTool, setActiveTool] = useState<TranslationTool>('translate')
  const [sourceText, setSourceText] = useState('')
  const [comparisonText, setComparisonText] = useState('')
  const [sourceLang, setSourceLang] = useState('English')
  const [targetLang, setTargetLang] = useState('Spanish')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSideBySide, setShowSideBySide] = useState(false)
  const [progress, setProgress] = useState('')
  const [detectedLang, setDetectedLang] = useState('')
  const [confidence, setConfidence] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (result && !isLoading && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [result, isLoading])

  const handleSwapLanguages = useCallback(() => {
    const temp = sourceLang
    setSourceLang(targetLang)
    setTargetLang(temp)
  }, [sourceLang, targetLang])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setSourceText(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleGenerate = async () => {
    const textToUse = activeTool === 'compare-translation'
      ? `Original:\n${sourceText}\n\nTranslation to compare:\n${comparisonText}`
      : sourceText
    if (!textToUse.trim()) return

    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    setResult('')
    setDetectedLang('')
    setConfidence(0)
    setProgress(activeTool === 'translate' ? 'Translating...' : activeTool === 'detect-language' ? 'Analyzing...' : activeTool === 'compare-translation' ? 'Comparing...' : 'Processing...')

    const controller = new AbortController()
    abortRef.current = controller

    const request: StudioRequest = {
      tool: activeTool,
      input: textToUse.trim(),
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      stream: true,
    }

    try {
      const fullContent = await aiService.streamTranslate(
        request,
        (chunk: StreamChunk) => {
          if (chunk.content) setResult((prev) => prev + chunk.content)
          if (chunk.metadata?.language) setDetectedLang(chunk.metadata.language as string)
          if (chunk.metadata?.confidence) setConfidence(chunk.metadata.confidence as number)
        },
        { signal: controller.signal },
      )
      setResult(fullContent)
      setProgress('Completed')
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return
      setError(err?.message || (activeTool === 'translate' ? 'Translation failed' : 'Analysis failed'))
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
    setIsStreaming(false)
  }, [])

  const handleClear = useCallback(() => {
    setResult('')
    setError(null)
    setCopied(false)
    setDetectedLang('')
    setConfidence(0)
    setProgress('')
    abortRef.current?.abort()
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  const handleDownload = useCallback(() => {
    const ext = '.txt'
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `translation-${targetLang}${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [result, targetLang])

  const handleRetry = useCallback(() => {
    handleGenerate()
  }, [sourceText, comparisonText, activeTool, sourceLang, targetLang])

  const hasResult = result || error
  const wordCount = countWords(result)
  const charCount = countChars(result)
  const readingTime = estimateReadingTime(result)

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--color-bg-primary))]">
      <AppHeader
        icon={<Languages size={16} />}
        title="Translation Studio"
        gradient="linear-gradient(135deg, #14b8a6, #2dd4bf)"
        breadcrumbs={[
          { label: 'AI Workspace', href: '/ai' },
          { label: 'Translation Studio' },
          { label: TRANSLATION_TOOLS.find(t => t.id === activeTool)?.label || '' },
        ]}
        subtitle={TRANSLATION_TOOLS.find(t => t.id === activeTool)?.description}
      >
        <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json" className="hidden" onChange={handleFileUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
          aria-label="Upload file"
        >
          <Upload size={16} />
        </button>
      </AppHeader>

      <div className="px-6 py-2 border-b border-surface-700/20 flex-shrink-0 bg-surface-900/20 overflow-x-auto">
        <Tabs
          tabs={TRANSLATION_TOOLS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
          activeTab={activeTool}
          onChange={(id) => { setActiveTool(id as TranslationTool); handleClear() }}
          variant="underline"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-5">
          {activeTool !== 'compare-translation' && (
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-surface-400">Source Language</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800/60 border border-surface-700/40 text-sm text-surface-200 focus:outline-none focus:border-brand-400/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSwapLanguages}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all mb-1"
                title="Swap languages"
              >
                <ArrowRight size={16} className="rotate-90 md:rotate-0" />
              </button>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-surface-400">Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800/60 border border-surface-700/40 text-sm text-surface-200 focus:outline-none focus:border-brand-400/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-surface-400">
              {activeTool === 'translate' ? 'Text to Translate' :
               activeTool === 'detect-language' ? 'Text to Analyze' :
               activeTool === 'compare-translation' ? 'Original Text' :
               activeTool === 'document-translation' ? 'Document Content' :
               activeTool === 'image-translation' ? 'Image Text / Description' : 'Input'}
            </label>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={TRANSLATION_TOOLS.find(t => t.id === activeTool)?.placeholder || 'Enter text...'}
              rows={5}
              containerClassName="w-full"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!sourceText.trim() || isLoading}
                  loading={isLoading}
                  icon={<Sparkles size={14} />}
                  size="md"
                >
                  {isLoading ? (activeTool === 'translate' ? 'Translating...' : activeTool === 'detect-language' ? 'Analyzing...' : activeTool === 'compare-translation' ? 'Comparing...' : 'Processing...') :
                   activeTool === 'translate' ? 'Translate' :
                   activeTool === 'detect-language' ? 'Detect' :
                   activeTool === 'compare-translation' ? 'Compare' : 'Generate'}
                </Button>
                {isStreaming && (
                  <Button variant="ghost" size="sm" icon={<StopCircle size={14} />} onClick={handleStop}>
                    Stop
                  </Button>
                )}
                {hasResult && (
                  <>
                    <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={handleRetry}>
                      Retry
                    </Button>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleClear}>
                      Clear
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-surface-500">
                <span>{countWords(sourceText)} words</span>
                <span>{countChars(sourceText)} chars</span>
                {sourceText.trim() && <span>~{estimateReadingTime(sourceText)} min read</span>}
              </div>
            </div>
          </div>

          {activeTool === 'compare-translation' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-surface-400">Translation to Compare</label>
              <Textarea
                value={comparisonText}
                onChange={(e) => setComparisonText(e.target.value)}
                placeholder="Paste the translation to compare..."
                rows={4}
                containerClassName="w-full"
              />
            </div>
          )}

          {isLoading && !result && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-900/60 border border-surface-700/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-surface-400">{progress}</span>
            </div>
          )}

          {hasResult && (
            <div ref={resultRef} className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-surface-400">Result</label>
                  {detectedLang && (
                    <span className="text-[10px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">{detectedLang}</span>
                  )}
                  {confidence > 0 && (
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{confidence}% confidence</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {activeTool === 'translate' && result && !isStreaming && (
                    <button
                      onClick={() => setShowSideBySide(!showSideBySide)}
                      className={cn('p-1.5 rounded-lg transition-all', showSideBySide ? 'bg-brand-500/20 text-brand-400' : 'text-surface-500 hover:text-surface-200 hover:bg-surface-800/60')}
                      title={showSideBySide ? 'Single view' : 'Side-by-side view'}
                    >
                      <LayoutPanelLeft size={13} />
                    </button>
                  )}
                  {result && !isStreaming && (
                    <>
                      <button onClick={handleCopy} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" title="Copy">
                        {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      </button>
                      <button onClick={handleDownload} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" title="Download">
                        <Download size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {error ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              ) : showSideBySide && sourceText.trim() ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-700/40">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-surface-700/20">
                      <BookOpen size={12} className="text-surface-400" />
                      <span className="text-[10px] font-medium text-surface-500 uppercase">{sourceLang}</span>
                      <span className="text-[10px] text-surface-600">{countWords(sourceText)} words</span>
                    </div>
                    <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
                      {sourceText}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-brand-500/20">
                      <Globe size={12} className="text-brand-400" />
                      <span className="text-[10px] font-medium text-brand-400 uppercase">{targetLang}</span>
                      <span className="text-[10px] text-surface-500">{wordCount} words</span>
                    </div>
                    <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
                      <MarkdownRenderer content={result} />
                      {isStreaming && <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5 rounded-sm" />}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-700/40">
                  <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
                    <MarkdownRenderer content={result} />
                    {isStreaming && <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5 rounded-sm" />}
                  </div>
                </div>
              )}

              {result && !isStreaming && !error && (
                <div className="flex items-center gap-3 text-[10px] text-surface-500">
                  <span>{wordCount} words</span>
                  <span>{charCount} characters</span>
                  <span>~{readingTime} min read</span>
                  {activeTool === 'translate' && (
                    <span className="flex items-center gap-1 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Translation complete
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {!sourceText && !result && !isLoading && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { icon: <Globe size={16} />, text: 'Translate between 50+ languages' },
                { icon: <Scan size={16} />, text: 'Auto-detect language with confidence score' },
                { icon: <FileText size={16} />, text: 'Upload .txt, .md, .csv files' },
                { icon: <Columns3 size={16} />, text: 'Compare original vs side-by-side' },
              ].map((tip, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-900/30 border border-surface-700/30">
                  <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400">{tip.icon}</div>
                  <span className="text-xs text-surface-400">{tip.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
