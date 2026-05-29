import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Settings2, Trophy, Zap, Target, Clock, ChevronDown } from 'lucide-react'
import { cn } from '@utils/index'

// ── Text pools ──────────────────────────────────────────────
const WORD_POOL = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not',
  'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from',
  'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
  'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
  'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'great', 'between', 'need', 'large', 'often', 'hand', 'high', 'place', 'hold',
  'world', 'found', 'every', 'still', 'name', 'should', 'home', 'big', 'give', 'air',
]

const QUOTES = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Life is what happens when you are busy making other plans.', author: 'John Lennon' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'Programming is the art of telling another human being what one wants the computer to do.', author: 'Donald Knuth' },
  { text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', author: 'Martin Fowler' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Code is like humor. When you have to explain it, it is bad.', author: 'Cory House' },
]

const CODE_SNIPPETS = [
  'const sum = (a, b) => a + b; console.log(sum(1, 2));',
  'function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }',
  'const arr = [1, 2, 3, 4, 5]; const doubled = arr.map(x => x * 2);',
  'async function fetchData(url) { const res = await fetch(url); return res.json(); }',
  'class Stack { push(item) { this.items.push(item); } pop() { return this.items.pop(); } }',
  'const debounce = (fn, delay) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }; };',
  'const unique = arr => [...new Set(arr)]; const flat = arr => arr.flat(Infinity);',
  'type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };',
]

type Mode = 'words' | 'quote' | 'code' | 'time'
type Difficulty = 'easy' | 'medium' | 'hard'

function generateText(mode: Mode, wordCount: number): string {
  if (mode === 'quote') {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)].text
  }
  if (mode === 'code') {
    return CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]
  }
  const pool = mode === 'words' ? WORD_POOL : WORD_POOL
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return words.join(' ')
}

function playKeySound(correct: boolean) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = correct ? 440 : 220
    osc.type = correct ? 'sine' : 'square'
    gain.gain.setValueAtTime(0.03, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(); osc.stop(ctx.currentTime + 0.08)
  } catch {}
}

interface Results {
  wpm: number
  accuracy: number
  correct: number
  errors: number
  time: number
  chars: number
}

interface CharState { char: string; state: 'pending' | 'correct' | 'incorrect' }

const WORD_COUNTS: Record<Difficulty, number> = { easy: 25, medium: 50, hard: 100 }
const TIME_LIMITS: number[] = [15, 30, 60, 120]

