import type { HTTP_METHODS, AUTH_TYPES, BODY_TYPES } from '@core/constants/constants'

export type HttpMethod = (typeof HTTP_METHODS)[number]
export type AuthType = (typeof AUTH_TYPES)[number]
export type BodyType = (typeof BODY_TYPES)[number]

export interface KVRow {
  id: string
  enabled: boolean
  key: string
  value: string
}

export interface FormField {
  id: string
  enabled: boolean
  key: string
  value: string
  fieldType: 'text' | 'file'
}

export interface FormFile {
  id: string
  enabled: boolean
  key: string
  files: File[]
}

export interface AuthData {
  bearerToken?: string
  basicUsername?: string
  basicPassword?: string
  jwtAlgorithm?: 'HS256' | 'HS384' | 'HS512'
  jwtSecret?: string
  jwtPayload?: string
  jwtHeader?: string
  jwtToken?: string  // auto-generated or manual
  apiKeyKey?: string
  apiKeyValue?: string
  apiKeyIn?: 'header' | 'query'
  oauth2Token?: string
}

export interface FetchRequest {
  id: string
  type: 'request'
  name: string
  method: HttpMethod
  url: string
  params: KVRow[]
  headers: KVRow[]
  authType: AuthType
  authData: AuthData
  bodyType: BodyType
  jsonBody: string
  xmlBody: string
  textBody: string
  formFields: FormField[]
  formFiles: FormFile[]
  formEncodeFields: KVRow[]
  gqlQuery: string
  gqlVars: string
  testsScript: string
  prerunScript: string
  createdAt: string
}

export interface FetchFolder {
  id: string
  type: 'folder'
  name: string
  open: boolean
  children: (FetchRequest | FetchFolder)[]
}

export type FetchItem = FetchRequest | FetchFolder

export interface EnvVar {
  id: string
  enabled: boolean
  key: string
  value: string
}

export interface ResponseData {
  status: number
  statusText: string
  duration: number
  size: number
  body: string
  headers: Record<string, string>
  prettyBody: string
  requestSnapshot?: {
    method: string
    url: string
    headers: Record<string, string>
    body?: string
  }
}

// Per-open-tab state (stored in Redux, not persisted across reload)
export interface OpenTab {
  requestId: string
  editedRequest: FetchRequest
  response: ResponseData | null
}

export interface FetchLabState {
  items: FetchItem[]
  envVars: EnvVar[]
  currentId: string | null
  currentRequest: FetchRequest | null
  response: ResponseData | null
  sending: boolean
  activeMainTab: string
  activeBodyTab: BodyType
  // Multi-tab state
  openTabIds: string[]                          // ordered list of open tab IDs (persisted)
  activeTabId: string | null                    // currently active tab (persisted)
  tabRequests: Record<string, FetchRequest>     // per-tab edited request (session only)
  tabResponses: Record<string, ResponseData>    // per-tab last response (session only)
}
