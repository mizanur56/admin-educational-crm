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
import PageHeader from '../components/PageHeader'
import PageMeta from '../components/PageMeta'
import Select from '../components/Select'
import UserAvatar from '../components/UserAvatar'
import { hasPermission } from '../lib/access'
import { readUrlSearchQuery } from '../lib/url-search'
import type { ActivityFeedCategory, ActivityFeedItem, ActivityFeedResponse, ActivitySummaryStat, AuthSession } from '../types'
import { useLocation, useOutletContext } from 'react-router-dom'
import {
  adminBanner,
  adminEmpty,
  adminForm,
  adminPage,
  adminTable,
  modalBackdrop,
  modalClose,
  modalHeader,
  modalPanel,
} from '../styles/admin'

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

const surfaceCard =
  'bg-surface border border-border rounded-[18px] shadow-soft'

const ahPill =
  'inline-flex items-center px-2.5 py-[3px] rounded-full text-[0.72rem] font-bold'

const pillTone: Record<string, string> = {
  call: 'bg-[#e7f8ef] text-[#15803d]',
  payment: 'bg-[#fde8ef] text-[#be123c]',
  permission: 'bg-[#fde8ef] text-[#be123c]',
  document: 'bg-[#fff1e6] text-[#c2410c]',
  file: 'bg-[#fff1e6] text-[#c2410c]',
  status: 'bg-[#fff1e6] text-[#c2410c]',
  application: 'bg-[#e0f2fe] text-[#0369a1]',
  user: 'bg-[#ece8ff] text-[#6d28d9]',
  comm: 'bg-[#fff7d6] text-[#a16207]',
  master: 'bg-[#eef2f6] text-[#475569]',
  default: 'bg-[#eef2f6] text-[#475569]',
}

const avatarToneClass: Record<string, string> = {
  blue: 'bg-[#dbeafe] text-[#1d4ed8]',
  violet: 'bg-[#ede9fe] text-[#6d28d9]',
  teal: 'bg-[#ccfbf1] text-[#0f766e]',
  orange: 'bg-[#ffedd5] text-[#c2410c]',
  rose: 'bg-[#ffe4e6] text-[#be123c]',
  green: 'bg-[#dcfce7] text-[#15803d]',
}

const statTone: Record<string, { icon: string; bar: string }> = {
  teal: { icon: 'bg-[#d8f4ea] text-[#1fa387]', bar: 'bg-[#1fa387]' },
  lavender: { icon: 'bg-[#e7e8ff] text-[#6a6ef2]', bar: 'bg-[#6a6ef2]' },
  plum: { icon: 'bg-[#ece6f6] text-[#5d4d86]', bar: 'bg-[#5d4d86]' },
  magenta: { icon: 'bg-[#f4e5f8] text-[#a24dca]', bar: 'bg-[#a24dca]' },
  sky: { icon: 'bg-[#dceeff] text-[#3d8fd9]', bar: 'bg-[#3d8fd9]' },
}

const pageBtn =
  'min-w-8 h-8 border-0 rounded-lg bg-transparent text-text-muted font-semibold cursor-pointer'

const pageBtnActive = 'bg-primary text-on-primary'

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ')
}

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

