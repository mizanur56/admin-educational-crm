import { Outlet, useOutletContext } from 'react-router-dom'
import { hasPermission } from '../lib/access'
import type { AuthSession } from '../types'

type PermissionRouteProps = {
  permission: string
}

export default function PermissionRoute({ permission }: PermissionRouteProps) {
  const auth = useOutletContext<AuthSession>()

  if (!hasPermission(auth, permission)) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <h2>Access denied</h2>
          <p>You do not have permission to perform this action.</p>
        </div>
      </div>
    )
  }

  return <Outlet context={auth} />
}
