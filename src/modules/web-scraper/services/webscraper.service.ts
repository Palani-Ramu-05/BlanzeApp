import envConfig from '@core/config/envConfig'
import type { ScrapePayload, ScraperApiResponse, ScraperResponseData, ScrapedPage } from '../dto/types/webscraper.types'

const API_ENDPOINT = `${envConfig.API_BASE_URL}/web-scraper`

export async function apiScrape(payload: ScrapePayload): Promise<ScraperApiResponse> {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Server responded with ${res.status}`)
  }
  const data = (await res.json()) as ScraperApiResponse
  if (data.error) throw new Error(data.message || 'Scrape failed')
  return data
}

// ── Validation ────────────────────────────────────────────────
export function validateURL(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return 'URL is required'
  try {
    const u = new URL(trimmed)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'Must start with http:// or https://'
    return null
  } catch {
    return 'Please enter a valid URL'
  }
}

export function validateBulkURL(raw: string, existing: string[]): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'URL is required'
  if (existing.some(u => u === trimmed)) return 'Duplicate URL'
  if (existing.length >= 5) return 'Maximum 5 URLs allowed'
  return validateURL(trimmed)
}

// ── Export helpers ────────────────────────────────────────────
function flattenPages(responses: ScraperApiResponse[]): ScrapedPage[] {
  return responses.flatMap(r => r.data?.pages ?? [])
}

export function exportJSON(responses: ScraperApiResponse[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), results: responses }, null, 2)
}

export function exportCSV(responses: ScraperApiResponse[]): string {
  const pages = flattenPages(responses)
  const header = ['URL', 'Title', 'Language', 'Emails', 'Phones', 'Images', 'InternalLinks', 'ExternalLinks', 'WordCount']
  const rows = pages.map(p => [
    p.url, p.title, p.language,
    (p.emails || []).join('; '),
    (p.phoneNumbers || []).join('; '),
    String(p.images?.length ?? p.imageCount ?? ''),
    String(p.internalLinks?.length ?? ''),
    String(p.externalLinks?.length ?? ''),
    String(p.wordCount ?? ''),
  ])
  return [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function exportTXT(responses: ScraperApiResponse[]): string {
  const lines: string[] = [
    `WEB SCRAPER REPORT`,
    `Exported: ${new Date().toLocaleString()}`,
    `Total Responses: ${responses.length}`,
    '',
  ]
  for (const r of responses) {
    const d = r.data
    lines.push('═'.repeat(60))
    lines.push(`URL: ${d?.url ?? 'N/A'}`)
    lines.push(`Mode: ${d?.scrapeMode ?? 'N/A'}`)
    if (d?.summary) {
      lines.push(`Pages Scraped: ${d.summary.pagesScraped}`)
      lines.push(`Emails: ${d.summary.totalEmails}, Phones: ${d.summary.totalPhoneNumbers}`)
      lines.push(`Images: ${d.summary.totalImages}, Internal: ${d.summary.totalInternalLinks}`)
      lines.push(`External: ${d.summary.totalExternalLinks}, Words: ${d.summary.totalWordCount}`)
    }
    lines.push('')
    for (const p of d?.pages ?? []) {
      lines.push(`  Page: ${p.title ?? p.url}`)
      if (p.emails?.length) lines.push(`    Emails (${p.emails.length}): ${p.emails.slice(0, 5).join(', ')}`)
      if (p.phoneNumbers?.length) lines.push(`    Phones (${p.phoneNumbers.length}): ${p.phoneNumbers.slice(0, 5).join(', ')}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

export function exportHTML(responses: ScraperApiResponse[]): string {
  const parts: string[] = ['<!DOCTYPE html><html><head><meta charset="utf-8"><title>Web Scraper Report</title><style>body{font-family:sans-serif;max-width:960px;margin:auto;padding:2rem}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}h2{color:#333;border-bottom:2px solid #6366f1;padding-bottom:4px}</style></head><body><h1>Web Scraper Report</h1>']
  for (const r of responses) {
    const d = r.data
    parts.push(`<h2>${d?.url ?? 'N/A'}</h2>`)
    if (d?.summary) {
      const s = d.summary
      parts.push(`<table><tr><th>Pages</th><th>Emails</th><th>Phones</th><th>Images</th><th>Internal</th><th>External</th><th>Words</th></tr>`)
      parts.push(`<tr><td>${s.pagesScraped}</td><td>${s.totalEmails}</td><td>${s.totalPhoneNumbers}</td><td>${s.totalImages}</td><td>${s.totalInternalLinks}</td><td>${s.totalExternalLinks}</td><td>${s.totalWordCount}</td></tr></table>`)
    }
  }
  parts.push('</body></html>')
  return parts.join('\n')
}

export function exportMarkdown(responses: ScraperApiResponse[]): string {
  const lines: string[] = ['# Web Scraper Report', '', `**Exported:** ${new Date().toLocaleString()}`, `**Responses:** ${responses.length}`, '']
  for (const r of responses) {
    const d = r.data
    lines.push(`## ${d?.url ?? 'N/A'}`)
    if (d?.summary) {
      const s = d.summary
      lines.push('| Metric | Value |')
      lines.push('|--------|-------|')
      lines.push(`| Pages Scraped | ${s.pagesScraped} |`)
      lines.push(`| Emails | ${s.totalEmails} |`)
      lines.push(`| Phones | ${s.totalPhoneNumbers} |`)
      lines.push(`| Images | ${s.totalImages} |`)
      lines.push(`| Internal Links | ${s.totalInternalLinks} |`)
      lines.push(`| External Links | ${s.totalExternalLinks} |`)
      lines.push(`| Word Count | ${s.totalWordCount} |`)
      lines.push('')
    }
  }
  return lines.join('\n')
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadImagesList(pages: ScrapedPage[]) {
  const lines = pages.flatMap(p => (p.images ?? []).map(img => `${img.src}\t${img.alt || ''}\t${img.title || ''}`))
  const content = ['Image URL\tAlt Text\tTitle', ...lines].join('\n')
  downloadFile(content, `images-${Date.now()}.csv`, 'text/csv')
}

export function downloadEmailsList(pages: ScrapedPage[]) {
  const emails = [...new Set(pages.flatMap(p => p.emails ?? []))]
  downloadFile(emails.join('\n'), `emails-${Date.now()}.txt`, 'text/plain')
}

export function downloadPhonesList(pages: ScrapedPage[]) {
  const phones = [...new Set(pages.flatMap(p => p.phoneNumbers ?? []))]
  downloadFile(phones.join('\n'), `phones-${Date.now()}.txt`, 'text/plain')
}
