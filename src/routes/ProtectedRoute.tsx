import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getMe } from '../api/client'
import PageLoader from '../components/PageLoader'
import { AUTH_USER_PATCH_EVENT, isAuthSession } from '../lib/auth-session'
import type { AuthSession, AuthUser } from '../types'

type RouteState =
  | { status: 'loading'; auth: null }
  | { status: 'authenticated'; auth: AuthSession }
  | { status: 'unauthenticated'; auth: null }

export default function ProtectedRoute() {
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
  }, [])

  if (state.status === 'loading') {
    return <PageLoader />
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet context={state.auth} />
}
