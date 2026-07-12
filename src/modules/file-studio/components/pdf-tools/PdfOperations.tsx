import { useState } from 'react'
import { SettingsPanel, SettingRow } from '../ui/SettingsPanel'
import { Button } from '@components/Button'
import { Input } from '@components/Input'
import {
  PdfOperation,
  type PdfSplitOptions,
  type PdfExtractPagesOptions,
  type PdfDeletePagesOptions,
  type PdfRotatePagesOptions,
  type PdfReorderPagesOptions,
  type PdfExtractTextOptions,
  type PdfCompressOptions,
} from '../../dto/pdf.dto'

interface PdfOperationsProps {
  onOperation: (operation: PdfOperation, options: unknown) => void
  disabled?: boolean
  hasMultipleFiles?: boolean
  onMergeFiles?: () => void
}

export const PdfOperations = ({ onOperation, disabled, hasMultipleFiles, onMergeFiles }: PdfOperationsProps) => {
  const [activeOp, setActiveOp] = useState<PdfOperation | null>(null)

  const [splitOpts, setSplitOpts] = useState<PdfSplitOptions>({ mode: 'all' })
  const [extractOpts, setExtractOpts] = useState<PdfExtractPagesOptions>({ pages: [1] })
  const [deleteOpts, setDeleteOpts] = useState<PdfDeletePagesOptions>({ pages: [1] })
  const [rotateOpts, setRotateOpts] = useState<PdfRotatePagesOptions>({ pages: [1], angle: 90 })
  const [reorderOpts, setReorderOpts] = useState<PdfReorderPagesOptions>({ order: [1, 2] })
  const [extractTextOpts, setExtractTextOpts] = useState<PdfExtractTextOptions>({ format: 'plain' })
  const [compressOpts, setCompressOpts] = useState<PdfCompressOptions>({ quality: 'medium' })
  const [pageInput, setPageInput] = useState('1')

  const parsePages = (input: string): number[] => input.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))

  const operations = [
    { id: PdfOperation.Merge, label: 'Merge', icon: '📑', requiresMultiple: true },
    { id: PdfOperation.Split, label: 'Split', icon: '🔀' },
    { id: PdfOperation.ExtractPages, label: 'Extract Pages', icon: '📄' },
    { id: PdfOperation.DeletePages, label: 'Delete Pages', icon: '🗑️' },
    { id: PdfOperation.RotatePages, label: 'Rotate Pages', icon: '🔄' },
    { id: PdfOperation.ReorderPages, label: 'Reorder Pages', icon: '↕️' },
    { id: PdfOperation.ExtractText, label: 'Extract Text', icon: '📝' },
    { id: PdfOperation.Compress, label: 'Compress', icon: '📦' },
  ]

  const handleApply = () => {
    if (!activeOp) return
    switch (activeOp) {
      case PdfOperation.Merge:
        onMergeFiles?.()
        return
      case PdfOperation.Split:
        onOperation(activeOp, splitOpts)
        break
      case PdfOperation.ExtractPages:
        onOperation(activeOp, { ...extractOpts, pages: parsePages(pageInput) })
        break
      case PdfOperation.DeletePages:
        onOperation(activeOp, { ...deleteOpts, pages: parsePages(pageInput) })
        break
      case PdfOperation.RotatePages:
        onOperation(activeOp, { ...rotateOpts, pages: parsePages(pageInput) })
        break
      case PdfOperation.ReorderPages:
        onOperation(activeOp, { ...reorderOpts, order: parsePages(pageInput) })
        break
      case PdfOperation.ExtractText:
        onOperation(activeOp, extractTextOpts)
        break
      case PdfOperation.Compress:
        onOperation(activeOp, compressOpts)
        break
    }
  }

  const renderOptions = () => {
    switch (activeOp) {
      case PdfOperation.Split:
        return (
          <div className="space-y-4">
            <SettingRow label="Mode">
              <select value={splitOpts.mode} onChange={(e) => setSplitOpts({ ...splitOpts, mode: e.target.value as PdfSplitOptions['mode'] })} className="input-base text-sm">
                <option value="all">Split all pages</option>
                <option value="range">Page range</option>
                <option value="every">Every N pages</option>
              </select>
            </SettingRow>
            {splitOpts.mode === 'range' && (
              <SettingRow label="Range (start-end)">
                <Input placeholder="e.g. 1-5" onChange={(e) => {
                  const parts = e.target.value.split('-')
                  if (parts.length === 2) setSplitOpts({ ...splitOpts, range: { start: parseInt(parts[0]), end: parseInt(parts[1]) } })
                }} />
              </SettingRow>
            )}
            {splitOpts.mode === 'every' && (
              <SettingRow label="Every N pages">
                <Input type="number" placeholder="e.g. 2" onChange={(e) => setSplitOpts({ ...splitOpts, every: parseInt(e.target.value) })} />
              </SettingRow>
            )}
          </div>
        )
      case PdfOperation.ExtractPages:
      case PdfOperation.DeletePages:
      case PdfOperation.RotatePages:
      case PdfOperation.ReorderPages:
        return (
          <div className="space-y-4">
            <SettingRow label="Page numbers">
              <Input value={pageInput} onChange={(e) => setPageInput(e.target.value)} placeholder="e.g. 1,3,5-7" />
            </SettingRow>
            {activeOp === PdfOperation.RotatePages && (
              <SettingRow label="Angle">
                <div className="flex gap-2">
                  {[90, 180, 270].map((a) => (
                    <Button key={a} size="xs" variant={rotateOpts.angle === a ? 'primary' : 'secondary'} onClick={() => setRotateOpts({ ...rotateOpts, angle: a as 90 | 180 | 270 })}>
                      {a}°
                    </Button>
                  ))}
                </div>
              </SettingRow>
            )}
          </div>
        )
      case PdfOperation.ExtractText:
        return (
          <SettingRow label="Output format">
            <select value={extractTextOpts.format} onChange={(e) => setExtractTextOpts({ ...extractTextOpts, format: e.target.value as 'plain' | 'json' })} className="input-base text-sm">
              <option value="plain">Plain Text</option>
              <option value="json">JSON</option>
            </select>
          </SettingRow>
        )
      case PdfOperation.Compress:
        return (
          <SettingRow label="Compression Level">
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((l) => (
                <Button key={l} size="xs" variant={compressOpts.quality === l ? 'primary' : 'secondary'} onClick={() => setCompressOpts({ ...compressOpts, quality: l })}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </Button>
              ))}
            </div>
          </SettingRow>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {operations.map((op) => {
          const disabledOp = op.requiresMultiple && !hasMultipleFiles
          return (
            <Button
              key={op.id}
              size="sm"
              variant={activeOp === op.id ? 'primary' : 'secondary'}
              onClick={() => {
                if (op.id === PdfOperation.Merge) {
                  onMergeFiles?.()
                } else {
                  setActiveOp(op.id)
                }
              }}
              disabled={disabled || disabledOp}
              title={disabledOp ? 'Upload multiple PDFs to merge' : op.label}
            >
              <span className="mr-1">{op.icon}</span>
              {op.label}
            </Button>
          )
        })}
      </div>

      {activeOp && activeOp !== PdfOperation.Merge && (
        <SettingsPanel title={operations.find((o) => o.id === activeOp)?.label || ''}>
          {renderOptions()}
          <div className="pt-3 border-t border-surface-700/30">
            <Button size="sm" onClick={handleApply} disabled={disabled} fullWidth>
              Apply
            </Button>
          </div>
        </SettingsPanel>
      )}
    </div>
  )
}
