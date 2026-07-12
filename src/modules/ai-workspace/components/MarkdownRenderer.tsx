import { useMemo } from 'react'
import { cn } from '@utils/index'

interface MarkdownRendererProps {
  content: string
  className?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>')
}

function renderCodeBlock(language: string | undefined, code: string): string {
  const lang = language || 'text'
  const escapedCode = escapeHtml(code)
  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-lang-label">${escapeHtml(lang)}</span>
      <button class="copy-button" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(code)}'))">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Copy</span>
      </button>
    </div>
    <pre class="code-block"><code class="language-${escapeHtml(lang)}">${escapedCode}</code></pre>
  </div>`
}

function parseMarkdown(markdown: string): string {
  const lines = markdown.split('\n')
  const html: string[] = []
  let inTable = false
  let tableHtml = ''
  let inCodeBlock = false
  let codeLanguage = ''
  let codeContent = ''
  let inList = false
  let listType = ''

  const flushCodeBlock = () => {
    if (inCodeBlock && codeContent) {
      html.push(renderCodeBlock(codeLanguage, codeContent.replace(/\n$/, '')))
      codeContent = ''
      codeLanguage = ''
    }
    inCodeBlock = false
  }

  const flushList = () => {
    if (inList) {
      html.push(`</${listType === 'ul' ? 'ul' : 'ol'}>`)
      inList = false
    }
  }

  const flushTable = () => {
    if (inTable) {
      tableHtml += '</tbody></table>'
      html.push(tableHtml)
      tableHtml = ''
      inTable = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock()
      } else {
        flushCodeBlock()
        flushList()
        flushTable()
        codeLanguage = trimmed.slice(3).trim()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeContent += line + '\n'
      continue
    }

    if (!trimmed) {
      flushList()
      flushTable()
      html.push('<br/>')
      continue
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      flushList()
      flushTable()
      const level = trimmed.match(/^#{1,6}/)![0].length
      const text = trimmed.replace(/^#{1,6}\s/, '')
      html.push(`<h${level} class="markdown-h${level}">${renderInline(text)}</h${level}>`)
      continue
    }

    if (/^>/.test(trimmed)) {
      flushList()
      flushTable()
      const text = trimmed.replace(/^>\s?/, '')
      html.push(`<blockquote class="markdown-blockquote">${renderInline(text)}</blockquote>`)
      continue
    }

    if (/^---/.test(trimmed)) {
      flushList()
      flushTable()
      html.push('<hr class="markdown-hr"/>')
      continue
    }

    if (/^[-*+]\s/.test(trimmed)) {
      flushTable()
      if (!inList) {
        html.push('<ul class="markdown-ul">')
        inList = true
        listType = 'ul'
      }
      const text = trimmed.replace(/^[-*+]\s/, '')
      html.push(`<li>${renderInline(text)}</li>`)
      continue
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      flushTable()
      if (!inList) {
        html.push('<ol class="markdown-ol">')
        inList = true
        listType = 'ol'
      }
      const text = trimmed.replace(/^\d+[.)]\s/, '')
      html.push(`<li>${renderInline(text)}</li>`)
      continue
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').filter(Boolean).map((c) => c.trim())
      const nextLine = lines[i + 1]?.trim() || ''

      if (!inTable && !/^[-| ]+$/.test(nextLine)) {
        flushList()
        tableHtml = '<table class="markdown-table"><thead><tr>'
        cells.forEach((cell) => {
          tableHtml += `<th>${renderInline(cell)}</th>`
        })
        tableHtml += '</tr></thead><tbody>'
        inTable = true
      } else if (inTable && /^[-| ]+$/.test(nextLine)) {
        i++
        continue
      } else if (inTable) {
        tableHtml += '<tr>'
        cells.forEach((cell) => {
          tableHtml += `<td>${renderInline(cell)}</td>`
        })
        tableHtml += '</tr>'
      }
      continue
    }

    flushList()
    flushTable()
    html.push(`<p class="markdown-p">${renderInline(trimmed)}</p>`)
  }

  flushCodeBlock()
  flushList()
  flushTable()

  return html.join('\n')
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const html = useMemo(() => parseMarkdown(content), [content])

  return (
    <div
      className={cn('markdown-body', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
