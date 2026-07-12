import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@utils/index'
import { Button, Tabs, Textarea } from '@components/index'
import {
  Mic, MicOff, Play, Square, Sparkles, StopCircle, Copy, Check, RefreshCw, Trash2,
  Upload, Download, Pause, Volume2, Globe, Clock, FileText, List, Search,
} from 'lucide-react'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { TypingIndicator } from '../components/TypingIndicator'
import { AppHeader } from '../components/AppHeader'
import { aiService } from '../services/ai-service'
import type { VoiceTool, VoiceHistoryItem, StreamChunk } from '../dto/types'

const VOICE_TOOLS: { id: VoiceTool; label: string; icon: string }[] = [
  { id: 'speech-to-text', label: 'Speech to Text', icon: 'mic' },
  { id: 'text-to-speech', label: 'Text to Speech', icon: 'volume' },
  { id: 'meeting-notes', label: 'Meeting Notes', icon: 'file-text' },

  { id: 'translation', label: 'Translation', icon: 'globe' },
  { id: 'voice-history', label: 'Voice History', icon: 'clock' },
]

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function RecordingTimer({ isRunning }: { isRunning: boolean }) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0)
      return
    }
    startRef.current = Date.now()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 200)
    return () => clearInterval(id)
  }, [isRunning])

  if (!isRunning) return null
  return (
    <span className="text-sm font-mono text-red-400 animate-pulse">
      {formatDuration(elapsed)}
    </span>
  )
}

function Waveform({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: 32 }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full bg-brand-400/60 transition-all',
            isActive && 'animate-pulse',
          )}
          style={{
            height: isActive ? `${Math.random() * 100 + 20}%` : '20%',
            animationDelay: `${i * 0.05}s`,
            animationDuration: '0.5s',
          }}
        />
      ))}
    </div>
  )
}

function AudioPlayer({ src, onEnded }: { src: string; onEnded?: () => void }) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  const stop = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setPlaying(false)
    setCurrentTime(0)
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = src
    a.download = `recording-${Date.now()}.webm`
    a.click()
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-800/40 border border-surface-700/30">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => { setPlaying(false); onEnded?.() }}
      />
      <button onClick={toggle} className="p-1.5 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-700/60">
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button onClick={stop} className="p-1.5 rounded text-surface-400 hover:text-red-400 hover:bg-red-500/10">
        <Square size={12} />
      </button>
      <span className="text-xs text-surface-500 font-mono min-w-[60px]">
        {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
      </span>
      <div className="flex-1 h-1 bg-surface-700/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-400/60 transition-all rounded-full"
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
      </div>
      <button onClick={download} className="p-1.5 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-700/60" title="Download">
        <Download size={13} />
      </button>
    </div>
  )
}

