import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@utils/index'
import { Button, Tabs, Badge, Card, Select } from '@components/index'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { DocumentUpload } from '../components/DocumentUpload'
import { ProcessingSteps } from '../components/ProgressSteps'
import { AppHeader } from '../components/AppHeader'
import { useAiStudio } from '../hooks/useAiStudio'
import { FileText, MessageSquare, FileSearch, Table2, ScanLine, Languages, Copy, Check, Download, RefreshCw, Trash2, StopCircle, Sparkles, Brain, HelpCircle, Lightbulb, Search, Bookmark, Share2, Upload, AlertCircle } from 'lucide-react'

type DocumentTool = 'summarize' | 'ask-questions' | 'extract-text' | 'table-extraction' | 'ocr-result' | 'document-translation'

const SUMMARY_LENGTHS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'executive', label: 'Executive Summary' },
  { value: 'bullet', label: 'Bullet Points' },
  { value: 'timeline', label: 'Timeline' },
]

const EXTRACTION_FORMATS = [
  { value: 'plain', label: 'Plain Text' },
  { value: 'formatted', label: 'Formatted' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
]

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'russian', label: 'Russian' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'turkish', label: 'Turkish' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'thai', label: 'Thai' },
  { value: 'indonesian', label: 'Indonesian' },
]

const TOOL_CONFIG: Record<DocumentTool, {
  label: string
  icon: React.ReactNode
  description: string
  placeholder: string
  badge?: string
}> = {
  'summarize': {
    label: 'Summarize',
    icon: <FileText size={16} />,
    description: 'Generate concise summaries with customizable length and tone',
    placeholder: 'Paste your document content here...',
    badge: 'Popular',
  },
  'ask-questions': {
    label: 'Ask Questions',
    icon: <HelpCircle size={16} />,
    description: 'Chat with your document - ask anything about the content',
    placeholder: 'Paste your document content first, then ask questions...',
  },
  'extract-text': {
    label: 'Extract Text',
    icon: <FileSearch size={16} />,
    description: 'Extract text from documents in multiple formats',
    placeholder: 'Paste document content to extract text from...',
  },
  'table-extraction': {
    label: 'Table Extraction',
    icon: <Table2 size={16} />,
    description: 'Detect and extract tables from your documents',
    placeholder: 'Paste document content containing tables...',
  },
  'ocr-result': {
    label: 'OCR Result',
    icon: <ScanLine size={16} />,
    description: 'View and refine OCR output from scanned documents',
    placeholder: 'Paste OCR text for processing and refinement...',
    badge: 'Scanned',
  },
  'document-translation': {
    label: 'Translate',
    icon: <Languages size={16} />,
    description: 'Translate entire documents while preserving formatting',
    placeholder: 'Paste document content to translate...',
  },
}

const STEPS = [
  { id: 'uploading', label: 'Uploading Document...' },
  { id: 'reading', label: 'Reading Document...' },
  { id: 'parsing', label: 'Parsing...' },
  { id: 'ocr', label: 'Running OCR...' },
  { id: 'understanding', label: 'Understanding Content...' },
  { id: 'generating', label: 'Generating AI Response...' },
  { id: 'finalizing', label: 'Finalizing...' },
  { id: 'done', label: 'Completed Successfully.' },
]

export const DocumentStudio = () => {
  const [activeTool, setActiveTool] = useState<DocumentTool>('summarize')
  const activeConfig = TOOL_CONFIG[activeTool]

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--color-bg-primary))]">
      <AppHeader
        icon={<FileText size={16} />}
        title="Document Studio"
        gradient="linear-gradient(135deg, #3b82f6, #60a5fa)"
        breadcrumbs={[
          { label: 'AI Workspace', href: '/ai' },
          { label: 'Document Studio' },
          { label: TOOL_CONFIG[activeTool]?.label || '' },
        ]}
        subtitle="Analyze, summarize, and extract from documents"
      >
        <Badge variant="info" size="sm">AI Powered</Badge>
        <Badge variant="cyan" size="sm">v2.0</Badge>
      </AppHeader>

      <div className="px-6 py-2 border-b border-surface-700/20 flex-shrink-0 bg-surface-900/20">
        <Tabs
          tabs={Object.entries(TOOL_CONFIG).map(([id, cfg]) => ({
            id,
            label: cfg.label,
            icon: cfg.icon,
            badge: cfg.badge,
          }))}
          activeTab={activeTool}
          onChange={(id) => setActiveTool(id as DocumentTool)}
          variant="underline"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <ToolView key={activeTool} tool={activeTool} config={activeConfig} />
        </div>
      </div>
    </div>
  )
}

