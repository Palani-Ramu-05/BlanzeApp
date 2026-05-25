import type { HTTP_METHODS, AUTH_TYPES, BODY_TYPES } from '@core/constants/constants'

export type HttpMethod = typeof HTTP_METHODS[number]
export type AuthType = typeof AUTH_TYPES[number]
export type BodyType = typeof BODY_TYPES[number]

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

export interface HistoryEntry {
  id: string
  method: HttpMethod
  url: string
  status: number
  duration: number
  size: number
  timestamp: string
}

export interface ResponseData {
  status: number
  statusText: string
  duration: number
  size: number
  body: string
  headers: Record<string, string>
  prettyBody: string
}

export interface FetchLabState {
  items: FetchItem[]
  envVars: EnvVar[]
  history: HistoryEntry[]
  currentId: string | null
  currentRequest: FetchRequest | null
  response: ResponseData | null
  sending: boolean
  activeMainTab: string
  activeBodyTab: BodyType
  sidebarTab: 'collections' | 'history'
}
