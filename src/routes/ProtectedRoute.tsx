import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getMe } from '../api/client'
import PageLoader from '../components/PageLoader'
import { AUTH_USER_PATCH_EVENT, isAuthSession } from '../lib/auth-session'
import type { AuthSession, AuthUser } from '../types'

type RouteState =
  | { status: 'loading'; auth: null }
  | { status: 'authenticated'; auth: AuthSession }
  | { status: 'unauthenticated'; auth: null }

type ProtectedRouteProps = {
  /** Login / forgot / reset: redirect away if already signed in. */
  guestOnly?: boolean
  children?: ReactNode
}

export default function ProtectedRoute({ guestOnly = false, children }: ProtectedRouteProps) {
  const location = useLocation()
  const [state, setState] = useState<RouteState>({ status: 'loading', auth: null })

  useEffect(() => {
    let cancelled = false

    getMe()
      .then((result) => {
        if (cancelled) {
          return
        }

        if (result.ok && isAuthSession(result.data)) {
          setState({ status: 'authenticated', auth: result.data })
          return
        }

        setState({ status: 'unauthenticated', auth: null })
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'unauthenticated', auth: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [location.key])

  useEffect(() => {
    if (guestOnly) {
      return
    }

    function onAuthUserPatch(event: Event) {
      const patch = (event as CustomEvent<Partial<AuthUser>>).detail
      if (!patch) {
        return
      }
      setState((current) => {
        if (current.status !== 'authenticated') {
          return current
        }
        return {
          status: 'authenticated',
          auth: {
            ...current.auth,
            user: { ...current.auth.user, ...patch },
          },
        }
      })
    }

    window.addEventListener(AUTH_USER_PATCH_EVENT, onAuthUserPatch)
    return () => window.removeEventListener(AUTH_USER_PATCH_EVENT, onAuthUserPatch)
  }, [guestOnly])

  if (state.status === 'loading') {
    return <PageLoader />
  }

  if (guestOnly) {
    if (state.status === 'authenticated') {
      return <Navigate to="/dashboard" replace />
    }
    return children ? <>{children}</> : <Outlet />
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (children) {
    return <>{children}</>
  }

  return <Outlet context={state.auth} />
}