function ResultDisplay({
  result, isLoading, isStreaming, error, confidence, language, wordCount, duration,
  onStop, onClear, onCopy, copied,
}: {
  result: string; isLoading: boolean; isStreaming: boolean; error: string | null;
  confidence?: number; language?: string; wordCount?: number; duration?: number;
  onStop: () => void; onClear: () => void; onCopy: () => void; copied: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-medium text-surface-400">Result</label>
        <div className="flex items-center gap-3 text-xs text-surface-500">
          {confidence !== undefined && <span>Confidence: {Math.round(confidence * 100)}%</span>}
          {language && <span>Language: {language}</span>}
          {wordCount !== undefined && <span>{wordCount} words</span>}
          {duration !== undefined && <span>{formatDuration(duration)}</span>}
        </div>
        {result && !isStreaming && (
          <div className="flex items-center gap-1">
            <button onClick={onCopy} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" aria-label="Copy">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <button onClick={onClear} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all" aria-label="Clear">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
      <div className={cn(
        'p-4 rounded-xl border',
        error ? 'bg-red-500/10 border-red-500/20' : 'bg-surface-900/60 border-surface-700/40',
      )}>
        {isLoading && !result ? (
          <TypingIndicator />
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
            <MarkdownRenderer content={result} />
            {isStreaming && <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5 rounded-sm" />}
          </div>
        )}
      </div>
      {isStreaming && (
        <Button variant="ghost" size="sm" icon={<StopCircle size={14} />} onClick={onStop}>
          Stop
        </Button>
      )}
    </div>
  )
}

function AudioInput({
  onAudioReady, onAudioRemove, audioUrl, isRecording, onStartRecording, onStopRecording,
}: {
  onAudioReady: (blob: Blob) => void; onAudioRemove: () => void;
  audioUrl: string | null; isRecording: boolean;
  onStartRecording: () => void; onStopRecording: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onAudioReady(file)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('audio/')) onAudioReady(file)
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-surface-400">Audio Input</label>
      <div className="flex items-center gap-3">
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center transition-all',
            isRecording
              ? 'bg-red-500/20 text-red-400 animate-pulse ring-4 ring-red-500/20'
              : 'bg-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-700 border border-surface-700',
          )}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <div>
          <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
            {isRecording ? 'Recording...' : 'Record'}
          </p>
          <p className="text-xs text-surface-500">Speak into your microphone</p>
        </div>
        <div className="text-surface-400 text-xs">or</div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-800/60 border border-surface-700/40 text-surface-400 hover:text-surface-200 hover:bg-surface-700/60 transition-all text-xs"
        >
          <Upload size={14} />
          Upload Audio
        </button>
        <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
      </div>
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      {isRecording && <RecordingTimer isRunning={isRecording} />}
      {isRecording && <Waveform isActive={isRecording} />}
      {audioUrl && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-800/60 border border-surface-700/40">
          <AudioPlayer src={audioUrl} />
          <button onClick={onAudioRemove} className="p-1 rounded text-surface-500 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

interface VoiceHistoryPanelProps {
  onSelect: (item: VoiceHistoryItem) => void
}

function VoiceHistoryPanel({ onSelect }: VoiceHistoryPanelProps) {
  const [items, setItems] = useState<VoiceHistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async (p: number, q?: string) => {
    setLoading(true)
    setError(null)
    try {
      if (q) {
        const res = await aiService.searchVoiceHistory(q)
        if (res.success && res.data) {
          setItems(res.data.items)
          setTotal(res.data.items.length)
        }
      } else {
        const res = await aiService.getVoiceHistory(p, 20)
        if (res.success && res.data) {
          setItems(res.data.items)
          setTotal(res.data.total)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load voice history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await aiService.deleteVoiceHistoryItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch { /* ignore */ } finally { setDeleting(null) }
  }

  const handleSearch = () => {
    if (search.trim()) {
      load(1, search.trim())
    } else {
      load(1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search voice history..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-800/60 border border-surface-700/40 text-sm text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-400/50"
          />
        </div>
        <Button size="sm" variant="ghost" onClick={handleSearch}>Search</Button>
      </div>

      {loading && <TypingIndicator />}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="p-8 text-center text-surface-500">
          <Clock size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No voice history yet</p>
          <p className="text-xs mt-1">Use Speech to Text or other tools to generate history</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-surface-800/40 border border-surface-700/30 hover:bg-surface-800/60 cursor-pointer transition-all group"
              onClick={() => onSelect(item)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-surface-500 mb-1">
                    <span className="capitalize">{item.tool.replace(/-/g, ' ')}</span>
                    {item.language && <span>{item.language}</span>}
                    {item.confidence !== undefined && <span>{Math.round(item.confidence * 100)}%</span>}
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-surface-300 truncate">{item.result || item.input}</p>
                  {item.wordCount && <p className="text-xs text-surface-500 mt-1">{item.wordCount} words</p>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                  disabled={deleting === item.id}
                  className="p-1.5 rounded text-surface-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && !search && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-surface-500">Page {page} of {Math.ceil(total / 20)}</span>
          <Button size="sm" variant="ghost" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function SpeechToTextTab() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
    } catch {
      setError('Microphone access denied. Check browser permissions.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  const clearAudio = useCallback(() => {
    setAudioBlob(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
  }, [audioUrl])

  const handleGenerate = async () => {
    if (!audioBlob) return
    setIsLoading(true)
    setError(null)
    setResult('')
    setCopied(false)

    try {
      const res = await aiService.speechToText(audioBlob)
      if (res.success && res.data) {
        const text = res.data.text
        setResult(text)
        setConfidence(res.data.confidence || 0)
        setLanguage(res.data.language || '')
        setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
      } else {
        throw new Error(res.error?.message || 'Transcription failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process audio')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleClear = () => { setResult(''); setError(null); setConfidence(0); setLanguage(''); setWordCount(0) }
  const handleStop = () => { abortRef.current?.abort() }

  return (
    <div className="space-y-4">
      <AudioInput
        audioUrl={audioUrl}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onAudioReady={(blob) => { setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob)) }}
        onAudioRemove={clearAudio}
      />

      <Button
        onClick={handleGenerate}
        disabled={!audioBlob || isLoading}
        loading={isLoading}
        icon={<Sparkles size={14} />}
        size="sm"
      >
        {isLoading ? 'Transcribing...' : 'Transcribe'}
      </Button>

      {(result || isLoading || error) && (
        <ResultDisplay
          result={result} isLoading={isLoading} isStreaming={isStreaming} error={error}
          confidence={confidence} language={language} wordCount={wordCount || undefined}
          onStop={handleStop} onClear={handleClear}
          onCopy={handleCopy} copied={copied}
        />
      )}
    </div>
  )
}

function TextToSpeechTab() {
  const [inputText, setInputText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices()
      if (available.length > 0) {
        setVoices(available)
        if (!selectedVoice) setSelectedVoice(available[0]?.voiceURI || '')
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [selectedVoice])

  const speak = () => {
    if (!inputText.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(inputText)
    if (selectedVoice) {
      const match = voices.find((v) => v.voiceURI === selectedVoice)
      if (match) utterance.voice = match
    }
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    utterance.onpause = () => setIsPaused(true)
    utterance.onresume = () => setIsPaused(false)
    speechRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
    setIsPaused(false)
  }

  const pause = () => {
    window.speechSynthesis.pause()
  }

  const resume = () => {
    window.speechSynthesis.resume()
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }

  const maleVoices = voices.filter((v) => v.name.toLowerCase().includes('male'))
  const femaleVoices = voices.filter((v) => v.name.toLowerCase().includes('female'))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-surface-400">Text to speak</label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          rows={4}
          containerClassName="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-surface-400">Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-800/60 border border-surface-700/40 text-sm text-surface-200 focus:outline-none focus:border-brand-400/50"
          >
            {voices.length === 0 && <option value="">No voices available</option>}
            {maleVoices.length > 0 && (
              <optgroup label="Male">
                {maleVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                ))}
              </optgroup>
            )}
            {femaleVoices.length > 0 && (
              <optgroup label="Female">
                {femaleVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                ))}
              </optgroup>
            )}
            {voices.filter((v) => !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female')).length > 0 && (
              <optgroup label="Other">
                {voices.filter((v) => !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female')).map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-surface-400">Speed: {rate}x</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full accent-brand-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-surface-400">Pitch: {pitch}</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-brand-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isSpeaking ? (
          <Button onClick={speak} disabled={!inputText.trim()} icon={<Volume2 size={14} />} size="sm">
            Speak
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button onClick={resume} icon={<Play size={14} />} variant="secondary" size="sm">
                Resume
              </Button>
            ) : (
              <Button onClick={pause} icon={<Pause size={14} />} variant="secondary" size="sm">
                Pause
              </Button>
            )}
            <Button onClick={stopSpeaking} icon={<Square size={14} />} variant="ghost" size="sm" className="text-red-400">
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function MeetingNotesTab() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
    } catch { setError('Microphone access denied') }
  }, [])

  const stopRecording = useCallback(() => { mediaRecorderRef.current?.stop(); setIsRecording(false) }, [])
  const clearAudio = useCallback(() => { setAudioBlob(null); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null) }, [audioUrl])

  const handleGenerate = async () => {
    if (!audioBlob) return
    setIsLoading(true)
    setError(null)
    setResult('')
    setTranscript('')

    try {
      const sttRes = await aiService.speechToText(audioBlob)
      if (!sttRes.success || !sttRes.data) throw new Error('Transcription failed')
      const transcription = sttRes.data.text
      setTranscript(transcription)

      const notesRes = await aiService.voice({
        tool: 'meeting-notes',
        input: transcription,
        stream: false,
      })
      if (notesRes.success && notesRes.data) {
        setResult(notesRes.data.result)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process meeting')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleClear = () => { setResult(''); setTranscript(''); setError(null) }

  return (
    <div className="space-y-4">
      <AudioInput
        audioUrl={audioUrl} isRecording={isRecording}
        onStartRecording={startRecording} onStopRecording={stopRecording}
        onAudioReady={(blob) => { setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob)) }}
        onAudioRemove={clearAudio}
      />

      <Button
        onClick={handleGenerate}
        disabled={!audioBlob || isLoading}
        loading={isLoading}
        icon={<Sparkles size={14} />}
        size="sm"
      >
        {isLoading ? 'Processing Meeting...' : 'Generate Notes'}
      </Button>

      {transcript && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-surface-400">Transcript</label>
          <div className="p-3 rounded-xl bg-surface-800/40 border border-surface-700/30">
            <p className="text-sm text-surface-400 text-xs">{transcript}</p>
          </div>
        </div>
      )}

      {(result || error) && (
        <ResultDisplay
          result={result} isLoading={isLoading && !result} isStreaming={isStreaming} error={error}
          onStop={() => abortRef.current?.abort()} onClear={handleClear}
          onCopy={handleCopy} copied={copied}
        />
      )}
    </div>
  )
}

function TranslationTab() {
  const [input, setInput] = useState('')
  const [targetLang, setTargetLang] = useState('Spanish')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const LANGUAGES = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Dutch', 'Polish', 'Turkish', 'Vietnamese', 'Thai']

  const handleTranslate = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    setError(null)
    setResult('')

    try {
      const res = await aiService.voice({
        tool: 'translation',
        input,
        context: { targetLanguage: targetLang } as Record<string, unknown>,
        stream: false,
      })
      if (res.success && res.data) {
        setResult(res.data.result)
      } else {
        throw new Error(res.error?.message || 'Translation failed')
      }
    } catch (err: any) {
      setError(err.message || 'Translation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleClear = () => { setResult(''); setError(null) }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-surface-400">Text to translate</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to translate..."
          rows={4}
          containerClassName="w-full"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="space-y-1 flex-1">
          <label className="text-xs font-medium text-surface-400">Target Language</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-800/60 border border-surface-700/40 text-sm text-surface-200 focus:outline-none focus:border-brand-400/50"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <Button
          onClick={handleTranslate}
          disabled={!input.trim() || isLoading}
          loading={isLoading}
          icon={<Globe size={14} />}
          size="sm"
          className="mt-5"
        >
          {isLoading ? 'Translating...' : 'Translate'}
        </Button>
      </div>

      {(result || isLoading || error) && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-surface-400">Translation Result</label>
          <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-700/40">
            <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
              {result.split('\n').filter(Boolean).map((line, i) => (
                <li key={i}>{line.replace(/^\*+\s*/, '')}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleCopy} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" aria-label="Copy">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <button onClick={handleClear} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function VoiceHistoryTab() {
  const [selected, setSelected] = useState<VoiceHistoryItem | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => { if (selected) { navigator.clipboard.writeText(selected.result); setCopied(true); setTimeout(() => setCopied(false), 2000) } }

  if (selected) {
    return (
      <div className="space-y-4">
        <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
          &larr; Back to History
        </Button>
        <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-700/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <span className="capitalize">{selected.tool.replace(/-/g, ' ')}</span>
              {selected.language && <span>{selected.language}</span>}
              {selected.confidence !== undefined && <span>{Math.round(selected.confidence * 100)}%</span>}
              <span>{new Date(selected.createdAt).toLocaleString()}</span>
            </div>
            <button onClick={handleCopy} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" aria-label="Copy">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
            <MarkdownRenderer content={selected.result} />
          </div>
          {selected.wordCount && <p className="text-xs text-surface-500 mt-2">{selected.wordCount} words</p>}
        </div>
      </div>
    )
  }

  return <VoiceHistoryPanel onSelect={setSelected} />
}

export const VoiceStudio = () => {
  const [activeTool, setActiveTool] = useState<VoiceTool>('speech-to-text')

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        icon={<Mic size={16} />}
        title="Voice Studio"
        gradient="linear-gradient(135deg, #10b981, #34d399)"
        breadcrumbs={[
          { label: 'AI Workspace', href: '/ai' },
          { label: 'Voice Studio' },
          { label: VOICE_TOOLS.find(t => t.id === activeTool)?.label || '' },
        ]}
        subtitle="Speech to text, transcription, and more"
      />

      <div className="px-6 py-3 border-b border-surface-700/20 flex-shrink-0 overflow-x-auto">
        <Tabs
          tabs={VOICE_TOOLS.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={activeTool}
          onChange={(id) => setActiveTool(id as VoiceTool)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {activeTool === 'speech-to-text' && <SpeechToTextTab />}
          {activeTool === 'text-to-speech' && <TextToSpeechTab />}
          {activeTool === 'meeting-notes' && <MeetingNotesTab />}
          {activeTool === 'translation' && <TranslationTab />}
          {activeTool === 'voice-history' && <VoiceHistoryTab />}
        </div>
      </div>
    </div>
  )
}
