import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { DatePicker, Dropdown, Spin } from 'antd'
import type { MenuProps } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  DashboardSquare01Icon,
  File01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { listAuditLogs } from '../api/client'
import { readUrlSearchQuery } from '../lib/url-search'
import Button from '../components/Button'
import Input from '../components/Input'
import PageHeader from '../components/PageHeader'
import PageMeta from '../components/PageMeta'
import Select from '../components/Select'
import type { AuditLog } from '../types'
import { useLocation } from 'react-router-dom'
import {
  adminBanner,
  adminCard,
  adminEmpty,
  adminPage,
  adminTable,
  modalBackdrop,
  modalClose,
  modalHeader,
  modalPanel,
} from '../styles/admin'

type Filters = {
  search: string
  module: string
  action: string
  userId: string
  from: string
  to: string
}

const EMPTY_FILTERS: Filters = {
  search: '',
  module: '',
  action: '',
  userId: '',
  from: '',
  to: '',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const CRITICAL_RE = /fail|lock|deny|delete|reject|suspend|unauthor/i

const surfaceCard =
  'bg-surface border border-border rounded-[18px] shadow-soft'

const auditPill =
  'inline-flex items-center px-[9px] py-[3px] rounded-full text-[0.72rem] font-bold leading-[1.4]'

const moduleTone: Record<string, string> = {
  lead: 'bg-[#ece8ff] text-[#6d4aff]',
  user: 'bg-[#ece8ff] text-[#6d4aff]',
  payment: 'bg-[#fde8ef] text-[#d63d74]',
  document: 'bg-[#fff1e6] text-[#c26a1a]',
  communication: 'bg-[#fff7d6] text-[#a07800]',
  'master-data': 'bg-[#eef2f6] text-[#5b6b7c]',
  session: 'bg-[#eef2f6] text-[#5b6b7c]',
  permission: 'bg-[#fde8e8] text-[#c24141]',
  role: 'bg-[#fde8e8] text-[#c24141]',
  employee: 'bg-[#e7f8ef] text-[#0f7a4a]',
  service: 'bg-[#e7f8ef] text-[#0f7a4a]',
}

const actionTone: Record<string, string> = {
  status: 'bg-[#fff1e6] text-[#c26a1a]',
  updated: 'bg-[#fff1e6] text-[#c26a1a]',
  created: 'bg-[#e7f8ef] text-[#0f7a4a]',
  completed: 'bg-[#e7f8ef] text-[#0f7a4a]',
  verified: 'bg-[#e7f8ef] text-[#0f7a4a]',
  changed: 'bg-[#ece8ff] text-[#6d4aff]',
  assigned: 'bg-[#ece8ff] text-[#6d4aff]',
  logged: 'bg-[#fff7d6] text-[#a07800]',
  closed: 'bg-[#fde8e8] text-[#c24141]',
  denied: 'bg-[#fde8e8] text-[#c24141]',
  failure: 'bg-[#fde8e8] text-[#c24141]',
  locked: 'bg-[#fde8e8] text-[#c24141]',
  rejected: 'bg-[#fde8e8] text-[#c24141]',
  deleted: 'bg-[#fde8e8] text-[#c24141]',
  default: 'bg-[#e8f1ff] text-[#2f6fed]',
}

const statIconTone: Record<string, string> = {
  blue: 'bg-[#e8f1ff] text-[#3b82f6]',
  violet: 'bg-[#eee8ff] text-[#7c5cfc]',
  green: 'bg-[#e7f8ef] text-[#16a34a]',
}

const pageBtn =
  'min-w-8 h-8 px-2 border-0 rounded-lg bg-transparent text-text-muted font-semibold cursor-pointer hover:bg-hover-bg hover:text-text'

const pageBtnActive = 'bg-primary text-on-primary hover:bg-primary hover:text-on-primary'

const filterControl =
  '[&_.ant-input-affix-wrapper]:!h-[42px] [&_.ant-input-affix-wrapper]:!min-h-[42px] [&_.ant-input-affix-wrapper]:!max-h-[42px] [&_.ant-input-affix-wrapper]:!flex [&_.ant-input-affix-wrapper]:!items-center [&_.ant-select]:!h-[42px] [&_.ant-select-selector]:!h-[42px] [&_.ant-select-selector]:!min-h-[42px] [&_.ant-select-selector]:!max-h-[42px] [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center [&_.ant-picker]:!h-[42px] [&_.ant-picker]:!min-h-[42px] [&_.ant-picker]:!max-h-[42px] [&_.ant-picker]:!flex [&_.ant-picker]:!items-center [&_.ant-input]:!h-auto [&_.ant-input]:!min-h-0 [&_.ant-input]:!max-h-none [&_.ant-input]:!py-0 [&_.ant-input]:leading-[1.2] [&_.ant-select-selection-item]:leading-[1.2] [&_.ant-select-selection-placeholder]:leading-[1.2] [&_.ant-picker-input_input]:leading-[1.2] [&_.ui-input]:w-full [&_.ui-input]:h-[42px] [&_.ui-select]:w-full [&_.ui-select]:h-[42px] [&_.ant-select]:w-full [&_.ant-picker]:w-full'

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ')
}

