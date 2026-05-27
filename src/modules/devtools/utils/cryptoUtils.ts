export interface CharsetOptions {
  numbers: boolean
  lowercase: boolean
  uppercase: boolean
  special: boolean
}

const CHAR_SETS = {
  numbers: '0123456789',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  special: '!@#$%^&*()_+-=[]|;:,.<>?',
}
const SIMILAR = new Set('il1LoO0')
const AMBIGUOUS = new Set('{}[]()/\\\'"`~,;:.<>')

export function generateToken(length: number, charset: CharsetOptions): string {
  let chars = Object.entries(charset)
    .filter(([, v]) => v)
    .map(([k]) => CHAR_SETS[k as keyof CharsetOptions])
    .join('')
  if (!chars) chars = CHAR_SETS.lowercase
  const arr = new Uint8Array(length)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, v => chars[v % chars.length]).join('')
}

export interface PasswordOptions extends CharsetOptions {
  length: number
  excludeSimilar: boolean
  excludeAmbiguous: boolean
}

export function generatePassword(opts: PasswordOptions): string {
  let chars = Object.entries({
    numbers: opts.numbers,
    lowercase: opts.lowercase,
    uppercase: opts.uppercase,
    special: opts.special,
  })
    .filter(([, v]) => v)
    .map(([k]) => CHAR_SETS[k as keyof CharsetOptions])
    .join('')
  if (opts.excludeSimilar) chars = chars.split('').filter(c => !SIMILAR.has(c)).join('')
  if (opts.excludeAmbiguous) chars = chars.split('').filter(c => !AMBIGUOUS.has(c)).join('')
  if (!chars) chars = CHAR_SETS.lowercase

  const arr = new Uint8Array(opts.length)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, v => chars[v % chars.length]).join('')
}

export interface StrengthResult {
  score: number
  label: string
  color: string
  entropy: number
  timeToCrack: string
}

export function calcPasswordStrength(password: string): StrengthResult {
  let charsetSize = 0
  if (/[0-9]/.test(password)) charsetSize += 10
  if (/[a-z]/.test(password)) charsetSize += 26
  if (/[A-Z]/.test(password)) charsetSize += 26
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32
  const entropy = password.length * Math.log2(charsetSize || 1)

  const sps = 1e10 // guesses per second
  const combos = Math.pow(charsetSize || 1, password.length)
  const sec = combos / sps / 2
  let timeToCrack: string
  if (sec < 1) timeToCrack = 'instantly'
  else if (sec < 60) timeToCrack = `${Math.round(sec)}s`
  else if (sec < 3600) timeToCrack = `${Math.round(sec / 60)} minutes`
  else if (sec < 86400) timeToCrack = `${Math.round(sec / 3600)} hours`
  else if (sec < 2592000) timeToCrack = `${Math.round(sec / 86400)} days`
  else if (sec < 31536000) timeToCrack = `${Math.round(sec / 2592000)} months`
  else if (sec < 31536000 * 1000) timeToCrack = `${Math.round(sec / 31536000)} years`
  else if (sec < 31536000 * 1e9) timeToCrack = `${Math.round(sec / 31536000 / 1000)} thousand years`
  else if (sec < 31536000 * 1e12) timeToCrack = `${Math.round(sec / 31536000 / 1e9)} billion years`
  else timeToCrack = 'until heat death of the universe'

  let score = entropy < 28 ? 10 : entropy < 36 ? 25 : entropy < 60 ? 50 : entropy < 80 ? 75 : 95
  if (password.length >= 16) score = Math.min(score + 10, 100)
  if (password.length < 8) score = Math.min(score, 25)

  const label = score < 25 ? 'Very Weak' : score < 50 ? 'Weak' : score < 75 ? 'Fair' : score < 90 ? 'Strong' : 'Very Strong'
  const color = score < 25 ? '#ef4444' : score < 50 ? '#f97316' : score < 75 ? '#eab308' : '#22c55e'

  return { score, label, color, entropy: Math.round(entropy), timeToCrack }
}

export function applyTokenPattern(token: string, pattern: string): string {
  const parts = pattern.split('-').map(Number)
  if (parts.some(isNaN) || !parts.length) return token
  let idx = 0
  return parts
    .map(len => {
      const chunk = token.slice(idx, idx + len)
      idx += len
      return chunk
    })
    .join('-')
}
