import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type {
  FetchLabState,
  FetchItem,
  FetchRequest,
  FetchFolder,
  EnvVar,
  ResponseData,
  HttpMethod,
  BodyType,
  KVRow,
  FormField,
  FormFile,
} from '../dto/types/fetchlab.types'
import { generateId } from '@utils/index'
import { fetchlabService } from '../services/fetchlab.service'
import { supabase } from '@core/config/supabaseClient'
import { formFileStore, binaryFile } from './fetchlabFileStore'

// ── LocalStorage keys ─────────────────────────────────────────
const LS_ITEMS    = 'fl2_items'
const LS_ENV      = 'fl2_env'
const LS_TABS     = 'fl2_tabs'

const loadItems = (): FetchItem[] => {
  try { return JSON.parse(localStorage.getItem(LS_ITEMS) || '[]') } catch { return [] }
}
const loadEnv = (): EnvVar[] => {
  try { return JSON.parse(localStorage.getItem(LS_ENV) || '[]') } catch { return [] }
}
const loadTabState = (): { openTabIds: string[]; activeTabId: string | null } => {
  try { return JSON.parse(localStorage.getItem(LS_TABS) || '{"openTabIds":[],"activeTabId":null}') } catch { return { openTabIds: [], activeTabId: null } }
}

const saveEnv = (vars: EnvVar[]) => localStorage.setItem(LS_ENV, JSON.stringify(vars))
const saveTabState = (openTabIds: string[], activeTabId: string | null) =>
  localStorage.setItem(LS_TABS, JSON.stringify({ openTabIds, activeTabId }))

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const stripRuntimeFiles = (items: FetchItem[]): FetchItem[] => {
  const normalize = (item: FetchItem): FetchItem => {
    if (item.type === 'folder') return { ...item, children: item.children.map(normalize) }
    return { ...item, formFiles: item.formFiles.map((r) => ({ ...r, files: [] })) }
  }
  return cloneJson(items).map(normalize)
}

const saveItems = (items: FetchItem[]) =>
  localStorage.setItem(LS_ITEMS, JSON.stringify(stripRuntimeFiles(items)))

// ── Supabase workspace sync ──────────────────────────────────
let syncTimer: ReturnType<typeof setTimeout> | null = null
let pendingSnap: { items: FetchItem[]; env_vars: EnvVar[]; open_tabs: { openTabIds: string[]; activeTabId: string | null } } | null = null

const doSync = async (snap: typeof pendingSnap) => {
  if (!snap) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  try {
    await fetchlabService.saveWorkspace(user.id, snap.items, snap.env_vars, snap.open_tabs)
  } catch {
    // Retry once after 1s
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) fetchlabService.saveWorkspace(user.id, snap.items, snap.env_vars, snap.open_tabs)
    }, 1000)
  }
}

const scheduleSyncWorkspace = (items: FetchItem[], envVars: EnvVar[], openTabIds: string[], activeTabId: string | null) => {
  pendingSnap = { items: stripRuntimeFiles(items), env_vars: cloneJson(envVars), open_tabs: { openTabIds, activeTabId } }
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const snap = pendingSnap
    pendingSnap = null
    doSync(snap)
  }, 300)
}

// ── Tree helpers ──────────────────────────────────────────────
const findItem = (id: string, arr: FetchItem[]): FetchItem | null => {
  for (const item of arr) {
    if (item.id === id) return item
    if (item.type === 'folder') { const f = findItem(id, item.children); if (f) return f }
  }
  return null
}

const removeFromTree = (id: string, arr: FetchItem[]): boolean => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === id) { arr.splice(i, 1); return true }
    if (arr[i].type === 'folder' && removeFromTree(id, (arr[i] as FetchFolder).children)) return true
  }
  return false
}

const getParentArray = (id: string, root: FetchItem[]): FetchItem[] | null => {
  for (const item of root) {
    if (item.id === id) return root
    if (item.type === 'folder') { const f = getParentArray(id, (item as FetchFolder).children); if (f) return f }
  }
  return null
}