function toDayjs(value: string) {
  return value ? dayjs(value) : null
}

function toDateString(value: Dayjs | null) {
  return value ? value.format('YYYY-MM-DD') : ''
}

function formatDateTime(value: string | Date) {
  return dayjs(value).format('D MMM YYYY, h:mm A')
}

function humanize(value: string | null | undefined) {
  if (!value) {
    return 'System'
  }
  return value
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function moduleLabel(entityType: string | null | undefined) {
  if (!entityType) {
    return 'System'
  }
  return humanize(entityType)
}

function moduleToneClass(entityType: string | null | undefined) {
  const key = (entityType || 'system').toLowerCase().replace(/[\s_]+/g, '-')
  return moduleTone[key] || moduleTone.session
}

function actionToneKey(action: string) {
  const text = action.toLowerCase()
  if (text.includes('status')) return 'status'
  if (text.includes('creat')) return 'created'
  if (text.includes('verif')) return 'verified'
  if (text.includes('complet')) return 'completed'
  if (text.includes('assign')) return 'assigned'
  if (text.includes('role') || text.includes('chang')) return 'changed'
  if (text.includes('log')) return 'logged'
  if (text.includes('close')) return 'closed'
  if (text.includes('deny') || text.includes('denied')) return 'denied'
  if (text.includes('fail')) return 'failure'
  if (text.includes('lock')) return 'locked'
  if (text.includes('reject')) return 'rejected'
  if (text.includes('delet')) return 'deleted'
  if (text.includes('updat')) return 'updated'
  return 'default'
}

function logCode(id: string) {
  return `LOG-${id.replace(/-/g, '').slice(-5).toUpperCase()}`
}

function recordCode(entityType: string | null | undefined, entityId: string | null | undefined) {
  if (!entityId) {
    return '—'
  }
  const prefix = (entityType || 'REC').replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'REC'
  return `${prefix}-${entityId.replace(/-/g, '').slice(-4).toUpperCase()}`
}

function parseDevice(userAgent: string | null | undefined) {
  if (!userAgent) {
    return '—'
  }
  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Chrome')
      ? 'Chrome'
      : userAgent.includes('Firefox')
        ? 'Firefox'
        : userAgent.includes('Safari')
          ? 'Safari'
          : 'Browser'
  const os = userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Mac OS') || userAgent.includes('Macintosh')
      ? 'macOS'
      : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('iPhone') || userAgent.includes('iPad')
          ? 'iOS'
          : userAgent.includes('Linux')
            ? 'Linux'
            : 'Unknown'
  return `${browser} (${os})`
}

function isCritical(action: string) {
  return CRITICAL_RE.test(action)
}

function inRange(value: string | Date, from: string, to: string) {
  const time = dayjs(value)
  if (from && time.isBefore(dayjs(from).startOf('day'))) {
    return false
  }
  if (to && time.isAfter(dayjs(to).endOf('day'))) {
    return false
  }
  return true
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }
  return Math.round(((current - previous) / previous) * 100)
}

