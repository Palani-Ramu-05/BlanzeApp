function base64UrlDecode(str: string): string {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')
  return atob(padded)
}

export interface DecodedJWT {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  raw: { header: string; payload: string; signature: string }
  isValid: boolean
  error?: string
}

export function decodeJWT(token: string): DecodedJWT {
  try {
    const parts = token.trim().split('.')
    if (parts.length !== 3) throw new Error('JWT must contain exactly 3 parts separated by dots')
    const header = JSON.parse(base64UrlDecode(parts[0])) as Record<string, unknown>
    const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>
    return { header, payload, signature: parts[2], raw: { header: parts[0], payload: parts[1], signature: parts[2] }, isValid: true }
  } catch (e) {
    return { header: {}, payload: {}, signature: '', raw: { header: '', payload: '', signature: '' }, isValid: false, error: (e as Error).message }
  }
}

export function getTokenMeta(payload: Record<string, unknown>) {
  const exp = payload.exp ? new Date((payload.exp as number) * 1000) : undefined
  const iat = payload.iat ? new Date((payload.iat as number) * 1000) : undefined
  const nbf = payload.nbf ? new Date((payload.nbf as number) * 1000) : undefined
  const isExpired = exp ? exp < new Date() : false
  return { exp, iat, nbf, isExpired }
}