function actionPillClass(action: string, category: string) {
  const key = `${action} ${category}`.toLowerCase()
  if (key.includes('call')) return pillTone.call
  if (key.includes('payment') || key.includes('discount')) return pillTone.payment
  if (key.includes('document')) return pillTone.document
  if (key.includes('application')) return pillTone.application
  if (key.includes('user') || key.includes('role')) return pillTone.user
  if (key.includes('message') || key.includes('email') || key.includes('communication') || key.includes('meeting')) {
    return pillTone.comm
  }
  if (key.includes('file')) return pillTone.file
  if (key.includes('permission')) return pillTone.permission
  if (key.includes('master')) return pillTone.master
  if (key.includes('status')) return pillTone.status
  return pillTone.default
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
    <div className={adminPage}>
      <PageMeta
        title="Activity History"
        description="View all activities, communications and actions performed by your team members."
      />
      <PageHeader
        title="Activity History"
        subtitle="View all activities, communications and actions performed by your team members."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Activity History' }]}
        extra={
          <Dropdown menu={{ items: exportItems }} trigger={['click']}>
            <span>
              <Button variant="secondary">
                Export
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
              </Button>
            </span>
          </Dropdown>
        }
      />

      <section className="grid grid-cols-[minmax(240px,280px)_minmax(200px,1.4fr)_minmax(160px,280px)] gap-2.5 items-center py-3 px-3.5 bg-surface border border-border rounded-2xl max-[860px]:grid-cols-1 [&_.ant-picker]:w-full [&_.ant-picker]:min-w-0 [&_.ant-picker]:h-[42px] [&_.ant-picker]:rounded-xl [&_.ant-input-affix-wrapper]:w-full [&_.ant-select]:w-full">
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

      {message ? <p className={adminBanner}>{message}</p> : null}

      <section className="grid grid-cols-5 gap-3.5 max-[1280px]:grid-cols-2 max-[860px]:grid-cols-1">
        {cards.map((card) => {
          const percent = maxStat > 0 ? Math.round((card.stat.value / maxStat) * 100) : 0
          const tone = statTone[card.tone]
          return (
            <article
              key={card.key}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 min-h-[108px] pt-4 px-4 pb-3.5 bg-[#fbfcfe] border border-[#e7eef6] rounded-[22px] shadow-[0_10px_24px_rgba(90,120,170,0.06)] dark:bg-surface dark:border-border dark:shadow-none"
            >
              <span className={cx('size-[42px] grid place-items-center rounded-full', tone.icon)}>
                <HugeiconsIcon icon={card.icon} size={18} />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="m-0 text-[#6b7c8f] text-[0.92rem] font-semibold leading-[1.2] dark:text-text-muted">
                  {card.title}
                </p>
                <strong className="block mt-1.5 text-[#1e3a5f] text-[1.7rem] tracking-[-0.04em] leading-none dark:text-text">
                  {card.stat.value.toLocaleString()}
                </strong>
                <div className="flex flex-wrap items-center gap-1 mt-2 text-[#93a0ae] text-[0.72rem] leading-[1.2]">
                  <b className={cx('font-bold', card.stat.change >= 0 ? 'text-[#16a34a]' : 'text-[#e11d48]')}>
                    {card.stat.change >= 0 ? '↑' : '↓'} {Math.abs(card.stat.change)}%
                  </b>
                  <span>vs. previous 7 days</span>
                </div>
              </div>
              <div
                className="col-span-full h-1.5 mt-3 overflow-hidden rounded-full bg-[#edf2f7] dark:bg-text/10"
                aria-label={`${percent}%`}
              >
                <span
                  className={cx('block h-full rounded-[inherit] transition-[width] duration-[250ms] ease-in-out', tone.bar)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </article>
          )
        })}
      </section>

      <div className="grid grid-cols-[250px_minmax(0,1fr)] gap-4 items-start max-[1280px]:grid-cols-1">
        <aside className={cx(surfaceCard, 'py-4 px-3')}>
          <h3 className="m-0 px-2 pb-2.5 text-[0.95rem]">Activity Timeline</h3>
          <ul className="m-0 p-0 list-none grid gap-1">
            {FILTERS.map((item) => {
              const activeFilter = category === item.key
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={cx(
                      'w-full flex justify-between items-center gap-2 py-[9px] px-2.5 border-0 rounded-[10px] bg-transparent text-text cursor-pointer font-inherit',
                      activeFilter && 'bg-[#eef4ff] dark:bg-blue-500/15',
                    )}
                    onClick={() => applyCategory(item.key)}
                  >
                    <span
                      className={cx(
                        'flex items-center gap-2 text-text-muted',
                        activeFilter && 'text-[#2563eb]',
                      )}
                    >
                      <HugeiconsIcon icon={item.icon} size={16} />
                      {item.label}
                    </span>
                    <b className={cx('text-text-faint text-[0.78rem]', activeFilter && 'text-[#2563eb]')}>
                      {counts[item.key].toLocaleString()}
                    </b>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <section className={cx(surfaceCard, 'p-0 overflow-hidden')}>
          <div className="flex justify-between gap-3 items-center pt-4 px-4 pb-2">
            <div>
              <h3 className="m-0">All Activities</h3>
              <span className="text-text-muted text-[0.8rem]">{items.length.toLocaleString()} events</span>
            </div>
          </div>
          <Spin spinning={loading}>
            {!loading && items.length === 0 ? (
              <div className={adminEmpty}>
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
              <div className="overflow-auto">
                <table className={cx(adminTable, 'min-w-[860px] [&_th]:align-middle [&_th]:whitespace-nowrap [&_th]:text-[0.82rem] [&_td]:align-middle [&_td]:whitespace-nowrap [&_td]:text-[0.82rem]')}>
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
                        className={cx(
                          'cursor-pointer',
                          detailOpen && active?.id === item.id && 'bg-[#f4f8ff] dark:bg-blue-500/15',
                        )}
                        onClick={() => {
                          setActiveId(item.id)
                          setDetailOpen(true)
                        }}
                      >
                        <td>{formatDateTime(item.occurredAt)}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              name={item.user?.fullName || 'System'}
                              photoUrl={item.user?.photoUrl}
                              className={cx(
                                'size-[34px] overflow-hidden grid place-items-center rounded-full text-[0.7rem] font-bold [&_img]:size-full [&_img]:object-cover',
                                avatarToneClass[avatarTone(item.user?.fullName || 'System')],
                              )}
                            />
                            <div>
                              <strong className="block text-[0.84rem]">{item.user?.fullName || 'System'}</strong>
                              <small className="text-text-faint text-[0.72rem]">{item.user?.roleName || 'System'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={cx(ahPill, actionPillClass(item.action, item.category))}>
                            {item.action}
                          </span>
                        </td>
                        <td>{item.module}</td>
                        <td className="max-w-[280px] overflow-hidden text-ellipsis">{item.details}</td>
                        <td>{item.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Spin>
          <div className="flex justify-between items-center gap-3 pt-3 px-4 pb-4">
            <div className="flex gap-1.5">
              {pageItems(safePage, totalPages).map((item, index) =>
                item === 'ellipsis' ? (
                  <span key={`e-${index}`} className="min-w-8 h-8 grid place-items-center text-text-muted font-semibold">
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

      {detailOpen && active ? (
        <div
          className={modalBackdrop}
          onClick={() => {
            setDetailOpen(false)
            setActiveId(null)
          }}
        >
          <div
            className={cx(modalPanel, 'w-[min(100%,640px)] py-[18px] px-[18px] pb-5')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={modalHeader}>
              <h3 className="m-0 flex-1">Activity Detail</h3>
              <button
                type="button"
                className={modalClose}
                aria-label="Close"
                onClick={() => {
                  setDetailOpen(false)
                  setActiveId(null)
                }}
              >
                ×
              </button>
            </div>
            <div className="grid content-start gap-3.5">
              <div className="flex justify-between gap-2.5 items-start">
                <p className="m-0 mt-1 text-text-muted text-[0.8rem]">
                  {formatDateTime(active.occurredAt)} · {active.user?.fullName || 'System'}
                </p>
                <span className="py-1 px-2.5 rounded-full bg-[#e7f8ef] text-[#15803d] text-[0.72rem] font-bold">
                  {active.status}
                </span>
              </div>
              <div>
                <span className={cx(ahPill, actionPillClass(active.action, active.category))}>
                  {active.action} Activity
                </span>
                <h4 className="mt-2 mb-0">
                  {active.user?.fullName || 'System'}
                  {active.user?.roleName ? (
                    <small className="text-text-muted font-medium"> ({active.user.roleName})</small>
                  ) : null}
                </h4>
              </div>
              <dl className="m-0 grid gap-2.5">
                <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-[0.84rem]">
                  <dt className="m-0 text-text-muted">Module</dt>
                  <dd className="m-0 font-semibold">{active.module}</dd>
                </div>
                {active.relatedName ? (
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-[0.84rem]">
                    <dt className="m-0 text-text-muted">Related To</dt>
                    <dd className="m-0 font-semibold">
                      {active.relatedName}
                      {active.relatedType ? (
                        <small className="text-text-faint font-medium"> ({active.relatedType})</small>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
                {active.durationMin ? (
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-[0.84rem]">
                    <dt className="m-0 text-text-muted">Duration</dt>
                    <dd className="m-0 font-semibold">{active.durationMin} min</dd>
                  </div>
                ) : null}
                {active.outcome ? (
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-[0.84rem]">
                    <dt className="m-0 text-text-muted">Outcome</dt>
                    <dd className="m-0 font-semibold">{active.outcome}</dd>
                  </div>
                ) : null}
                <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-[0.84rem]">
                  <dt className="m-0 text-text-muted">IP Address</dt>
                  <dd className="m-0 font-semibold">{active.ipAddress || '—'}</dd>
                </div>
                <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-[0.84rem]">
                  <dt className="m-0 text-text-muted">Device</dt>
                  <dd className="m-0 font-semibold">{parseDevice(active.userAgent)}</dd>
                </div>
              </dl>
              {related.length ? (
                <>
                  <h4 className="m-0">Related Timeline</h4>
                  <ol className="m-0 p-0 list-none grid gap-3">
                    {related.map((item) => (
                      <li key={item.id} className="grid grid-cols-[14px_minmax(0,1fr)] gap-2.5">
                        <span className="size-2.5 mt-1 rounded-full bg-[#22c55e] shadow-[0_0_0_4px_#dcfce7]" />
                        <div>
                          <strong className="block text-[0.82rem]">{item.details}</strong>
                          <small className="text-text-faint text-[0.72rem]">{formatDateTime(item.occurredAt)}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}
              {canCreate ? (
                <>
                  <h4 className="m-0">Quick Actions</h4>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      className="w-full py-2.5 px-3 border border-border rounded-xl bg-[#f8fafc] text-text text-left font-inherit font-semibold cursor-pointer hover:enabled:bg-[#eef4ff] hover:enabled:border-[#bfdbfe] disabled:opacity-55 disabled:cursor-not-allowed"
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
                      className="w-full py-2.5 px-3 border border-border rounded-xl bg-[#f8fafc] text-text text-left font-inherit font-semibold cursor-pointer hover:enabled:bg-[#eef4ff] hover:enabled:border-[#bfdbfe] disabled:opacity-55 disabled:cursor-not-allowed"
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
        <div className={modalBackdrop} onClick={() => setLogOpen(false)}>
          <div className={modalPanel} onClick={(event) => event.stopPropagation()}>
            <div className={modalHeader}>
              <h3 className="m-0 flex-1">Log {logType === 'CALL' ? 'Call' : 'Message'}</h3>
              <button type="button" className={modalClose} onClick={() => setLogOpen(false)}>
                ×
              </button>
            </div>
            <div className={adminForm}>
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
              <div className="flex justify-end gap-2 mt-3">
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
