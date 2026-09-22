import { useMemo, useState, type SVGProps } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  calendarEvents,
  dashboardStats,
  leadSources,
  leadTrend,
  quickActions,
  recentLeads,
  upcomingFollowUps,
  type DashIconName,
} from '../data/dashboardDemo'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import PageMeta from '../components/PageMeta'
import type { AuthSession } from '../types'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const card =
  'bg-surface border border-border rounded-[20px] shadow-soft'

const dashCard = `${card} p-4 px-[18px] pb-[18px] max-sm:p-3.5`

const cardHead =
  'flex items-center justify-between gap-3 mb-3 max-sm:flex-wrap'

const chip =
  'px-2.5 py-1.5 rounded-full bg-hover-bg text-text-muted text-[0.75rem]'

const toneIcon: Record<string, string> = {
  blue: 'bg-[#e8f1ff] text-[#3b82f6] dark:bg-blue-500/20 dark:text-[#93c5fd]',
  green: 'bg-[#e7f8ef] text-[#22c55e] dark:bg-green-500/20 dark:text-[#86efac]',
  purple: 'bg-[#eee8ff] text-[#8b5cf6] dark:bg-violet-500/20 dark:text-[#c4b5fd]',
  orange: 'bg-[#fff1e6] text-[#f59e0b] dark:bg-amber-500/20 dark:text-[#fcd34d]',
  rose: 'bg-[#ffe8ee] text-[#f43f5e] dark:bg-rose-500/20 dark:text-[#fda4af]',
}

const sparkStroke: Record<string, string> = {
  blue: 'stroke-[#60a5fa]',
  green: 'stroke-[#34d399]',
  purple: 'stroke-[#a78bfa]',
  orange: 'stroke-[#fb923c]',
  rose: 'stroke-[#fb7185]',
}

const actionBtnTone: Record<string, string> = {
  blue: 'bg-[#eef5ff] dark:bg-blue-500/10',
  green: 'bg-[#eefaf3] dark:bg-green-500/10',
  orange: 'bg-[#fff6eb] dark:bg-amber-500/10',
  purple: 'bg-[#f4efff] dark:bg-violet-500/10',
}

const followupBg: Record<string, string> = {
  rose: 'bg-[#fff5f7] dark:bg-rose-500/10',
  blue: 'bg-[#f4f8ff] dark:bg-blue-500/10',
  purple: 'bg-[#f7f4ff] dark:bg-violet-500/10',
  orange: 'bg-[#fff8f1] dark:bg-amber-500/10',
  green: 'bg-[#f3fbf6] dark:bg-green-500/10',
}

const statusTone: Record<string, string> = {
  new: 'bg-[#e8f1ff] text-[#2563eb] dark:bg-blue-600/20 dark:text-[#93c5fd]',
  contacted: 'bg-[#e7f8ef] text-[#16a34a] dark:bg-green-600/20 dark:text-[#86efac]',
  qualified: 'bg-[#eee8ff] text-[#7c3aed] dark:bg-violet-600/20 dark:text-[#c4b5fd]',
  counselling: 'bg-[#fff1e6] text-[#d97706] dark:bg-amber-600/20 dark:text-[#fcd34d]',
  'follow-up': 'bg-[#ffe8ee] text-[#e11d48] dark:bg-rose-600/20 dark:text-[#fda4af]',
}

const dotTone: Record<string, string> = {
  followup: 'bg-[#f43f5e]',
  meeting: 'bg-[#f59e0b]',
  application: 'bg-[#22c55e]',
  payment: 'bg-[#3b82f6]',
}

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ')
}

function greetingForHour(hour: number) {
  if (hour < 12) {
    return 'Good Morning'
  }

  if (hour < 17) {
    return 'Good Afternoon'
  }

  return 'Good Evening'
}

