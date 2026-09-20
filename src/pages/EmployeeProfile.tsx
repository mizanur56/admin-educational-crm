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
import { hasPermission } from '../lib/access'
import type { AuthSession, EmployeeCrmAccess, EmployeeRecord } from '../types'
import './admin.css'

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

function statusClass(code?: string | null) {
  return `status-${(code || 'inactive').toLowerCase().replaceAll('_', '-')}`
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
    <article id={id} className="employee-profile-card">
      <header>
        <span className="employee-profile-card-icon">
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
      <div className="admin-page">
        <div className="admin-empty">
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
    <div className="admin-page employee-profile">
      <nav className="employee-profile-crumb" aria-label="Breadcrumb">
        <Link to="/employees">Employees</Link>
        <span aria-hidden="true">/</span>
        <span>{employee?.employeeCode || 'Profile'}</span>
      </nav>

      <Spin spinning={loading}>
        {employee ? (
          <div className="employee-profile-body">
            <section className="employee-profile-hero">
              <div className="employee-profile-hero-main">
                {canEdit ? (
                  <div className={`employee-profile-photo-picker${photoUploading ? ' is-uploading' : ''}`}>
                    <input
                      id="employee-profile-photo"
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={photoUploading}
                      onChange={(event) => void onProfilePhotoChange(event)}
                    />
                    <label htmlFor="employee-profile-photo" className="employee-profile-photo-button">
                      <span className="employee-profile-photo-frame">
                        {photo ? (
                          <img className="employee-profile-photo" src={photo} alt="" />
                        ) : (
                          <span className="employee-profile-photo is-fallback">{employeeInitials(employee.fullName)}</span>
                        )}
                        {photoUploading ? (
                          <span className="photo-upload-spin">
                            <Spin size="small" />
                          </span>
                        ) : null}
                      </span>
                      <span className="photo-camera-badge" aria-hidden>
                        <HugeiconsIcon icon={Camera01Icon} size={16} color="currentColor" strokeWidth={1.8} />
                      </span>
                      <span className="sr-only">{photoUploading ? 'Uploading profile photo' : 'Change profile photo'}</span>
                    </label>
                    {photoError ? <p className="field-error">{photoError}</p> : null}
                  </div>
                ) : photo ? (
                  <img className="employee-profile-photo" src={photo} alt="" />
                ) : (
                  <span className="employee-profile-photo is-fallback">{employeeInitials(employee.fullName)}</span>
                )}
                <div className="employee-profile-identity">
                  <div className="employee-profile-kicker">{employee.employeeCode}</div>
                  <h1>{employee.fullName}</h1>
                  <p>
                    {[employee.designation?.name, employee.department?.name, employee.team?.name]
                      .filter(Boolean)
                      .join(' · ') || 'No assignment recorded'}
                  </p>
                  <div className="employee-profile-pills">
                    <span className={`status-pill ${statusClass(employee.employmentStatus?.code)}`}>
                      {employee.employmentStatus?.name || 'Unknown status'}
                    </span>
                    <span className={`status-pill crm-access-${employee.crmAccess.toLowerCase()}`}>
                      CRM {crmAccessLabel(employee.crmAccess)}
                    </span>
                    {employee.employmentType?.name ? (
                      <span className="status-pill employee-profile-type">{employee.employmentType.name}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="employee-profile-hero-actions">
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
              </div>
            </section>

            <section className="employee-profile-stats" aria-label="Employment snapshot">
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

            <div className="employee-profile-layout">
              <aside className="employee-profile-aside">
                <nav className="employee-profile-nav" aria-label="Profile sections">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className={activeSection === section.id ? 'is-active' : undefined}
                      onClick={() => scrollToSection(section.id)}
                    >
                      <HugeiconsIcon icon={section.icon} size={16} color="currentColor" strokeWidth={1.7} />
                      <span>{section.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="employee-profile-aside-card">
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

              <div className="employee-profile-main">
                <ProfileCard id="personal" title="Personal information" icon={UserIcon}>
                  <dl className="employee-profile-fields">
                    <Field label="Full name">{employee.fullName}</Field>
                    <Field label="Employee ID">{employee.employeeCode}</Field>
                    <Field label="Gender">{employee.gender ? GENDER_LABELS[employee.gender] || employee.gender : '—'}</Field>
                    <Field label="Date of birth">
                      {formatPrettyDate(employee.dateOfBirth)}
                      {age != null ? <span className="employee-profile-hint"> ({age} years)</span> : null}
                    </Field>
                    <Field label="Nationality">{displayValue(employee.nationality)}</Field>
                    <Field label="NID / Passport no.">{displayValue(employee.identityNumber)}</Field>
                    <Field label="Marital status">
                      {employee.maritalStatus ? MARITAL_LABELS[employee.maritalStatus] || employee.maritalStatus : '—'}
                    </Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="contact" title="Contact information" icon={Contact01Icon}>
                  <dl className="employee-profile-fields">
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
                  <dl className="employee-profile-fields">
                    <Field label="Designation">{displayValue(employee.designation?.name)}</Field>
                    <Field label="Employment type">{displayValue(employee.employmentType?.name)}</Field>
                    <Field label="Employment status">{displayValue(employee.employmentStatus?.name)}</Field>
                    <Field label="Joining date">{formatPrettyDate(employee.joiningDate)}</Field>
                    <Field label="Tenure">{formatTenure(employee.joiningDate)}</Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="organization" title="Organization structure" icon={Building03Icon}>
                  <dl className="employee-profile-fields">
                    <Field label="Department">{displayValue(employee.department?.name)}</Field>
                    <Field label="Team">{displayValue(employee.team?.name)}</Field>
                    <Field label="Reporting manager">
                      {employee.reportingManager ? (
                        <>
                          <Link to={`/employees/${employee.reportingManager.id}`}>{employee.reportingManager.fullName}</Link>
                          <span className="employee-profile-hint"> ({employee.reportingManager.employeeCode})</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </Field>
                    <Field label="CRM role">{displayValue(employee.role?.name)}</Field>
                  </dl>
                </ProfileCard>

                <ProfileCard id="crm" title="CRM access" icon={Shield01Icon}>
                  <dl className="employee-profile-fields">
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
                  <dl className="employee-profile-fields">
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
                    <p className="employee-profile-empty">No documents have been uploaded for this employee.</p>
                  ) : (
                    <ul className="employee-profile-docs">
                      {documents.map((doc) => (
                        <li key={doc.id}>
                          <div>
                            <strong>{DOCUMENT_TYPE_LABELS[doc.type] || doc.type}</strong>
                            <span>
                              {doc.fileName} · {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                          <a
                            className="employee-profile-doc-link"
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

                <p className="employee-profile-meta">
                  Record created {formatDateTime(employee.createdAt)} · Last updated {formatDateTime(employee.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="employee-profile-placeholder" />
        )}
      </Spin>
    </div>
  )
}
