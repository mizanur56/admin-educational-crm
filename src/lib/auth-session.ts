import type { AuthSession, AuthUser } from '../types'

export const AUTH_USER_PATCH_EVENT = 'crm:auth-user-patch'

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false
  }

  const session = value as Partial<AuthSession>
  return Boolean(session.user && typeof session.user === 'object' && session.user.id)
}

export function patchCurrentAuthUser(patch: Partial<AuthUser>) {
  window.dispatchEvent(new CustomEvent(AUTH_USER_PATCH_EVENT, { detail: patch }))
}
