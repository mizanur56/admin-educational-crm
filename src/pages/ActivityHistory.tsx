import { useEffect, useMemo, useRef, useState } from 'react'
import { DatePicker, Dropdown, Spin } from 'antd'
import type { MenuProps } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Activity01Icon,
  ArrowDown01Icon,
  Calendar03Icon,
  Call02Icon,
  File01Icon,
  Mail01Icon,
  Message01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { createActivity, listActivityFeed, recordActivityExport } from '../api/client'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import UserAvatar from '../components/UserAvatar'
import { hasPermission } from '../lib/access'
import { readUrlSearchQuery } from '../lib/url-search'
import type { ActivityFeedCategory, ActivityFeedItem, ActivityFeedResponse, ActivitySummaryStat, AuthSession } from '../types'
import { useLocation, useOutletContext } from 'react-router-dom'
import './admin.css'
import './ActivityHistory.css'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const EMPTY_COUNTS: ActivityFeedResponse['counts'] = {
  all: 0,
  call: 0,
  message: 0,
  meeting: 0,
  email: 0,
  document: 0,
  status: 0,
  assignment: 0,
  payment: 0,
  file: 0,
  system: 0,
}

const EMPTY_STAT: ActivitySummaryStat = { value: 0, change: 0, series: [0, 0, 0, 0, 0, 0, 0] }

const FILTERS: Array<{ key: 'all' | ActivityFeedCategory; label: string; icon: typeof Call02Icon }> = [
  { key: 'all', label: 'All Activities', icon: Activity01Icon },
  { key: 'call', label: 'Calls', icon: Call02Icon },
  { key: 'message', label: 'Messages', icon: Message01Icon },
  { key: 'meeting', label: 'Meetings', icon: Calendar03Icon },
  { key: 'email', label: 'Emails', icon: Mail01Icon },
  { key: 'document', label: 'Documents', icon: File01Icon },
  { key: 'status', label: 'Status Changes', icon: Activity01Icon },
  { key: 'assignment', label: 'Assignments', icon: UserMultiple02Icon },
  { key: 'payment', label: 'Payments', icon: File01Icon },
  { key: 'file', label: 'File Actions', icon: File01Icon },
  { key: 'system', label: 'System Events', icon: Activity01Icon },
]

function toDateString(value: Dayjs | null) {
  return value ? value.format('YYYY-MM-DD') : ''
}

function formatDateTime(value: string | Date) {
  return dayjs(value).format('D MMM YYYY, h:mm A')
}

function parseDevice(userAgent: string | null | undefined) {
  if (!userAgent) return '—'
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

function avatarTone(name: string) {
  const tones = ['blue', 'violet', 'teal', 'orange', 'rose', 'green']
  let hash = 0
  for (const char of name) hash = (hash + char.charCodeAt(0)) % tones.length
  return tones[hash]
}

function actionClass(action: string, category: string) {
  const key = `${action} ${category}`.toLowerCase()
  if (key.includes('call')) return 'ah-pill-call'
  if (key.includes('payment') || key.includes('discount')) return 'ah-pill-payment'
  if (key.includes('document')) return 'ah-pill-document'
  if (key.includes('application')) return 'ah-pill-application'
  if (key.includes('user') || key.includes('role')) return 'ah-pill-user'
  if (key.includes('message') || key.includes('email') || key.includes('communication') || key.includes('meeting')) {
    return 'ah-pill-comm'
  }
  if (key.includes('file')) return 'ah-pill-file'
  if (key.includes('permission')) return 'ah-pill-permission'
  if (key.includes('master')) return 'ah-pill-master'
  if (key.includes('status')) return 'ah-pill-status'
  return 'ah-pill-default'
}

function pageItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const items: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) items.push('ellipsis')
  for (let page = start; page <= end; page += 1) items.push(page)
  if (end < total - 1) items.push('ellipsis')
  items.push(total)
  return items
}

