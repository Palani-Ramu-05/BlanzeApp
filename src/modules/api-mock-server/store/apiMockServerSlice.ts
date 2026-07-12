import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { initialState } from '../dto/initial-values'
import type { MockProject, MockCollection, MockEndpoint, MockScenario, MockLog, MockEnvironment, MockVariable, MockTemplate, PaginationInfo, ProjectStats, AnalyticsData, ActivePanel } from '../dto/types/api-mock-server.types'
import { projectApi, collectionApi, endpointApi, scenarioApi, logApi, variableApi, environmentApi, templateApi } from '../services/api-mock-server.service'

// ── Async Thunks: Projects ───────────────────────────────
export const fetchProjects = createAsyncThunk('apiMockServer/fetchProjects', async (params?: Record<string, string>) => {
  return projectApi.list(params)
})

export const fetchProject = createAsyncThunk('apiMockServer/fetchProject', async (uuid: string) => {
  return projectApi.get(uuid)
})

export const createProject = createAsyncThunk('apiMockServer/createProject', async (data: Partial<MockProject>) => {
  return projectApi.create(data)
})

export const updateProject = createAsyncThunk('apiMockServer/updateProject', async ({ uuid, data }: { uuid: string; data: Partial<MockProject> }) => {
  return projectApi.update(uuid, data)
})

export const deleteProject = createAsyncThunk('apiMockServer/deleteProject', async (uuid: string) => {
  await projectApi.delete(uuid)
  return uuid
})

export const duplicateProject = createAsyncThunk('apiMockServer/duplicateProject', async (uuid: string) => {
  return projectApi.duplicate(uuid)
})

export const toggleFavorite = createAsyncThunk('apiMockServer/toggleFavorite', async (uuid: string) => {
  return projectApi.toggleFavorite(uuid)
})

export const toggleArchive = createAsyncThunk('apiMockServer/toggleArchive', async (uuid: string) => {
  return projectApi.toggleArchive(uuid)
})

export const fetchProjectStats = createAsyncThunk('apiMockServer/fetchProjectStats', async (uuid: string) => {
  return projectApi.stats(uuid)
})

// ── Async Thunks: Collections ────────────────────────────
export const fetchCollections = createAsyncThunk('apiMockServer/fetchCollections', async (projectUuid: string) => {
  return collectionApi.list(projectUuid)
})

export const createCollection = createAsyncThunk('apiMockServer/createCollection', async (data: Partial<MockCollection>) => {
  return collectionApi.create(data)
})

export const updateCollection = createAsyncThunk('apiMockServer/updateCollection', async ({ uuid, data }: { uuid: string; data: Partial<MockCollection> }) => {
  return collectionApi.update(uuid, data)
})

export const deleteCollection = createAsyncThunk('apiMockServer/deleteCollection', async (uuid: string) => {
  await collectionApi.delete(uuid)
  return uuid
})

// ── Async Thunks: Endpoints ──────────────────────────────
export const fetchEndpoints = createAsyncThunk('apiMockServer/fetchEndpoints', async ({ projectUuid, collectionUuid }: { projectUuid: string; collectionUuid?: string }) => {
  return endpointApi.list(projectUuid, collectionUuid)
})

export const createEndpoint = createAsyncThunk('apiMockServer/createEndpoint', async (data: Partial<MockEndpoint>) => {
  return endpointApi.create(data)
})

export const updateEndpoint = createAsyncThunk('apiMockServer/updateEndpoint', async ({ uuid, data }: { uuid: string; data: Partial<MockEndpoint> }) => {
  return endpointApi.update(uuid, data)
})

export const deleteEndpoint = createAsyncThunk('apiMockServer/deleteEndpoint', async (uuid: string) => {
  await endpointApi.delete(uuid)
  return uuid
})

// ── Async Thunks: Scenarios ──────────────────────────────
export const fetchScenarios = createAsyncThunk('apiMockServer/fetchScenarios', async (endpointUuid: string) => {
  return scenarioApi.list(endpointUuid)
})

