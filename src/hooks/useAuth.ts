import { useCallback } from 'react'
import {
  clearSession,
  patchUser,
  selectAuthHydrated,
  selectAuthSession,
  selectPermissions,
  setSession,
  useAppDispatch,
  useAppSelector,
  type AppDispatch,
} from '@/redux'
import { baseApi } from '@/redux/api/baseApi'
import { clearAuthPersistStorage, notifyServerLogout } from '@/lib/authStorage'
import { hasPermission as checkPermission } from '@/lib/access'
import type { AuthSession, AuthUser } from '@/types'

/**
 * Instant client teardown — mirrors campus-transfer logout:
 * clear auth slice, wipe RTK Query cache, remove persist blob.
 * Server logout is non-blocking.
 */
export function clearClientAuthState(
  dispatch: AppDispatch,
  options?: { notifyServer?: boolean },
) {
  if (options?.notifyServer !== false) {
    notifyServerLogout()
  }
  dispatch(clearSession())
  dispatch(baseApi.util.resetApiState())
  clearAuthPersistStorage()
}

export function useAuth() {
  const dispatch = useAppDispatch()
  const session = useAppSelector(selectAuthSession)
  const hydrated = useAppSelector(selectAuthHydrated)
  const permissions = useAppSelector(selectPermissions)

  const applySession = useCallback(
    (next: AuthSession) => {
      // Drop any previous user's cached API data before binding the new session
      dispatch(baseApi.util.resetApiState())
      dispatch(setSession(next))
    },
    [dispatch],
  )

  const updateUser = useCallback(
    (patch: Partial<AuthUser>) => {
      dispatch(patchUser(patch))
    },
    [dispatch],
  )

  const logout = useCallback(() => {
    clearClientAuthState(dispatch)
  }, [dispatch])

  const can = useCallback(
    (permission: string) => (session ? checkPermission(session, permission) : false),
    [session],
  )

  return {
    session,
    user: session?.user ?? null,
    role: session?.role ?? null,
    permissions,
    hydrated,
    isAuthenticated: Boolean(session),
    applySession,
    updateUser,
    logout,
    can,
  }
}
