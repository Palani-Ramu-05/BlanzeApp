import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Image } from 'lucide-react'
import { ToolWrapper, StyledInput, Slider } from '../ToolShared'
import toast from 'react-hot-toast'

type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

export const QRCodeTool = () => {
  const [value, setValue] = useState('https://blanzeapp.onrender.com/dashboard/vaultdrop')
  const [fgColor, setFgColor] = useState('#ffffff')
  const [bgColor, setBgColor] = useState('#cc2222')
  const [level, setLevel] = useState<ErrorLevel>('M')
  const [size] = useState(240)
  const [margin, setMargin] = useState(2)
  const [maskPattern, setMaskPattern] = useState(5)
  const containerRef = useRef<HTMLDivElement>(null)

  const downloadPNG = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const svgStr = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = size * 2; canvas.height = size * 2
    const ctx = canvas.getContext('2d')!
    const img = new window.Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'qrcode.png'; a.click()
      toast.success('QR Code downloaded!')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
  }

  const downloadSVG = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'qrcode.svg'; a.click()
    URL.revokeObjectURL(url)
    toast.success('SVG downloaded!')
  }

  return (
    <ToolWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        {/* Controls */}
        <div className="space-y-4">
          <StyledInput label="Content" value={value} onChange={e => setValue(e.target.value)} placeholder="Enter URL, text, email…" />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Error Correction</label>
              <select value={level} onChange={e => setLevel(e.target.value as ErrorLevel)}
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-surface-700/60 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50">
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Padding</label>
              <select value={margin} onChange={e => setMargin(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-surface-700/60 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50">
                <option value={0}>None</option>
                <option value={1}>Minimal</option>
                <option value={2}>Medium</option>
                <option value={4}>Large</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Background Color</label>
              <div className="flex gap-2">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0" />
                <input value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 px-3 py-2 font-mono text-xs rounded-xl bg-surface-900 border border-surface-700/60 text-white focus:outline-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Foreground Color</label>
              <div className="flex gap-2">
                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0" />
                <input value={fgColor} onChange={e => setFgColor(e.target.value)} className="flex-1 px-3 py-2 font-mono text-xs rounded-xl bg-surface-900 border border-surface-700/60 text-white focus:outline-none" />
              </div>
            </div>
          </div>

          <Slider label="Mask Pattern" value={maskPattern} min={0} max={7} onChange={setMaskPattern} />
        </div>

        {/* QR Preview */}
        <div className="flex flex-col items-center gap-3">
          <div ref={containerRef} className="rounded-2xl overflow-hidden ring-1 ring-white/10">
            <QRCodeSVG value={value || ' '} size={size} bgColor={bgColor} fgColor={fgColor} level={level} marginSize={margin} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPNG}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-800 border border-surface-700/60 text-surface-300 hover:text-white hover:border-surface-600 transition-colors">
              <Download size={12} /> PNG
            </button>
            <button onClick={downloadSVG}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-800 border border-surface-700/60 text-surface-300 hover:text-white hover:border-surface-600 transition-colors">
              <Image size={12} /> SVG
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  )
}
