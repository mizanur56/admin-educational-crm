import {
  adminCard,
  adminFilters,
  adminForm,
  adminFormFields,
  adminFormSpan,
  adminPage,
  adminTable,
  appToastClass,
  fieldHint,
  fieldLabelClass,
  formActions,
  modalBackdrop,
  modalClose,
  modalHeader,
  modalPanel,
  muted,
  photoCameraBadge,
  photoPicker,
  photoPickerButton,
  photoPreviewFrame,
  photoUpload,
  rowActions,
  scopeGrid,
  scopeSkeleton,
  sessionRow,
  statusConfirmCopy,
  statusConfirmMeta,
  statusConfirmPanel,
  tableWrap,
  userStatusPillClass,
  userViewActivity,
  userViewActivityIcon,
  userViewActivityIconAdd,
  userViewNavBtn,
  userViewNavBtnActive,
  userViewNavBtnIdle,
  userViewPanel,
  userViewScopeBase,
  userViewScopeTone,
  adminTableRowStatusUpdated,
} from '../../styles/admin'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext, useLocation } from 'react-router-dom'
import {
  adminPasswordReset,
  createUser,
  forceLogoutUser,
  getUser,
  listDepartments,
  listRoles,
  listUserActivity,
  listUserSessions,
  listUsers,
  revokeUserSession,
  setUserScopes,
  updateUser,
  updateUserStatus,
  type UserPayload,
} from '../../api/client'
import { patchCurrentAuthUser } from '../../lib/auth-session'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon,
  AnalyticsUpIcon,
  Building03Icon,
  Calendar03Icon,
  Camera01Icon,
  Cancel01Icon,
  ChartIncreaseIcon,
  Clock01Icon,
  Contact01Icon,
  DashboardSquare01Icon,
  DocumentAttachmentIcon,
  File01Icon,
  InformationCircleIcon,
  LicenseIcon,
  PauseIcon,
  PencilEdit02Icon,
  Shield01Icon,
  Task01Icon,
  UserBlock01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { Skeleton, Spin, Switch } from 'antd'
import Button from '../../components/Button'
import RowActionMenu, { type RowActionItem } from '../../components/RowActionMenu'
import Input from '../../components/Input'
import Select from '../../components/Select'
import PageHeader from '../../components/PageHeader'
import PageMeta from '../../components/PageMeta'
import { hasPermission } from '../../lib/access'
import { readUrlSearchQuery } from '../../lib/url-search'
import type {
  AdminUser,
  AuthSession,
  DataScopeLevel,
  Department,
  RoleRecord,
  ScopeMap,
  UserActivity,
  UserSession,
  UserStatus,
} from '../../types'
type FormMode = 'create' | 'view' | 'edit'
type ViewTab = 'overview' | 'permissions' | 'leads' | 'applications' | 'documents' | 'performance'
type ToastState = { text: string; type: 'success' | 'error' }

function ActionIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.5} />
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className={fieldLabelClass(required)}>{children}</span>
  )
}

type UserForm = {
  fullName: string
  email: string
  mobile: string
  username: string
  password: string
  roleId: string
  departmentId: string
  teamId: string
  status: UserStatus
}

const EMPTY_FORM: UserForm = {
  fullName: '',
  email: '',
  mobile: '',
  username: '',
  password: '',
  roleId: '',
  departmentId: '',
  teamId: '',
  status: 'ACTIVE',
}

const DEFAULT_SCOPES: ScopeMap = { lead: 'OWN', document: 'OWN', employee_performance: 'OWN' }
const SCOPE_RESOURCES = ['lead', 'document', 'employee_performance'] as const
const VIEW_TABS: Array<{ id: ViewTab; label: string; icon: IconSvgElement }> = [
  { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon },
  { id: 'permissions', label: 'Permissions', icon: Shield01Icon },
  { id: 'leads', label: 'Assigned Leads', icon: UserGroupIcon },
  { id: 'applications', label: 'Applications', icon: LicenseIcon },
  { id: 'documents', label: 'Documents', icon: File01Icon },
  { id: 'performance', label: 'Performance', icon: AnalyticsUpIcon },
]

function formFromUser(user: AdminUser): UserForm {
  return {
    fullName: user.fullName || '',
    email: user.email || '',
    mobile: user.mobile || '',
    username: user.username || '',
    password: '',
    roleId: user.role?.id || '',
    departmentId: user.department?.id || '',
    teamId: user.team?.id || '',
    status: user.status || 'ACTIVE',
  }
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return '—'
  }
  return new Date(value).toLocaleString()
}

