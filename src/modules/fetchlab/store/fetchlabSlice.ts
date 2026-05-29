import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type {
  FetchLabState,
  FetchItem,
  FetchRequest,
  FetchFolder,
  EnvVar,
  HistoryEntry,
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

const LS_ITEMS = 'fl2_items'
const LS_ENV = 'fl2_env'
const LS_HIST = 'fl2_hist'

const loadItems = (): FetchItem[] => {
  try { return JSON.parse(localStorage.getItem(LS_ITEMS) || '[]') } catch { return [] }
}
const loadEnv = (): EnvVar[] => {
  try { return JSON.parse(localStorage.getItem(LS_ENV) || '[]') } catch { return [] }
}
const loadHistory = (): HistoryEntry[] => {
  try { return JSON.parse(localStorage.getItem(LS_HIST) || '[]') } catch { return [] }
}
const saveEnv = (vars: EnvVar[]) => localStorage.setItem(LS_ENV, JSON.stringify(vars))
const saveHistory = (hist: HistoryEntry[]) => localStorage.setItem(LS_HIST, JSON.stringify(hist))

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const stripRuntimeFiles = (items: FetchItem[]): FetchItem[] => {
  const normalize = (item: FetchItem): FetchItem => {
    if (item.type === 'folder') {
      return { ...item, children: item.children.map(normalize) }
    }
    return {
      ...item,
      formFiles: item.formFiles.map((row) => ({ ...row, files: [] })),
    }
  }
  return cloneJson(items).map(normalize)
}

const saveItems = (items: FetchItem[]) =>
  localStorage.setItem(LS_ITEMS, JSON.stringify(stripRuntimeFiles(items)))

// Debounced Supabase workspace sync (1.5 s after last mutation)
let syncTimer: ReturnType<typeof setTimeout> | null = null
const scheduleSyncWorkspace = (items: FetchItem[], envVars: EnvVar[]) => {
  const itemsSnapshot = stripRuntimeFiles(items)
  const envSnapshot = cloneJson(envVars)
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await fetchlabService.saveWorkspace(user.id, itemsSnapshot, envSnapshot)
  }, 1500)
}

// ── Async thunks ──────────────────────────────────────────────
export const loadFetchLabFromSupabase = createAsyncThunk(
  'fetchlab/loadFromSupabase',
  async (_, { rejectWithValue }) => {
    try {
      const [workspace, history] = await Promise.all([
        fetchlabService.loadWorkspace(),
        fetchlabService.loadHistory(),
      ])
      return { workspace, history }
    } catch (err) {
      return rejectWithValue((err as Error).message)
    }
  },
)

export const blankRequest = (name = 'New Request'): FetchRequest => ({
  id: generateId(), type: 'request', name,
  method: 'GET', url: '',
  params: [], headers: [],
  authType: 'none', authData: {},
  bodyType: 'json', jsonBody: '', xmlBody: '', textBody: '',
  formFields: [], formFiles: [], formEncodeFields: [],
  gqlQuery: '', gqlVars: '',
  testsScript: '', prerunScript: '',
  createdAt: new Date().toISOString(),
})

const blankKV = (): KVRow => ({ id: generateId(), enabled: true, key: '', value: '' })

// ── Tree helpers ──────────────────────────────────────────
const findItem = (id: string, arr: FetchItem[]): FetchItem | null => {
  for (const item of arr) {
    if (item.id === id) return item
    if (item.type === 'folder') {
      const found = findItem(id, item.children)
      if (found) return found
    }
  }
  return null
}

const removeFromTree = (id: string, arr: FetchItem[]): boolean => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === id) { arr.splice(i, 1); return true }
    if (arr[i].type === 'folder') {
      if (removeFromTree(id, (arr[i] as FetchFolder).children)) return true
    }
  }
  return false
}

const getParentArray = (id: string, root: FetchItem[]): FetchItem[] | null => {
  for (const item of root) {
    if (item.id === id) return root
    if (item.type === 'folder') {
      const found = getParentArray(id, (item as FetchFolder).children)
      if (found) return found
    }
  }
  return null
}

const getAllFolders = (arr: FetchItem[]): FetchFolder[] => {
  const result: FetchFolder[] = []
  for (const item of arr) {
    if (item.type === 'folder') {
      result.push(item as FetchFolder)
      result.push(...getAllFolders((item as FetchFolder).children))
    }
  }
  return result
}

