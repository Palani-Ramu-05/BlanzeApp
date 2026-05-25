import { useState, useCallback, useRef } from 'react'
import { apiGet } from '@core/http/methods/axios-api'
import type { AxiosError } from 'axios'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useFetchQuery<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const fetch = useCallback(
    async (params?: Record<string, unknown>) => {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const res = await apiGet<T>(url, {
          params,
          signal: abortRef.current.signal,
        })
        setState({ data: res.data, loading: false, error: null })
        return res.data
      } catch (err) {
        const axiosErr = err as AxiosError<{ message?: string }>
        if (axiosErr.code === 'ERR_CANCELED') return
        const message = axiosErr.response?.data?.message || axiosErr.message || 'Something went wrong'
        setState({ data: null, loading: false, error: message })
      }
    },
    [url],
  )

  return { ...state, fetch }
}
