import { adminCard, adminPage } from '../styles/admin'
import PageHeader from '../components/PageHeader'
export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className={`${adminPage}`}>
      <PageHeader title={title} description={description || 'This module is coming soon.'} />
      <div className={`${adminCard}`}>
        <p>You have access to this area. The page is not available yet.</p>
      </div>
    </div>
  )
}