const deepClone = cloneJson

const replaceRequestInTree = (items: FetchItem[], request: FetchRequest): boolean => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type === 'request' && item.id === request.id) {
      items[i] = deepClone(request)
      return true
    }
    if (item.type === 'folder' && replaceRequestInTree(item.children, request)) return true
  }
  return false
}

const persistWorkspace = (state: FetchLabState) => {
  if (state.currentRequest) {
    replaceRequestInTree(state.items, state.currentRequest)
  }
  saveItems(state.items)
  scheduleSyncWorkspace(state.items, state.envVars)
}

const replaceEnvVars = (str: string, vars: EnvVar[]): string => {
  let result = str
  vars.filter((v) => v.enabled && v.key).forEach((v) => {
    result = result.replaceAll(`{{${v.key}}}`, v.value)
  })
  return result
}

// ── Async thunk: send request ─────────────────────────────
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
        urlObj.searchParams.set(p.key, replaceEnvVars(p.value, env)),
      )

      const headers: Record<string, string> = {}
      req.headers.filter((h) => h.enabled && h.key).forEach((h) => {
        headers[replaceEnvVars(h.key, env)] = replaceEnvVars(h.value, env)
      })

      if (req.authType === 'bearer' && req.authData.bearerToken)
        headers['Authorization'] = `Bearer ${replaceEnvVars(req.authData.bearerToken, env)}`
      else if (req.authType === 'basic')
        headers['Authorization'] = `Basic ${btoa(`${req.authData.basicUsername || ''}:${req.authData.basicPassword || ''}`)}`
      else if (req.authType === 'apikey') {
        const k = replaceEnvVars(req.authData.apiKeyKey || '', env)
        const v = replaceEnvVars(req.authData.apiKeyValue || '', env)
        if (req.authData.apiKeyIn === 'query') urlObj.searchParams.set(k, v)
        else headers[k] = v
      } else if (req.authType === 'oauth2' && req.authData.oauth2Token)
        headers['Authorization'] = `Bearer ${replaceEnvVars(req.authData.oauth2Token, env)}`

      let body: BodyInit | undefined
      if (!['GET', 'HEAD'].includes(req.method)) {
        if (req.bodyType === 'json') {
          headers['Content-Type'] = headers['Content-Type'] || 'application/json'
          body = replaceEnvVars(req.jsonBody, env)
        } else if (req.bodyType === 'xml') {
          headers['Content-Type'] = headers['Content-Type'] || 'application/xml'
          body = req.xmlBody
        } else if (req.bodyType === 'text') {
          headers['Content-Type'] = headers['Content-Type'] || 'text/plain'
          body = req.textBody
        } else if (req.bodyType === 'formencode') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded'
          const p = new URLSearchParams()
          req.formEncodeFields.filter((f) => f.enabled && f.key).forEach((f) => p.set(f.key, f.value))
          body = p.toString()
        } else if (req.bodyType === 'form') {
          const fd = new FormData()
          req.formFields.filter((f) => f.enabled && f.key).forEach((f) => fd.append(f.key, f.value))
          // formFiles are handled via DOM ref in component — skipped here (can't be serialized in Redux)
          body = fd
        } else if (req.bodyType === 'graphql') {
          headers['Content-Type'] = 'application/json'
          let variables = {}
          try { variables = JSON.parse(req.gqlVars || '{}') } catch { /**/ }
          body = JSON.stringify({ query: req.gqlQuery, variables })
        }
      }

      const res = await fetch(urlObj.toString(), { method: req.method, headers, body })
      const duration = Date.now() - start
      const text = await res.text()
      const size = new Blob([text]).size

      const resHeaders: Record<string, string> = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      let prettyBody = text
      try { prettyBody = JSON.stringify(JSON.parse(text), null, 2) } catch { /**/ }

      return { status: res.status, statusText: res.statusText, duration, size, body: text, headers: resHeaders, prettyBody } as ResponseData
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || 'Request failed')
    }
  },
)

const initialState: FetchLabState = {
  items: loadItems(),
  envVars: loadEnv(),
  history: loadHistory(),
  currentId: null,
  currentRequest: null,
  response: null,
  sending: false,
  activeMainTab: 'query',
  activeBodyTab: 'json',
  sidebarTab: 'collections',
}

