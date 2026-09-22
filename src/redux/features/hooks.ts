import { useEffect, useState } from 'react'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { AppDispatch, RootState } from './store'

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

type DebouncedProps = {
  searchQuery: string
  delay: number
}

export function useDebounced({ searchQuery, delay }: DebouncedProps) {
  const [debouncedValue, setDebouncedValue] = useState(searchQuery)

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedValue(searchQuery)
    }, delay)

    return () => window.clearTimeout(handler)
  }, [searchQuery, delay])

  return debouncedValue
}
