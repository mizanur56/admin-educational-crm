import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { DatePicker, Spin, Switch } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  Camera01Icon,
  Cancel01Icon,
  Certificate01Icon,
  CloudUploadIcon,
  ContractsIcon,
  Delete02Icon,
  DocumentAttachmentIcon,
  File01Icon,
  File02Icon,
  IdentityCardIcon,
  UserIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  createEmployee,
  deleteEmployeeDocument,
  fetchEmployeeDocumentBlob,
  getEmployee,
  listEmployeeOptions,
  updateEmployee,
  uploadEmployeeDocument,
  uploadEmployeePhoto,
} from '../api/client'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import PageHeader from '../components/PageHeader'
import { hasPermission } from '../lib/access'
import type { AuthSession, EmployeeOptions, EmployeeRecord, UserStatus } from '../types'
import './admin.css'

type FieldErrors = Record<string, string>
type ToastState = { text: string; type: 'success' | 'error' }
type ExistingDocument = { id: string; fileName: string; mimeType: string }
type PreviewState = { title: string; fileName: string; mimeType: string; url: string; loading: boolean }
type DeleteTarget = { key: string; label: string; fileName: string; documentId?: string }

type FormState = {
  fullName: string
  gender: string
  dateOfBirth: string
  nationality: string
  identityNumber: string
  maritalStatus: string
  mobile: string
  personalEmail: string
  officialEmail: string
  presentAddress: string
  permanentAddress: string
  joiningDate: string
  employmentTypeId: string
  employmentStatusId: string
  designationId: string
  departmentId: string
  teamId: string
  reportingManagerId: string
  createCrmAccount: boolean
  username: string
  roleId: string
  userStatus: UserStatus
  emergencyName: string
  emergencyRelationship: string
  emergencyMobile: string
  emergencyAddress: string
}

const EMPTY_FORM: FormState = {
  fullName: '',
  gender: '',
  dateOfBirth: '',
  nationality: '',
  identityNumber: '',
  maritalStatus: '',
  mobile: '',
  personalEmail: '',
  officialEmail: '',
  presentAddress: '',
  permanentAddress: '',
  joiningDate: '',
  employmentTypeId: '',
  employmentStatusId: '',
  designationId: '',
  departmentId: '',
  teamId: '',
  reportingManagerId: '',
  createCrmAccount: false,
  username: '',
  roleId: '',
  userStatus: 'ACTIVE',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyMobile: '',
  emergencyAddress: '',
}

const DOCUMENT_FIELDS = [
  {
    key: 'documentNid',
    label: 'NID / Identity Document',
    description: 'National ID card, passport, or other government issued ID.',
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    icon: IdentityCardIcon,
  },
  {
    key: 'documentPhotograph',
    label: 'Photograph',
    description: 'Recent passport size photograph with clear background.',
    accept: '.jpg,.jpeg,.png,.webp',
    icon: Camera01Icon,
  },
  {
    key: 'documentCv',
    label: 'CV / Resume',
    description: 'Upload a current CV or resume (PDF or Word).',
    accept: '.pdf,.doc,.docx',
    icon: File01Icon,
  },
  {
    key: 'documentCertificate',
    label: 'Educational Certificate',
    description: 'Degree, diploma, or other academic certificate.',
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    icon: Certificate01Icon,
  },
  {
    key: 'documentAppointment',
    label: 'Appointment Letter',
    description: 'Official appointment or offer letter.',
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    icon: ContractsIcon,
  },
  {
    key: 'documentJoining',
    label: 'Joining Document',
    description: 'Joining report or related joining paperwork.',
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    icon: DocumentAttachmentIcon,
  },
  {
    key: 'documentOther',
    label: 'Other',
    description: 'Any additional supporting document.',
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    icon: File02Icon,
  },
] as const

const DOCUMENT_TYPE_TO_FIELD: Record<string, (typeof DOCUMENT_FIELDS)[number]['key']> = {
  NID: 'documentNid',
  PHOTOGRAPH: 'documentPhotograph',
  CV: 'documentCv',
  EDUCATIONAL_CERTIFICATE: 'documentCertificate',
  APPOINTMENT_LETTER: 'documentAppointment',
  JOINING_DOCUMENT: 'documentJoining',
  OTHER: 'documentOther',
}

const SECTION_FIELDS: Record<string, string[]> = {
  personal: ['photo', 'fullName', 'gender', 'dateOfBirth', 'nationality', 'identityNumber', 'maritalStatus'],
  contact: ['mobile', 'personalEmail', 'officialEmail', 'presentAddress', 'permanentAddress'],
  employment: ['joiningDate', 'employmentTypeId', 'employmentStatusId', 'designationId'],
  organization: ['departmentId', 'teamId', 'reportingManagerId'],
  crm: ['createCrmAccount', 'username', 'roleId', 'userStatus'],
  emergency: ['emergencyName', 'emergencyRelationship', 'emergencyMobile', 'emergencyAddress'],
  documents: DOCUMENT_FIELDS.map((item) => item.key),
}

