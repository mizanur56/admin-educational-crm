import { useEffect, type ReactNode } from 'react'
import { useLazyGetMeQuery } from '@/redux/features/auth/authApi'
import {
  clearSession,
  setHydrated,
  setSession,
  useAppDispatch,
} from '@/redux'
import { isAuthSession } from '@/lib/auth-session'

const ME_TIMEOUT_MS = 8000

/**
 * After redux-persist rehydrates, validates the cookie session via `/me`.
 */
export default function AuthSessionProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const [fetchMe] = useLazyGetMeQuery()

  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const result = await Promise.race([
          fetchMe(),
          new Promise<{ data: undefined }>((resolve) => {
            window.setTimeout(() => resolve({ data: undefined }), ME_TIMEOUT_MS)
          }),
        ])
        if (cancelled) return

        if (result.data && isAuthSession(result.data)) {
          dispatch(setSession(result.data))
        } else {
          dispatch(clearSession())
        }
      } catch {
        if (!cancelled) {
          dispatch(clearSession())
        }
      } finally {
        if (!cancelled) {
          dispatch(setHydrated(true))
        }
      }
    }

    void restore()

    return () => {
      cancelled = true
    }
  }, [dispatch, fetchMe])

  return <>{children}</>
}