function matchesSearch(log: AuditLog, search: string) {
  if (!search) {
    return true
  }
  const haystack = [
    log.action,
    log.entityType,
    log.entityId,
    log.ipAddress,
    log.user?.fullName,
    log.user?.email,
    logCode(log.id),
    recordCode(log.entityType, log.entityId),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(search.toLowerCase())
}

function metadataEntries(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return []
  }
  return Object.entries(metadata).filter(([, value]) => value !== null && value !== undefined && value !== '')
}

function stringifyMeta(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function changePairs(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return [] as Array<{ label: string; from: string; to: string }>
  }
  const pairs: Array<{ label: string; from: string; to: string }> = []
  const from = metadata.from ?? metadata.previous ?? metadata.before ?? metadata.oldValue
  const to = metadata.to ?? metadata.next ?? metadata.after ?? metadata.newValue
  if (from !== undefined && to !== undefined) {
    pairs.push({ label: 'Value', from: stringifyMeta(from), to: stringifyMeta(to) })
  }
  const changes = metadata.changes
  if (changes && typeof changes === 'object') {
    for (const [key, value] of Object.entries(changes as Record<string, unknown>)) {
      if (value && typeof value === 'object' && ('from' in value || 'to' in value || 'before' in value || 'after' in value)) {
        const item = value as Record<string, unknown>
        pairs.push({
          label: humanize(key),
          from: stringifyMeta(item.from ?? item.before ?? '—'),
          to: stringifyMeta(item.to ?? item.after ?? '—'),
        })
      }
    }
  }
  return pairs
}

function extraMetadata(metadata: Record<string, unknown> | null | undefined) {
  const skip = new Set(['from', 'to', 'previous', 'next', 'before', 'after', 'oldValue', 'newValue', 'changes'])
  return metadataEntries(metadata).filter(([key]) => !skip.has(key))
}

function summaryText(log: AuditLog) {
  const extras = extraMetadata(log.metadata)
  if (extras.length) {
    return extras
      .slice(0, 3)
      .map(([key, value]) => `${humanize(key)}: ${stringifyMeta(value)}`)
      .join(' · ')
  }
  if (log.entityType) {
    return `${moduleLabel(log.entityType)} record ${recordCode(log.entityType, log.entityId)}`
  }
  return 'System event recorded in the CRM'
}

function pageItems(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }
  const items: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) {
    items.push('ellipsis')
  }
  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }
  if (end < total - 1) {
    items.push('ellipsis')
  }
  items.push(total)
  return items
}

