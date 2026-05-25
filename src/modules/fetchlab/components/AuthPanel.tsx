import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { updateCurrentRequest } from '../store/fetchlabSlice'
import { Select, Input } from '@components/index'

export const AuthPanel = () => {
  const dispatch = useAppDispatch()
  const { currentRequest } = useAppSelector((s) => s.fetchlab)
  const authType = currentRequest?.authType || 'none'
  const authData = currentRequest?.authData || {}

  const update = (field: string, value: string) =>
    dispatch(updateCurrentRequest({ authData: { ...authData, [field]: value } }))

  return (
    <div className="p-3 space-y-3">
      <Select
        label="Authorization Type"
        value={authType}
        onChange={(e) =>
          dispatch(updateCurrentRequest({ authType: e.target.value as typeof authType }))
        }
        options={[
          { value: 'none', label: 'No Auth' },
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'basic', label: 'Basic Auth' },
          { value: 'apikey', label: 'API Key' },
          { value: 'oauth2', label: 'OAuth 2.0' },
        ]}
        disabled={!currentRequest}
      />

      {authType === 'bearer' && (
        <Input
          label="Token"
          value={authData.bearerToken || ''}
          onChange={(e) => update('bearerToken', e.target.value)}
          placeholder="Bearer token..."
          className="font-mono text-xs"
        />
      )}

      {authType === 'basic' && (
        <>
          <Input
            label="Username"
            value={authData.basicUsername || ''}
            onChange={(e) => update('basicUsername', e.target.value)}
            placeholder="username"
          />
          <Input
            label="Password"
            type="password"
            value={authData.basicPassword || ''}
            onChange={(e) => update('basicPassword', e.target.value)}
            placeholder="password"
          />
        </>
      )}

      {authType === 'apikey' && (
        <>
          <Input
            label="Key"
            value={authData.apiKeyKey || ''}
            onChange={(e) => update('apiKeyKey', e.target.value)}
            placeholder="X-Api-Key"
          />
          <Input
            label="Value"
            value={authData.apiKeyValue || ''}
            onChange={(e) => update('apiKeyValue', e.target.value)}
            placeholder="your-api-key"
            className="font-mono text-xs"
          />
          <Select
            label="Add to"
            value={authData.apiKeyIn || 'header'}
            onChange={(e) => update('apiKeyIn', e.target.value)}
            options={[
              { value: 'header', label: 'Header' },
              { value: 'query', label: 'Query Param' },
            ]}
          />
        </>
      )}

      {authType === 'oauth2' && (
        <Input
          label="Access Token"
          value={authData.oauth2Token || ''}
          onChange={(e) => update('oauth2Token', e.target.value)}
          placeholder="OAuth 2.0 access token"
          className="font-mono text-xs"
        />
      )}

      {authType === 'none' && (
        <p className="text-xs text-surface-500 py-2">No authorization will be added to this request.</p>
      )}
    </div>
  )
}