function displayName(auth: AuthSession | null | undefined) {
  if (auth?.user?.fullName) {
    return auth.user.fullName.split(' ')[0]
  }
  const raw = auth?.user?.username || auth?.user?.email || 'there'
  const first = String(raw).split(/[.@]/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function statusClass(status: string) {
  const key = status.toLowerCase().replace(/\s+/g, '-')
  return cx(
    'inline-flex px-2.5 py-1 rounded-full text-[0.75rem] font-bold',
    statusTone[key] || statusTone.new,
  )
}

function Icon({ name }: { name: DashIconName }) {
  const common: SVGProps<SVGSVGElement> = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'users') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }

  if (name === 'calendar') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    )
  }

  if (name === 'graduate') {
    return (
      <svg {...common}>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c3 2 9 2 12 0v-5" />
      </svg>
    )
  }

  if (name === 'revenue') {
    return (
      <svg {...common}>
        <path d="M12 1v22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  }

  if (name === 'phone') {
    return (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    )
  }

  if (name === 'mail') {
    return (
      <svg {...common}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 7L2 7" />
      </svg>
    )
  }

  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    )
  }

  if (name === 'plus') {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }

  if (name === 'file') {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
      </svg>
    )
  }

  if (name === 'card') {
    return (
      <svg {...common}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    )
  }

  if (name === 'bell') {
    return (
      <svg {...common}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    )
  }

  if (name === 'quote') {
    return (
      <svg {...common} width="16" height="16">
        <path d="M10 8H6l2-5H4L2 10v6h8V8zM22 8h-4l2-5h-4l-2 7v6h8V8z" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  return null
}

type ChartSegment = {
  label: string
  value: number
  color: string
}

function DonutChart({ segments, total }: { segments: ChartSegment[]; total: number }) {
  const radius = 68
  const stroke = 22
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <svg className="w-full h-auto max-[960px]:max-w-[180px] max-[960px]:mx-auto" viewBox="0 0 180 180" aria-hidden="true">
      <circle className="stroke-chart-track" cx="90" cy="90" r={radius} fill="none" strokeWidth={stroke} />
      <g transform="rotate(-90 90 90)">
        {segments.map((segment) => {
          const length = (segment.value / total) * circumference
          const circle = (
            <circle
              key={segment.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
            />
          )
          offset += length
          return circle
        })}
      </g>
      <text x="90" y="86" textAnchor="middle" className="fill-text text-[22px] font-bold">
        {total}
      </text>
      <text x="90" y="106" textAnchor="middle" className="fill-text-faint text-[10px]">
        Total Leads
      </text>
    </svg>
  )
}

type TrendPoint = { label: string; value: number }

function LineChart({ points }: { points: TrendPoint[] }) {
  const width = 420
  const height = 180
  const pad = { top: 16, right: 12, bottom: 28, left: 28 }
  const max = Math.max(...points.map((point) => point.value), 80)
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom

  const coords = points.map((point, index) => {
    const x = pad.left + (index / (points.length - 1)) * innerWidth
    const y = pad.top + innerHeight - (point.value / max) * innerHeight
    return { ...point, x, y }
  })

  const last = coords[coords.length - 1]
  const first = coords[0]
  const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
  const area = last && first ? `${line} L${last.x},${height - pad.bottom} L${first.x},${height - pad.bottom} Z` : ''

  return (
    <svg className="w-full h-auto" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Lead trend">
      {[0.25, 0.5, 0.75, 1].map((step) => {
        const y = pad.top + innerHeight * (1 - step)
        return (
          <line
            key={step}
            x1={pad.left}
            x2={width - pad.right}
            y1={y}
            y2={y}
            className="stroke-chart-track"
            strokeWidth={1}
          />
        )
      })}
      <path d={area} className="fill-blue-500/10" />
      <path d={line} className="fill-none stroke-[#3b82f6]" strokeWidth={2.5} />
      {coords.map((point) => (
        <circle
          key={point.label}
          cx={point.x}
          cy={point.y}
          r="4.5"
          className="fill-surface stroke-[#3b82f6]"
          strokeWidth={2.5}
        />
      ))}
      {coords.map((point) => (
        <text
          key={`${point.label}-label`}
          x={point.x}
          y={height - 8}
          textAnchor="middle"
          className="fill-text-faint text-[10px]"
        >
          {point.label}
        </text>
      ))}
    </svg>
  )
}

function CalendarCard({ year, month }: { year: number; month: number }) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const title = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  )
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)] as Array<
    number | null
  >

  return (
    <article className={cx(dashCard, 'max-[1280px]:col-span-full max-[960px]:col-auto')}>
      <div className={cardHead}>
        <h3 className="m-0 text-base">Calendar</h3>
        <strong>{title}</strong>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-[0.75rem] text-text-faint font-semibold">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} />
          }

          const marks = calendarEvents[day] || []
          const isToday =
            today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

          return (
            <span
              key={day}
              className={cx(
                'relative min-h-[34px] grid place-items-start justify-items-center pt-1.5 rounded-[10px] text-[0.75rem] text-text',
                isToday && 'bg-[#3b82f6] text-white',
              )}
            >
              {day}
              <span className="flex justify-center gap-[3px] min-h-2">
                {marks
                  .filter((mark) => mark !== 'today')
                  .map((mark) => (
                    <i
                      key={mark}
                      className={cx(
                        'inline-block size-1.5 rounded-full',
                        isToday ? 'bg-white' : dotTone[mark] || 'bg-[#3b82f6]',
                      )}
                    />
                  ))}
              </span>
            </span>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2.5 mt-3 text-text-muted text-[0.72rem]">
        {(
          [
            ['followup', 'Follow-ups'],
            ['meeting', 'Meetings'],
            ['application', 'Applications'],
            ['payment', 'Payments'],
          ] as const
        ).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <i className={cx('inline-block size-1.5 rounded-full', dotTone[key])} /> {label}
          </span>
        ))}
      </div>
    </article>
  )
}

