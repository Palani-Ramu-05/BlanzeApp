import { useState, useRef, useCallback, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { Type, Image as ImageIcon, Eraser, Move } from 'lucide-react'
import { SettingsPanel, SettingRow, Slider } from '../ui/SettingsPanel'
import { Button } from '@components/Button'
import { Input } from '@components/Input'
import { cn } from '@utils/index'
import type { WatermarkMode, ImageWatermarkOptions } from '../../dto/image.dto'

interface WatermarkPanelProps {
  imageUrl: string
  onApply: (options: ImageWatermarkOptions) => void
  disabled?: boolean
  className?: string
}

const FONTS = [
  'Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New',
  'Trebuchet MS', 'Impact', 'Comic Sans MS',
]

const POSITIONS = [
  { id: 'top-left', label: 'TL' },
  { id: 'top-center', label: 'TC' },
  { id: 'top-right', label: 'TR' },
  { id: 'center-left', label: 'CL' },
  { id: 'center', label: 'C' },
  { id: 'center-right', label: 'CR' },
  { id: 'bottom-left', label: 'BL' },
  { id: 'bottom-center', label: 'BC' },
  { id: 'bottom-right', label: 'BR' },
] as const

const PositionGrid = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="grid grid-cols-3 gap-1">
    {POSITIONS.map((p) => (
      <button
        key={p.id}
        onClick={() => onChange(p.id)}
        className={cn(
          'px-1 py-1.5 rounded text-[10px] font-mono font-semibold transition-all border',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
          value === p.id
            ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
            : 'bg-surface-800/50 text-surface-400 border-surface-700/50 hover:bg-surface-700/50 hover:text-surface-200',
        )}
      >
        {p.label}
      </button>
    ))}
  </div>
)