export const createScenario = createAsyncThunk('apiMockServer/createScenario', async (data: Partial<MockScenario>) => {
  return scenarioApi.create(data)
})

export const updateScenario = createAsyncThunk('apiMockServer/updateScenario', async ({ uuid, data }: { uuid: string; data: Partial<MockScenario> }) => {
  return scenarioApi.update(uuid, data)
})

export const deleteScenario = createAsyncThunk('apiMockServer/deleteScenario', async (uuid: string) => {
  await scenarioApi.delete(uuid)
  return uuid
})

// ── Async Thunks: Logs ───────────────────────────────────
export const fetchLogs = createAsyncThunk('apiMockServer/fetchLogs', async ({ projectUuid, params }: { projectUuid: string; params?: Record<string, string> }) => {
  return logApi.list(projectUuid, params)
})

export const clearLogs = createAsyncThunk('apiMockServer/clearLogs', async (projectUuid: string) => {
  await logApi.clear(projectUuid)
})

export const fetchAnalytics = createAsyncThunk('apiMockServer/fetchAnalytics', async (projectUuid: string) => {
  return logApi.analytics(projectUuid)
})

// ── Async Thunks: Variables ──────────────────────────────
export const fetchVariables = createAsyncThunk('apiMockServer/fetchVariables', async (projectUuid: string) => {
  return variableApi.list(projectUuid)
})

export const createVariable = createAsyncThunk('apiMockServer/createVariable', async (data: Partial<MockVariable>) => {
  return variableApi.create(data)
})

export const deleteVariable = createAsyncThunk('apiMockServer/deleteVariable', async (uuid: string) => {
  await variableApi.delete(uuid)
  return uuid
})

// ── Async Thunks: Environments ───────────────────────────
export const fetchEnvironments = createAsyncThunk('apiMockServer/fetchEnvironments', async (projectUuid: string) => {
  return environmentApi.list(projectUuid)
})

export const createEnvironment = createAsyncThunk('apiMockServer/createEnvironment', async (data: Partial<MockEnvironment>) => {
  return environmentApi.create(data)
})

export const activateEnvironment = createAsyncThunk('apiMockServer/activateEnvironment', async (uuid: string) => {
  return environmentApi.activate(uuid)
})

export const deleteEnvironment = createAsyncThunk('apiMockServer/deleteEnvironment', async (uuid: string) => {
  await environmentApi.delete(uuid)
  return uuid
})

// ── Async Thunks: Templates ──────────────────────────────
export const fetchTemplates = createAsyncThunk('apiMockServer/fetchTemplates', async (category?: string) => {
  return templateApi.list(category)
})

export const applyTemplate = createAsyncThunk('apiMockServer/applyTemplate', async ({ templateUuid, projectUuid }: { templateUuid: string; projectUuid: string }) => {
  return templateApi.apply(templateUuid, projectUuid)
})

