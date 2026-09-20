import type { AuthSession } from '../types'

export function hasPermission(auth: AuthSession | null | undefined, required: string | string[]) {
  const permissions = auth?.permissions ?? []
  const needed = Array.isArray(required) ? required : [required]
  return needed.some((item) => permissions.includes(item))
}

export function dataScope(auth: AuthSession | null | undefined, resource = 'lead') {
  return auth?.dataScopes?.[resource] || auth?.dataScope?.[resource] || 'OWN'
}
