import type { DemoModuleConfig } from '../pages/DemoModulePage'

export const leadsDemo: DemoModuleConfig = {
  title: 'Leads',
  subtitle: 'Capture, qualify, and nurture prospective students through your consultancy pipeline.',
  searchPlaceholder: 'Search lead, phone, country…',
  resource: 'leads',
  columns: [
    { key: 'name', label: 'Lead' },
    { key: 'phone', label: 'Phone' },
    { key: 'country', label: 'Country' },
    { key: 'source', label: 'Source' },
    { key: 'owner', label: 'Owner' },
    { key: 'status', label: 'Status' },
    { key: 'updated', label: 'Updated' },
  ],
}

export const applicationsDemo: DemoModuleConfig = {
  title: 'Applications',
  subtitle: 'Track university applications from submission through offers and enrollment.',
  searchPlaceholder: 'Search applicant, university, program…',
  resource: 'applications',
  columns: [
    { key: 'applicant', label: 'Applicant' },
    { key: 'university', label: 'University' },
    { key: 'program', label: 'Program' },
    { key: 'intake', label: 'Intake' },
    { key: 'counsellor', label: 'Counsellor' },
    { key: 'status', label: 'Status' },
    { key: 'submitted', label: 'Submitted' },
  ],
}

export const studentsDemo: DemoModuleConfig = {
  title: 'Students',
  subtitle: 'Manage student profiles, academic progress, and advisory engagement in one place.',
  searchPlaceholder: 'Search student, ID, destination…',
  resource: 'students',
  columns: [
    { key: 'studentId', label: 'Student ID' },
    { key: 'name', label: 'Name' },
    { key: 'destination', label: 'Destination' },
    { key: 'program', label: 'Program' },
    { key: 'counsellor', label: 'Counsellor' },
    { key: 'status', label: 'Status' },
    { key: 'enrolled', label: 'Enrolled' },
  ],
}

export const documentsDemo: DemoModuleConfig = {
  title: 'Documents',
  subtitle: 'Upload, review, and organize student and staff documents for admissions workflows.',
  searchPlaceholder: 'Search document, owner, type…',
  resource: 'documents',
  columns: [
    { key: 'owner', label: 'Owner' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'uploadedBy', label: 'Uploaded by' },
    { key: 'status', label: 'Status' },
    { key: 'updated', label: 'Updated' },
  ],
}

export const paymentsDemo: DemoModuleConfig = {
  title: 'Payments',
  subtitle: 'Monitor fees, invoices, and payment status across students and applications.',
  searchPlaceholder: 'Search invoice, payer, method…',
  resource: 'payments',
  columns: [
    { key: 'invoice', label: 'Invoice' },
    { key: 'payer', label: 'Payer' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
  ],
}

export const followUpsDemo: DemoModuleConfig = {
  title: 'Follow-ups',
  subtitle: 'Plan and complete follow-up calls, emails, and tasks with leads and students.',
  searchPlaceholder: 'Search contact, owner, type…',
  resource: 'follow-ups',
  columns: [
    { key: 'contact', label: 'Contact' },
    { key: 'type', label: 'Type' },
    { key: 'owner', label: 'Owner' },
    { key: 'due', label: 'Due' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
  ],
}

export const reportsDemo: DemoModuleConfig = {
  title: 'Reports',
  subtitle: 'Analyze lead conversion, advisor performance, and operational CRM metrics.',
  searchPlaceholder: 'Search report metric…',
  resource: 'reports',
  columns: [
    { key: 'metric', label: 'Metric' },
    { key: 'period', label: 'Period' },
    { key: 'value', label: 'Value' },
    { key: 'change', label: 'Change' },
    { key: 'owner', label: 'Owner team' },
    { key: 'status', label: 'Status' },
  ],
}
