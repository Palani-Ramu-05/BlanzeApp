import { useState, useCallback, memo } from 'react'
import { SettingsPanel, SettingRow, Slider } from '../ui/SettingsPanel'
import { Button } from '@components/Button'
import { Input } from '@components/Input'
import { CropSelector } from './CropSelector'
import { WatermarkPanel } from './WatermarkPanel'
import {
  ImageOperation,
  type ImageCompressOptions,
  type ImageResizeOptions,
  type ImageCropOptions,
  type ImageRotateOptions,
  type ImageFlipOptions,
  type ImageConvertOptions,
  type ImageWatermarkOptions,
} from '../../dto/image.dto'
import type { FileDetails } from '../../dto/common'

interface ImageOperationsProps {
  onOperation: (operation: ImageOperation, options: unknown) => void
  disabled?: boolean
  imageUrl?: string | null
  imageFile?: File | null
  createPreviewUrl?: (blob: Blob) => string
  fileDetails?: FileDetails | null
}

export const ImageOperations = memo(function ImageOperations({
  onOperation,
  disabled,
  imageUrl,
}: ImageOperationsProps) {
  const [activeOp, setActiveOp] = useState<ImageOperation | null>(null)

  const [compressOpts, setCompressOpts] = useState<ImageCompressOptions>({ quality: 80, format: 'jpeg' })
  const [resizeOpts, setResizeOpts] = useState<ImageResizeOptions>({ width: 800, height: 600, maintainAspectRatio: true })
  const [cropOpts, setCropOpts] = useState<ImageCropOptions>({ x: 0, y: 0, width: 500, height: 500 })
  const [rotateOpts, setRotateOpts] = useState<ImageRotateOptions>({ angle: 90 })
  const [flipOpts, setFlipOpts] = useState<ImageFlipOptions>({ direction: 'horizontal' })
  const [convertOpts, setConvertOpts] = useState<ImageConvertOptions>({ targetFormat: 'png', quality: 90 })

  const operations = [
    { id: ImageOperation.Compress, label: 'Compress', icon: '📦' },
    { id: ImageOperation.Resize, label: 'Resize', icon: '📐' },
    { id: ImageOperation.Crop, label: 'Crop', icon: '✂️' },
    { id: ImageOperation.Rotate, label: 'Rotate', icon: '🔄' },
    { id: ImageOperation.Flip, label: 'Flip', icon: '↔️' },
    { id: ImageOperation.Convert, label: 'Convert Format', icon: '🔀' },
    { id: ImageOperation.Watermark, label: 'Watermark', icon: '💧' },
  ]

  const handleApply = useCallback(() => {
    if (!activeOp) return
    switch (activeOp) {
      case ImageOperation.Compress:
        onOperation(activeOp, compressOpts)
        break
      case ImageOperation.Resize:
        onOperation(activeOp, resizeOpts)
        break
      case ImageOperation.Crop:
        onOperation(activeOp, cropOpts)
        break
      case ImageOperation.Rotate:
        onOperation(activeOp, rotateOpts)
        break
      case ImageOperation.Flip:
        onOperation(activeOp, flipOpts)
        break
      case ImageOperation.Convert:
        onOperation(activeOp, convertOpts)
        break
    }
  }, [activeOp, compressOpts, resizeOpts, cropOpts, rotateOpts, flipOpts, convertOpts, onOperation])

  const handleWatermarkApply = useCallback(
    (options: ImageWatermarkOptions) => {
      onOperation(ImageOperation.Watermark, options)
    },
    [onOperation],
  )

  const renderOptions = () => {
    switch (activeOp) {
      case ImageOperation.Compress:
        return (
          <div className="space-y-4">
            <SettingRow label="Quality" description="Lower = smaller file">
              <Slider value={compressOpts.quality} onChange={(v) => setCompressOpts({ ...compressOpts, quality: v })} min={1} max={100} label="Quality" />
            </SettingRow>
            <SettingRow label="Format">
              <select
                value={compressOpts.format}
                onChange={(e) => setCompressOpts({ ...compressOpts, format: e.target.value as ImageCompressOptions['format'] })}
                className="input-base text-sm"
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WEBP</option>
              </select>
            </SettingRow>
          </div>
        )

      case ImageOperation.Resize:
        return (
          <div className="space-y-4">
            <SettingRow label="Width">
              <Input type="number" value={resizeOpts.width} onChange={(e) => setResizeOpts({ ...resizeOpts, width: Number(e.target.value) })} />
            </SettingRow>
            <SettingRow label="Height">
              <Input type="number" value={resizeOpts.height} onChange={(e) => setResizeOpts({ ...resizeOpts, height: Number(e.target.value) })} />
            </SettingRow>
            <SettingRow label="Maintain aspect ratio">
              <input
                type="checkbox"
                checked={resizeOpts.maintainAspectRatio}
                onChange={(e) => setResizeOpts({ ...resizeOpts, maintainAspectRatio: e.target.checked })}
                className="accent-brand-500"
              />
            </SettingRow>
          </div>
        )

      case ImageOperation.Crop:
        return imageUrl ? (
          <div className="space-y-3">
            <p className="text-xs text-surface-400">
              Click and drag on the image to select the region to crop. Coordinates auto-calculate.
            </p>
            <CropSelector imageUrl={imageUrl} onCropChange={setCropOpts} />
          </div>
        ) : (
          <p className="text-xs text-surface-400">Upload an image to enable crop selection.</p>
        )

      case ImageOperation.Rotate:
        return (
          <div className="space-y-4">
            <SettingRow label="Angle">
              <Slider value={rotateOpts.angle} onChange={(v) => setRotateOpts({ ...rotateOpts, angle: v })} min={0} max={360} step={90} label="Angle" />
            </SettingRow>
            <div className="flex gap-2">
              {[90, 180, 270].map((a) => (
                <Button key={a} size="xs" variant={rotateOpts.angle === a ? 'primary' : 'secondary'} onClick={() => setRotateOpts({ ...rotateOpts, angle: a })}>
                  {a}°
                </Button>
              ))}
            </div>
          </div>
        )

      case ImageOperation.Flip:
        return (
          <div className="flex gap-2">
            <Button size="sm" variant={flipOpts.direction === 'horizontal' ? 'primary' : 'secondary'} onClick={() => setFlipOpts({ direction: 'horizontal' })}>
              Horizontal
            </Button>
            <Button size="sm" variant={flipOpts.direction === 'vertical' ? 'primary' : 'secondary'} onClick={() => setFlipOpts({ direction: 'vertical' })}>
              Vertical
            </Button>
          </div>
        )

      case ImageOperation.Convert:
        return (
          <div className="space-y-4">
            <SettingRow label="Target Format">
              <select
                value={convertOpts.targetFormat}
                onChange={(e) => setConvertOpts({ ...convertOpts, targetFormat: e.target.value as ImageConvertOptions['targetFormat'] })}
                className="input-base text-sm"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WEBP</option>
                <option value="avif">AVIF</option>
              </select>
            </SettingRow>
            <SettingRow label="Quality">
              <Slider value={convertOpts.quality || 90} onChange={(v) => setConvertOpts({ ...convertOpts, quality: v })} min={1} max={100} label="Quality" />
            </SettingRow>
          </div>
        )

      case ImageOperation.Watermark:
        return imageUrl ? (
          <WatermarkPanel imageUrl={imageUrl} onApply={handleWatermarkApply} disabled={disabled} />
        ) : (
          <p className="text-xs text-surface-400">Upload an image to add watermarks.</p>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {operations.map((op) => (
          <Button
            key={op.id}
            size="sm"
            variant={activeOp === op.id ? 'primary' : 'secondary'}
            onClick={() => setActiveOp(op.id)}
            disabled={disabled}
          >
            <span className="mr-1">{op.icon}</span>
            {op.label}
          </Button>
        ))}
      </div>

      {activeOp && activeOp !== ImageOperation.Watermark && (
        <SettingsPanel title={operations.find((o) => o.id === activeOp)?.label || ''}>
          {renderOptions()}
          <div className="pt-3 border-t border-surface-700/30">
            <Button size="sm" onClick={handleApply} disabled={disabled} fullWidth>
              Apply {operations.find((o) => o.id === activeOp)?.label}
            </Button>
          </div>
        </SettingsPanel>
      )}

      {activeOp === ImageOperation.Watermark && renderOptions()}
    </div>
  )
})
