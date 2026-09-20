import { useEffect, useMemo, useState } from 'react'
import { DatePicker, Dropdown, Spin } from 'antd'
import type { MenuProps } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  DashboardSquare01Icon,
  File01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { listAuditLogs } from '../api/client'
import { readUrlSearchQuery } from '../lib/url-search'
import Button from '../components/Button'
import Input from '../components/Input'
import PageHeader from '../components/PageHeader'
import Select from '../components/Select'
import type { AuditLog } from '../types'
import { useLocation } from 'react-router-dom'
import './admin.css'
import './AuditLogs.css'

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

function moduleClass(entityType: string | null | undefined) {
  const key = (entityType || 'system').toLowerCase().replace(/[\s_]+/g, '-')
  const known = [
    'lead',
    'payment',
    'document',
    'user',
    'communication',
    'master-data',
    'permission',
    'role',
    'employee',
    'service',
    'session',
  ]
  return known.includes(key) ? `module-${key}` : 'module-session'
}

function actionClass(action: string) {
  const text = action.toLowerCase()
  if (text.includes('status')) return 'action-status'
  if (text.includes('creat')) return 'action-created'
  if (text.includes('verif')) return 'action-verified'
  if (text.includes('complet')) return 'action-completed'
  if (text.includes('assign')) return 'action-assigned'
  if (text.includes('role') || text.includes('chang')) return 'action-changed'
  if (text.includes('log')) return 'action-logged'
  if (text.includes('close')) return 'action-closed'
  if (text.includes('deny') || text.includes('denied')) return 'action-denied'
  if (text.includes('fail')) return 'action-failure'
  if (text.includes('lock')) return 'action-locked'
  if (text.includes('reject')) return 'action-rejected'
  if (text.includes('delet')) return 'action-deleted'
  if (text.includes('updat')) return 'action-updated'
  return 'action-default'
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

export default function AuditLogs() {
  const location = useLocation()
  const urlQuery = readUrlSearchQuery(location.search)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [draft, setDraft] = useState<Filters>({ ...EMPTY_FILTERS, search: urlQuery })
  const [applied, setApplied] = useState<Filters>({ ...EMPTY_FILTERS, search: urlQuery })
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
      setActiveId((current) => current || result.data.logs[0]?.id || null)
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
    setDraft((current) => ({ ...current, search: next }))
    setApplied((current) => ({ ...current, search: next }))
    setPage(1)
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
        if (!matchesSearch(log, applied.search.trim())) {
          return false
        }
        if (applied.module && log.entityType !== applied.module) {
          return false
        }
        if (applied.action && log.action !== applied.action) {
          return false
        }
        if (applied.userId && log.user?.id !== applied.userId) {
          return false
        }
        return inRange(log.createdAt, applied.from, applied.to)
      }),
    [logs, applied],
  )

  const stats = useMemo(() => {
    const nonDateMatch = (log: AuditLog) =>
      matchesSearch(log, applied.search.trim()) &&
      (!applied.module || log.entityType === applied.module) &&
      (!applied.action || log.action === applied.action) &&
      (!applied.userId || log.user?.id === applied.userId)
    const end = applied.to ? dayjs(applied.to).endOf('day') : dayjs()
    const start = applied.from ? dayjs(applied.from).startOf('day') : end.subtract(6, 'day').startOf('day')
    const duration = Math.max(1, end.diff(start, 'day') + 1)
    const prevEnd = start.subtract(1, 'day').endOf('day')
    const prevStart = start.subtract(duration, 'day').startOf('day')
    const currentWindow = logs.filter(
      (log) => nonDateMatch(log) && inRange(log.createdAt, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')),
    )
    const previous = logs.filter(
      (log) => nonDateMatch(log) && inRange(log.createdAt, prevStart.format('YYYY-MM-DD'), prevEnd.format('YYYY-MM-DD')),
    )
    const current = applied.from || applied.to ? currentWindow : logs.filter(nonDateMatch)
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
  }, [logs, applied])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const activeLog = filtered.find((log) => log.id === activeId) || pageRows[0] || null
  const pageSelectedCount = pageRows.filter((log) => selectedIds.includes(log.id)).length

  function applyFilters(next = draft) {
    setApplied(next)
    setPage(1)
    setSelectedIds([])
    setActiveId(null)
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS)
    applyFilters(EMPTY_FILTERS)
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
    <div className="admin-page audit-page">
      <PageHeader title="Audit Log" description="Track all important actions, data changes and system events across the CRM.">
        <div className="audit-header-actions">
          <Dropdown menu={{ items: exportItems }} trigger={['click']}>
            <span>
              <Button className="audit-export-btn" variant="secondary">
                Export Logs
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
              </Button>
            </span>
          </Dropdown>
        </div>
      </PageHeader>

      {message ? <p className="admin-banner">{message}</p> : null}

      <div className="audit-body">
        <div className="audit-main">
          <section className="audit-stats">
            <article className="audit-stat tone-blue">
              <span className="audit-stat-icon">
                <HugeiconsIcon icon={File01Icon} size={18} />
              </span>
              <div className="audit-stat-copy">
                <p>Total Logs</p>
                <strong>{stats.total.value.toLocaleString()}</strong>
                <div className={`audit-stat-change ${stats.total.change >= 0 ? 'is-up' : 'is-down'}`}>
                  <b>
                    {stats.total.change >= 0 ? '↑' : '↓'} {Math.abs(stats.total.change)}%
                  </b>
                  vs previous period
                </div>
              </div>
            </article>
            <article className="audit-stat tone-violet">
              <span className="audit-stat-icon">
                <HugeiconsIcon icon={UserMultiple02Icon} size={18} />
              </span>
              <div className="audit-stat-copy">
                <p>Unique Users</p>
                <strong>{stats.users.value.toLocaleString()}</strong>
                <div className={`audit-stat-change ${stats.users.change >= 0 ? 'is-up' : 'is-down'}`}>
                  <b>
                    {stats.users.change >= 0 ? '↑' : '↓'} {Math.abs(stats.users.change)}%
                  </b>
                  vs previous period
                </div>
              </div>
            </article>
            <article className="audit-stat tone-violet">
              <span className="audit-stat-icon">
                <HugeiconsIcon icon={DashboardSquare01Icon} size={18} />
              </span>
              <div className="audit-stat-copy">
                <p>Modules</p>
                <strong>{stats.modules.value.toLocaleString()}</strong>
                <div className={`audit-stat-change ${stats.modules.change >= 0 ? 'is-up' : 'is-down'}`}>
                  <b>
                    {stats.modules.change >= 0 ? '↑' : '↓'} {Math.abs(stats.modules.change)}%
                  </b>
                  vs previous period
                </div>
              </div>
            </article>
            <article className="audit-stat tone-green">
              <span className="audit-stat-icon">
                <HugeiconsIcon icon={Alert02Icon} size={18} />
              </span>
              <div className="audit-stat-copy">
                <p>Critical Actions</p>
                <strong>{stats.critical.value.toLocaleString()}</strong>
                <div className={`audit-stat-change ${stats.critical.change >= 0 ? 'is-up' : 'is-down'}`}>
                  <b>
                    {stats.critical.change >= 0 ? '↑' : '↓'} {Math.abs(stats.critical.change)}%
                  </b>
                  vs previous period
                </div>
              </div>
            </article>
          </section>

          <section className="audit-filters">
            <div className="audit-filter-field">
              <span>Search</span>
              <Input
                allowClear
                placeholder="User, action, record ID..."
                value={draft.search}
                onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))}
                onPressEnter={() => applyFilters()}
              />
            </div>
            <div className="audit-filter-field">
              <span>Module</span>
              <Select
                allowClear
                placeholder="All Modules"
                value={draft.module || undefined}
                options={moduleOptions}
                onChange={(value) => setDraft((current) => ({ ...current, module: String(value || '') }))}
              />
            </div>
            <div className="audit-filter-field">
              <span>Action</span>
              <Select
                allowClear
                placeholder="All Actions"
                value={draft.action || undefined}
                options={actionOptions}
                onChange={(value) => setDraft((current) => ({ ...current, action: String(value || '') }))}
              />
            </div>
            <div className="audit-filter-field">
              <span>User</span>
              <Select
                allowClear
                placeholder="All Users"
                value={draft.userId || undefined}
                options={userOptions}
                onChange={(value) => setDraft((current) => ({ ...current, userId: String(value || '') }))}
              />
            </div>
            <div className="audit-filter-field">
              <span>Date Range</span>
              <DatePicker.RangePicker
                allowClear
                value={draft.from && draft.to ? [toDayjs(draft.from), toDayjs(draft.to)] : null}
                format="D MMM YYYY"
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    from: toDateString(value?.[0] || null),
                    to: toDateString(value?.[1] || null),
                  }))
                }
              />
            </div>
            <div className="audit-filter-field audit-filter-actions">
              <span className="audit-filter-actions-label" aria-hidden="true">
                Actions
              </span>
              <div className="audit-filter-buttons">
                <Button variant="secondary" onClick={clearFilters}>
                  Clear
                </Button>
                <Button onClick={() => applyFilters()}>Apply</Button>
              </div>
            </div>
          </section>

          <section className="admin-card table-wrap audit-table-card">
            <div className="audit-table-meta">
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filtered.length)} of {filtered.length.toLocaleString()} logs
            </div>
            <Spin spinning={loading}>
              {!loading && filtered.length === 0 ? (
                <div className="admin-empty">
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
                <div className="audit-table-wrap">
                  <table className="admin-table audit-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            className="audit-check"
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
                            className={active ? 'is-active' : undefined}
                            onClick={() => setActiveId(log.id)}
                          >
                            <td onClick={(event) => event.stopPropagation()}>
                              <input
                                className="audit-check"
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelected(log.id)}
                                aria-label={`Select ${logCode(log.id)}`}
                              />
                            </td>
                            <td className="audit-log-id">{logCode(log.id)}</td>
                            <td>{formatDateTime(log.createdAt)}</td>
                            <td>{log.user?.fullName || 'System'}</td>
                            <td>
                              <span className={`audit-pill ${moduleClass(log.entityType)}`}>{moduleLabel(log.entityType)}</span>
                            </td>
                            <td>
                              <span className={`audit-pill ${actionClass(log.action)}`}>{humanize(log.action)}</span>
                            </td>
                            <td>{recordCode(log.entityType, log.entityId)}</td>
                            <td>{log.ipAddress || '—'}</td>
                            <td>{parseDevice(log.userAgent)}</td>
                            <td>
                              <button
                                type="button"
                                className="audit-row-open"
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
            <div className="audit-pagination">
              <div className="audit-pages">
                {pageItems(safePage, totalPages).map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${index}`} className="audit-page-ellipsis">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`audit-page-btn${item === safePage ? ' is-active' : ''}`}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
              <label className="audit-page-size">
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

        <aside className="audit-details">
          <div className="audit-details-head">
            <h3>Log Details</h3>
            {activeLog ? <span className="audit-details-id">{logCode(activeLog.id)}</span> : null}
          </div>
          {activeLog ? (
            <>
              <div className="audit-details-title">
                <span className={`audit-pill ${actionClass(activeLog.action)}`}>{humanize(activeLog.action)}</span>
                <h4>{humanize(activeLog.action)}</h4>
                <p>{summaryText(activeLog)}</p>
              </div>
              <dl className="audit-details-list">
                <div>
                  <dt>Date & Time</dt>
                  <dd>{formatDateTime(activeLog.createdAt)}</dd>
                </div>
                <div>
                  <dt>User</dt>
                  <dd>
                    <div className="audit-user-cell">
                      <span>{activeLog.user?.fullName || 'System'}</span>
                      {activeLog.user?.email ? <small>{activeLog.user.email}</small> : null}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt>Module</dt>
                  <dd>
                    <span className={`audit-pill ${moduleClass(activeLog.entityType)}`}>
                      {moduleLabel(activeLog.entityType)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Record ID</dt>
                  <dd>{recordCode(activeLog.entityType, activeLog.entityId)}</dd>
                </div>
                <div>
                  <dt>IP Address</dt>
                  <dd>{activeLog.ipAddress || '—'}</dd>
                </div>
                <div>
                  <dt>Device</dt>
                  <dd>{parseDevice(activeLog.userAgent)}</dd>
                </div>
              </dl>
              {changePairs(activeLog.metadata).length ? (
                <>
                  <h4 className="audit-section-title">Change Details</h4>
                  {changePairs(activeLog.metadata).map((change) => (
                    <div key={change.label} className="audit-change">
                      <span className="audit-change-label">{change.label}</span>
                      <span className="audit-pill action-rejected">{change.from}</span>
                      <span className="audit-arrow">→</span>
                      <span className="audit-pill action-created">{change.to}</span>
                      <div className="audit-change-hint">
                        <span>Previous Value</span>
                        <span>New Value</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : null}
              {extraMetadata(activeLog.metadata).length ? (
                <>
                  <h4 className="audit-section-title">Additional Info</h4>
                  <dl className="audit-extra">
                    {extraMetadata(activeLog.metadata).map(([key, value]) => (
                      <div key={key}>
                        <dt>{humanize(key)}</dt>
                        <dd>{stringifyMeta(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : null}
              <div className="audit-note">
                <span className="audit-note-icon">i</span>
                This log is immutable and cannot be edited or deleted by regular users.
              </div>
            </>
          ) : (
            <p className="audit-empty-details">Select a log from the table to inspect its details.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
