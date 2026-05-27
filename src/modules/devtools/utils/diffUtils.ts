export interface DiffLine {
  type: 'equal' | 'added' | 'removed'
  content: string
  lineNumL?: number
  lineNumR?: number
}

function lcs(a: string[], b: string[]): number[][] {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0) as number[])
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  return dp
}

export function computeDiff(original: string, modified: string): DiffLine[] {
  const a = original.split('\n')
  const b = modified.split('\n')
  const dp = lcs(a, b)
  const temp: DiffLine[] = []
  let i = a.length, j = b.length, lL = a.length, lR = b.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      temp.push({ type: 'equal', content: a[i - 1], lineNumL: lL--, lineNumR: lR-- })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ type: 'added', content: b[j - 1], lineNumR: lR-- })
      j--
    } else {
      temp.push({ type: 'removed', content: a[i - 1], lineNumL: lL-- })
      i--
    }
  }
  return temp.reverse()
}

export function getDiffStats(a: string, b: string) {
  const aLines = a.split('\n'), bLines = b.split('\n')
  const aWords = a.split(/\s+/).filter(Boolean), bWords = b.split(/\s+/).filter(Boolean)
  const diff = computeDiff(a, b)
  const added = diff.filter(d => d.type === 'added').length
  const removed = diff.filter(d => d.type === 'removed').length
  const equal = diff.filter(d => d.type === 'equal').length
  const sim = diff.length > 0 ? +((equal / diff.length) * 100).toFixed(2) : 100
  return {
    linesA: aLines.length, linesB: bLines.length,
    wordsA: aWords.length, wordsB: bWords.length,
    charsA: a.length, charsB: b.length,
    added, removed, equal, similarity: sim,
  }
}
