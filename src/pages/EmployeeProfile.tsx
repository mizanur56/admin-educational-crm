import {
  adminEmpty,
  adminPage,
  crmAccessPillClass,
  employmentStatusPillClass,
  fieldError,
  isUploading,
  photoCameraBadge,
  photoUploadSpin,
  statusPill,
} from '../styles/admin'
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Spin } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Briefcase01Icon,
  Building03Icon,
  Calendar03Icon,
  Call02Icon,
  Camera01Icon,
  Clock01Icon,
  Contact01Icon,
  Download01Icon,
  File01Icon,
  Location01Icon,
  Mail01Icon,
  PencilEdit02Icon,
  Shield01Icon,
  UserIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { getEmployee, uploadEmployeePhoto } from '../api/client'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import PageMeta from '../components/PageMeta'
import { hasPermission } from '../lib/access'
import type { AuthSession, EmployeeCrmAccess, EmployeeRecord } from '../types'
type ProfileSection = {
  id: string
  label: string
  icon: IconSvgElement
}

const SECTIONS: ProfileSection[] = [
  { id: 'personal', label: 'Personal', icon: UserIcon },
  { id: 'contact', label: 'Contact', icon: Contact01Icon },
  { id: 'employment', label: 'Employment', icon: Briefcase01Icon },
  { id: 'organization', label: 'Organization', icon: Building03Icon },
  { id: 'crm', label: 'CRM access', icon: Shield01Icon },
  { id: 'emergency', label: 'Emergency', icon: Call02Icon },
  { id: 'documents', label: 'Documents', icon: File01Icon },
]

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NID: 'NID / Identity document',
  PHOTOGRAPH: 'Photograph',
  CV: 'CV / Resume',
  EDUCATIONAL_CERTIFICATE: 'Educational certificate',
  APPOINTMENT_LETTER: 'Appointment letter',
  JOINING_DOCUMENT: 'Joining document',
  OTHER: 'Other',
}

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
}

const MARITAL_LABELS: Record<string, string> = {
  SINGLE: 'Single',
  MARRIED: 'Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
  OTHER: 'Other',
}

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
}

