import axiosInstance from '@core/http/instance/axios-instance'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

type ApiResponse<T> = Promise<AxiosResponse<T>>

export const apiGet = <T>(url: string, config?: AxiosRequestConfig): ApiResponse<T> =>
  axiosInstance.get<T>(url, config)

export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): ApiResponse<T> =>
  axiosInstance.post<T>(url, data, config)

export const apiPut = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): ApiResponse<T> =>
  axiosInstance.put<T>(url, data, config)

export const apiPatch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): ApiResponse<T> =>
  axiosInstance.patch<T>(url, data, config)

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): ApiResponse<T> =>
  axiosInstance.delete<T>(url, config)

export async function apiStream(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig & { baseURL?: string },
): Promise<Response> {
  const baseURL = config?.baseURL || axiosInstance.defaults.baseURL || ''
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`
  const signal = config?.signal as AbortSignal | undefined

  const session = localStorage.getItem('blanze_supabase_session')
  let token: string | null = null
  if (session) {
    try {
      token = JSON.parse(session)?.access_token || null
    } catch { /* ignore */ }
  }

  return fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(config?.headers as Record<string, string>),
    },
    body: JSON.stringify(data),
    signal,
  })
}
