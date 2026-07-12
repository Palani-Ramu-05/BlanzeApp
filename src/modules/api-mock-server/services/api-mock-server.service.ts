import envConfig from '@core/config/envConfig'
import type {
  ApiResponse, MockProject, MockCollection, MockEndpoint, MockScenario,
  MockLog, MockEnvironment, MockVariable, MockTemplate, PaginationInfo,
  ProjectStats, AnalyticsData,
} from '../dto/types/api-mock-server.types'

const BASE = `${envConfig.API_BASE_URL}/api-mock-server`

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data: ApiResponse<T> = await res.json()
  if (data.error) throw new Error(data.message || 'Request failed')
  return data.data
}

// ── Projects ─────────────────────────────────────────────
export const projectApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: MockProject[]; pagination: PaginationInfo }>(`${BASE}/projects${qs}`)
  },
  get: (uuid: string) => request<MockProject>(`${BASE}/projects/${uuid}`),
  create: (data: Partial<MockProject>) =>
    request<MockProject>(`${BASE}/projects`, { method: 'POST', body: JSON.stringify(data) }),
  update: (uuid: string, data: Partial<MockProject>) =>
    request<MockProject>(`${BASE}/projects/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (uuid: string) =>
    request<void>(`${BASE}/projects/${uuid}`, { method: 'DELETE' }),
  duplicate: (uuid: string) =>
    request<MockProject>(`${BASE}/projects/${uuid}/duplicate`, { method: 'POST' }),
  toggleFavorite: (uuid: string) =>
    request<MockProject>(`${BASE}/projects/${uuid}/favorite`, { method: 'POST' }),
  toggleArchive: (uuid: string) =>
    request<MockProject>(`${BASE}/projects/${uuid}/archive`, { method: 'POST' }),
  stats: (uuid: string) => request<ProjectStats>(`${BASE}/projects/${uuid}/stats`),
}

// ── Collections ──────────────────────────────────────────
export const collectionApi = {
  list: (projectUuid: string) => request<MockCollection[]>(`${BASE}/collections/project/${projectUuid}`),
  get: (uuid: string) => request<MockCollection>(`${BASE}/collections/${uuid}`),
  create: (data: Partial<MockCollection>) =>
    request<MockCollection>(`${BASE}/collections`, { method: 'POST', body: JSON.stringify(data) }),
  update: (uuid: string, data: Partial<MockCollection>) =>
    request<MockCollection>(`${BASE}/collections/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (uuid: string) =>
    request<void>(`${BASE}/collections/${uuid}`, { method: 'DELETE' }),
  reorder: (items: Array<{ uuid: string; sortOrder: number }>) =>
    request<void>(`${BASE}/collections/reorder`, { method: 'POST', body: JSON.stringify({ items }) }),
}

// ── Endpoints ────────────────────────────────────────────
export const endpointApi = {
  list: (projectUuid: string, collectionUuid?: string) => {
    const qs = collectionUuid ? `?collectionUuid=${collectionUuid}` : ''
    return request<MockEndpoint[]>(`${BASE}/endpoints/project/${projectUuid}${qs}`)
  },
  get: (uuid: string) => request<MockEndpoint>(`${BASE}/endpoints/${uuid}`),
  create: (data: Partial<MockEndpoint>) =>
    request<MockEndpoint>(`${BASE}/endpoints`, { method: 'POST', body: JSON.stringify(data) }),
  update: (uuid: string, data: Partial<MockEndpoint>) =>
    request<MockEndpoint>(`${BASE}/endpoints/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (uuid: string) =>
    request<void>(`${BASE}/endpoints/${uuid}`, { method: 'DELETE' }),
}

// ── Scenarios ────────────────────────────────────────────
export const scenarioApi = {
  list: (endpointUuid: string) => request<MockScenario[]>(`${BASE}/endpoints/${endpointUuid}/scenarios`),
  create: (data: Partial<MockScenario>) =>
    request<MockScenario>(`${BASE}/endpoints/${data.endpointUuid}/scenarios`, { method: 'POST', body: JSON.stringify(data) }),
  update: (uuid: string, data: Partial<MockScenario>) =>
    request<MockScenario>(`${BASE}/endpoints/scenarios/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (uuid: string) =>
    request<void>(`${BASE}/endpoints/scenarios/${uuid}`, { method: 'DELETE' }),
}

// ── Logs ─────────────────────────────────────────────────
export const logApi = {
  list: (projectUuid: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: MockLog[]; pagination: PaginationInfo }>(`${BASE}/logs/project/${projectUuid}${qs}`)
  },
  get: (uuid: string) => request<MockLog>(`${BASE}/logs/${uuid}`),
  delete: (uuid: string) => request<void>(`${BASE}/logs/${uuid}`, { method: 'DELETE' }),
  clear: (projectUuid: string) =>
    request<void>(`${BASE}/logs/project/${projectUuid}/clear`, { method: 'POST' }),
  analytics: (projectUuid: string) => request<AnalyticsData>(`${BASE}/logs/project/${projectUuid}/analytics`),
}

// ── Variables ────────────────────────────────────────────
export const variableApi = {
  list: (projectUuid: string) => request<MockVariable[]>(`${BASE}/variables/project/${projectUuid}`),
  create: (data: Partial<MockVariable>) =>
    request<MockVariable>(`${BASE}/variables`, { method: 'POST', body: JSON.stringify(data) }),
  update: (uuid: string, data: Partial<MockVariable>) =>
    request<MockVariable>(`${BASE}/variables/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (uuid: string) => request<void>(`${BASE}/variables/${uuid}`, { method: 'DELETE' }),
}

// ── Environments ─────────────────────────────────────────
export const environmentApi = {
  list: (projectUuid: string) => request<MockEnvironment[]>(`${BASE}/environments/project/${projectUuid}`),
  create: (data: Partial<MockEnvironment>) =>
    request<MockEnvironment>(`${BASE}/environments`, { method: 'POST', body: JSON.stringify(data) }),
  update: (uuid: string, data: Partial<MockEnvironment>) =>
    request<MockEnvironment>(`${BASE}/environments/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (uuid: string) => request<void>(`${BASE}/environments/${uuid}`, { method: 'DELETE' }),
  activate: (uuid: string) =>
    request<MockEnvironment>(`${BASE}/environments/${uuid}/activate`, { method: 'POST' }),
}

// ── Templates ────────────────────────────────────────────
export const templateApi = {
  list: (category?: string) => {
    const qs = category ? `?category=${category}` : ''
    return request<MockTemplate[]>(`${BASE}/templates${qs}`)
  },
  get: (uuid: string) => request<MockTemplate>(`${BASE}/templates/${uuid}`),
  create: (data: Partial<MockTemplate>) =>
    request<MockTemplate>(`${BASE}/templates`, { method: 'POST', body: JSON.stringify(data) }),
  delete: (uuid: string) => request<void>(`${BASE}/templates/${uuid}`, { method: 'DELETE' }),
  apply: (templateUuid: string, projectUuid: string) =>
    request<{ message: string; collectionUuid: string }>(`${BASE}/templates/${templateUuid}/apply`, {
      method: 'POST', body: JSON.stringify({ projectUuid }),
    }),
}

// ── Mock URL helpers ─────────────────────────────────────
export function getMockUrl(project: MockProject): string {
  return `${envConfig.API_BASE_URL}/api-mock-server/mock/${project.uuid}${project.basePath}`
}
