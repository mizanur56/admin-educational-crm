export type MasterDataNavCategory = {
  key: string
  name: string
}

export type MasterDataNavGroup = {
  slug: string
  name: string
  categories: MasterDataNavCategory[]
}

export const MASTER_DATA_NAV_GROUPS: MasterDataNavGroup[] = [
  {
    slug: 'lead-management',
    name: 'Lead Management',
    categories: [
      { key: 'LEAD_SOURCE', name: 'Lead Source' },
      { key: 'LEAD_STATUS', name: 'Lead Status' },
      { key: 'LEAD_TYPE', name: 'Lead Type' },
      { key: 'LEAD_PRIORITY', name: 'Lead Priority' },
      { key: 'LEAD_QUALITY', name: 'Lead Quality' },
      { key: 'LEAD_LOST_REASON', name: 'Lead Lost Reason' },
      { key: 'LEAD_CLOSE_REASON', name: 'Lead Close Reason' },
    ],
  },
  {
    slug: 'academic',
    name: 'Academic',
    categories: [
      { key: 'EDUCATION_LEVEL', name: 'Education Level' },
      { key: 'ACADEMIC_BACKGROUND', name: 'Academic Background' },
      { key: 'SUBJECT_FIELD', name: 'Subject/Field of Study' },
      { key: 'GRADING_SYSTEM', name: 'Grading System' },
      { key: 'ENGLISH_TEST_TYPE', name: 'English Test Type' },
      { key: 'ENGLISH_PROFICIENCY_LEVEL', name: 'English Proficiency Level' },
    ],
  },
  {
    slug: 'study-abroad',
    name: 'Study Abroad',
    categories: [
      { key: 'COUNTRY', name: 'Country' },
      { key: 'STATE_PROVINCE', name: 'State/Province' },
      { key: 'CITY', name: 'City' },
      { key: 'INTAKE', name: 'Intake' },
      { key: 'UNIVERSITY', name: 'University' },
      { key: 'COURSE_PROGRAM', name: 'Course/Program' },
      { key: 'STUDY_LEVEL', name: 'Study Level' },
    ],
  },
  {
    slug: 'service',
    name: 'Service',
    categories: [
      { key: 'SERVICE_CATEGORY', name: 'Service Category' },
      { key: 'SERVICE_TYPE', name: 'Service Type' },
      { key: 'PACKAGE_TYPE', name: 'Package Type' },
      { key: 'CHARGE_TYPE', name: 'Charge Type' },
      { key: 'DISCOUNT_TYPE', name: 'Discount Type' },
    ],
  },
  {
    slug: 'communication',
    name: 'Communication',
    categories: [
      { key: 'ACTIVITY_TYPE', name: 'Activity Type' },
      { key: 'FOLLOW_UP_TYPE', name: 'Follow-up Type' },
      { key: 'CONTACT_METHOD', name: 'Contact Method' },
      { key: 'CONTACT_RESULT', name: 'Contact Result' },
    ],
  },
  {
    slug: 'employee',
    name: 'Employee',
    categories: [
      { key: 'DEPARTMENT', name: 'Department' },
      { key: 'TEAM', name: 'Team' },
      { key: 'DESIGNATION', name: 'Designation' },
      { key: 'EMPLOYMENT_TYPE', name: 'Employment Type' },
      { key: 'EMPLOYMENT_STATUS', name: 'Employment Status' },
    ],
  },
  {
    slug: 'documents',
    name: 'Documents',
    categories: [
      { key: 'DOCUMENT_CATEGORY', name: 'Document Category' },
      { key: 'DOCUMENT_TYPE', name: 'Document Type' },
      { key: 'DOCUMENT_STATUS', name: 'Document Status' },
      { key: 'REJECTION_REASON', name: 'Rejection Reason' },
    ],
  },
  {
    slug: 'payment',
    name: 'Payment',
    categories: [
      { key: 'PAYMENT_METHOD', name: 'Payment Method' },
      { key: 'PAYMENT_TYPE', name: 'Payment Type' },
      { key: 'PAYMENT_STATUS', name: 'Payment Status' },
      { key: 'REFUND_REASON', name: 'Refund Reason' },
    ],
  },
]

const CATEGORY_TO_GROUP = new Map(
  MASTER_DATA_NAV_GROUPS.flatMap((group) => group.categories.map((item) => [item.key, group] as const)),
)

export function getMasterDataNavGroup(slug: string) {
  return MASTER_DATA_NAV_GROUPS.find((group) => group.slug === slug)
}

export function getMasterDataGroupByCategory(categoryKey: string) {
  return CATEGORY_TO_GROUP.get(categoryKey)
}

export const MASTER_DATA_DEFAULT_PATH = `/master-data/${MASTER_DATA_NAV_GROUPS[0].slug}`