const getAllFolders = (arr: FetchItem[]): FetchFolder[] => {
  const result: FetchFolder[] = []
  for (const item of arr) {
    if (item.type === 'folder') { result.push(item as FetchFolder); result.push(...getAllFolders((item as FetchFolder).children)) }
  }
  return result
}

const deepClone = cloneJson

const replaceRequestInTree = (items: FetchItem[], request: FetchRequest): boolean => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type === 'request' && item.id === request.id) { items[i] = deepClone(request); return true }
    if (item.type === 'folder' && replaceRequestInTree(item.children, request)) return true
  }
  return false
}

const persistWorkspace = (state: FetchLabState) => {
  if (state.currentRequest) replaceRequestInTree(state.items, state.currentRequest)
  saveItems(state.items)
  scheduleSyncWorkspace(state.items, state.envVars, state.openTabIds, state.activeTabId)
}

const replaceEnvVars = (str: string, vars: EnvVar[]): string => {
  let result = str
  vars.filter((v) => v.enabled && v.key).forEach((v) => { result = result.replaceAll(`{{${v.key}}}`, v.value) })
  return result
}

// ── Load saved tabs into tabRequests from items tree ──────────
const initTabRequests = (openTabIds: string[], items: FetchItem[]): Record<string, FetchRequest> => {
  const out: Record<string, FetchRequest> = {}
  for (const id of openTabIds) {
    const req = findItem(id, items)
    if (req && req.type === 'request') out[id] = deepClone(req as FetchRequest)
  }
  return out
}

// ── Async thunk: load from Supabase ───────────────────────────
export const loadFetchLabFromSupabase = createAsyncThunk(
  'fetchlab/loadFromSupabase',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchlabService.loadWorkspace()
    } catch (err) {
      return rejectWithValue((err as Error).message)
    }
  },
)

// ── Blank helpers ─────────────────────────────────────────────
export const blankRequest = (name = 'New Request'): FetchRequest => ({
  id: generateId(), type: 'request', name,
  method: 'GET', url: '',
  params: [], headers: [],
  authType: 'none', authData: {},
  bodyType: 'none', jsonBody: '', xmlBody: '', textBody: '',
  formFields: [], formFiles: [], formEncodeFields: [],
  gqlQuery: '', gqlVars: '',
  testsScript: '', prerunScript: '',
  createdAt: new Date().toISOString(),
})

const blankKV = (): KVRow => ({ id: generateId(), enabled: true, key: '', value: '' })

// ── JWT token generation via Web Crypto API ───────────────────
async function generateJwtToken(algorithm: string, secret: string, payload: string, header: string): Promise<string> {
  const algMap: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }
  const hashAlg = algMap[algorithm] || 'SHA-256'

  const b64url = (obj: object | string) => {
    const json = typeof obj === 'string' ? obj : JSON.stringify(obj)
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  }

  let headerObj: object
  let payloadObj: object
  try { headerObj = header ? JSON.parse(header) : { alg: algorithm, typ: 'JWT' } } catch { headerObj = { alg: algorithm, typ: 'JWT' } }
  try { payloadObj = payload ? JSON.parse(payload) : {} } catch { payloadObj = {} }

  const data = `${b64url(headerObj)}.${b64url(payloadObj)}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: hashAlg },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${data}.${sigB64}`
}

