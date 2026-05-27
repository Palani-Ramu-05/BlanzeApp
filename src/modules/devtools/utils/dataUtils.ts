import yaml from 'js-yaml'

export function jsonToYaml(src: string): string {
  return yaml.dump(JSON.parse(src), { indent: 2, lineWidth: 120 })
}

export function yamlToJson(src: string): string {
  return JSON.stringify(yaml.load(src), null, 2)
}

export function jsonToXml(src: string, root = 'root'): string {
  const obj = JSON.parse(src)
  function conv(data: unknown, tag: string, depth = 0): string {
    const pad = '  '.repeat(depth)
    if (data === null || data === undefined) return `${pad}<${tag}/>`
    if (typeof data !== 'object') return `${pad}<${tag}>${String(data).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</${tag}>`
    if (Array.isArray(data)) return (data as unknown[]).map(item => conv(item, tag, depth)).join('\n')
    const entries = Object.entries(data as Record<string, unknown>)
    const children = entries.map(([k, v]) => conv(v, k, depth + 1)).join('\n')
    return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${conv(obj, root)}`
}

export function xmlToJson(src: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(src, 'text/xml')
  const errNode = doc.querySelector('parsererror')
  if (errNode) throw new Error('Invalid XML: ' + (errNode.textContent || 'parse error'))
  function parseNode(el: Element): unknown {
    if (el.children.length === 0) return el.textContent ?? ''
    const result: Record<string, unknown> = {}
    for (const child of Array.from(el.children)) {
      const key = child.tagName
      const value = parseNode(child)
      if (key in result) {
        if (!Array.isArray(result[key])) result[key] = [result[key]]
        ;(result[key] as unknown[]).push(value)
      } else {
        result[key] = value
      }
    }
    return result
  }
  return JSON.stringify({ [doc.documentElement.tagName]: parseNode(doc.documentElement) }, null, 2)
}

function parseCsvLine(line: string): string[] {
  const res: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { res.push(cur.trim()); cur = '' }
    else cur += ch
  }
  res.push(cur.trim())
  return res
}

export function jsonToCsv(src: string): string {
  const data = JSON.parse(src)
  if (!Array.isArray(data)) throw new Error('JSON must be an array of objects')
  if (!data.length) return ''
  const keys = Object.keys(data[0] as object)
  const escape = (v: unknown) => { const s = String(v ?? '').replace(/"/g, '""'); return /[,"\n]/.test(s) ? `"${s}"` : s }
  return [keys.join(','), ...data.map(row => keys.map(k => escape((row as Record<string, unknown>)[k])).join(','))].join('\n')
}

export function csvToJson(src: string): string {
  const lines = src.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV must have a header row + at least one data row')
  const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const vals = parseCsvLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
  return JSON.stringify(rows, null, 2)
}

export function formatJSON(src: string): string {
  return JSON.stringify(JSON.parse(src), null, 2)
}

export function minifyJSON(src: string): string {
  return JSON.stringify(JSON.parse(src))
}
