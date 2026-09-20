import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Checkbox, DatePicker, Spin, TimePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { checkLeadDuplicate, createLead, getLead, listLeadOptions, updateLead } from '../api/client'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import PageHeader from '../components/PageHeader'
import { hasPermission } from '../lib/access'
import type { AuthSession, LeadOption, LeadOptions, LeadRecord } from '../types'
import './admin.css'

type FieldErrors = Record<string, string>
type ToastState = { text: string; type: 'success' | 'error' }
type YesNo = '' | 'yes' | 'no'

type FormState = {
  fullName: string
  phoneCountryCode: string
  phoneNumber: string
  whatsappSameAsPhone: boolean
  whatsappNumber: string
  email: string
  dateOfBirth: string
  currentLocation: string
  preferredCountryId: string
  preferredDegreeId: string
  preferredCourseId: string
  preferredCourseText: string
  preferredIntakeId: string
  studyPurposeId: string
  studyPurposeOther: string
  highestQualificationId: string
  institutionName: string
  passingYear: string
  resultCgpa: string
  studyGapMonths: string
  englishTestId: string
  englishTestStatusId: string
  englishOverallScore: string
  englishTestDate: string
  estimatedBudgetId: string
  fundingSourceId: string
  financialReadinessId: string
  previouslyAppliedAbroad: YesNo
  previousVisaApplication: YesNo
  previousVisaRefusal: YesNo
  visaCountryId: string
  visaTypeId: string
  visaYear: string
  visaResult: string
  refusalCountryId: string
  refusalYear: string
  refusalReason: string
  decisionTimelineId: string
  decisionMakerId: string
  applicationReadinessId: string
  studyIntentId: string
  preferredContactMethodId: string
  preferredContactTimeId: string
  preferredContactAt: string
  sourceId: string
  campaignText: string
  remarks: string
}

const EMPTY_FORM: FormState = {
  fullName: '',
  phoneCountryCode: '+880',
  phoneNumber: '',
  whatsappSameAsPhone: false,
  whatsappNumber: '',
  email: '',
  dateOfBirth: '',
  currentLocation: '',
  preferredCountryId: '',
  preferredDegreeId: '',
  preferredCourseId: '',
  preferredCourseText: '',
  preferredIntakeId: '',
  studyPurposeId: '',
  studyPurposeOther: '',
  highestQualificationId: '',
  institutionName: '',
  passingYear: '',
  resultCgpa: '',
  studyGapMonths: '',
  englishTestId: '',
  englishTestStatusId: '',
  englishOverallScore: '',
  englishTestDate: '',
  estimatedBudgetId: '',
  fundingSourceId: '',
  financialReadinessId: '',
  previouslyAppliedAbroad: '',
  previousVisaApplication: '',
  previousVisaRefusal: '',
  visaCountryId: '',
  visaTypeId: '',
  visaYear: '',
  visaResult: '',
  refusalCountryId: '',
  refusalYear: '',
  refusalReason: '',
  decisionTimelineId: '',
  decisionMakerId: '',
  applicationReadinessId: '',
  studyIntentId: '',
  preferredContactMethodId: '',
  preferredContactTimeId: '',
  preferredContactAt: '',
  sourceId: '',
  campaignText: '',
  remarks: '',
}

const SECTION_FIELDS: Record<string, string[]> = {
  personal: ['fullName', 'phoneNumber', 'whatsappNumber', 'email', 'dateOfBirth', 'currentLocation'],
  study: ['preferredCountryId', 'preferredDegreeId', 'preferredCourseId', 'preferredIntakeId', 'studyPurposeId', 'studyPurposeOther'],
  academic: ['highestQualificationId', 'institutionName', 'passingYear', 'resultCgpa', 'studyGapMonths'],
  english: ['englishTestId', 'englishTestStatusId', 'englishOverallScore', 'englishTestDate'],
  financial: ['estimatedBudgetId', 'fundingSourceId', 'financialReadinessId'],
  visa: ['visaCountryId', 'visaTypeId', 'visaYear', 'visaResult', 'refusalCountryId', 'refusalYear', 'refusalReason'],
  intent: ['decisionTimelineId', 'decisionMakerId', 'applicationReadinessId', 'studyIntentId'],
  communication: ['preferredContactMethodId', 'preferredContactTimeId', 'preferredContactAt'],
  lead: ['sourceId', 'campaignText', 'remarks'],
}

const COUNTRY_CODES = [
  { value: '+880', label: '+880 BD' },
  { value: '+91', label: '+91 IN' },
  { value: '+1', label: '+1 US/CA' },
  { value: '+44', label: '+44 UK' },
  { value: '+61', label: '+61 AU' },
  { value: '+971', label: '+971 AE' },
]

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidNationalNumber(value: string) {
  return /^[0-9]{7,15}$/.test(value.replace(/\D/g, ''))
}

