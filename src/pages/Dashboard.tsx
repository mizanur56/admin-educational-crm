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
import type { AuthSession } from '../types'
import './Dashboard.css'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

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
  return `lead-status status-${status.toLowerCase().replace(/\s+/g, '-')}`
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
    <svg className="donut-chart" viewBox="0 0 180 180" aria-hidden="true">
      <circle className="donut-track" cx="90" cy="90" r={radius} fill="none" strokeWidth={stroke} />
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
      <text x="90" y="86" textAnchor="middle" className="donut-total">
        {total}
      </text>
      <text x="90" y="106" textAnchor="middle" className="donut-caption">
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
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Lead trend">
      {[0.25, 0.5, 0.75, 1].map((step) => {
        const y = pad.top + innerHeight * (1 - step)
        return (
          <line
            key={step}
            x1={pad.left}
            x2={width - pad.right}
            y1={y}
            y2={y}
            className="chart-grid"
          />
        )
      })}
      <path d={area} className="chart-area" />
      <path d={line} className="chart-line" />
      {coords.map((point) => (
        <circle key={point.label} cx={point.x} cy={point.y} r="4.5" className="chart-dot" />
      ))}
      {coords.map((point) => (
        <text key={`${point.label}-label`} x={point.x} y={height - 8} textAnchor="middle" className="chart-label">
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
    <article className="dash-card calendar-card">
      <div className="card-head">
        <h3>Calendar</h3>
        <strong>{title}</strong>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map((day) => (
          <span key={day} className="calendar-weekday">
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
            <span key={day} className={`calendar-day${isToday ? ' is-today' : ''}`}>
              {day}
              <span className="calendar-dots">
                {marks
                  .filter((mark) => mark !== 'today')
                  .map((mark) => (
                    <i key={mark} className={`dot-${mark}`} />
                  ))}
              </span>
            </span>
          )
        })}
      </div>
      <div className="calendar-legend">
        <span>
          <i className="dot-followup" /> Follow-ups
        </span>
        <span>
          <i className="dot-meeting" /> Meetings
        </span>
        <span>
          <i className="dot-application" /> Applications
        </span>
        <span>
          <i className="dot-payment" /> Payments
        </span>
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
    <section className="home-dashboard">
      <header className="dash-hero">
        <div>
          <h2>
            {greetingForHour(now.getHours())}, {name}{' '}
            <span aria-hidden="true">👋</span>
          </h2>
          <p>Here&apos;s what&apos;s happening with your consultancy today.</p>
        </div>
        <div className="dash-hero-meta">
          <div className="date-chip">
            <Icon name="calendar" />
            <div>
              <strong>{dateLabel}</strong>
              <span>Dhaka, Bangladesh</span>
            </div>
          </div>
          <blockquote>
            <Icon name="quote" />
            <p>“Great things start with a single step.”</p>
          </blockquote>
        </div>
      </header>

      <div className="stat-grid">
        {dashboardStats.map((stat) => (
          <article key={stat.key} className={`stat-card tone-${stat.tone}`}>
            <div className={`stat-icon tone-${stat.tone}`}>
              <Icon name={stat.icon} />
            </div>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <div className={`stat-change ${stat.change >= 0 ? 'up' : 'down'}`}>
              <span>
                {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
              </span>
              <small>vs. last 30 days</small>
            </div>
            <svg className="sparkline" viewBox="0 0 120 28" aria-hidden="true">
              <path d="M0 20 C20 18, 30 22, 45 14 S70 6, 90 12 S110 8, 120 4" />
            </svg>
          </article>
        ))}
      </div>

      <div className="dash-mid">
        <article className="dash-card">
          <div className="card-head">
            <h3>Lead Source Overview</h3>
            <span className="chip">Last 30 Days</span>
          </div>
          <div className="source-layout">
            <DonutChart segments={leadSources} total={leadTotal} />
            <ul className="source-legend">
              {leadSources.map((source) => (
                <li key={source.label}>
                  <span className="legend-left">
                    <i style={{ background: source.color }} />
                    {source.label}
                  </span>
                  <span className="legend-right">
                    <em>{source.percent}%</em>
                    <strong>{source.value}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="dash-card">
          <div className="card-head">
            <h3>Lead Trend</h3>
            <span className="chip">Last 7 Days</span>
          </div>
          <LineChart points={leadTrend} />
        </article>

        <aside className="quick-actions">
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
                className={`action-btn tone-${action.tone}`}
                onClick={() => handleAction(action.label)}
              >
                <span className="action-icon">
                  <Icon name={action.icon} />
                </span>
                <span>
                  <strong>{action.label}</strong>
                  {action.hint ? <small>{action.hint}</small> : null}
                </span>
              </button>
            ),
          )}
        </aside>
      </div>

      <div className="dash-bottom">
        <article className="dash-card">
          <div className="card-head">
            <h3>Recent Leads</h3>
            <button type="button" className="text-link" onClick={() => handleAction('View all leads')}>
              View All
            </button>
          </div>
          <div className="table-wrap">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Country</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.email}>
                    <td>
                      <div className="person">
                        <span className="avatar">{initials(lead.name)}</span>
                        <span>
                          <strong>{lead.name}</strong>
                          <small>{lead.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      {lead.flag} {lead.country}
                    </td>
                    <td>{lead.source}</td>
                    <td>
                      <span className={statusClass(lead.status)}>{lead.status}</span>
                    </td>
                    <td className="muted">{lead.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="dash-card">
          <div className="card-head">
            <h3>Upcoming Follow-ups</h3>
            <button type="button" className="text-link" onClick={() => handleAction('View all follow-ups')}>
              View All
            </button>
          </div>
          <ul className="followup-list">
            {upcomingFollowUps.map((item) => (
              <li key={item.title} className={`followup-item tone-${item.tone}`}>
                <span className={`followup-icon tone-${item.tone}`}>
                  <Icon name={item.icon} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </article>

        <CalendarCard year={now.getFullYear()} month={now.getMonth()} />
      </div>

      <footer className="dash-footer">
        <span>EduConsult CRM &nbsp; v1.0.0</span>
        <span>© {now.getFullYear()} Education Consultancy CRM. All rights reserved.</span>
      </footer>

      {notice ? <p className="dash-toast">{notice}</p> : null}
    </section>
  )
}
