import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import PageLoader from '../components/PageLoader'
import { AUTH_USER_PATCH_EVENT } from '../lib/auth-session'
import { useAuth } from '../hooks/useAuth'
import type { AuthUser } from '../types'

type ProtectedRouteProps = {
  /** Login / forgot / reset: redirect away if already signed in. */
  guestOnly?: boolean
  children?: ReactNode
}

export default function ProtectedRoute({ guestOnly = false, children }: ProtectedRouteProps) {
  const { session, hydrated, updateUser } = useAuth()

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

  if (!hydrated) {
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
