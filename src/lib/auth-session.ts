import type { AuthUser } from '../types'

export const AUTH_USER_PATCH_EVENT = 'crm:auth-user-patch'

export function patchCurrentAuthUser(patch: Partial<AuthUser>) {
  window.dispatchEvent(new CustomEvent(AUTH_USER_PATCH_EVENT, { detail: patch }))
}
