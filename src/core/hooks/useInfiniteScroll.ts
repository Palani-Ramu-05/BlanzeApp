import { useState, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>
}

export function useInfiniteScroll<T>({ fetchFn }: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const { data, hasMore: more } = await fetchFn(page)
      setItems((prev) => [...prev, ...data])
      setHasMore(more)
      setPage((prev) => prev + 1)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, loading, hasMore, page])

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore()
      })
      if (node) observerRef.current.observe(node)
    },
    [loading, hasMore, loadMore],
  )

  return { items, loading, hasMore, loadMore, sentinelRef }
}
