import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageLoader from '../components/PageLoader'
import { AUTH_USER_PATCH_EVENT } from '../lib/auth-session'
import { useAuth } from '../hooks/useAuth'
import { useLazyGetMeQuery } from '../redux/features/auth/authApi'
import { isAuthSession } from '../lib/auth-session'
import type { AuthUser } from '../types'

type ProtectedRouteProps = {
  /** Login / forgot / reset: redirect away if already signed in. */
  guestOnly?: boolean
  children?: ReactNode
}

export default function ProtectedRoute({ guestOnly = false, children }: ProtectedRouteProps) {
  const location = useLocation()
  const { session, hydrated, applySession, updateUser, logout } = useAuth()
  const [fetchMe] = useLazyGetMeQuery()
  const [checking, setChecking] = useState(!session)

  useEffect(() => {
    if (!hydrated) return

    let cancelled = false

    async function verify() {
      setChecking(true)
      try {
        const result = await fetchMe()
        if (cancelled) return

        if (result.data && isAuthSession(result.data)) {
          applySession(result.data)
        } else {
          await logout()
        }
      } catch {
        if (!cancelled) {
          await logout()
        }
      } finally {
        if (!cancelled) {
          setChecking(false)
        }
      }
    }

    void verify()

    return () => {
      cancelled = true
    }
  }, [hydrated, location.key, fetchMe, applySession, logout])

  useEffect(() => {
    if (guestOnly) return undefined

    function onAuthUserPatch(event: Event) {
      const patch = (event as CustomEvent<Partial<AuthUser>>).detail
      if (!patch) return
      updateUser(patch)
    }

    window.addEventListener(AUTH_USER_PATCH_EVENT, onAuthUserPatch)
    return () => window.removeEventListener(AUTH_USER_PATCH_EVENT, onAuthUserPatch)
  }, [guestOnly, updateUser])

  if (!hydrated || checking) {
    return <PageLoader />
  }

  if (guestOnly) {
    if (session) {
      return <Navigate to="/dashboard" replace />
    }
    return children ? <>{children}</> : <Outlet />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (children) {
    return <>{children}</>
  }

  return <Outlet context={session} />
}
