import { useNavigate, useOutletContext } from 'react-router-dom'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import UserAvatar from '../components/UserAvatar'
import type { AuthSession } from '../types'
import './admin.css'

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
}

function displayValue(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

export default function Profile() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const user = auth.user
  const name = user.fullName || user.username || user.email

  return (
    <div className="admin-page">
      <PageHeader title="Profile" description="Your account details for this CRM session.">
        <Button variant="secondary" onClick={() => navigate('/account')}>
          Change password
        </Button>
      </PageHeader>

      <section className="admin-card user-profile-card">
        <div className="user-profile-identity">
          <UserAvatar name={name} photoUrl={user.photoUrl} className="user-profile-avatar" />
          <div>
            <h3>{displayValue(user.fullName)}</h3>
            <p>{auth.role?.name || 'No role assigned'}</p>
          </div>
        </div>

        <dl className="employee-profile-fields">
          <div>
            <dt>Full name</dt>
            <dd>{displayValue(user.fullName)}</dd>
          </div>
          <div>
            <dt>Username</dt>
            <dd>{displayValue(user.username)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{displayValue(user.email)}</dd>
          </div>
          <div>
            <dt>Mobile</dt>
            <dd>{displayValue(user.mobile)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{USER_STATUS_LABELS[user.status] || displayValue(user.status)}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{displayValue(auth.role?.name)}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