// ── Async thunk: send request ─────────────────────────────────
export const sendRequest = createAsyncThunk(
  'fetchlab/sendRequest',
  async (_, { getState, rejectWithValue }) => {
    const state = (getState() as { fetchlab: FetchLabState }).fetchlab
    const req = state.currentRequest
    if (!req) return rejectWithValue('No request selected')
    if (!req.url.trim()) return rejectWithValue('Enter a URL first')

    const env = state.envVars
    const start = Date.now()

    try {
      const rawUrl = replaceEnvVars(req.url.trim(), env)
      const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)

      req.params.filter((p) => p.enabled && p.key).forEach((p) =>
        urlObj.searchParams.set(replaceEnvVars(p.key, env), replaceEnvVars(p.value, env)),
      )

      const headers: Record<string, string> = {}
      req.headers.filter((h) => h.enabled && h.key).forEach((h) => {
        headers[replaceEnvVars(h.key, env)] = replaceEnvVars(h.value, env)
      })

      // Auth
      if (req.authType === 'bearer' && req.authData.bearerToken) {
        headers['Authorization'] = `Bearer ${replaceEnvVars(req.authData.bearerToken, env)}`
      } else if (req.authType === 'basic') {
        const u = replaceEnvVars(req.authData.basicUsername || '', env)
        const p = replaceEnvVars(req.authData.basicPassword || '', env)
        headers['Authorization'] = `Basic ${btoa(`${u}:${p}`)}`
      } else if (req.authType === 'jwt') {
        const token = req.authData.jwtToken || ''
        if (token) headers['Authorization'] = `Bearer ${token}`
      } else if (req.authType === 'apikey') {
        const k = replaceEnvVars(req.authData.apiKeyKey || '', env)
        const v = replaceEnvVars(req.authData.apiKeyValue || '', env)
        if (req.authData.apiKeyIn === 'query') urlObj.searchParams.set(k, v)
        else headers[k] = v
      } else if (req.authType === 'oauth2' && req.authData.oauth2Token) {
        headers['Authorization'] = `Bearer ${replaceEnvVars(req.authData.oauth2Token, env)}`
      }

      let body: BodyInit | undefined
      const sentHeaders = { ...headers }

      if (!['GET', 'HEAD'].includes(req.method)) {
        if (req.bodyType === 'json') {
          headers['Content-Type'] = headers['Content-Type'] || 'application/json'
          body = replaceEnvVars(req.jsonBody, env)
        } else if (req.bodyType === 'xml') {
          headers['Content-Type'] = headers['Content-Type'] || 'application/xml'
          body = replaceEnvVars(req.xmlBody, env)
        } else if (req.bodyType === 'text') {
          headers['Content-Type'] = headers['Content-Type'] || 'text/plain'
          body = replaceEnvVars(req.textBody, env)
        } else if (req.bodyType === 'formencode') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded'
          const p = new URLSearchParams()
          req.formEncodeFields.filter((f) => f.enabled && f.key).forEach((f) =>
            p.set(replaceEnvVars(f.key, env), replaceEnvVars(f.value, env)),
          )
          body = p.toString()
        } else if (req.bodyType === 'form') {
          const fd = new FormData()
          req.formFields.filter((f) => f.enabled && f.key).forEach((f) => {
            if (f.fieldType === 'file') {
              const files = formFileStore.get(f.id)
              if (files) Array.from(files).forEach((file) => fd.append(f.key, file))
            } else {
              fd.append(f.key, replaceEnvVars(f.value, env))
            }
          })
          body = fd
        } else if (req.bodyType === 'binary' && binaryFile) {
          headers['Content-Type'] = headers['Content-Type'] || binaryFile.type || 'application/octet-stream'
          body = binaryFile
        } else if (req.bodyType === 'graphql') {
          headers['Content-Type'] = 'application/json'
          let variables = {}
          try { variables = JSON.parse(req.gqlVars || '{}') } catch { /**/ }
          body = JSON.stringify({ query: req.gqlQuery, variables })
        }
      }

      const reqBodyStr = body instanceof FormData ? '[FormData]' : (typeof body === 'string' ? body : undefined)

      const res = await fetch(urlObj.toString(), { method: req.method, headers, body })
      const duration = Date.now() - start
      const text = await res.text()
      const size = new Blob([text]).size

      const resHeaders: Record<string, string> = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      let prettyBody = text
      try { prettyBody = JSON.stringify(JSON.parse(text), null, 2) } catch { /**/ }

      return {
        status: res.status,
        statusText: res.statusText,
        duration,
        size,
        body: text,
        headers: resHeaders,
        prettyBody,
        requestSnapshot: { method: req.method, url: urlObj.toString(), headers: sentHeaders, body: reqBodyStr },
      } as ResponseData
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Request failed'
      return rejectWithValue(msg)
    }
  },
)

