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