const MAX_FILE_BYTES = 5 * 1024 * 1024

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <span className={required ? 'field-label is-required' : 'field-label'}>{children}</span>
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toDayjs(value: string) {
  return value ? dayjs(value) : null
}

function toDateString(value: Dayjs | null) {
  return value ? value.format('YYYY-MM-DD') : ''
}

function isValidMobile(value: string) {
  return /^\+?[0-9]{10,15}$/.test(value.replace(/[\s()-]/g, ''))
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function usernameFromEmail(email: string) {
  const local = email.trim().split('@')[0] || ''
  return local.toLowerCase().replace(/[^a-z0-9._-]/g, '')
}

function Field({
  id,
  label,
  required,
  span,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  required?: boolean
  span?: boolean
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className={`form-field${error ? ' is-invalid' : ''}${span ? ' admin-form-span' : ''}`}>
      <label htmlFor={id}>
        <FieldLabel required={required}>{label}</FieldLabel>
      </label>
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

function FormSection({
  id,
  title,
  description,
  errors,
  children,
  className = '',
}: {
  id: string
  title: string
  description?: string
  errors: string[]
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`admin-card form-section ${className}`.trim()} aria-labelledby={`${id}-title`}>
      <header className="form-section-header">
        <h3 id={`${id}-title`}>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      {errors.length > 0 ? (
        <ul className="section-errors" aria-live="polite">
          {errors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <div className="admin-form-fields">{children}</div>
    </section>
  )
}

function validateForm(form: FormState, photo: File | null, documents: Record<string, File | null>): FieldErrors {
  const errors: FieldErrors = {}

  if (form.fullName.trim().length < 2 || form.fullName.trim().length > 100) {
    errors.fullName = 'Employee name must be 2–100 characters.'
  }
  if (form.dateOfBirth && dayjs(form.dateOfBirth).isAfter(dayjs(), 'day')) {
    errors.dateOfBirth = 'Date of birth cannot be in the future.'
  }
  if (!isValidMobile(form.mobile)) {
    errors.mobile = 'Please enter a valid personal mobile number.'
  }
  if (form.personalEmail && !isValidEmail(form.personalEmail)) {
    errors.personalEmail = 'Please enter a valid personal email.'
  }
  if (!isValidEmail(form.officialEmail)) {
    errors.officialEmail = 'Please enter a valid official email.'
  }
  if (!form.joiningDate) {
    errors.joiningDate = 'Joining date is required.'
  }
  if (!form.employmentTypeId) {
    errors.employmentTypeId = 'Employment type is required.'
  }
  if (!form.employmentStatusId) {
    errors.employmentStatusId = 'Employment status is required.'
  }
  if (!form.designationId) {
    errors.designationId = 'Designation is required.'
  }
  if (!form.departmentId) {
    errors.departmentId = 'Department is required.'
  }
  if (form.createCrmAccount && !form.username.trim()) {
    errors.username = 'Username is required to create a CRM account.'
  }
  if (form.createCrmAccount && !form.roleId) {
    errors.roleId = 'Role is required to create a CRM account.'
  }

  const hasEmergency = Boolean(
    form.emergencyName.trim() || form.emergencyRelationship.trim() || form.emergencyMobile.trim() || form.emergencyAddress.trim(),
  )
  if (hasEmergency && !form.emergencyName.trim()) {
    errors.emergencyName = 'Emergency contact name is required when emergency details are provided.'
  }
  if (hasEmergency && !isValidMobile(form.emergencyMobile)) {
    errors.emergencyMobile = 'Please enter a valid emergency mobile number.'
  }

  if (photo && photo.size > MAX_FILE_BYTES) {
    errors.photo = 'Profile photo must be 5 MB or smaller.'
  }
  for (const item of DOCUMENT_FIELDS) {
    const file = documents[item.key]
    if (file && file.size > MAX_FILE_BYTES) {
      errors[item.key] = `${item.label} must be 5 MB or smaller.`
    }
  }

  return errors
}

function sectionErrors(sectionId: string, errors: FieldErrors) {
  return (SECTION_FIELDS[sectionId] || []).map((key) => errors[key]).filter(Boolean)
}

function formFromEmployee(employee: EmployeeRecord): FormState {
  return {
    fullName: employee.fullName || '',
    gender: employee.gender || '',
    dateOfBirth: employee.dateOfBirth || '',
    nationality: employee.nationality || '',
    identityNumber: employee.identityNumber || '',
    maritalStatus: employee.maritalStatus || '',
    mobile: employee.mobile || '',
    personalEmail: employee.personalEmail || '',
    officialEmail: employee.officialEmail || '',
    presentAddress: employee.presentAddress || '',
    permanentAddress: employee.permanentAddress || '',
    joiningDate: employee.joiningDate || '',
    employmentTypeId: employee.employmentType?.id || '',
    employmentStatusId: employee.employmentStatus?.id || '',
    designationId: employee.designation?.id || '',
    departmentId: employee.department?.id || '',
    teamId: employee.team?.id || '',
    reportingManagerId: employee.reportingManager?.id || '',
    createCrmAccount: Boolean(employee.user),
    username: employee.user?.username || '',
    roleId: employee.role?.id || '',
    userStatus: employee.user?.status || 'ACTIVE',
    emergencyName: employee.emergencyName || '',
    emergencyRelationship: employee.emergencyRelationship || '',
    emergencyMobile: employee.emergencyMobile || '',
    emergencyAddress: employee.emergencyAddress || '',
  }
}

function existingPhotoSrc(employee: EmployeeRecord) {
  if (!employee.photoUrl) {
    return ''
  }
  if (employee.photoUrl.startsWith('http') || employee.photoUrl.startsWith('/')) {
    return employee.photoUrl
  }
  return `/api/employees/${employee.id}/photo`
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith('image/')
}

function isPdfMime(mimeType: string, fileName = '') {
  return mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
}

export default function EmployeeCreate() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const canCreate = hasPermission(auth, 'employee:create')
  const canEdit = hasPermission(auth, 'employee:edit')
  const allowed = isEdit ? canEdit : canCreate
  const [options, setOptions] = useState<EmployeeOptions | null>(null)
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [documents, setDocuments] = useState<Record<string, File | null>>({})
  const [documentUploading, setDocumentUploading] = useState<Record<string, boolean>>({})
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deletingDocument, setDeletingDocument] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [formError, setFormError] = useState('')
  const usernameTouched = useRef(false)
  const submitting = useRef(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewUrl = useRef('')
  const hasExistingCrmAccount = Boolean(employee?.user)

  const teams = useMemo(
    () => options?.departments.find((item) => item.id === form.departmentId)?.teams ?? [],
    [form.departmentId, options?.departments],
  )
  const managerOptions = useMemo(() => {
    const list = (options?.managers || []).filter((item) => item.id !== employee?.id)
    const current = employee?.reportingManager
    if (current && current.id !== employee?.id && !list.some((item) => item.id === current.id)) {
      return [current, ...list]
    }
    return list
  }, [employee?.id, employee?.reportingManager, options?.managers])
  const existingDocuments = useMemo(() => {
    const map: Partial<Record<(typeof DOCUMENT_FIELDS)[number]['key'], ExistingDocument>> = {}
    for (const doc of employee?.documents || []) {
      const key = DOCUMENT_TYPE_TO_FIELD[doc.type]
      if (key && !map[key]) {
        map[key] = { id: doc.id, fileName: doc.fileName, mimeType: doc.mimeType }
      }
    }
    return map
  }, [employee?.documents])
  const departmentName = options?.departments.find((item) => item.id === form.departmentId)?.name || '—'
  const teamName = teams.find((item) => item.id === form.teamId)?.name || '—'
  const employmentStatusName =
    options?.employmentStatuses.find((item) => item.id === form.employmentStatusId)?.name || 'Not selected'
  const roleName = options?.roles.find((item) => item.id === form.roleId)?.name || 'Not selected'
  const employeeCodeLabel = isEdit ? employee?.employeeCode || '—' : options?.nextEmployeeCode || 'Assigned on save'
  const pageTitle = isEdit ? 'Edit Employee' : 'Create Employee'
  const pageDescription = isEdit
    ? 'Update the staff record. Employee ID stays the same.'
    : 'Add a staff record in clear sections. Employee ID is assigned automatically on save.'

  useEffect(() => {
    listEmployeeOptions().then((result) => {
      if (result.ok) {
        const activeStatus = result.data.employmentStatuses.find((item) => item.code === 'ACTIVE')
        setOptions(result.data)
        if (!isEdit) {
          setForm((current) => ({
            ...current,
            employmentStatusId: current.employmentStatusId || activeStatus?.id || '',
          }))
        }
      } else {
        setFormError(result.data?.error || 'Unable to load employee options.')
      }
    })
  }, [isEdit])

  useEffect(() => {
    if (!id) {
      setEmployee(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getEmployee(id).then((result) => {
      if (result.ok) {
        setEmployee(result.data.employee)
        setForm(formFromEmployee(result.data.employee))
        setFormError('')
      } else {
        setFormError(result.data?.error || 'Unable to load employee.')
      }
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(employee ? existingPhotoSrc(employee) : '')
      return undefined
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo, employee])

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }
      if (previewUrl.current) {
        URL.revokeObjectURL(previewUrl.current)
      }
    },
    [],
  )

  function releasePreviewUrl() {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current)
      previewUrl.current = ''
    }
  }

  function closePreview() {
    releasePreviewUrl()
    setPreview(null)
  }

  function showToast(text: string, type: ToastState['type'] = 'success') {
    setToast({ text, type })
    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) {
        return current
      }
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function validateField(key: keyof FormState) {
    const next = validateForm({ ...form }, photo, documents)
    setErrors((current) => ({ ...current, [key]: next[key] || '' }))
  }

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    if (!file || photoUploading) {
      return
    }

    setErrors((current) => {
      const next = { ...current }
      delete next.photo
      return next
    })

    if (file.size > MAX_FILE_BYTES) {
      setErrors((current) => ({ ...current, photo: 'Profile photo must be 5 MB or smaller.' }))
      return
    }

    if (isEdit && id) {
      const preview = URL.createObjectURL(file)
      setPhotoPreview(preview)
      setPhotoUploading(true)
      const result = await uploadEmployeePhoto(id, file)
      setPhotoUploading(false)
      URL.revokeObjectURL(preview)
      if (!result.ok) {
        setPhotoPreview(employee ? existingPhotoSrc(employee) : '')
        const message = result.data?.error || 'Unable to upload the profile photo.'
        setErrors((current) => ({ ...current, photo: message }))
        showToast(message, 'error')
        return
      }
      setEmployee(result.data.employee)
      setPhoto(null)
      setPhotoPreview(existingPhotoSrc(result.data.employee))
      showToast('Profile photo updated.')
      return
    }

    setPhoto(file)
  }

  async function onDocumentChange(key: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    if (!file || documentUploading[key]) {
      return
    }

    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })

    if (file.size > MAX_FILE_BYTES) {
      setErrors((current) => ({ ...current, [key]: 'This file must be 5 MB or smaller.' }))
      return
    }

    setDocumentUploading((current) => ({ ...current, [key]: true }))
    try {
      if (isEdit && id) {
        const result = await uploadEmployeeDocument(id, key, file)
        if (!result.ok) {
          const message = result.data?.error || 'Unable to upload the document.'
          setErrors((current) => ({ ...current, [key]: message }))
          showToast(message, 'error')
          return
        }
        setEmployee(result.data.employee)
        showToast('Document uploaded.')
        return
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      setDocuments((current) => ({ ...current, [key]: file }))
    } finally {
      setDocumentUploading((current) => ({ ...current, [key]: false }))
    }
  }

  async function openDocumentPreview(item: (typeof DOCUMENT_FIELDS)[number]) {
    const localFile = documents[item.key]
    const existing = existingDocuments[item.key]
    if (localFile) {
      releasePreviewUrl()
      const url = URL.createObjectURL(localFile)
      previewUrl.current = url
      setPreview({
        title: item.label,
        fileName: localFile.name,
        mimeType: localFile.type,
        url,
        loading: false,
      })
      return
    }
    if (!isEdit || !id || !existing) {
      return
    }
    releasePreviewUrl()
    setPreview({
      title: item.label,
      fileName: existing.fileName,
      mimeType: existing.mimeType,
      url: '',
      loading: true,
    })
    const result = await fetchEmployeeDocumentBlob(id, existing.id)
    if (!result.ok) {
      setPreview(null)
      showToast(result.error, 'error')
      return
    }
    const url = URL.createObjectURL(result.blob)
    previewUrl.current = url
    setPreview({
      title: item.label,
      fileName: existing.fileName,
      mimeType: result.mimeType || existing.mimeType,
      url,
      loading: false,
    })
  }

  async function confirmDeleteDocument() {
    if (!deleteTarget || deletingDocument) {
      return
    }
    if (deleteTarget.documentId && isEdit && id) {
      setDeletingDocument(true)
      const result = await deleteEmployeeDocument(id, deleteTarget.documentId)
      setDeletingDocument(false)
      if (!result.ok) {
        const message = result.data?.error || 'Unable to delete the document.'
        showToast(message, 'error')
        return
      }
      setEmployee(result.data.employee)
      setDeleteTarget(null)
      showToast('Document deleted.')
      return
    }
    setDocuments((current) => ({ ...current, [deleteTarget.key]: null }))
    setDeleteTarget(null)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!allowed || saving || submitting.current || (isEdit && !id)) {
      return
    }

    const nextErrors = validateForm(
      { ...form, createCrmAccount: hasExistingCrmAccount || form.createCrmAccount },
      photo,
      documents,
    )
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) {
      const first = Object.keys(nextErrors)[0]
      const section = Object.entries(SECTION_FIELDS).find(([, keys]) => keys.includes(first))?.[0]
      document.getElementById(section || 'personal')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setFormError('Please correct the highlighted fields.')
      return
    }

    submitting.current = true
    setSaving(true)
    setFormError('')

    const body = new FormData()
    const crmEnabled = hasExistingCrmAccount || form.createCrmAccount
    Object.entries(form).forEach(([key, value]) => {
      if (!crmEnabled && (key === 'username' || key === 'roleId' || key === 'userStatus')) {
        return
      }
      if (typeof value === 'boolean') {
        body.set(key, value ? 'true' : 'false')
        return
      }
      if (value) {
        body.set(key, String(value))
      }
    })
    if (hasExistingCrmAccount) {
      body.set('createCrmAccount', 'true')
    }
    if (photo) {
      body.set('photo', photo)
    }
    Object.entries(documents).forEach(([key, file]) => {
      if (file) {
        body.append(key, file)
      }
    })

    const result = isEdit && id ? await updateEmployee(id, body) : await createEmployee(body)
    if (!result.ok) {
      submitting.current = false
      setSaving(false)
      setErrors(result.data?.fields || {})
      const message = result.data?.error || (isEdit ? 'Unable to update employee.' : 'Unable to create employee.')
      setFormError(message)
      showToast(message, 'error')
      return
    }

    const saved = result.data.employee
    const extra = result.data.reset?.devResetPath ? ` Reset link: ${result.data.reset.devResetPath}` : ''
    showToast(`${saved.fullName} (${saved.employeeCode}) was ${isEdit ? 'updated' : 'created'}.${extra}`)
    navigate('/employees', {
      replace: true,
      state: {
        toast: isEdit
          ? `Employee ${saved.employeeCode} updated successfully.`
          : `Employee ${saved.employeeCode} created successfully.`,
      },
    })
  }

  if (!allowed) {
    return (
      <div className="admin-page">
        <PageHeader
          title={pageTitle}
          description={isEdit ? 'You do not have permission to edit employees.' : 'You do not have permission to create employees.'}
        />
      </div>
    )
  }

  const fieldProps = (id: string) => ({
    id,
    'aria-invalid': Boolean(errors[id]) || undefined,
    'aria-describedby': errors[id] ? `${id}-error` : undefined,
  })
  const emergencyStarted = Boolean(
    form.emergencyName.trim() || form.emergencyRelationship.trim() || form.emergencyMobile.trim() || form.emergencyAddress.trim(),
  )
  const showCrmFields = hasExistingCrmAccount || form.createCrmAccount

  return (
    <div className="admin-page employee-create">
      <PageHeader title={pageTitle} description={pageDescription}>
        {isEdit && id ? (
          <Button variant="secondary" onClick={() => navigate(`/employees/${id}`)}>
            View profile
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => navigate('/employees')}>
          Back to Employees
        </Button>
      </PageHeader>

      {formError ? <p className="admin-banner">{formError}</p> : null}

      <Spin spinning={loading}>
        <form className="employee-create-form" onSubmit={(event) => void onSubmit(event)} noValidate>
        <FormSection
          id="personal"
          title="Personal Information"
          description="Identity details used across HR records and the employee list."
          errors={sectionErrors('personal', errors)}
        >
          <div className={`photo-upload admin-form-span${errors.photo ? ' is-invalid' : ''}`}>
            <div className="photo-picker">
              <input
                {...fieldProps('photo')}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={photoUploading}
                onChange={(event) => void onPhotoChange(event)}
              />
              <label htmlFor="photo" className={`photo-picker-button${photoUploading ? ' is-uploading' : ''}`}>
                <span className="photo-preview">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" />
                  ) : (
                    <HugeiconsIcon icon={UserIcon} size={52} color="currentColor" strokeWidth={1.5} />
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
                <span className="sr-only">{photoUploading ? 'Uploading profile photo' : 'Upload profile photo'}</span>
              </label>
            </div>
            <p className="field-hint">JPG, PNG, or WEBP. Max 5 MB.</p>
            {errors.photo ? (
              <p id="photo-error" className="field-error">
                {errors.photo}
              </p>
            ) : null}
          </div>
          <Field id="fullName" label="Employee name" required error={errors.fullName}>
            <Input
              {...fieldProps('fullName')}
              value={form.fullName}
              autoComplete="name"
              onChange={(event) => update('fullName', event.target.value)}
              onBlur={() => validateField('fullName')}
            />
          </Field>
          <Field id="employeeCode" label="Employee ID">
            <Input id="employeeCode" value={employeeCodeLabel} disabled readOnly />
          </Field>
          <Field id="gender" label="Gender" error={errors.gender}>
            <Select
              id="gender"
              allowClear
              placeholder="Select gender"
              value={form.gender || undefined}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
              onChange={(value) => update('gender', asSelectString(value))}
            />
          </Field>
          <Field id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth}>
            <DatePicker
              id="dateOfBirth"
              allowClear
              value={toDayjs(form.dateOfBirth)}
              disabledDate={(current) => current.isAfter(dayjs(), 'day')}
              onChange={(value) => update('dateOfBirth', toDateString(value))}
            />
          </Field>
          <Field id="nationality" label="Nationality" error={errors.nationality}>
            <Input
              {...fieldProps('nationality')}
              value={form.nationality}
              onChange={(event) => update('nationality', event.target.value)}
            />
          </Field>
          <Field id="identityNumber" label="NID / Passport no." error={errors.identityNumber}>
            <Input
              {...fieldProps('identityNumber')}
              value={form.identityNumber}
              onChange={(event) => update('identityNumber', event.target.value)}
            />
          </Field>
          <Field id="maritalStatus" label="Marital status" error={errors.maritalStatus}>
            <Select
              id="maritalStatus"
              allowClear
              placeholder="Select status"
              value={form.maritalStatus || undefined}
              options={[
                { value: 'SINGLE', label: 'Single' },
                { value: 'MARRIED', label: 'Married' },
                { value: 'DIVORCED', label: 'Divorced' },
                { value: 'WIDOWED', label: 'Widowed' },
                { value: 'OTHER', label: 'Other' },
              ]}
              onChange={(value) => update('maritalStatus', asSelectString(value))}
            />
          </Field>
        </FormSection>

        <FormSection id="contact" title="Contact Information" errors={sectionErrors('contact', errors)}>
          <Field id="mobile" label="Personal mobile" required error={errors.mobile}>
            <Input
              {...fieldProps('mobile')}
              value={form.mobile}
              autoComplete="tel"
              onChange={(event) => update('mobile', event.target.value)}
              onBlur={() => validateField('mobile')}
            />
          </Field>
          <Field id="personalEmail" label="Personal email" error={errors.personalEmail}>
            <Input
              {...fieldProps('personalEmail')}
              type="email"
              value={form.personalEmail}
              autoComplete="email"
              onChange={(event) => update('personalEmail', event.target.value)}
              onBlur={() => validateField('personalEmail')}
            />
          </Field>
          <Field id="officialEmail" label="Official email" required error={errors.officialEmail}>
            <Input
              {...fieldProps('officialEmail')}
              type="email"
              value={form.officialEmail}
              onChange={(event) => {
                const value = event.target.value
                setForm((current) => ({
                  ...current,
                  officialEmail: value,
                  username:
                    current.createCrmAccount && !usernameTouched.current
                      ? usernameFromEmail(value)
                      : current.username,
                }))
                setErrors((current) => {
                  if (!current.officialEmail) {
                    return current
                  }
                  const next = { ...current }
                  delete next.officialEmail
                  return next
                })
              }}
              onBlur={() => validateField('officialEmail')}
            />
          </Field>
          <div className="address-row admin-form-span">
            <Field id="presentAddress" label="Present address" error={errors.presentAddress}>
              <Input.TextArea
                {...fieldProps('presentAddress')}
                rows={3}
                value={form.presentAddress}
                onChange={(event) => update('presentAddress', event.target.value)}
              />
            </Field>
            <Field id="permanentAddress" label="Permanent address" error={errors.permanentAddress}>
              <Input.TextArea
                {...fieldProps('permanentAddress')}
                rows={3}
                value={form.permanentAddress}
                onChange={(event) => update('permanentAddress', event.target.value)}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection id="employment" title="Employment Information" errors={sectionErrors('employment', errors)}>
          <Field id="joiningDate" label="Joining date" required error={errors.joiningDate}>
            <DatePicker
              id="joiningDate"
              allowClear={false}
              value={toDayjs(form.joiningDate)}
              onChange={(value) => update('joiningDate', toDateString(value))}
            />
          </Field>
          <Field id="employmentTypeId" label="Employment type" required error={errors.employmentTypeId}>
            <Select
              id="employmentTypeId"
              placeholder="Select type"
              value={form.employmentTypeId || undefined}
              options={(options?.employmentTypes || []).map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => update('employmentTypeId', asSelectString(value))}
            />
          </Field>
          <Field id="employmentStatusId" label="Employment status" required error={errors.employmentStatusId}>
            <Select
              id="employmentStatusId"
              placeholder="Select status"
              value={form.employmentStatusId || undefined}
              options={(options?.employmentStatuses || []).map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => update('employmentStatusId', asSelectString(value))}
            />
          </Field>
          <Field id="designationId" label="Designation" required error={errors.designationId}>
            <Select
              id="designationId"
              placeholder="Select designation"
              value={form.designationId || undefined}
              options={(options?.designations || []).map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => update('designationId', asSelectString(value))}
            />
          </Field>
        </FormSection>

        <FormSection
          id="organization"
          title="Organization Structure"
          description="Department and team also apply to the CRM account if one is created."
          errors={sectionErrors('organization', errors)}
        >
          <Field id="departmentId" label="Department" required error={errors.departmentId}>
            <Select
              id="departmentId"
              placeholder="Select department"
              value={form.departmentId || undefined}
              options={(options?.departments || []).map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => {
                const departmentId = asSelectString(value)
                setForm((current) => ({ ...current, departmentId, teamId: '' }))
                setErrors((current) => {
                  const next = { ...current }
                  delete next.departmentId
                  delete next.teamId
                  return next
                })
              }}
            />
          </Field>
          <Field id="teamId" label="Team" error={errors.teamId}>
            <Select
              id="teamId"
              allowClear
              disabled={!form.departmentId}
              placeholder={form.departmentId ? 'Select team' : 'Select department first'}
              value={form.teamId || undefined}
              options={teams.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => update('teamId', asSelectString(value))}
            />
          </Field>
          <Field id="reportingManagerId" label="Reporting manager" error={errors.reportingManagerId}>
            <Select
              id="reportingManagerId"
              allowClear
              placeholder="Select manager"
              value={form.reportingManagerId || undefined}
              options={managerOptions.map((item) => ({
                value: item.id,
                label: `${item.fullName} (${item.employeeCode})`,
              }))}
              onChange={(value) => update('reportingManagerId', asSelectString(value))}
            />
          </Field>
        </FormSection>

        <FormSection
          id="crm"
          title="CRM Access"
          description={
            hasExistingCrmAccount
              ? 'This employee already has a CRM login. Role permissions stay with the selected role.'
              : 'Optional login for this employee. Role permissions stay with the selected role.'
          }
          errors={sectionErrors('crm', errors)}
        >
          {hasExistingCrmAccount ? null : (
            <div className="toggle-row admin-form-span">
              <div>
                <span id="createCrmAccountLabel" className="field-label">
                  Create CRM account
                </span>
                <p>Creates a user login using the official email, department, and team above.</p>
              </div>
              <Switch
                checked={form.createCrmAccount}
                aria-labelledby="createCrmAccountLabel"
                onChange={(checked) => {
                  update('createCrmAccount', checked)
                  if (checked && !usernameTouched.current) {
                    update('username', usernameFromEmail(form.officialEmail))
                  }
                }}
              />
            </div>
          )}
          {showCrmFields ? (
            <>
              <Field id="username" label="Username" required error={errors.username}>
                <Input
                  {...fieldProps('username')}
                  value={form.username}
                  autoComplete="off"
                  onChange={(event) => {
                    usernameTouched.current = true
                    update('username', event.target.value)
                  }}
                  onBlur={() => validateField('username')}
                />
              </Field>
              <Field id="roleId" label="Role" required error={errors.roleId}>
                <Select
                  id="roleId"
                  placeholder="Select role"
                  value={form.roleId || undefined}
                  options={(options?.roles || []).map((item) => ({ value: item.id, label: item.name }))}
                  onChange={(value) => update('roleId', asSelectString(value))}
                />
              </Field>
              <Field id="userStatus" label={hasExistingCrmAccount ? 'Account status' : 'Initial account status'} required error={errors.userStatus}>
                <Select
                  id="userStatus"
                  value={form.userStatus}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'SUSPENDED', label: 'Suspended' },
                  ]}
                  onChange={(value) => update('userStatus', (asSelectString(value) || 'ACTIVE') as UserStatus)}
                />
              </Field>
              <Field id="crmDepartment" label="Department" hint="Taken from Organization Structure.">
                <Input id="crmDepartment" value={departmentName} disabled readOnly />
              </Field>
              <Field id="crmTeam" label="Team" hint="Taken from Organization Structure.">
                <Input id="crmTeam" value={teamName} disabled readOnly />
              </Field>
            </>
          ) : (
            <p className="muted admin-form-span">No CRM login will be created. You can still save the employee record.</p>
          )}
        </FormSection>

        <FormSection id="emergency" title="Emergency Contact" errors={sectionErrors('emergency', errors)}>
          <Field id="emergencyName" label="Contact name" required={emergencyStarted} error={errors.emergencyName}>
            <Input
              {...fieldProps('emergencyName')}
              value={form.emergencyName}
              onChange={(event) => update('emergencyName', event.target.value)}
              onBlur={() => validateField('emergencyName')}
            />
          </Field>
          <Field id="emergencyRelationship" label="Relationship" error={errors.emergencyRelationship}>
            <Input
              {...fieldProps('emergencyRelationship')}
              value={form.emergencyRelationship}
              onChange={(event) => update('emergencyRelationship', event.target.value)}
            />
          </Field>
          <Field id="emergencyMobile" label="Mobile" required={emergencyStarted} error={errors.emergencyMobile}>
            <Input
              {...fieldProps('emergencyMobile')}
              value={form.emergencyMobile}
              onChange={(event) => update('emergencyMobile', event.target.value)}
              onBlur={() => validateField('emergencyMobile')}
            />
          </Field>
          <Field id="emergencyAddress" label="Address" span error={errors.emergencyAddress}>
            <Input.TextArea
              {...fieldProps('emergencyAddress')}
              rows={3}
              value={form.emergencyAddress}
              onChange={(event) => update('emergencyAddress', event.target.value)}
            />
          </Field>
        </FormSection>

        <FormSection
          id="documents"
          title="Documents"
          description="Each file can be up to 5 MB."
          errors={sectionErrors('documents', errors)}
        >
          <div className="document-upload-grid admin-form-span">
            {DOCUMENT_FIELDS.map((item) => {
              const file = documents[item.key]
              const existing = existingDocuments[item.key]
              const uploading = Boolean(documentUploading[item.key])
              const hasFile = Boolean(file || existing)
              const invalid = Boolean(errors[item.key])
              return (
                <div
                  key={item.key}
                  className={`document-upload${invalid ? ' is-invalid' : ''}${hasFile ? ' has-file' : ''}${uploading ? ' is-uploading' : ''}`}
                >
                  <input
                    {...fieldProps(item.key)}
                    className="sr-only document-upload-input"
                    type="file"
                    accept={item.accept}
                    disabled={uploading || hasFile}
                    onChange={(event) => void onDocumentChange(item.key, event)}
                  />
                  {hasFile || uploading ? (
                    <div className="document-upload-card">
                      <span className="document-upload-icon" aria-hidden>
                        <HugeiconsIcon icon={item.icon} size={22} color="currentColor" strokeWidth={1.8} />
                      </span>
                      <span className="document-upload-copy">
                        <strong>{item.label}</strong>
                        <span>{uploading ? 'Uploading…' : file?.name || existing?.fileName}</span>
                      </span>
                      {uploading ? (
                        <span className="document-upload-action is-spinning" aria-hidden>
                          <Spin size="small" />
                        </span>
                      ) : (
                        <span className="document-upload-actions">
                          <button
                            type="button"
                            className="document-upload-tool"
                            aria-label={`View ${item.label}`}
                            onClick={() => void openDocumentPreview(item)}
                          >
                            <HugeiconsIcon icon={ViewIcon} size={15} color="currentColor" strokeWidth={1.8} />
                          </button>
                          <button
                            type="button"
                            className="document-upload-tool is-danger"
                            aria-label={`Delete ${item.label}`}
                            onClick={() =>
                              setDeleteTarget({
                                key: item.key,
                                label: item.label,
                                fileName: file?.name || existing?.fileName || item.label,
                                documentId: existing?.id,
                              })
                            }
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={15} color="currentColor" strokeWidth={1.8} />
                          </button>
                        </span>
                      )}
                    </div>
                  ) : (
                    <label htmlFor={item.key} className="document-upload-card">
                      <span className="document-upload-icon" aria-hidden>
                        <HugeiconsIcon icon={item.icon} size={22} color="currentColor" strokeWidth={1.8} />
                      </span>
                      <span className="document-upload-copy">
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </span>
                      <span className="document-upload-action" aria-hidden>
                        <HugeiconsIcon icon={CloudUploadIcon} size={16} color="currentColor" strokeWidth={2} />
                      </span>
                    </label>
                  )}
                  {errors[item.key] ? (
                    <span id={`${item.key}-error`} className="field-error" role="alert">
                      {errors[item.key]}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </FormSection>

        <FormSection
          id="account"
          title="Account Status"
          description={isEdit ? 'Review the record before saving changes.' : 'Review the record before saving. Nothing is created until you confirm.'}
          errors={[]}
        >
          <dl className="account-summary admin-form-span">
            <div>
              <dt>Employee</dt>
              <dd>{form.fullName.trim() || '—'}</dd>
            </div>
            <div>
              <dt>Employee ID</dt>
              <dd>{employeeCodeLabel}</dd>
            </div>
            <div>
              <dt>Employment status</dt>
              <dd>{employmentStatusName}</dd>
            </div>
            <div>
              <dt>CRM access</dt>
              <dd>
                {showCrmFields
                  ? `${hasExistingCrmAccount ? 'CRM login' : 'Create login'} · ${roleName} · ${form.userStatus === 'ACTIVE' ? 'Active' : form.userStatus === 'INACTIVE' ? 'Inactive' : 'Suspended'}`
                  : 'No CRM account'}
              </dd>
            </div>
          </dl>
          <div className="form-actions admin-form-span">
            <Button type="submit" loading={saving} disabled={saving || !options || loading || (isEdit && !employee)}>
              {isEdit ? 'Save Employee' : 'Create Employee'}
            </Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => navigate('/employees')}>
              Cancel
            </Button>
          </div>
        </FormSection>
        </form>
      </Spin>

      {preview
        ? createPortal(
            <div className="modal-backdrop" onClick={closePreview}>
              <div
                className="modal-panel document-preview-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="document-preview-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <h3 id="document-preview-title">{preview.title}</h3>
                    <p className="document-preview-name">{preview.fileName}</p>
                  </div>
                  <button type="button" className="modal-close" aria-label="Close" onClick={closePreview}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="document-preview-body">
                  {preview.loading ? (
                    <Spin />
                  ) : isImageMime(preview.mimeType) ? (
                    <img src={preview.url} alt={preview.fileName} />
                  ) : isPdfMime(preview.mimeType, preview.fileName) ? (
                    <iframe title={preview.fileName} src={preview.url} />
                  ) : (
                    <div className="document-preview-fallback">
                      <p>Preview is not available for this file type.</p>
                      <a href={preview.url} download={preview.fileName}>
                        Download {preview.fileName}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {deleteTarget
        ? createPortal(
            <div
              className="modal-backdrop"
              onClick={() => {
                if (!deletingDocument) {
                  setDeleteTarget(null)
                }
              }}
            >
              <div
                className="modal-panel status-confirm-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="document-delete-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <h3 id="document-delete-title">Delete document?</h3>
                  <button
                    type="button"
                    className="modal-close"
                    aria-label="Close"
                    disabled={deletingDocument}
                    onClick={() => setDeleteTarget(null)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <p className="status-confirm-copy">
                  Are you sure you want to delete <strong>{deleteTarget.fileName}</strong> from {deleteTarget.label}? This
                  action cannot be undone.
                </p>
                <div className="form-actions">
                  <Button loading={deletingDocument} className="ui-btn-danger" onClick={() => void confirmDeleteDocument()}>
                    Delete
                  </Button>
                  <Button type="button" variant="secondary" disabled={deletingDocument} onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {toast
        ? createPortal(
            <div className={`app-toast app-toast-${toast.type}`} role="status">
              {toast.text}
            </div>,
            document.body,
          )
        : null}

      <p className="sr-only">
        <Link to="/employees">Back to employee list</Link>
      </p>
    </div>
  )
}
