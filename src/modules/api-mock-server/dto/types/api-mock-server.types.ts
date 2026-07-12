export interface KVEntry {
  key: string
  value: string
  enabled: boolean
}

export interface FormDataEntry extends KVEntry {
  type: string
}

export interface RequestConfig {
  headers: KVEntry[]
  queryParams: KVEntry[]
  pathParams: KVEntry[]
  cookies: KVEntry[]
  auth: { type: string; config: Record<string, unknown> }
  body: { type: string; raw: string; formData: FormDataEntry[] }
}

export interface ResponseConfig {
  statusCode: number
  headers: KVEntry[]
  cookies: KVEntry[]
  body: string
  contentType: string
  delay: number
}

export interface Condition {
  field: string
  operator: string
  value: string
}

export interface MockProject {
  uuid: string
  name: string
  description: string
  basePath: string
  version: string
  tags: string[]
  isFavorite: boolean
  isArchived: boolean
  settings: {
    cors: { enabled: boolean; origins: string[]; headers: string[] }
    rateLimit: { enabled: boolean; requestsPerMinute: number }
    auth: { enabled: boolean; type: string; config: Record<string, unknown> }
    globalDelay: number
  }
  statistics: {
    totalEndpoints: number
    totalCollections: number
    totalRequests: number
    averageResponseTime: number
  }
  status: number
  cby: string
  cAt: string
  uby: string
  uAt: string
}

export interface MockCollection {
  uuid: string
  projectUuid: string
  parentUuid: string | null
  name: string
  description: string
  sortOrder: number
  status: number
}

export interface MockEndpoint {
  uuid: string
  projectUuid: string
  collectionUuid: string
  method: string
  path: string
  fullPath: string
  description: string
  version: string
  tags: string[]
  notes: string
  statusCode: number
  delay: number
  activeScenarioUuid: string | null
  request: RequestConfig
  response: ResponseConfig
  status: number
  cby: string
  cAt: string
}

export interface MockScenario {
  uuid: string
  endpointUuid: string
  name: string
  description: string
  isDefault: boolean
  probability: number
  conditions: Condition[]
  conditionLogic: 'AND' | 'OR'
  response: ResponseConfig
  sortOrder: number
  status: number
}

export interface MockLog {
  uuid: string
  projectUuid: string
  endpointUuid: string | null
  method: string
  url: string
  statusCode: number
  responseTime: number
  ip: string
  headers: Record<string, string>
  query: Record<string, string>
  body: unknown
  response: unknown
  userAgent: string
  cAt: string
}

export interface MockEnvironment {
  uuid: string
  projectUuid: string
  name: string
  variables: KVEntry[]
  isActive: boolean
  status: number
}

export interface MockVariable {
  uuid: string
  projectUuid: string
  key: string
  value: string
  type: 'static' | 'dynamic' | 'faker'
  fakerType: string
  description: string
  status: number
}

export interface MockTemplate {
  uuid: string
  name: string
  description: string
  category: string
  endpoints: Array<{
    method: string
    path: string
    description: string
    responseBody: string
    statusCode: number
  }>
  isBuiltIn: boolean
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
}

export interface ApiResponse<T> {
  error: boolean
  status: number
  message: string
  data: T
}

export interface ProjectStats {
  totalEndpoints: number
  totalCollections: number
  totalRequests: number
  averageResponseTime: number
  errorRate: number
}

export interface AnalyticsData {
  summary: {
    totalRequests: number
    averageResponseTime: number
    errorCount: number
  }
  methodDistribution: Array<{ _id: string; count: number }>
}

export type ActivePanel = 'response' | 'scenarios' | 'logs' | 'analytics' | 'variables'

export interface ApiMockServerState {
  projects: MockProject[]
  project: MockProject | null
  collections: MockCollection[]
  collection: MockCollection | null
  endpoints: MockEndpoint[]
  currentEndpoint: MockEndpoint | null
  scenarios: MockScenario[]
  logs: MockLog[]
  analytics: AnalyticsData | null
  variables: MockVariable[]
  environments: MockEnvironment[]
  templates: MockTemplate[]
  pagination: PaginationInfo
  loading: boolean
  saving: boolean
  error: string | null
  activePanel: ActivePanel
  searchQuery: string
}