function formatPrettyDate(value?: string | Date | null) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} • ${time}`
}

function userPhotoSrc(photoUrl?: string | null) {
  if (!photoUrl) {
    return ''
  }
  if (photoUrl.startsWith('http') || photoUrl.startsWith('/')) {
    return photoUrl
  }
  return ''
}

function UserAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string
  photoUrl?: string | null
  className: string
}) {
  const src = userPhotoSrc(photoUrl)
  return (
    <div className={className}>
      {src ? <img src={src} alt="" /> : userInitials(name)}
    </div>
  )
}

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'U'
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function scopeLabel(level?: DataScopeLevel) {
  if (level === 'ALL') {
    return 'All'
  }
  if (level === 'DEPARTMENT') {
    return 'Department'
  }
  if (level === 'TEAM') {
    return 'Team'
  }
  return 'Own'
}

function scopeCopy(resource: string, level?: DataScopeLevel) {
  const subject =
    resource === 'lead'
      ? 'leads'
      : resource === 'document'
        ? 'documents'
        : 'employee performance data'
  if (level === 'ALL') {
    return `Can view and manage all ${subject} across the organization.`
  }
  if (level === 'DEPARTMENT') {
    return `Access is limited to ${subject} in this department.`
  }
  if (level === 'TEAM') {
    return `Access is limited to ${subject} in this team.`
  }
  return `Access is limited to their own ${subject}.`
}

function activityCopy(action: string) {
  if (action === 'USER_CREATED') {
    return { title: 'User Created', detail: 'New user account created' }
  }
  if (action === 'USER_UPDATED') {
    return { title: 'User Updated', detail: 'Profile information updated by admin' }
  }
  if (action === 'USER_STATUS_CHANGED') {
    return { title: 'Status Updated', detail: 'User status was changed' }
  }
  if (action === 'USER_ROLE_CHANGED') {
    return { title: 'Role Updated', detail: 'Assigned role was changed' }
  }
  if (action === 'USER_DATA_SCOPE_CHANGED') {
    return { title: 'Access Scope Updated', detail: 'CRM data scope was changed' }
  }
  if (action === 'USER_PERMISSION_OVERRIDE_CHANGED') {
    return { title: 'Permissions Updated', detail: 'Permission overrides were changed' }
  }
  return { title: action.replaceAll('_', ' '), detail: 'Account activity recorded' }
}

function statusLabel(status: UserStatus) {
  if (status === 'INACTIVE') {
    return 'Inactive'
  }
  if (status === 'SUSPENDED') {
    return 'Suspended'
  }
  return 'Active'
}

function statusChangeCopy(user: AdminUser, status: UserStatus) {
  const name = user.fullName
  if (status === 'ACTIVE') {
    return {
      title: 'Activate user',
      body: `Activate ${name}? They will be able to log in and work in the CRM again.`,
      confirm: 'Activate',
      success: `${name} is now Active.`,
    }
  }
  if (status === 'INACTIVE') {
    return {
      title: 'Deactivate user',
      body: `Deactivate ${name}? They will not be able to log in until you activate them again.`,
      confirm: 'Deactivate',
      success: `${name} is now Inactive.`,
    }
  }
  return {
    title: 'Suspend user',
    body: `Suspend ${name}? Access will be blocked immediately and their active sessions will be signed out.`,
    confirm: 'Suspend',
    success: `${name} is now Suspended.`,
  }
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function UserViewLayout({
  form,
  selected,
  roles,
  departments,
  activity,
  sessions,
  scopeDraft,
  viewTab,
  detailLoading,
  canConfigure,
  canOverride,
  onTabChange,
  onClose,
  onRevokeSession,
  onForceLogout,
  onPasswordReset,
  onScopeChange,
  onSaveScopes,
}: {
  form: UserForm
  selected: AdminUser | null
  roles: RoleRecord[]
  departments: Department[]
  activity: UserActivity[]
  sessions: UserSession[]
  scopeDraft: ScopeMap
  viewTab: ViewTab
  detailLoading: boolean
  canConfigure: boolean
  canOverride: boolean
  onTabChange: (tab: ViewTab) => void
  onClose: () => void
  onRevokeSession: (sessionId: string) => Promise<void>
  onForceLogout: () => Promise<void>
  onPasswordReset: () => Promise<void>
  onScopeChange: (resource: (typeof SCOPE_RESOURCES)[number], value: DataScopeLevel) => void
  onSaveScopes: () => void
}) {
  const displayName = form.fullName || selected?.fullName || 'User'
  const roleName =
    selected?.role?.name || roles.find((role) => role.id === form.roleId)?.name || '—'
  const departmentName =
    selected?.department?.name || departments.find((item) => item.id === form.departmentId)?.name || '—'
  const teamName =
    selected?.team?.name ||
    departments.flatMap((item) => item.teams).find((item) => item.id === form.teamId)?.name ||
    '—'
  const monthActivity = activity.filter((item) => {
    const date = new Date(item.createdAt)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ebeff7] bg-white px-5 py-4 dark:border-border dark:bg-surface [&_h3]:m-0 [&_h3]:text-[1.05rem] [&_h3]:text-[#24324d] dark:[&_h3]:text-text-strong">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#eef0ff] text-[#5b67e8]">
            <HugeiconsIcon icon={UserIcon} size={18} color="currentColor" strokeWidth={1.7} />
          </span>
          <h3 id="user-modal-title">View User</h3>
        </div>
        <button type="button" className={`${modalClose}`} aria-label="Close" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden max-[960px]:grid-rows-none max-[960px]:overflow-auto max-[960px]:overscroll-contain min-[961px]:grid-cols-[248px_minmax(0,1fr)] min-[961px]:grid-rows-[minmax(0,1fr)]">
        <aside className="flex h-auto min-h-0 flex-col gap-[18px] overflow-visible border-b border-border bg-[radial-gradient(circle_at_0_100%,rgba(91,103,232,0.08),transparent_46%),#fff] px-4 pt-[22px] pb-[18px] max-[960px]:overflow-visible min-[961px]:h-full min-[961px]:overflow-auto min-[961px]:border-r min-[961px]:border-b-0 dark:border-border dark:bg-surface">
          <div className="grid justify-items-center gap-2.5 text-center">
            <UserAvatar name={displayName} photoUrl={selected?.photoUrl} className="grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-primary text-[1.2rem] font-bold text-on-primary shadow-[0_10px_20px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] [&_img]:h-full [&_img]:w-full [&_img]:object-cover" />
            <div className="[&_strong]:block [&_strong]:text-[1.02rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong [&_p]:my-0.5 [&_p]:mb-2 [&_p]:text-[0.82rem] [&_p]:text-[#7b8498]">
              <strong>{displayName}</strong>
              <p>
                {roleName || '—'}
                {departmentName !== '—' ? ` • ${departmentName}` : ''}
              </p>
              <span className={userStatusPillClass(form.status.toLowerCase())}>{statusLabel(form.status)}</span>
            </div>
          </div>

          <nav className="grid gap-1" aria-label="User sections">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${userViewNavBtn} ${viewTab === tab.id ? userViewNavBtnActive : userViewNavBtnIdle}`}
                onClick={() => onTabChange(tab.id)}
              >
                <HugeiconsIcon icon={tab.icon} size={16} color="currentColor" strokeWidth={1.7} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto flex gap-2 rounded-[14px] bg-[#eef4ff] p-3 text-[#5b67e8] dark:bg-[rgba(91,103,232,0.16)] [&_strong]:mb-1 [&_strong]:block [&_strong]:text-[0.82rem] [&_p]:m-0 [&_p]:text-[0.75rem] [&_p]:leading-snug [&_p]:text-[#6b7690]">
            <HugeiconsIcon icon={InformationCircleIcon} size={16} color="currentColor" strokeWidth={1.7} />
            <div>
              <strong>User Information</strong>
              <p>This user can manage leads, applications and documents according to their assigned role and scope.</p>
            </div>
          </div>
        </aside>

        <section className="flex h-auto min-h-0 min-w-0 flex-col overflow-visible max-[960px]:overflow-visible min-[961px]:h-full min-[961px]:overflow-hidden">
          <div className="grid min-h-0 flex-1 content-start gap-3.5 overflow-visible overscroll-contain px-[18px] pt-4 pb-2 max-[960px]:overflow-visible min-[961px]:overflow-y-auto">
            {viewTab === 'overview' ? (
              <>
                <div className="grid grid-cols-1 gap-3.5 max-[960px]:grid-cols-1 min-[961px]:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                  <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                    <header>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                        <HugeiconsIcon icon={Contact01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <h4>Contact Information</h4>
                    </header>
                    <dl className="m-0 grid gap-2.5 [&>div]:grid [&>div]:grid-cols-1 [&>div]:items-center [&>div]:gap-2.5 max-[960px]:[&>div]:grid-cols-1 min-[961px]:[&>div]:grid-cols-[110px_minmax(0,1fr)] [&_dt]:text-[0.84rem] [&_dt]:text-[#7b8498] [&_dt]:after:content-[':'] [&_dd]:m-0 [&_dd]:text-[0.9rem] [&_dd]:font-semibold [&_dd]:text-[#24324d] dark:[&_dd]:text-text-strong">
                      <div>
                        <dt>Full Name</dt>
                        <dd>{form.fullName || '—'}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{form.email || '—'}</dd>
                      </div>
                      <div>
                        <dt>Mobile</dt>
                        <dd>{form.mobile || '—'}</dd>
                      </div>
                      <div>
                        <dt>Username</dt>
                        <dd>{form.username || '—'}</dd>
                      </div>
                    </dl>
                  </article>

                  <div className="grid content-start gap-3">
                    <div className="grid grid-cols-1 gap-2.5 max-[960px]:grid-cols-1 min-[961px]:grid-cols-2">
                      <div className="flex items-start gap-2 rounded-[14px] border border-[#e8edf6] bg-white px-3 py-2.5 text-[#7b8498] dark:border-border dark:bg-surface [&_span]:block [&_span]:text-[0.72rem] [&_strong]:mt-0.5 [&_strong]:block [&_strong]:text-[0.78rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong">
                        <HugeiconsIcon icon={Calendar03Icon} size={15} color="currentColor" strokeWidth={1.7} />
                        <div>
                          <span>Account created</span>
                          <strong>{formatPrettyDate(selected?.createdAt)}</strong>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-[14px] border border-[#e8edf6] bg-white px-3 py-2.5 text-[#7b8498] dark:border-border dark:bg-surface [&_span]:block [&_span]:text-[0.72rem] [&_strong]:mt-0.5 [&_strong]:block [&_strong]:text-[0.78rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong">
                        <HugeiconsIcon icon={Clock01Icon} size={15} color="currentColor" strokeWidth={1.7} />
                        <div>
                          <span>Last updated</span>
                          <strong>{formatPrettyDate(selected?.updatedAt)}</strong>
                        </div>
                      </div>
                    </div>
                    <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                      <header>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                          <HugeiconsIcon icon={Building03Icon} size={16} color="currentColor" strokeWidth={1.7} />
                        </span>
                        <h4>Organization</h4>
                      </header>
                      <dl className="m-0 grid gap-2.5 [&>div]:grid [&>div]:grid-cols-1 [&>div]:items-center [&>div]:gap-2.5 max-[960px]:[&>div]:grid-cols-1 min-[961px]:[&>div]:grid-cols-[110px_minmax(0,1fr)] [&_dt]:text-[0.84rem] [&_dt]:text-[#7b8498] [&_dt]:after:content-[':'] [&_dd]:m-0 [&_dd]:text-[0.9rem] [&_dd]:font-semibold [&_dd]:text-[#24324d] dark:[&_dd]:text-text-strong">
                        <div>
                          <dt>Role</dt>
                          <dd>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold bg-[#eef1ff] text-[#4f5de4]">{roleName || '—'}</span>
                          </dd>
                        </div>
                        <div>
                          <dt>Department</dt>
                          <dd>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold bg-[#e9f8ef] text-[#17824b]">{departmentName}</span>
                          </dd>
                        </div>
                        <div>
                          <dt>Team</dt>
                          <dd>{teamName}</dd>
                        </div>
                      </dl>
                    </article>
                  </div>
                </div>

                <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                  <header>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                      <HugeiconsIcon icon={Shield01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <h4>CRM Access & Scope</h4>
                  </header>
                  <div className="grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-3">
                    <ScopePreviewCard
                      tone="blue"
                      icon={UserGroupIcon}
                      title="Leads"
                      level={scopeDraft.lead}
                      copy={scopeCopy('lead', scopeDraft.lead)}
                    />
                    <ScopePreviewCard
                      tone="purple"
                      icon={File01Icon}
                      title="Documents"
                      level={scopeDraft.document}
                      copy={scopeCopy('document', scopeDraft.document)}
                    />
                    <ScopePreviewCard
                      tone="green"
                      icon={ChartIncreaseIcon}
                      title="Employee Performance"
                      level={scopeDraft.employee_performance}
                      copy={scopeCopy('employee_performance', scopeDraft.employee_performance)}
                    />
                  </div>
                </article>

                <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                  <header>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f8ef] text-[#1f9d5d]">
                      <HugeiconsIcon icon={AnalyticsUpIcon} size={16} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <h4>Activity / Summary</h4>
                  </header>
                  <div className="grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-4">
                    <div className="rounded-2xl p-3.5 text-left bg-[#eef1ff] text-[#5b67e8]">
                      <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white">
                        <HugeiconsIcon icon={UserGroupIcon} size={18} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <strong>0</strong>
                      <b>Assigned Leads</b>
                      <p>Total leads assigned</p>
                    </div>
                    <div className="rounded-2xl p-3.5 text-left bg-[#f3efff] text-[#6d4ee8] dark:bg-[rgba(122,90,248,0.14)]">
                      <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white">
                        <HugeiconsIcon icon={LicenseIcon} size={18} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <strong>0</strong>
                      <b>Active Applications</b>
                      <p>In progress applications</p>
                    </div>
                    <div className="rounded-2xl p-3.5 text-left bg-[#fff3e8] text-[#d46b08] dark:bg-[rgba(212,107,8,0.16)]">
                      <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white">
                        <HugeiconsIcon icon={DocumentAttachmentIcon} size={18} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <strong>0</strong>
                      <b>Pending Documents</b>
                      <p>Awaiting approval</p>
                    </div>
                    <div className="rounded-2xl p-3.5 text-left bg-[#e8f8ef] text-[#1f9d5d]">
                      <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white">
                        <HugeiconsIcon icon={Task01Icon} size={18} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <strong>{monthActivity}</strong>
                      <b>This Month Activity</b>
                      <p>Total activities</p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                  <header>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                      <HugeiconsIcon icon={Clock01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <h4>Recent Activity</h4>
                  </header>
                  {detailLoading ? (
                    <Skeleton active paragraph={{ rows: 3 }} />
                  ) : activity.length === 0 ? (
                    <p className={`${muted}`}>No recent activity yet.</p>
                  ) : (
                    <ul className={userViewActivity}>
                      {activity.slice(0, 8).map((item) => {
                        const copy = activityCopy(item.action)
                        return (
                          <li key={item.id}>
                            <span
                              className={`${userViewActivityIcon} ${item.action === 'USER_CREATED' ? userViewActivityIconAdd : ''}`}
                            >
                              <HugeiconsIcon
                                icon={item.action === 'USER_CREATED' ? Add01Icon : PencilEdit02Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.8}
                              />
                            </span>
                            <div>
                              <strong>{copy.title}</strong>
                              <p>{copy.detail}</p>
                            </div>
                            <time>{formatPrettyDate(item.createdAt)}</time>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </article>
              </>
            ) : null}

            {viewTab === 'permissions' ? (
              <div className="grid gap-3.5">
                {canOverride ? (
                  <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                    <header>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                        <HugeiconsIcon icon={Shield01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <h4>Data scope</h4>
                    </header>
                    <div className={`${scopeGrid}`}>
                      {SCOPE_RESOURCES.map((resource) => (
                        <label key={resource}>
                          {resource.replaceAll('_', ' ')}
                          {detailLoading ? (
                            <Skeleton.Input active block className={`${scopeSkeleton}`} />
                          ) : (
                            <Select
                              value={scopeDraft[resource]}
                              options={[
                                { value: 'OWN', label: 'Own' },
                                { value: 'TEAM', label: 'Team' },
                                { value: 'DEPARTMENT', label: 'Department' },
                                { value: 'ALL', label: 'All' },
                              ]}
                              onChange={(value) =>
                                onScopeChange(resource, (asSelectString(value) || 'OWN') as DataScopeLevel)
                              }
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <div className={`${formActions}`}>
                      <Button size="sm" onClick={onSaveScopes} disabled={detailLoading}>
                        Save scopes
                      </Button>
                    </div>
                  </article>
                ) : (
                  <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                    <header>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                        <HugeiconsIcon icon={Shield01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <h4>CRM Access & Scope</h4>
                    </header>
                    <div className="grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-3">
                      <ScopePreviewCard
                        tone="blue"
                        icon={UserGroupIcon}
                        title="Leads"
                        level={scopeDraft.lead}
                        copy={scopeCopy('lead', scopeDraft.lead)}
                      />
                      <ScopePreviewCard
                        tone="purple"
                        icon={File01Icon}
                        title="Documents"
                        level={scopeDraft.document}
                        copy={scopeCopy('document', scopeDraft.document)}
                      />
                      <ScopePreviewCard
                        tone="green"
                        icon={ChartIncreaseIcon}
                        title="Employee Performance"
                        level={scopeDraft.employee_performance}
                        copy={scopeCopy('employee_performance', scopeDraft.employee_performance)}
                      />
                    </div>
                  </article>
                )}

                {canConfigure ? (
                  <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                    <header>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                        <HugeiconsIcon icon={Shield01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <h4>Sessions</h4>
                    </header>
                    {sessions.map((session) => (
                      <div key={session.id} className={`${sessionRow}`}>
                        <div>
                          <strong>{session.userAgent || 'Unknown device'}</strong>
                          <div className={`${muted}`}>
                            Login: {formatDate(session.createdAt)} · Last active: {formatDate(session.lastActiveAt)}
                          </div>
                        </div>
                        {session.active ? (
                          <Button size="sm" variant="secondary" onClick={() => void onRevokeSession(session.id)}>
                            Logout Session
                          </Button>
                        ) : (
                          <span className={`${muted}`}>{session.revokedAt ? 'Revoked' : 'Expired'}</span>
                        )}
                      </div>
                    ))}
                    <div className={`${formActions}`}>
                      <Button size="sm" variant="secondary" onClick={() => void onForceLogout()}>
                        Force Logout
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void onPasswordReset()}>
                        Send password reset
                      </Button>
                    </div>
                  </article>
                ) : null}
              </div>
            ) : null}

            {viewTab === 'leads' || viewTab === 'applications' || viewTab === 'documents' || viewTab === 'performance' ? (
              <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong min-h-[180px]">
                <header>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                    <HugeiconsIcon
                      icon={
                        viewTab === 'leads'
                          ? UserGroupIcon
                          : viewTab === 'applications'
                            ? LicenseIcon
                            : viewTab === 'documents'
                              ? File01Icon
                              : AnalyticsUpIcon
                      }
                      size={16}
                      color="currentColor"
                      strokeWidth={1.7}
                    />
                  </span>
                  <h4>
                    {viewTab === 'leads'
                      ? 'Assigned Leads'
                      : viewTab === 'applications'
                        ? 'Applications'
                        : viewTab === 'documents'
                          ? 'Documents'
                          : 'Performance'}
                  </h4>
                </header>
                <p className={`${muted}`}>
                  {viewTab === 'leads'
                    ? `No assigned lead records to show yet. Inactive owner leads: ${selected?.inactiveOwnerLeadCount ?? 0}.`
                    : 'No records available for this section yet.'}
                </p>
              </article>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end px-[18px] pt-3 pb-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}

function ScopePreviewCard({
  tone,
  icon,
  title,
  level,
  copy,
}: {
  tone: 'blue' | 'purple' | 'green'
  icon: IconSvgElement
  title: string
  level?: DataScopeLevel
  copy: string
}) {
  return (
    <div className={`${userViewScopeBase} ${userViewScopeTone[tone]}`}>
      <div className="mb-2 flex items-center gap-2 [&_span]:inline-flex [&_span]:h-7 [&_span]:w-7 [&_span]:items-center [&_span]:justify-center [&_span]:rounded-lg [&_span]:bg-white [&_b]:flex-1 [&_b]:text-[0.88rem] [&_b]:text-[#24324d] dark:[&_b]:text-text-strong [&_em]:rounded-full [&_em]:bg-white [&_em]:px-2 [&_em]:py-0.5 [&_em]:text-[0.72rem] [&_em]:font-bold [&_em]:not-italic [&_em]:text-[#4f5de4]">
        <span className="user-view-scope-icon">
          <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.7} />
        </span>
        <b>{title}</b>
        <em>{scopeLabel(level)}</em>
      </div>
      <p>{copy}</p>
    </div>
  )
}

export default function UsersPage() {
  const auth = useOutletContext<AuthSession>()
  const location = useLocation()
  const canCreate = hasPermission(auth, 'user:create')
  const canEdit = hasPermission(auth, 'user:edit')
  const canConfigure = hasPermission(auth, 'user:configure')
  const canOverride = hasPermission(auth, 'permission:configure')

  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filters, setFilters] = useState({
    search: readUrlSearchQuery(location.search),
    roleId: '',
    departmentId: '',
    teamId: '',
    status: '',
  })
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const photoPreviewUrl = useRef('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detailRequestId = useRef(0)
  const syncedSearch = useRef(false)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [activity, setActivity] = useState<UserActivity[]>([])
  const [scopeDraft, setScopeDraft] = useState<ScopeMap>(DEFAULT_SCOPES)
  const [detailLoading, setDetailLoading] = useState(false)
  const [viewTab, setViewTab] = useState<ViewTab>('overview')
  const [formSaving, setFormSaving] = useState(false)
  const [statusPrompt, setStatusPrompt] = useState<{ user: AdminUser; nextStatus: UserStatus } | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [statusFlashId, setStatusFlashId] = useState<string | null>(null)
  const statusFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filterTeams = useMemo(() => {
    if (filters.departmentId) {
      return departments.find((item) => item.id === filters.departmentId)?.teams ?? []
    }
    return departments.flatMap((item) => item.teams)
  }, [departments, filters.departmentId])

  const formTeams = useMemo(
    () => departments.find((item) => item.id === form.departmentId)?.teams ?? [],
    [departments, form.departmentId],
  )

  function showToast(text: string, type: ToastState['type'] = 'success') {
    setToast({ text, type })
    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  function clearPhotoPreview() {
    if (photoPreviewUrl.current.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl.current)
    }
    photoPreviewUrl.current = ''
    setPhotoPreview('')
    setPhotoFile(null)
  }

  function applyPhotoPreview(url: string) {
    if (photoPreviewUrl.current.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl.current)
    }
    photoPreviewUrl.current = url
    setPhotoPreview(url)
  }

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    if (!file) {
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Profile photo must be 5 MB or smaller.', 'error')
      return
    }
    setPhotoFile(file)
    applyPhotoPreview(URL.createObjectURL(file))
  }

  async function loadList(options?: { silent?: boolean; fromSearch?: boolean; search?: string }) {
    if (!options?.silent) {
      setLoading(true)
    }
    if (options?.fromSearch) {
      setSearching(true)
    }
    try {
      const result = await listUsers({ ...filters, search: options?.search ?? filters.search })
      if (result.ok) {
        setUsers(result.data.users)
      } else {
        showToast(result.data?.error || 'Unable to load users.', 'error')
      }
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
      if (options?.fromSearch) {
        setSearching(false)
      }
    }
  }

  useEffect(() => {
    listRoles().then((result) => result.ok && setRoles(result.data.roles))
    listDepartments().then((result) => result.ok && setDepartments(result.data.departments))
  }, [])

  useEffect(() => {
    void loadList(readUrlSearchQuery(location.search) ? { fromSearch: true, search: readUrlSearchQuery(location.search) } : undefined)
  }, [filters.roleId, filters.departmentId, filters.teamId, filters.status])

  useEffect(() => {
    const next = readUrlSearchQuery(location.search)
    setFilters((current) => (current.search === next ? current : { ...current, search: next }))
    if (syncedSearch.current) {
      void loadList({ fromSearch: Boolean(next), search: next })
    }
    syncedSearch.current = true
  }, [location.search])

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }
      if (statusFlashTimer.current) {
        clearTimeout(statusFlashTimer.current)
      }
      if (photoPreviewUrl.current.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl.current)
      }
    },
    [],
  )

  async function openCreate() {
    setEditingId(null)
    setFormMode('create')
    setSelected(null)
    setForm({ ...EMPTY_FORM, roleId: roles.find((role) => role.status === 'ACTIVE')?.id || '', username: '', password: '' })
    clearPhotoPreview()
    setFormSaving(false)
    setFormOpen(true)
  }

  async function openUser(user: AdminUser, mode: FormMode) {
    const requestId = detailRequestId.current + 1
    detailRequestId.current = requestId
    setEditingId(user.id)
    setForm(formFromUser(user))
    setSelected(user)
    setFormMode(mode)
    setViewTab('overview')
    setFormOpen(true)
    setPhotoFile(null)
    applyPhotoPreview(userPhotoSrc(user.photoUrl))
    setSessions([])
    setActivity([])
    setScopeDraft(DEFAULT_SCOPES)
    setDetailLoading(mode === 'view')

    const [detailResult, sessionResult, activityResult] = await Promise.all([
      getUser(user.id),
      mode === 'view' ? listUserSessions(user.id) : Promise.resolve(null),
      mode === 'view' ? listUserActivity(user.id) : Promise.resolve(null),
    ])
    if (detailRequestId.current !== requestId) {
      return
    }
    if (!detailResult.ok) {
      setDetailLoading(false)
      showToast(detailResult.data?.error || 'Unable to load user.', 'error')
      return
    }

    const detail = detailResult.data.user
    setForm(formFromUser(detail))
    setSelected(detail)
    if (!photoPreviewUrl.current.startsWith('blob:')) {
      applyPhotoPreview(userPhotoSrc(detail.photoUrl))
    }
    setScopeDraft({
      lead: detail.dataScopes?.lead || 'OWN',
      document: detail.dataScopes?.document || detail.dataScopes?.lead || 'OWN',
      employee_performance: detail.dataScopes?.employee_performance || detail.dataScopes?.lead || 'OWN',
    })
    if (sessionResult?.ok) {
      setSessions(sessionResult.data.sessions)
    }
    if (activityResult?.ok) {
      setActivity(activityResult.data.activity)
    }
    setDetailLoading(false)
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (formSaving) {
      return
    }
    if (!form.roleId) {
      showToast('Please select a role.', 'error')
      return
    }
    const payload: UserPayload = {
      fullName: form.fullName,
      email: form.email,
      mobile: form.mobile,
      username: form.username,
      roleId: form.roleId,
      departmentId: form.departmentId || null,
      teamId: form.teamId || null,
      status: form.status,
    }
    if (!editingId && form.password) {
      payload.password = form.password
    }

    setFormSaving(true)
    const result = editingId ? await updateUser(editingId, payload, photoFile) : await createUser(payload, photoFile)
    if (!result.ok) {
      setFormSaving(false)
      showToast(result.data?.error || 'Unable to save user.', 'error')
      return
    }

    if (!editingId && result.data.reset?.devResetPath) {
      showToast(`User created. Dev reset link: ${result.data.reset.devResetPath}`)
    } else {
      showToast(editingId ? 'User updated.' : 'User created.')
    }
    if (editingId === auth.user.id && result.data.user) {
      const saved = result.data.user
      patchCurrentAuthUser({
        fullName: saved.fullName,
        email: saved.email,
        username: saved.username,
        mobile: saved.mobile,
        photoUrl: saved.photoUrl
          ? `${saved.photoUrl}${saved.photoUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
          : null,
        status: saved.status,
      })
    }
    await loadList()
    setFormSaving(false)
    closeForm()
  }

  function flashStatusRow(userId: string) {
    setStatusFlashId(userId)
    if (statusFlashTimer.current) {
      clearTimeout(statusFlashTimer.current)
    }
    statusFlashTimer.current = setTimeout(() => setStatusFlashId(null), 1600)
  }

  async function changeStatus(user: AdminUser, status: UserStatus) {
    if (statusSaving || statusUpdatingId) {
      return
    }
    setStatusSaving(true)
    setStatusUpdatingId(user.id)
    const result = await updateUserStatus(user.id, status)
    if (!result.ok) {
      setStatusSaving(false)
      setStatusUpdatingId(null)
      showToast(result.data?.error || 'Unable to update status.', 'error')
      return
    }

    const updated = result.data.user
    const nextStatus = updated?.status || status
    setUsers((current) =>
      current.map((item) => (item.id === user.id ? { ...item, ...(updated || {}), status: nextStatus } : item)),
    )
    if (selected?.id === user.id) {
      setSelected(updated || { ...selected, status: nextStatus })
      setForm((current) => ({ ...current, status: nextStatus }))
    }

    const copy = statusChangeCopy(user, nextStatus)
    const hiddenByFilter = Boolean(filters.status && filters.status !== nextStatus)
    showToast(hiddenByFilter ? `${copy.success} Hidden by the current status filter.` : copy.success)
    flashStatusRow(user.id)
    setStatusPrompt(null)
    setStatusSaving(false)
    setStatusUpdatingId(null)
    await loadList({ silent: true })
  }

  function closeForm() {
    detailRequestId.current += 1
    setFormOpen(false)
    setViewTab('overview')
    clearPhotoPreview()
  }

  async function saveScopes() {
    if (!selected) {
      return
    }
    const result = await setUserScopes(selected.id, scopeDraft)
    showToast(
      result.ok ? 'Data scope saved.' : result.data?.error || 'Unable to save data scope.',
      result.ok ? 'success' : 'error',
    )
    if (result.ok) {
      setSelected(result.data.user)
    }
  }

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title="Users"
        description="Create CRM users, assign roles, control login access, and manage account status."
      />
      <PageHeader
        title="Users"
        subtitle="Create users, assign roles, and control login access."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Users' }]}
        extra={canCreate ? <Button onClick={() => void openCreate()}>Create User</Button> : undefined}
      />

      <section className={`${adminFilters}`}>
        <Input.Search
          allowClear
          enterButton="Search"
          loading={searching}
          placeholder="Search name, email, username"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          onSearch={() => {
            void loadList({ fromSearch: true })
          }}
        />
        <Select
          allowClear
          placeholder="All roles"
          value={filters.roleId || undefined}
          options={roles
            .filter((role) => role.status === 'ACTIVE' || role.id === filters.roleId)
            .map((role) => ({ value: role.id, label: role.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, roleId: asSelectString(value) }))}
        />
        <Select
          allowClear
          placeholder="All departments"
          value={filters.departmentId || undefined}
          options={departments.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) =>
            setFilters((current) => ({ ...current, departmentId: asSelectString(value), teamId: '' }))
          }
        />
        <Select
          allowClear
          disabled={!filters.departmentId}
          placeholder={filters.departmentId ? 'All teams' : 'Select department first'}
          value={filters.teamId || undefined}
          options={filterTeams.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, teamId: asSelectString(value) }))}
        />
        <Select
          allowClear
          placeholder="All statuses"
          value={filters.status || undefined}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ]}
          onChange={(value) => setFilters((current) => ({ ...current, status: asSelectString(value) }))}
        />
      </section>

      <section className={`${adminCard} ${tableWrap}`}>
        <Spin spinning={loading}>
          <table className={`${adminTable}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Team</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6}>No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={statusFlashId === user.id ? adminTableRowStatusUpdated : undefined}
                    onClick={() => {
                      void openUser(user, 'view')
                    }}
                  >
                    <td>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UserAvatar name={user.fullName} photoUrl={user.photoUrl} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-[0.72rem] font-bold text-on-primary [&_img]:h-full [&_img]:w-full [&_img]:object-cover" />
                        <div>
                          <strong>{user.fullName}</strong>
                          <div className={`${muted}`}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.role?.name || '—'}</td>
                    <td>{user.department?.name || '—'}</td>
                    <td>{user.team?.name || '—'}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <Switch
                        checked={user.status === 'ACTIVE'}
                        checkedChildren="Active"
                        unCheckedChildren={user.status === 'SUSPENDED' ? 'Suspended' : 'Inactive'}
                        disabled={!canEdit}
                        loading={statusUpdatingId === user.id}
                        onChange={(checked) => {
                          void changeStatus(user, checked ? 'ACTIVE' : 'INACTIVE')
                        }}
                      />
                    </td>
                    <td className={`${rowActions}`} onClick={(event) => event.stopPropagation()}>
                      <RowActionMenu
                        items={(
                          [
                            {
                              key: 'view',
                              label: 'View',
                              icon: <ActionIcon icon={ViewIcon} />,
                              onSelect: () => {
                                void openUser(user, 'view')
                              },
                            },
                            canEdit
                              ? {
                                  key: 'edit',
                                  label: 'Edit',
                                  icon: <ActionIcon icon={PencilEdit02Icon} />,
                                  onSelect: () => {
                                    void openUser(user, 'edit')
                                  },
                                }
                              : null,
                            canEdit && user.status !== 'ACTIVE'
                              ? {
                                  key: 'activate',
                                  label: 'Activate User',
                                  icon: <ActionIcon icon={UserCheck01Icon} />,
                                  onSelect: () => {
                                    setStatusPrompt({ user, nextStatus: 'ACTIVE' })
                                  },
                                }
                              : null,
                            canEdit && user.status === 'ACTIVE'
                              ? {
                                  key: 'deactivate',
                                  label: 'Deactivate',
                                  icon: <ActionIcon icon={UserBlock01Icon} />,
                                  onSelect: () => {
                                    setStatusPrompt({ user, nextStatus: 'INACTIVE' })
                                  },
                                }
                              : null,
                            canEdit && user.status !== 'SUSPENDED'
                              ? {
                                  key: 'suspend',
                                  label: 'Suspend',
                                  icon: <ActionIcon icon={PauseIcon} />,
                                  danger: true,
                                  onSelect: () => {
                                    setStatusPrompt({ user, nextStatus: 'SUSPENDED' })
                                  },
                                }
                              : null,
                          ] satisfies Array<RowActionItem | null>
                        ).filter((item) => item !== null)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Spin>
      </section>

      {formOpen
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={closeForm}>
              <div
                className={formMode === 'view' ? userViewPanel : modalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                {formMode === 'view' ? (
                  <UserViewLayout
                    form={form}
                    selected={selected}
                    roles={roles}
                    departments={departments}
                    activity={activity}
                    sessions={sessions}
                    scopeDraft={scopeDraft}
                    viewTab={viewTab}
                    detailLoading={detailLoading}
                    canConfigure={canConfigure}
                    canOverride={canOverride}
                    onTabChange={setViewTab}
                    onClose={closeForm}
                    onRevokeSession={async (sessionId) => {
                      if (!selected) {
                        return
                      }
                      const result = await revokeUserSession(selected.id, sessionId)
                      showToast(
                        result.ok ? 'Session terminated.' : result.data?.error || 'Unable to terminate the selected session.',
                        result.ok ? 'success' : 'error',
                      )
                      const refreshed = await listUserSessions(selected.id)
                      if (refreshed.ok) {
                        setSessions(refreshed.data.sessions)
                      }
                    }}
                    onForceLogout={async () => {
                      if (!selected) {
                        return
                      }
                      const result = await forceLogoutUser(selected.id)
                      showToast(
                        result.ok ? 'All sessions terminated.' : result.data?.error || 'Unable to terminate the selected session.',
                        result.ok ? 'success' : 'error',
                      )
                    }}
                    onPasswordReset={async () => {
                      if (!selected) {
                        return
                      }
                      const result = await adminPasswordReset(selected.id)
                      showToast(
                        result.ok
                          ? result.data.devResetPath
                            ? `Reset created. Dev link: ${result.data.devResetPath}`
                            : result.data.message || 'Password reset started.'
                          : result.data?.error || 'Unable to start password reset.',
                        result.ok ? 'success' : 'error',
                      )
                    }}
                    onScopeChange={(resource, value) =>
                      setScopeDraft((current) => ({ ...current, [resource]: value }))
                    }
                    onSaveScopes={() => void saveScopes()}
                  />
                ) : (
                  <>
                <div className={`${modalHeader}`}>
                  <h3 id="user-modal-title">{editingId ? 'Edit User' : 'Create User'}</h3>
                  <button type="button" className={`${modalClose}`} aria-label="Close" onClick={closeForm}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <form
                  className={`${adminForm}`}
                  autoComplete="off"
                  onSubmit={(event) => {
                    void saveUser(event)
                  }}
                >
                  {editingId ? null : (
                    <div className="sr-only" aria-hidden>
                      <input type="text" name="username" autoComplete="username" tabIndex={-1} defaultValue="" />
                      <input type="password" name="password" autoComplete="current-password" tabIndex={-1} defaultValue="" />
                    </div>
                  )}
                  <fieldset className={`${adminFormFields}`} disabled={formSaving}>
              <div className={`${photoUpload} ${adminFormSpan}`}>
                <div className={`${photoPicker}`}>
                  <input
                    id="user-photo"
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onPhotoChange}
                  />
                  <label htmlFor="user-photo" className={`${photoPickerButton}`}>
                    <span className={photoPreviewFrame}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="" />
                      ) : (
                        <HugeiconsIcon icon={UserIcon} size={52} color="currentColor" strokeWidth={1.5} />
                      )}
                    </span>
                    <span className={`${photoCameraBadge}`} aria-hidden>
                      <HugeiconsIcon icon={Camera01Icon} size={16} color="currentColor" strokeWidth={1.8} />
                    </span>
                    <span className="sr-only">Upload profile image</span>
                  </label>
                </div>
                <p className={`${fieldHint}`}>Profile image · JPG, PNG, or WEBP. Max 5 MB.</p>
              </div>
              <label>
                <FieldLabel required>Full Name</FieldLabel>
                <Input
                  value={form.fullName}
                  autoComplete="off"
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label>
                <FieldLabel required>Email</FieldLabel>
                <Input
                  type="email"
                  value={form.email}
                  autoComplete="off"
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                <FieldLabel required>Mobile</FieldLabel>
                <Input
                  value={form.mobile}
                  autoComplete="off"
                  onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
                  required
                />
              </label>
              <label>
                <FieldLabel required>Username</FieldLabel>
                <Input
                  name="create-username"
                  value={form.username}
                  autoComplete="off"
                  readOnly={!editingId}
                  onFocus={(event) => {
                    event.currentTarget.readOnly = false
                  }}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  required
                />
              </label>
              {editingId ? null : (
                <label>
                  <FieldLabel>Temporary password</FieldLabel>
                  <Input.Password
                    name="create-password"
                    value={form.password}
                    autoComplete="new-password"
                    readOnly
                    onFocus={(event) => {
                      event.currentTarget.readOnly = false
                    }}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Leave blank to send a reset link"
                  />
                </label>
              )}
              <label>
                <FieldLabel required>Role</FieldLabel>
                <Select
                  placeholder="Select role"
                  value={form.roleId || undefined}
                  options={roles
                    .filter((role) => role.status === 'ACTIVE' || role.id === form.roleId)
                    .map((role) => ({ value: role.id, label: role.name }))}
                  onChange={(value) => setForm((current) => ({ ...current, roleId: asSelectString(value) }))}
                />
              </label>
              <label>
                <FieldLabel>Department</FieldLabel>
                <Select
                  allowClear
                  placeholder="None"
                  value={form.departmentId || undefined}
                  options={departments.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={(value) => setForm((current) => ({ ...current, departmentId: asSelectString(value), teamId: '' }))}
                />
              </label>
              <label>
                <FieldLabel>Team</FieldLabel>
                <Select
                  allowClear
                  disabled={!form.departmentId}
                  placeholder={form.departmentId ? 'None' : 'Select department first'}
                  value={form.teamId || undefined}
                  options={formTeams.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={(value) => setForm((current) => ({ ...current, teamId: asSelectString(value) }))}
                />
              </label>
              <label>
                <FieldLabel required>Status</FieldLabel>
                <Select
                  value={form.status}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'SUSPENDED', label: 'Suspended' },
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, status: (asSelectString(value) || 'ACTIVE') as UserStatus }))
                  }
                />
              </label>
              </fieldset>
              <div className={`${formActions}`}>
                <Button type="submit" loading={formSaving}>
                  {editingId ? 'Save User' : 'Create User'}
                </Button>
                <Button type="button" variant="secondary" onClick={closeForm} disabled={formSaving}>
                  Cancel
                </Button>
              </div>
            </form>
                  </>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {statusPrompt
        ? createPortal(
            <div
              className={`${modalBackdrop}`}
              onClick={() => {
                if (!statusSaving) {
                  setStatusPrompt(null)
                }
              }}
            >
              <div
                className={`${modalPanel} ${statusConfirmPanel}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="status-confirm-title"
                onClick={(event) => event.stopPropagation()}
              >
                {(() => {
                  const copy = statusChangeCopy(statusPrompt.user, statusPrompt.nextStatus)
                  return (
                    <>
                      <div className={`${modalHeader}`}>
                        <h3 id="status-confirm-title">{copy.title}</h3>
                        <button
                          type="button"
                          className={`${modalClose}`}
                          aria-label="Close"
                          disabled={statusSaving}
                          onClick={() => setStatusPrompt(null)}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className={`${statusConfirmCopy}`}>{copy.body}</p>
                      <p className={`${statusConfirmMeta}`}>
                        Current status: <strong>{statusLabel(statusPrompt.user.status)}</strong>
                        {' → '}
                        New status: <strong>{statusLabel(statusPrompt.nextStatus)}</strong>
                      </p>
                      <div className={`${formActions}`}>
                        <Button
                          loading={statusSaving}
                          className={statusPrompt.nextStatus === 'SUSPENDED' ? 'ui-btn-danger' : undefined}
                          onClick={() => void changeStatus(statusPrompt.user, statusPrompt.nextStatus)}
                        >
                          {copy.confirm}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={statusSaving}
                          onClick={() => setStatusPrompt(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>,
            document.body,
          )
        : null}

      {toast
        ? createPortal(
            <div className={appToastClass(toast.type)} role="status">
              {toast.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