const apiMockServerSlice = createSlice({
  name: 'apiMockServer',
  initialState,
  reducers: {
    setProject(state, action: PayloadAction<MockProject | null>) {
      state.project = action.payload
    },
    setCollection(state, action: PayloadAction<MockCollection | null>) {
      state.collection = action.payload
    },
    setCurrentEndpoint(state, action: PayloadAction<MockEndpoint | null>) {
      state.currentEndpoint = action.payload
    },
    setActivePanel(state, action: PayloadAction<ActivePanel>) {
      state.activePanel = action.payload
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },
    clearError(state) {
      state.error = null
    },
    resetProjectState(state) {
      state.project = null
      state.collections = []
      state.collection = null
      state.endpoints = []
      state.currentEndpoint = null
      state.scenarios = []
      state.logs = []
      state.analytics = null
    },
  },
  extraReducers: (builder) => {
    // ── Projects ────────────────────────────────────
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to fetch projects'
      })
      .addCase(fetchProject.fulfilled, (state, action) => { state.project = action.payload })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload)
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.project = action.payload
        state.projects = state.projects.map((p) => (p.uuid === action.payload.uuid ? action.payload : p))
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p.uuid !== action.payload)
        if (state.project?.uuid === action.payload) state.project = null
      })
      .addCase(duplicateProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload)
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        state.project = action.payload
        state.projects = state.projects.map((p) => (p.uuid === action.payload.uuid ? action.payload : p))
      })
      .addCase(toggleArchive.fulfilled, (state, action) => {
        state.project = action.payload
        state.projects = state.projects.map((p) => (p.uuid === action.payload.uuid ? action.payload : p))
      })

    // ── Collections ─────────────────────────────────
    builder
      .addCase(fetchCollections.fulfilled, (state, action) => { state.collections = action.payload })
      .addCase(createCollection.fulfilled, (state, action) => { state.collections.push(action.payload) })
      .addCase(updateCollection.fulfilled, (state, action) => {
        state.collections = state.collections.map((c) => (c.uuid === action.payload.uuid ? action.payload : c))
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.collections = state.collections.filter((c) => c.uuid !== action.payload)
      })

    // ── Endpoints ───────────────────────────────────
    builder
      .addCase(fetchEndpoints.fulfilled, (state, action) => { state.endpoints = action.payload })
      .addCase(createEndpoint.fulfilled, (state, action) => {
        state.endpoints.push(action.payload)
      })
      .addCase(updateEndpoint.fulfilled, (state, action) => {
        state.currentEndpoint = action.payload
        state.endpoints = state.endpoints.map((e) => (e.uuid === action.payload.uuid ? action.payload : e))
      })
      .addCase(deleteEndpoint.fulfilled, (state, action) => {
        state.endpoints = state.endpoints.filter((e) => e.uuid !== action.payload)
        if (state.currentEndpoint?.uuid === action.payload) state.currentEndpoint = null
      })

    // ── Scenarios ──────────────────────────────────
    builder
      .addCase(fetchScenarios.fulfilled, (state, action) => { state.scenarios = action.payload })
      .addCase(createScenario.fulfilled, (state, action) => { state.scenarios.push(action.payload) })
      .addCase(updateScenario.fulfilled, (state, action) => {
        state.scenarios = state.scenarios.map((s) => (s.uuid === action.payload.uuid ? action.payload : s))
      })
      .addCase(deleteScenario.fulfilled, (state, action) => {
        state.scenarios = state.scenarios.filter((s) => s.uuid !== action.payload)
      })

    // ── Logs ───────────────────────────────────────
    builder
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.logs = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(clearLogs.fulfilled, (state) => { state.logs = [] })
      .addCase(fetchAnalytics.fulfilled, (state, action) => { state.analytics = action.payload })

    // ── Variables ──────────────────────────────────
    builder
      .addCase(fetchVariables.fulfilled, (state, action) => { state.variables = action.payload })
      .addCase(createVariable.fulfilled, (state, action) => { state.variables.push(action.payload) })
      .addCase(deleteVariable.fulfilled, (state, action) => {
        state.variables = state.variables.filter((v) => v.uuid !== action.payload)
      })

    // ── Environments ───────────────────────────────
    builder
      .addCase(fetchEnvironments.fulfilled, (state, action) => { state.environments = action.payload })
      .addCase(createEnvironment.fulfilled, (state, action) => { state.environments.push(action.payload) })
      .addCase(activateEnvironment.fulfilled, (state, action) => {
        state.environments = state.environments.map((e) => ({
          ...e, isActive: e.uuid === action.payload.uuid,
        }))
      })
      .addCase(deleteEnvironment.fulfilled, (state, action) => {
        state.environments = state.environments.filter((e) => e.uuid !== action.payload)
      })

    // ── Templates ──────────────────────────────────
    builder
      .addCase(fetchTemplates.fulfilled, (state, action) => { state.templates = action.payload })
  },
})

export const {
  setProject, setCollection, setCurrentEndpoint, setActivePanel, setSearchQuery, clearError, resetProjectState,
} = apiMockServerSlice.actions

export default apiMockServerSlice.reducer
