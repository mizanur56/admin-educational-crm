import { useEffect, type ReactNode } from 'react'
import { useLazyGetMeQuery } from '@/redux/features/auth/authApi'
import {
  clearSession,
  selectAuthSession,
  setHydrated,
  setSession,
  useAppDispatch,
  useAppSelector,
} from '@/redux'
import { isAuthSession } from '@/lib/auth-session'

/**
 * Validates the cookie session against `/me` after redux-persist rehydrates.
 * Keeps Redux auth in sync without blocking PersistGate itself.
 */
export default function AuthSessionProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const session = useAppSelector(selectAuthSession)
  const [fetchMe] = useLazyGetMeQuery()

  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const result = await fetchMe()
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
    // Run once on mount after PersistGate; session changes are handled by login/logout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, fetchMe])

  useEffect(() => {
    if (!session) return undefined

    function onFocus() {
      void fetchMe()
        .then((result) => {
          if (result.data && isAuthSession(result.data)) {
            dispatch(setSession(result.data))
          } else if (result.error) {
            dispatch(clearSession())
          }
        })
        .catch(() => {
          /* ignore transient network errors on focus */
        })
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [session, dispatch, fetchMe])

  return <>{children}</>
}
