import { adminCard, adminPage } from '../styles/admin'
import PageHeader from '../components/PageHeader'

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className={`${adminPage}`}>
      <PageHeader
        title={title}
        subtitle={description || 'This module is coming soon.'}
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title }]}
      />
      <div className={`${adminCard}`}>
        <p>You have access to this area. The page is not available yet.</p>
      </div>
    </div>
  )
}