const ToolView = ({ tool, config }: { tool: DocumentTool; config: typeof TOOL_CONFIG[DocumentTool] }) => {
  const { result, isLoading, isStreaming, error, generate, stopGeneration, clearResult, retry } = useAiStudio({ studio: 'document', tool })
  const [input, setInput] = useState('')
  const [file, setFile] = useState<{ name: string; type: string; size: number } | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [progressStep, setProgressStep] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [summaryLength, setSummaryLength] = useState('medium')
  const [extractFormat, setExtractFormat] = useState('formatted')
  const [targetLanguage, setTargetLanguage] = useState('spanish')
  const resultRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [suggestedQuestions] = useState([
    'What is the main topic of this document?',
    'Who are the key people mentioned?',
    'What are the important dates?',
    'Summarize the key findings',
    'What action items are mentioned?',
    'List all companies or organizations',
    'What are the risks identified?',
    'Extract all numerical data',
  ])

  const documentContent = input || fileContent

  useEffect(() => {
    if (result && !isStreaming && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [result, isStreaming])

  const simulateProgress = useCallback(() => {
    const steps = ['uploading', 'reading', 'parsing', 'ocr', 'understanding', 'generating', 'finalizing']
    let i = 0
    setProgressStep(steps[0])
    const interval = setInterval(() => {
      i++
      if (i < steps.length) {
        setProgressStep(steps[i])
      } else {
        clearInterval(interval)
      }
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const handleGenerate = useCallback(() => {
    if (!documentContent.trim() && tool !== 'ask-questions') return

    const clearProgress = simulateProgress()

    if (tool === 'ask-questions') {
      if (question.trim() && documentContent.trim()) {
        setMessages(prev => [...prev, { role: 'user', content: question }])
        generate({ tool, input: documentContent, question, stream: true } as any)
        setQuestion('')
      }
    } else if (tool === 'document-translation') {
      generate({ tool, input: documentContent, targetLanguage: targetLanguage, stream: true } as any)
    } else if (tool === 'summarize') {
      generate({ tool, input: `[Summary Length: ${summaryLength}]\n\n${documentContent}`, stream: true } as any)
    } else if (tool === 'extract-text') {
      generate({ tool, input: documentContent, format: extractFormat, stream: true } as any)
    } else {
      generate({ tool, input: documentContent, stream: true } as any)
    }

    setTimeout(clearProgress, 100)
    setTimeout(() => setProgressStep('done'), 2000)
  }, [tool, documentContent, question, targetLanguage, summaryLength, extractFormat, generate, simulateProgress])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${tool}-result.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileContent = useCallback((content: string, fileName: string, fileType: string) => {
    setFileContent(content)
    setFile({ name: fileName, type: fileType, size: content.length })
    setInput('')
  }, [])

  const handleClearFile = useCallback(() => {
    setFile(null)
    setFileContent('')
  }, [])

  const handleClearAll = useCallback(() => {
    clearResult()
    setMessages([])
    setQuestion('')
    if (tool !== 'ask-questions') setInput('')
    else setFileContent('')
    setFile(null)
    setProgressStep(null)
  }, [clearResult, tool])

  const handleRetry = useCallback(() => {
    handleGenerate()
  }, [handleGenerate])

  const askSuggestedQuestion = useCallback((q: string) => {
    setQuestion(q)
    if (documentContent.trim()) {
      setMessages(prev => [...prev, { role: 'user', content: q }])
      generate({ tool, input: documentContent, question: q, stream: true } as any)
    }
  }, [documentContent, generate, tool])

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">{config.label}</h2>
            {config.badge && <Badge variant="info" size="sm">{config.badge}</Badge>}
          </div>
          <p className="text-sm text-surface-400 mt-0.5">{config.description}</p>
        </div>
      </div>

      <Card className="overflow-visible">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
              <FileText size={12} />
              Document Content
            </label>
            <div className="flex items-center gap-2">
              {file && (
                <span className="text-xs text-surface-500">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
          </div>

          {tool === 'ask-questions' ? (
            <div className="space-y-3">
              <DocumentUpload
                onFileContent={handleFileContent}
                onClear={handleClearFile}
                currentFile={file}
              />
              {!file && !input && (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Or paste your document content here..."
                  rows={5}
                  className="w-full bg-surface-900/60 border border-surface-700/40 rounded-xl px-4 py-3 text-sm text-[rgb(var(--color-text-primary))] placeholder:text-surface-500 resize-none focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <DocumentUpload
                onFileContent={handleFileContent}
                onClear={handleClearFile}
                currentFile={file}
              />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.placeholder}
                rows={6}
                className="w-full bg-surface-900/60 border border-surface-700/40 rounded-xl px-4 py-3 text-sm text-[rgb(var(--color-text-primary))] placeholder:text-surface-500 resize-none focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all font-mono"
              />
            </div>
          )}

          {tool === 'summarize' && (
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">Summary Length</label>
              <div className="flex flex-wrap gap-1.5">
                {SUMMARY_LENGTHS.map((sl) => (
                  <button
                    key={sl.value}
                    onClick={() => setSummaryLength(sl.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      summaryLength === sl.value
                        ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                        : 'bg-surface-900/60 border-surface-700/40 text-surface-400 hover:border-surface-600',
                    )}
                  >
                    {sl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool === 'extract-text' && (
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">Output Format</label>
              <div className="flex flex-wrap gap-1.5">
                {EXTRACTION_FORMATS.map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setExtractFormat(fmt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      extractFormat === fmt.value
                        ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                        : 'bg-surface-900/60 border-surface-700/40 text-surface-400 hover:border-surface-600',
                    )}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool === 'document-translation' && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-surface-400 mb-1.5 block">Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full bg-surface-900/60 border border-surface-700/40 rounded-lg px-3 py-2 text-sm text-[rgb(var(--color-text-primary))] focus:outline-none focus:border-brand-500/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {tool === 'ask-questions' && documentContent.trim() && (
            <div className="space-y-3 pt-2 border-t border-surface-700/20">
              <label className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                <MessageSquare size={12} />
                Ask a Question about this Document
              </label>
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-1 bg-surface-900/60 border border-surface-700/40 rounded-xl px-4 py-2.5 text-sm text-[rgb(var(--color-text-primary))] placeholder:text-surface-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() } }}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={!question.trim() || isLoading}
                  loading={isLoading}
                  icon={<Sparkles size={14} />}
                  size="md"
                >
                  Ask
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => askSuggestedQuestion(q)}
                    className="px-2.5 py-1 rounded-lg text-xs text-surface-400 bg-surface-900/60 border border-surface-700/40 hover:border-surface-600 hover:text-surface-200 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={handleGenerate}
              disabled={!documentContent.trim() || isLoading}
              loading={isLoading}
              icon={<Sparkles size={14} />}
              size="md"
            >
              {isLoading ? 'Processing...' : 'Generate'}
            </Button>
            {isStreaming && (
              <Button
                variant="ghost"
                size="sm"
                icon={<StopCircle size={14} />}
                onClick={stopGeneration}
              >
                Stop
              </Button>
            )}
            {(result || error) && (
              <>
                <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={handleRetry}>
                  Retry
                </Button>
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleClearAll}>
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {progressStep && isLoading && (
        <Card className="bg-surface-900/40">
          <ProcessingSteps steps={STEPS} currentStep={progressStep} />
        </Card>
      )}

      {tool === 'ask-questions' && messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-brand-500/20 border border-brand-500/20'
                  : 'bg-surface-900/60 border border-surface-700/40',
              )}>
                <p className="text-sm text-[rgb(var(--color-text-primary))]">{msg.content}</p>
              </div>
            </div>
          ))}
          {(result || isLoading) && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-1">
                <Brain size={14} />
              </div>
              <div className="flex-1 bg-surface-900/60 border border-surface-700/40 rounded-2xl px-4 py-3">
                {isLoading && !result ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
                    <MarkdownRenderer content={result} />
                    {isStreaming && <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5 rounded-sm" />}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tool !== 'ask-questions' && (result || error) && (
        <div ref={resultRef} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
              <Sparkles size={12} />
              Result
            </label>
            <div className="flex items-center gap-1">
              {result && !isStreaming && (
                <>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
                    aria-label="Copy result"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
                    aria-label="Download result"
                  >
                    <Download size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={cn(
            'rounded-2xl border p-5',
            error
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-surface-900/60 border-surface-700/40',
          )}>
            {isLoading && !result ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Error</p>
                  <p className="text-sm text-red-300/80 mt-1">{error}</p>
                  <Button variant="ghost" size="xs" className="mt-2" icon={<RefreshCw size={12} />} onClick={handleRetry}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
                <MarkdownRenderer content={result} />
                {isStreaming && <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5 rounded-sm" />}
              </div>
            )}
          </div>
        </div>
      )}

      {tool === 'ask-questions' && !documentContent.trim() && !file && (
        <Card className="bg-surface-900/30 border-dashed">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <MessageSquare size={24} className="text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-300">Upload or paste a document to start asking questions</p>
              <p className="text-xs text-surface-500 mt-1">Supports PDF, DOCX, TXT, and more</p>
            </div>
          </div>
        </Card>
      )}

      {tool !== 'ask-questions' && !result && !isLoading && !documentContent.trim() && !file && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Upload size={16} />, text: 'Upload a document or paste content' },
            { icon: <Sparkles size={16} />, text: 'Click Generate to process' },
            { icon: <Brain size={16} />, text: 'AI analyzes and returns results' },
            { icon: <Download size={16} />, text: 'Export results in multiple formats' },
          ].map((tip, idx) => (
            <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-900/30 border border-surface-700/30">
              <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400">
                {tip.icon}
              </div>
              <span className="text-xs text-surface-400">{tip.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
