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
} from '@/redux'
import { useLogoutMutation } from '@/redux/features/auth/authApi'
import { hasPermission as checkPermission } from '@/lib/access'
import type { AuthSession, AuthUser } from '@/types'

export function useAuth() {
  const dispatch = useAppDispatch()
  const session = useAppSelector(selectAuthSession)
  const hydrated = useAppSelector(selectAuthHydrated)
  const permissions = useAppSelector(selectPermissions)
  const [logoutMutation] = useLogoutMutation()

  const applySession = useCallback(
    (next: AuthSession) => {
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

  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap()
    } catch {
      /* still clear local session */
    } finally {
      dispatch(clearSession())
    }
  }, [dispatch, logoutMutation])

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
