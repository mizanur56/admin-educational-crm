import { adminCard, adminPage } from '../styles/admin'
import PageHeader from '../components/PageHeader'
import PageMeta from '../components/PageMeta'

const MODULE_COPY: Record<string, string> = {
  Leads: 'Capture, qualify, and nurture prospective students through your consultancy pipeline.',
  Applications: 'Track university applications from submission through offers and enrollment.',
  Students: 'Manage student profiles, academic progress, and advisory engagement in one place.',
  Documents: 'Upload, review, and organize student and staff documents for admissions workflows.',
  Payments: 'Monitor fees, invoices, and payment status across students and applications.',
  'Follow-ups': 'Plan and complete follow-up calls, emails, and tasks with leads and students.',
  Reports: 'Analyze lead conversion, advisor performance, and operational CRM metrics.',
  Settings: 'Configure CRM preferences, notifications, and workspace defaults for your team.',
}

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  const subtitle =
    description || MODULE_COPY[title] || `${title} is coming soon in EduConsult CRM.`

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