// ── Initial state ─────────────────────────────────────────────
const savedItems = loadItems()
const savedTabState = loadTabState()
const initialTabRequests = initTabRequests(savedTabState.openTabIds, savedItems)
const initialActiveId = savedTabState.activeTabId
const initialCurrentRequest = initialActiveId ? (initialTabRequests[initialActiveId] ?? null) : null

const initialState: FetchLabState = {
  items: savedItems,
  envVars: loadEnv(),
  currentId: initialActiveId,
  currentRequest: initialCurrentRequest,
  response: null,
  sending: false,
  activeMainTab: 'query',
  activeBodyTab: initialCurrentRequest?.bodyType ?? 'none',
  openTabIds: savedTabState.openTabIds,
  activeTabId: initialActiveId,
  tabRequests: initialTabRequests,
  tabResponses: {},
}

// ── Slice ─────────────────────────────────────────────────────
const fetchlabSlice = createSlice({
  name: 'fetchlab',
  initialState,
  reducers: {
    // ── Tab management ────────────────────────────────────────
    openInTab(state, action: PayloadAction<string>) {
      const requestId = action.payload
      // Save current edits to tabRequests before switching
      if (state.activeTabId && state.currentRequest) {
        state.tabRequests[state.activeTabId] = deepClone(state.currentRequest)
      }
      if (!state.openTabIds.includes(requestId)) {
        // Open new tab
        const req = findItem(requestId, state.items)
        if (!req || req.type !== 'request') return
        state.openTabIds.push(requestId)
        state.tabRequests[requestId] = deepClone(req as FetchRequest)
      }
      state.activeTabId = requestId
      state.currentId = requestId
      state.currentRequest = deepClone(state.tabRequests[requestId])
      state.response = state.tabResponses[requestId] ?? null
      state.activeBodyTab = state.currentRequest?.bodyType ?? 'none'
      state.activeMainTab = 'query'
      saveTabState(state.openTabIds, state.activeTabId)
    },

    closeTab(state, action: PayloadAction<string>) {
      const requestId = action.payload
      const idx = state.openTabIds.indexOf(requestId)
      if (idx === -1) return
      state.openTabIds.splice(idx, 1)
      delete state.tabRequests[requestId]
      delete state.tabResponses[requestId]
      // If closing the active tab, switch to adjacent
      if (state.activeTabId === requestId) {
        const nextId = state.openTabIds[idx] ?? state.openTabIds[idx - 1] ?? null
        state.activeTabId = nextId
        state.currentId = nextId
        state.currentRequest = nextId ? (deepClone(state.tabRequests[nextId]) ?? null) : null
        state.response = nextId ? (state.tabResponses[nextId] ?? null) : null
        state.activeBodyTab = state.currentRequest?.bodyType ?? 'none'
      }
      saveTabState(state.openTabIds, state.activeTabId)
    },

    switchTab(state, action: PayloadAction<string>) {
      const requestId = action.payload
      if (!state.openTabIds.includes(requestId)) return
      if (state.activeTabId && state.currentRequest) {
        state.tabRequests[state.activeTabId] = deepClone(state.currentRequest)
      }
      state.activeTabId = requestId
      state.currentId = requestId
      state.currentRequest = deepClone(state.tabRequests[requestId])
      state.response = state.tabResponses[requestId] ?? null
      state.activeBodyTab = state.currentRequest?.bodyType ?? 'none'
      saveTabState(state.openTabIds, state.activeTabId)
    },

    // ── Collections ───────────────────────────────────────────
    createRequest(state, action: PayloadAction<{ parentId: string | null; name: string }>) {
      const req = blankRequest(action.payload.name)
      if (!action.payload.parentId) {
        state.items.push(req)
      } else {
        const addToFolder = (items: FetchItem[]): boolean => {
          for (const item of items) {
            if (item.type === 'folder' && item.id === action.payload.parentId) { item.children.push(req); return true }
            if (item.type === 'folder' && addToFolder(item.children)) return true
          }
          return false
        }
        if (!addToFolder(state.items)) state.items.push(req)
      }
      // Auto-open in tab
      if (state.activeTabId && state.currentRequest) {
        state.tabRequests[state.activeTabId] = deepClone(state.currentRequest)
      }
      state.openTabIds.push(req.id)
      state.tabRequests[req.id] = deepClone(req)
      state.activeTabId = req.id
      state.currentId = req.id
      state.currentRequest = req
      state.response = null
      state.activeMainTab = 'query'
      saveTabState(state.openTabIds, state.activeTabId)
      persistWorkspace(state)
    },

    createFolder(state, action: PayloadAction<string>) {
      state.items.push({ id: generateId(), type: 'folder', name: action.payload, open: true, children: [] })
      persistWorkspace(state)
    },

    duplicateRequest(state, action: PayloadAction<string>) {
      const orig = findItem(action.payload, state.items)
      if (!orig || orig.type !== 'request') return
      const copy: FetchRequest = { ...deepClone(orig as FetchRequest), id: generateId(), name: `${orig.name} (copy)` }
      const arr = getParentArray(action.payload, state.items) || state.items
      const idx = arr.findIndex((i) => i.id === action.payload)
      arr.splice(idx + 1, 0, copy)
      persistWorkspace(state)
    },

    moveToFolder(state, action: PayloadAction<{ id: string; targetFolderId: string | null }>) {
      const item = findItem(action.payload.id, state.items)
      if (!item) return
      const clone = deepClone(item)
      removeFromTree(action.payload.id, state.items)
      if (action.payload.targetFolderId) {
        const folder = findItem(action.payload.targetFolderId, state.items) as FetchFolder | null
        if (folder?.type === 'folder') { folder.children.push(clone); folder.open = true }
      } else {
        state.items.push(clone)
      }
      persistWorkspace(state)
    },

    reorderItems(state, action: PayloadAction<{ dragId: string; targetId: string; pos: 'before' | 'after' | 'into' }>) {
      const { dragId, targetId, pos } = action.payload
      const dragItem = findItem(dragId, state.items)
      if (!dragItem) return
      const clone = deepClone(dragItem)
      removeFromTree(dragId, state.items)
      const targetItem = findItem(targetId, state.items)
      if (pos === 'into' && targetItem?.type === 'folder') {
        ;(targetItem as FetchFolder).children.push(clone)
        ;(targetItem as FetchFolder).open = true
      } else {
        const arr = getParentArray(targetId, state.items) || state.items
        const idx = arr.findIndex((i) => i.id === targetId)
        if (idx !== -1) arr.splice(pos === 'before' ? idx : idx + 1, 0, clone)
        else state.items.push(clone)
      }
      persistWorkspace(state)
    },

    selectRequest(state, action: PayloadAction<string>) {
      // selectRequest now calls openInTab logic internally
      const requestId = action.payload
      if (state.activeTabId && state.currentRequest) {
        state.tabRequests[state.activeTabId] = deepClone(state.currentRequest)
      }
      if (!state.openTabIds.includes(requestId)) {
        const req = findItem(requestId, state.items)
        if (!req || req.type !== 'request') return
        state.openTabIds.push(requestId)
        state.tabRequests[requestId] = deepClone(req as FetchRequest)
      }
      state.activeTabId = requestId
      state.currentId = requestId
      state.currentRequest = deepClone(state.tabRequests[requestId])
      state.response = state.tabResponses[requestId] ?? null
      state.activeBodyTab = state.currentRequest?.bodyType ?? 'none'
      state.activeMainTab = 'query'
      saveTabState(state.openTabIds, state.activeTabId)
    },

    updateCurrentRequest(state, action: PayloadAction<Partial<FetchRequest>>) {
      if (state.currentRequest) {
        state.currentRequest = { ...state.currentRequest, ...action.payload }
        if (state.activeTabId) state.tabRequests[state.activeTabId] = deepClone(state.currentRequest)
        persistWorkspace(state)
      }
    },

    saveCurrentRequest(state) {
      if (!state.currentRequest || !state.currentId) return
      const update = (items: FetchItem[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type === 'request' && items[i].id === state.currentId) { items[i] = deepClone(state.currentRequest!); return true }
          if (items[i].type === 'folder' && update((items[i] as FetchFolder).children)) return true
        }
        return false
      }
      update(state.items)
      persistWorkspace(state)
    },

    deleteItem(state, action: PayloadAction<string>) {
      const remove = (items: FetchItem[]): FetchItem[] =>
        items.filter((i) => i.id !== action.payload).map((i) =>
          i.type === 'folder' ? { ...i, children: remove(i.children) } : i,
        )
      state.items = remove(state.items)
      // Close tab if open
      const idx = state.openTabIds.indexOf(action.payload)
      if (idx !== -1) {
        state.openTabIds.splice(idx, 1)
        delete state.tabRequests[action.payload]
        delete state.tabResponses[action.payload]
        if (state.activeTabId === action.payload) {
          const nextId = state.openTabIds[idx] ?? state.openTabIds[idx - 1] ?? null
          state.activeTabId = nextId
          state.currentId = nextId
          state.currentRequest = nextId ? (deepClone(state.tabRequests[nextId]) ?? null) : null
          state.response = nextId ? (state.tabResponses[nextId] ?? null) : null
        }
        saveTabState(state.openTabIds, state.activeTabId)
      } else if (state.currentId === action.payload) {
        state.currentId = null; state.currentRequest = null; state.response = null
      }
      persistWorkspace(state)
    },

    renameItem(state, action: PayloadAction<{ id: string; name: string }>) {
      const rename = (items: FetchItem[]) => {
        for (const item of items) {
          if (item.id === action.payload.id) {
            item.name = action.payload.name
            if (state.currentId === item.id && state.currentRequest) state.currentRequest.name = action.payload.name
            if (state.tabRequests[item.id]) state.tabRequests[item.id].name = action.payload.name
            return
          }
          if (item.type === 'folder') rename(item.children)
        }
      }
      rename(state.items)
      persistWorkspace(state)
    },

    toggleFolder(state, action: PayloadAction<string>) {
      const toggle = (items: FetchItem[]) => {
        for (const item of items) {
          if (item.type === 'folder' && item.id === action.payload) { item.open = !item.open; return }
          if (item.type === 'folder') toggle(item.children)
        }
      }
      toggle(state.items)
      persistWorkspace(state)
    },

    // ── Env vars ──────────────────────────────────────────────
    addEnvVar(state) {
      state.envVars.push({ id: generateId(), enabled: true, key: '', value: '' })
      saveEnv(state.envVars)
      scheduleSyncWorkspace(state.items, state.envVars, state.openTabIds, state.activeTabId)
    },
    updateEnvVar(state, action: PayloadAction<{ id: string; field: 'key' | 'value' | 'enabled'; value: string | boolean }>) {
      const v = state.envVars.find((x) => x.id === action.payload.id)
      if (v) { (v[action.payload.field] as string | boolean) = action.payload.value; saveEnv(state.envVars) }
    },
    deleteEnvVar(state, action: PayloadAction<string>) {
      state.envVars = state.envVars.filter((v) => v.id !== action.payload)
      saveEnv(state.envVars)
    },
    setEnvVars(state, action: PayloadAction<EnvVar[]>) {
      state.envVars = action.payload; saveEnv(action.payload)
    },

    // ── KV rows ───────────────────────────────────────────────
    addKVRow(state, action: PayloadAction<{ target: 'params' | 'headers' | 'formEncodeFields' }>) {
      if (state.currentRequest) { state.currentRequest[action.payload.target].push(blankKV()); persistWorkspace(state) }
    },
    updateKVRow(state, action: PayloadAction<{ target: 'params' | 'headers' | 'formEncodeFields'; id: string; field: 'key' | 'value' | 'enabled'; value: string | boolean }>) {
      if (state.currentRequest) {
        const row = state.currentRequest[action.payload.target].find((r) => r.id === action.payload.id)
        if (row) (row[action.payload.field] as string | boolean) = action.payload.value
        persistWorkspace(state)
      }
    },
    deleteKVRow(state, action: PayloadAction<{ target: 'params' | 'headers' | 'formEncodeFields'; id: string }>) {
      if (state.currentRequest) {
        state.currentRequest[action.payload.target] = state.currentRequest[action.payload.target].filter((r) => r.id !== action.payload.id)
        persistWorkspace(state)
      }
    },
    setKVRows(state, action: PayloadAction<{ target: 'params' | 'headers' | 'formEncodeFields'; rows: KVRow[] }>) {
      if (state.currentRequest) {
        state.currentRequest[action.payload.target] = action.payload.rows
        persistWorkspace(state)
      }
    },

    // ── Form fields ───────────────────────────────────────────
    addFormField(state) {
      if (state.currentRequest) {
        state.currentRequest.formFields.push({ id: generateId(), enabled: true, key: '', value: '', fieldType: 'text' })
        persistWorkspace(state)
      }
    },
    updateFormField(state, action: PayloadAction<{ id: string; field: keyof FormField; value: string | boolean }>) {
      if (state.currentRequest) {
        const row = state.currentRequest.formFields.find((r) => r.id === action.payload.id)
        if (row) (row[action.payload.field] as string | boolean) = action.payload.value
        persistWorkspace(state)
      }
    },
    deleteFormField(state, action: PayloadAction<string>) {
      if (state.currentRequest) {
        state.currentRequest.formFields = state.currentRequest.formFields.filter((r) => r.id !== action.payload)
        persistWorkspace(state)
      }
    },
    setFormFields(state, action: PayloadAction<FormField[]>) {
      if (state.currentRequest) { state.currentRequest.formFields = action.payload; persistWorkspace(state) }
    },

    // ── Form files ────────────────────────────────────────────
    addFormFile(state) {
      if (state.currentRequest) {
        state.currentRequest.formFiles.push({ id: generateId(), enabled: true, key: '', files: [] })
        persistWorkspace(state)
      }
    },
    updateFormFileKey(state, action: PayloadAction<{ id: string; key: string }>) {
      if (state.currentRequest) {
        const row = state.currentRequest.formFiles.find((r) => r.id === action.payload.id)
        if (row) row.key = action.payload.key
        persistWorkspace(state)
      }
    },
    updateFormFileEnabled(state, action: PayloadAction<{ id: string; enabled: boolean }>) {
      if (state.currentRequest) {
        const row = state.currentRequest.formFiles.find((r) => r.id === action.payload.id)
        if (row) row.enabled = action.payload.enabled
        persistWorkspace(state)
      }
    },
    deleteFormFile(state, action: PayloadAction<string>) {
      if (state.currentRequest) {
        state.currentRequest.formFiles = state.currentRequest.formFiles.filter((r) => r.id !== action.payload)
        persistWorkspace(state)
      }
    },

    // ── Tabs ──────────────────────────────────────────────────
    setActiveMainTab(state, action: PayloadAction<string>) { state.activeMainTab = action.payload },
    setActiveBodyTab(state, action: PayloadAction<BodyType>) {
      state.activeBodyTab = action.payload
      if (state.currentRequest) { state.currentRequest.bodyType = action.payload; persistWorkspace(state) }
    },

    // ── Misc ──────────────────────────────────────────────────
    clearResponse(state) {
      state.response = null
      if (state.activeTabId) delete state.tabResponses[state.activeTabId]
    },

    importData(state, action: PayloadAction<{ items: FetchItem[]; envVars?: EnvVar[] }>) {
      state.items = action.payload.items
      if (action.payload.envVars) state.envVars = action.payload.envVars
      saveItems(state.items)
      if (action.payload.envVars) saveEnv(state.envVars)
      scheduleSyncWorkspace(state.items, state.envVars, state.openTabIds, state.activeTabId)
    },
  },

  extraReducers: (builder) => {
    builder.addCase(loadFetchLabFromSupabase.fulfilled, (state, action) => {
      const workspace = action.payload as { items: FetchItem[]; envVars: EnvVar[]; openTabs?: { openTabIds: string[]; activeTabId: string | null } } | null
      // Prefer localStorage — it is always saved immediately on every change.
      // Supabase is debounced and may be stale. Only restore from Supabase when
      // localStorage is empty (first visit, cleared storage, or new device).
      if (state.items.length > 0 || state.envVars.length > 0) return
      if (workspace && (workspace.items.length > 0 || workspace.envVars.length > 0)) {
        state.items = workspace.items
        state.envVars = workspace.envVars
        saveItems(state.items)
        saveEnv(state.envVars)
        // Restore tabs from Supabase if available
        if (workspace.openTabs && workspace.openTabs.openTabIds.length > 0) {
          state.openTabIds = workspace.openTabs.openTabIds.filter((id) => !!findItem(id, state.items))
          state.activeTabId = state.openTabIds.includes(workspace.openTabs.activeTabId ?? '') ? workspace.openTabs.activeTabId : (state.openTabIds[0] ?? null)
          state.tabRequests = initTabRequests(state.openTabIds, state.items)
          state.currentId = state.activeTabId
          state.currentRequest = state.activeTabId ? (deepClone(state.tabRequests[state.activeTabId]) ?? null) : null
          state.activeBodyTab = state.currentRequest?.bodyType ?? 'none'
          saveTabState(state.openTabIds, state.activeTabId)
        }
      }
    })

    builder
      .addCase(sendRequest.pending, (state) => { state.sending = true; state.response = null })
      .addCase(sendRequest.fulfilled, (state, action) => {
        state.sending = false
        const resp = action.payload as ResponseData
        state.response = resp
        if (state.activeTabId) state.tabResponses[state.activeTabId] = resp
      })
      .addCase(sendRequest.rejected, (state, action) => {
        state.sending = false
        const errResp: ResponseData = {
          status: 0, statusText: 'Error', duration: 0, size: 0,
          body: String(action.payload || 'Request failed'),
          headers: {}, prettyBody: String(action.payload || 'Request failed'),
        }
        state.response = errResp
        if (state.activeTabId) state.tabResponses[state.activeTabId] = errResp
      })
  },
})

export const {
  openInTab, closeTab, switchTab,
  createRequest, createFolder, duplicateRequest, moveToFolder, reorderItems,
  selectRequest, updateCurrentRequest, saveCurrentRequest, deleteItem, renameItem, toggleFolder,
  addEnvVar, updateEnvVar, deleteEnvVar, setEnvVars,
  addKVRow, updateKVRow, deleteKVRow, setKVRows,
  addFormField, updateFormField, deleteFormField, setFormFields,
  addFormFile, updateFormFileKey, updateFormFileEnabled, deleteFormFile,
  setActiveMainTab, setActiveBodyTab,
  clearResponse, importData,
} = fetchlabSlice.actions

export default fetchlabSlice.reducer

export { getAllFolders, findItem }
