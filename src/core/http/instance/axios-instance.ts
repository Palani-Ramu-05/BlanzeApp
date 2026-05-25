import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import envConfig from '@core/config/envConfig'
import { STORAGE_KEYS } from '@core/constants/constants'

const axiosInstance = axios.create({
  baseURL: envConfig.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      window.location.href = '/auth/signin'
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