export default function Dashboard() {
  const auth = useOutletContext<AuthSession>()
  const now = useMemo(() => new Date(), [])
  const [notice, setNotice] = useState('')
  const name = displayName(auth)
  const leadTotal = leadSources.reduce((sum, source) => sum + source.value, 0)
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now)

  function handleAction(label: string) {
    setNotice(`${label} is demo-only for now.`)
    window.setTimeout(() => setNotice(''), 2400)
  }

  return (
    <section className="grid gap-[18px] min-w-0 text-text max-sm:gap-3.5">
      <PageMeta
        title="Dashboard"
        description="Here's what's happening with your consultancy today."
      />
      <PageHeader
        title={`${greetingForHour(now.getHours())}, ${name}`}
        subtitle="Here's what's happening with your consultancy today."
        breadcrumbs={[{ title: 'Dashboard' }]}
        extra={
          <div className="flex flex-wrap gap-3 max-[960px]:w-full">
            <div className="m-0 flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-soft">
              <Icon name="calendar" />
              <div>
                <strong className="block text-[0.9rem]">{dateLabel}</strong>
                <span className="block text-[0.78rem] text-text-muted">Dhaka, Bangladesh</span>
              </div>
            </div>
            <blockquote className="m-0 flex max-w-[240px] items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-[#5b8def] shadow-soft max-[960px]:max-w-none max-[960px]:flex-[1_1_180px]">
              <Icon name="quote" />
              <p className="m-0 text-[0.78rem] text-[#5b8def] italic">“Great things start with a single step.”</p>
            </blockquote>
          </div>
        }
      />

      <div className="grid grid-cols-5 gap-3.5 max-[1280px]:grid-cols-3 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
        {dashboardStats.map((stat) => (
          <article key={stat.key} className={cx(card, 'relative overflow-hidden pt-4 px-4 pb-3')}>
            <div className={cx('size-[42px] grid place-items-center rounded-xl', toneIcon[stat.tone])}>
              <Icon name={stat.icon} />
            </div>
            <p className="mt-2.5 mb-0.5 text-text-muted text-[0.82rem]">{stat.label}</p>
            <strong className="text-[1.55rem] tracking-[-0.03em] max-sm:text-[1.35rem]">{stat.value}</strong>
            <div className="flex items-center gap-2 mt-1.5 text-[0.75rem]">
              <span className={stat.change >= 0 ? 'text-[#16a34a]' : 'text-[#e11d48]'}>
                {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
              </span>
              <small className="text-text-faint">vs. last 30 days</small>
            </div>
            <svg
              className={cx(
                'absolute right-2.5 bottom-2 w-[92px] h-7 max-sm:hidden',
                sparkStroke[stat.tone],
              )}
              viewBox="0 0 120 28"
              aria-hidden="true"
            >
              <path
                d="M0 20 C20 18, 30 22, 45 14 S70 6, 90 12 S110 8, 120 4"
                className="fill-none"
                strokeWidth={2}
              />
            </svg>
          </article>
        ))}
      </div>

      <div className="grid gap-3.5 grid-cols-[1.15fr_1.2fr_0.75fr] max-[1280px]:grid-cols-2 max-[960px]:grid-cols-1">
        <article className={dashCard}>
          <div className={cardHead}>
            <h3 className="m-0 text-base">Lead Source Overview</h3>
            <span className={chip}>Last 30 Days</span>
          </div>
          <div className="grid grid-cols-[170px_1fr] gap-3 items-center max-[1100px]:grid-cols-[140px_1fr] max-[960px]:grid-cols-1">
            <DonutChart segments={leadSources} total={leadTotal} />
            <ul className="list-none m-0 p-0 grid gap-2">
              {leadSources.map((source) => (
                <li key={source.label} className="flex justify-between gap-2.5 text-[0.85rem]">
                  <span className="flex items-center gap-2">
                    <i className="size-2 rounded-full" style={{ background: source.color }} />
                    {source.label}
                  </span>
                  <span className="flex items-center gap-2">
                    <em className="text-text-faint not-italic min-w-8">{source.percent}%</em>
                    <strong className="min-w-6 text-right">{source.value}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className={dashCard}>
          <div className={cardHead}>
            <h3 className="m-0 text-base">Lead Trend</h3>
            <span className={chip}>Last 7 Days</span>
          </div>
          <LineChart points={leadTrend} />
        </article>

        <aside className="grid gap-2.5 max-[1280px]:col-span-full max-[960px]:col-auto">
          {quickActions.map((action) =>
            action.tone === 'primary' ? (
              <Button
                key={action.label}
                icon={<Icon name={action.icon} />}
                fullWidth
                onClick={() => handleAction(action.label)}
              >
                {action.label}
              </Button>
            ) : (
              <button
                key={action.label}
                type="button"
                className={cx(
                  'flex items-center gap-3 w-full py-3 px-3.5 border-0 rounded-[14px] text-left text-text cursor-pointer shadow-soft',
                  actionBtnTone[action.tone] || 'bg-surface',
                )}
                onClick={() => handleAction(action.label)}
              >
                <span
                  className={cx(
                    'size-9 grid place-items-center rounded-[10px]',
                    toneIcon[action.tone],
                  )}
                >
                  <Icon name={action.icon} />
                </span>
                <span className="grid">
                  <strong>{action.label}</strong>
                  {action.hint ? <small className="text-text-muted">{action.hint}</small> : null}
                </span>
              </button>
            ),
          )}
        </aside>
      </div>

      <div className="grid gap-3.5 grid-cols-[1.35fr_1fr_0.85fr] max-[1280px]:grid-cols-2 max-[960px]:grid-cols-1">
        <article className={dashCard}>
          <div className={cardHead}>
            <h3 className="m-0 text-base">Recent Leads</h3>
            <button
              type="button"
              className="border-0 bg-transparent text-[#3b82f6] font-semibold cursor-pointer"
              onClick={() => handleAction('View all leads')}
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr>
                  <th className="py-2 px-1.5 text-text-faint text-[0.75rem] font-semibold text-left">Name</th>
                  <th className="py-2 px-1.5 text-text-faint text-[0.75rem] font-semibold text-left">Country</th>
                  <th className="py-2 px-1.5 text-text-faint text-[0.75rem] font-semibold text-left">Source</th>
                  <th className="py-2 px-1.5 text-text-faint text-[0.75rem] font-semibold text-left">Status</th>
                  <th className="py-2 px-1.5 text-text-faint text-[0.75rem] font-semibold text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.email}>
                    <td className="py-2.5 px-1.5 border-t border-border-subtle text-[0.86rem]">
                      <div className="flex items-center gap-2.5">
                        <span className="size-[34px] grid place-items-center rounded-full bg-[#e8f1ff] text-[#3b82f6] text-[0.72rem] font-bold dark:bg-blue-500/20 dark:text-[#93c5fd]">
                          {initials(lead.name)}
                        </span>
                        <span>
                          <strong className="block">{lead.name}</strong>
                          <small className="block text-text-faint">{lead.email}</small>
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-1.5 border-t border-border-subtle text-[0.86rem]">
                      {lead.flag} {lead.country}
                    </td>
                    <td className="py-2.5 px-1.5 border-t border-border-subtle text-[0.86rem]">{lead.source}</td>
                    <td className="py-2.5 px-1.5 border-t border-border-subtle text-[0.86rem]">
                      <span className={statusClass(lead.status)}>{lead.status}</span>
                    </td>
                    <td className="py-2.5 px-1.5 border-t border-border-subtle text-[0.86rem] text-text-faint">
                      {lead.created}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={dashCard}>
          <div className={cardHead}>
            <h3 className="m-0 text-base">Upcoming Follow-ups</h3>
            <button
              type="button"
              className="border-0 bg-transparent text-[#3b82f6] font-semibold cursor-pointer"
              onClick={() => handleAction('View all follow-ups')}
            >
              View All
            </button>
          </div>
          <ul className="list-none m-0 p-0 grid gap-2.5">
            {upcomingFollowUps.map((item) => (
              <li
                key={item.title}
                className={cx(
                  'flex gap-3 items-start py-2.5 px-3 rounded-[14px] max-sm:p-2.5',
                  followupBg[item.tone] || 'bg-[#f8fbff] dark:bg-blue-500/10',
                )}
              >
                <span
                  className={cx(
                    'size-[34px] grid place-items-center rounded-[10px] shrink-0',
                    toneIcon[item.tone],
                  )}
                >
                  <Icon name={item.icon} />
                </span>
                <span>
                  <strong className="block">{item.title}</strong>
                  <small className="block mt-0.5 text-text-muted text-[0.75rem]">{item.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </article>

        <CalendarCard year={now.getFullYear()} month={now.getMonth()} />
      </div>

      <footer className="flex justify-between gap-3 text-text-faint text-[0.78rem] max-sm:grid max-sm:grid-cols-1">
        <span>EduConsult CRM &nbsp; v1.0.0</span>
        <span>© {now.getFullYear()} Education Consultancy CRM. All rights reserved.</span>
      </footer>

      {notice ? (
        <p className="fixed right-6 bottom-6 m-0 py-3 px-4 rounded-xl bg-[#16324f] text-white shadow-[0_12px_30px_rgba(22,50,79,0.2)] max-sm:left-3 max-sm:right-3 max-sm:bottom-3">
          {notice}
        </p>
      ) : null}
    </section>
  )
}
