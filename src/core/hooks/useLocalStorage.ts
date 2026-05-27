import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      setStored(value)
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // ignore write errors
      }
    },
    [key],
  )

  return [stored, setValue]
}