export const WatermarkPanel = memo(function WatermarkPanel({ imageUrl, onApply, disabled, className }: WatermarkPanelProps) {
  const [mode, setMode] = useState<WatermarkMode>('add-text')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const wmImageRef = useRef<HTMLImageElement>(null)

  const [text, setText] = useState('© BlanzeApp')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontSize, setFontSize] = useState(36)
  const [fontColor, setFontColor] = useState('#ffffff')
  const [opacity, setOpacity] = useState(0.5)
  const [angle, setAngle] = useState(0)
  const [spacing, setSpacing] = useState(0)
  const [repeat, setRepeat] = useState<'single' | 'multiple'>('single')
  const [position, setPosition] = useState<string>('bottom-right')
  const [scale, setScale] = useState(1)

  const [wmFile, setWmFile] = useState<File | null>(null)
  const [eraseCrop, setEraseCrop] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [drawing, setDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cw = canvas.width
    const ch = canvas.height

    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, 0, 0, cw, ch)

    if (mode === 'add-text' && text.trim()) {
      ctx.save()
      ctx.globalAlpha = opacity

      let posX = 20
      let posY = 40

      switch (position) {
        case 'top-left': posX = 20; posY = fontSize + 10; break
        case 'top-center': posX = cw / 2; posY = fontSize + 10; ctx.textAlign = 'center'; break
        case 'top-right': posX = cw - 20; posY = fontSize + 10; ctx.textAlign = 'right'; break
        case 'center-left': posX = 20; posY = ch / 2; break
        case 'center': posX = cw / 2; posY = ch / 2; ctx.textAlign = 'center'; break
        case 'center-right': posX = cw - 20; posY = ch / 2; ctx.textAlign = 'right'; break
        case 'bottom-left': posX = 20; posY = ch - 20; break
        case 'bottom-center': posX = cw / 2; posY = ch - 20; ctx.textAlign = 'center'; break
        case 'bottom-right': posX = cw - 20; posY = ch - 20; ctx.textAlign = 'right'; break
      }

      ctx.font = `${fontSize}px ${fontFamily}`
      ctx.fillStyle = fontColor

      if (angle !== 0) {
        ctx.translate(posX, posY)
        ctx.rotate((angle * Math.PI) / 180)
        ctx.translate(-posX, -posY)
      }

      if (repeat === 'multiple') {
        const stepY = fontSize * 3 + spacing
        const stepX = 200 + spacing * 2
        for (let y = fontSize; y < ch; y += stepY) {
          for (let x = 20; x < cw; x += stepX) {
            ctx.fillText(text, x, y)
          }
        }
      } else {
        ctx.fillText(text, posX, posY)
      }

      ctx.restore()
    }

    if (mode === 'add-image' && wmImageRef.current) {
      ctx.save()
      ctx.globalAlpha = opacity

      const wmImg = wmImageRef.current
      const wmW = wmImg.naturalWidth * scale * 0.3
      const wmH = wmImg.naturalHeight * scale * 0.3

      let posX = 20
      let posY = 20

      switch (position) {
        case 'top-left': posX = 20; posY = 20; break
        case 'top-center': posX = (cw - wmW) / 2; posY = 20; break
        case 'top-right': posX = cw - wmW - 20; posY = 20; break
        case 'center-left': posX = 20; posY = (ch - wmH) / 2; break
        case 'center': posX = (cw - wmW) / 2; posY = (ch - wmH) / 2; break
        case 'center-right': posX = cw - wmW - 20; posY = (ch - wmH) / 2; break
        case 'bottom-left': posX = 20; posY = ch - wmH - 20; break
        case 'bottom-center': posX = (cw - wmW) / 2; posY = ch - wmH - 20; break
        case 'bottom-right': posX = cw - wmW - 20; posY = ch - wmH - 20; break
      }

      if (angle !== 0) {
        ctx.translate(posX + wmW / 2, posY + wmH / 2)
        ctx.rotate((angle * Math.PI) / 180)
        ctx.translate(-(posX + wmW / 2), -(posY + wmH / 2))
      }

      if (repeat === 'multiple') {
        const stepX = wmW + 40
        const stepY = wmH + 40
        for (let y = 0; y < ch; y += stepY) {
          for (let x = 0; x < cw; x += stepX) {
            ctx.drawImage(wmImg, x, y, wmW, wmH)
          }
        }
      } else {
        ctx.drawImage(wmImg, posX, posY, wmW, wmH)
      }

      ctx.restore()
    }

    if (mode === 'remove' && (eraseCrop.width > 0 || eraseCrop.height > 0)) {
      const scaleX = cw / (img.naturalWidth || 1)
      const scaleY = ch / (img.naturalHeight || 1)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'
      ctx.fillRect(
        eraseCrop.x * scaleX,
        eraseCrop.y * scaleY,
        eraseCrop.width * scaleX,
        eraseCrop.height * scaleY,
      )
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
      ctx.lineWidth = 2
      ctx.strokeRect(
        eraseCrop.x * scaleX,
        eraseCrop.y * scaleY,
        eraseCrop.width * scaleX,
        eraseCrop.height * scaleY,
      )
    }
  }, [mode, imageUrl, text, fontFamily, fontSize, fontColor, opacity, angle, spacing, repeat, position, scale, wmFile, eraseCrop])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = Math.min(img.naturalWidth, 600)
        canvas.height = Math.min(img.naturalHeight, 400)
      }
      redraw()
    }
    img.src = imageUrl
  }, [imageUrl, redraw])

  useEffect(() => {
    redraw()
  }, [redraw])

  useEffect(() => {
    if (wmFile && mode === 'add-image') {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        wmImageRef.current = img
        redraw()
      }
      img.src = URL.createObjectURL(wmFile)
    }
  }, [wmFile, mode, redraw])

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== 'remove') return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const canvas = canvasRef.current!
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = Math.round((e.clientX - rect.left) * scaleX)
      const y = Math.round((e.clientY - rect.top) * scaleY)
      setDrawing(true)
      setStartPos({ x, y })
      setEraseCrop({ x, y, width: 0, height: 0 })
    },
    [mode],
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawing || mode !== 'remove') return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const canvas = canvasRef.current!
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = Math.round((e.clientX - rect.left) * scaleX)
      const y = Math.round((e.clientY - rect.top) * scaleY)
      setEraseCrop({
        x: Math.min(startPos.x, x),
        y: Math.min(startPos.y, y),
        width: Math.abs(x - startPos.x),
        height: Math.abs(y - startPos.y),
      })
    },
    [drawing, mode, startPos],
  )

  const handleCanvasMouseUp = useCallback(() => {
    setDrawing(false)
  }, [])

  const handleApply = useCallback(() => {
    const base: ImageWatermarkOptions = {
      mode,
      opacity,
      position: position as ImageWatermarkOptions['position'],
      scale,
    }
    if (mode === 'add-text') {
      onApply({ ...base, text, fontFamily, fontSize, fontColor, angle, spacing, repeat, image: null })
    } else if (mode === 'add-image') {
      onApply({ ...base, image: wmFile, angle, repeat })
    } else {
      onApply({ ...base, ...eraseCrop, image: null })
    }
  }, [mode, text, fontFamily, fontSize, fontColor, opacity, angle, spacing, repeat, position, scale, wmFile, eraseCrop, onApply])

  const tabs = [
    { id: 'add-text' as WatermarkMode, label: 'Add Text', icon: <Type size={14} /> },
    { id: 'add-image' as WatermarkMode, label: 'Add Image', icon: <ImageIcon size={14} /> },
    { id: 'remove' as WatermarkMode, label: 'Erase', icon: <Eraser size={14} /> },
  ]

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-1.5 rounded-lg bg-surface-800/50 border border-surface-700/50 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setMode(t.id); setEraseCrop({ x: 0, y: 0, width: 0, height: 0 }) }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              mode === t.id
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/50',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-4">
        <div className="flex-1 min-w-0 w-full">
          <div
            className="relative rounded-lg overflow-hidden border border-surface-700/50 bg-surface-900 cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <canvas ref={canvasRef} className="w-full h-auto block" />
            {mode === 'remove' && (eraseCrop.width > 0 || eraseCrop.height > 0) && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-900/80 text-[10px] text-red-300 font-mono">
                <Move size={10} />
                {eraseCrop.width} x {eraseCrop.height}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
          {mode === 'add-text' && (
            <SettingsPanel title="Text Settings">
              <SettingRow label="Text">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Watermark text" />
              </SettingRow>
              <SettingRow label="Font">
                <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="input-base text-sm">
                  {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </SettingRow>
              <SettingRow label="Size">
                <Slider value={fontSize} onChange={setFontSize} min={10} max={120} label="px" />
              </SettingRow>
              <SettingRow label="Color">
                <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer bg-surface-800 border border-surface-700" />
              </SettingRow>
            </SettingsPanel>
          )}

          {mode === 'add-image' && (
            <SettingsPanel title="Image Settings">
              <SettingRow label="Watermark Image">
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setWmFile(f) }}
                    className="text-xs text-surface-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-brand-500/10 file:text-brand-300 hover:file:bg-brand-500/20"
                  />
                  {wmFile && <span className="text-[10px] text-surface-500 truncate">{wmFile.name}</span>}
                </div>
              </SettingRow>
              <SettingRow label="Scale">
                <Slider value={Math.round(scale * 100)} onChange={(v) => setScale(v / 100)} min={10} max={500} label="%" />
              </SettingRow>
            </SettingsPanel>
          )}

          {(mode === 'add-text' || mode === 'add-image') && (
            <SettingsPanel title="Appearance">
              <SettingRow label="Opacity">
                <Slider value={Math.round(opacity * 100)} onChange={(v) => setOpacity(v / 100)} min={0} max={100} label="%" />
              </SettingRow>
              <SettingRow label="Angle">
                <Slider value={angle} onChange={setAngle} min={0} max={360} label="°" />
              </SettingRow>
              <SettingRow label="Repeat">
                <select value={repeat} onChange={(e) => setRepeat(e.target.value as 'single' | 'multiple')} className="input-base text-sm">
                  <option value="single">Single</option>
                  <option value="multiple">Multiple (tiled)</option>
                </select>
              </SettingRow>
              {mode === 'add-text' && (
                <SettingRow label="Spacing (tiled)">
                  <Slider value={spacing} onChange={setSpacing} min={0} max={100} label="px" />
                </SettingRow>
              )}
            </SettingsPanel>
          )}

          {(mode === 'add-text' || mode === 'add-image') && (
            <SettingsPanel title="Position">
              <PositionGrid value={position} onChange={setPosition} />
            </SettingsPanel>
          )}

          {mode === 'remove' && (
            <SettingsPanel title="Erase">
              <p className="text-xs text-surface-400 leading-relaxed">
                Click and drag on the image to select the area you want to erase. The background will be automatically matched after processing.
              </p>
            </SettingsPanel>
          )}

          <Button size="sm" onClick={handleApply} disabled={disabled} fullWidth>
            {mode === 'add-text' ? 'Apply Text Watermark' : mode === 'add-image' ? 'Apply Image Watermark' : 'Apply Erase'}
          </Button>
        </div>
      </div>
    </div>
  )
})
