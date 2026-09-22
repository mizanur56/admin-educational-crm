import { adminCard, adminPage } from '../styles/admin'
import { Outlet, useOutletContext } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { hasPermission } from '../lib/access'
import type { AuthSession } from '../types'

type PermissionRouteProps = {
  permission: string
}

export default function PermissionRoute({ permission }: PermissionRouteProps) {
  const auth = useOutletContext<AuthSession>()

  if (!hasPermission(auth, permission)) {
    return (
      <div className={`${adminPage}`}>
        <PageHeader
          title="Access denied"
          subtitle="You do not have permission to perform this action."
          breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Access denied' }]}
        />
        <div className={`${adminCard}`}>
          <p>Contact an administrator if you believe you should have access to this area.</p>
        </div>
      </div>
    )
  }

  return <Outlet context={auth} />
}