function csvValue(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadCsv(logs: AuditLog[]) {
  const header = ['Log ID', 'Date & Time', 'User', 'Module', 'Action', 'Record ID', 'IP Address', 'Device']
  const rows = logs.map((log) =>
    [
      logCode(log.id),
      formatDateTime(log.createdAt),
      log.user?.fullName || 'System',
      moduleLabel(log.entityType),
      humanize(log.action),
      recordCode(log.entityType, log.entityId),
      log.ipAddress || '—',
      parseDevice(log.userAgent),
    ]
      .map(csvValue)
      .join(','),
  )
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function StatCard({
  tone,
  icon,
  label,
  value,
  change,
}: {
  tone: keyof typeof statIconTone
  icon: typeof File01Icon
  label: string
  value: number
  change: number
}) {
  return (
    <article className={cx('flex gap-3 items-start p-4', surfaceCard)}>
      <span className={cx('size-[42px] shrink-0 grid place-items-center rounded-xl', statIconTone[tone])}>
        <HugeiconsIcon icon={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-text-muted text-[0.82rem]">{label}</p>
        <strong className="block mt-0.5 text-[1.55rem] tracking-[-0.03em] leading-[1.15] text-text">
          {value.toLocaleString()}
        </strong>
        <div className="flex items-center gap-1.5 mt-1.5 text-[0.72rem] text-text-faint">
          <b className={cx('font-bold', change >= 0 ? 'text-[#16a34a]' : 'text-[#e11d48]')}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </b>
          vs previous period
        </div>
      </div>
    </article>
  )
}

export default function AuditLogs() {
  const location = useLocation()
  const urlQuery = readUrlSearchQuery(location.search)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, search: urlQuery })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const result = await listAuditLogs()
    if (result.ok) {
      setLogs(result.data.logs)
      setMessage('')
    } else {
      setMessage(result.data?.error || 'You do not have permission to perform this action.')
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const next = readUrlSearchQuery(location.search)
    setFilters((current) => ({ ...current, search: next }))
    setPage(1)
    setSelectedIds([])
  }, [location.search])

  const moduleOptions = useMemo(() => {
    const values = Array.from(new Set(logs.map((log) => log.entityType).filter(Boolean))) as string[]
    return values.sort().map((value) => ({ value, label: moduleLabel(value) }))
  }, [logs])

  const actionOptions = useMemo(() => {
    const values = Array.from(new Set(logs.map((log) => log.action)))
    return values.sort().map((value) => ({ value, label: humanize(value) }))
  }, [logs])

  const userOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const log of logs) {
      if (log.user) {
        map.set(log.user.id, log.user.fullName)
      }
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [logs])

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        if (!matchesSearch(log, filters.search.trim())) {
          return false
        }
        if (filters.module && log.entityType !== filters.module) {
          return false
        }
        if (filters.action && log.action !== filters.action) {
          return false
        }
        if (filters.userId && log.user?.id !== filters.userId) {
          return false
        }
        return inRange(log.createdAt, filters.from, filters.to)
      }),
    [logs, filters],
  )

  const stats = useMemo(() => {
    const nonDateMatch = (log: AuditLog) =>
      matchesSearch(log, filters.search.trim()) &&
      (!filters.module || log.entityType === filters.module) &&
      (!filters.action || log.action === filters.action) &&
      (!filters.userId || log.user?.id === filters.userId)
    const end = filters.to ? dayjs(filters.to).endOf('day') : dayjs()
    const start = filters.from ? dayjs(filters.from).startOf('day') : end.subtract(6, 'day').startOf('day')
    const duration = Math.max(1, end.diff(start, 'day') + 1)
    const prevEnd = start.subtract(1, 'day').endOf('day')
    const prevStart = start.subtract(duration, 'day').startOf('day')
    const currentWindow = logs.filter(
      (log) => nonDateMatch(log) && inRange(log.createdAt, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')),
    )
    const previous = logs.filter(
      (log) => nonDateMatch(log) && inRange(log.createdAt, prevStart.format('YYYY-MM-DD'), prevEnd.format('YYYY-MM-DD')),
    )
    const current = filters.from || filters.to ? currentWindow : logs.filter(nonDateMatch)
    const compare = (pick: (items: AuditLog[]) => number) => percentChange(pick(currentWindow), pick(previous))
    return {
      total: { value: current.length, change: compare((items) => items.length) },
      users: {
        value: new Set(current.map((log) => log.user?.id).filter(Boolean)).size,
        change: compare((items) => new Set(items.map((log) => log.user?.id).filter(Boolean)).size),
      },
      modules: {
        value: new Set(current.map((log) => log.entityType).filter(Boolean)).size,
        change: compare((items) => new Set(items.map((log) => log.entityType).filter(Boolean)).size),
      },
      critical: {
        value: current.filter((log) => isCritical(log.action)).length,
        change: compare((items) => items.filter((log) => isCritical(log.action)).length),
      },
    }
  }, [logs, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const activeLog = filtered.find((log) => log.id === activeId) || null
  const pageSelectedCount = pageRows.filter((log) => selectedIds.includes(log.id)).length

  function updateFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
    setSelectedIds([])
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setPage(1)
    setSelectedIds([])
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function togglePageSelected() {
    const ids = pageRows.map((log) => log.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    setSelectedIds((current) => (allSelected ? current.filter((id) => !ids.includes(id)) : Array.from(new Set([...current, ...ids]))))
  }

  const exportItems: MenuProps['items'] = [
    {
      key: 'filtered',
      label: 'Export filtered CSV',
      onClick: () => downloadCsv(filtered),
    },
    {
      key: 'selected',
      label: 'Export selected CSV',
      disabled: selectedIds.length === 0,
      onClick: () => downloadCsv(logs.filter((log) => selectedIds.includes(log.id))),
    },
  ]

  return (
    <div className={cx(adminPage, 'gap-[18px]')}>
      <PageMeta
        title="Audit Log"
        description="Track all important actions, data changes and system events across the CRM."
      />
      <PageHeader
        title="Audit Log"
        subtitle="Track all important actions, data changes and system events across the CRM."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Audit Log' }]}
        extra={
          <Dropdown menu={{ items: exportItems }} trigger={['click']}>
            <span>
              <Button className="min-w-[132px]" variant="secondary">
                Export Logs
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
              </Button>
            </span>
          </Dropdown>
        }
      />

      {message ? <p className={adminBanner}>{message}</p> : null}

      <div className="grid gap-4 min-w-0">
        <div className="grid gap-4 min-w-0">
          <section className="grid grid-cols-4 gap-3 max-[1280px]:grid-cols-2 max-[860px]:grid-cols-1">
            <StatCard tone="blue" icon={File01Icon} label="Total Logs" value={stats.total.value} change={stats.total.change} />
            <StatCard tone="violet" icon={UserMultiple02Icon} label="Unique Users" value={stats.users.value} change={stats.users.change} />
            <StatCard
              tone="violet"
              icon={DashboardSquare01Icon}
              label="Modules"
              value={stats.modules.value}
              change={stats.modules.change}
            />
            <StatCard
              tone="green"
              icon={Alert02Icon}
              label="Critical Actions"
              value={stats.critical.value}
              change={stats.critical.change}
            />
          </section>

          <section
            className={cx(
              'grid grid-cols-[minmax(180px,1.4fr)_repeat(3,minmax(120px,0.9fr))_minmax(220px,1.2fr)] gap-x-3 gap-y-2.5 items-end py-3.5 px-4',
              surfaceCard,
              filterControl,
              'max-[860px]:grid-cols-2 max-sm:grid-cols-1',
            )}
          >
            <div className="grid grid-rows-[auto_42px] gap-1.5 min-w-0 m-0">
              <span className="text-text-muted text-[0.78rem] font-semibold leading-[1.2]">Search</span>
              <Input
                allowClear
                placeholder="User, action, record ID..."
                value={filters.search}
                onChange={(event) => updateFilters({ search: event.target.value })}
              />
            </div>
            <div className="grid grid-rows-[auto_42px] gap-1.5 min-w-0 m-0">
              <span className="text-text-muted text-[0.78rem] font-semibold leading-[1.2]">Module</span>
              <Select
                allowClear
                placeholder="All Modules"
                value={filters.module || undefined}
                options={moduleOptions}
                onChange={(value) => updateFilters({ module: String(value || '') })}
              />
            </div>
            <div className="grid grid-rows-[auto_42px] gap-1.5 min-w-0 m-0">
              <span className="text-text-muted text-[0.78rem] font-semibold leading-[1.2]">Action</span>
              <Select
                allowClear
                placeholder="All Actions"
                value={filters.action || undefined}
                options={actionOptions}
                onChange={(value) => updateFilters({ action: String(value || '') })}
              />
            </div>
            <div className="grid grid-rows-[auto_42px] gap-1.5 min-w-0 m-0">
              <span className="text-text-muted text-[0.78rem] font-semibold leading-[1.2]">User</span>
              <Select
                allowClear
                placeholder="All Users"
                value={filters.userId || undefined}
                options={userOptions}
                onChange={(value) => updateFilters({ userId: String(value || '') })}
              />
            </div>
            <div className="grid grid-rows-[auto_42px] gap-1.5 min-w-0 m-0">
              <span className="text-text-muted text-[0.78rem] font-semibold leading-[1.2]">Date Range</span>
              <DatePicker.RangePicker
                allowClear
                value={filters.from && filters.to ? [toDayjs(filters.from), toDayjs(filters.to)] : null}
                format="D MMM YYYY"
                onChange={(value) =>
                  updateFilters({
                    from: toDateString(value?.[0] || null),
                    to: toDateString(value?.[1] || null),
                  })
                }
              />
            </div>
          </section>

          <section className={cx(adminCard, 'rounded-[18px] p-0 overflow-hidden')}>
            <div className="pt-3 px-4 text-text-muted text-[0.82rem]">
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filtered.length)} of {filtered.length.toLocaleString()} logs
            </div>
            <Spin spinning={loading}>
              {!loading && filtered.length === 0 ? (
                <div className={adminEmpty}>
                  <strong>{message ? 'Unable to load audit logs' : 'No matching audit events'}</strong>
                  <p>
                    {message
                      ? message
                      : 'Try a different search, module, user, or date range, or clear the current filters.'}
                  </p>
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto max-w-full">
                  <table className={cx(adminTable, 'min-w-[1080px] [&_th]:align-middle [&_th]:whitespace-nowrap [&_th]:text-[0.82rem] [&_td]:align-middle [&_td]:whitespace-nowrap [&_td]:text-[0.82rem] [&_th:first-child]:w-[42px] [&_th:first-child]:pl-4 [&_td:first-child]:w-[42px] [&_td:first-child]:pl-4 [&_th:last-child]:w-11 [&_th:last-child]:text-right [&_th:last-child]:pr-3 [&_td:last-child]:w-11 [&_td:last-child]:text-right [&_td:last-child]:pr-3')}>
                    <thead>
                      <tr>
                        <th>
                          <input
                            className="size-4 accent-[#6366f1] cursor-pointer"
                            type="checkbox"
                            checked={pageRows.length > 0 && pageSelectedCount === pageRows.length}
                            onChange={togglePageSelected}
                            aria-label="Select page"
                          />
                        </th>
                        <th>Log ID</th>
                        <th>Date & Time</th>
                        <th>User</th>
                        <th>Module</th>
                        <th>Action</th>
                        <th>Record ID</th>
                        <th>IP Address</th>
                        <th>Device</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((log) => {
                        const selected = selectedIds.includes(log.id)
                        const active = activeLog?.id === log.id
                        return (
                          <tr
                            key={log.id}
                            className={cx(
                              'cursor-pointer',
                              active && 'bg-indigo-500/10',
                            )}
                            onClick={() => setActiveId(log.id)}
                          >
                            <td onClick={(event) => event.stopPropagation()}>
                              <input
                                className="size-4 accent-[#6366f1] cursor-pointer"
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelected(log.id)}
                                aria-label={`Select ${logCode(log.id)}`}
                              />
                            </td>
                            <td className="font-bold text-text">{logCode(log.id)}</td>
                            <td>{formatDateTime(log.createdAt)}</td>
                            <td>{log.user?.fullName || 'System'}</td>
                            <td>
                              <span className={cx(auditPill, moduleToneClass(log.entityType))}>
                                {moduleLabel(log.entityType)}
                              </span>
                            </td>
                            <td>
                              <span className={cx(auditPill, actionTone[actionToneKey(log.action)])}>
                                {humanize(log.action)}
                              </span>
                            </td>
                            <td>{recordCode(log.entityType, log.entityId)}</td>
                            <td>{log.ipAddress || '—'}</td>
                            <td>{parseDevice(log.userAgent)}</td>
                            <td>
                              <button
                                type="button"
                                className={cx(
                                  'grid place-items-center size-7 ml-auto border-0 rounded-lg bg-transparent text-text-muted cursor-pointer hover:text-[#6366f1] hover:bg-indigo-500/10',
                                  active && 'text-[#6366f1] bg-indigo-500/10',
                                )}
                                aria-label="View details"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setActiveId(log.id)
                                }}
                              >
                                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Spin>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {pageItems(safePage, totalPages).map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${index}`} className="min-w-8 h-8 px-2 grid place-items-center text-text-muted font-semibold">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={cx(pageBtn, item === safePage && pageBtnActive)}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
              <label className="flex items-center gap-2 text-text-muted text-[0.82rem] mb-0 [&_.ant-select]:w-[84px]">
                <Select
                  value={pageSize}
                  options={PAGE_SIZE_OPTIONS.map((value) => ({ value, label: String(value) }))}
                  onChange={(value) => {
                    setPageSize(Number(value))
                    setPage(1)
                  }}
                />
                per page
              </label>
            </div>
          </section>
        </div>
      </div>

      {activeLog
        ? createPortal(
            <div className={modalBackdrop} onClick={() => setActiveId(null)}>
              <div
                className={cx(modalPanel, 'grid content-start gap-4 w-[min(100%,560px)]')}
                role="dialog"
                aria-modal="true"
                aria-labelledby="audit-details-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={cx(modalHeader, 'mb-0')}>
                  <div className="flex flex-1 items-center justify-between gap-2.5 min-w-0">
                    <h3 id="audit-details-title" className="m-0 text-base">
                      Log Details
                    </h3>
                    <span className="text-text-faint text-[0.78rem] font-semibold">{logCode(activeLog.id)}</span>
                  </div>
                  <button type="button" className={modalClose} aria-label="Close" onClick={() => setActiveId(null)}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="grid gap-1.5">
                  <h4 className="m-0 text-[1.02rem]">{humanize(activeLog.action)}</h4>
                  <p className="m-0 text-text-muted text-[0.84rem]">{summaryText(activeLog)}</p>
                </div>
                <dl className="grid gap-2.5 m-0">
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 items-start text-[0.84rem]">
                    <dt className="m-0 text-text-muted">Date & Time</dt>
                    <dd className="m-0 text-text font-semibold [overflow-wrap:anywhere]">{formatDateTime(activeLog.createdAt)}</dd>
                  </div>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 items-start text-[0.84rem]">
                    <dt className="m-0 text-text-muted">User</dt>
                    <dd className="m-0 text-text font-semibold [overflow-wrap:anywhere]">
                      <div className="grid gap-px">
                        <span>{activeLog.user?.fullName || 'System'}</span>
                        {activeLog.user?.email ? (
                          <small className="text-text-faint font-medium">{activeLog.user.email}</small>
                        ) : null}
                      </div>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 items-start text-[0.84rem]">
                    <dt className="m-0 text-text-muted">Module</dt>
                    <dd className="m-0 text-text font-semibold [overflow-wrap:anywhere]">
                      <span className={cx(auditPill, moduleToneClass(activeLog.entityType))}>
                        {moduleLabel(activeLog.entityType)}
                      </span>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 items-start text-[0.84rem]">
                    <dt className="m-0 text-text-muted">Record ID</dt>
                    <dd className="m-0 text-text font-semibold [overflow-wrap:anywhere]">
                      {recordCode(activeLog.entityType, activeLog.entityId)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 items-start text-[0.84rem]">
                    <dt className="m-0 text-text-muted">IP Address</dt>
                    <dd className="m-0 text-text font-semibold [overflow-wrap:anywhere]">{activeLog.ipAddress || '—'}</dd>
                  </div>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 items-start text-[0.84rem]">
                    <dt className="m-0 text-text-muted">Device</dt>
                    <dd className="m-0 text-text font-semibold [overflow-wrap:anywhere]">{parseDevice(activeLog.userAgent)}</dd>
                  </div>
                </dl>
                {changePairs(activeLog.metadata).length ? (
                  <>
                    <h4 className="mt-1 mb-0 text-text text-[0.92rem]">Change Details</h4>
                    {changePairs(activeLog.metadata).map((change) => (
                      <div key={change.label} className="flex flex-wrap items-center gap-2">
                        <span className="w-full text-text-muted text-[0.8rem]">{change.label}</span>
                        <span className={cx(auditPill, actionTone.rejected)}>{change.from}</span>
                        <span className="text-text-faint">→</span>
                        <span className={cx(auditPill, actionTone.created)}>{change.to}</span>
                        <div className="flex justify-between gap-3 w-full text-text-faint text-[0.7rem]">
                          <span>Previous Value</span>
                          <span>New Value</span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}
                {extraMetadata(activeLog.metadata).length ? (
                  <>
                    <h4 className="mt-1 mb-0 text-text text-[0.92rem]">Additional Info</h4>
                    <dl className="grid gap-2">
                      {extraMetadata(activeLog.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-3 text-[0.84rem]">
                          <dt className="m-0 text-text-muted">{humanize(key)}</dt>
                          <dd className="m-0 font-semibold text-right [overflow-wrap:anywhere]">{stringifyMeta(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : null}
                <div className="flex gap-2.5 items-start mt-1 p-3 rounded-xl bg-[#eef2ff] text-[#4338ca] text-[0.8rem] leading-[1.45] dark:bg-indigo-500/20 dark:text-[#c7d2fe]">
                  <span className="shrink-0 size-[18px] grid place-items-center mt-px rounded-full bg-[#c7d2fe] font-extrabold text-[0.72rem] dark:bg-indigo-500/40">
                    i
                  </span>
                  This log is immutable and cannot be edited or deleted by regular users.
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
