export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }

export function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  if (full.length !== 6) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
    else if (max === gn) h = ((bn - rn) / d + 2) / 6
    else h = ((rn - gn) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

export function rgbToHwb({ r, g, b }: RGB) {
  const { h } = rgbToHsl({ r, g, b })
  const w = Math.round(Math.min(r, g, b) / 255 * 100)
  const bk = Math.round((1 - Math.max(r, g, b) / 255) * 100)
  return { h, w, b: bk }
}

export function rgbToCmyk({ r, g, b }: RGB) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round((1 - rn - k) / (1 - k) * 100),
    m: Math.round((1 - gn - k) / (1 - k) * 100),
    y: Math.round((1 - bn - k) / (1 - k) * 100),
    k: Math.round(k * 100),
  }
}

export function isValidHex(hex: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
}

export function getLuminance({ r, g, b }: RGB): number {
  return [r, g, b].reduce((sum, v, i) => {
    const s = v / 255
    const lin = s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    return sum + lin * [0.2126, 0.7152, 0.0722][i]
  }, 0)
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const r1 = hexToRgb(hex1), r2 = hexToRgb(hex2)
  if (!r1 || !r2) return 1
  const l1 = getLuminance(r1), l2 = getLuminance(r2)
  return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2)
}

export function generateTints(hex: string, count: number): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return []
  const hsl = rgbToHsl(rgb)
  return Array.from({ length: count }, (_, i) => {
    const l = hsl.l + (100 - hsl.l) * ((i + 1) / (count + 1))
    return rgbToHex(hslToRgb({ ...hsl, l: Math.round(l) }))
  })
}

export function generateShades(hex: string, count: number): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return []
  const hsl = rgbToHsl(rgb)
  return Array.from({ length: count }, (_, i) => {
    const l = hsl.l * (1 - (i + 1) / (count + 1))
    return rgbToHex(hslToRgb({ ...hsl, l: Math.round(l) }))
  })
}

export function generateHues(hex: string, count: number): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return []
  const hsl = rgbToHsl(rgb)
  return Array.from({ length: count }, (_, i) => {
    const h = (hsl.h + (360 / count) * i) % 360
    return rgbToHex(hslToRgb({ ...hsl, h: Math.round(h) }))
  })
}

export function generateAnalogous(hex: string): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return [hex]
  const hsl = rgbToHsl(rgb)
  return [-30, -15, 0, 15, 30].map(offset =>
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + offset + 360) % 360 }))
  )
}

export function generateComplementary(hex: string): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return [hex]
  const hsl = rgbToHsl(rgb)
  return [hex, rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 }))]
}

export function generateTriadic(hex: string): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return [hex]
  const hsl = rgbToHsl(rgb)
  return [0, 120, 240].map(offset =>
    rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + offset) % 360 }))
  )
}

export function generateTransparentSteps(hex: string, steps: number): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return []
  return Array.from({ length: steps }, (_, i) => {
    const alpha = +((i + 1) / steps).toFixed(2)
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
  })
}

export function mixColors(hexColors: string[]): string {
  const rgbs = hexColors.map(h => hexToRgb(h)).filter(Boolean) as RGB[]
  if (!rgbs.length) return '#000000'
  return rgbToHex({
    r: Math.round(rgbs.reduce((s, c) => s + c.r, 0) / rgbs.length),
    g: Math.round(rgbs.reduce((s, c) => s + c.g, 0) / rgbs.length),
    b: Math.round(rgbs.reduce((s, c) => s + c.b, 0) / rgbs.length),
  })
}