function displayValue(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function formatPrettyDate(value?: string | Date | null) {
  if (!value) {
    return '—'
  }
  const raw = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10)
  const [year, month, day] = raw.split('-').map(Number)
  if (!year || !month || !day) {
    return '—'
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return '—'
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ageFromDate(value?: string | null) {
  if (!value) {
    return null
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  const birth = new Date(year, month - 1, day)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

function formatTenure(joiningDate?: string | null) {
  if (!joiningDate) {
    return '—'
  }
  const [year, month, day] = joiningDate.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) {
    return '—'
  }
  const start = new Date(year, month - 1, day)
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) {
    months -= 1
  }
  if (months < 0) {
    return '—'
  }
  const years = Math.floor(months / 12)
  const remaining = months % 12
  if (years === 0 && remaining === 0) {
    return 'Joined this month'
  }
  if (years === 0) {
    return remaining === 1 ? '1 month' : `${remaining} months`
  }
  if (remaining === 0) {
    return years === 1 ? '1 year' : `${years} years`
  }
  return `${years} yr ${remaining} mo`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function crmAccessLabel(access: EmployeeCrmAccess) {
  if (access === 'ENABLED') {
    return 'Enabled'
  }
  if (access === 'DISABLED') {
    return 'Disabled'
  }
  return 'No access'
}

function employeeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'E'
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function photoSrc(employee: EmployeeRecord) {
  if (!employee.photoUrl) {
    return ''
  }
  if (employee.photoUrl.startsWith('http') || employee.photoUrl.startsWith('/')) {
    return employee.photoUrl
  }
  return `/api/employees/${employee.id}/photo`
}

function documentHref(employeeId: string, documentId: string) {
  return `/api/employees/${employeeId}/documents/${documentId}`
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function ProfileCard({
  id,
  title,
  icon,
  children,
}: {
  id: string
  title: string
  icon: IconSvgElement
  children: ReactNode
}) {
  return (
    <article id={id} className="scroll-mt-4 rounded-2xl border border-border bg-surface px-6 py-[22px] shadow-soft [&_header]:mb-5 [&_header]:flex [&_header]:items-center [&_header]:gap-3 [&_h3]:m-0 [&_h3]:text-base">
      <header>
        <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary">
          <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.7} />
        </span>
        <h3>{title}</h3>
      </header>
      {children}
    </article>
  )
}

export default function EmployeeProfile() {
  const { id } = useParams()
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const canEdit = hasPermission(auth, 'employee:edit')
  const canDocuments = hasPermission(auth, 'document:view')

  const [employee, setEmployee] = useState<EmployeeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [localPhotoPreview, setLocalPhotoPreview] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) {
        setError('Employee not found.')
        setLoading(false)
        return
      }
      setLoading(true)
      const result = await getEmployee(id)
      if (cancelled) {
        return
      }
      if (result.ok) {
        setEmployee(result.data.employee)
        setError('')
      } else {
        setEmployee(null)
        setError(result.data?.error || 'Unable to load employee profile.')
      }
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const age = useMemo(() => ageFromDate(employee?.dateOfBirth), [employee?.dateOfBirth])
  const photo = localPhotoPreview || (employee ? photoSrc(employee) : '')
  const documents = employee?.documents ?? []

  useEffect(
    () => () => {
      if (localPhotoPreview) {
        URL.revokeObjectURL(localPhotoPreview)
      }
    },
    [localPhotoPreview],
  )

  async function onProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    if (!file || !employee || photoUploading) {
      return
    }
    if (!PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) {
      setPhotoError('Use a JPG, PNG, or WEBP image of 5 MB or less.')
      return
    }

    const preview = URL.createObjectURL(file)
    setLocalPhotoPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return preview
    })
    setPhotoError('')
    setPhotoUploading(true)
    const result = await uploadEmployeePhoto(employee.id, file)
    setPhotoUploading(false)
    if (!result.ok) {
      setPhotoError(result.data?.error || 'Unable to upload the profile photo.')
      setLocalPhotoPreview((current) => {
        if (current) {
          URL.revokeObjectURL(current)
        }
        return ''
      })
      return
    }
    setEmployee(result.data.employee)
    setLocalPhotoPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return ''
    })
  }

  function scrollToSection(sectionId: string) {
    setActiveSection(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!loading && (error || !employee)) {
    return (
      <div className={`${adminPage}`}>
        <PageMeta
          title="Employee Profile"
          description={error || 'This employee could not be found.'}
        />
        <PageHeader
          title="Employee Profile"
          subtitle={error || 'This employee could not be found.'}
          breadcrumbs={[
            { title: 'Dashboard', path: '/dashboard' },
            { title: 'Employees', path: '/employees' },
            { title: 'Profile' },
          ]}
          extra={
            <Button variant="secondary" onClick={() => navigate('/employees')}>
              Back to Employees
            </Button>
          }
        />
        <div className={`${adminEmpty}`}>
          <strong>Employee profile unavailable</strong>
          <p>{error || 'This employee could not be found.'}</p>
          <Button variant="secondary" onClick={() => navigate('/employees')}>
            Back to Employees
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${adminPage} gap-5 overflow-visible [&_.ant-spin-nested-loading]:grid [&_.ant-spin-nested-loading]:gap-6 [&_.ant-spin-nested-loading]:overflow-visible [&_.ant-spin-container]:grid [&_.ant-spin-container]:gap-6 [&_.ant-spin-container]:overflow-visible`}>
      <PageMeta
        title={employee?.fullName || 'Employee Profile'}
        description="Employee Details"
      />
      <PageHeader
        title={employee?.fullName || 'Employee Profile'}
        subtitle="Employee Details"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Employees', path: '/employees' },
          { title: employee?.employeeCode || 'Details' },
        ]}
        extra={
          employee ? (
            <>
              <Button variant="secondary" onClick={() => navigate('/employees')}>
                Back to list
              </Button>
              {canDocuments ? (
                <Button variant="secondary" onClick={() => navigate(`/documents?employeeId=${employee.id}`)}>
                  Manage documents
                </Button>
              ) : null}
              {canEdit ? (
                <Button onClick={() => navigate(`/employees/${employee.id}/edit`)}>
                  <span className="ui-btn-icon">
                    <HugeiconsIcon icon={PencilEdit02Icon} size={16} color="currentColor" strokeWidth={1.6} />
                  </span>
                  Edit profile
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />

      <Spin spinning={loading}>
        {employee ? (
          <div className="grid gap-6">
            <section className="flex items-start justify-between gap-7 rounded-[20px] border border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))_0%,var(--color-surface)_52%),var(--color-surface)] px-8 py-7 shadow-soft max-[720px]:flex-col">
              <div className="flex min-w-0 gap-[22px] max-[720px]:flex-col">
                {canEdit ? (
                  <div className={`relative shrink-0${photoUploading ? ` ${isUploading}` : ''}`}>
                    <input
                      id="employee-profile-photo"
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={photoUploading}
                      onChange={(event) => void onProfilePhotoChange(event)}
                    />
                    <label
                      htmlFor="employee-profile-photo"
                      className="relative m-0 block cursor-pointer [&_.photo-camera-badge]:right-[-4px] [&_.photo-camera-badge]:bottom-[-2px] [&_.photo-camera-badge]:h-8 [&_.photo-camera-badge]:w-8"
                    >
                      <span className="relative block h-24 w-24 overflow-hidden rounded-[28px]">
                        {photo ? (
                          <img className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] border-[3px] border-surface bg-[var(--avatar-bg)] text-[1.7rem] font-bold text-[var(--avatar-fg)] object-cover shadow-[0_8px_20px_rgba(18,32,51,0.08)]" src={photo} alt="" />
                        ) : (
                          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] border-[3px] border-surface bg-[var(--avatar-bg)] text-[1.7rem] font-bold text-[var(--avatar-fg)] object-cover shadow-[0_8px_20px_rgba(18,32,51,0.08)] is-fallback">{employeeInitials(employee.fullName)}</span>
                        )}
                        {photoUploading ? (
                          <span className={`${photoUploadSpin}`}>
                            <Spin size="small" />
                          </span>
                        ) : null}
                      </span>
                      <span className={`${photoCameraBadge} photo-camera-badge`} aria-hidden>
                        <HugeiconsIcon icon={Camera01Icon} size={16} color="currentColor" strokeWidth={1.8} />
                      </span>
                      <span className="sr-only">{photoUploading ? 'Uploading profile photo' : 'Change profile photo'}</span>
                    </label>
                    {photoError ? <p className={`${fieldError}`}>{photoError}</p> : null}
                  </div>
                ) : photo ? (
                  <img className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] border-[3px] border-surface bg-[var(--avatar-bg)] text-[1.7rem] font-bold text-[var(--avatar-fg)] object-cover shadow-[0_8px_20px_rgba(18,32,51,0.08)]" src={photo} alt="" />
                ) : (
                  <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] border-[3px] border-surface bg-[var(--avatar-bg)] text-[1.7rem] font-bold text-[var(--avatar-fg)] object-cover shadow-[0_8px_20px_rgba(18,32,51,0.08)] is-fallback">{employeeInitials(employee.fullName)}</span>
                )}
                <div className="min-w-0 [&_h1]:my-1.5 [&_h1]:text-[1.7rem] [&_h1]:leading-tight [&_h1]:tracking-[-0.03em] [&_p]:mb-4 [&_p]:mt-0 [&_p]:text-text-muted">
                  <div className="text-[0.78rem] font-bold tracking-[0.04em] text-text-muted uppercase">{employee.employeeCode}</div>
                  <h1>{employee.fullName}</h1>
                  <p>
                    {[employee.designation?.name, employee.department?.name, employee.team?.name]
                      .filter(Boolean)
                      .join(' · ') || 'No assignment recorded'}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <span className={employmentStatusPillClass(employee.employmentStatus?.code)}>
                      {employee.employmentStatus?.name || 'Unknown status'}
                    </span>
                    <span className={crmAccessPillClass(employee.crmAccess.toLowerCase())}>
                      CRM {crmAccessLabel(employee.crmAccess)}
                    </span>
                    {employee.employmentType?.name ? (
                      <span className={`${statusPill} bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-primary`}>{employee.employmentType.name}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 min-[1101px]:grid-cols-4 [&_article]:flex [&_article]:items-start [&_article]:gap-3.5 [&_article]:rounded-2xl [&_article]:border [&_article]:border-border [&_article]:bg-surface [&_article]:px-5 [&_article]:py-[18px] [&_article]:shadow-soft [&_article_svg]:mt-0.5 [&_article_svg]:text-primary [&_span]:block [&_span]:text-[0.75rem] [&_span]:text-text-muted [&_strong]:mt-1.5 [&_strong]:block [&_strong]:text-[0.95rem] [&_a]:text-inherit [&_a]:no-underline hover:[&_a]:text-primary hover:[&_a]:underline" aria-label="Employment snapshot">
              <article>
                <HugeiconsIcon icon={Calendar03Icon} size={18} color="currentColor" strokeWidth={1.7} />
                <div>
                  <span>Joining date</span>
                  <strong>{formatPrettyDate(employee.joiningDate)}</strong>
                </div>
              </article>
              <article>
                <HugeiconsIcon icon={Clock01Icon} size={18} color="currentColor" strokeWidth={1.7} />
                <div>
                  <span>Tenure</span>
                  <strong>{formatTenure(employee.joiningDate)}</strong>
                </div>
              </article>
              <article>
                <HugeiconsIcon icon={UserGroupIcon} size={18} color="currentColor" strokeWidth={1.7} />
                <div>
                  <span>Reporting manager</span>
                  <strong>
                    {employee.reportingManager ? (
                      <Link to={`/employees/${employee.reportingManager.id}`}>{employee.reportingManager.fullName}</Link>
                    ) : (
                      '—'
                    )}
                  </strong>
                </div>
              </article>
              <article>
                <HugeiconsIcon icon={Mail01Icon} size={18} color="currentColor" strokeWidth={1.7} />
                <div>
                  <span>Official email</span>
                  <strong>
                    <a href={`mailto:${employee.officialEmail}`}>{employee.officialEmail}</a>
                  </strong>
                </div>
              </article>
            </section>

            <div className="grid grid-cols-1 items-start gap-x-8 gap-y-5 min-[1101px]:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="sticky top-4 z-6 grid items-start gap-4 self-start max-[1100px]:top-3 max-[1100px]:bg-page-bg max-[1100px]:pb-1 max-[960px]:top-[72px]">
                <nav className="grid gap-1.5 rounded-2xl border border-border bg-surface p-2.5 shadow-soft max-[1100px]:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] [&_button]:flex [&_button]:w-full [&_button]:cursor-pointer [&_button]:items-center [&_button]:gap-2.5 [&_button]:rounded-[10px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-left [&_button]:font-[inherit] [&_button]:text-text" aria-label="Profile sections">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className={activeSection === section.id ? 'bg-nav-active-bg text-nav-active' : 'hover:bg-hover-bg'}
                      onClick={() => scrollToSection(section.id)}
                    >
                      <HugeiconsIcon icon={section.icon} size={16} color="currentColor" strokeWidth={1.7} />
                      <span>{section.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="rounded-2xl border border-border bg-surface p-4 [&_h4]:mb-3.5 [&_h4]:mt-0 [&_h4]:text-[0.86rem] [&_p]:mb-3 [&_p]:mt-0 [&_p]:flex [&_p]:items-start [&_p]:gap-2.5 [&_p]:text-[0.84rem] [&_p]:text-text-muted [&_p:last-child]:mb-0 [&_a]:text-inherit [&_a]:no-underline hover:[&_a]:text-primary">
                  <h4>Primary contact</h4>
                  <p>
                    <HugeiconsIcon icon={Call02Icon} size={14} color="currentColor" strokeWidth={1.7} />
                    {employee.mobile ? <a href={`tel:${employee.mobile}`}>{employee.mobile}</a> : '—'}
                  </p>
                  <p>
                    <HugeiconsIcon icon={Mail01Icon} size={14} color="currentColor" strokeWidth={1.7} />
                    {employee.personalEmail ? (
                      <a href={`mailto:${employee.personalEmail}`}>{employee.personalEmail}</a>
                    ) : (
                      'No personal email'
                    )}
                  </p>
                  <p>
                    <HugeiconsIcon icon={Location01Icon} size={14} color="currentColor" strokeWidth={1.7} />
                    {displayValue(employee.presentAddress)}
                  </p>
                </div>
              </aside>

              <div className="grid gap-5">
                <ProfileCard id="personal" title="Personal information" icon={UserIcon}>
                  <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-5 min-[721px]:grid-cols-2 [&_dt]:text-[0.76rem] [&_dt]:tracking-[0.03em] [&_dt]:text-text-muted [&_dt]:uppercase [&_dd]:mt-1.5 [&_dd]:break-words [&_dd]:text-text [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
                    <Field label="Full name">{employee.fullName}</Field>
                    <Field label="Employee ID">{employee.employeeCode}</Field>
                    <Field label="Gender">{employee.gender ? GENDER_LABELS[employee.gender] || employee.gender : '—'}</Field>
                    <Field label="Date of birth">
                      {formatPrettyDate(employee.dateOfBirth)}
                      {age != null ? <span className="font-medium text-text-muted"> ({age} years)</span> : null}
                    </Field>
                    <Field label="Nationality">{displayValue(employee.nationality)}</Field>
                    <Field label="NID / Passport no.">{displayValue(employee.identityNumber)}</Field>
                    <Field label="Marital status">
                      {employee.maritalStatus ? MARITAL_LABELS[employee.maritalStatus] || employee.maritalStatus : '—'}
                    </Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="contact" title="Contact information" icon={Contact01Icon}>
                  <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-5 min-[721px]:grid-cols-2 [&_dt]:text-[0.76rem] [&_dt]:tracking-[0.03em] [&_dt]:text-text-muted [&_dt]:uppercase [&_dd]:mt-1.5 [&_dd]:break-words [&_dd]:text-text [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
                    <Field label="Personal mobile">
                      {employee.mobile ? <a href={`tel:${employee.mobile}`}>{employee.mobile}</a> : '—'}
                    </Field>
                    <Field label="Personal email">
                      {employee.personalEmail ? (
                        <a href={`mailto:${employee.personalEmail}`}>{employee.personalEmail}</a>
                      ) : (
                        '—'
                      )}
                    </Field>
                    <Field label="Official email">
                      <a href={`mailto:${employee.officialEmail}`}>{employee.officialEmail}</a>
                    </Field>
                    <Field label="Present address">{displayValue(employee.presentAddress)}</Field>
                    <Field label="Permanent address">{displayValue(employee.permanentAddress)}</Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="employment" title="Employment information" icon={Briefcase01Icon}>
                  <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-5 min-[721px]:grid-cols-2 [&_dt]:text-[0.76rem] [&_dt]:tracking-[0.03em] [&_dt]:text-text-muted [&_dt]:uppercase [&_dd]:mt-1.5 [&_dd]:break-words [&_dd]:text-text [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
                    <Field label="Designation">{displayValue(employee.designation?.name)}</Field>
                    <Field label="Employment type">{displayValue(employee.employmentType?.name)}</Field>
                    <Field label="Employment status">{displayValue(employee.employmentStatus?.name)}</Field>
                    <Field label="Joining date">{formatPrettyDate(employee.joiningDate)}</Field>
                    <Field label="Tenure">{formatTenure(employee.joiningDate)}</Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="organization" title="Organization structure" icon={Building03Icon}>
                  <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-5 min-[721px]:grid-cols-2 [&_dt]:text-[0.76rem] [&_dt]:tracking-[0.03em] [&_dt]:text-text-muted [&_dt]:uppercase [&_dd]:mt-1.5 [&_dd]:break-words [&_dd]:text-text [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
                    <Field label="Department">{displayValue(employee.department?.name)}</Field>
                    <Field label="Team">{displayValue(employee.team?.name)}</Field>
                    <Field label="Reporting manager">
                      {employee.reportingManager ? (
                        <>
                          <Link to={`/employees/${employee.reportingManager.id}`}>{employee.reportingManager.fullName}</Link>
                          <span className="font-medium text-text-muted"> ({employee.reportingManager.employeeCode})</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </Field>
                    <Field label="CRM role">{displayValue(employee.role?.name)}</Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="crm" title="CRM access" icon={Shield01Icon}>
                  <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-5 min-[721px]:grid-cols-2 [&_dt]:text-[0.76rem] [&_dt]:tracking-[0.03em] [&_dt]:text-text-muted [&_dt]:uppercase [&_dd]:mt-1.5 [&_dd]:break-words [&_dd]:text-text [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
                    <Field label="CRM access">{crmAccessLabel(employee.crmAccess)}</Field>
                    <Field label="Linked account">{employee.user ? 'Yes' : 'No CRM user'}</Field>
                    <Field label="Username">{displayValue(employee.user?.username)}</Field>
                    <Field label="Account status">
                      {employee.user?.status ? USER_STATUS_LABELS[employee.user.status] || employee.user.status : '—'}
                    </Field>
                    <Field label="Role key">{displayValue(employee.role?.key)}</Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="emergency" title="Emergency contact" icon={Call02Icon}>
                  <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-5 min-[721px]:grid-cols-2 [&_dt]:text-[0.76rem] [&_dt]:tracking-[0.03em] [&_dt]:text-text-muted [&_dt]:uppercase [&_dd]:mt-1.5 [&_dd]:break-words [&_dd]:text-text [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
                    <Field label="Contact name">{displayValue(employee.emergencyName)}</Field>
                    <Field label="Relationship">{displayValue(employee.emergencyRelationship)}</Field>
                    <Field label="Mobile">
                      {employee.emergencyMobile ? (
                        <a href={`tel:${employee.emergencyMobile}`}>{employee.emergencyMobile}</a>
                      ) : (
                        '—'
                      )}
                    </Field>
                    <Field label="Address">{displayValue(employee.emergencyAddress)}</Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="documents" title="Documents" icon={File01Icon}>
                  {documents.length === 0 ? (
                    <p className="m-0 text-text-muted">No documents have been uploaded for this employee.</p>
                  ) : (
                    <ul className="m-0 grid list-none gap-3 p-0 [&_li]:flex [&_li]:items-center [&_li]:justify-between [&_li]:gap-3 [&_li]:rounded-xl [&_li]:border [&_li]:border-border-subtle [&_li]:bg-[color-mix(in_srgb,var(--color-page-bg)_70%,var(--color-surface))] [&_li]:px-3.5 [&_li]:py-3 max-[720px]:[&_li]:grid [&_strong]:block [&_span]:block [&_span]:text-[0.8rem] [&_span]:text-text-muted">
                      {documents.map((doc) => (
                        <li key={doc.id}>
                          <div>
                            <strong>{DOCUMENT_TYPE_LABELS[doc.type] || doc.type}</strong>
                            <span>
                              {doc.fileName} · {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                          <a
                            className="inline-flex shrink-0 items-center gap-1.5 font-[650] text-primary no-underline"
                            href={documentHref(employee.id, doc.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <HugeiconsIcon icon={Download01Icon} size={15} color="currentColor" strokeWidth={1.7} />
                            View
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </ProfileCard>

                <p className="m-0 text-[0.8rem] text-text-muted">
                  Record created {formatDateTime(employee.createdAt)} · Last updated {formatDateTime(employee.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-[420px]" />
        )}
      </Spin>
    </div>
  )
}