function titleCaseName(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function yesNo(value: boolean | null | undefined): YesNo {
  if (value === true) {
    return 'yes'
  }
  if (value === false) {
    return 'no'
  }
  return ''
}

function optionLabel(item: LeadOption) {
  return item.name
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
  locked,
  children,
}: {
  id: string
  title: string
  description?: string
  errors: string[]
  locked?: boolean
  children: ReactNode
}) {
  return (
    <section id={id} className={`admin-card form-section${locked ? ' is-locked' : ''}`} aria-labelledby={`${id}-title`}>
      <header className="form-section-header">
        <h3 id={`${id}-title`}>{title}</h3>
        {description ? <p>{description}</p> : null}
        {locked ? <p>Qualification fields are read-only for your role.</p> : null}
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

function selectOptions(items: LeadOption[]) {
  return items.map((item) => ({ value: item.id, label: optionLabel(item) }))
}

function findOption(items: LeadOption[], id: string) {
  return items.find((item) => item.id === id)
}

function formFromLead(lead: LeadRecord): FormState {
  const national = lead.phoneNumber || lead.phoneE164.replace(lead.phoneCountryCode.replace(/\s/g, ''), '').replace(/^\+/, '')
  return {
    ...EMPTY_FORM,
    fullName: lead.fullName || '',
    phoneCountryCode: lead.phoneCountryCode || '+880',
    phoneNumber: national,
    whatsappSameAsPhone: lead.whatsappSameAsPhone,
    whatsappNumber: lead.whatsappSameAsPhone ? national : (lead.whatsappE164 || '').replace(/^\+\d{1,3}/, ''),
    email: lead.email || '',
    dateOfBirth: lead.dateOfBirth || '',
    currentLocation: lead.currentLocation || '',
    preferredCountryId: lead.preferredCountry?.id || '',
    preferredDegreeId: lead.preferredDegree?.id || '',
    preferredCourseId: lead.preferredCourse?.id || '',
    preferredCourseText: lead.preferredCourseText || '',
    preferredIntakeId: lead.preferredIntake?.id || '',
    studyPurposeId: lead.studyPurpose?.id || '',
    studyPurposeOther: lead.studyPurposeOther || '',
    highestQualificationId: lead.highestQualification?.id || '',
    institutionName: lead.institutionName || '',
    passingYear: lead.passingYear != null ? String(lead.passingYear) : '',
    resultCgpa: lead.resultCgpa || '',
    studyGapMonths: lead.studyGapMonths != null ? String(lead.studyGapMonths) : '',
    englishTestId: lead.englishTest?.id || '',
    englishTestStatusId: lead.englishTestStatus?.id || '',
    englishOverallScore: lead.englishOverallScore != null ? String(lead.englishOverallScore) : '',
    englishTestDate: lead.englishTestDate || '',
    estimatedBudgetId: lead.estimatedBudget?.id || '',
    fundingSourceId: lead.fundingSource?.id || '',
    financialReadinessId: lead.financialReadiness?.id || '',
    previouslyAppliedAbroad: yesNo(lead.previouslyAppliedAbroad),
    previousVisaApplication: yesNo(lead.previousVisaApplication),
    previousVisaRefusal: yesNo(lead.previousVisaRefusal),
    visaCountryId: lead.visaApplication?.previousCountry?.id || '',
    visaTypeId: lead.visaApplication?.visaType?.id || '',
    visaYear: lead.visaApplication?.applicationYear != null ? String(lead.visaApplication.applicationYear) : '',
    visaResult: lead.visaApplication?.applicationResult || '',
    refusalCountryId: lead.visaRefusal?.refusalCountry?.id || '',
    refusalYear: lead.visaRefusal?.refusalYear != null ? String(lead.visaRefusal.refusalYear) : '',
    refusalReason: lead.visaRefusal?.refusalReason || '',
    decisionTimelineId: lead.decisionTimeline?.id || '',
    decisionMakerId: lead.decisionMaker?.id || '',
    applicationReadinessId: lead.applicationReadiness?.id || '',
    studyIntentId: lead.studyIntent?.id || '',
    preferredContactMethodId: lead.preferredContactMethod?.id || '',
    preferredContactTimeId: lead.preferredContactTime?.id || '',
    preferredContactAt: lead.preferredContactAt || '',
    sourceId: lead.source?.id || '',
    campaignText: lead.campaignText || '',
    remarks: lead.remarks || '',
  }
}

function validateForm(form: FormState, options: LeadOptions | null): FieldErrors {
  const errors: FieldErrors = {}
  if (form.fullName.trim().length < 2 || form.fullName.trim().length > 100) {
    errors.fullName = 'Full name must be 2–100 characters.'
  }
  if (!isValidNationalNumber(form.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid mobile number.'
  }
  if (!form.whatsappSameAsPhone && form.whatsappNumber && !isValidNationalNumber(form.whatsappNumber)) {
    errors.whatsappNumber = 'Please enter a valid WhatsApp number.'
  }
  if (form.email && !isValidEmail(form.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!form.preferredCountryId) {
    errors.preferredCountryId = 'Preferred country is required.'
  }
  if (!form.sourceId) {
    errors.sourceId = 'Lead source is required.'
  }
  if (form.remarks.length > 1000) {
    errors.remarks = 'Remarks cannot exceed 1000 characters.'
  }
  const purpose = findOption(options?.studyPurposes || [], form.studyPurposeId)
  if (purpose?.behaviorKey === 'other' && !form.studyPurposeOther.trim()) {
    errors.studyPurposeOther = 'Please specify the study purpose.'
  }
  if (form.institutionName && (form.institutionName.trim().length < 2 || form.institutionName.trim().length > 200)) {
    errors.institutionName = 'Institution name must be 2–200 characters.'
  }
  return errors
}

function sectionErrors(sectionId: string, errors: FieldErrors) {
  return (SECTION_FIELDS[sectionId] || []).map((key) => errors[key]).filter(Boolean)
}

function toPayload(form: FormState) {
  const yes = (value: YesNo) => (value === 'yes' ? true : value === 'no' ? false : null)
  return {
    fullName: titleCaseName(form.fullName),
    phoneCountryCode: form.phoneCountryCode,
    phoneNumber: form.phoneNumber,
    whatsappSameAsPhone: form.whatsappSameAsPhone,
    whatsappNumber: form.whatsappSameAsPhone ? form.phoneNumber : form.whatsappNumber,
    email: form.email.trim().toLowerCase(),
    dateOfBirth: form.dateOfBirth || null,
    currentLocation: form.currentLocation || null,
    preferredCountryId: form.preferredCountryId,
    preferredDegreeId: form.preferredDegreeId || null,
    preferredCourseId: form.preferredCourseId || null,
    preferredCourseText: form.preferredCourseText || null,
    preferredIntakeId: form.preferredIntakeId || null,
    studyPurposeId: form.studyPurposeId || null,
    studyPurposeOther: form.studyPurposeOther || null,
    highestQualificationId: form.highestQualificationId || null,
    institutionName: form.institutionName || null,
    passingYear: form.passingYear ? Number(form.passingYear) : null,
    resultCgpa: form.resultCgpa || null,
    studyGapMonths: form.studyGapMonths === '' ? null : Number(form.studyGapMonths),
    englishTestId: form.englishTestId || null,
    englishTestStatusId: form.englishTestStatusId || null,
    englishOverallScore: form.englishOverallScore === '' ? null : Number(form.englishOverallScore),
    englishTestDate: form.englishTestDate || null,
    estimatedBudgetId: form.estimatedBudgetId || null,
    fundingSourceId: form.fundingSourceId || null,
    financialReadinessId: form.financialReadinessId || null,
    previouslyAppliedAbroad: yes(form.previouslyAppliedAbroad),
    previousVisaApplication: yes(form.previousVisaApplication),
    previousVisaRefusal: yes(form.previousVisaRefusal),
    visaApplication:
      form.previousVisaApplication === 'yes'
        ? {
            previousCountryId: form.visaCountryId || null,
            visaTypeId: form.visaTypeId || null,
            applicationYear: form.visaYear ? Number(form.visaYear) : null,
            applicationResult: form.visaResult || null,
          }
        : null,
    visaRefusal:
      form.previousVisaRefusal === 'yes'
        ? {
            refusalCountryId: form.refusalCountryId || null,
            refusalYear: form.refusalYear ? Number(form.refusalYear) : null,
            refusalReason: form.refusalReason || null,
          }
        : null,
    decisionTimelineId: form.decisionTimelineId || null,
    decisionMakerId: form.decisionMakerId || null,
    applicationReadinessId: form.applicationReadinessId || null,
    studyIntentId: form.studyIntentId || null,
    preferredContactMethodId: form.preferredContactMethodId || null,
    preferredContactTimeId: form.preferredContactTimeId || null,
    preferredContactAt: form.preferredContactAt || null,
    sourceId: form.sourceId,
    campaignText: form.campaignText || null,
    remarks: form.remarks || null,
  }
}

const EMPTY_OPTIONS: LeadOptions = {
  countries: [],
  degrees: [],
  courses: [],
  intakes: [],
  studyPurposes: [],
  qualifications: [],
  englishTests: [],
  englishTestStatuses: [],
  budgets: [],
  fundingSources: [],
  financialReadiness: [],
  decisionTimelines: [],
  decisionMakers: [],
  applicationReadiness: [],
  studyIntents: [],
  visaTypes: [],
  contactMethods: [],
  contactTimes: [],
  sources: [],
  statuses: [],
  countryTeams: [],
}

export default function LeadCreate() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const canCreate = hasPermission(auth, 'lead:create')
  const canEditBasic = hasPermission(auth, 'lead:edit')
  const canQualify = hasPermission(auth, 'lead:qualify')
  const canOpen = isEdit ? canEditBasic || canQualify || hasPermission(auth, 'lead:view') : canCreate
  const readOnly = isEdit && !canEditBasic && !canQualify
  const qualifyLocked = isEdit && !canQualify
  const basicLocked = isEdit && !canEditBasic

  const [options, setOptions] = useState<LeadOptions>(EMPTY_OPTIONS)
  const [lead, setLead] = useState<LeadRecord | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [duplicate, setDuplicate] = useState<{ id: string; leadCode: string; fullName: string; visible: boolean } | null>(null)
  const submitting = useRef(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const followUpAfterSave = searchParams.get('next') === 'follow-up'

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 30 }, (_, index) => {
      const year = String(current + 1 - index)
      return { value: year, label: year }
    })
  }, [])

  const assignedTeam = options.countryTeams.find((item) => item.countryId === form.preferredCountryId)?.team
  const studyPurpose = findOption(options.studyPurposes, form.studyPurposeId)
  const englishTest = findOption(options.englishTests, form.englishTestId)
  const englishStatus = findOption(options.englishTestStatuses, form.englishTestStatusId)
  const contactTime = findOption(options.contactTimes, form.preferredContactTimeId)
  const showEnglishScore = englishTest?.behaviorKey !== 'none' && englishStatus?.behaviorKey === 'taken'
  const showPurposeOther = studyPurpose?.behaviorKey === 'other'
  const showSpecificTime = contactTime?.behaviorKey === 'specific'
  const courseOptions = useMemo(() => {
    if (!form.preferredCountryId) {
      return options.courses
    }
    const countryCourses = options.courses.filter((item) => !item.parentId || item.parentId === form.preferredCountryId)
    return countryCourses.length > 0 ? countryCourses : options.courses
  }, [form.preferredCountryId, options.courses])

  function showToast(text: string, type: ToastState['type'] = 'success') {
    setToast({ text, type })
    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    toastTimer.current = setTimeout(() => setToast(null), 4000)
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

  useEffect(() => {
    let active = true
    async function load() {
      const [optionsResult, leadResult] = await Promise.all([
        listLeadOptions(),
        id ? getLead(id) : Promise.resolve(null),
      ])
      if (!active) {
        return
      }
      if (optionsResult.ok) {
        setOptions(optionsResult.data)
        if (!id) {
          const manual = optionsResult.data.sources.find((item) => item.code === 'MANUAL')
          if (manual) {
            setForm((current) => (current.sourceId ? current : { ...current, sourceId: manual.id }))
          }
        }
      }
      if (leadResult && !leadResult.ok) {
        setFormError(leadResult.data?.error || 'Unable to load this lead.')
      }
      if (leadResult?.ok) {
        setLead(leadResult.data.lead)
        setForm(formFromLead(leadResult.data.lead))
      }
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }
    }
  }, [])

  async function checkDuplicate() {
    if (!isValidNationalNumber(form.phoneNumber)) {
      setDuplicate(null)
      return
    }
    const result = await checkLeadDuplicate(form.phoneCountryCode, form.phoneNumber, id)
    if (result.ok) {
      setDuplicate(result.data.lead)
      if (result.data.lead) {
        setErrors((current) => ({ ...current, phoneNumber: 'A lead with this phone number already exists.' }))
      }
    }
  }

  async function onSubmit(event: FormEvent, addFollowUp = false) {
    event.preventDefault()
    if (!canOpen || readOnly || saving || submitting.current) {
      return
    }
    if (isEdit && !canEditBasic && !canQualify) {
      return
    }

    const nextErrors = validateForm(form, options)
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean) || duplicate) {
      const first = Object.keys(nextErrors)[0] || 'phoneNumber'
      const section = Object.entries(SECTION_FIELDS).find(([, keys]) => keys.includes(first))?.[0]
      document.getElementById(section || 'personal')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setFormError(duplicate ? 'A lead with this phone number already exists.' : 'Please correct the highlighted fields.')
      return
    }

    submitting.current = true
    setSaving(true)
    setFormError('')
    const payload = toPayload(form)
    const result = isEdit && id ? await updateLead(id, payload) : await createLead(payload)
    submitting.current = false
    setSaving(false)
    if (!result.ok) {
      setErrors(result.data?.fields || {})
      const message = result.data?.error || (isEdit ? 'Unable to update lead.' : 'Unable to create lead.')
      setFormError(message)
      showToast(message, 'error')
      return
    }

    const saved = result.data.lead
    const followUp = addFollowUp || followUpAfterSave
    navigate(followUp ? `/follow-ups?leadId=${saved.id}` : '/leads', {
      replace: true,
      state: {
        toast: followUp
          ? `Lead ${saved.leadCode} saved. Add a follow-up next.`
          : `Lead ${saved.leadCode} ${isEdit ? 'updated' : 'created'} successfully.`,
      },
    })
  }

  if (!canOpen) {
    return (
      <div className="admin-page">
        <PageHeader
          title={isEdit ? 'Lead details' : 'Create New Lead'}
          description="You do not have permission to open this screen."
        />
      </div>
    )
  }

  const pageTitle = isEdit ? `Lead ${lead?.leadCode || ''}`.trim() : 'Create New Lead'
  const pageDescription = isEdit
    ? 'Update contact details and progressively enrich the qualification profile.'
    : 'Capture the inquiry now. Qualification fields can stay empty and be completed later.'

  return (
    <div className="admin-page employee-create lead-create">
      <PageHeader title={pageTitle} description={pageDescription}>
        {lead?.status ? <span className="lead-status-chip">{lead.status.name}</span> : null}
        <Button variant="secondary" onClick={() => navigate('/leads')}>
          Back to Leads
        </Button>
      </PageHeader>

      {formError ? <p className="admin-banner">{formError}</p> : null}
      {toast ? <p className={`admin-banner ${toast.type === 'error' ? '' : 'is-success'}`}>{toast.text}</p> : null}

      <Spin spinning={loading}>
        <form className="employee-create-form" onSubmit={(event) => void onSubmit(event)} noValidate>
          <FormSection id="personal" title="Personal Information" errors={sectionErrors('personal', errors)}>
            <Field id="fullName" label="Full name" required error={errors.fullName}>
              <Input
                id="fullName"
                value={form.fullName}
                disabled={basicLocked || readOnly}
                autoComplete="name"
                onChange={(event) => update('fullName', event.target.value)}
                onBlur={() => update('fullName', titleCaseName(form.fullName))}
              />
            </Field>
            <Field id="phoneNumber" label="Phone number" required error={errors.phoneNumber} hint={duplicate ? `${duplicate.fullName} (${duplicate.leadCode}) already uses this number.` : undefined}>
              <div className="phone-row">
                <Select
                  id="phoneCountryCode"
                  value={form.phoneCountryCode}
                  disabled={basicLocked || readOnly}
                  options={COUNTRY_CODES}
                  onChange={(value) => update('phoneCountryCode', asSelectString(value) || '+880')}
                />
                <Input
                  id="phoneNumber"
                  value={form.phoneNumber}
                  disabled={basicLocked || readOnly}
                  inputMode="tel"
                  autoComplete="tel"
                  onChange={(event) => {
                    update('phoneNumber', event.target.value)
                    setDuplicate(null)
                  }}
                  onBlur={() => void checkDuplicate()}
                />
              </div>
            </Field>
            <Field id="whatsappNumber" label="WhatsApp number" error={errors.whatsappNumber}>
              <div className="whatsapp-row">
                <Checkbox
                  checked={form.whatsappSameAsPhone}
                  disabled={basicLocked || readOnly}
                  onChange={(event) => {
                    update('whatsappSameAsPhone', event.target.checked)
                    if (event.target.checked) {
                      update('whatsappNumber', form.phoneNumber)
                    }
                  }}
                >
                  Same as phone
                </Checkbox>
                <Input
                  id="whatsappNumber"
                  value={form.whatsappSameAsPhone ? form.phoneNumber : form.whatsappNumber}
                  disabled={basicLocked || readOnly || form.whatsappSameAsPhone}
                  inputMode="tel"
                  onChange={(event) => update('whatsappNumber', event.target.value)}
                />
              </div>
            </Field>
            <Field id="email" label="Email" error={errors.email}>
              <Input
                id="email"
                type="email"
                value={form.email}
                disabled={basicLocked || readOnly}
                autoComplete="email"
                onChange={(event) => update('email', event.target.value.toLowerCase())}
              />
            </Field>
            <Field id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth}>
              <DatePicker
                id="dateOfBirth"
                allowClear
                disabled={basicLocked || readOnly}
                value={toDayjs(form.dateOfBirth)}
                disabledDate={(current) => current.isAfter(dayjs(), 'day')}
                onChange={(value) => update('dateOfBirth', toDateString(value))}
              />
            </Field>
            <Field id="currentLocation" label="Current location" error={errors.currentLocation}>
              <Input
                id="currentLocation"
                value={form.currentLocation}
                disabled={basicLocked || readOnly}
                onChange={(event) => update('currentLocation', event.target.value)}
              />
            </Field>
          </FormSection>

          <FormSection
            id="study"
            title="Study Preference"
            description="Preferred country is required so the country team can be assigned automatically."
            errors={sectionErrors('study', errors)}
            locked={qualifyLocked && !basicLocked ? false : qualifyLocked}
          >
            <Field id="preferredCountryId" label="Preferred country" required error={errors.preferredCountryId}>
              <Select
                id="preferredCountryId"
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Search country"
                disabled={basicLocked || readOnly}
                value={form.preferredCountryId || undefined}
                options={selectOptions(options.countries)}
                onChange={(value) => update('preferredCountryId', asSelectString(value))}
              />
            </Field>
            <Field id="preferredDegreeId" label="Preferred degree / level" error={errors.preferredDegreeId}>
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Search degree"
                disabled={qualifyLocked || readOnly}
                value={form.preferredDegreeId || undefined}
                options={selectOptions(options.degrees)}
                onChange={(value) => update('preferredDegreeId', asSelectString(value))}
              />
            </Field>
            <Field id="preferredCourseId" label="Preferred course / subject" error={errors.preferredCourseId}>
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Search course"
                disabled={qualifyLocked || readOnly}
                value={form.preferredCourseId || undefined}
                options={selectOptions(courseOptions)}
                onChange={(value) => update('preferredCourseId', asSelectString(value))}
              />
            </Field>
            <Field id="preferredIntakeId" label="Preferred intake" error={errors.preferredIntakeId}>
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Future intakes only"
                disabled={qualifyLocked || readOnly}
                value={form.preferredIntakeId || undefined}
                options={selectOptions(options.intakes)}
                onChange={(value) => update('preferredIntakeId', asSelectString(value))}
              />
            </Field>
            <Field id="studyPurposeId" label="Study purpose" error={errors.studyPurposeId}>
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Select purpose"
                disabled={qualifyLocked || readOnly}
                value={form.studyPurposeId || undefined}
                options={selectOptions(options.studyPurposes)}
                onChange={(value) => update('studyPurposeId', asSelectString(value))}
              />
            </Field>
            {showPurposeOther ? (
              <Field id="studyPurposeOther" label="Please specify" required error={errors.studyPurposeOther}>
                <Input
                  id="studyPurposeOther"
                  value={form.studyPurposeOther}
                  disabled={qualifyLocked || readOnly}
                  onChange={(event) => update('studyPurposeOther', event.target.value)}
                />
              </Field>
            ) : null}
          </FormSection>

          <FormSection id="academic" title="Academic Information" errors={sectionErrors('academic', errors)} locked={qualifyLocked}>
            <Field id="highestQualificationId" label="Highest qualification">
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Search qualification"
                disabled={qualifyLocked || readOnly}
                value={form.highestQualificationId || undefined}
                options={selectOptions(options.qualifications)}
                onChange={(value) => update('highestQualificationId', asSelectString(value))}
              />
            </Field>
            <Field id="institutionName" label="Institution name" error={errors.institutionName}>
              <Input
                id="institutionName"
                value={form.institutionName}
                disabled={qualifyLocked || readOnly}
                onChange={(event) => update('institutionName', event.target.value)}
              />
            </Field>
            <Field id="passingYear" label="Passing year">
              <Select
                allowClear
                placeholder="Select year"
                disabled={qualifyLocked || readOnly}
                value={form.passingYear || undefined}
                options={yearOptions}
                onChange={(value) => update('passingYear', asSelectString(value))}
              />
            </Field>
            <Field id="resultCgpa" label="Result / CGPA">
              <Input
                id="resultCgpa"
                value={form.resultCgpa}
                disabled={qualifyLocked || readOnly}
                onChange={(event) => update('resultCgpa', event.target.value)}
              />
            </Field>
            <Field id="studyGapMonths" label="Study gap (months)">
              <Input
                id="studyGapMonths"
                inputMode="numeric"
                value={form.studyGapMonths}
                disabled={qualifyLocked || readOnly}
                onChange={(event) => update('studyGapMonths', event.target.value.replace(/[^\d]/g, ''))}
              />
            </Field>
          </FormSection>

          <FormSection id="english" title="English Proficiency" errors={sectionErrors('english', errors)} locked={qualifyLocked}>
            <Field id="englishTestId" label="English test">
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Select test"
                disabled={qualifyLocked || readOnly}
                value={form.englishTestId || undefined}
                options={selectOptions(options.englishTests)}
                onChange={(value) => update('englishTestId', asSelectString(value))}
              />
            </Field>
            <Field id="englishTestStatusId" label="Test status">
              <Select
                allowClear
                placeholder="Select status"
                disabled={qualifyLocked || readOnly}
                value={form.englishTestStatusId || undefined}
                options={selectOptions(options.englishTestStatuses)}
                onChange={(value) => update('englishTestStatusId', asSelectString(value))}
              />
            </Field>
            {showEnglishScore ? (
              <>
                <Field id="englishOverallScore" label="Overall score">
                  <Input
                    id="englishOverallScore"
                    inputMode="decimal"
                    value={form.englishOverallScore}
                    disabled={qualifyLocked || readOnly}
                    onChange={(event) => update('englishOverallScore', event.target.value)}
                  />
                </Field>
                <Field id="englishTestDate" label="Test date">
                  <DatePicker
                    allowClear
                    disabled={qualifyLocked || readOnly}
                    value={toDayjs(form.englishTestDate)}
                    disabledDate={(current) => current.isAfter(dayjs(), 'day')}
                    onChange={(value) => update('englishTestDate', toDateString(value))}
                  />
                </Field>
              </>
            ) : null}
          </FormSection>

          <FormSection id="financial" title="Financial Information" errors={sectionErrors('financial', errors)} locked={qualifyLocked}>
            <Field id="estimatedBudgetId" label="Estimated budget">
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Select budget"
                disabled={qualifyLocked || readOnly}
                value={form.estimatedBudgetId || undefined}
                options={selectOptions(options.budgets)}
                onChange={(value) => update('estimatedBudgetId', asSelectString(value))}
              />
            </Field>
            <Field id="fundingSourceId" label="Funding source">
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder="Select source"
                disabled={qualifyLocked || readOnly}
                value={form.fundingSourceId || undefined}
                options={selectOptions(options.fundingSources)}
                onChange={(value) => update('fundingSourceId', asSelectString(value))}
              />
            </Field>
            <Field id="financialReadinessId" label="Financial readiness">
              <Select
                allowClear
                placeholder="Select readiness"
                disabled={qualifyLocked || readOnly}
                value={form.financialReadinessId || undefined}
                options={selectOptions(options.financialReadiness)}
                onChange={(value) => update('financialReadinessId', asSelectString(value))}
              />
            </Field>
          </FormSection>

          <FormSection id="visa" title="Visa & Application History" errors={sectionErrors('visa', errors)} locked={qualifyLocked}>
            <Field id="previouslyAppliedAbroad" label="Previously applied abroad?">
              <Select
                allowClear
                placeholder="Select"
                disabled={qualifyLocked || readOnly}
                value={form.previouslyAppliedAbroad || undefined}
                options={YES_NO}
                onChange={(value) => update('previouslyAppliedAbroad', asSelectString(value) as YesNo)}
              />
            </Field>
            <Field id="previousVisaApplication" label="Previous visa application?">
              <Select
                allowClear
                placeholder="Select"
                disabled={qualifyLocked || readOnly}
                value={form.previousVisaApplication || undefined}
                options={YES_NO}
                onChange={(value) => update('previousVisaApplication', asSelectString(value) as YesNo)}
              />
            </Field>
            <Field id="previousVisaRefusal" label="Previous visa refusal?">
              <Select
                allowClear
                placeholder="Select"
                disabled={qualifyLocked || readOnly}
                value={form.previousVisaRefusal || undefined}
                options={YES_NO}
                onChange={(value) => update('previousVisaRefusal', asSelectString(value) as YesNo)}
              />
            </Field>
            {form.previousVisaApplication === 'yes' ? (
              <>
                <Field id="visaCountryId" label="Previous country">
                  <Select
                    showSearch
                    optionFilterProp="label"
                    allowClear
                    disabled={qualifyLocked || readOnly}
                    value={form.visaCountryId || undefined}
                    options={selectOptions(options.countries)}
                    onChange={(value) => update('visaCountryId', asSelectString(value))}
                  />
                </Field>
                <Field id="visaTypeId" label="Visa type">
                  <Select
                    allowClear
                    disabled={qualifyLocked || readOnly}
                    value={form.visaTypeId || undefined}
                    options={selectOptions(options.visaTypes)}
                    onChange={(value) => update('visaTypeId', asSelectString(value))}
                  />
                </Field>
                <Field id="visaYear" label="Application year">
                  <Select
                    allowClear
                    disabled={qualifyLocked || readOnly}
                    value={form.visaYear || undefined}
                    options={yearOptions}
                    onChange={(value) => update('visaYear', asSelectString(value))}
                  />
                </Field>
                <Field id="visaResult" label="Application result">
                  <Input
                    id="visaResult"
                    value={form.visaResult}
                    disabled={qualifyLocked || readOnly}
                    onChange={(event) => update('visaResult', event.target.value)}
                  />
                </Field>
              </>
            ) : null}
            {form.previousVisaRefusal === 'yes' ? (
              <>
                <Field id="refusalCountryId" label="Refusal country">
                  <Select
                    showSearch
                    optionFilterProp="label"
                    allowClear
                    disabled={qualifyLocked || readOnly}
                    value={form.refusalCountryId || undefined}
                    options={selectOptions(options.countries)}
                    onChange={(value) => update('refusalCountryId', asSelectString(value))}
                  />
                </Field>
                <Field id="refusalYear" label="Refusal year">
                  <Select
                    allowClear
                    disabled={qualifyLocked || readOnly}
                    value={form.refusalYear || undefined}
                    options={yearOptions}
                    onChange={(value) => update('refusalYear', asSelectString(value))}
                  />
                </Field>
                <Field id="refusalReason" label="Refusal reason" hint="Optional if details are unavailable.">
                  <Input
                    id="refusalReason"
                    value={form.refusalReason}
                    disabled={qualifyLocked || readOnly}
                    onChange={(event) => update('refusalReason', event.target.value)}
                  />
                </Field>
              </>
            ) : null}
          </FormSection>

          <FormSection id="intent" title="Lead Intent" errors={sectionErrors('intent', errors)} locked={qualifyLocked}>
            <Field id="decisionTimelineId" label="Decision timeline">
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                disabled={qualifyLocked || readOnly}
                value={form.decisionTimelineId || undefined}
                options={selectOptions(options.decisionTimelines)}
                onChange={(value) => update('decisionTimelineId', asSelectString(value))}
              />
            </Field>
            <Field id="decisionMakerId" label="Decision maker">
              <Select
                showSearch
                optionFilterProp="label"
                allowClear
                disabled={qualifyLocked || readOnly}
                value={form.decisionMakerId || undefined}
                options={selectOptions(options.decisionMakers)}
                onChange={(value) => update('decisionMakerId', asSelectString(value))}
              />
            </Field>
            <Field id="applicationReadinessId" label="Application readiness">
              <Select
                allowClear
                disabled={qualifyLocked || readOnly}
                value={form.applicationReadinessId || undefined}
                options={selectOptions(options.applicationReadiness)}
                onChange={(value) => update('applicationReadinessId', asSelectString(value))}
              />
            </Field>
            <Field id="studyIntentId" label="Study intent">
              <Select
                allowClear
                disabled={qualifyLocked || readOnly}
                value={form.studyIntentId || undefined}
                options={selectOptions(options.studyIntents)}
                onChange={(value) => update('studyIntentId', asSelectString(value))}
              />
            </Field>
          </FormSection>

          <FormSection id="communication" title="Communication Preference" errors={sectionErrors('communication', errors)}>
            <Field id="preferredContactMethodId" label="Preferred contact method">
              <Select
                allowClear
                disabled={basicLocked || readOnly}
                value={form.preferredContactMethodId || undefined}
                options={selectOptions(options.contactMethods)}
                onChange={(value) => update('preferredContactMethodId', asSelectString(value))}
              />
            </Field>
            <Field id="preferredContactTimeId" label="Preferred contact time">
              <Select
                allowClear
                disabled={basicLocked || readOnly}
                value={form.preferredContactTimeId || undefined}
                options={selectOptions(options.contactTimes)}
                onChange={(value) => update('preferredContactTimeId', asSelectString(value))}
              />
            </Field>
            {showSpecificTime ? (
              <Field id="preferredContactAt" label="Specific time">
                <TimePicker
                  allowClear
                  format="HH:mm"
                  disabled={basicLocked || readOnly}
                  value={form.preferredContactAt ? dayjs(form.preferredContactAt, 'HH:mm') : null}
                  onChange={(value) => update('preferredContactAt', value ? value.format('HH:mm') : '')}
                />
              </Field>
            ) : null}
          </FormSection>

          <FormSection id="lead" title="Lead Information" errors={sectionErrors('lead', errors)}>
            <Field id="sourceId" label="Lead source" required error={errors.sourceId}>
              <Select
                showSearch
                optionFilterProp="label"
                disabled={basicLocked || readOnly}
                value={form.sourceId || undefined}
                options={selectOptions(options.sources)}
                onChange={(value) => update('sourceId', asSelectString(value))}
              />
            </Field>
            <Field id="campaignText" label="Campaign">
              <Input
                id="campaignText"
                value={form.campaignText}
                disabled={basicLocked || readOnly}
                onChange={(event) => update('campaignText', event.target.value)}
              />
            </Field>
            <Field id="assignedTeam" label="Assigned country team" hint="Auto-selected from the preferred country.">
              <Input id="assignedTeam" value={assignedTeam?.name || lead?.assignedTeam?.name || 'Assigned on save'} disabled readOnly />
            </Field>
            <Field id="remarks" label="Remarks" span error={errors.remarks}>
              <Input.TextArea
                id="remarks"
                autoSize={{ minRows: 3, maxRows: 8 }}
                maxLength={1000}
                value={form.remarks}
                disabled={basicLocked || readOnly}
                onChange={(event) => update('remarks', event.target.value)}
              />
            </Field>
          </FormSection>

          {readOnly ? null : (
            <div className="lead-form-actions">
              <Button variant="secondary" onClick={() => navigate('/leads')}>
                Cancel
              </Button>
              {!isEdit ? (
                <Button variant="secondary" loading={saving} onClick={(event) => void onSubmit(event, true)}>
                  Save & Add Follow-up
                </Button>
              ) : null}
              <Button type="submit" loading={saving}>
                {isEdit ? 'Save changes' : 'Save Lead'}
              </Button>
            </div>
          )}
        </form>
      </Spin>
    </div>
  )
}
