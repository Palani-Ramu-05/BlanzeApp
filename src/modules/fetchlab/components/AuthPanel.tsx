import { useState, useCallback } from 'react'
import { RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { updateCurrentRequest } from '../store/fetchlabSlice'
import { Select, Input } from '@components/index'
import toast from 'react-hot-toast'
import { cn } from '@utils/index'

async function generateJwt(algorithm: string, secret: string, payload: string, header: string): Promise<string> {
  const algMap: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }
  const hashAlg = algMap[algorithm] || 'SHA-256'

  const b64url = (str: string) =>
    btoa(unescape(encodeURIComponent(str))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  let headerObj: object
  let payloadObj: object
  try { headerObj = header ? JSON.parse(header) : { alg: algorithm, typ: 'JWT' } } catch { headerObj = { alg: algorithm, typ: 'JWT' } }
  try { payloadObj = payload ? JSON.parse(payload) : {} } catch { payloadObj = {} }

  const dataStr = `${b64url(JSON.stringify(headerObj))}.${b64url(JSON.stringify(payloadObj))}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret || ''),
    { name: 'HMAC', hash: hashAlg }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataStr))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${dataStr}.${sigB64}`
}

export const AuthPanel = () => {
  const dispatch = useAppDispatch()
  const { currentRequest } = useAppSelector((s) => s.fetchlab)
  const authType = currentRequest?.authType || 'none'
  const authData = currentRequest?.authData || {}

  const [showPassword, setShowPassword] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const update = useCallback((field: string, value: string) =>
    dispatch(updateCurrentRequest({ authData: { ...authData, [field]: value } })), [dispatch, authData])

  const handleGenerateJwt = async () => {
    setGenerating(true)
    try {
      const token = await generateJwt(
        authData.jwtAlgorithm || 'HS256',
        authData.jwtSecret || '',
        authData.jwtPayload || '{}',
        authData.jwtHeader || '',
      )
      update('jwtToken', token)
      toast.success('JWT generated')
    } catch (err) {
      toast.error(`JWT generation failed: ${(err as Error).message}`)
    } finally {
      setGenerating(false)
    }
  }

  const copyToken = async (token: string) => {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-2 space-y-2">
      <Select
        label="Authorization Type"
        value={authType}
        onChange={(e) => dispatch(updateCurrentRequest({ authType: e.target.value as typeof authType }))}
        options={[
          { value: 'none',    label: 'No Auth' },
          { value: 'bearer',  label: 'Bearer Token' },
          { value: 'basic',   label: 'Basic Auth' },
          { value: 'jwt',     label: 'JWT Bearer' },
          { value: 'apikey',  label: 'API Key' },
          { value: 'oauth2',  label: 'OAuth 2.0' },
        ]}
        disabled={!currentRequest}
      />

      {authType === 'none' && (
        <p className="text-[11px] text-surface-500 py-1">No authorization will be added to this request.</p>
      )}

      {authType === 'bearer' && (
        <div className="relative">
          <Input
            label="Token"
            value={authData.bearerToken || ''}
            onChange={(e) => update('bearerToken', e.target.value)}
            placeholder="Enter bearer token…"
            className="font-mono text-xs pr-8"
          />
        </div>
      )}

      {authType === 'basic' && (
        <>
          <Input label="Username" value={authData.basicUsername || ''} onChange={(e) => update('basicUsername', e.target.value)} placeholder="username" />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={authData.basicPassword || ''}
              onChange={(e) => update('basicPassword', e.target.value)}
              placeholder="password"
            />
            <button onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2 bottom-2 text-surface-500 hover:text-white transition-colors">
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          {authData.basicUsername && (
            <p className="text-[10px] text-surface-500 font-mono">
              Header: <span className="text-surface-300">Authorization: Basic {btoa(`${authData.basicUsername}:${authData.basicPassword || ''}`)}</span>
            </p>
          )}
        </>
      )}

      {authType === 'jwt' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Algorithm"
              value={authData.jwtAlgorithm || 'HS256'}
              onChange={(e) => update('jwtAlgorithm', e.target.value)}
              options={[
                { value: 'HS256', label: 'HS256' },
                { value: 'HS384', label: 'HS384' },
                { value: 'HS512', label: 'HS512' },
              ]}
            />
            <div className="relative">
              <Input
                label="Secret"
                type={showSecret ? 'text' : 'password'}
                value={authData.jwtSecret || ''}
                onChange={(e) => update('jwtSecret', e.target.value)}
                placeholder="your-secret-key"
                className="font-mono text-xs"
              />
              <button onClick={() => setShowSecret((p) => !p)}
                className="absolute right-2 bottom-2 text-surface-500 hover:text-white transition-colors">
                {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-surface-300 mb-1">Payload (JSON)</label>
            <textarea
              value={authData.jwtPayload || '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}'}
              onChange={(e) => update('jwtPayload', e.target.value)}
              placeholder='{"sub": "1234567890", "name": "John Doe"}'
              className="w-full h-20 bg-surface-800/60 border border-surface-700/60 rounded-lg px-2.5 py-1.5 text-xs font-mono text-surface-200 placeholder:text-surface-600 outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-surface-300 mb-1">Header (optional)</label>
            <textarea
              value={authData.jwtHeader || ''}
              onChange={(e) => update('jwtHeader', e.target.value)}
              placeholder='{"alg": "HS256", "typ": "JWT"}'
              className="w-full h-12 bg-surface-800/60 border border-surface-700/60 rounded-lg px-2.5 py-1.5 text-xs font-mono text-surface-200 placeholder:text-surface-600 outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>
          <button
            onClick={handleGenerateJwt}
            disabled={generating}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating…' : 'Generate Token'}
          </button>
          {authData.jwtToken && (
            <div className="bg-surface-800/60 border border-surface-700/40 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Generated Token</span>
                <button onClick={() => copyToken(authData.jwtToken!)}
                  className={cn('flex items-center gap-1 text-[10px] transition-colors', copied ? 'text-green-400' : 'text-surface-400 hover:text-white')}>
                  {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
              <p className="text-[10px] font-mono text-surface-300 break-all leading-relaxed">{authData.jwtToken}</p>
            </div>
          )}
        </div>
      )}

      {authType === 'apikey' && (
        <>
          <Input label="Key" value={authData.apiKeyKey || ''} onChange={(e) => update('apiKeyKey', e.target.value)} placeholder="X-Api-Key" />
          <Input label="Value" value={authData.apiKeyValue || ''} onChange={(e) => update('apiKeyValue', e.target.value)} placeholder="your-api-key" className="font-mono text-xs" />
          <Select
            label="Add to"
            value={authData.apiKeyIn || 'header'}
            onChange={(e) => update('apiKeyIn', e.target.value)}
            options={[{ value: 'header', label: 'Request Header' }, { value: 'query', label: 'Query Params' }]}
          />
        </>
      )}

      {authType === 'oauth2' && (
        <Input label="Access Token" value={authData.oauth2Token || ''} onChange={(e) => update('oauth2Token', e.target.value)} placeholder="OAuth 2.0 access token" className="font-mono text-xs" />
      )}
    </div>
  )
}
