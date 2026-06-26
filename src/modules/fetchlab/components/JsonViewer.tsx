import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@utils/index'

// ── Type-based color tokens ────────────────────────────────────
const COLOR = {
  key:     'text-sky-300',
  string:  'text-green-300',
  number:  'text-orange-300',
  boolean: 'text-amber-300',
  null:    'text-surface-500',
  brace:   'text-surface-400',
  index:   'text-surface-500',
}

interface JsonNodeProps {
  data: unknown
  depth?: number
  isLast?: boolean
  label?: string | number | null
}

function JsonNode({ data, depth = 0, isLast = true, label = null }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2)

  const indent = depth * 16

  const labelEl = label !== null
    ? typeof label === 'number'
      ? <span className={COLOR.index}>{label}: </span>
      : <span className={COLOR.key}>"{label}": </span>
    : null

  // null
  if (data === null) {
    return (
      <div style={{ paddingLeft: indent }} className="flex items-baseline gap-1 leading-relaxed">
        {labelEl}
        <span className={COLOR.null}>null</span>
        {!isLast && <span className={COLOR.brace}>,</span>}
      </div>
    )
  }

  // boolean
  if (typeof data === 'boolean') {
    return (
      <div style={{ paddingLeft: indent }} className="flex items-baseline gap-1 leading-relaxed">
        {labelEl}
        <span className={COLOR.boolean}>{String(data)}</span>
        {!isLast && <span className={COLOR.brace}>,</span>}
      </div>
    )
  }

  // number
  if (typeof data === 'number') {
    return (
      <div style={{ paddingLeft: indent }} className="flex items-baseline gap-1 leading-relaxed">
        {labelEl}
        <span className={COLOR.number}>{data}</span>
        {!isLast && <span className={COLOR.brace}>,</span>}
      </div>
    )
  }

  // string
  if (typeof data === 'string') {
    return (
      <div style={{ paddingLeft: indent }} className="flex items-baseline gap-1 leading-relaxed">
        {labelEl}
        <span className={cn(COLOR.string, 'break-all')}>"{data}"</span>
        {!isLast && <span className={COLOR.brace}>,</span>}
      </div>
    )
  }

  // array
  if (Array.isArray(data)) {
    const isEmpty = data.length === 0
    return (
      <div>
        <div style={{ paddingLeft: indent }} className="flex items-center gap-0.5 leading-relaxed select-none">
          {!isEmpty && (
            <button onClick={() => setExpanded((e) => !e)}
              className="flex-shrink-0 text-surface-500 hover:text-surface-300 transition-colors">
              <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
            </button>
          )}
          {labelEl}
          <span className={COLOR.brace}>[</span>
          {!expanded || isEmpty
            ? <>
                <span className="text-surface-500 text-[10px] px-1">{isEmpty ? '' : `${data.length} items`}</span>
                <span className={COLOR.brace}>]</span>
                {!isLast && <span className={COLOR.brace}>,</span>}
              </>
            : null
          }
        </div>
        {expanded && !isEmpty && (
          <div>
            {data.map((item, i) => (
              <JsonNode key={i} data={item} depth={depth + 1} isLast={i === data.length - 1} label={i} />
            ))}
            <div style={{ paddingLeft: indent }} className="flex items-center leading-relaxed">
              <span className={COLOR.brace}>]</span>
              {!isLast && <span className={COLOR.brace}>,</span>}
            </div>
          </div>
        )}
      </div>
    )
  }

  // object
  if (typeof data === 'object') {
    const keys = Object.keys(data as object)
    const isEmpty = keys.length === 0
    return (
      <div>
        <div style={{ paddingLeft: indent }} className="flex items-center gap-0.5 leading-relaxed select-none">
          {!isEmpty && (
            <button onClick={() => setExpanded((e) => !e)}
              className="flex-shrink-0 text-surface-500 hover:text-surface-300 transition-colors">
              <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
            </button>
          )}
          {labelEl}
          <span className={COLOR.brace}>{'{'}</span>
          {!expanded || isEmpty
            ? <>
                <span className="text-surface-500 text-[10px] px-1">{isEmpty ? '' : `${keys.length} keys`}</span>
                <span className={COLOR.brace}>{'}'}</span>
                {!isLast && <span className={COLOR.brace}>,</span>}
              </>
            : null
          }
        </div>
        {expanded && !isEmpty && (
          <div>
            {keys.map((k, i) => (
              <JsonNode key={k} data={(data as Record<string, unknown>)[k]} depth={depth + 1} isLast={i === keys.length - 1} label={k} />
            ))}
            <div style={{ paddingLeft: indent }} className="flex items-center leading-relaxed">
              <span className={COLOR.brace}>{'}'}</span>
              {!isLast && <span className={COLOR.brace}>,</span>}
            </div>
          </div>
        )}
      </div>
    )
  }

  return <span className="text-surface-400 text-xs">{String(data)}</span>
}

// ── Public component ───────────────────────────────────────────
interface JsonViewerProps {
  data: unknown
  className?: string
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  return (
    <div className={cn('text-[12px] font-mono leading-relaxed', className)}>
      <JsonNode data={data} depth={0} isLast />
    </div>
  )
}
