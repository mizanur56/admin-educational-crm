import PageHeader from '../components/PageHeader'
import './admin.css'

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="admin-page">
      <PageHeader title={title} description={description || 'This module is coming soon.'} />
      <div className="admin-card">
        <p>You have access to this area. The page is not available yet.</p>
      </div>
    </div>
  )
}
