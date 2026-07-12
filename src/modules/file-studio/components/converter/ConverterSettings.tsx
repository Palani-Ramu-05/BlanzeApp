import { useState } from 'react'
import { SettingsPanel } from '../ui/SettingsPanel'
import { Button } from '@components/Button'
import { CONVERTER_PAIRS, type ConversionType } from '../../dto/converter.dto'

interface ConverterSettingsProps {
  onConvert: (conversionType: ConversionType) => void
  disabled?: boolean
  fileMimeType?: string
}

export const ConverterSettings = ({ onConvert, disabled, fileMimeType }: ConverterSettingsProps) => {
  const [selectedType, setSelectedType] = useState<ConversionType | null>(null)

  const imagePairs = CONVERTER_PAIRS.filter((p) => p.group === 'image')
  const dataPairs = CONVERTER_PAIRS.filter((p) => p.group === 'data')

  const isCompatible = (pair: typeof CONVERTER_PAIRS[0]) => {
    if (!fileMimeType) return true
    return fileMimeType === pair.fromFormat
  }

  return (
    <div className="space-y-6">
      <SettingsPanel title="Image Conversion">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {imagePairs.map((pair) => {
            const compatible = isCompatible(pair)
            return (
              <button
                key={pair.id}
                onClick={() => setSelectedType(pair.id)}
                disabled={disabled || !compatible}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selectedType === pair.id
                    ? 'border-brand-500/50 bg-brand-500/10'
                    : compatible
                      ? 'border-surface-700/50 bg-surface-800/30 hover:border-surface-600 hover:bg-surface-800/50'
                      : 'border-surface-700/30 bg-surface-800/10 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-surface-100">{pair.from}</span>
                  <span className="text-surface-400">→</span>
                  <span className="text-sm font-mono font-semibold text-surface-100">{pair.to}</span>
                </div>
              </button>
            )
          })}
        </div>
      </SettingsPanel>

      <SettingsPanel title="Data Conversion">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {dataPairs.map((pair) => {
            const compatible = isCompatible(pair)
            return (
              <button
                key={pair.id}
                onClick={() => setSelectedType(pair.id)}
                disabled={disabled || !compatible}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selectedType === pair.id
                    ? 'border-brand-500/50 bg-brand-500/10'
                    : compatible
                      ? 'border-surface-700/50 bg-surface-800/30 hover:border-surface-600 hover:bg-surface-800/50'
                      : 'border-surface-700/30 bg-surface-800/10 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-surface-100">{pair.from}</span>
                  <span className="text-surface-400">→</span>
                  <span className="text-sm font-mono font-semibold text-surface-100">{pair.to}</span>
                </div>
              </button>
            )
          })}
        </div>
      </SettingsPanel>

      {selectedType && (
        <Button size="sm" onClick={() => onConvert(selectedType)} disabled={disabled} fullWidth>
          Convert File
        </Button>
      )}
    </div>
  )
}