function csvValue(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default function ActivityHistory() {
  const auth = useOutletContext<AuthSession>()
  const location = useLocation()
  const canCreate = hasPermission(auth, 'activity:create')
  const [from, setFrom] = useState(dayjs().subtract(6, 'day').format('YYYY-MM-DD'))
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'))
  const [category, setCategory] = useState<'all' | ActivityFeedCategory>('all')
  const [search, setSearch] = useState(() => readUrlSearchQuery(location.search))
  const [userId, setUserId] = useState('')
  const [items, setItems] = useState<ActivityFeedItem[]>([])
  const [counts, setCounts] = useState(EMPTY_COUNTS)
  const [summary, setSummary] = useState<ActivityFeedResponse['summary']>({
    call: EMPTY_STAT,
    message: EMPTY_STAT,
    meeting: EMPTY_STAT,
    email: EMPTY_STAT,
    document: EMPTY_STAT,
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [logType, setLogType] = useState('CALL')
  const [logName, setLogName] = useState('')
  const [logDuration, setLogDuration] = useState('5')
  const [logOutcome, setLogOutcome] = useState('Interested')
  const [logNotes, setLogNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const syncedSearch = useRef(false)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function applySearch(next: string) {
    setSearch(next)
    window.clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      setPage(1)
      void load({ from, to, category, search: next, userId })
    }, 350)
  }

  async function load(next = { from, to, category, search, userId }) {
    setLoading(true)
    const result = await listActivityFeed({
      from: next.from,
      to: next.to,
      category: next.category === 'all' ? '' : next.category,
      search: next.search,
      userId: next.userId,
    })
    if (result.ok) {
      setItems(result.data.items)
      setCounts(result.data.counts)
      setSummary(result.data.summary)
      setMessage('')
    } else {
      setItems([])
      setCounts(EMPTY_COUNTS)
      setMessage(result.data?.error || 'Unable to load activity history.')
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const next = readUrlSearchQuery(location.search)
    setSearch(next)
    if (syncedSearch.current) {
      void load({ from, to, category, search: next, userId })
    }
    syncedSearch.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const active = items.find((item) => item.id === activeId) || null
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = items.slice((safePage - 1) * pageSize, safePage * pageSize)

  const related = useMemo(() => {
    if (!active) return []
    return items
      .filter((item) => {
        if (item.id === active.id) return true
        if (active.relatedId && item.relatedId === active.relatedId) return true
        if (active.relatedName && item.relatedName === active.relatedName) return true
        return false
      })
      .slice(0, 8)
      .sort((a, b) => dayjs(a.occurredAt).valueOf() - dayjs(b.occurredAt).valueOf())
  }, [active, items])

  const userOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) {
      if (item.user) map.set(item.user.id, item.user.fullName)
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [items])

  function applyRange(nextFrom: string, nextTo: string) {
    if (!nextFrom || !nextTo) {
      setMessage('Please select a valid date range.')
      return
    }
    setFrom(nextFrom)
    setTo(nextTo)
    setPage(1)
    void load({ from: nextFrom, to: nextTo, category, search, userId })
  }

  function applyCategory(next: 'all' | ActivityFeedCategory) {
    setCategory(next)
    setPage(1)
    setActiveId(null)
    setDetailOpen(false)
    void load({ from, to, category: next, search, userId })
  }

  function downloadCsv() {
    if (!items.length) {
      setMessage('Unable to export the audit log. Please try again.')
      return
    }
    const header = ['Date & Time', 'User', 'Action', 'Module', 'Details', 'IP Address']
    const rows = items.map((item) =>
      [
        formatDateTime(item.occurredAt),
        item.user?.fullName || 'System',
        item.action,
        item.module,
        item.details,
        item.ipAddress || '—',
      ]
        .map(csvValue)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `activity-history-${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    void recordActivityExport(items.length)
  }

  const exportItems: MenuProps['items'] = [
    { key: 'csv', label: 'Export CSV', onClick: downloadCsv },
  ]

  async function submitLog() {
    setSaving(true)
    const result = await createActivity({
      type: logType,
      relatedName: logName || active?.relatedName || undefined,
      durationMin: logType === 'CALL' || logType === 'MEETING' ? Number(logDuration) || null : null,
      outcome: logOutcome,
      notes: logNotes,
    })
    setSaving(false)
    if (result.ok) {
      setLogOpen(false)
      setLogNotes('')
      await load()
    } else {
      setMessage(result.data?.error || 'Unable to save activity.')
    }
  }

  const cards = [
    { key: 'call', title: 'Calls', icon: Call02Icon, tone: 'teal', stat: summary.call },
    { key: 'message', title: 'Messages', icon: Message01Icon, tone: 'lavender', stat: summary.message },
    { key: 'meeting', title: 'Meetings', icon: Calendar03Icon, tone: 'plum', stat: summary.meeting },
    { key: 'email', title: 'Emails', icon: Mail01Icon, tone: 'magenta', stat: summary.email },
    { key: 'document', title: 'Documents', icon: File01Icon, tone: 'sky', stat: summary.document },
  ] as const
  const maxStat = Math.max(...cards.map((card) => card.stat.value), 0)

  return (
    <div className="admin-page ah-page">
      <header className="ah-header">
        <div className="ah-header-copy">
          <span className="ah-header-icon">
            <HugeiconsIcon icon={Activity01Icon} size={18} />
          </span>
          <div>
            <h2>Activity History</h2>
            <p>View all activities, communications and actions performed by your team members.</p>
          </div>
        </div>
        <div className="ah-header-actions">
          <Dropdown menu={{ items: exportItems }} trigger={['click']}>
            <span>
              <Button variant="secondary">
                Export
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
              </Button>
            </span>
          </Dropdown>
        </div>
      </header>

      <section className="ah-filters-bar">
        <DatePicker.RangePicker
          allowClear={false}
          value={[dayjs(from), dayjs(to)]}
          format="D MMM YYYY"
          onChange={(value) => applyRange(toDateString(value?.[0] || null), toDateString(value?.[1] || null))}
        />
        <Input
          allowClear
          placeholder="Search activities..."
          value={search}
          onChange={(event) => applySearch(event.target.value)}
        />
        <Select
          allowClear
          placeholder="All users"
          value={userId || undefined}
          options={userOptions}
          onChange={(value) => {
            const next = String(value || '')
            setUserId(next)
            setPage(1)
            void load({ from, to, category, search, userId: next })
          }}
        />
      </section>

      {message ? <p className="admin-banner">{message}</p> : null}

      <section className="ah-stats">
        {cards.map((card) => {
          const percent = maxStat > 0 ? Math.round((card.stat.value / maxStat) * 100) : 0
          return (
            <article key={card.key} className={`ah-stat tone-${card.tone}`}>
              <span className="ah-stat-icon">
                <HugeiconsIcon icon={card.icon} size={18} />
              </span>
              <div className="ah-stat-copy">
                <p>{card.title}</p>
                <strong>{card.stat.value.toLocaleString()}</strong>
                <div className={`ah-stat-change ${card.stat.change >= 0 ? 'is-up' : 'is-down'}`}>
                  <b>
                    {card.stat.change >= 0 ? '↑' : '↓'} {Math.abs(card.stat.change)}%
                  </b>
                  <span>vs. previous 7 days</span>
                </div>
              </div>
              <div className="ah-stat-bar" aria-label={`${percent}%`}>
                <span style={{ width: `${percent}%` }} />
              </div>
            </article>
          )
        })}
      </section>

      <div className="ah-body">
        <aside className="ah-nav">
          <h3>Activity Timeline</h3>
          <ul>
            {FILTERS.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={category === item.key ? 'is-active' : undefined}
                  onClick={() => applyCategory(item.key)}
                >
                  <span>
                    <HugeiconsIcon icon={item.icon} size={16} />
                    {item.label}
                  </span>
                  <b>{counts[item.key].toLocaleString()}</b>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="admin-card ah-table-card">
          <div className="ah-table-head">
            <div>
              <h3>All Activities</h3>
              <span>{items.length.toLocaleString()} events</span>
            </div>
          </div>
          <Spin spinning={loading}>
            {!loading && items.length === 0 ? (
              <div className="admin-empty">
                <strong>No matching activities</strong>
                {canCreate ? (
                  <Button
                    onClick={() => {
                      setLogType('CALL')
                      setLogName('')
                      setLogOpen(true)
                    }}
                  >
                    Log activity
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="ah-table-wrap">
                <table className="admin-table ah-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Module</th>
                      <th>Details</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((item) => (
                      <tr
                        key={item.id}
                        className={detailOpen && active?.id === item.id ? 'is-active' : undefined}
                        onClick={() => {
                          setActiveId(item.id)
                          setDetailOpen(true)
                        }}
                      >
                        <td>{formatDateTime(item.occurredAt)}</td>
                        <td>
                          <div className="ah-user">
                            <UserAvatar
                              name={item.user?.fullName || 'System'}
                              photoUrl={item.user?.photoUrl}
                              className={`ah-avatar tone-${avatarTone(item.user?.fullName || 'System')}`}
                            />
                            <div>
                              <strong>{item.user?.fullName || 'System'}</strong>
                              <small>{item.user?.roleName || 'System'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`ah-pill ${actionClass(item.action, item.category)}`}>{item.action}</span>
                        </td>
                        <td>{item.module}</td>
                        <td className="ah-details-cell">{item.details}</td>
                        <td>{item.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Spin>
          <div className="ah-pagination">
            <div className="ah-pages">
              {pageItems(safePage, totalPages).map((item, index) =>
                item === 'ellipsis' ? (
                  <span key={`e-${index}`} className="ah-page-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`ah-page-btn${item === safePage ? ' is-active' : ''}`}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            <label className="ah-page-size">
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

      {detailOpen && active ? (
        <div
          className="modal-backdrop"
          onClick={() => {
            setDetailOpen(false)
            setActiveId(null)
          }}
        >
          <div className="modal-panel ah-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Activity Detail</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => {
                  setDetailOpen(false)
                  setActiveId(null)
                }}
              >
                ×
              </button>
            </div>
            <div className="ah-detail">
              <div className="ah-detail-head">
                <p>
                  {formatDateTime(active.occurredAt)} · {active.user?.fullName || 'System'}
                </p>
                <span className="ah-status">{active.status}</span>
              </div>
              <div className="ah-detail-title">
                <span className={`ah-pill ${actionClass(active.action, active.category)}`}>{active.action} Activity</span>
                <h4>
                  {active.user?.fullName || 'System'}
                  {active.user?.roleName ? <small> ({active.user.roleName})</small> : null}
                </h4>
              </div>
              <dl>
                <div>
                  <dt>Module</dt>
                  <dd>{active.module}</dd>
                </div>
                {active.relatedName ? (
                  <div>
                    <dt>Related To</dt>
                    <dd>
                      {active.relatedName}
                      {active.relatedType ? <small> ({active.relatedType})</small> : null}
                    </dd>
                  </div>
                ) : null}
                {active.durationMin ? (
                  <div>
                    <dt>Duration</dt>
                    <dd>{active.durationMin} min</dd>
                  </div>
                ) : null}
                {active.outcome ? (
                  <div>
                    <dt>Outcome</dt>
                    <dd>{active.outcome}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>IP Address</dt>
                  <dd>{active.ipAddress || '—'}</dd>
                </div>
                <div>
                  <dt>Device</dt>
                  <dd>{parseDevice(active.userAgent)}</dd>
                </div>
              </dl>
              {related.length ? (
                <>
                  <h4>Related Timeline</h4>
                  <ol className="ah-timeline">
                    {related.map((item) => (
                      <li key={item.id}>
                        <span />
                        <div>
                          <strong>{item.details}</strong>
                          <small>{formatDateTime(item.occurredAt)}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}
              {canCreate ? (
                <>
                  <h4>Quick Actions</h4>
                  <div className="ah-quick">
                    <button
                      type="button"
                      onClick={() => {
                        setLogType('CALL')
                        setLogName(active.relatedName || '')
                        setLogOpen(true)
                      }}
                    >
                      Call Again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLogType('MESSAGE')
                        setLogName(active.relatedName || '')
                        setLogOpen(true)
                      }}
                    >
                      Send Message
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {logOpen ? (
        <div className="modal-backdrop" onClick={() => setLogOpen(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Log {logType === 'CALL' ? 'Call' : 'Message'}</h3>
              <button type="button" className="modal-close" onClick={() => setLogOpen(false)}>
                ×
              </button>
            </div>
            <div className="admin-form">
              <label>
                Related to
                <Input value={logName} onChange={(event) => setLogName(event.target.value)} placeholder="Contact or student name" />
              </label>
              {logType === 'CALL' ? (
                <label>
                  Duration (minutes)
                  <Input value={logDuration} onChange={(event) => setLogDuration(event.target.value)} />
                </label>
              ) : null}
              <label>
                Outcome
                <Input value={logOutcome} onChange={(event) => setLogOutcome(event.target.value)} />
              </label>
              <label>
                Notes
                <Input value={logNotes} onChange={(event) => setLogNotes(event.target.value)} placeholder="What happened?" />
              </label>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setLogOpen(false)}>
                  Cancel
                </Button>
                <Button loading={saving} onClick={() => void submitLog()}>
                  Save activity
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
