import { adminCard, adminPage } from '../styles/admin'
import PageHeader from '../components/PageHeader'
import PageMeta from '../components/PageMeta'

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  const subtitle = description || 'This module is coming soon.'

  return (
    <div className={`${adminPage}`}>
      <PageMeta title={title} description={subtitle} />
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title }]}
      />
      <div className={`${adminCard}`}>
        <p>You have access to this area. The page is not available yet.</p>
      </div>
    </div>
  )
}