export const TypingTestTool = () => {
  const [mode, setMode] = useState<Mode>('words')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [timeLimit, setTimeLimit] = useState(30)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const [text, setText] = useState(() => generateText('words', 50))
  const [charStates, setCharStates] = useState<CharState[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [errors, setErrors] = useState(0)
  const [results, setResults] = useState<Results | null>(null)
  const [history, setHistory] = useState<Results[]>([])
  const [streak, setStreak] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Init char states
  useEffect(() => {
    setCharStates(Array.from(text).map(c => ({ char: c, state: 'pending' })))
    setCurrentIdx(0); setTyped(''); setPhase('idle')
    setTimeLeft(timeLimit); setElapsedMs(0); setErrors(0); setResults(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [text, timeLimit])

  const finish = useCallback((states: CharState[], elapsed: number, remainingTime: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const totalTime = mode === 'time' ? (timeLimit - remainingTime) : elapsed / 1000
    const correct = states.filter(s => s.state === 'correct').length
    const incorrect = states.filter(s => s.state === 'incorrect').length
    const totalTyped = correct + incorrect
    const wpm = Math.round((correct / 5) / (totalTime / 60))
    const accuracy = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100
    const r: Results = { wpm, accuracy, correct, errors: incorrect, time: Math.round(totalTime), chars: totalTyped }
    setResults(r)
    setPhase('done')
    setHistory(prev => [r, ...prev].slice(0, 10))
    if (accuracy >= 95) setStreak(s => s + 1)
    else setStreak(0)
  }, [mode, timeLimit])

  // Time mode timer
  useEffect(() => {
    if (phase !== 'running' || mode !== 'time') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCharStates(cs => {
            const elapsed = Date.now() - startTimeRef.current
            finish(cs, elapsed, 0)
            return cs
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, mode, finish])

  const handleKey = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (phase === 'done') return

    if (phase === 'idle') {
      setPhase('running')
      startTimeRef.current = Date.now()
    }

    const lastChar = val[val.length - 1] ?? ''
    const newIdx = val.length - 1

    if (newIdx >= text.length) return

    const correct = lastChar === text[newIdx]
    if (soundEnabled) playKeySound(correct)

    setCharStates(prev => {
      const next = [...prev]
      if (newIdx >= 0) {
        next[newIdx] = { char: text[newIdx], state: correct ? 'correct' : 'incorrect' }
      }
      // Reset pending for characters after current position (on backspace)
      if (val.length < typed.length) {
        for (let i = val.length; i < prev.length; i++) {
          next[i] = { char: text[i], state: 'pending' }
        }
      }
      return next
    })

    if (!correct) setErrors(e => e + 1)
    setTyped(val)
    setCurrentIdx(val.length)

    // Words/quote/code mode: finish when text complete
    if (mode !== 'time' && val.length >= text.length) {
      const elapsed = Date.now() - startTimeRef.current
      setElapsedMs(elapsed)
      setTimeout(() => {
        setCharStates(cs => { finish(cs, elapsed, 0); return cs })
      }, 0)
    }
  }, [phase, text, typed, mode, soundEnabled, finish])

  const reset = useCallback(() => {
    const newText = generateText(mode, WORD_COUNTS[difficulty])
    setText(newText)
  }, [mode, difficulty])

  const handleModeChange = (m: Mode) => {
    setMode(m)
    setText(generateText(m, WORD_COUNTS[difficulty]))
  }

  const wpmNow = useMemo(() => {
    if (phase !== 'running' || currentIdx === 0) return 0
    const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60
    if (elapsed === 0) return 0
    const correctChars = charStates.filter(s => s.state === 'correct').length
    return Math.round((correctChars / 5) / elapsed)
  }, [phase, currentIdx, charStates])

  const accuracy = useMemo(() => {
    const total = charStates.filter(s => s.state !== 'pending').length
    if (!total) return 100
    return Math.round((charStates.filter(s => s.state === 'correct').length / total) * 100)
  }, [charStates])

  const progress = text.length ? (currentIdx / text.length) * 100 : 0

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode */}
          <div className="flex gap-1 bg-surface-800 rounded-xl p-1 border border-surface-700/50">
            {(['words', 'quote', 'code', 'time'] as Mode[]).map(m => (
              <button key={m} onClick={() => handleModeChange(m)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
                  mode === m ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white')}>
                {m}
              </button>
            ))}
          </div>

          {/* Difficulty / word count */}
          {mode !== 'time' && mode !== 'quote' && (
            <div className="flex gap-1 bg-surface-800 rounded-xl p-1 border border-surface-700/50">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button key={d} onClick={() => { setDifficulty(d); setText(generateText(mode, WORD_COUNTS[d])) }}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
                    difficulty === d ? 'bg-violet-600 text-white' : 'text-surface-400 hover:text-white')}>
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Time limit for time mode */}
          {mode === 'time' && (
            <div className="flex gap-1 bg-surface-800 rounded-xl p-1 border border-surface-700/50">
              {TIME_LIMITS.map(t => (
                <button key={t} onClick={() => setTimeLimit(t)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    timeLimit === t ? 'bg-emerald-600 text-white' : 'text-surface-400 hover:text-white')}>
                  {t}s
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button onClick={() => setSoundEnabled(v => !v)}
            className={cn('w-8 h-8 rounded-lg border flex items-center justify-center text-xs transition-all',
              soundEnabled ? 'bg-brand-600/20 border-brand-500/40 text-brand-400' : 'bg-surface-800 border-surface-700 text-surface-500')}>
            🔊
          </button>
          <button onClick={reset}
            className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-white flex items-center justify-center transition-all">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: <Zap size={14} />, label: 'WPM', value: results ? results.wpm : wpmNow, color: '#3b82f6' },
          { icon: <Target size={14} />, label: 'Accuracy', value: results ? `${results.accuracy}%` : `${accuracy}%`, color: '#10b981' },
          { icon: <Clock size={14} />, label: mode === 'time' ? 'Time Left' : 'Time', value: mode === 'time' ? `${timeLeft}s` : results ? `${results.time}s` : '—', color: '#f59e0b' },
          { icon: <Trophy size={14} />, label: 'Streak', value: streak, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label}
            className="flex flex-col items-center gap-1 p-3 bg-surface-800/60 border border-surface-700/50 rounded-xl">
            <span style={{ color: s.color }}>{s.icon}</span>
            <span className="text-xl font-black font-mono" style={{ color: 'rgb(var(--color-text-primary))' }}>{s.value}</span>
            <span className="text-[10px] text-surface-500 uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full"
          animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Text display area */}
      <AnimatePresence mode="wait">
        {phase === 'done' && results ? (
          <motion.div key="results"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-8">
            <div className="text-5xl">🏆</div>
            <h3 className="text-2xl font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>
              {results.wpm} WPM
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
              {[
                { label: 'WPM', value: results.wpm, icon: '⚡', color: '#3b82f6' },
                { label: 'Accuracy', value: `${results.accuracy}%`, icon: '🎯', color: '#10b981' },
                { label: 'Errors', value: results.errors, icon: '❌', color: '#ef4444' },
                { label: 'Time', value: `${results.time}s`, icon: '⏱', color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-surface-800/60 border border-surface-700">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-xl font-black font-mono" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-surface-500 uppercase mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="btn-primary flex items-center gap-2">
                <RotateCcw size={14} /> Try Again
              </button>
              <button onClick={() => setText(generateText(mode, WORD_COUNTS[difficulty]))}
                className="btn-ghost flex items-center gap-2">
                New Text
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative">
            {/* Text display */}
            <div
              className="relative rounded-2xl border border-surface-700 bg-surface-900 p-6 cursor-text font-mono text-lg leading-relaxed select-none"
              style={{ boxShadow: 'var(--shadow-card)' }}
              onClick={() => inputRef.current?.focus()}
            >
              {phase === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80 rounded-2xl z-10">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⌨️</div>
                    <p className="font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Click here and start typing</p>
                    <p className="text-sm text-surface-500 mt-1">to begin the test</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-0">
                {charStates.map((cs, i) => (
                  <span
                    key={i}
                    className={cn(
                      'relative transition-colors duration-75',
                      cs.char === ' ' ? 'mr-1' : '',
                      cs.state === 'correct' ? 'text-emerald-400' :
                        cs.state === 'incorrect' ? 'text-red-400 bg-red-500/15 rounded' :
                          'text-surface-500'
                    )}
                  >
                    {/* Blinking cursor */}
                    {i === currentIdx && phase === 'running' && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-brand-500 rounded-full"
                      />
                    )}
                    {cs.char === ' ' ? '\u00A0' : cs.char}
                  </span>
                ))}
              </div>
            </div>

            {/* Hidden input */}
            <input
              ref={inputRef}
              value={typed}
              onChange={handleKey}
              disabled={phase === 'done'}
              className="absolute inset-0 opacity-0 cursor-default w-full h-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Recent Results</p>
          <div className="flex gap-2 flex-wrap">
            {history.slice(1, 6).map((h, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-surface-800/50 border border-surface-700 rounded-xl text-xs">
                <span className="font-mono font-bold text-brand-400">{h.wpm} WPM</span>
                <span className="text-surface-500">{h.accuracy}% acc</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