const fetchlabSlice = createSlice({
  name: 'fetchlab',
  initialState,
  reducers: {
    // ── Collections ──────────────────────────────────────
    createRequest(state, action: PayloadAction<{ parentId: string | null; name: string }>) {
      const req = blankRequest(action.payload.name)
      if (!action.payload.parentId) {
        state.items.push(req)
      } else {
        const addToFolder = (items: FetchItem[]): boolean => {
          for (const item of items) {
            if (item.type === 'folder' && item.id === action.payload.parentId) {
              item.children.push(req); return true
            }
            if (item.type === 'folder' && addToFolder(item.children)) return true
          }
          return false
        }
        if (!addToFolder(state.items)) state.items.push(req)
      }
      state.currentId = req.id
      state.currentRequest = req
      state.response = null
      persistWorkspace(state)
    },

    createFolder(state, action: PayloadAction<string>) {
      const folder: FetchFolder = { id: generateId(), type: 'folder', name: action.payload, open: true, children: [] }
      state.items.push(folder)
      persistWorkspace(state)
    },

    duplicateRequest(state, action: PayloadAction<string>) {
      const orig = findItem(action.payload, state.items)
      if (!orig || orig.type !== 'request') return
      const copy: FetchRequest = { ...deepClone(orig as FetchRequest), id: generateId(), name: `${orig.name} (copy)` }
      const parentArr = getParentArray(action.payload, state.items)
      const arr = parentArr || state.items
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
        if (folder && folder.type === 'folder') {
          folder.children.push(clone)
          folder.open = true
        }
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
      const findReq = (items: FetchItem[]): FetchRequest | null => {
        for (const item of items) {
          if (item.type === 'request' && item.id === action.payload) return item
          if (item.type === 'folder') { const f = findReq(item.children); if (f) return f }
        }
        return null
      }
      const req = findReq(state.items)
      if (req) {
        state.currentId = req.id
        state.currentRequest = deepClone(req)
        state.response = null
        state.activeMainTab = 'query'
        state.activeBodyTab = req.bodyType
      }
    },

    updateCurrentRequest(state, action: PayloadAction<Partial<FetchRequest>>) {
      if (state.currentRequest) {
        state.currentRequest = { ...state.currentRequest, ...action.payload }
        persistWorkspace(state)
      }
    },

    saveCurrentRequest(state) {
      if (!state.currentRequest || !state.currentId) return
      const update = (items: FetchItem[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type === 'request' && items[i].id === state.currentId) {
            items[i] = deepClone(state.currentRequest!); return true
          }
          if (items[i].type === 'folder') { if (update((items[i] as FetchFolder).children)) return true }
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
      if (state.currentId === action.payload) { state.currentId = null; state.currentRequest = null; state.response = null }
      persistWorkspace(state)
    },

    renameItem(state, action: PayloadAction<{ id: string; name: string }>) {
      const rename = (items: FetchItem[]) => {
        for (const item of items) {
          if (item.id === action.payload.id) {
            item.name = action.payload.name
            if (state.currentId === item.id && state.currentRequest) state.currentRequest.name = action.payload.name
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

    // ── Env vars ─────────────────────────────────────────
    addEnvVar(state) {
      state.envVars.push({ id: generateId(), enabled: true, key: '', value: '' })
      saveEnv(state.envVars)
      scheduleSyncWorkspace(state.items, state.envVars)
    },
    updateEnvVar(state, action: PayloadAction<{ id: string; field: 'key' | 'value' | 'enabled'; value: string | boolean }>) {
      const v = state.envVars.find((x) => x.id === action.payload.id)
      if (v) { (v[action.payload.field] as string | boolean) = action.payload.value; saveEnv(state.envVars); scheduleSyncWorkspace(state.items, state.envVars) }
    },
    deleteEnvVar(state, action: PayloadAction<string>) {
      state.envVars = state.envVars.filter((v) => v.id !== action.payload)
      saveEnv(state.envVars)
      scheduleSyncWorkspace(state.items, state.envVars)
    },
    setEnvVars(state, action: PayloadAction<EnvVar[]>) {
      state.envVars = action.payload; saveEnv(action.payload)
      scheduleSyncWorkspace(state.items, state.envVars)
    },

    // ── KV rows ──────────────────────────────────────────
    addKVRow(state, action: PayloadAction<{ target: 'params' | 'headers' | 'formEncodeFields' }>) {
      if (state.currentRequest) {
        state.currentRequest[action.payload.target].push(blankKV())
        persistWorkspace(state)
      }
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

    // ── Form fields (multipart) ───────────────────────────
    addFormField(state) {
      if (state.currentRequest) {
        state.currentRequest.formFields.push({ id: generateId(), enabled: true, key: '', value: '' })
        persistWorkspace(state)
      }
    },
    updateFormField(state, action: PayloadAction<{ id: string; field: 'key' | 'value' | 'enabled'; value: string | boolean }>) {
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
      if (state.currentRequest) {
        state.currentRequest.formFields = action.payload
        persistWorkspace(state)
      }
    },

    // ── Form files (multipart) ────────────────────────────
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

    // ── Tabs ─────────────────────────────────────────────
    setActiveMainTab(state, action: PayloadAction<string>) { state.activeMainTab = action.payload },
    setActiveBodyTab(state, action: PayloadAction<BodyType>) {
      state.activeBodyTab = action.payload
      if (state.currentRequest) state.currentRequest.bodyType = action.payload
      persistWorkspace(state)
    },
    setSidebarTab(state, action: PayloadAction<'collections' | 'history'>) { state.sidebarTab = action.payload },

    // ── Misc ─────────────────────────────────────────────
    clearHistory(state) {
      state.history = []
      saveHistory([])
      // Also clear from Supabase (fire and forget)
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) fetchlabService.clearHistory(user.id)
      })
    },
    clearResponse(state) { state.response = null },

    importData(state, action: PayloadAction<{ items: FetchItem[]; envVars?: EnvVar[] }>) {
      state.items = action.payload.items
      if (action.payload.envVars) state.envVars = action.payload.envVars
      saveItems(state.items)
      if (action.payload.envVars) saveEnv(state.envVars)
      scheduleSyncWorkspace(state.items, state.envVars)
    },
  },

  extraReducers: (builder) => {
    builder
      // Load from Supabase on init
      .addCase(loadFetchLabFromSupabase.fulfilled, (state, action) => {
        const { workspace, history } = action.payload as {
          workspace: { items: FetchItem[]; envVars: EnvVar[] } | null
          history: HistoryEntry[]
        }
        if (workspace) {
          // Only replace if Supabase has data (don't wipe local work if offline)
          if (workspace.items.length > 0 || workspace.envVars.length > 0) {
            state.items = workspace.items
            state.envVars = workspace.envVars
            saveItems(state.items)
            saveEnv(state.envVars)
          }
        }
        if (history.length > 0) {
          state.history = history
          saveHistory(history)
        }
      })

      // Send request
      .addCase(sendRequest.pending, (state) => { state.sending = true; state.response = null })
      .addCase(sendRequest.fulfilled, (state, action) => {
        state.sending = false
        state.response = action.payload as ResponseData
        if (state.currentRequest) {
          const entry: HistoryEntry = {
            id: generateId(),
            method: state.currentRequest.method,
            url: state.currentRequest.url,
            status: (action.payload as ResponseData).status,
            duration: (action.payload as ResponseData).duration,
            size: (action.payload as ResponseData).size,
            timestamp: new Date().toISOString(),
          }
          state.history = [entry, ...state.history].slice(0, 60)
          saveHistory(state.history)
          // Sync to Supabase (fire and forget)
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) fetchlabService.addHistory(user.id, entry)
          })
        }
      })
      .addCase(sendRequest.rejected, (state, action) => {
        state.sending = false
        state.response = { status: 0, statusText: 'Error', duration: 0, size: 0, body: String(action.payload || 'Request failed'), headers: {}, prettyBody: String(action.payload || 'Request failed') }
      })
  },
})

export const {
  createRequest, createFolder, duplicateRequest, moveToFolder, reorderItems,
  selectRequest, updateCurrentRequest, saveCurrentRequest, deleteItem, renameItem, toggleFolder,
  addEnvVar, updateEnvVar, deleteEnvVar, setEnvVars,
  addKVRow, updateKVRow, deleteKVRow,
  addFormField, updateFormField, deleteFormField, setFormFields,
  addFormFile, updateFormFileKey, updateFormFileEnabled, deleteFormFile,
  setActiveMainTab, setActiveBodyTab, setSidebarTab,
  clearHistory, clearResponse, importData,
} = fetchlabSlice.actions

export default fetchlabSlice.reducer

// ── Selector helpers ──────────────────────────────────────
export { getAllFolders, findItem }
