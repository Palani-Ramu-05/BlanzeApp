import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import envConfig from '@core/config/envConfig'
import { supabase } from '@core/config/supabaseClient'

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch {
    return null
  }
}

const axiosInstance = axios.create({
  baseURL: envConfig.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

let isRedirecting = false

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true
      try {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError
      } finally {
        window.location.href = '/auth/signin'
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
