import { adminCard, adminPage } from '../../styles/admin'
import { useNavigate, useOutletContext } from 'react-router-dom'
import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import PageMeta from '../../components/PageMeta'
import UserAvatar from '../../components/UserAvatar'
import type { AuthSession } from '../../types'
const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
}

function displayValue(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

export default function ProfilePage() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const user = auth.user
  const name = user.fullName || user.username || user.email

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title="My Profile"
        description="View your EduConsult CRM account details, role, and contact information."
      />
      <PageHeader
        title="Profile"
        subtitle="Your account details for this CRM session."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Profile' }]}
        extra={
          <Button variant="secondary" onClick={() => navigate('/account')}>
            Change password
          </Button>
        }
      />

      <section className={`${adminCard} grid gap-6`}>
        <div className="flex items-center gap-4 [&_h3]:m-0 [&_h3]:text-[1.15rem] [&_h3]:text-text-strong [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[0.9rem] [&_p]:text-text-muted">
          <UserAvatar name={name} photoUrl={user.photoUrl} className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-base font-bold text-on-primary [&_img]:h-full [&_img]:w-full [&_img]:object-cover" />
          <div>
            <h3>{displayValue(user.fullName)}</h3>
            <p>{auth.role?.name || 'No role assigned'}</p>
          </div>
        </div>

        <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-5 min-[721px]:grid-cols-2 [&_dt]:text-[0.76rem] [&_dt]:tracking-[0.03em] [&_dt]:text-text-muted [&_dt]:uppercase [&_dd]:mt-1.5 [&_dd]:break-words [&_dd]:text-text [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
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
