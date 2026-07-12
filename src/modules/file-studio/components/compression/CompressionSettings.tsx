import { useState } from 'react'
import { SettingsPanel, SettingRow } from '../ui/SettingsPanel'
import { Button } from '@components/Button'
import { CompressionLevel } from '../../dto/compression.dto'

interface CompressionSettingsProps {
  onCompress: (level: CompressionLevel) => void
  disabled?: boolean
  fileSize?: number
}

const levelConfig = {
  [CompressionLevel.Low]: { label: 'Low', description: 'Minimal compression, best quality', ratio: '~20%' },
  [CompressionLevel.Medium]: { label: 'Medium', description: 'Balanced compression and quality', ratio: '~40%' },
  [CompressionLevel.High]: { label: 'High', description: 'Maximum compression, reduced quality', ratio: '~60%' },
}

export const CompressionSettings = ({ onCompress, disabled, fileSize }: CompressionSettingsProps) => {
  const [level, setLevel] = useState<CompressionLevel>(CompressionLevel.Medium)

  const config = levelConfig[level]

  const estimatedSize = fileSize ? Math.round(fileSize * (1 - parseInt(config.ratio.replace(/[^0-9]/g, '')) / 100)) : 0

  return (
    <SettingsPanel title="Compression Settings" icon={<span>⚙️</span>}>
      <div className="space-y-3">
        {Object.entries(levelConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setLevel(key as CompressionLevel)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              level === key
                ? 'border-brand-500/50 bg-brand-500/10'
                : 'border-surface-700/50 bg-surface-800/30 hover:border-surface-600 hover:bg-surface-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-surface-100">{cfg.label}</span>
              <span className="text-[11px] font-mono text-surface-400">{cfg.ratio}</span>
            </div>
            <p className="text-xs text-surface-400 mt-0.5">{cfg.description}</p>
          </button>
        ))}
      </div>

      {fileSize && (
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-surface-400">Original</span>
            <span className="font-mono text-surface-200">{(fileSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-surface-400">Estimated</span>
            <span className="font-mono text-emerald-400">~{(estimatedSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="h-2 rounded-full bg-surface-700/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${100 - parseInt(config.ratio.replace(/[^0-9]/g, ''))}%` }}
            />
          </div>
        </div>
      )}

      <div className="pt-2">
        <Button size="sm" onClick={() => onCompress(level)} disabled={disabled} fullWidth>
          Compress File
        </Button>
      </div>
    </SettingsPanel>
  )
}
