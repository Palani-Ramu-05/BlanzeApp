import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Bell, BellOff, Clock } from 'lucide-react'
import { cn } from '@utils/index'

interface Alarm {
  id: string
  label: string
  time: string
  isEnabled: boolean
  repeat: string[]
  sound: 'chime' | 'beep' | 'bell'
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const STORAGE_KEY = 'blanze_alarms'

function loadAlarms(): Alarm[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function playAlarmSound(type: Alarm['sound']) {
  try {
    const ctx = new AudioContext()
    const frequencies = type === 'beep' ? [880] : type === 'bell' ? [523, 659, 784] : [440, 554, 659]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.3 + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.8)
      osc.start(ctx.currentTime + i * 0.3)
      osc.stop(ctx.currentTime + i * 0.3 + 0.8)
    })
  } catch {}
}

export function AlarmManager() {
  const [alarms, setAlarms] = useState<Alarm[]>(loadAlarms)
  const [showAdd, setShowAdd] = useState(false)
  const [newAlarm, setNewAlarm] = useState<Omit<Alarm, 'id'>>({
    label: '', time: '08:00', isEnabled: true, repeat: [], sound: 'chime'
  })
  const [firedIds, setFiredIds] = useState<Set<string>>(new Set())

  // Persist
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms)) }, [alarms])

  // Check alarms every 10s
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const dayIdx = (now.getDay() + 6) % 7 // 0=mon
      alarms.forEach(a => {
        if (!a.isEnabled) return
        if (a.time !== hhmm) return
        const key = `${a.id}-${hhmm}`
        if (firedIds.has(key)) return
        if (a.repeat.length === 0 || a.repeat.includes(DAYS[dayIdx])) {
          playAlarmSound(a.sound)
          setFiredIds(prev => new Set([...prev, key]))
          if (Notification.permission === 'granted') {
            new Notification(`⏰ ${a.label || 'Alarm'}`, { body: `It's ${a.time}`, icon: '/favicon.ico' })
          }
        }
      })
    }
    check()
    const id = setInterval(check, 10000)
    return () => clearInterval(id)
  }, [alarms, firedIds])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission()
  }, [])

  const addAlarm = () => {
    setAlarms(prev => [...prev, { ...newAlarm, id: crypto.randomUUID() }])
    setNewAlarm({ label: '', time: '08:00', isEnabled: true, repeat: [], sound: 'chime' })
    setShowAdd(false)
  }

  const toggle = (id: string) =>
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, isEnabled: !a.isEnabled } : a))

  const remove = (id: string) =>
    setAlarms(prev => prev.filter(a => a.id !== id))

  const toggleRepeatDay = (day: string) =>
    setNewAlarm(prev => ({
      ...prev,
      repeat: prev.repeat.includes(day) ? prev.repeat.filter(d => d !== day) : [...prev.repeat, day]
    }))

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>Alarms</h3>
          <p className="text-xs text-surface-500 mt-0.5">{alarms.filter(a => a.isEnabled).length} active</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="btn-primary flex items-center gap-2 py-2 px-3 text-xs">
          <Plus size={14} /> New Alarm
        </button>
      </div>

      {/* Add alarm form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-800/60 border border-surface-700 rounded-2xl p-4 flex flex-col gap-3">
              <h4 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>New Alarm</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-surface-400 mb-1 block">Label</label>
                  <input value={newAlarm.label} onChange={e => setNewAlarm(p => ({ ...p, label: e.target.value }))}
                    placeholder="Wake up..." className="input-base text-sm" />
                </div>
                <div>
                  <label className="text-xs text-surface-400 mb-1 block">Time</label>
                  <input type="time" value={newAlarm.time} onChange={e => setNewAlarm(p => ({ ...p, time: e.target.value }))}
                    className="input-base text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-surface-400 mb-1.5 block">Repeat</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((d, i) => (
                    <button key={d} onClick={() => toggleRepeatDay(d)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-xs font-bold transition-all',
                        newAlarm.repeat.includes(d)
                          ? 'bg-brand-600 text-white border border-brand-500'
                          : 'bg-surface-700 text-surface-400 border border-surface-600 hover:text-white'
                      )}>
                      {DAY_LABELS[i]}
                    </button>
                  ))}
                  <span className="text-xs text-surface-500 self-center ml-1">
                    {newAlarm.repeat.length === 0 ? 'Once' : newAlarm.repeat.length === 7 ? 'Every day' : 'Custom'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-surface-400 mb-1.5 block">Sound</label>
                <div className="flex gap-2">
                  {(['chime', 'beep', 'bell'] as const).map(s => (
                    <button key={s} onClick={() => setNewAlarm(p => ({ ...p, sound: s }))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border',
                        newAlarm.sound === s
                          ? 'bg-brand-600/20 text-brand-400 border-brand-500/50'
                          : 'bg-surface-700 text-surface-400 border-surface-600 hover:text-white'
                      )}>
                      {s}
                    </button>
                  ))}
                  <button onClick={() => playAlarmSound(newAlarm.sound)}
                    className="px-2 py-1.5 rounded-lg text-xs text-surface-400 hover:text-white border border-surface-600 hover:border-surface-500 transition-all">
                    Preview ▶
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={addAlarm} className="btn-primary flex-1 py-2 text-sm">Add Alarm</button>
                <button onClick={() => setShowAdd(false)} className="btn-ghost py-2 text-sm">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alarm list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {alarms.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-3">
                <Bell size={28} className="text-surface-500" />
              </div>
              <p className="text-surface-300 font-medium">No alarms set</p>
              <p className="text-surface-500 text-sm mt-1">Click "New Alarm" to add one</p>
            </motion.div>
          ) : (
            alarms.map(a => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border transition-all',
                  a.isEnabled
                    ? 'bg-surface-800/60 border-surface-700 hover:border-surface-600'
                    : 'bg-surface-800/20 border-surface-700/40 opacity-60'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-mono font-black" style={{ color: a.isEnabled ? 'rgb(var(--color-text-primary))' : 'rgb(var(--color-text-secondary))' }}>
                      {a.time}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>{a.label || 'Alarm'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {a.repeat.length === 0 ? (
                          <span className="text-xs text-surface-500 flex items-center gap-1">
                            <Clock size={10} /> Once
                          </span>
                        ) : (
                          a.repeat.map(d => (
                            <span key={d} className="text-[10px] font-bold text-brand-400 uppercase">{d}</span>
                          ))
                        )}
                        <span className="text-xs text-surface-600 ml-1 capitalize">• {a.sound}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(a.id)}
                    className={cn(
                      'w-12 h-6 rounded-full border transition-all relative',
                      a.isEnabled ? 'bg-brand-600 border-brand-500' : 'bg-surface-700 border-surface-600'
                    )}>
                    <motion.div animate={{ x: a.isEnabled ? 24 : 2 }}
                      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                  </button>
                  <button onClick={() => remove(a.id)}
                    className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 transition-all flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
