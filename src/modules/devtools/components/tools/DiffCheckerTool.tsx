import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ToolWrapper } from '../ToolShared'
import { computeDiff, getDiffStats } from '../../utils/diffUtils'
import { cn } from '@utils/index'

const SAMPLE_A = `This is the original text. You can edit it here.
ZXCZZ`
const SAMPLE_B = `This is the modified text. You can edit it here.
ZXCZZZ5`

export const DiffCheckerTool = () => {
  const [left, setLeft] = useState(SAMPLE_A)
  const [right, setRight] = useState(SAMPLE_B)

  const stats = useMemo(() => getDiffStats(left, right), [left, right])
  const diff = useMemo(() => computeDiff(left, right), [left, right])

  const leftLines = diff.filter(d => d.type !== 'added')
  const rightLines = diff.filter(d => d.type !== 'removed')

  return (
    <ToolWrapper>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 px-4 py-3 bg-surface-800/60 border border-surface-700/40 rounded-xl">
        {[
          { label: 'Lines', val: `${stats.linesA} → ${stats.linesB}`, sub: stats.linesB !== stats.linesA ? (stats.linesB > stats.linesA ? `+${stats.linesB - stats.linesA}` : `${stats.linesB - stats.linesA}`) : '=' },
          { label: 'Words', val: `${stats.wordsA} → ${stats.wordsB}` },
          { label: 'Characters', val: `${stats.charsA} → ${stats.charsB}`, sub: stats.charsB !== stats.charsA ? (stats.charsB > stats.charsA ? `+${stats.charsB - stats.charsA}` : `${stats.charsB - stats.charsA}`) : undefined },
        ].map(s => (
          <div key={s.label} className="space-y-0.5">
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-black text-white">{s.val}</p>
            {s.sub && <p className={cn('text-[10px] font-bold', s.sub.startsWith('+') ? 'text-red-400' : s.sub.startsWith('-') ? 'text-green-400' : 'text-surface-500')}>{s.sub}</p>}
          </div>
        ))}
        <div className="space-y-0.5 ml-auto">
          <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Similarity</p>
          <p className="text-sm font-black text-brand-400">{stats.similarity}%</p>
        </div>
      </div>

      {/* Input section label */}
      <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">INPUT / OUTPUT</p>

      {/* Split diff view */}
      <div className="grid grid-cols-2 gap-0 rounded-xl border border-surface-700/60 overflow-hidden">
        {/* Left - original */}
        <div className="border-r border-surface-700/60">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-800/80 border-b border-surface-700/40">
            <div className="w-2 h-2 rounded-full bg-surface-500" />
            <span className="text-[10px] font-bold text-surface-400">ORIGINAL</span>
          </div>
          <textarea
            value={left}
            onChange={e => setLeft(e.target.value)}
            className="w-full bg-transparent px-3 py-2.5 font-mono text-xs text-surface-200 resize-none focus:outline-none min-h-[120px]"
            spellCheck={false}
          />
          <div className="border-t border-surface-700/40">
            {leftLines.map((line, i) => (
              <div key={i} className={cn('flex items-start gap-2 px-3 py-0.5 font-mono text-[11px] leading-5',
                line.type === 'removed' ? 'bg-red-500/12 text-red-300' : 'text-surface-300')}>
                <span className="text-surface-600 w-5 text-right flex-shrink-0 select-none">{line.lineNumL}</span>
                <span className="flex-1 break-all">{line.type === 'removed' ? '- ' : '  '}{line.content}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right - modified */}
        <div>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-800/80 border-b border-surface-700/40">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-[10px] font-bold text-surface-400">MODIFIED</span>
          </div>
          <textarea
            value={right}
            onChange={e => setRight(e.target.value)}
            className="w-full bg-transparent px-3 py-2.5 font-mono text-xs text-surface-200 resize-none focus:outline-none min-h-[120px]"
            spellCheck={false}
          />
          <div className="border-t border-surface-700/40">
            {rightLines.map((line, i) => (
              <div key={i} className={cn('flex items-start gap-2 px-3 py-0.5 font-mono text-[11px] leading-5',
                line.type === 'added' ? 'bg-green-500/12 text-green-300' : 'text-surface-300')}>
                <span className="text-surface-600 w-5 text-right flex-shrink-0 select-none">{line.lineNumR}</span>
                <span className="flex-1 break-all">{line.type === 'added' ? '+ ' : '  '}{line.content}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolWrapper>
  )
}
