export const markdownRendererStyles = `
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.animate-blink {
  animation: blink 1s step-end infinite;
}
.markdown-body {
  line-height: 1.7;
  word-wrap: break-word;
}
.markdown-body p {
  margin-bottom: 0.75rem;
}
.markdown-body p:last-child {
  margin-bottom: 0;
}
.markdown-h1 { font-size: 1.5rem; font-weight: 800; margin: 1.5rem 0 0.75rem; line-height: 1.3; color: rgb(var(--color-text-primary)); }
.markdown-h2 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.5rem; line-height: 1.35; color: rgb(var(--color-text-primary)); }
.markdown-h3 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.5rem; line-height: 1.4; color: rgb(var(--color-text-primary)); }
.markdown-h4 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.375rem; color: rgb(var(--color-text-primary)); }
.markdown-blockquote {
  border-left: 3px solid rgb(var(--brand-500, 99 102 241));
  padding-left: 1rem;
  margin: 1rem 0;
  color: rgb(var(--color-text-secondary));
  font-style: italic;
}
.markdown-hr { border: none; border-top: 1px solid rgb(var(--surface-700, 50 55 68)); margin: 1.5rem 0; }
.markdown-ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0 0.75rem; }
.markdown-ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0 0.75rem; }
.markdown-ul li, .markdown-ol li { margin-bottom: 0.25rem; }
.markdown-table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.8125rem; }
.markdown-table th { background: rgb(var(--surface-800, 35 39 52)); font-weight: 600; text-align: left; padding: 0.5rem 0.75rem; border: 1px solid rgb(var(--surface-700, 50 55 68)); }
.markdown-table td { padding: 0.5rem 0.75rem; border: 1px solid rgb(var(--surface-700, 50 55 68)); }
.markdown-table tr:nth-child(even) td { background: rgb(var(--surface-800, 35 39 52)/0.5); }
.markdown-link { color: rgb(var(--brand-500, 99 102 241)); text-decoration: underline; text-underline-offset: 2px; }
.markdown-link:hover { opacity: 0.8; }
.inline-code {
  background: rgb(var(--surface-800, 35 39 52));
  color: rgb(167 139 250);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.code-block-wrapper {
  margin: 1rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgb(var(--surface-700, 50 55 68));
}
.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgb(var(--surface-800, 35 39 52));
  border-bottom: 1px solid rgb(var(--surface-700, 50 55 68));
}
.code-lang-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgb(var(--color-text-muted, 135 141 155));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.copy-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  color: rgb(var(--color-text-muted, 135 141 155));
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}
.copy-button:hover {
  color: rgb(var(--color-text-primary));
  background: rgb(var(--surface-700, 50 55 68));
}
.code-block {
  background: rgb(var(--surface-950, 18 20 30));
  padding: 1rem;
  overflow-x: auto;
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
}
.code-block code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: rgb(var(--color-text-primary));
}
`
