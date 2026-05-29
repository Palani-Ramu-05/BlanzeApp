import { useState, useEffect, useRef, useCallback } from 'react'

export type TimerState = 'idle' | 'running' | 'paused' | 'completed'

export interface CountdownTimer {
  id: string
  label: string
  duration: number     // seconds
  remaining: number    // seconds
  state: TimerState
  soundOnComplete: boolean
}

export interface Lap {
  index: number
  split: number   // ms since last lap
  total: number   // ms since start
}

export interface AlarmEntry {
  id: string
  label: string
  time: string       // "HH:MM"
  isEnabled: boolean
  repeat: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
  sound: 'chime' | 'beep' | 'bell'
  nextFire?: number  // timestamp
}

export interface IntervalPhase {
  label: string
  duration: number  // seconds
  color: string
}

// ── Countdown hook ────────────────────────────────────────────
export function useCountdowns() {
  const [timers, setTimers] = useState<CountdownTimer[]>([])
  const intervals = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  const addTimer = useCallback((label: string, duration: number) => {
    const id = crypto.randomUUID()
    setTimers(prev => [...prev, { id, label, duration, remaining: duration, state: 'idle', soundOnComplete: true }])
  }, [])

  const removeTimer = useCallback((id: string) => {
    clearInterval(intervals.current[id])
    delete intervals.current[id]
    setTimers(prev => prev.filter(t => t.id !== id))
  }, [])

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
      osc.start(); osc.stop(ctx.currentTime + 1)
    } catch {}
  }, [])

  const start = useCallback((id: string) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, state: 'running' } : t
    ))
    if (intervals.current[id]) clearInterval(intervals.current[id])
    intervals.current[id] = setInterval(() => {
      setTimers(prev => prev.map(t => {
        if (t.id !== id || t.state !== 'running') return t
        const next = t.remaining - 1
        if (next <= 0) {
          clearInterval(intervals.current[id])
          delete intervals.current[id]
          return { ...t, remaining: 0, state: 'completed' }
        }
        return { ...t, remaining: next }
      }))
    }, 1000)
  }, [])

  const pause = useCallback((id: string) => {
    clearInterval(intervals.current[id])
    delete intervals.current[id]
    setTimers(prev => prev.map(t => t.id === id ? { ...t, state: 'paused' } : t))
  }, [])

  const reset = useCallback((id: string) => {
    clearInterval(intervals.current[id])
    delete intervals.current[id]
    setTimers(prev => prev.map(t => t.id === id ? { ...t, remaining: t.duration, state: 'idle' } : t))
  }, [])

  const addTime = useCallback((id: string, seconds: number) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, remaining: Math.max(0, t.remaining + seconds), state: t.state === 'completed' ? 'running' : t.state } : t
    ))
  }, [])

  // Play sound when timer completes
  useEffect(() => {
    timers.forEach(t => {
      if (t.state === 'completed' && t.soundOnComplete) playBeep()
    })
  }, [timers.map(t => t.state).join(',')]) // eslint-disable-line

  useEffect(() => () => {
    Object.values(intervals.current).forEach(clearInterval)
  }, [])

  return { timers, addTimer, removeTimer, start, pause, reset, addTime }
}

// ── Stopwatch hook ────────────────────────────────────────────
export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0) // ms
  const [isRunning, setIsRunning] = useState(false)
  const [laps, setLaps] = useState<Lap[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const baseRef = useRef(0)
  const lastLapRef = useRef(0)

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - baseRef.current
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 10)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    baseRef.current = elapsed
    setIsRunning(false)
  }, [elapsed])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setElapsed(0); setIsRunning(false); setLaps([])
    baseRef.current = 0; lastLapRef.current = 0
  }, [])

  const lap = useCallback(() => {
    const split = elapsed - lastLapRef.current
    lastLapRef.current = elapsed
    setLaps(prev => [...prev, { index: prev.length + 1, split, total: elapsed }])
  }, [elapsed])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return { elapsed, isRunning, laps, start, pause, reset, lap }
}

// ── Interval timer hook ───────────────────────────────────────
export function useIntervalTimer(phases: IntervalPhase[], rounds: number) {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [roundIdx, setRoundIdx] = useState(0)
  const [remaining, setRemaining] = useState(phases[0]?.duration ?? 0)
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const playTone = useCallback((freq: number) => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }, [])

  const tick = useCallback(() => {
    setRemaining(prev => {
      if (prev > 1) return prev - 1
      // Advance phase
      setPhaseIdx(pi => {
        const nextPi = (pi + 1) % phases.length
        if (nextPi === 0) {
          setRoundIdx(ri => {
            if (ri + 1 >= rounds) {
              setIsRunning(false); setIsDone(true)
              if (intervalRef.current) clearInterval(intervalRef.current)
              playTone(660)
              return ri
            }
            playTone(880)
            return ri + 1
          })
        } else {
          playTone(660)
        }
        setRemaining(phases[nextPi]?.duration ?? 0)
        return nextPi
      })
      return prev
    })
  }, [phases, rounds, playTone])

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(tick, 1000)
    setIsRunning(true); setIsDone(false)
  }, [tick])

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false); setIsDone(false)
    setPhaseIdx(0); setRoundIdx(0)
    setRemaining(phases[0]?.duration ?? 0)
  }, [phases])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return {
    phaseIdx,
    roundIdx,
    remaining,
    isRunning,
    isDone,
    currentPhase: phases[phaseIdx],
    start,
    pause,
    reset,
  }
}
