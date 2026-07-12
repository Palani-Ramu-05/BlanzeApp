import type {
  MockProject, MockCollection, MockEndpoint, MockScenario, MockEnvironment, MockVariable, KVEntry, RequestConfig, ResponseConfig, ApiMockServerState,
} from './types/api-mock-server.types'

export const defaultKVEntry: KVEntry = { key: '', value: '', enabled: true }
export const defaultFormDataEntry = { key: '', value: '', type: 'text', enabled: true }

export const defaultRequestConfig: RequestConfig = {
  headers: [defaultKVEntry],
  queryParams: [defaultKVEntry],
  pathParams: [defaultKVEntry],
  cookies: [defaultKVEntry],
  auth: { type: 'none', config: {} },
  body: { type: 'none', raw: '{}', formData: [defaultFormDataEntry] },
}

export const defaultResponseConfig: ResponseConfig = {
  statusCode: 200,
  headers: [defaultKVEntry],
  cookies: [defaultKVEntry],
  body: JSON.stringify({ message: 'Hello from Mock Server!' }, null, 2),
  contentType: 'application/json',
  delay: 0,
}

export const defaultProject: Partial<MockProject> = {
  name: '',
  description: '',
  basePath: '/api',
  version: '1.0.0',
  tags: [],
  settings: {
    cors: { enabled: true, origins: ['*'], headers: ['*'] },
    rateLimit: { enabled: false, requestsPerMinute: 60 },
    auth: { enabled: false, type: 'none', config: {} },
    globalDelay: 0,
  },
}

export const defaultCollection: Partial<MockCollection> = {
  name: '',
  description: '',
  parentUuid: null,
  sortOrder: 0,
}

export const defaultEndpoint: Partial<MockEndpoint> = {
  method: 'GET',
  path: '/',
  description: '',
  version: '1.0.0',
  tags: [],
  notes: '',
  statusCode: 200,
  delay: 0,
  request: defaultRequestConfig,
  response: defaultResponseConfig,
}

export const defaultScenario: Partial<MockScenario> = {
  name: '',
  description: '',
  isDefault: false,
  probability: 100,
  conditions: [],
  conditionLogic: 'AND',
  response: defaultResponseConfig,
  sortOrder: 0,
}

export const defaultVariable: Partial<MockVariable> = {
  key: '',
  value: '',
  type: 'static',
  fakerType: '',
  description: '',
}

export const defaultEnvironment: Partial<MockEnvironment> = {
  name: '',
  variables: [defaultKVEntry],
  isActive: false,
}

export const initialState: ApiMockServerState = {
  projects: [],
  project: null,
  collections: [],
  collection: null,
  endpoints: [],
  currentEndpoint: null,
  scenarios: [],
  logs: [],
  analytics: null,
  variables: [],
  environments: [],
  templates: [],
  pagination: { page: 1, limit: 20, total: 0 },
  loading: false,
  saving: false,
  error: null,
  activePanel: 'response',
  searchQuery: '',
}
